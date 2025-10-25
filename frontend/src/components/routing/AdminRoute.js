import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';
import setAuthToken from '../../utils/setAuthToken';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return; // No token, will redirect to login
      }
      setAuthToken(token); // Set token for the request
      
      try {
        // We will use the GET /api/auth route to get the user's data
        const res = await axios.get('/api/auth');
        if (res.data.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        // If the token is invalid or any error, they are not an admin
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isLoading) {
    // Show a loading spinner while we verify admin status
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!localStorage.getItem('token')) {
    // If loading is done and still no token (e.g., logged out)
    return <Navigate to="/login" />;
  }
  
  // If loading is done, token exists, but user is NOT an admin
  if (!isAdmin) {
    // Redirect them to the main dashboard. They don't belong here.
    return <Navigate to="/" />;
  }

  // If all checks pass, show the admin page
  return children;
};

export default AdminRoute;