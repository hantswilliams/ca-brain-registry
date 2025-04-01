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

// Process Excel data and convert to FHIR resources
function processExcelForPatient(worksheet: XLSX.WorkSheet): any[] {
  const json = XLSX.utils.sheet_to_json(worksheet);
  
  // Map Excel rows to FHIR Patient resources
  return json.map((row: any) => {
    // Format the birth date properly
    const birthDate = formatDate(row.DateOfBirth);
    
    console.log(`Processing patient: ${row.FirstName} ${row.LastName}, DOB: ${row.DateOfBirth} → ${birthDate}`);
    
    const patient = {
      resourceType: 'Patient',
      name: [{
        family: row.LastName || '',
        given: [row.FirstName || ''],
      }],
      gender: row.Gender?.toLowerCase() || 'unknown',
      birthDate: birthDate,
      identifier: [{
        system: 'http://example.org/fhir/ids/mrn',
        value: row.MRN || '',
      }],
      address: row.Address ? [{
        line: [row.Address],
        city: row.City || '',
        state: row.State || '',
        postalCode: row.ZipCode || '',
      }] : [],
      telecom: row.Phone ? [{
        system: 'phone',
        value: row.Phone,
      }] : [],
      // Add more fields as needed
    };
    
    return patient;
  });
}

// POST /api/upload/patients
export async function POST(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      // Parse the FormData from the request
      const formData = await req.formData();
      
      // Process the file from FormData
      const worksheet = await processFormDataFile(formData);
      
      // Process worksheet data into FHIR resources
      const patients = processExcelForPatient(worksheet);
      
      // Create a FHIR transaction Bundle
      const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: patients.map(patient => ({
          resource: patient,
          request: {
            method: 'POST',
            url: 'Patient',
          },
        })),
      };
      
      console.log('Bundle prepared for submission:', JSON.stringify(bundle, null, 2));
      
      // Send bundle to FHIR server
      const response = await fhirClient.batch(bundle);
      
      return NextResponse.json({
        message: 'File processed successfully',
        patientsCreated: patients.length,
        result: response.data,
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  });
}