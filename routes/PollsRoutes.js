import express from 'express';
import Poll from '../models/Poll.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/polls/active
// @desc    Get all active polls (ووٹنگ کے لیے open)
// @access  Private
router.get('/active', protect, async (req, res) => {
    try {
        const currentDate = new Date();
        
        // Active polls: status=active اور expiry date نہ ہو یا future میں ہو
        const activePolls = await Poll.find({
            status: 'active',
            $or: [
                { expiryDate: { $exists: false } },
                { expiryDate: { $gte: currentDate } }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name');

        // Format active polls for frontend
        const formattedActivePolls = activePolls.map(poll => {
            // Check if user has voted in this poll
            const hasVoted = poll.options.some(option => 
                option.voters.some(voter => 
                    voter.toString() === req.user._id.toString()
                )
            );

            return {
                id: poll._id,
                question: poll.question,
                category: poll.category,
                options: poll.options.map(opt => ({
                    text: opt.text,
                    votes: hasVoted ? opt.votes : 'Hidden', // ووٹ نہیں دیا تو votes چھپائیں
                    optionId: opt._id
                })),
                totalVotes: poll.totalVotes,
                status: 'Open for voting',
                hasVoted: hasVoted,
                createdBy: poll.createdBy?.name || 'Admin',
                expiryDate: poll.expiryDate
            };
        });

        res.json({
            success: true,
            polls: formattedActivePolls,
            activeCount: formattedActivePolls.length
        });

    } catch (error) {
        console.error('Get active polls error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/polls/completed
// @desc    Get completed polls with results
// @access  Private
router.get('/completed', protect, async (req, res) => {
    try {
        const currentDate = new Date();
        
        // Completed polls: status=completed یا expiry date گزر چکی ہو
        const completedPolls = await Poll.find({
            $or: [
                { status: 'completed' },
                { expiryDate: { $lt: currentDate } }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name');

        // Format completed polls with results
        const formattedCompletedPolls = completedPolls.map(poll => {
            // Calculate percentage for each option
            const optionsWithPercentage = poll.options.map(opt => {
                const percentage = poll.totalVotes > 0 
                    ? Math.round((opt.votes / poll.totalVotes) * 100)
                    : 0;
                
                return {
                    text: opt.text,
                    votes: opt.votes,
                    percentage: percentage
                };
            });

            // Find winning option
            const winningOption = poll.options.reduce((max, option) => 
                option.votes > max.votes ? option : max
            , { votes: -1 });

            return {
                id: poll._id,
                question: poll.question,
                options: optionsWithPercentage,
                totalVotes: poll.totalVotes,
                result: winningOption.text,
                resultPercentage: poll.totalVotes > 0 
                    ? Math.round((winningOption.votes / poll.totalVotes) * 100)
                    : 0,
                status: 'Completed',
                createdBy: poll.createdBy?.name || 'Admin',
                completedAt: poll.expiryDate || poll.updatedAt
            };
        });

        res.json({
            success: true,
            polls: formattedCompletedPolls,
            completedCount: formattedCompletedPolls.length
        });

    } catch (error) {
        console.error('Get completed polls error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/polls/:id/vote
// @desc    Vote in a poll
// @access  Private
router.post('/:id/vote', protect, async (req, res) => {
    try {
        const { optionId } = req.body;
        
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        // Check if poll is active
        if (poll.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Poll is not active for voting'
            });
        }

        // Check if expired
        if (poll.expiryDate && new Date(poll.expiryDate) < new Date()) {
            poll.status = 'completed';
            await poll.save();
            
            return res.status(400).json({
                success: false,
                message: 'Poll has expired'
            });
        }

        // Check if user has already voted
        const hasVoted = poll.options.some(option => 
            option.voters.some(voter => 
                voter.toString() === req.user._id.toString()
            )
        );

        if (hasVoted) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this poll'
            });
        }

        // Find the option
        const option = poll.options.id(optionId);
        if (!option) {
            return res.status(400).json({
                success: false,
                message: 'Invalid option'
            });
        }

        // Add vote
        option.votes += 1;
        option.voters.push(req.user._id);
        poll.totalVotes += 1;

        await poll.save();

        res.json({
            success: true,
            message: 'Vote submitted successfully',
            totalVotes: poll.totalVotes
        });

    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/polls/:id
// @desc    Get single poll details
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        const hasVoted = poll.options.some(option => 
            option.voters.some(voter => 
                voter.toString() === req.user._id.toString()
            )
        );

        let response;
        if (poll.status === 'active' && !hasVoted) {
            // Active poll, user hasn't voted - show without votes
            response = {
                id: poll._id,
                question: poll.question,
                options: poll.options.map(opt => ({
                    text: opt.text,
                    optionId: opt._id
                })),
                status: 'Open for voting',
                totalVotes: 'Hidden',
                hasVoted: false,
                createdBy: poll.createdBy?.name || 'Admin'
            };
        } else {
            // User has voted or poll is completed - show results
            const optionsWithPercentage = poll.options.map(opt => {
                const percentage = poll.totalVotes > 0 
                    ? Math.round((opt.votes / poll.totalVotes) * 100)
                    : 0;
                
                return {
                    text: opt.text,
                    votes: opt.votes,
                    percentage: percentage
                };
            });

            response = {
                id: poll._id,
                question: poll.question,
                options: optionsWithPercentage,
                status: poll.status === 'active' ? 'Active' : 'Completed',
                totalVotes: poll.totalVotes,
                hasVoted: hasVoted,
                createdBy: poll.createdBy?.name || 'Admin'
            };
        }

        res.json({
            success: true,
            poll: response
        });

    } catch (error) {
        console.error('Get poll error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;