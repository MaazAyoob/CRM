import axios from 'axios';

// Set the base URL for all API calls IF the env var is defined
const baseURL = process.env.REACT_APP_API_URL;
if (baseURL) {
  axios.defaults.baseURL = baseURL;
  console.log(`Axios baseURL configured to: ${baseURL}`); // Check this log
} else {
  // Fallback for local development (uses proxy defined in package.json)
  console.log('REACT_APP_API_URL not set, using local proxy for API calls.');
}

// ... rest of index.js (ReactDOM.createRoot, etc.)





// This line imports the Bootstrap CSS for styling
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // <-- ADD THIS LINE

// These are your standard React imports (ONLY ONCE)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Find the 'root' div in your index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your entire App component inside that div
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
