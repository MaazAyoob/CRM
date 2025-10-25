// backend/utils/logActivity.js
const Activity = require('../models/Activity'); // Make sure Activity model exists

/**
 * Logs an activity to the database.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} actionType - A code describing the action (e.g., 'created_contact').
 * @param {string} [relatedModel] - The Mongoose model name related to the action (e.g., 'Contact').
 * @param {string} [relatedId] - The ObjectId of the related document.
 * @param {object} [details] - Any extra context or data about the action.
 */
const logActivity = async (userId, actionType, relatedModel = null, relatedId = null, details = {}) => {
  // Basic check to ensure required parameters are present
  if (!userId || !actionType) {
      console.error('Error logging activity: userId and actionType are required.');
      return; // Exit if essential info is missing
  }

  try {
    const activityData = {
      user: userId,
      actionType,
      relatedModel,
      relatedId,
      details,
    };
    const activity = new Activity(activityData);
    await activity.save();
    // console.log(`Activity logged: ${actionType} by User ${userId}`); // Optional: Logging confirmation
  } catch (error) {
    console.error('Error saving activity to database:', error);
    // Depending on requirements, you might want to handle this error more robustly
  }
};

module.exports = logActivity;