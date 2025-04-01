import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

// Define units map to be exported for reference by other parts of the application
export const UNITS_MAP: Record<string, string[]> = {
  "8480-6": ["mmHg"],
  "8462-4": ["mmHg"],
  "8867-4": ["beats/min", "bpm"],
  "9279-1": ["breaths/min"],
  "8310-5": ["°C", "°F"],
  "29463-7": ["kg", "lb"],
  "39156-5": ["kg/m²"],
  "85354-9": ["mg/dL", "mmol/L"],
  "8302-2": ["cm", "in"],
  "55284-4": ["%"]
};

// GET /api/valuesets/common-observations
export async function GET(
  req: NextRequest
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Return common clinical observations with LOINC codes
        const observations = [
          {
            code: "8480-6",
            system: "http://loinc.org",
            display: "Blood Pressure (Systolic)", 
            units: UNITS_MAP["8480-6"],
            valueType: "quantity"
          },
          {
            code: "8462-4",
            system: "http://loinc.org",
            display: "Blood Pressure (Diastolic)",
            units: UNITS_MAP["8462-4"],
            valueType: "quantity"
          },
          {
            code: "8867-4",
            system: "http://loinc.org",
            display: "Heart Rate",
            units: UNITS_MAP["8867-4"],
            valueType: "quantity"
          },
          {
            code: "9279-1", 
            system: "http://loinc.org",
            display: "Respiratory Rate",
            units: UNITS_MAP["9279-1"],
            valueType: "quantity"
          },
          {
            code: "8310-5",
            system: "http://loinc.org", 
            display: "Body Temperature",
            units: UNITS_MAP["8310-5"],
            valueType: "quantity"
          },
          {
            code: "29463-7",
            system: "http://loinc.org",
            display: "Body Weight",
            units: UNITS_MAP["29463-7"],
            valueType: "quantity"
          },
          {
            code: "39156-5",
            system: "http://loinc.org",
            display: "Body Mass Index",
            units: UNITS_MAP["39156-5"],
            valueType: "quantity"
          },
          {
            code: "85354-9",
            system: "http://loinc.org",
            display: "Blood Glucose",
            units: UNITS_MAP["85354-9"],
            valueType: "quantity"
          },
          {
            code: "8302-2",
            system: "http://loinc.org",
            display: "Body Height",
            units: UNITS_MAP["8302-2"],
            valueType: "quantity"
          },
          {
            code: "55284-4",
            system: "http://loinc.org",
            display: "Blood Oxygen",
            units: UNITS_MAP["55284-4"],
            valueType: "quantity"
          },
          {
            code: "custom",
            system: "http://example.org/custom-observations",
            display: "Custom Observation...",
            units: [],
            valueType: "various"
          }
        ];
        
        return NextResponse.json(observations);
      } catch (error: any) {
        console.error('Error retrieving common observations:', error.message);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    });
  }
  
  return handleRequest();
}