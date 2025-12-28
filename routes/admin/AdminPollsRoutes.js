import express from 'express';
import Poll from '../../models/Poll.js';
import { protect, admin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// @route   POST /api/admin/polls
// @desc    Create new poll
// @access  Private/Admin
router.post('/', async (req, res) => {
    try {
        const { question, options, category, expiryDays } = req.body;

        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Question and at least 2 options are required'
            });
        }

        // Calculate expiry date if provided
        let expiryDate = null;
        if (expiryDays && expiryDays > 0) {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
        }

        const pollOptions = options.map(optionText => ({
            text: optionText,
            votes: 0,
            voters: []
        }));

        const poll = new Poll({
            question,
            options: pollOptions,
            category: category || 'general',
            expiryDate: expiryDate,
            status: 'active',
            createdBy: req.user._id,
            totalVotes: 0
        });

        await poll.save();
        await poll.populate('createdBy', 'name');

        res.status(201).json({
            success: true,
            message: 'Poll created successfully',
            poll: {
                id: poll._id,
                question: poll.question,
                options: poll.options.map(opt => ({ text: opt.text })),
                status: poll.status,
                expiryDate: poll.expiryDate,
                createdBy: poll.createdBy.name
            }
        });

    } catch (error) {
        console.error('Create poll error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/polls
// @desc    Get all polls (admin view)
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const polls = await Poll.find()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name');

        res.json({
            success: true,
            polls: polls.map(poll => ({
                id: poll._id,
                question: poll.question,
                options: poll.options,
                totalVotes: poll.totalVotes,
                status: poll.status,
                createdBy: poll.createdBy?.name || 'Admin',
                createdAt: poll.createdAt,
                expiryDate: poll.expiryDate
            })),
            total: polls.length
        });
    } catch (error) {
        console.error('Get polls error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/admin/polls/:id/status
// @desc    Change poll status (active/completed)
// @access  Private/Admin
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['active', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Use "active" or "completed"'
            });
        }

        const poll = await Poll.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('createdBy', 'name');

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        res.json({
            success: true,
            message: `Poll marked as ${status}`,
            poll: {
                id: poll._id,
                question: poll.question,
                status: poll.status
            }
        });
    } catch (error) {
        console.error('Update poll status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/admin/polls/:id
// @desc    Delete poll
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
    try {
        const poll = await Poll.findByIdAndDelete(req.params.id);

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        res.json({
            success: true,
            message: 'Poll deleted successfully'
        });
    } catch (error) {
        console.error('Delete poll error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;