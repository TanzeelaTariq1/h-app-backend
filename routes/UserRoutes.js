import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import {protect} from '../middleware/authMiddleware.js';

const router = express.Router();

// @routes POST /api/users/register
// @desc Register a new user
// @access Public
router.post('/register', async (req, res) => {
    const { name, phoneno, password,address } = req.body;
    try {
        //register a new user
        let user = await User.findOne({ phoneno });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        //create a new user
        user = new User({ name, phoneno, password,address });
        await user.save();

        //create a JWT PAYLOAD
        const payload = { user: { id: user._id, role: user.role } };
        //sign and send the token along with the user data
        jwt.sign(payload,
            process.env.JWT_SECRET,
            { expiresIn: '10h' },
            (err, token) => {
                if (err) throw err;
                //send the token and user data in the response
                res.status(201).json({
                    token,
                    user: { _id: user._id, name: user.name, phoneno: user.phoneno, address: user.address , role: user.role },
                    message: 'User registered successfully'
                });
            });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// @routes POST /api/users/login
// @desc Authenticate user
// @access Public
router.post('/login', async (req, res) => {
    console.log(req.body);
    const { phoneno , password } = req.body;
    try {
        //find the user by email
        let user = await User.findOne({ phoneno });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        //check if the password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        //create a JWT PAYLOAD
        const payload = { user: { id: user._id, role: user.role } };
        //sign and send the token along with the user data
        jwt.sign(payload,
            process.env.JWT_SECRET,
            { expiresIn: '10h' },
            (err, token) => {
                if (err) throw err;
                //send the token and user data in the response
                res.json({
                    token,
                    user: { _id: user._id, name: user.name, phoneno: user.phoneno, role: user.role }
                });
            });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }

})


// @routes GET /api/users/profile
// @desc Logged-in user's profile (Protected Route)
// @access Private
router.get('/profile', protect, async (req,res) => {
    res.json(req.user)
})

//export the router
export default router;