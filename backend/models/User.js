const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
  },
  password: {
    type: String,
    required: true,
  },
  // This is the key for "Admin Access"
  role: {
    type: String,
    enum: ['user', 'admin'], // Defines the only possible roles
    default: 'user',        // All new signups are 'user' by default
  },

  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team', // Links this user to a Team document
    default: null // Users don't belong to a team by default
  },


  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);