import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const tumorGrades = [
    { code: 'grade1', display: 'Grade I - Benign, slow growing' },
    { code: 'grade2', display: 'Grade II - Relatively slow growing, may spread to nearby tissue' },
    { code: 'grade3', display: 'Grade III - Malignant, actively reproducing abnormal cells' },
    { code: 'grade4', display: 'Grade IV - Aggressive malignant, rapidly reproducing' },
    { code: 'unknown', display: 'Unknown/Not specified' }
  ];

  return NextResponse.json(tumorGrades);
}