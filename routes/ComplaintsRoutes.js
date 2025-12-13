import express from 'express';
import Complain from '../models/Complain.js';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @routes POST /api/complaints/add
// @desc Register a new complain
// @access Public
router.post('/add', async (req, res) => {
    const { name, phoneno, description } = req.body;
    try {
        //create a new Complain
        let complain = new Complain({ name, phoneno, description });
        await complain.save();

        res.status(201).json({
            complain,
            message: 'Complaint registered successfully'
        });

    } catch (error) {
        console.error(error);
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