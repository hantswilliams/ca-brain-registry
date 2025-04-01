import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

// Define our value sets for the brain cancer registry
const brainCancerValueSets = {
  // Tumor WHO grades (2021 WHO Classification)
  whoGrades: [
    { code: "1", display: "WHO Grade 1", description: "Typically slow growing, benign tumors" },
    { code: "2", display: "WHO Grade 2", description: "Relatively slow-growing, but may recur as higher grade" },
    { code: "3", display: "WHO Grade 3", description: "Malignant tumors that grow more rapidly" },
    { code: "4", display: "WHO Grade 4", description: "Rapidly growing and highly malignant tumors" }
  ],
  
  // Brain tumor types based on WHO classification
  tumorTypes: [
    { code: "glioblastoma", display: "Glioblastoma", description: "WHO grade 4 glioma" },
    { code: "diffuse-astrocytoma", display: "Diffuse Astrocytoma", description: "WHO grade 2 glioma" },
    { code: "anaplastic-astrocytoma", display: "Anaplastic Astrocytoma", description: "WHO grade 3 glioma" },
    { code: "oligodendroglioma", display: "Oligodendroglioma", description: "WHO grade 2 glioma" },
    { code: "anaplastic-oligodendroglioma", display: "Anaplastic Oligodendroglioma", description: "WHO grade 3 glioma" },
    { code: "pilocytic-astrocytoma", display: "Pilocytic Astrocytoma", description: "WHO grade 1 glioma" },
    { code: "ependymoma", display: "Ependymoma", description: "WHO grade 2 or 3 glioma" },
    { code: "medulloblastoma", display: "Medulloblastoma", description: "WHO grade 4 embryonal tumor" },
    { code: "meningioma", display: "Meningioma", description: "WHO grade 1, 2, or 3 meningeal tumor" }
  ],
  
  // Molecular markers for brain cancer
  molecularMarkers: [
    { code: "idh-mutation", display: "IDH Mutation", description: "Isocitrate dehydrogenase mutation status" },
    { code: "mgmt-methylation", display: "MGMT Methylation", description: "O6-methylguanine-DNA methyltransferase promoter methylation" },
    { code: "1p19q-codeletion", display: "1p/19q Codeletion", description: "Codeletion of chromosome arms 1p and 19q" },
    { code: "egfr-amplification", display: "EGFR Amplification", description: "Epidermal growth factor receptor amplification" },
    { code: "h3k27m-mutation", display: "H3K27M Mutation", description: "Histone H3 K27M mutation" },
    { code: "tert-promoter-mutation", display: "TERT Promoter Mutation", description: "Telomerase reverse transcriptase promoter mutation" }
  ],
  
  // Test result options for molecular markers
  testResults: [
    { code: "positive", display: "Positive" },
    { code: "negative", display: "Negative" },
    { code: "indeterminate", display: "Indeterminate" },
    { code: "not-tested", display: "Not Tested" }
  ],
  
  // Treatment modalities
  treatmentTypes: [
    { code: "surgery", display: "Surgery", description: "Surgical resection" },
    { code: "radiation", display: "Radiation Therapy", description: "External beam radiation therapy" },
    { code: "chemotherapy", display: "Chemotherapy", description: "Systemic chemotherapy" },
    { code: "targeted-therapy", display: "Targeted Therapy", description: "Molecularly targeted agents" },
    { code: "immunotherapy", display: "Immunotherapy", description: "Immune system-based therapy" }
  ],
  
  // Tumor locations in the brain
  tumorLocations: [
    { code: "frontal-lobe", display: "Frontal Lobe" },
    { code: "temporal-lobe", display: "Temporal Lobe" },
    { code: "parietal-lobe", display: "Parietal Lobe" },
    { code: "occipital-lobe", display: "Occipital Lobe" },
    { code: "cerebellum", display: "Cerebellum" },
    { code: "brainstem", display: "Brainstem" },
    { code: "thalamus", display: "Thalamus" },
    { code: "hypothalamus", display: "Hypothalamus" },
    { code: "pituitary", display: "Pituitary" },
    { code: "ventricle", display: "Ventricle" },
    { code: "meninges", display: "Meninges" },
    { code: "spinal-cord", display: "Spinal Cord" }
  ],
  
  // Clinical status options
  clinicalStatus: [
    { code: "active", display: "Active" },
    { code: "recurrence", display: "Recurrence" },
    { code: "relapse", display: "Relapse" },
    { code: "remission", display: "Remission" },
    { code: "resolved", display: "Resolved" }
  ],
  
  // Common observation types for brain cancer
  observationTypes: [
    { code: "tumor-size", display: "Tumor Size", unit: "mm", valueType: "quantity" },
    { code: "ki-67-index", display: "Ki-67 Proliferation Index", unit: "%", valueType: "quantity" },
    { code: "karnofsky-score", display: "Karnofsky Performance Score", unit: "", valueType: "quantity" },
    { code: "idh1-status", display: "IDH1 Mutation Status", unit: "", valueType: "codeable" },
    { code: "idh2-status", display: "IDH2 Mutation Status", unit: "", valueType: "codeable" },
    { code: "mgmt-status", display: "MGMT Methylation Status", unit: "", valueType: "codeable" },
    { code: "1p19q-status", display: "1p/19q Codeletion Status", unit: "", valueType: "codeable" },
    { code: "who-grade", display: "WHO Grade", unit: "", valueType: "codeable" }
  ],
  
  // Gender options
  genderOptions: [
    { code: "male", display: "Male" },
    { code: "female", display: "Female" },
    { code: "other", display: "Other" },
    { code: "unknown", display: "Unknown" }
  ]
};

// GET /api/valuesets
export async function GET(
  req: NextRequest,
  { params }: { params: {} }
) {
  async function handleRequest() {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Get specific value set if requested
        const valueSetName = req.nextUrl.searchParams.get('name');
        
        if (valueSetName && valueSetName in brainCancerValueSets) {
          return NextResponse.json({
            name: valueSetName,
            values: brainCancerValueSets[valueSetName as keyof typeof brainCancerValueSets]
          });
        }
        
        // Otherwise return all value sets
        return NextResponse.json(brainCancerValueSets);
        
      } catch (error: any) {
        console.error('Value sets API error:', error.message);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    });
  }
  
  return handleRequest();
}