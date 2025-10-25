import React from 'react';
import { Navigate } from 'react-router-dom';

// PrivateRoute just checks if a token exists in localStorage
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // If token exists, render the child component (the protected page)
  // Otherwise, redirect the user to the login page
  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;