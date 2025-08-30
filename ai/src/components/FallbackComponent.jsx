import React from 'react';

const FallbackComponent = ({ error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-red-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🧳 Tourist Dashboard
        </h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Component Error</p>
          <p className="text-sm">{error || "Something went wrong"}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default FallbackComponent;
