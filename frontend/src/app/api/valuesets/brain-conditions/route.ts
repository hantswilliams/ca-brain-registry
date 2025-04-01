import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

// GET /api/valuesets/brain-conditions
export async function GET(
  req: NextRequest
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Return common brain conditions with SNOMED CT codes
        const conditions = [
          {
            code: "230690007",
            display: "Cerebrovascular accident (stroke)",
            system: "http://snomed.info/sct"
          },
          {
            code: "35489007",
            display: "Depressive disorder",
            system: "http://snomed.info/sct"
          },
          {
            code: "84757009",
            display: "Epilepsy",
            system: "http://snomed.info/sct"
          },
          {
            code: "85005007",
            display: "Dementia",
            system: "http://snomed.info/sct"
          },
          {
            code: "422504002",
            display: "Ischemic stroke",
            system: "http://snomed.info/sct"
          },
          {
            code: "21920009",
            display: "Cerebral palsy",
            system: "http://snomed.info/sct"
          },
          {
            code: "128216005",
            display: "Traumatic brain injury",
            system: "http://snomed.info/sct"
          },
          {
            code: "26929004",
            display: "Alzheimer's disease",
            system: "http://snomed.info/sct"
          },
          {
            code: "49049000",
            display: "Parkinson's disease",
            system: "http://snomed.info/sct"
          },
          {
            code: "56267009",
            display: "Multi-infarct dementia",
            system: "http://snomed.info/sct"
          },
          {
            code: "52448006",
            display: "Dementia of Alzheimer's type",
            system: "http://snomed.info/sct"
          },
          {
            code: "127294003",
            display: "Chronic traumatic encephalopathy",
            system: "http://snomed.info/sct"
          },
          {
            code: "2548008",
            display: "Brain concussion",
            system: "http://snomed.info/sct"
          },
          {
            code: "73430006",
            display: "Sleep apnea",
            system: "http://snomed.info/sct"
          },
          {
            code: "40095003",
            display: "Migraine",
            system: "http://snomed.info/sct"
          }
        ];
        
        return NextResponse.json(conditions);
      } catch (error: any) {
        console.error('Error retrieving brain conditions:', error.message);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    });
  }
  
  return handleRequest();
}