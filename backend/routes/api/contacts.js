// backend/routes/api/contacts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Middleware & Models
const auth = require('../../middleware/auth'); 
const Contact = require('../../models/Contact'); 
// Import models needed for cascading deletes
const Deal = require('../../models/Deal'); 
const Task = require('../../models/Task');
const Appointment = require('../../models/Appointment');
const logActivity = require('../../utils/logActivity'); 


// @route   POST /api/contacts
// @desc    Create a new contact
// @access  Private
router.post('/', auth, async (req, res) => {
  // Destructure all expected fields from the request body
  const { name, email, phone, company, unitType, projectSuggestion, remark, teamLead, leadSource } = req.body;

  if (!name) {
      return res.status(400).json({ msg: 'Name is required.' });
  }

  try {
    // 1. Create a new contact instance
    const newContact = new Contact({
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      // Note: leadStage is now managed by Deal model in UI, but kept in Contact model for filtering/old records
      // If the model still contains leadStage, you may need to explicitly include it here if the UI sends it. 
      // Assuming leadStage has been REMOVED from the Contact model and is ONLY on the Deal model.
      unitType: unitType || 'Other',
      projectSuggestion: projectSuggestion || '',
      remark: remark || '',
      teamLead: teamLead || null,
      leadSource: leadSource || 'Other',
      owner: req.user.id, 
    });

    // 2. Save the new contact document
    const contact = await newContact.save();

    // 3. Log this creation action
    await logActivity(
        req.user.id,
        'created_contact',
        'Contact',
        contact._id,
        { name: contact.name, source: contact.leadSource }
    );

    // 4. Send the newly created contact back
    res.status(201).json(contact);

  } catch (err) {
    console.error('Error creating contact:', err.message);
    res.status(500).send('Server Error');
  }
});

// ---

// @route   GET /api/contacts
// @desc    Get all contacts (filtered for non-admins)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // For debugging, the filter below is often commented out. Enable this for production security.
    if (req.user.role !== 'admin') {
       query.owner = req.user.id; // Only show contacts owned by the user
    }
    
    // Find contacts matching the query, populating the teamLead's name
    const contacts = await Contact.find(query)
      .populate('teamLead', 'name')
      .sort({ date: -1 });
      
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err.message);
    res.status(500).send('Server Error');
  }
});

// ---

// @route   PUT /api/contacts/:id
// @desc    Update an existing contact
// @access  Private
router.put('/:id', auth, async (req, res) => {
  // Destructure all possible fields to update
  const { name, email, phone, company, unitType, projectSuggestion, remark, teamLead, leadSource } = req.body; // leadStage removed

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Contact ID format.' });
  }

  // Build an object containing only the fields that were provided
  const contactFields = {};
  if (name !== undefined) contactFields.name = name;
  if (email !== undefined) contactFields.email = email;
  if (phone !== undefined) contactFields.phone = phone;
  if (company !== undefined) contactFields.company = company;
  // if (leadStage !== undefined) contactFields.leadStage = leadStage; // Removed
  if (unitType !== undefined) contactFields.unitType = unitType;
  if (projectSuggestion !== undefined) contactFields.projectSuggestion = projectSuggestion;
  if (remark !== undefined) contactFields.remark = remark;
  if (leadSource !== undefined) contactFields.leadSource = leadSource;
  if (teamLead !== undefined) contactFields.teamLead = teamLead || null;

  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) { return res.status(404).json({ msg: 'Contact not found' }); }
    // Security Check: Ensure the logged-in user owns the contact OR is an admin
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized to update this contact' });
    }

    // Store old values before update for logging purposes
    const oldValues = { name: contact.name, leadSource: contact.leadSource };

    // Find the contact by ID and update it
    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields },
      { new: true } // Return the updated document
    );

    // --- Log the update activity ---
    let logDetails = { name: contact.name };
    // Log specific field changes if they occurred
    if (contactFields.leadSource && contactFields.leadSource !== oldValues.leadSource) {
         logDetails.changed = 'leadSource';
         logDetails.from = oldValues.leadSource;
         logDetails.to = contactFields.leadSource;
    } else if (contactFields.name && contactFields.name !== oldValues.name) {
         logDetails.changed = 'name';
         logDetails.from = oldValues.name;
         logDetails.to = contactFields.name;
    } // Add more 'else if' blocks here to log other specific field changes

    await logActivity(req.user.id, 'updated_contact', 'Contact', contact._id, logDetails);
    // -----------------------------

    res.json(contact);

  } catch (err) {
    console.error('Error updating contact:', err.message);
    if (err.kind === 'ObjectId') { return res.status(404).json({ msg: 'Contact not found' }); }
    res.status(500).send('Server Error');
  }
});

// ---

// @route   DELETE /api/contacts/:id
// @desc    Delete a contact by ID (with cascading delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Contact ID format.' });
  }

  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) { return res.status(404).json({ msg: 'Contact not found' }); }
    // Security Check: Ensure the logged-in user owns the contact OR is an admin
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized to delete this contact' });
    }

    const contactId = req.params.id;
    const contactName = contact.name; 

    // --- CRITICAL FIX: CASCADING DELETE ---
    // 1. Delete all associated Deals
    await Deal.deleteMany({ contact: contactId });
    // 2. Delete all associated Tasks
    await Task.deleteMany({ contact: contactId });
    // 3. Delete all associated Appointments
    await Appointment.deleteMany({ contact: contactId });
    // ----------------------------------------

    // 4. Delete the Contact itself
    await Contact.findByIdAndDelete(contactId); 

    // 5. Log the delete activity
    await logActivity(req.user.id, 'deleted_contact', 'Contact', contactId, { name: contactName });

    res.json({ msg: 'Contact and all associated records removed successfully' });

  } catch (err) {
    console.error('Error deleting contact with cascade:', err.message);
    if (err.kind === 'ObjectId') { return res.status(404).json({ msg: 'Contact not found' }); }
    res.status(500).send('Server Error');
  }
});

// Export the router to be used in server.js
module.exports = router;