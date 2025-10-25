const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Task = require('../../models/Task');
const Contact = require('../../models/Contact');

// @route   GET /api/tasks/:contactId
// @desc    Get all tasks for a specific contact
// @access  Private
router.get('/:contactId', auth, async (req, res) => {
  try {
    // Check if user owns the contact (security)
    const contact = await Contact.findById(req.params.contactId);
    if (!contact || contact.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    const tasks = await Task.find({ contact: req.params.contactId }).sort({ date: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/tasks/:contactId
// @desc    Create a task for a contact
// @access  Private
router.post('/:contactId', auth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.contactId);
    if (!contact || contact.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const newTask = new Task({
      content: req.body.content,
      dueDate: req.body.dueDate,
      contact: req.params.contactId,
      owner: req.user.id,
    });

    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/tasks/:taskId
// @desc    Update a task (e.g., mark as complete)
// @access  Private
router.put('/:taskId', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.taskId);
    if (!task || task.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    task.isCompleted = req.body.isCompleted;
    if (req.body.content) task.content = req.body.content;
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/tasks/:taskId
// @desc    Delete a task
// @access  Private
router.delete('/:taskId', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.taskId);
    if (!task || task.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    await Task.findByIdAndRemove(req.params.taskId);
    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;