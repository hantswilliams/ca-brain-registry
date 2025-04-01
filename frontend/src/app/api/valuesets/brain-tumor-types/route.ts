import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const brainTumorTypes = [
    { code: 'glioblastoma', display: 'Glioblastoma (GBM)' },
    { code: 'astrocytoma', display: 'Astrocytoma' },
    { code: 'oligodendroglioma', display: 'Oligodendroglioma' },
    { code: 'ependymoma', display: 'Ependymoma' },
    { code: 'medulloblastoma', display: 'Medulloblastoma' },
    { code: 'meningioma', display: 'Meningioma' },
    { code: 'schwannoma', display: 'Schwannoma' },
    { code: 'pituitary_adenoma', display: 'Pituitary Adenoma' },
    { code: 'craniopharyngioma', display: 'Craniopharyngioma' },
    { code: 'lymphoma', display: 'Central Nervous System Lymphoma' },
    { code: 'metastatic', display: 'Metastatic Brain Tumor' },
    { code: 'other', display: 'Other' }
  ];

  return NextResponse.json(brainTumorTypes);
}