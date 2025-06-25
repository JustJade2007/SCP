
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Environment Variables ---
// Ensure these are set in your Render environment
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

if (!DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL is not defined.");
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// --- MongoDB Connection ---
mongoose.connect(DATABASE_URL)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// --- User Schema and Model ---
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true
    },
    accessLevel: {
        type: String,
        required: true,
        default: 'Researcher Tier 1' // Default applied by Mongoose if not provided
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// --- JWT Verification Middleware ---
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add decoded user payload to request object
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid token.' });
        }
        console.error("Token verification error:", error);
        return res.status(500).json({ message: 'Failed to authenticate token.' });
    }
}


// --- API Routes ---

// Test Route
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the SCP Foundation API!' });
});

// Register User
app.post('/api/register', async (req, res) => {
    try {
        let { username, password, accessLevel } = req.body;

        if (!username || !password) { // Access level is now optional from frontend for default
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // If accessLevel is not provided or is an empty string from the form,
        // the Mongoose default 'Researcher Tier 1' will be used.
        // If a specific accessLevel (like "05 Council") is provided, it will be used.
        const newUserPayload = {
            username,
            password: hashedPassword,
        };
        if (accessLevel && accessLevel.trim() !== '') {
            newUserPayload.accessLevel = accessLevel;
        }


        const newUser = new User(newUserPayload);

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials. User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
        }

        const tokenPayload = {
            userId: user._id,
            username: user.username,
            accessLevel: user.accessLevel
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        res.json({
            message: 'Login successful.',
            token: token
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

// Get User Profile (Protected Route)
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        // req.user is populated by verifyToken middleware
        const user = await User.findById(req.user.userId).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({
            message: 'Profile fetched successfully.',
            user: {
                _id: user._id,
                username: user.username,
                accessLevel: user.accessLevel
            }
        });
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        res.status(500).json({ message: 'Server error fetching profile.', error: error.message });
    }
});

// Admin Route: Get all users (Protected for "05 Council")
app.get('/api/admin/users', verifyToken, async (req, res) => {
    try {
        if (req.user.accessLevel !== '05 Council') {
            return res.status(403).json({ message: 'Access Denied. Insufficient privileges.' });
        }

        const users = await User.find().select('-password').sort({ createdAt: -1 }); // Exclude passwords, sort by newest
        res.json({
            message: 'Users fetched successfully.',
            users: users.map(user => ({
                 _id: user._id,
                 username: user.username,
                 accessLevel: user.accessLevel,
                 createdAt: user.createdAt
            }))
        });
    } catch (error) {
        console.error('Admin Fetch Users Error:', error);
        res.status(500).json({ message: 'Server error fetching users for admin.', error: error.message });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
