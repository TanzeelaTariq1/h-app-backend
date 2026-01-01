import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;
    
    console.log('🔍 Auth check - URL:', req.url);
    console.log('🔍 Auth check - Query params:', req.query);
    console.log('🔍 Auth check - Headers:', req.headers);
    
    // Try to get token from QUERY PARAMETERS first (for Android app)
    if (req.query && (req.query.Authorization || req.query.authorization || req.query.token)) {
        token = req.query.Authorization || req.query.authorization || req.query.token;
        console.log('✅ Token from query parameter');
    }
    // Try to get token from HEADERS (for Postman/web)
    else if (req.headers && req.headers.authorization) {
        // header may be "Bearer <token>" or just the token
        if (req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else {
            token = req.headers.authorization;
        }
        console.log('✅ Token from header');
    }
    
    if (!token) {
        console.log('❌ No token found');
        return res.status(401).json({ 
            success: false,
            message: 'Not authorized, no token provided' 
        });
    }

    try {
        console.log('🔐 Verifying token:', token.substring(0, 20) + '...');
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded:', decoded);
        
        // Get the user from the token
        req.user = await User.findById(decoded.user.id).select('-password');
        
        if (!req.user) {
            console.log('❌ User not found in database');
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        console.log('✅ User authenticated:', req.user.email, 'Role:', req.user.role);
        next(); // Call the next middleware or route handler
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        res.status(401).json({ 
            success: false,
            message: 'Not authorized, token failed: ' + error.message 
        });
    }
}

// Middleware to check if the user is an admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        console.log('✅ User is admin');
        next(); // Call the next middleware or route handler
    } else {
        console.log('❌ User is NOT admin. Role:', req.user?.role);
        res.status(403).json({ 
            success: false,
            message: 'Not authorized as an admin. Your role: ' + (req.user?.role || 'unknown')
        });
    }
}

export { protect, admin };