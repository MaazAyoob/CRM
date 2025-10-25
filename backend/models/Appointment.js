const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  owner: { // User who owns/scheduled the appointment
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contact: { // Contact the appointment is with
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
  },
  title: { // Purpose of the appointment (e.g., "Property Viewing", "Follow-up Call")
    type: String,
    required: true,
    trim: true,
  },
  appointmentTime: { // Date and Time of the appointment
    type: Date,
    required: true,
  },
  durationMinutes: { // Optional: Duration
    type: Number,
    default: 30,
  },
  notes: { // Optional notes about the appointment
    type: String,
    trim: true,
  },
  status: { // e.g., Scheduled, Completed, Cancelled
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
      default: 'Scheduled',
  },
  createdAt: { // When the appointment record was created
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);