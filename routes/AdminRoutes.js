import express from 'express';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @routes GET /api/admin/users
// @desc GET all users (admin only)
// @access Private/Admin

router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); //Get all users and exclude the password field
        if (!users) {
            return res.status(404).json({ message: 'No users found' });
        }
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
        console.error(error);
    }
})

// @routes POST /api/admin/users
// @desc ADD new users (admin only)
// @access Private/Admin
router.post('/users', protect, admin, async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const newUser = new User({
            name,
            email,
            password,
            role: role || 'customer', //default role is customer
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: newUser });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
        console.error(error);
    }
})




// @routes PUT /api/admin/users/:id
// @desc Update  users (admin only)- Name , Email, Role
// @access Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role; //update the role if provided
            const updatedUser =  await user.save();
            res.status(200).json({ message: 'User updated successfully', updatedUser });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
        console.error(error);
    }
})


// @routes DELETE /api/admin/users/:id
// @desc DELETE users (admin only)  
// @access Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.status(200).json({ message: 'User removed successfully' });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
        console.error(error);
    }
})



export default router;