
// SCP/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies

// --- Database Connection ---
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Critical Error: DATABASE_URL is not defined in environment variables.");
  process.exit(1); // Exit if database URL is not set
}

mongoose.connect(DATABASE_URL)
  .then(() => console.log("Successfully connected to MongoDB Atlas database."))
  .catch(err => {
    console.error("Critical Error: Could not connect to MongoDB Atlas:", err);
    process.exit(1); // Exit if database connection fails
  });

// --- User Schema and Model ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: [true, 'Username is required.'], unique: true, minlength: [3, 'Username must be at least 3 characters.'] },
  password: { type: String, required: [true, 'Password is required.'], minlength: [6, 'Password must be at least 6 characters.'] },
  accessLevel: { type: String, default: 'Level 1' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- JWT Secret ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("Critical Error: JWT_SECRET is not defined in environment variables.");
  process.exit(1); // Exit if JWT secret is not set
}

// --- Middleware to verify token ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expects "Bearer TOKEN_STRING"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Add decoded user payload (userId, username, accessLevel) to request object
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') { // Catches malformed tokens, invalid signature etc.
        return res.status(403).json({ message: 'Invalid token.' });
    }
    // Log other unexpected errors
    console.error('Token verification error:', error);
    return res.status(500).json({ message: 'Failed to authenticate token due to server error.' });
  }
};


// --- API Routes ---

// Test Route
app.get('/api', (req, res) => {
  res.status(200).json({ message: "SCP Foundation API Operational" });
});

// Register User
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  // Basic validation (more can be added, or rely on Mongoose schema validation)
  if (String(username).length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists. Please choose a different one.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      password: hashedPassword,
      accessLevel: 'Level 1' // Default access level for new users
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully. You can now log in.' });

  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === 'ValidationError') {
        // Extract validation messages from Mongoose
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation failed.", errors: messages });
    }
    res.status(500).json({ message: 'Server error during registration. Please try again later.'});
  }
});

// Login User
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Generic message for security
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Generic message
    }

    // User authenticated, create JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username, accessLevel: user.accessLevel },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour; consider making this configurable
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: { // Send back some basic user info if needed by frontend immediately
        id: user._id,
        username: user.username,
        accessLevel: user.accessLevel
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server error during login. Please try again later.' });
  }
});

// Get User Profile (Protected Route)
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    // req.user is populated by verifyToken middleware (contains userId, username, accessLevel from token)
    const userProfile = await User.findById(req.user.userId).select('-password'); // Exclude password from result

    if (!userProfile) {
      // This case should ideally not happen if token is valid and user exists, but good for robustness
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({
        id: userProfile._id,
        username: userProfile.username,
        accessLevel: userProfile.accessLevel,
        createdAt: userProfile.createdAt
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});


// --- Server Startup ---
const PORT = process.env.PORT || 3000; // Render sets PORT environment variable
app.listen(PORT, () => {
  console.log(`SCP Foundation Backend is running on port ${PORT}`);
  console.log(`Awaiting database connection... (see logs above)`);
});
