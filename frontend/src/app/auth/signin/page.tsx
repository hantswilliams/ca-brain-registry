"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function SignIn() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, error } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(credentials.username, credentials.password);
      
      if (success) {
        // Redirect to dashboard on success
        router.push("/dashboard");
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image 
            src="/brain-color.png" 
            alt="Cancer Brain Registry" 
            width={100} 
            height={100}
            className="object-contain"
          />
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">
          Cancer Brain Registry Login
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-gray-700 font-medium mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>For testing purposes, use these credentials:</p>
          <ul className="mt-2">
            <li><strong>Admin:</strong> username: admin, password: password</li>
            <li><strong>Researcher:</strong> username: researcher, password: research</li>
            <li><strong>Clinician:</strong> username: clinician, password: clinic</li>
          </ul>
        </div>
        
        <div className="mt-4 text-center flex justify-center items-center gap-2">
          <p className="text-xs text-gray-500">Sponsored by University of Virginia</p>
          <Image 
            src="/uva_logo.png" 
            alt="UVA Logo" 
            width={20} 
            height={20}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}