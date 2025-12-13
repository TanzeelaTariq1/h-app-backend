import jwt from 'jsonwebtoken';
import User from '../models/User.js';
 


//Middleware to protect routes
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            //verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            //get the user from the token
            req.user = await User.findById(decoded.user.id).select('-password'); //exclude the password from the user object
            next(); //call the next middleware or route handler
        } catch (error) {
            console.error("Token Verification failed", error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }

}

//Middleware to check if the user is an admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); //call the next middleware or route handler
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
}
 
 


 
export { protect, admin };  