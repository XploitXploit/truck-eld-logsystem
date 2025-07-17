import axios from 'axios';
import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || "http:
  : "";

const DebugAuth: React.FC = () => {
  const [testResponse, setTestResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerData, setRegisterData] = useState({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    password2: 'password123'
  });

  const testBackendConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/debug/`);
      setTestResponse(response.data);
    } catch (err: any) {
      console.error('Debug test failed:', err);
      setError(err.message || 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const testRegisterEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const debugResponse = await axios.post(
        `${API_BASE_URL}/api/auth/debug/`,
        registerData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Debug POST response:', debugResponse.data);

      const registerResponse = await axios.post(
        `${API_BASE_URL}/api/auth/register/`,
        registerData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      setTestResponse({
        debug: debugResponse.data,
        register: registerResponse.data
      });
    } catch (err: any) {
      console.error('Register test failed:', err);
      setError(err.message || 'Registration test failed');
      if (err.response) {
        setTestResponse({
          error: err.message,
          response: err.response.data,
          status: err.response.status
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Authentication Debugging</h1>

      <div className="mb-4">
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>

        <button
          onClick={testRegisterEndpoint}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Register Endpoint'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {testResponse && (
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="text-xs">{JSON.stringify(testResponse, null, 2)}</pre>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Test Registration Data:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-xs">{JSON.stringify(registerData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth;
