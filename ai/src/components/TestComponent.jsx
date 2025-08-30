import React from 'react';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🧳 Tourist Dashboard</h1>
        <p className="text-xl mb-4">Test Component - Basic Rendering Works!</p>
        <div className="bg-white text-gray-800 p-4 rounded-lg">
          <p>✅ React is working</p>
          <p>✅ Tailwind CSS is working</p>
          <p>✅ Component rendering is working</p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
