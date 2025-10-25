import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Spinner, Alert, Card, Container } from 'react-bootstrap'; // Added Container
import setAuthToken from '../../utils/setAuthToken';

const TeamPerformance = () => {
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setAuthToken(localStorage.getItem('token'));
      try {
        const res = await axios.get('/api/performance/teams');
        setTeamStats(res.data);
      } catch (err) {
        setError('Failed to fetch team performance data. Ensure you are admin.');
        console.error("Team Performance Error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <Container className="text-center mt-5">
            <Spinner animation="border" variant="primary" />
            <p>Loading team performance...</p>
        </Container>
    );
  }
  if (error) {
    return (
        <Container className="mt-4">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );
  }

  return (
    <Container fluid className="mt-4"> {/* Use fluid container */}
      <h2><i className="bi bi-bar-chart-line-fill me-2"></i>Team Performance Overview</h2>
      <hr/>
      {teamStats.length === 0 && !loading ? (
           <Alert variant="info">No teams found or no data available.</Alert>
      ) : (
      <Table striped bordered hover responsive size="sm" className="align-middle shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Team Name</th>
            <th><i className="bi bi-people-fill me-1"></i>Members</th>
            <th><i className="bi bi-folder me-1"></i>Open Deals</th>
            <th><i className="bi bi-currency-dollar me-1"></i>Open Value</th>
            <th><i className="bi bi-trophy-fill me-1"></i>Won Deals</th>
            <th><i className="bi bi-currency-dollar me-1"></i>Won Value</th>
            <th><i className="bi bi-x-circle-fill me-1"></i>Lost Deals</th>
            {/* Add more stats headers as needed */}
          </tr>
        </thead>
        <tbody>
          {teamStats.map(team => (
            <tr key={team.teamId}>
              <td className="fw-bold">{team.teamName}</td>
              <td className="text-center">{team.memberCount}</td>
              <td className="text-center">{team.stats.openDeals}</td>
              <td>${team.stats.openValue.toLocaleString()}</td>
              <td className="text-success text-center fw-bold">{team.stats.wonDeals}</td>
              <td className="text-success">${team.stats.wonValue.toLocaleString()}</td>
              <td className="text-danger text-center">{team.stats.lostDeals}</td>
            </tr>
          ))}
        </tbody>
      </Table>
       )}
      {/* Future: Add links to drill down into specific team details */}
    </Container>
  );
};

export default TeamPerformance;