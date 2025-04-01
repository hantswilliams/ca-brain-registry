import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

// GET /api/valuesets/brain-cancer-diagnoses
export async function GET(
  req: NextRequest
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Return fixed brain cancer diagnoses options
        const diagnoses = [
          {
            code: "glioblastoma",
            display: "Glioblastoma (GBM)",
            description: "WHO grade IV astrocytic tumor, most aggressive form of brain cancer"
          },
          {
            code: "astrocytoma",
            display: "Astrocytoma",
            description: "Tumor that develops from astrocytes"
          },
          {
            code: "oligodendroglioma",
            display: "Oligodendroglioma",
            description: "Slow-growing tumor that develops from oligodendrocytes"
          },
          {
            code: "meningioma",
            display: "Meningioma",
            description: "Tumor that forms on membranes covering the brain and spinal cord"
          },
          {
            code: "ependymoma",
            display: "Ependymoma",
            description: "Tumor that forms from ependymal cells in the brain and spinal cord"
          },
          {
            code: "medulloblastoma",
            display: "Medulloblastoma",
            description: "Fast-growing, high-grade tumor that develops in the cerebellum"
          },
          {
            code: "craniopharyngioma",
            display: "Craniopharyngioma",
            description: "Slow-growing tumor near the pituitary gland"
          },
          {
            code: "schwannoma",
            display: "Schwannoma",
            description: "Tumor that forms on the nerve that connects the brain to the inner ear"
          },
          {
            code: "pituitary-adenoma",
            display: "Pituitary Adenoma",
            description: "Tumor that develops in the pituitary gland"
          },
          {
            code: "diffuse-midline-glioma",
            display: "Diffuse Midline Glioma",
            description: "Aggressive, infiltrative type of brain tumor typically found in children"
          }
        ];
        
        return NextResponse.json(diagnoses);
      } catch (error: any) {
        console.error('Error retrieving brain cancer diagnoses:', error.message);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    });
  }
  
  return handleRequest();
}