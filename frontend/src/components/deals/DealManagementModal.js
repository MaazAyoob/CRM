import React, { useState } from 'react'; // FIXED: Removed '=>' and imported useState
import axios from 'axios';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import setAuthToken from '../../utils/setAuthToken';

const DealManagementModal = ({ show, handleClose, contact, onUpdate }) => {
    // --- State for the form ---
    const [formData, setFormData] = useState({
        name: '',
        value: 0,
        stage: 'Lead',
        closeDate: '',
    });
    const [modalError, setModalError] = useState('');
    const { name, value, stage, closeDate } = formData;

    // Reset form when modal opens/closes
    // FIXED: Using React.useEffect instead of React.useEffect
    React.useEffect(() => {
        if (!show) {
            setFormData({ name: '', value: 0, stage: 'Lead', closeDate: '' });
            setModalError('');
        }
    }, [show]); // ADDED 'show' to dependency array

    const onChange = (e) => {
        const { name, value, type } = e.target;
        // Handle number input specifically
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseFloat(value) : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');

        // Use strict check for name and check if value is less than or equal to zero
        if (!name || value <= 0 || isNaN(value)) {
            setModalError("Deal Name and a Value greater than 0 are required.");
            return;
        }

        setAuthToken(localStorage.getItem('token'));
        const dealPayload = {
            ...formData,
            contactId: contact._id, // Link to the specific contact
            value: parseFloat(value) // Ensure value is a number
        };

        try {
            await axios.post('/api/deals', dealPayload);
            handleClose(); // Close modal
            onUpdate(); // Trigger data refresh in parent component (Dashboard/Contacts)
        } catch (err) {
            setModalError(err.response?.data?.msg || 'Failed to create deal.');
            console.error("Deal Creation Error:", err.response?.data || err.message);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Create New Deal for {contact?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {modalError && <Alert variant="danger">{modalError}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                        {/* Deal Name */}
                        <Form.Group as={Col} xs={12} controlId="dealName">
                            <Form.Label>Deal Name *</Form.Label>
                            <Form.Control type="text" name="name" value={name} onChange={onChange} required placeholder="e.g., Green Valley Unit 3A" />
                        </Form.Group>
                        
                        {/* Deal Value */}
                        <Form.Group as={Col} md={6} controlId="dealValue">
                            <Form.Label>Deal Value ($) *</Form.Label>
                            {/* Set step="any" to allow decimals if needed, min="1" */}
                            <Form.Control type="number" name="value" value={value} onChange={onChange} required min="1" step="any" placeholder="e.g., 250000" />
                        </Form.Group>
                        
                        {/* Deal Stage */}
                        <Form.Group as={Col} md={6} controlId="dealStage">
                            <Form.Label>Stage</Form.Label>
                            <Form.Select name="stage" value={stage} onChange={onChange}>
                                <option value="Lead">Lead</option>
                                <option value="Prospecting">Prospecting</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                            </Form.Select>
                        </Form.Group>
                        
                        {/* Expected Close Date */}
                        <Form.Group as={Col} md={6} controlId="dealCloseDate">
                            <Form.Label>Expected Close Date</Form.Label>
                            <Form.Control type="date" name="closeDate" value={closeDate} onChange={onChange} />
                        </Form.Group>
                        
                        {/* Contact Read-only Display */}
                        <Form.Group as={Col} md={6} controlId="dealContact">
                            <Form.Label>Contact</Form.Label>
                            {/* Readonly input showing the contact's name */}
                            <Form.Control type="text" value={contact?.name || 'N/A'} readOnly disabled />
                        </Form.Group>
                    </Row>
                    {/* Buttons */}
                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="outline-secondary" onClick={handleClose} className="me-2">Cancel</Button>
                        <Button variant="success" type="submit">Create Deal</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default DealManagementModal;