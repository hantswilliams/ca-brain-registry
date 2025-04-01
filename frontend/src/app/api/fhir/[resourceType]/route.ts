import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import fhirClient from '@/utils/fhirClient';
import observationBatcher from '@/utils/observationBatcher';

// GET /api/fhir/[resourceType]
export async function GET(
  req: NextRequest,
  { params }: { params: { resourceType: string } }
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const resourceType = params.resourceType;
        const searchParams = Object.fromEntries(req.nextUrl.searchParams);
        
        console.log(`Fetching ${resourceType} with params:`, searchParams);
        
        // Forward the request to the FHIR server
        const response = await fhirClient.search(resourceType, searchParams);
        
        return NextResponse.json(response.data);
      } catch (error: any) {
        console.error(`FHIR GET Error for ${params.resourceType}:`, error.message);
        return NextResponse.json(
          { error: error.response?.data || error.message },
          { status: error.response?.status || 500 }
        );
      }
    });
  }
  
  return handleRequest();
}

// POST /api/fhir/[resourceType]
export async function POST(
  req: NextRequest,
  { params }: { params: { resourceType: string } }
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const resourceType = params.resourceType;
        
        // Check for appropriate role for write operations
        if (authReq.user.role === 'guest') {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
        
        const body = await req.json();
        
        // For Observation resources, use the batcher for better performance
        if (resourceType === 'Observation') {
          try {
            const response = await observationBatcher.addObservation(body);
            return NextResponse.json(response);
          } catch (error: any) {
            console.error('FHIR Observation Batch Error:', error.message);
            return NextResponse.json(
              { error: error.message },
              { status: error.status || 500 }
            );
          }
        } else {
          // For other resource types, use direct creation
          const response = await fhirClient.create(resourceType, body);
          return NextResponse.json(response.data);
        }
      } catch (error: any) {
        console.error('FHIR POST Error:', error.message);
        return NextResponse.json(
          { error: error.response?.data || error.message },
          { status: error.response?.status || 500 }
        );
      }
    });
  }
  
  return handleRequest();
}