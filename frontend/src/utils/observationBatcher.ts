// Add this class to utils/observationBatcher.ts

import fhirClient from './fhirClient';

/**
 * A utility class that batches individual observation creations into 
 * transaction bundles for improved performance
 */
class ObservationBatcher {
  private observations: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private batchSize: number = 10;
  private batchTimeoutMs: number = 200;
  private processing: boolean = false;
  
  // Singleton instance
  private static instance: ObservationBatcher;
  
  private constructor() {}
  
  public static getInstance(): ObservationBatcher {
    if (!ObservationBatcher.instance) {
      ObservationBatcher.instance = new ObservationBatcher();
    }
    return ObservationBatcher.instance;
  }
  
  /**
   * Add an observation to the batch queue and return a promise that resolves
   * when the observation is processed
   */
  public addObservation(observation: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Add the observation and its promise callbacks to the queue
      this.observations.push({
        resource: observation,
        resolve,
        reject
      });
      
      // Schedule or reschedule the batch processing
      this.scheduleBatchProcessing();
      
      // If we've reached the batch size, process immediately
      if (this.observations.length >= this.batchSize) {
        this.processBatch();
      }
    });
  }
  
  /**
   * Schedule a batch processing after a timeout
   */
  private scheduleBatchProcessing() {
    // Clear any existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Set a new timer
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchTimeoutMs);
  }
  
  /**
   * Process the current batch of observations
   */
  private async processBatch() {
    // Prevent concurrent processing
    if (this.processing || this.observations.length === 0) {
      return;
    }
    
    this.processing = true;
    
    // Clear any existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Get the current batch and clear the queue
    const currentBatch = [...this.observations];
    this.observations = [];
    
    try {
      console.log(`Processing batch of ${currentBatch.length} observations`);
      
      // Create a FHIR transaction bundle
      const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: currentBatch.map(item => ({
          resource: item.resource,
          request: {
            method: 'POST',
            url: 'Observation'
          }
        }))
      };
      
      // Send the bundle to the FHIR server
      const response = await fhirClient.batch(bundle);
      
      // Process the response entries
      if (response.data.entry && Array.isArray(response.data.entry)) {
        response.data.entry.forEach((entry: any, index: number) => {
          if (entry.response && entry.response.status && entry.response.status.startsWith('2')) {
            // Success - resolve the promise with the response
            currentBatch[index].resolve(entry);
          } else {
            // Error - reject the promise with the error
            currentBatch[index].reject(new Error(
              entry.response?.outcome?.issue?.[0]?.diagnostics || 
              `Failed to create observation: ${entry.response?.status}`
            ));
          }
        });
      } else {
        // If we don't have a proper response, reject all promises
        currentBatch.forEach(item => {
          item.reject(new Error('Invalid response from FHIR server'));
        });
      }
    } catch (error) {
      // In case of an overall error, reject all promises
      currentBatch.forEach(item => {
        item.reject(error);
      });
    } finally {
      this.processing = false;
      
      // If new observations were added during processing, schedule another batch
      if (this.observations.length > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }
}

export default ObservationBatcher.getInstance();