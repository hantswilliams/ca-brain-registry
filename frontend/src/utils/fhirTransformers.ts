/**
 * Utility functions for data transformation and validation
 */

// Convert CSV data to FHIR Observation resources
export function csvToObservations(csvData: any[], patientId: string): any[] {
  return csvData.map(row => {
    const observation = {
      resourceType: 'Observation',
      status: 'final',
      subject: {
        reference: `Patient/${patientId}`
      },
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: row.LoincCode || '8302-2',  // Default to body height if not specified
          display: row.ObservationName || 'Body Height'
        }]
      },
      effectiveDateTime: row.Date || new Date().toISOString(),
      valueQuantity: {
        value: parseFloat(row.Value) || 0,
        unit: row.Unit || 'cm',
        system: 'http://unitsofmeasure.org',
        code: row.UnitCode || 'cm'
      }
    };
    
    return observation;
  });
}

// Convert CSV data to FHIR Condition resources
export function csvToConditions(csvData: any[], patientId: string): any[] {
  return csvData.map(row => {
    const condition = {
      resourceType: 'Condition',
      subject: {
        reference: `Patient/${patientId}`
      },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: row.Status?.toLowerCase() === 'resolved' ? 'resolved' : 'active',
          display: row.Status || 'Active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
          display: 'Problem List Item'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: row.SnomedCode || '396275006',  // Default to Osteoarthritis if not specified
          display: row.ConditionName || 'Osteoarthritis'
        }]
      },
      onsetDateTime: row.OnsetDate || new Date().toISOString()
    };
    
    return condition;
  });
}

// Convert CSV data to FHIR Procedure resources
export function csvToProcedures(csvData: any[], patientId: string): any[] {
  return csvData.map(row => {
    const procedure = {
      resourceType: 'Procedure',
      subject: {
        reference: `Patient/${patientId}`
      },
      status: row.Status?.toLowerCase() || 'completed',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: row.SnomedCode || '387713003',  // Default to surgical procedure if not specified
          display: row.ProcedureName || 'Surgical procedure'
        }]
      },
      performedDateTime: row.PerformedDate || new Date().toISOString(),
      bodySite: row.BodySite ? [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '12738006',  // Brain structure
          display: row.BodySite
        }]
      }] : undefined,
      note: row.Notes ? [{
        text: row.Notes
      }] : undefined
    };
    
    return procedure;
  });
}

// Validate a Patient resource
export function validatePatient(patient: any): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!patient.name || patient.name.length === 0) {
    errors.push('Patient must have a name');
  } else {
    const name = patient.name[0];
    if (!name.family || name.family.trim() === '') {
      errors.push('Patient must have a family name');
    }
    if (!name.given || name.given.length === 0 || name.given[0].trim() === '') {
      errors.push('Patient must have a given name');
    }
  }
  
  // Validate gender
  if (patient.gender && !['male', 'female', 'other', 'unknown'].includes(patient.gender)) {
    errors.push('Gender must be one of: male, female, other, unknown');
  }
  
  // Validate birthDate format (YYYY-MM-DD)
  if (patient.birthDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(patient.birthDate)) {
      errors.push('Birth date must be in YYYY-MM-DD format');
    }
  }
  
  return errors;
}

// Create a FHIR Bundle for batch operations
export function createBundle(resources: any[], type: 'batch' | 'transaction' = 'transaction'): any {
  return {
    resourceType: 'Bundle',
    type,
    entry: resources.map(resource => ({
      resource,
      request: {
        method: 'POST',
        url: resource.resourceType
      }
    }))
  };
}