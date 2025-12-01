import React from 'react';
// Import the necessary routing components
import { Routes, Route } from 'react-router-dom'; 

// For this example, let's create simple placeholder components
// In a real project, you would import these from ./pages/ or ./components/
const HomePage = () => <h1 className="text-3xl p-8">Welcome Home!</h1>;
const DashboardPage = () => <h1 className="text-3xl p-8 bg-green-100">User Dashboard</h1>;

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* The Routes component is where you define all your application routes */}
      <Routes>
        {/* Route for the root path: "/" */}
        <Route path="/" element={<HomePage />} /> 
        
        {/* Route for the dashboard path: "/dashboard" */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Add more routes here as your application grows */}
        {/* Example: A fallback or 404 page */}
        <Route path="*" element={<h1 className="text-5xl text-red-500 p-8">404: Not Found</h1>} />
      </Routes>
    </div>
  );
};

export default App;