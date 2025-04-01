import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import fhirClient from '@/utils/fhirClient';

// GET /api/custom/patient-summary/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { id } = params;
      
      // Get patient data
      const patientResponse = await fhirClient.get('Patient', id);
      const patient = patientResponse.data;
      
      // Get patient's observations
      const observationsResponse = await fhirClient.search('Observation', {
        patient: `Patient/${id}`,
        _sort: '-date',
        _count: '100'
      });
      
      // Get patient's conditions
      const conditionsResponse = await fhirClient.search('Condition', {
        patient: `Patient/${id}`,
        _sort: '-date',
        _count: '100'
      });
      
      // Format patient data
      const patientName = patient.name && patient.name[0] 
        ? `${patient.name[0].given?.[0] || ''} ${patient.name[0].family || ''}`.trim()
        : 'Unknown';
      
      // Format observations into a more user-friendly structure
      const observations = observationsResponse.data.entry?.map((entry: any) => {
        const obs = entry.resource;
        return {
          id: obs.id,
          date: obs.effectiveDateTime,
          name: obs.code?.coding?.[0]?.display || 'Unknown Observation',
          value: obs.valueQuantity?.value || null,
          unit: obs.valueQuantity?.unit || null,
          status: obs.status
        };
      }) || [];
      
      // Format conditions into a more user-friendly structure
      const conditions = conditionsResponse.data.entry?.map((entry: any) => {
        const condition = entry.resource;
        return {
          id: condition.id,
          name: condition.code?.coding?.[0]?.display || 'Unknown Condition',
          status: condition.clinicalStatus?.coding?.[0]?.code || 'unknown',
          onsetDate: condition.onsetDateTime,
          category: condition.category?.[0]?.coding?.[0]?.display || 'Other'
        };
      }) || [];
      
      // Return a simplified patient summary
      return NextResponse.json({
        id: patient.id,
        name: patientName,
        birthDate: patient.birthDate,
        gender: patient.gender,
        address: patient.address?.[0] ? {
          line: patient.address[0].line?.[0],
          city: patient.address[0].city,
          state: patient.address[0].state,
          postalCode: patient.address[0].postalCode
        } : null,
        contactInfo: patient.telecom?.map((t: any) => ({
          type: t.system,
          value: t.value
        })) || [],
        observations,
        conditions
      });
    } catch (error: any) {
      console.error('Patient summary error:', error.message);
      return NextResponse.json(
        { error: error.response?.data || error.message },
        { status: error.response?.status || 500 }
      );
    }
  });
}