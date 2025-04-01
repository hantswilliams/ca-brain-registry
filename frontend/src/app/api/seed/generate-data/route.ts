import { NextRequest, NextResponse } from 'next/server';
import fhirClient from '@/utils/fhirClient';

// Helper function to generate a random date within a range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// Helper function to generate a random MRN
function generateMRN(): string {
  return `BR-${Math.floor(100000 + Math.random() * 900000)}`; // 6-digit MRN with BR prefix
}

// Helper function to generate mock patients
async function generatePatients(count: number) {
  const genders = ['male', 'female'];
  const patients = [];

  // Common last names
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
  
  // First names by gender
  const firstNames = {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen']
  };

  for (let i = 0; i < count; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const firstNamesList = firstNames[gender as keyof typeof firstNames];
    const firstName = firstNamesList[Math.floor(Math.random() * firstNamesList.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Generate birth date - adults between 30 and 85 years old
    const now = new Date();
    const minAge = new Date(now.getFullYear() - 85, 0, 1);  // 85 years ago
    const maxAge = new Date(now.getFullYear() - 30, 0, 1);  // 30 years ago
    const birthDate = randomDate(minAge, maxAge);

    patients.push({
      resourceType: 'Patient',
      identifier: [
        {
          system: 'http://example.org/fhir/ids/mrn',
          value: generateMRN()
        }
      ],
      name: [
        {
          use: 'official',
          family: lastName,
          given: [firstName]
        }
      ],
      gender: gender,
      birthDate: birthDate
    });
  }

  return patients;
}

// Helper function to generate brain cancer observations
async function generateBrainCancerObservations(patientIds: string[]) {
  const observations = [];
  
  // Brain cancer-specific observation types
  const observationTypes = [
    {
      name: 'Tumor Size',
      code: '21889-1',
      system: 'http://loinc.org',
      unit: 'mm',
      unitCode: 'mm',
      valueRange: [5, 80] // Size in mm
    },
    {
      name: 'WHO Grade',
      code: '44773-4',
      system: 'http://loinc.org',
      unit: 'grade',
      unitCode: 'grade',
      valueRange: [1, 4] // WHO grades 1-4
    },
    {
      name: 'IDH Mutation Status',
      code: '81551-9',
      system: 'http://loinc.org',
      unit: '',
      unitCode: '',
      valueOptions: ['Positive', 'Negative']
    },
    {
      name: 'MGMT Methylation Status',
      code: '72769-2',
      system: 'http://loinc.org',
      unit: '',
      unitCode: '',
      valueOptions: ['Methylated', 'Unmethylated']
    },
    {
      name: 'Ki-67 Proliferation Index',
      code: '85319-8',
      system: 'http://loinc.org',
      unit: '%',
      unitCode: '%',
      valueRange: [1, 90] // Percentage
    }
  ];

  // For each patient, generate 2-5 observations
  for (const patientId of patientIds) {
    // Generate diagnosis date - between 1 month and 3 years ago
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    const maxDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const observationCount = 2 + Math.floor(Math.random() * 4); // 2-5 observations
    
    for (let i = 0; i < observationCount; i++) {
      const obsType = observationTypes[Math.floor(Math.random() * observationTypes.length)];
      const effectiveDate = randomDate(minDate, maxDate);
      
      let valueQuantity;
      
      if (obsType.valueRange) {
        const value = obsType.valueRange[0] + Math.random() * (obsType.valueRange[1] - obsType.valueRange[0]);
        valueQuantity = {
          value: parseFloat(value.toFixed(1)),
          unit: obsType.unit,
          system: 'http://unitsofmeasure.org',
          code: obsType.unitCode
        };
      }
      
      const observation: any = {
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'laboratory',
                display: 'Laboratory'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: obsType.system,
              code: obsType.code,
              display: obsType.name
            }
          ],
          text: obsType.name
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: `${effectiveDate}T00:00:00Z`
      };
      
      if (valueQuantity) {
        observation.valueQuantity = valueQuantity;
      } else if (obsType.valueOptions) {
        observation.valueString = obsType.valueOptions[Math.floor(Math.random() * obsType.valueOptions.length)];
      }
      
      observations.push(observation);
    }
  }
  
  return observations;
}

