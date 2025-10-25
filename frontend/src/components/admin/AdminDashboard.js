import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Spinner, Alert, Container, Form } from 'react-bootstrap';
import setAuthToken from '../../utils/setAuthToken';
import TeamManagement from './TeamManagement'; // <-- Import Team Management

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to fetch users (can be reused by TeamManagement if needed, or keep separate)
  const fetchUsers = async () => {
    setLoading(true); // Set loading when fetching
    setError(''); // Clear previous errors
    setAuthToken(localStorage.getItem('token')); // Ensure token is set
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch users');
      console.error("Fetch Users Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    // Basic confirmation dialog
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      setError(''); // Clear errors
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        // Refresh the user list after deletion
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to delete user');
        console.error("Delete User Error:", err.response?.data || err.message);
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError(''); // Clear errors
    try {
      await axios.put(`/api/admin/users/${userId}`, { role: newRole });
      // Refresh the user list to show the updated role
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update role');
      console.error("Update Role Error:", err.response?.data || err.message);
      // Optional: Revert dropdown visually if API call fails
      fetchUsers(); // Re-fetch to ensure UI consistency
    }
  };


  if (loading) {
    return (
        <Container className="text-center mt-5">
            <Spinner animation="border" variant="primary" />
            <p>Loading users...</p>
        </Container>
    );
  }

  return (
    <Container fluid className="mt-4"> {/* Use fluid container */}
      <h2><i className="bi bi-person-gear me-2"></i>Admin Dashboard</h2> {/* Added Icon */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <h3 className="mt-4">User Management</h3>
      <Table striped bordered hover responsive size="sm" className="align-middle shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Team</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <Form.Select
                  size="sm" // Smaller select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  // Disable changing your own role or maybe other admins' roles
                  // disabled={user._id === YOUR_LOGGED_IN_USER_ID} // You'd need to get logged in user ID
                  aria-label={`Select role for ${user.name}`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </td>
              <td>{user.team?.name || 'N/A'}</td> {/* Display team name if populated */}
              <td className="text-nowrap">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(user._id)}
                   // disabled={user._id === YOUR_LOGGED_IN_USER_ID} // Prevent self-delete
                   title="Delete User"
                >
                  <i className="bi bi-trash"></i> {/* Delete Icon */}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <hr className="my-4"/> {/* Separator */}

      {/* --- Embed Team Management Component --- */}
      <TeamManagement />
      {/* -------------------------------------- */}

    </Container>
  );
};

export default AdminDashboard;