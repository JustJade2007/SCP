// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import axios from 'axios';

function LoginPage({ apiUrl, onLoginSuccess, navigateToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (!apiUrl) {
        setError("API URL is not configured. Please contact an administrator.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await axios.post(`${apiUrl}/api/login`, {
        username,
        password,
      });
      if (response.data && response.data.token) {
        onLoginSuccess(response.data.token);
      } else {
        setError('Login failed: No token received from server.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login. Please check credentials and network.');
      console.error('Login error:', err.response || err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-indigo-400">Site Access Portal</h2>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-gray-300">
              Operative ID
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              aria-required="true"
              className="w-full px-4 py-3 mt-1 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
              placeholder="Your operative identification"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="login-password"className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-required="true"
              className="w-full px-4 py-3 mt-1 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div role="alert" className="p-3 my-2 text-sm text-red-300 bg-red-900 bg-opacity-50 border border-red-700 rounded-md">
              <p className="font-semibold">Access Denied:</p>
              <p>{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-60 transition-colors duration-300"
              disabled={isLoading}
              aria-live="polite"
            >
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-400">
          New operative?{' '}
          <button
            onClick={navigateToRegister}
            className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
            disabled={isLoading}
          >
            Register for Clearance
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;