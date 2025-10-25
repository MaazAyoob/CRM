import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, ListGroup, Row, Col, Alert, InputGroup, Card } from 'react-bootstrap';
import setAuthToken from '../../utils/setAuthToken';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]); // All users
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setAuthToken(localStorage.getItem('token'));
    try {
      const [teamsRes, usersRes] = await Promise.all([
        axios.get('/api/teams'),
        axios.get('/api/admin/users') // Assuming admin already fetched users
      ]);
      setTeams(teamsRes.data);
      // Filter out users already in a team for the add dropdown
      setUsers(usersRes.data.filter(u => !u.team));
    } catch (err) {
      setError('Failed to fetch data. Ensure you are logged in as admin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    setError('');
    try {
      await axios.post('/api/teams', { name: newTeamName });
      setNewTeamName('');
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create team.');
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeamId || !selectedUserId) return;
    setError('');
    try {
      await axios.put(`/api/teams/${selectedTeamId}/members/${selectedUserId}`);
      fetchData(); // Refresh
      setSelectedUserId(''); // Reset dropdown
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    setError('');
    try {
      await axios.delete(`/api/teams/${teamId}/members/${userId}`);
      fetchData(); // Refresh
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove member.');
    }
  };


  if (loading) return <p>Loading team data...</p>;

  return (
    <Card className="mt-4">
      <Card.Header as="h3">Team Management</Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Create New Team */}
        <Form onSubmit={handleCreateTeam} className="mb-4">
          <Row>
            <Col md={8}>
              <Form.Control
                type="text"
                placeholder="New team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Button type="submit" variant="success" className="w-100">Create Team</Button>
            </Col>
          </Row>
        </Form>

        <hr />

        {/* Manage Existing Teams */}
        {teams.map(team => (
          <div key={team._id} className="mb-4 p-3 border rounded">
            <h4>{team.name} <small className="text-muted">({team.members?.length || 0} members)</small></h4>
            
            {/* Add Member Form */}
            <InputGroup className="mb-2">
               <Form.Select 
                  value={selectedUserId}
                  onChange={(e) => { setSelectedUserId(e.target.value); setSelectedTeamId(team._id); }}
                  aria-label="Select user to add"
                >
                <option value="">-- Select User to Add --</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                ))}
              </Form.Select>
              <Button 
                variant="outline-primary" 
                onClick={handleAddMember} 
                disabled={!selectedUserId || selectedTeamId !== team._id}
              >
                Add Member
              </Button>
            </InputGroup>

            {/* Member List */}
            <ListGroup variant="flush">
              {team.members && team.members.length > 0 ? (
                team.members.map(member => (
                  <ListGroup.Item key={member._id} className="d-flex justify-content-between align-items-center">
                    {member.name} ({member.email})
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => handleRemoveMember(team._id, member._id)}
                     >
                       Remove
                     </Button>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>No members in this team.</ListGroup.Item>
              )}
            </ListGroup>
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

export default TeamManagement;