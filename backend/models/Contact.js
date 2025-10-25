const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  company: {
    type: String,
  },
  
  // --- REAL ESTATE FIELDS ---
  leadStage: {
    type: String,
    enum: ['New', 'Contacted', 'Visit Scheduled', 'Negotiation', 'Won', 'Lost'],
    default: 'New',
  },
  unitType: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', 'Villa', 'Plot', 'Commercial', 'Other'],
    default: 'Other',
  },
  projectSuggestion: {
    type: String,
    trim: true,
  },
  remark: {
    type: String,
    trim: true,
  },
  teamLead: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This links to a user (who is a team lead)
  },


  leadSource: {
    type: String,
    enum: ['Website', 'Referral', 'Advertisement', 'Social Media', 'Walk-in', 'Phone Inquiry', 'Other'],
    default: 'Other',
    trim: true,
  },
  // -------------------------

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Contact', ContactSchema);