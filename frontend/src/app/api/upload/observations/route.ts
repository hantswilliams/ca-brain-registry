import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fhirClient from '@/utils/fhirClient';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

// Function to buffer and process a form data file
async function processFormDataFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    // Read the file as ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Read the buffer as Excel with date formatting options
    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: 'array',
      cellDates: true, // This will parse dates as JS Date objects
      dateNF: 'yyyy-mm-dd' // This formats dates in the YYYY-MM-DD format
    });
    
    // Get first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    return worksheet;
  } catch (error) {
    console.error('Error processing form data:', error);
    throw error;
  }
}

// Format date to YYYY-MM-DD
function formatDate(dateValue: any): string {
  // If it's already a string in the right format, return it
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // If it's a Date object, format it
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  
  // If it's a numeric value (Excel date), convert to date and format
  if (typeof dateValue === 'number') {
    // Excel dates are number of days since 1900-01-01 (for Windows)
    // or since 1904-01-01 (for Mac)
    const date = XLSX.SSF.parse_date_code(dateValue);
    const year = date.y;
    // Pad month and day with leading zeros if needed
    const month = String(date.m).padStart(2, '0');
    const day = String(date.d).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // If all else fails, return an empty string
  console.warn(`Invalid date value: ${dateValue}`);
  return '';
}

// Process Excel data directly for observations
function processExcelForObservations(worksheet: XLSX.WorkSheet, patientId: string): any[] {
  const json = XLSX.utils.sheet_to_json(worksheet);
  
  // Map Excel rows to FHIR Observation resources
  return json.map((row: any) => {
    // Format the date properly
    const effectiveDate = formatDate(row.Date);
    
    console.log(`Processing observation: ${row.ObservationName}, Value: ${row.Value} ${row.Unit}, Date: ${row.Date} → ${effectiveDate}`);
    
    const observation = {
      resourceType: 'Observation',
      status: 'final',
      subject: {
        reference: `Patient/${patientId}`
      },
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: row.LoincCode || '8302-2',
          display: row.ObservationName || 'Body Height'
        }]
      },
      effectiveDateTime: effectiveDate ? `${effectiveDate}T00:00:00Z` : new Date().toISOString(),
      valueQuantity: {
        value: row.Value ? parseFloat(row.Value) : 0,
        unit: row.Unit || 'cm',
        system: 'http://unitsofmeasure.org',
        code: row.UnitCode || 'cm'
      }
    };
    
    return observation;
  });
}

// POST /api/upload/observations?patientId=123
export async function POST(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      // Get patient ID from query params
      const patientId = req.nextUrl.searchParams.get('patientId');
      
      if (!patientId) {
        return NextResponse.json(
          { error: 'Patient ID is required' },
          { status: 400 }
        );
      }
      
      // Parse the FormData from the request
      const formData = await req.formData();
      
      // Process the file from FormData
      const worksheet = await processFormDataFile(formData);
      
      // Process worksheet data directly
      const observations = processExcelForObservations(worksheet, patientId);
      
      // Create a FHIR transaction Bundle directly
      const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: observations.map(observation => ({
          resource: observation,
          request: {
            method: 'POST',
            url: 'Observation',
          },
        })),
      };
      
      console.log('Bundle prepared for submission:', JSON.stringify(bundle, null, 2));
      
      // Send bundle to FHIR server
      const response = await fhirClient.batch(bundle);
      
      return NextResponse.json({
        message: 'Observations uploaded successfully',
        count: observations.length,
        result: response.data,
      });
    } catch (error: any) {
      console.error('Observation upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  });
}