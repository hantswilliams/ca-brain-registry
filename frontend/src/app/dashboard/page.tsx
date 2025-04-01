"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/utils/apiClient";

type Stats = {
  totalPatients: number;
  patientsByGender: Record<string, number>;
  patientsByAgeGroup: Record<string, number>;
  totalObservations: number;
  observationTypes: Record<string, number>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch patients from our API
        const patients = await apiClient.getPatients();
        const totalPatients = patients.length;
        
        // Calculate gender distribution from actual data
        const genderCounts: Record<string, number> = {};
        patients.forEach(patient => {
          const gender = patient.gender || 'unknown';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });
        
        // Mock data for age groups and observations - in a real app, calculate these from actual data
        setStats({
          totalPatients,
          patientsByGender: genderCounts.length > 0 ? genderCounts : {
            male: Math.floor(Math.random() * 50) + 30,
            female: Math.floor(Math.random() * 50) + 30,
            other: Math.floor(Math.random() * 10)
          },
          patientsByAgeGroup: {
            "0-18": Math.floor(Math.random() * 5),
            "19-40": Math.floor(Math.random() * 15) + 5,
            "41-60": Math.floor(Math.random() * 30) + 20,
            "61-80": Math.floor(Math.random() * 25) + 15,
            "81+": Math.floor(Math.random() * 10) + 5
          },
          totalObservations: Math.floor(Math.random() * 200) + 100, // Mocked for now
          observationTypes: {
            "Tumor Size": Math.floor(Math.random() * 60) + 40,
            "Blood Test": Math.floor(Math.random() * 100) + 50,
            "MRI Results": Math.floor(Math.random() * 40) + 30,
            "Biopsy Results": Math.floor(Math.random() * 30) + 20,
            "Other": Math.floor(Math.random() * 20) + 10
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-gray-500">
            Welcome back, {user?.username || user?.first_name || "User"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Patient Stats Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Patients
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats?.totalPatients || 0}
              </dd>
            </dl>
          </div>
        </div>

        {/* Observations Stats Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Observations
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats?.totalObservations || 0}
              </dd>
            </dl>
          </div>
        </div>

        {/* Average Age Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Most Common Age Group
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                41-60
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Gender Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Gender Distribution</h3>
          <div className="h-64 flex items-end space-x-2">
            {stats?.patientsByGender && Object.entries(stats.patientsByGender).map(([gender, count]) => (
              <div key={gender} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-full ${
                    gender === 'male' ? 'bg-blue-500' : 
                    gender === 'female' ? 'bg-pink-500' : 'bg-purple-500'
                  }`} 
                  style={{ height: `${(count / Math.max(...Object.values(stats.patientsByGender))) * 200}px` }}
                ></div>
                <div className="text-sm mt-2 capitalize">{gender}</div>
                <div className="text-sm font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Age Distribution</h3>
          <div className="h-64 flex items-end space-x-2">
            {stats?.patientsByAgeGroup && Object.entries(stats.patientsByAgeGroup).map(([ageGroup, count], index) => (
              <div key={ageGroup} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-full bg-gradient-to-t from-green-600 to-green-400`}
                  style={{ height: `${(count / Math.max(...Object.values(stats.patientsByAgeGroup))) * 200}px` }}
                ></div>
                <div className="text-sm mt-2">{ageGroup}</div>
                <div className="text-sm font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Observation Types</h3>
          <div className="h-64 flex items-end space-x-2">
            {stats?.observationTypes && Object.entries(stats.observationTypes).map(([type, count], index) => (
              <div key={type} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-full bg-gradient-to-t from-indigo-600 to-indigo-400`}
                  style={{ height: `${(count / Math.max(...Object.values(stats.observationTypes))) * 200}px` }}
                ></div>
                <div className="text-sm mt-2 text-center">{type}</div>
                <div className="text-sm font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}