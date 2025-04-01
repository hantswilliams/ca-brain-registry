import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

// GET /api/valuesets/brain-cancer-observations
export async function GET(
  req: NextRequest
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Return fixed brain cancer observation definitions including their value sets
        const observations = [
          {
            code: "tumor-size",
            display: "Tumor Size",
            unit: "mm",
            valueType: "quantity",
            description: "Size of the tumor in millimeters"
          },
          {
            code: "who-grade",
            display: "WHO Grade",
            valueType: "codeable-concept",
            valueSet: [
              { code: "1", display: "Grade I" },
              { code: "2", display: "Grade II" },
              { code: "3", display: "Grade III" },
              { code: "4", display: "Grade IV" }
            ],
            description: "World Health Organization (WHO) tumor grade"
          },
          {
            code: "idh-mutation",
            display: "IDH Mutation Status",
            valueType: "codeable-concept",
            valueSet: [
              { code: "positive", display: "Positive" },
              { code: "negative", display: "Negative" },
              { code: "indeterminate", display: "Indeterminate" }
            ],
            description: "Isocitrate dehydrogenase (IDH) mutation status"
          },
          {
            code: "mgmt-methylation",
            display: "MGMT Promoter Methylation",
            valueType: "codeable-concept",
            valueSet: [
              { code: "methylated", display: "Methylated" },
              { code: "unmethylated", display: "Unmethylated" },
              { code: "indeterminate", display: "Indeterminate" }
            ],
            description: "O6-methylguanine-DNA methyltransferase (MGMT) promoter methylation status"
          },
          {
            code: "ki67-index",
            display: "Ki-67 Proliferation Index",
            unit: "%",
            valueType: "quantity", 
            description: "Ki-67 protein marker indicating cell proliferation"
          },
          {
            code: "1p19q-codeletion",
            display: "1p/19q Codeletion",
            valueType: "codeable-concept",
            valueSet: [
              { code: "present", display: "Present" },
              { code: "absent", display: "Absent" },
              { code: "indeterminate", display: "Indeterminate" }
            ],
            description: "Chromosomal deletion status associated with oligodendrogliomas"
          },
          {
            code: "tumor-location",
            display: "Tumor Location",
            valueType: "codeable-concept",
            valueSet: [
              { code: "frontal-lobe", display: "Frontal Lobe" },
              { code: "temporal-lobe", display: "Temporal Lobe" },
              { code: "parietal-lobe", display: "Parietal Lobe" },
              { code: "occipital-lobe", display: "Occipital Lobe" },
              { code: "cerebellum", display: "Cerebellum" },
              { code: "brainstem", display: "Brainstem" },
              { code: "thalamus", display: "Thalamus" },
              { code: "basal-ganglia", display: "Basal Ganglia" },
              { code: "ventricle", display: "Ventricle" },
              { code: "multiple", display: "Multiple Locations" }
            ],
            description: "Anatomical location of brain tumor"
          }
        ];
        
        return NextResponse.json(observations);
      } catch (error: any) {
        console.error('Error retrieving brain cancer observations:', error.message);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    });
  }
  
  return handleRequest();
}