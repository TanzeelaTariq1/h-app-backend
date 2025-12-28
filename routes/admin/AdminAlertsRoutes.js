import express from 'express';
import { protect, admin } from '../../middleware/authMiddleware.js';
import Alert from '../../models/Alert.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// Create alert
router.post('/', async (req, res) => {
    try {
        console.log('📝 Creating alert with data:', req.body);
        console.log('👤 User creating alert:', req.user._id);
        
        const { title, message, priority, expiryDate } = req.body;
        
        // Validation
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }
        
        // Create alert in database
        const alert = await Alert.create({
            title,
            message,
            priority: priority || 'medium',
            expiryDate,
            createdBy: req.user._id,
            isActive: true
        });
        
        console.log('✅ Alert created:', alert._id);
        
        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            alert: alert
        });
    } catch (error) {
        console.error('❌ Error creating alert:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Get all alerts
router.get('/', async (req, res) => {
    try {
        console.log('📋 Getting all alerts');
        
        const alerts = await Alert.find({})
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email');
        
        console.log(`✅ Found ${alerts.length} alerts`);
        
        res.json({
            success: true,
            count: alerts.length,
            alerts: alerts
        });
    } catch (error) {
        console.error('❌ Error getting alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// Get single alert
router.get('/:id', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('createdBy', 'name email');
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        res.json({
            success: true,
            alert: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// DELETE ALERT ROUTE - ADD THIS
router.delete('/:id', async (req, res) => {
    try {
        console.log('🗑️ Deleting alert with ID:', req.params.id);
        console.log('👤 User deleting alert:', req.user._id);
        
        const alert = await Alert.findById(req.params.id);
        
        if (!alert) {
            console.log('❌ Alert not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        console.log('📄 Alert found:', alert.title);
        
        // Delete from database
        await Alert.findByIdAndDelete(req.params.id);
        
        console.log('✅ Alert deleted successfully');
        
        res.json({
            success: true,
            message: 'Alert deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting alert:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// UPDATE ALERT ROUTE (Optional - for completeness)
router.put('/:id', async (req, res) => {
    try {
        console.log('✏️ Updating alert with ID:', req.params.id);
        
        const { title, message, priority, isActive, expiryDate } = req.body;
        
        const alert = await Alert.findById(req.params.id);
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        // Update fields
        if (title !== undefined) alert.title = title;
        if (message !== undefined) alert.message = message;
        if (priority !== undefined) alert.priority = priority;
        if (isActive !== undefined) alert.isActive = isActive;
        if (expiryDate !== undefined) alert.expiryDate = expiryDate;
        
        const updatedAlert = await alert.save();
        
        console.log('✅ Alert updated:', updatedAlert._id);
        
        res.json({
            success: true,
            message: 'Alert updated successfully',
            alert: updatedAlert
        });
    } catch (error) {
        console.error('❌ Error updating alert:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

export default router;