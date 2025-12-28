import express from 'express';
import Announcement from '../../models/Announcement.js';
import { protect, admin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// @route   POST /api/admin/announcements
// @desc    Create new announcement (frontend format کے مطابق)
// @access  Private/Admin
router.post('/', async (req, res) => {
    try {
        const { title, date, status, details, category, priority } = req.body;

        // Validation
        if (!title || !date || !details) {
            return res.status(400).json({
                success: false,
                message: 'Title, date and details are required'
            });
        }

        const announcement = new Announcement({
            title,
            date, // Frontend format: "November 19"
            status: status || 'pending',
            details,
            category: category || 'general',
            priority: priority || 2,
            createdBy: req.user._id,
            isActive: true
        });

        await announcement.save();
        await announcement.populate('createdBy', 'name');

        // Frontend response format
        const response = {
            id: announcement._id,
            title: announcement.title,
            date: announcement.date,
            status: announcement.status,
            details: announcement.details,
            category: announcement.category,
            priority: announcement.priority,
            createdBy: announcement.createdBy.name,
            isCompleted: announcement.status === 'completed',
            createdAt: announcement.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcement: response
        });

    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/announcements
// @desc    Get all announcements (admin view)
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const { status, category } = req.query;
        
        let query = {};
        
        // Filters
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (category && category !== 'all') {
            query.category = category;
        }

        const announcements = await Announcement.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name');

        // Format for frontend
        const formattedAnnouncements = announcements.map(ann => ({
            id: ann._id,
            title: ann.title,
            date: ann.date,
            status: ann.status,
            details: ann.details,
            category: ann.category,
            priority: ann.priority,
            createdBy: ann.createdBy?.name || 'Admin',
            isCompleted: ann.status === 'completed',
            createdAt: ann.createdAt,
            isActive: ann.isActive
        }));

        // Get statistics
        const total = await Announcement.countDocuments();
        const pending = await Announcement.countDocuments({ status: 'pending' });
        const completed = await Announcement.countDocuments({ status: 'completed' });
        const inProgress = await Announcement.countDocuments({ status: 'in-progress' });

        res.json({
            success: true,
            announcements: formattedAnnouncements,
            total: formattedAnnouncements.length,
            stats: {
                total,
                pending,
                completed,
                inProgress
            }
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/admin/announcements/:id
// @desc    Update announcement
// @access  Private/Admin
router.put('/:id', async (req, res) => {
    try {
        const { title, date, status, details, category, priority, isActive } = req.body;
        
        const announcement = await Announcement.findById(req.params.id);
        
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        // Update fields
        if (title !== undefined) announcement.title = title;
        if (date !== undefined) announcement.date = date;
        if (status !== undefined) announcement.status = status;
        if (details !== undefined) announcement.details = details;
        if (category !== undefined) announcement.category = category;
        if (priority !== undefined) announcement.priority = priority;
        if (isActive !== undefined) announcement.isActive = isActive;

        await announcement.save();
        await announcement.populate('createdBy', 'name');

        const response = {
            id: announcement._id,
            title: announcement.title,
            date: announcement.date,
            status: announcement.status,
            details: announcement.details,
            category: announcement.category,
            priority: announcement.priority,
            createdBy: announcement.createdBy?.name || 'Admin',
            isCompleted: announcement.status === 'completed',
            isActive: announcement.isActive
        };

        res.json({
            success: true,
            message: 'Announcement updated successfully',
            announcement: response
        });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PATCH /api/admin/announcements/:id/status
// @desc    Update only status
// @access  Private/Admin
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        const validStatuses = ['pending', 'completed', 'in-progress', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('createdBy', 'name');

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        res.json({
            success: true,
            message: `Announcement marked as ${status}`,
            announcement: {
                id: announcement._id,
                title: announcement.title,
                status: announcement.status,
                isCompleted: announcement.status === 'completed'
            }
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/admin/announcements/:id
// @desc    Delete announcement
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;