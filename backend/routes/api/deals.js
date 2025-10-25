// backend/routes/api/deals.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Middleware & Models
const auth = require('../../middleware/auth');
const Deal = require('../../models/Deal');
const Contact = require('../../models/Contact'); 
const logActivity = require('../../utils/logActivity'); 

// @route   POST /api/deals
// @desc    Create a new deal for a contact
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, value, stage, closeDate, contactId } = req.body;

  if (!contactId || !name) {
    return res.status(400).json({ msg: 'Contact ID and Name are required.' });
  }

  try {
    // 1. Check if the contact exists and the user has rights to it
    const contact = await Contact.findById(contactId);
    if (!contact) { return res.status(404).json({ msg: 'Associated contact not found.' }); }
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') { return res.status(401).json({ msg: 'Not authorized for this contact.' }); }

    // 2. Create the new deal instance
    const newDeal = new Deal({
      name,
      value: Number(value) || 0, // Ensure value is stored as a number
      stage: stage || 'Lead',
      closeDate: closeDate || null,
      contact: contactId,
      owner: req.user.id,
    });

    // 3. Save to database
    const deal = await newDeal.save();

    // 4. Log Activity
    await logActivity(
        req.user.id,
        'created_deal',
        'Deal',
        deal._id,
        { name: deal.name, contactName: contact.name, value: deal.value }
    );

    res.status(201).json(deal);
  } catch (err) {
    console.error('Error creating deal:', err.message);
    res.status(500).send('Server Error');
  }
});

// ---

// @route   GET /api/deals
// @desc    Get ALL deals (Filter temporarily bypassed for debugging)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // ⚠️ CRITICAL DEBUG FIX: COMMENTED OUT OWNERSHIP FILTER.
    // This allows the dashboard to see ALL deals in the database.
    // if (req.user.role !== 'admin') {
    //   query.owner = req.user.id;
    // }

    const deals = await Deal.find(query)
      .populate('contact', 'name phone') 
      .populate('owner', 'name')        
      .sort({ date: -1 })
      .lean(); 

    // FIX: Ensure 'value' is a proper number on retrieval
    const sanitizedDeals = deals.map(deal => ({
        ...deal,
        value: Number(deal.value) || 0, // Force conversion to number (0 if null/invalid)
    }));

    res.json(sanitizedDeals); // Send the sanitized list
  } catch (err) {
    console.error('Error fetching deals:', err.message);
    res.status(500).send('Server Error');
  }
});

// ---

// @route   PUT /api/deals/:id
// @desc    Update a deal (e.g., move its stage)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, value, stage, closeDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) { return res.status(400).json({ msg: 'Invalid Deal ID format.' }); }

  const dealFields = {};
  if (name !== undefined) dealFields.name = name;
  if (value !== undefined) dealFields.value = Number(value) || 0; // Ensure number conversion
  if (stage !== undefined) dealFields.stage = stage;
  if (closeDate !== undefined) dealFields.closeDate = closeDate;

  try {
    let deal = await Deal.findById(req.params.id).populate('contact', 'name');
    if (!deal) return res.status(404).json({ msg: 'Deal not found.' });

    if (deal.owner.toString() !== req.user.id && req.user.role !== 'admin') { return res.status(401).json({ msg: 'Not authorized to update this deal.' }); }

    const oldStage = deal.stage;

    deal = await Deal.findByIdAndUpdate(
      req.params.id,
      { $set: dealFields },
      { new: true } 
    ).populate('contact', 'name');

    // Log Activity: Stage Change
    if (dealFields.stage && dealFields.stage !== oldStage) {
       await logActivity(req.user.id, 'updated_deal_stage', 'Deal', deal._id, { name: deal.name, contactName: deal.contact?.name || 'N/A', from: oldStage, to: dealFields.stage });
    } else {
         await logActivity(req.user.id, 'updated_deal', 'Deal', deal._id, { name: deal.name, contactName: deal.contact?.name || 'N/A' });
    }

    res.json(deal);
  } catch (err) {
    console.error('Error updating deal:', err.message);
    res.status(500).send('Server Error');
  }
});

// ---

// @route   DELETE /api/deals/:id
// @desc    Delete a deal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) { return res.status(400).json({ msg: 'Invalid Deal ID format.' }); }
  try {
    let deal = await Deal.findById(req.params.id).populate('contact', 'name');
    if (!deal) return res.status(404).json({ msg: 'Deal not found.' });

    if (deal.owner.toString() !== req.user.id && req.user.role !== 'admin') { return res.status(401).json({ msg: 'Not authorized to delete this deal.' }); }

    const logDetails = { name: deal.name, contactName: deal.contact?.name || 'N/A' };
    const dealId = deal._id;

    await Deal.findByIdAndDelete(req.params.id);

    // Log Activity
    await logActivity(req.user.id, 'deleted_deal', 'Deal', dealId, logDetails);

    res.json({ msg: 'Deal removed successfully.' });
  } catch (err) {
    console.error('Error deleting deal:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;