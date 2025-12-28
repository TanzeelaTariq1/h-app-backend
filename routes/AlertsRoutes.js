import express from 'express';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/alerts
// @desc    Get all active alerts for users
// @access  Private (User must be logged in)
router.get('/', protect, async (req, res) => {
    try {
        // Get current date
        const currentDate = new Date();
        
        // Find alerts that are active and not expired
        const alerts = await Alert.find({
            isActive: true,
            $or: [
                { expiryDate: { $exists: false } }, // No expiry date
                { expiryDate: { $gte: currentDate } } // Not expired yet
            ]
        })
        .sort({ createdAt: -1, priority: -1 }) // Sort by newest and high priority first
        .populate('createdBy', 'name') // Show who created it
        .select('-isActive'); // Don't send isActive field to frontend

        // Format the response like your frontend expects
        const formattedAlerts = alerts.map(alert => {
            // Calculate "Today", "Yesterday", "2 days ago" etc.
            const createdAt = new Date(alert.createdAt);
            const now = new Date();
            const diffTime = Math.abs(now - createdAt);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            let timeAgo = '';
            if (diffDays === 0) {
                timeAgo = 'Today';
            } else if (diffDays === 1) {
                timeAgo = 'Yesterday';
            } else {
                timeAgo = `${diffDays} days ago`;
            }

            return {
                id: alert._id,
                title: alert.title,
                message: alert.message,
                timeAgo: timeAgo,
                priority: alert.priority,
                createdAt: alert.createdAt,
                createdBy: alert.createdBy?.name || 'Admin'
            };
        });

        res.json({
            success: true,
            alerts: formattedAlerts,
            total: formattedAlerts.length
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/alerts/:id
// @desc    Get single alert
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('createdBy', 'name phoneno');
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.json({
            success: true,
            alert
        });
    } catch (error) {
        console.error('Get alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;