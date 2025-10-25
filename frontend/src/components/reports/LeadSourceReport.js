import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Spinner, Alert, Card, Row, Col, Button } from 'react-bootstrap'; // <-- Added Button
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import setAuthToken from '../../utils/setAuthToken';
import { format } from 'date-fns'; // For timestamp in filename

// Define colors for the bar chart segments
const BAR_COLORS = ['#0d6efd', '#6f42c1', '#198754', '#ffc107', '#fd7e14', '#dc3545', '#6c757d'];

// --- Helper Function to Download CSV ---
const downloadCSV = (data, filename = 'report.csv') => {
    if (!data || data.length === 0) {
        alert("No data available to download.");
        return;
    }

    // Define CSV Headers based on data keys (assuming consistent keys)
    const headers = Object.keys(data[0]);
    // Convert array of objects to CSV string
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            // Escape commas and quotes within cell data
            let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
            cell = cell.includes(',') || cell.includes('"') || cell.includes('\n') ? `"${cell.replace(/"/g, '""')}"` : cell;
            return cell;
        }).join(',')) // Join cells for each row
    ].join('\n'); // Join rows

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
    } else {
        alert("CSV download is not supported in this browser.");
    }
};
// ------------------------------------


const LeadSourceReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); setError(''); setAuthToken(localStorage.getItem('token'));
            try {
                const res = await axios.get('/api/performance/lead-source-summary');
                setData(res.data);
            } catch (err) {
                setError('Failed to load lead source report.'); console.error(err);
            } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    // --- Download Handler ---
    const handleDownload = () => {
        // Generate a filename with a timestamp
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        downloadCSV(data, `lead_source_summary_${timestamp}.csv`);
    };
    // -----------------------

    if (loading) return <div className="text-center mt-3"><Spinner animation="border" /> Loading...</div>;
    if (error) return <Alert variant="danger" className="mt-3">{error}</Alert>;
    if (data.length === 0) return <Alert variant="info" className="mt-3">No data for report.</Alert>;

    return (
        <Card className="mt-4 shadow-sm">
            <Card.Header as="h4" className="d-flex justify-content-between align-items-center">
                <span><i className="bi bi-pie-chart-fill me-2"></i>Contacts by Lead Source</span>
                {/* --- Download Button --- */}
                <Button variant="outline-success" size="sm" onClick={handleDownload} disabled={data.length === 0}>
                    <i className="bi bi-download me-2"></i>Download CSV
                </Button>
                {/* --------------------- */}
            </Card.Header>
            <Card.Body>
                <Row>
                    {/* Bar Chart Column */}
                    <Col md={8} className="mb-3 mb-md-0">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false}/>
                                <YAxis dataKey="source" type="category" width={100} />
                                <Tooltip formatter={(value) => `${value} contacts`} />
                                <Legend />
                                <Bar dataKey="count" name="Number of Contacts">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Col>
                    {/* Data Table Column */}
                    <Col md={4}>
                        <h5>Summary Table</h5>
                        <Table striped bordered hover size="sm">
                            <thead className="table-light"><tr><th>Source</th><th>Count</th></tr></thead>
                            <tbody>
                                {data.map((item) => (<tr key={item.source}><td>{item.source || 'Unknown'}</td><td>{item.count}</td></tr>))}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default LeadSourceReport;