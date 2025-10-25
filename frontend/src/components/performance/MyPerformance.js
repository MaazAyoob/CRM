import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Spinner, Alert, Container, Badge } from 'react-bootstrap'; // Added Container, Badge
import setAuthToken from '../../utils/setAuthToken';

const MyPerformance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setAuthToken(localStorage.getItem('token'));
      try {
        const res = await axios.get('/api/performance/me');
        setData(res.data);
      } catch (err) {
        setError('Failed to fetch your performance data.');
        console.error("My Performance Error:", err.response?.data || err.message);
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
              <p>Loading your performance...</p>
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
  if (!data || !data.stats) { // Check if stats exist
      return (
          <Container className="mt-4">
             <Alert variant="warning">No performance data available yet.</Alert>
          </Container>
      );
  }

  const { user, stats } = data;

  return (
    // Use Container for consistent padding
    <Container fluid className="mt-4">
      <h2><i className="bi bi-graph-up me-2"></i>My Performance: {user?.name || 'Loading...'}</h2>
      <hr />
      <Row className="g-3"> {/* Use g-3 for gutters */}
          <Col sm={6} lg={3}>
            <Card bg="light" text="dark" className="text-center shadow-sm h-100">
              <Card.Body>
                  <Card.Title><i className="bi bi-briefcase-fill me-2"></i>Total Deals</Card.Title>
                  <Card.Text as="h2" className="fw-bold">{stats.totalDeals}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col sm={6} lg={3}>
            <Card bg="info" text="dark" className="text-center shadow-sm h-100">
             <Card.Body>
                 <Card.Title><i className="bi bi-folder me-2"></i>Open Deals</Card.Title>
                 <Card.Text as="h2" className="fw-bold">{stats.openDeals}</Card.Text>
                 <Badge pill bg="dark">${stats.openValue.toLocaleString()}</Badge>
             </Card.Body>
            </Card>
          </Col>
          <Col sm={6} lg={3}>
            <Card bg="success" text="white" className="text-center shadow-sm h-100">
              <Card.Body>
                  <Card.Title><i className="bi bi-trophy-fill me-2"></i>Won Deals</Card.Title>
                  <Card.Text as="h2" className="fw-bold">{stats.wonDeals}</Card.Text>
                  <Badge pill bg="light" text="success">${stats.wonValue.toLocaleString()}</Badge>
              </Card.Body>
            </Card>
          </Col>
           <Col sm={6} lg={3}>
            <Card bg="danger" text="white" className="text-center shadow-sm h-100">
              <Card.Body>
                  <Card.Title><i className="bi bi-x-circle-fill me-2"></i>Lost Deals</Card.Title>
                  <Card.Text as="h2" className="fw-bold">{stats.lostDeals}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* Future enhancements: Add charts specific to 'my' performance */}
    </Container>
  );
};

export default MyPerformance;