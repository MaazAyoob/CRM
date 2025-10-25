const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  owner: { // The user who created the task
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  contact: { // The contact this task is for
    type: Schema.Types.ObjectId,
    ref: 'Contact',
  },
  content: { // The task itself
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  dueDate: {
    type: Date,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Task', TaskSchema);