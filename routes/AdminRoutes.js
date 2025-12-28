import express from 'express';
import User from '../models/User.js'; // ✅ صرف یہاں سے import کریں
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @routes GET /api/admin/users
// @desc GET all users (admin only)
// @access Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); // Get all users and exclude the password field
        if (!users || users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No users found' 
            });
        }
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @routes POST /api/admin/users
// @desc ADD new users (admin only)
// @access Private/Admin
router.post('/users', protect, admin, async (req, res) => {
    const { name, phoneno, password, address, role } = req.body;
    
    try {
        // Check if user already exists by phone number
        const existingUser = await User.findOne({ phoneno });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this phone number' 
            });
        }
        
        // Create new user
        const newUser = new User({
            name,
            phoneno,
            password,
            address,
            role: role || 'user', // Default role is 'user'
        });
        
        await newUser.save();
        
        // Remove password from response
        const userResponse = {
            _id: newUser._id,
            name: newUser.name,
            phoneno: newUser.phoneno,
            address: newUser.address,
            role: newUser.role,
            createdAt: newUser.createdAt
        };
        
        res.status(201).json({ 
            success: true,
            message: 'User created successfully', 
            user: userResponse 
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @routes PUT /api/admin/users/:id
// @desc Update users (admin only) - Name, Phone, Address, Role
// @access Private/Admin
router.put('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        // Update fields if provided
        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.phoneno !== undefined) user.phoneno = req.body.phoneno;
        if (req.body.address !== undefined) user.address = req.body.address;
        if (req.body.role !== undefined) user.role = req.body.role;
        
        // If password is being updated
        if (req.body.password) {
            user.password = req.body.password;
        }
        
        const updatedUser = await user.save();
        
        // Remove password from response
        const userResponse = {
            _id: updatedUser._id,
            name: updatedUser.name,
            phoneno: updatedUser.phoneno,
            address: updatedUser.address,
            role: updatedUser.role,
            updatedAt: updatedUser.updatedAt
        };
        
        res.status(200).json({ 
            success: true,
            message: 'User updated successfully', 
            user: userResponse 
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @routes DELETE /api/admin/users/:id
// @desc DELETE users (admin only)  
// @access Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot delete your own account' 
            });
        }
        
        await user.deleteOne();
        
        res.status(200).json({ 
            success: true,
            message: 'User removed successfully' 
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @routes GET /api/admin/dashboard
// @desc Get admin dashboard stats
// @access Private/Admin
router.get('/dashboard', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalRegularUsers = await User.countDocuments({ role: 'user' });
        
        // Recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        
        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalAdmins,
                totalRegularUsers,
                recentUsers
            }
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

export default router; // ✅ یہ export ضروری ہے