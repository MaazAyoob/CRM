import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
// Import necessary Bootstrap components
import { Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
// Import Recharts components for the pie chart
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
// Import utility and the new ActivityFeed component
import setAuthToken from '../../utils/setAuthToken';
import ActivityFeed from './ActivityFeed'; 

// Define distinct colors for the pie chart segments
const PIE_COLORS = ['#0d6efd', '#198754', '#ffc107', '#fd7e14', '#6f42c1', '#dc3545']; 

const DashboardStats = () => {
  // State for data, loading status, and errors
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch deals and contacts data when the component mounts
  useEffect(() => {
    setAuthToken(localStorage.getItem('token')); 

    const fetchData = async () => {
      setLoading(true);
      setError(''); 
      try {
        // Fetch deals and contacts data concurrently from their respective API endpoints
        const [dealsRes, contactsRes] = await Promise.all([
          axios.get('/api/deals'), 
          axios.get('/api/contacts')
        ]);
        
        setDeals(dealsRes.data);
        setContacts(contactsRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data", err.response?.data || err.message);
        setError("Could not load dashboard data. Please ensure the backend is running and you are logged in."); 
      } finally {
        setLoading(false); 
      }
    };
    fetchData();
  }, []); // Runs only once on mount

  // Calculate statistics using useMemo
  const stats = useMemo(() => {
    // Filter deals to find open ones (not Won or Lost)
    const openDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
    // Filter deals that are Won
    const wonDeals = deals.filter(d => d.stage === 'Won');
    
    // --- FINAL FIX: Use parseFloat for guaranteed numeric summation ---
    const calculateSum = (dealArray) => {
        return dealArray.reduce((sum, deal) => {
            // Use parseFloat to convert string/numeric values to a number, defaulting to 0 if invalid (NaN)
            const dealValue = parseFloat(deal.value) || 0;
            return sum + dealValue;
        }, 0);
    };
    
    const totalPipelineValue = calculateSum(openDeals);
    const totalWonValue = calculateSum(wonDeals);
    // ----------------------------------------------------------------

    // Count lost deals
    const lostDealsCount = deals.filter(d => d.stage === 'Lost').length;

    // Group open deals by their stage for the chart
    const dealsByStage = openDeals.reduce((acc, deal) => {
      const stage = deal.stage;
      acc[stage] = (acc[stage] || 0) + 1; 
      return acc;
    }, {});

    // Format data for the Recharts PieChart component
    const chartData = Object.keys(dealsByStage)
                          .map(name => ({ name, value: dealsByStage[name] }))
                          .sort((a, b) => b.value - a.value); 

    // Return the calculated statistics
    return {
      totalContacts: contacts.length,
      openDealsCount: openDeals.length,
      totalPipelineValue,
      wonDealsCount: wonDeals.length,
      totalWonValue,
      lostDealsCount,
      chartData,
    };
  }, [deals, contacts]); // Recalculate only if deals or contacts change

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

   if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  // Render the dashboard content
  return (
    <>
      {/* Row for Statistic Cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card bg="primary" text="white" className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title><i className="bi bi-people-fill me-2"></i>Total Contacts</Card.Title>
              <Card.Text as="h2" className="fw-bold">{stats.totalContacts}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card bg="info" text="dark" className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title><i className="bi bi-folder-fill me-2"></i>Open Deals</Card.Title>
              <Card.Text as="h2" className="fw-bold">{stats.openDealsCount}</Card.Text>
              {/* CURRENCY FIX: Changed $ to ₹ */}
              <Badge pill bg="dark">₹{stats.totalPipelineValue.toLocaleString()}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card bg="success" text="white" className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title><i className="bi bi-check-circle-fill me-2"></i>Deals Won</Card.Title>
              <Card.Text as="h2" className="fw-bold">{stats.wonDealsCount}</Card.Text>
              {/* CURRENCY FIX: Changed $ to ₹ */}
              <Badge pill bg="light" text="success">₹{stats.totalWonValue.toLocaleString()}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card bg="danger" text="white" className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title><i className="bi bi-x-octagon-fill me-2"></i>Deals Lost</Card.Title>
              <Card.Text as="h2" className="fw-bold">{stats.lostDealsCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row for Chart and Activity Feed */}
      <Row className="g-3">
        {/* Pie Chart Column */}
        <Col lg={7}>
          <Card className="shadow-sm h-100">
             <Card.Header as="h5">Open Deals by Stage</Card.Header>
            <Card.Body>
              {/* Conditional rendering: show chart or message */}
              {stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={stats.chartData}
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={120} 
                      fill="#8884d8" 
                      labelLine={false} 
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {/* Apply colors to each segment */}
                      {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    {/* Tooltip on hover */}
                    <Tooltip formatter={(value) => `${value} deals`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert variant="secondary" className="text-center">No open deals data available for the chart.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Activity Feed Column */}
        <Col lg={5}>
          <Card className="shadow-sm h-100">
             <Card.Header as="h5"><i className="bi bi-list-task me-2"></i>Recent Activity</Card.Header>
            <Card.Body className="p-0"> 
               <ActivityFeed /> 
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardStats;