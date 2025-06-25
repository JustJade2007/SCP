// src/pages/DashboardPage.jsx

import React from 'react';

function DashboardPage({ user }) {
  if (!user) {
    return (
      <div className="text-center p-10 bg-gray-800 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-red-400">Error: User data not available.</h2>
        <p className="text-gray-300">Please try logging in again or contact support if the issue persists.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl p-8 sm:p-10 bg-gray-800 text-gray-100 rounded-xl shadow-2xl text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-indigo-400">
        Welcome, Operative <span className="text-teal-400">{user.username}</span>!
      </h2>
      <p className="mb-4 text-lg text-gray-300">
        Your Confirmed Access Level: <span className="font-semibold text-teal-400">{user.accessLevel}</span>
      </p>
      <p className="text-gray-400 mb-8">
        You now have access to classified SCP Foundation archives and systems corresponding to your clearance. Proceed with caution.
      </p>
      <div className="mt-8 p-6 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600">
        <h3 className="text-xl sm:text-2xl font-semibold text-indigo-300 mb-4">Anomaly Interaction Panel</h3>
        <p className="text-sm text-gray-400 italic">
          [The interactive SCP experiment submission interface is currently undergoing scheduled maintenance. Please check back later.]
        </p>
         <p className="text-xs text-gray-500 mt-4">
          Unauthorized access or experimentation will result in immediate disciplinary action.
        </p>
      </div>
       <p className="text-xs text-gray-500 mt-10">
          Remember: Secure. Contain. Protect.
        </p>
    </div>
  );
}

export default DashboardPage;