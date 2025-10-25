const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DealSchema = new Schema({
  // The user who owns this deal
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  // The contact this deal is associated with
  contact: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: Number,
    default: 0,
  },
  // This is your sales pipeline
  stage: {
    type: String,
    enum: ['Lead', 'Prospecting', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'Lead',
  },
  closeDate: {
    type: Date, // The expected date this deal will close
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Deal', DealSchema);