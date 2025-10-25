import React, { useState, useEffect } from 'react';
import axios from 'axios';
import setAuthToken from '../../utils/setAuthToken';
import { Card, Spinner, Alert } from 'react-bootstrap'; // Import components

const pipelineStages = [
  'Lead',
  'Prospecting',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

// --- A small component for a single Deal "Card" ---
const DealCard = ({ deal }) => {
  return (
    // Use React-Bootstrap's Card
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title style={{ fontSize: '1.1rem' }}>{deal.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
          {deal.contact ? deal.contact.name : 'No Contact'}
        </Card.Subtitle>
        <Card.Text className="fw-bold text-success">
          ${deal.value.toLocaleString()}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

// --- The Main Pipeline Component ---
const DealsPipeline = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getDeals = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }
      setAuthToken(token);

      try {
        const res = await axios.get('/api/deals');
        setDeals(res.data);
      } catch (err) {
        console.error('Error fetching deals:', err.response.data);
        setError(err.response.data.msg || 'Error fetching deals');
      } finally {
        setLoading(false);
      }
    };

    getDeals();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading your sales pipeline...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  return (
    <div className="mt-4">
      <h2>Deals Pipeline</h2>
      <div style={styles.pipeline}>
        {pipelineStages.map((stage) => (
          <div key={stage} style={styles.column}>
            {/* Use Card for the column itself */}
            <Card style={{ backgroundColor: '#f8f9fa', height: '100%' }}>
              <Card.Header as="h5" className="text-center">{stage}</Card.Header>
              <Card.Body style={styles.columnBody}>
                {deals
                  .filter((deal) => deal.stage === stage)
                  .map((deal) => (
                    <DealCard key={deal._id} deal={deal} />
                  ))}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Styles for the Kanban board layout ---
const styles = {
  pipeline: {
    display: 'flex',
    flexDirection: 'row',
    overflowX: 'auto', // Allows horizontal scrolling
    gap: '15px',
    padding: '10px 0',
  },
  column: {
    minWidth: '280px',
    maxWidth: '300px',
    flex: 1,
  },
  columnBody: {
    padding: '10px',
    height: '60vh', // Fixed height for columns
    overflowY: 'auto', // Vertical scroll *inside* columns
  },
};

export default DealsPipeline;