import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

// GET /api/valuesets/procedures
export async function GET(
  req: NextRequest
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Return common medical procedures with SNOMED CT codes
        const procedures = [
          {
            code: "116004",
            display: "MRI of brain",
            system: "http://snomed.info/sct"
          },
          {
            code: "429887008",
            display: "CT scan of brain",
            system: "http://snomed.info/sct"
          },
          {
            code: "118433006",
            display: "Lumbar puncture",
            system: "http://snomed.info/sct"
          },
          {
            code: "117015009",
            display: "Craniotomy",
            system: "http://snomed.info/sct"
          },
          {
            code: "61531001",
            display: "Stereotactic biopsy of brain",
            system: "http://snomed.info/sct"
          },
          {
            code: "308761002",
            display: "Tumor resection",
            system: "http://snomed.info/sct"
          },
          {
            code: "10847001",
            display: "Chemotherapy",
            system: "http://snomed.info/sct"
          },
          {
            code: "33195004",
            display: "Radiation therapy",
            system: "http://snomed.info/sct"
          },
          {
            code: "73761001",
            display: "Ventriculoperitoneal shunt",
            system: "http://snomed.info/sct"
          },
          {
            code: "36125001",
            display: "Placement of external ventricular drain",
            system: "http://snomed.info/sct"
          },
          {
            code: "16678009",
            display: "EEG monitoring",
            system: "http://snomed.info/sct"
          },
          {
            code: "165303001",
            display: "PET scan of brain",
            system: "http://snomed.info/sct"
          },
          {
            code: "168401007",
            display: "Brain angiography",
            system: "http://snomed.info/sct"
          },
          {
            code: "787139001",
            display: "Awake brain surgery",
            system: "http://snomed.info/sct"
          },
          {
            code: "86554001",
            display: "Gamma knife radiosurgery",
            system: "http://snomed.info/sct"
          }
        ];
        
        return NextResponse.json(procedures);
      } catch (error: any) {
        console.error('Error retrieving procedures:', error.message);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    });
  }
  
  return handleRequest();
}