import express from 'express';
import Complain from '../models/Complain.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @routes POST /api/complaints/add
// @desc Register a new complain
// @access Public
router.post('/add', protect, async (req, res) => {
  const { name, phoneno: bodyPhoneno, description } = req.body;
  try {
    // determine phoneno: use provided or fallback to logged-in user's phone
    const phoneno = bodyPhoneno || req.user?.phoneno;

    // validation: required fields
    if (!name || !description || !phoneno) {
      return res.status(400).json({ message: 'name, description and phoneno are required' });
    }

    // (Allow multiple suggestions/complaints from same user)

    // create a new Complain associated with the user
    const complainData = {
      name,
      phoneno,
      description
    };
    if (req.user && req.user._id) complainData.createdBy = req.user._id;

    let complain = new Complain(complainData);
    await complain.save();

    res.status(201).json({
      complain,
      message: 'Complaint registered successfully'
    });

  } catch (error) {
    console.error('Complain save error:', error);
    // Handle duplicate-key error if an index exists in DB (e.g., code 11000)
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error: phone number already exists' });
    }
    // Handle validation errors from mongoose
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
});


// @routes GET /api/complaints
// @desc Get all complaints
// @access Public
router.get('/getAll', async (req, res) => {
  try {
    const complaints = await Complain.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


//export the router
export default router;