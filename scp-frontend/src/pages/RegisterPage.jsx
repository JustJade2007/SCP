// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage({ apiUrl, onRegisterSuccess, navigateToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!apiUrl) {
        setError("API URL is not configured. Please contact an administrator.");
        setIsLoading(false);
        return;
    }

    if (password.length < 6) { 
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
    }
     if (username.length < 3) { 
        setError('Username must be at least 3 characters long.');
        setIsLoading(false);
        return;
    }


    try {
      const response = await axios.post(`${apiUrl}/api/register`, {
        username,
        password,
      });
      setSuccessMessage(response.data.message + ' You will be redirected to login shortly.');
      // Keep isLoading true to prevent further interaction until redirect
      setTimeout(() => {
        onRegisterSuccess();
      }, 2500); 
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration. Please try a different username or check network.');
      console.error('Registration error:', err.response || err.message || err);
      setIsLoading(false); // Only set isLoading to false on error
    } 
    // If successful, isLoading remains true until redirect to prevent multiple submissions
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-green-400">Register New Operative</h2>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="register-username" className="block text-sm font-medium text-gray-300">
              Choose Operative ID (min. 3 characters)
            </label>
            <input
              id="register-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              aria-required="true"
              className="w-full px-4 py-3 mt-1 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
              placeholder="Your desired operative ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-300">
              Set Password (min. 6 characters)
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-required="true"
              className="w-full px-4 py-3 mt-1 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div role="alert" className="p-3 my-2 text-sm text-red-300 bg-red-900 bg-opacity-50 border border-red-700 rounded-md">
              <p className="font-semibold">Registration Failed:</p>
              <p>{error}</p>
            </div>
          )}
          {successMessage && (
            <div role="alert" className="p-3 my-2 text-sm text-green-300 bg-green-900 bg-opacity-50 border border-green-700 rounded-md">
              <p className="font-semibold">Registration Successful:</p>
              <p>{successMessage}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:opacity-60 transition-colors duration-300"
              disabled={isLoading}
              aria-live="polite"
            >
              {isLoading ? (successMessage ? 'Redirecting...' : 'Processing...') : 'Register Operative'}
            </button>
          </div>
        </form>
         <p className="text-sm text-center text-gray-400">
          Already cleared for access?{' '}
          <button
            onClick={navigateToLogin}
            className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
            disabled={isLoading}
          >
            Login Here
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;