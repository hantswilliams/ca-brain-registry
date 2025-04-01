import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import fhirClient from '@/utils/fhirClient';

// GET /api/fhir/[resourceType]/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { resourceType: string; id: string } }
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { resourceType, id } = params;
        const searchParams = Object.fromEntries(req.nextUrl.searchParams);
        
        console.log(`Fetching ${resourceType}/${id} with params:`, searchParams);
        
        // Forward the request to the FHIR server
        const response = await fhirClient.get(resourceType, id, searchParams);
        return NextResponse.json(response.data);
      } catch (error: any) {
        console.error(`FHIR GET Error for ${params.resourceType}/${params.id}:`, error.message);
        return NextResponse.json(
          { error: error.response?.data || error.message },
          { status: error.response?.status || 500 }
        );
      }
    });
  }
  
  return handleRequest();
}

// PUT /api/fhir/[resourceType]/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { resourceType: string; id: string } }
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { resourceType, id } = params;
        
        // Check for appropriate role for write operations
        if (authReq.user.role === 'guest') {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
        
        const body = await req.json();
        
        const response = await fhirClient.update(resourceType, id, body);
        return NextResponse.json(response.data);
      } catch (error: any) {
        console.error(`FHIR PUT Error for ${params.resourceType}/${params.id}:`, error.message);
        return NextResponse.json(
          { error: error.response?.data || error.message },
          { status: error.response?.status || 500 }
        );
      }
    });
  }
  
  return handleRequest();
}

// DELETE /api/fhir/[resourceType]/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { resourceType: string; id: string } }
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { resourceType, id } = params;
        
        // Check for appropriate role for delete operations
        if (authReq.user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Only administrators can delete resources' },
            { status: 403 }
          );
        }
        
        const response = await fhirClient.delete(resourceType, id);
        return NextResponse.json(response.data);
      } catch (error: any) {
        console.error(`FHIR DELETE Error for ${params.resourceType}/${params.id}:`, error.message);
        return NextResponse.json(
          { error: error.response?.data || error.message },
          { status: error.response?.status || 500 }
        );
      }
    });
  }
  
  return handleRequest();
}