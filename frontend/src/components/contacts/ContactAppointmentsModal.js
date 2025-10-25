import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback if needed, though not strictly required here
import axios from 'axios';
// --- ADD Card TO THIS IMPORT ---
import { Modal, Button, ListGroup, Form, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import setAuthToken from '../../utils/setAuthToken';
import { format } from 'date-fns'; // For formatting dates/times

const ContactAppointmentsModal = ({ show, handleClose, contact }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false); // Toggle add form visibility

    // Form state for adding a new appointment
    const [newAppointmentData, setNewAppointmentData] = useState({
        title: '',
        appointmentTime: '', // Store as ISO string or handle conversion
        notes: '',
    });

    // Define fetchAppointments - wrap in useCallback if needed, but likely stable here
    const fetchAppointments = useCallback(async () => { // useCallback might be overkill here but satisfies linting if needed
        if (!contact?._id) return; // Don't fetch if no contact selected
        setLoading(true);
        setError('');
        setAuthToken(localStorage.getItem('token'));
        try {
            // Use the specific endpoint for contact appointments
            const res = await axios.get(`/api/appointments/contact/${contact._id}`);
            setAppointments(res.data);
        } catch (err) {
            setError('Failed to fetch appointments for this contact.');
            console.error("Fetch Appt Error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }, [contact]); // Dependency: re-fetch if contact changes

    // Fetch appointments when the modal becomes visible or the contact changes
    useEffect(() => {
        if (show && contact) {
            fetchAppointments();
        } else {
            // Reset when modal closes or contact is invalid
            setAppointments([]);
            setShowAddForm(false);
            setNewAppointmentData({ title: '', appointmentTime: '', notes: '' });
        }
        // --- ADD fetchAppointments to dependency array ---
    }, [show, contact, fetchAppointments]); // Re-run effect if show, contact, or fetchAppointments changes


    const handleInputChange = (e) => {
        setNewAppointmentData({ ...newAppointmentData, [e.target.name]: e.target.value });
    };

    const handleAddAppointment = async (e) => {
        e.preventDefault();
        setError('');
        if (!newAppointmentData.title || !newAppointmentData.appointmentTime) {
            setError("Title and Date/Time are required.");
            return;
        }

        try {
            setAuthToken(localStorage.getItem('token'));
            const payload = {
                ...newAppointmentData,
                contactId: contact._id,
            };
            await axios.post('/api/appointments', payload);
            fetchAppointments(); // Refresh the list
            setShowAddForm(false); // Hide the form
            setNewAppointmentData({ title: '', appointmentTime: '', notes: '' }); // Reset form
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to add appointment.');
            console.error("Add Appt Error:", err.response?.data || err.message);
        }
    };

    const handleDeleteAppointment = async (id) => {
        if (window.confirm('Delete this appointment?')) {
            setError('');
             try {
                setAuthToken(localStorage.getItem('token'));
                await axios.delete(`/api/appointments/${id}`);
                fetchAppointments(); // Refresh list
             } catch(err) {
                 setError(err.response?.data?.msg || 'Failed to delete appointment.');
                 console.error("Delete Appt Error:", err.response?.data || err.message);
             }
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Appointments for {contact?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                {/* Button to toggle Add Form */}
                {!showAddForm && (
                    <Button variant="primary" onClick={() => setShowAddForm(true)} className="mb-3">
                        <i className="bi bi-calendar-plus me-2"></i>Schedule New Appointment
                    </Button>
                )}

                {/* Add Appointment Form (Collapsible) */}
                {showAddForm && (
                    <Card className="mb-4 shadow-sm"> {/* Added shadow */}
                        <Card.Body>
                             <Card.Title as="h5">New Appointment</Card.Title> {/* Changed to h5 */}
                            <Form onSubmit={handleAddAppointment}>
                                <Row className="g-3">
                                    <Form.Group as={Col} md="6" controlId="apptTitle">
                                        <Form.Label>Title *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="title"
                                            value={newAppointmentData.title}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Property Viewing"
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group as={Col} md="6" controlId="apptTime">
                                        <Form.Label>Date & Time *</Form.Label>
                                        <Form.Control
                                            type="datetime-local" // Use datetime-local input
                                            name="appointmentTime"
                                            value={newAppointmentData.appointmentTime}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group as={Col} xs="12" controlId="apptNotes">
                                        <Form.Label>Notes</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            name="notes"
                                            value={newAppointmentData.notes}
                                            onChange={handleInputChange}
                                            placeholder="Optional details..."
                                        />
                                    </Form.Group>
                                </Row>
                                <div className="mt-3 text-end">
                                    <Button variant="outline-secondary" onClick={() => setShowAddForm(false)} className="me-2">Cancel</Button>
                                    <Button variant="success" type="submit">Save Appointment</Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                )}

                <hr />

                {/* List of Existing Appointments */}
                <h5>Scheduled Appointments</h5>
                {loading ? (
                    <div className="text-center"><Spinner animation="border" size="sm" /> Loading...</div>
                ) : appointments.length > 0 ? (
                    <ListGroup variant="flush">
                        {appointments.map(appt => (
                            <ListGroup.Item key={appt._id} className="d-flex justify-content-between align-items-center flex-wrap px-0 py-2"> {/* Reduced padding */}
                                <div>
                                    <span className="fw-bold">{appt.title}</span> - {' '}
                                    {/* Format date and time */}
                                    {format(new Date(appt.appointmentTime), 'Pp')} {/* 'Pp' = Medium date, Short time */}
                                    {appt.notes && <div className="text-muted small mt-1">Notes: {appt.notes}</div>}
                                </div>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteAppointment(appt._id)}
                                    className="mt-1 mt-md-0 ms-md-2" // Add margin for spacing
                                    title="Delete Appointment"
                                >
                                    <i className="bi bi-trash"></i>
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <p className="text-muted fst-italic">No appointments scheduled yet.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                 <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ContactAppointmentsModal;