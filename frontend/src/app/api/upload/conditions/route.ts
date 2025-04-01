import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fhirClient from '@/utils/fhirClient';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { csvToConditions } from '@/utils/fhirTransformers';

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

// Process Excel data directly for conditions
function processExcelForConditions(worksheet: XLSX.WorkSheet, patientId: string): any[] {
  const json = XLSX.utils.sheet_to_json(worksheet);
  
  // Map Excel rows to FHIR Condition resources
  return json.map((row: any) => {
    // Format the onset date properly
    const onsetDate = formatDate(row.OnsetDate);
    
    console.log(`Processing condition: ${row.ConditionName}, Code: ${row.SnomedCode}, Status: ${row.Status}, Onset: ${row.OnsetDate} → ${onsetDate}`);
    
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
      onsetDateTime: onsetDate ? `${onsetDate}T00:00:00Z` : new Date().toISOString(),
      note: row.Notes ? [{ text: row.Notes }] : undefined
    };
    
    return condition;
  });
}

// POST /api/upload/conditions?patientId=123
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
      const conditions = processExcelForConditions(worksheet, patientId);
      
      // Create a FHIR transaction Bundle directly
      const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: conditions.map(condition => ({
          resource: condition,
          request: {
            method: 'POST',
            url: 'Condition',
          },
        })),
      };
      
      console.log('Bundle prepared for submission:', JSON.stringify(bundle, null, 2));
      
      // Send bundle to FHIR server
      const response = await fhirClient.batch(bundle);
      
      return NextResponse.json({
        message: 'Conditions uploaded successfully',
        count: conditions.length,
        result: response.data,
      });
    } catch (error: any) {
      console.error('Condition upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  });
}