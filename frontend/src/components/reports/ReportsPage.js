import React from 'react';
import LeadSourceReport from './LeadSourceReport'; // Import the specific report
import { Container } from 'react-bootstrap';
// Import other report components here in the future
// import ConversionRateReport from './ConversionRateReport';

const ReportsPage = () => {
  return (
    // Use Container for consistent padding
    <Container fluid className="mt-4"> {/* Use fluid for full width if desired */}
      <h2><i className="bi bi-clipboard-data-fill me-2"></i>Reports Dashboard</h2>
      <p className="text-muted">Analyze key metrics and performance data from your CRM.</p>
      <hr />

      {/* --- Add Report Components Below --- */}

      <LeadSourceReport />

      {/* Example: Add another report component later */}
      {/* <ConversionRateReport /> */}

    </Container>
  );
};

export default ReportsPage;