// Generate conditions for brain tumors
async function generateBrainCancerConditions(patientIds: string[]) {
  const conditions = [];
  
  const brainCancerTypes = [
    {
      name: 'Glioblastoma',
      code: '394910008',
      system: 'http://snomed.info/sct'
    },
    {
      name: 'Astrocytoma',
      code: '254939000',
      system: 'http://snomed.info/sct'
    },
    {
      name: 'Meningioma',
      code: '254937003',
      system: 'http://snomed.info/sct'
    },
    {
      name: 'Oligodendroglioma',
      code: '302856004',
      system: 'http://snomed.info/sct'
    },
    {
      name: 'Medulloblastoma',
      code: '254938008',
      system: 'http://snomed.info/sct'
    }
  ];
  
  for (const patientId of patientIds) {
    const cancerType = brainCancerTypes[Math.floor(Math.random() * brainCancerTypes.length)];
    
    // Generate diagnosis date - between 1 month and 3 years ago
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    const maxDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const onsetDate = randomDate(minDate, maxDate);
    
    conditions.push({
      resourceType: 'Condition',
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
            display: 'Active'
          }
        ]
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed'
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: 'problem-list-item',
              display: 'Problem List Item'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: cancerType.system,
            code: cancerType.code,
            display: cancerType.name
          }
        ],
        text: `${cancerType.name} of brain`
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      onsetDateTime: `${onsetDate}T00:00:00Z`
    });
  }
  
  return conditions;
}

// POST /api/seed/generate-data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patientCount = body.patientCount || 10;
    
    console.log(`Generating ${patientCount} sample patients for brain cancer registry...`);
    
    // Generate patients
    const patients = await generatePatients(patientCount);
    console.log(`Generated ${patients.length} patient resources`);
    
    // Create patients in the FHIR server
    const patientBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: patients.map(patient => ({
        resource: patient,
        request: {
          method: 'POST',
          url: 'Patient'
        }
      }))
    };
    
    console.log('Sending patient bundle to HAPI FHIR server...');
    // Use transaction instead of batch for better handling
    const patientResponse = await fhirClient.transaction(patientBundle);
    console.log('Patient bundle response received');
    
    if (!patientResponse.data.entry || patientResponse.data.entry.length === 0) {
      throw new Error('No patients were created. FHIR server response did not contain expected data.');
    }
    
    // Extract created patient IDs
    const patientIds = patientResponse.data.entry.map((entry: any) => {
      if (!entry.response || !entry.response.location) {
        console.error('Invalid entry in patient response:', entry);
        return null;
      }
      const locationHeader = entry.response.location;
      return locationHeader.split('/').pop();
    }).filter(Boolean); // Remove any null values
    
    if (patientIds.length === 0) {
      throw new Error('Failed to extract patient IDs from FHIR server response');
    }
    
    console.log(`Successfully created ${patientIds.length} patients with IDs:`, patientIds);
    
    // Generate observations for the patients
    console.log('Generating brain cancer observations...');
    const observations = await generateBrainCancerObservations(patientIds);
    console.log(`Generated ${observations.length} observation resources`);
    
    // Create observations in the FHIR server
    const observationBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: observations.map(observation => ({
        resource: observation,
        request: {
          method: 'POST',
          url: 'Observation'
        }
      }))
    };
    
    console.log('Sending observation bundle to HAPI FHIR server...');
    const observationResponse = await fhirClient.transaction(observationBundle);
    console.log('Observation bundle response received');
    
    // Generate conditions for the patients
    console.log('Generating brain cancer conditions...');
    const conditions = await generateBrainCancerConditions(patientIds);
    console.log(`Generated ${conditions.length} condition resources`);
    
    // Create conditions in the FHIR server
    const conditionBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: conditions.map(condition => ({
        resource: condition,
        request: {
          method: 'POST',
          url: 'Condition'
        }
      }))
    };
    
    console.log('Sending condition bundle to HAPI FHIR server...');
    const conditionResponse = await fhirClient.transaction(conditionBundle);
    console.log('Condition bundle response received');
    
    return NextResponse.json({
      message: 'Sample data generated successfully',
      patientsCreated: patientIds.length,
      observationsCreated: observations.length,
      conditionsCreated: conditions.length
    });
  } catch (error: any) {
    console.error('Error generating sample data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate sample data' },
      { status: 500 }
    );
  }
}