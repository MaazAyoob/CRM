import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import setAuthToken from '../../utils/setAuthToken';
// Import necessary components
import { Table, Button, Modal, Form, Alert, Spinner, Row, Col, InputGroup, Card, Badge, ButtonGroup } from 'react-bootstrap';
// Import Modals for related activities
import ContactTasksModal from './ContactTasksModal';
import ContactAppointmentsModal from './ContactAppointmentsModal';
import DealManagementModal from '../deals/DealManagementModal'; 

// --- Helper for Sorting Table Headers ---
const SortableHeader = ({ children, column, sortConfig, setSortConfig, className = '' }) => {
    const isSorted = sortConfig.key === column;
    const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : '';
    const requestSort = () => {
        let direction = 'ascending';
        if (isSorted && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key: column, direction });
    };
    return <th onClick={requestSort} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} className={className}>{children}{directionIcon}</th>;
};


// --- Main Contacts Component ---
const Contacts = () => {
    // --- State Variables ---
    const [allContacts, setAllContacts] = useState([]);
    const [users, setUsers] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(''); 

    // Contact Add/Edit Modal State
    const [showContactModal, setShowContactModal] = useState(false);
    const [isNewContact, setIsNewContact] = useState(true);
    const [modalError, setModalError] = useState(''); 

    // Activity Modal States
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedContactForTasks, setSelectedContactForTasks] = useState(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [selectedContactForAppt, setSelectedContactForAppt] = useState(null);
    // Deal Modal State
    const [showDealModal, setShowDealModal] = useState(false);
    const [selectedContactForDeal, setSelectedContactForDeal] = useState(null); 

    // State for the Add/Edit Contact form data
    const [formData, setFormData] = useState({
        _id: '', name: '', email: '', phone: '', company: '',
        unitType: 'Other', projectSuggestion: '', remark: '', teamLead: '',
        leadSource: 'Other',
    });

    // Sorting and Filtering States
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
    const [filterName, setFilterName] = useState('');
    const [filterStage, setFilterStage] = useState(''); 
    const [filterSource, setFilterSource] = useState('');

    const [expandedRowId, setExpandedRowId] = useState(null);

    // Destructure formData
    const { _id, name, email, phone, company, unitType, projectSuggestion, remark, teamLead, leadSource } = formData; 

    // --- Data Fetching ---
    const fetchContactsAndUsers = async () => {
        setLoading(true); setError(''); setAuthToken(localStorage.getItem('token'));
        try {
            const [contactsRes, usersRes] = await Promise.all([
                axios.get('/api/contacts'),
                axios.get('/api/admin/users').catch(err => {
                    if (err.response && err.response.status === 403) { return { data: [] }; } throw err;
                })
            ]);
            setAllContacts(contactsRes.data); setUsers(usersRes.data);
        } catch (err) {
            console.error("Error fetching data:", err); setError('Error fetching data.'); setAllContacts([]); setUsers([]);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchContactsAndUsers(); }, []);

    // --- Filtering and Sorting Logic ---
    const filteredAndSortedContacts = useMemo(() => {
        let processedContacts = [...allContacts];
        // Filtering logic using local filter states
        if (filterName) processedContacts = processedContacts.filter(c => c.name.toLowerCase().includes(filterName.toLowerCase()));
        if (filterStage) processedContacts = processedContacts.filter(c => c.leadStage === filterStage);
        if (filterSource) processedContacts = processedContacts.filter(c => c.leadSource === filterSource);
        // Sorting logic
        if (sortConfig.key !== null) {
            processedContacts.sort((a, b) => {
                const keyA = String(a[sortConfig.key] || '').toLowerCase(); const keyB = String(b[sortConfig.key] || '').toLowerCase();
                if (keyA < keyB) return sortConfig.direction === 'ascending' ? -1 : 1; if (keyA > keyB) return sortConfig.direction === 'ascending' ? 1 : -1; return 0;
            });
        } return processedContacts;
    }, [allContacts, sortConfig, filterName, filterStage, filterSource]);

    // --- Modal Handlers ---
    const handleCloseContactModal = () => { // Close Contact Modal
        setShowContactModal(false); setModalError('');
        setFormData({ _id: '', name: '', email: '', phone: '', company: '', unitType: 'Other', projectSuggestion: '', remark: '', teamLead: '', leadSource: 'Other' });
    };
    const handleShowAddContact = () => { // Show Add Contact Modal
        setIsNewContact(true);
        setFormData({ _id: '', name: '', email: '', phone: '', company: '', unitType: 'Other', projectSuggestion: '', remark: '', teamLead: '', leadSource: 'Other' });
        setShowContactModal(true);
    };
    const handleShowEditContact = (contact) => { // Show Edit Contact Modal
        setIsNewContact(false);
        setFormData({ _id: contact._id || '', name: contact.name || '', email: contact.email || '', phone: contact.phone || '', company: contact.company || '', unitType: contact.unitType || 'Other', projectSuggestion: contact.projectSuggestion || '', remark: contact.remark || '', teamLead: contact.teamLead?._id || '', leadSource: contact.leadSource || 'Other' });
        setShowContactModal(true);
    };
    const handleShowTasks = (contact) => { setSelectedContactForTasks(contact); setShowTaskModal(true); }; // Show Tasks Modal
    const handleCloseTasks = () => { setShowTaskModal(false); setSelectedContactForTasks(null); }; // Close Tasks Modal
    const handleShowAppointments = (contact) => { setSelectedContactForAppt(contact); setShowAppointmentModal(true); }; // Show Appointments Modal
    const handleCloseAppointments = () => { setShowAppointmentModal(false); setSelectedContactForAppt(null); }; // Close Appointments Modal
    const handleShowDealCreation = (contact) => { setSelectedContactForDeal(contact); setShowDealModal(true); }; // Show Deal Modal
    const handleCloseDealCreation = () => { setShowDealModal(false); setSelectedContactForDeal(null); }; // Close Deal Modal
    const handleDealUpdate = () => { fetchContactsAndUsers(); }; // Function to refresh data after deal created
    const toggleExpandRow = (contactId) => { setExpandedRowId(prevId => prevId === contactId ? null : contactId); }; // Toggle remark expansion

    // --- Form Input Handler ---
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // --- Contact Form Submission (Add/Edit) ---
    const onContactSubmit = async (e) => {
        e.preventDefault(); setModalError(''); setAuthToken(localStorage.getItem('token'));
        const contactPayload = { name, email, phone, company, unitType, projectSuggestion, remark, teamLead: teamLead || null, leadSource }; 
        try { 
            if (isNewContact) { await axios.post('/api/contacts', contactPayload); } 
            else { await axios.put(`/api/contacts/${_id}`, contactPayload); } 
            fetchContactsAndUsers(); handleCloseContactModal();
        } catch (err) { console.error("Error saving contact:", err.response?.data || err.message); setModalError(err.response?.data?.msg || 'Failed to save.'); }
    };

    // --- Delete Contact Handler (FIXED) ---
    const handleDeleteContact = async (id) => {
        if (window.confirm('Delete this contact permanently?')) {
            setError(''); 
            try {
                // CRITICAL FIX: Ensure token is set immediately before the request
                setAuthToken(localStorage.getItem('token')); 
                
                await axios.delete(`/api/contacts/${id}`); // Send DELETE request
                
                fetchContactsAndUsers(); // Refresh table data
            } catch (err) {
                console.error("Error deleting contact:", err.response?.data || err.message);
                
                // Provide more informative error based on status code
                if (err.response?.status === 401 || err.response?.status === 403) {
                     setError("Authorization Failed. Ensure you own this contact or are an Admin.");
                } else {
                     setError(err.response?.data?.msg || 'Failed to delete contact. Check console.'); 
                }
            }
        }
    };

    // --- WhatsApp Click Handler (FIXED) ---
    const handleWhatsApp = (contact) => {
        if (!contact.phone) { alert("Contact has no phone number."); return; }
        let phoneNumber = contact.phone.replace(/[\s-()]/g, ''); 
        if (!phoneNumber.startsWith('+')) { alert("WhatsApp requires international format (e.g., +91). Please edit contact."); return; }
        window.open(`https://wa.me/${phoneNumber}`, '_blank');
    };
    
    // Helper function for Stage Badge color (Used in Mobile Card View)
    const getStageBadgeColor = (stage) => {
      switch (stage) {
        case 'New': return 'secondary'; case 'Contacted': return 'info'; case 'Visit Scheduled': return 'primary'; case 'Negotiation': return 'warning'; case 'Won': return 'success'; case 'Lost': return 'danger'; default: return 'light';
      }
    };


    // --- Render Component UI ---
    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" role="status"><span className="visually-hidden">Loading contacts...</span></Spinner>
                <p className="mt-2">Loading contacts...</p>
            </div>
        );
    }

    return (
        <>
            {/* Header Row */}
            <Row className="align-items-center my-4">
                <Col xs={12} md={6}>
                    <h2>Your Contacts ({filteredAndSortedContacts.length} / {allContacts.length})</h2>
                </Col>
                <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
                    <Button variant="primary" onClick={handleShowAddContact}>
                        <i className="bi bi-plus-circle me-2"></i>Add Contact
                    </Button>
                </Col>
            </Row>

            {/* Page Error Alert */}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {/* Filter Inputs Row */}
            <Row className="mb-3 g-3">
                <Col xs={12} sm={6} md={4}><InputGroup size="sm"><InputGroup.Text><i className="bi bi-search me-1"></i>Name:</InputGroup.Text><Form.Control type="text" placeholder="Filter..." value={filterName} onChange={(e) => setFilterName(e.target.value)} aria-label="Filter by name"/></InputGroup></Col>
                <Col xs={12} sm={6} md={4}><InputGroup size="sm"><InputGroup.Text>Stage:</InputGroup.Text><Form.Select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} aria-label="Filter by stage"><option value="">All Stages</option><option>New</option><option>Contacted</option><option>Visit Scheduled</option><option>Negotiation</option><option>Won</option><option>Lost</option></Form.Select></InputGroup></Col>
                <Col xs={12} md={4}><InputGroup size="sm"><InputGroup.Text>Source:</InputGroup.Text><Form.Select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} aria-label="Filter by source"><option value="">All Sources</option><option>Website</option><option>Referral</option><option>Advertisement</option><option>Social Media</option><option>Walk-in</option><option>Phone Inquiry</option><option>Other</option></Form.Select></InputGroup></Col>
            </Row>


            {/* --- 1. Desktop Table View (Hidden below md breakpoint) --- */}
            <div className="d-none d-md-block table-responsive">
                <Table striped bordered hover size="sm" className="align-middle shadow-sm contacts-table">
                    <thead className="table-dark" style={{ fontSize: '0.9rem' }}>
                        <tr>
                             <th style={{ width: '40px' }} aria-label="Expand Row"></th>
                             <SortableHeader column="name" sortConfig={sortConfig} setSortConfig={setSortConfig}>Name</SortableHeader>
                             <SortableHeader column="phone" sortConfig={sortConfig} setSortConfig={setSortConfig}>Phone</SortableHeader>
                             <SortableHeader column="projectSuggestion" sortConfig={sortConfig} setSortConfig={setSortConfig} className="d-none d-lg-table-cell">Project</SortableHeader>
                             <SortableHeader column="leadStage" sortConfig={sortConfig} setSortConfig={setSortConfig}>Stage</SortableHeader>
                             <SortableHeader column="leadSource" sortConfig={sortConfig} setSortConfig={setSortConfig} className="d-none d-md-table-cell">Source</SortableHeader>
                             <th className="d-none d-lg-table-cell">Lead</th>
                             <th className="d-none d-xl-table-cell">Remark Snippet</th>
                             <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedContacts.length > 0 ? (
                             filteredAndSortedContacts.map((contact) => (
                                <React.Fragment key={contact._id + '-table'}>
                                    <tr>
                                        {/* Expand Button Cell */}
                                        <td>{contact.remark && (<Button variant="link" size="sm" onClick={() => toggleExpandRow(contact._id)} title={expandedRowId === contact._id ? "Collapse" : "Expand"} aria-expanded={expandedRowId === contact._id} className="p-0 border-0 link-secondary"><i className={`bi ${expandedRowId === contact._id ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i></Button>)}</td>
                                        {/* Data Cells */}
                                        <td className="fw-bold">{contact.name}</td>
                                        <td>{contact.phone || '-'}</td>
                                        <td className="d-none d-lg-table-cell">{contact.projectSuggestion || '-'}</td>
                                        <td>{contact.leadStage}</td>
                                        <td className="d-none d-md-table-cell">{contact.leadSource || '-'}</td>
                                        <td className="d-none d-lg-table-cell">{contact.teamLead?.name || 'N/A'}</td>
                                        <td className="d-none d-xl-table-cell" style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.remark || '-'}</td>
                                        <td className="text-nowrap">
                                            {/* Action Buttons */}
                                            <Button variant="outline-primary" size="sm" className="me-1 px-2" href={`tel:${contact.phone}`} disabled={!contact.phone} title="Call"><i className="bi bi-telephone"></i></Button>
                                            <Button variant="outline-success" size="sm" className="me-1 px-2" onClick={() => handleWhatsApp(contact)} disabled={!contact.phone} title="WhatsApp"><i className="bi bi-whatsapp"></i></Button>
                                            <Button variant="outline-warning" size="sm" className="me-1 px-2" onClick={() => handleShowDealCreation(contact)} title="Add Deal"><i className="bi bi-currency-dollar"></i></Button>
                                            <Button variant="outline-info" size="sm" className="me-1 px-2" onClick={() => handleShowAppointments(contact)} title="Appointments"><i className="bi bi-calendar-check"></i></Button>
                                            <Button variant="outline-info" size="sm" className="me-1 px-2" onClick={() => handleShowTasks(contact)} title="Tasks"><i className="bi bi-list-check"></i></Button>
                                            <Button variant="outline-secondary" size="sm" className="me-1 px-2" onClick={() => handleShowEditContact(contact)} title="Edit"><i className="bi bi-pencil-square"></i></Button>
                                            <Button variant="outline-danger" size="sm" className="px-2" onClick={() => handleDeleteContact(contact._id)} title="Delete"><i className="bi bi-trash"></i></Button>
                                        </td>
                                    </tr>
                                    {/* Expanded Row for Table View */}
                                    {expandedRowId === contact._id && (
                                        <tr className="bg-light contact-remark-expanded"><td></td><td colSpan="8" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '15px' }}><strong>Full Remark:</strong><br />{contact.remark}</td></tr>
                                    )}
                                </React.Fragment>
                            ))
                         ) : (
                            <tr><td colSpan="9" className="text-center text-muted fst-italic py-3">No contacts found.</td></tr>
                         )}
                    </tbody>
                </Table>
            </div>
            {/* --- End Desktop Table View --- */}


            {/* --- 2. Mobile Card View (Visible below md breakpoint) --- */}
            <div className="d-md-none">
                {filteredAndSortedContacts.length > 0 ? (
                    filteredAndSortedContacts.map((contact) => (
                        <Card key={contact._id + '-card'} className="mb-3 shadow-sm">
                            <Card.Header className="d-flex justify-content-between align-items-center p-2"><Card.Title as="h6" className="mb-0 fw-bold">{contact.name}</Card.Title><Badge pill bg={getStageBadgeColor(contact.leadStage)}>{contact.leadStage}</Badge></Card.Header>
                            <Card.Body className="p-2">
                                {/* Display key info - stack vertically */}
                                {contact.phone && <div className="mb-1"><i className="bi bi-telephone-fill me-2 text-primary"></i>{contact.phone}</div>}
                                {contact.email && <div className="mb-1 small"><i className="bi bi-envelope-fill me-2 text-secondary"></i>{contact.email}</div>}
                                {contact.projectSuggestion && <div className="mb-1 small text-muted"><i className="bi bi-building me-2"></i>{contact.projectSuggestion}</div>}
                                {contact.leadSource && <div className="mb-1 small text-muted"><i className="bi bi-signpost-split me-2"></i>{contact.leadSource}</div>}
                                {contact.remark && <div className="mb-2 small fst-italic text-muted" style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}><i className="bi bi-chat-left-text me-2"></i>{contact.remark}</div>}

                                {/* Action Buttons for Card View */}
                                <div className="mt-2 text-center border-top pt-2">
                                    <ButtonGroup size="sm">
                                        <Button variant="outline-primary" href={`tel:${contact.phone}`} disabled={!contact.phone} title="Call"><i className="bi bi-telephone"></i></Button>
                                        <Button variant="outline-success" onClick={() => handleWhatsApp(contact)} disabled={!contact.phone} title="WhatsApp"><i className="bi bi-whatsapp"></i></Button>
                                        <Button variant="outline-warning" onClick={() => handleShowDealCreation(contact)} title="Add Deal"><i className="bi bi-currency-dollar"></i></Button>
                                        <Button variant="outline-info" onClick={() => handleShowAppointments(contact)} title="Appointments"><i className="bi bi-calendar-check"></i></Button>
                                        <Button variant="outline-info" onClick={() => handleShowTasks(contact)} title="Tasks"><i className="bi bi-list-check"></i></Button>
                                        <Button variant="outline-secondary" onClick={() => handleShowEditContact(contact)} title="Edit"><i className="bi bi-pencil-square"></i></Button>
                                        <Button variant="outline-danger" onClick={() => handleDeleteContact(contact._id)} title="Delete"><i className="bi bi-trash"></i></Button>
                                    </ButtonGroup>
                                </div>
                            </Card.Body>
                        </Card>
                    ))
                ) : (
                    <Alert variant="secondary" className="text-center mt-3">No contacts found.</Alert>
                )}
            </div>


            {/* --- 3. Modals --- */}

            {/* Contact Add/Edit Modal (REMOVED REDUNDANT STAGE FIELD) */}
            <Modal show={showContactModal} onHide={handleCloseContactModal} size="lg" backdrop="static">
                <Modal.Header closeButton><Modal.Title>{isNewContact ? 'Add New Contact' : 'Edit Contact'}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={onContactSubmit}>
                        {modalError && <Alert variant="danger">{modalError}</Alert>}
                        <Row className="g-3">
                            {/* Personal/Company Details */}
                            <Form.Group as={Col} md="6" controlId="contactFormName"><Form.Label>Name *</Form.Label><Form.Control type="text" placeholder="Full Name" name="name" value={name} onChange={onChange} required /></Form.Group>
                            <Form.Group as={Col} md="6" controlId="contactFormEmail"><Form.Label>Email</Form.Label><Form.Control type="email" placeholder="email@example.com" name="email" value={email} onChange={onChange} /></Form.Group>
                            <Form.Group as={Col} md="6" controlId="contactFormPhone"><Form.Label>Phone</Form.Label><Form.Control type="text" placeholder="+91..." name="phone" value={phone} onChange={onChange} /><Form.Text className="text-muted">Incl. country code.</Form.Text></Form.Group>
                            <Form.Group as={Col} md="6" controlId="contactFormCompany"><Form.Label>Company</Form.Label><Form.Control type="text" placeholder="Company Name" name="company" value={company} onChange={onChange} /></Form.Group>
                            
                            <Col xs={12}><hr className="my-3"/></Col>
                            
                            {/* Real Estate Specifics */}
                            <Form.Group as={Col} md="6" controlId="contactFormLeadSource"><Form.Label>Lead Source</Form.Label><Form.Select name="leadSource" value={leadSource} onChange={onChange}> <option>Website</option><option>Referral</option><option>Advertisement</option><option>Social Media</option><option>Walk-in</option><option>Phone Inquiry</option><option>Other</option> </Form.Select></Form.Group>
                            <Form.Group as={Col} md="6" controlId="contactFormUnitType"><Form.Label>Unit Interest</Form.Label><Form.Select name="unitType" value={unitType} onChange={onChange}> <option>1BHK</option><option>2BHK</option><option>3BHK</option><option>Villa</option><option>Plot</option><option>Commercial</option><option>Other</option> </Form.Select></Form.Group>
                            <Form.Group as={Col} md="6" controlId="contactFormProject"><Form.Label>Project</Form.Label><Form.Control type="text" placeholder="e.g., 'Skyline'" name="projectSuggestion" value={projectSuggestion} onChange={onChange} /></Form.Group>
                            
                            {/* Team Lead and Remark */}
                            <Form.Group as={Col} md="6" controlId="contactFormTeamLead"><Form.Label>Team Lead</Form.Label><Form.Select name="teamLead" value={teamLead} onChange={onChange} disabled={users.length === 0}> <option value="">-- None --</option>{users.map(u => (<option key={u._id} value={u._id}>{u.name}</option>))} </Form.Select>{users.length === 0 && <Form.Text className="text-muted">Admin login required.</Form.Text>}</Form.Group>
                            <Form.Group as={Col} md="6" controlId="contactFormRemark"><Form.Label>Remark</Form.Label><Form.Control as="textarea" rows={1} placeholder="Note..." name="remark" value={remark} onChange={onChange} /></Form.Group>
                        </Row>
                        <div className="d-flex justify-content-end mt-4"><Button variant="outline-secondary" onClick={handleCloseContactModal} className="me-2">Cancel</Button><Button variant="primary" type="submit">{isNewContact ? 'Create Contact' : 'Save Changes'}</Button></div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Task Modal (Rendered only when needed) */}
            {selectedContactForTasks && ( <ContactTasksModal show={showTaskModal} handleClose={handleCloseTasks} contact={selectedContactForTasks} /> )}

            {/* Appointment Modal */}
            {selectedContactForAppt && ( <ContactAppointmentsModal show={showAppointmentModal} handleClose={handleCloseAppointments} contact={selectedContactForAppt} /> )}
            
            {/* Deal Management Modal */}
            {selectedContactForDeal && ( <DealManagementModal show={showDealModal} handleClose={handleCloseDealCreation} contact={selectedContactForDeal} onUpdate={handleDealUpdate} /> )}
        </>
    );
};

// Helper function for Stage Badge color
const getStageBadgeColor = (stage) => {
  switch (stage) {
    case 'New': return 'secondary'; case 'Contacted': return 'info'; case 'Visit Scheduled': return 'primary'; case 'Negotiation': return 'warning'; case 'Won': return 'success'; case 'Lost': return 'danger'; default: return 'light';
  }
};

export default Contacts;