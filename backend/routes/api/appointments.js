const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // Standard auth
const Appointment = require('../../models/Appointment');
const Contact = require('../../models/Contact'); // To verify contact ownership
const logActivity = require('../../utils/logActivity'); // Log activity
const mongoose = require('mongoose'); // For ObjectId validation

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private
router.post('/', auth, async (req, res) => {
  const { contactId, title, appointmentTime, durationMinutes, notes, status } = req.body;

  // Basic Validation
  if (!contactId || !title || !appointmentTime) {
    return res.status(400).json({ msg: 'Contact, Title, and Appointment Time are required.' });
  }
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ msg: 'Invalid Contact ID format.' });
  }

  try {
    // Verify user owns the contact associated with the appointment
    const contact = await Contact.findById(contactId);
    if (!contact) {
        return res.status(404).json({ msg: 'Associated contact not found.' });
    }
    // Allow admins to create appointments for contacts they don't own
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized to create appointment for this contact.' });
    }

    const newAppointment = new Appointment({
      owner: req.user.id, // Logged-in user is the owner
      contact: contactId,
      title,
      appointmentTime,
      durationMinutes,
      notes,
      status: status || 'Scheduled', // Default status if not provided
    });

    const appointment = await newAppointment.save();

    // Log activity
    await logActivity(
        req.user.id,
        'created_appointment',
        'Appointment',
        appointment._id,
        { contactName: contact.name, title: appointment.title, time: appointment.appointmentTime }
    );

    res.status(201).json(appointment);
  } catch (err) {
    console.error('Error creating appointment:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments for the logged-in user (or all if admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.owner = req.user.id; // Non-admins only see their own appointments
    }

    const appointments = await Appointment.find(query)
      .populate('contact', 'name phone') // Populate contact name and phone
      .populate('owner', 'name') // Populate owner name (useful for admins)
      .sort({ appointmentTime: 1 }); // Sort by upcoming time first

    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/appointments/contact/:contactId
// @desc    Get all appointments for a specific contact (if user owns contact or is admin)
// @access  Private
router.get('/contact/:contactId', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.contactId)) {
        return res.status(400).json({ msg: 'Invalid Contact ID format.' });
    }
    try {
        const contact = await Contact.findById(req.params.contactId);
        if (!contact) {
            return res.status(404).json({ msg: 'Associated contact not found.' });
        }
        if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
             return res.status(401).json({ msg: 'Not authorized to view appointments for this contact.' });
        }

        const appointments = await Appointment.find({ contact: req.params.contactId })
            .populate('owner', 'name')
            .sort({ appointmentTime: -1 }); // Sort by most recent first for contact history

        res.json(appointments);
    } catch (err) {
        console.error('Error fetching contact appointments:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/appointments/:id
// @desc    Update an appointment (e.g., change time, status, notes)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, appointmentTime, durationMinutes, notes, status } = req.body;
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Appointment ID format.' });
    }

    // Build fields object
    const appointmentFields = {};
    if (title !== undefined) appointmentFields.title = title;
    if (appointmentTime !== undefined) appointmentFields.appointmentTime = appointmentTime;
    if (durationMinutes !== undefined) appointmentFields.durationMinutes = durationMinutes;
    if (notes !== undefined) appointmentFields.notes = notes;
    if (status !== undefined) appointmentFields.status = status;

    try {
        let appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found.' });
        }

        // Authorization check: Must own the appointment or be admin
        if (appointment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized to update this appointment.' });
        }

        const oldStatus = appointment.status; // Store old status for logging

        appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { $set: appointmentFields },
            { new: true } // Return the updated document
        ).populate('contact', 'name'); // Populate contact name for logging detail

        // Log activity (example for status change)
        if (appointmentFields.status && appointmentFields.status !== oldStatus) {
            await logActivity(
                req.user.id,
                'updated_appointment_status',
                'Appointment',
                appointment._id,
                { contactName: appointment.contact?.name || 'N/A', title: appointment.title, from: oldStatus, to: appointmentFields.status }
            );
        } else {
             await logActivity(
                req.user.id,
                'updated_appointment',
                'Appointment',
                appointment._id,
                { contactName: appointment.contact?.name || 'N/A', title: appointment.title }
            );
        }

        res.json(appointment);
    } catch (err) {
        console.error('Error updating appointment:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete an appointment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Appointment ID format.' });
    }
    try {
        const appointment = await Appointment.findById(req.params.id)
                                          .populate('contact', 'name'); // Get contact name for logging
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found.' });
        }

        // Authorization check
        if (appointment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized to delete this appointment.' });
        }

        const logDetails = { contactName: appointment.contact?.name || 'N/A', title: appointment.title, time: appointment.appointmentTime };

        await Appointment.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity(req.user.id, 'deleted_appointment', 'Appointment', req.params.id, logDetails);

        res.json({ msg: 'Appointment deleted successfully.' });
    } catch (err) {
        console.error('Error deleting appointment:', err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;