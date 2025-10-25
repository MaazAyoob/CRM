// backend/models/Activity.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
  // Reference to the User who performed the action
  user: {
    type: Schema.Types.ObjectId, // Stores the user's unique MongoDB ID
    ref: 'User', // Links this field to the 'User' collection/model
    required: true, // An activity must always have a user associated with it
  },
  // A short code describing what happened
  actionType: {
    type: String, // e.g., 'created_contact', 'updated_deal_stage', 'deleted_task'
    required: true, // This field is mandatory
    trim: true, // Removes extra whitespace
  },
  // Optional: The type of object the action relates to
  relatedModel: {
    type: String, // e.g., 'Contact', 'Deal', 'Task', 'User', 'Team'
    trim: true,
  },
  // Optional: The specific ID of the object the action relates to
  relatedId: {
    type: Schema.Types.ObjectId, // Stores the related object's unique MongoDB ID
  },
  // Optional: A flexible field to store extra details about the action
  details: {
    type: Schema.Types.Mixed, // Can store any type of data (object, string, array, etc.)
    // Example: { name: 'John Doe', changed: 'leadStage', from: 'New', to: 'Contacted' }
  },
  // The exact time the activity was logged
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set to the current time when created
  },
});

// Create and export the Mongoose model based on the schema
module.exports = mongoose.model('Activity', ActivitySchema);