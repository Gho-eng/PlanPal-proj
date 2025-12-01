import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- NEW: Import BrowserRouter
import App from './App'; 

import './index.css'; 

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      {/* Wrap the App component with BrowserRouter */}
      <BrowserRouter>
        <App /> 
      </BrowserRouter>
    </React.StrictMode>
  );
}