import express from 'express';
import Complain from '../../models/Complain.js';
import { protect, admin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// @route   GET /api/admin/complaints
// @desc    Get all complaints (admin view)
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const { status, search } = req.query;
        
        let query = {};
        
        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const complaints = await Complain.find(query)
            .sort({ createdAt: -1 });
        
        // Get counts for each status
        const totalCount = await Complain.countDocuments();
        const pendingCount = await Complain.countDocuments({ status: 'pending' });
        const inProgressCount = await Complain.countDocuments({ status: 'in-progress' });
        const resolvedCount = await Complain.countDocuments({ status: 'resolved' });
        const rejectedCount = await Complain.countDocuments({ status: 'rejected' });
        
        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints,
            stats: {
                total: totalCount,
                pending: pendingCount,
                inProgress: inProgressCount,
                resolved: resolvedCount,
                rejected: rejectedCount
            }
        });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// @route   GET /api/admin/complaints/:id
// @desc    Get single complaint details
// @access  Private/Admin
router.get('/:id', async (req, res) => {
    try {
        const complaint = await Complain.findById(req.params.id);
        
        if (!complaint) {
            return res.status(404).json({ 
                success: false, 
                message: 'Complaint not found' 
            });
        }

        res.status(200).json({
            success: true,
            data: complaint
        });

    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @route   PATCH /api/admin/complaints/:id/status
// @desc    Update complaint status
// @access  Private/Admin
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const validStatuses = ["pending", "in-progress", "resolved", "rejected"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status value. Allowed: pending, in-progress, resolved, rejected' 
            });
        }

        // Find complaint by ID
        const complaint = await Complain.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ 
                success: false, 
                message: 'Complaint not found' 
            });
        }

        // Update status and notes
        complaint.status = status;
        
        if (adminNotes) {
            complaint.adminNotes = adminNotes;
        }
        
        // Set resolved/rejected date
        if (status === 'resolved' || status === 'rejected') {
            complaint.resolvedAt = new Date();
        }
        
        await complaint.save();

        res.status(200).json({
            success: true,
            message: `Complaint ${status} successfully`,
            data: complaint
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// @route   PUT /api/admin/complaints/:id
// @desc    Update complaint details
// @access  Private/Admin
router.put('/:id', async (req, res) => {
    try {
        const { name, phoneno, description, priority, category } = req.body;
        
        const complaint = await Complain.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ 
                success: false, 
                message: 'Complaint not found' 
            });
        }

        // Update fields
        if (name) complaint.name = name;
        if (phoneno) complaint.phoneno = phoneno;
        if (description) complaint.description = description;
        if (priority) complaint.priority = priority;
        if (category) complaint.category = category;

        await complaint.save();

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully',
            data: complaint
        });

    } catch (error) {
        console.error('Update complaint error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @route   DELETE /api/admin/complaints/:id
// @desc    Delete complaint
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
    try {
        const complaint = await Complain.findByIdAndDelete(req.params.id);
        
        if (!complaint) {
            return res.status(404).json({ 
                success: false, 
                message: 'Complaint not found' 
            });
        }

        res.status(200).json({
            success: true,
            message: 'Complaint deleted successfully'
        });

    } catch (error) {
        console.error('Delete complaint error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @route   GET /api/admin/complaints/stats/overview
// @desc    Get complaints statistics
// @access  Private/Admin
router.get('/stats/overview', async (req, res) => {
    try {
        // Total complaints
        const totalComplaints = await Complain.countDocuments();
        
        // Complaints by status
        const byStatus = await Complain.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Complaints by category
        const byCategory = await Complain.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        // Recent complaints (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentComplaints = await Complain.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        
        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const monthlyTrend = await Complain.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { 
                _id: { 
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total: totalComplaints,
                byStatus,
                byCategory,
                recent: recentComplaints,
                monthlyTrend
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

export default router;