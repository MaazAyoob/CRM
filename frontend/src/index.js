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