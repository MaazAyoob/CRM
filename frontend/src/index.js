// --- ALL IMPORTS MUST BE AT THE TOP ---
import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios'; // Import axios here
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import 'bootstrap-icons/font/bootstrap-icons.css'; // Bootstrap Icons CSS
import 'react-big-calendar/lib/css/react-big-calendar.css'; // React Big Calendar CSS
import './index.css'; // Your custom CSS (if any)
import App from './App'; // Your main App component
// ----------------------------------------

// --- AXIOS CONFIGURATION (AFTER IMPORTS) ---
const baseURL = process.env.REACT_APP_API_URL;
if (baseURL) {
  axios.defaults.baseURL = baseURL;
  console.log(`Axios baseURL configured to: ${baseURL}`);
} else {
  // Fallback for local development (uses proxy defined in package.json)
  console.log('REACT_APP_API_URL not set, using local proxy for API calls.');
}
// -------------------------------------------

// --- RENDER THE APP ---
// Find the 'root' div in your index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your entire App component inside that div
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// --- END ---
