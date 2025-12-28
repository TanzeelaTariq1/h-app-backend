import express from 'express';
import Announcement from '../models/Announcement.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/announcements
// @desc    Get all active announcements for users (frontend format)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const announcements = await Announcement.find({
            isActive: true
        })
        .sort({ priority: 1, createdAt: -1 }) // High priority first, then newest
        .populate('createdBy', 'name');

        // Frontend کے format میں convert کریں
        const formattedAnnouncements = announcements.map(ann => {
            return {
                id: ann._id,
                title: ann.title,
                date: ann.date, // "November 19" format
                status: ann.status, // "pending" or "completed"
                details: ann.details,
                category: ann.category,
                priority: ann.priority,
                createdBy: ann.createdBy?.name || 'Admin',
                isCompleted: ann.status === 'completed' // Frontend کے لیے boolean
            };
        });

        res.json({
            success: true,
            announcements: formattedAnnouncements,
            total: formattedAnnouncements.length
        });

    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/announcements/recent
// @desc    Get recent announcements (last 10)
// @access  Private
router.get('/recent', protect, async (req, res) => {
    try {
        const announcements = await Announcement.find({
            isActive: true
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'name');

        const formatted = announcements.map(ann => ({
            id: ann._id,
            title: ann.title,
            date: ann.date,
            status: ann.status,
            details: ann.details.substring(0, 100) + '...', // Short description
            isCompleted: ann.status === 'completed'
        }));

        res.json({
            success: true,
            announcements: formatted
        });

    } catch (error) {
        console.error('Get recent announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/announcements/:id
// @desc    Get single announcement
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('createdBy', 'name phoneno');
        
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        const formattedAnnouncement = {
            id: announcement._id,
            title: announcement.title,
            date: announcement.date,
            status: announcement.status,
            details: announcement.details,
            category: announcement.category,
            priority: announcement.priority,
            createdBy: announcement.createdBy?.name || 'Admin',
            createdAt: announcement.createdAt,
            isCompleted: announcement.status === 'completed'
        };

        res.json({
            success: true,
            announcement: formattedAnnouncement
        });
    } catch (error) {
        console.error('Get announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;