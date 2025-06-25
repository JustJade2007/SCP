require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(DATABASE_URL)
  .then(() => console.log('Successfully connected to database'))
  .catch(err => console.error('Database connection error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  accessLevel: { type: String, required: true, default: 'Level 1' }
});

const User = mongoose.model('User', userSchema);

// ==========================================================
// ===== START OF NEW CODE ==================================
// ==========================================================

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // No token, unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Token is invalid, forbidden
    }
    req.user = user; // Add the decoded user payload to the request
    next(); // Proceed to the next function
  });
};

// ==========================================================
// ===== END OF NEW CODE ====================================
// ==========================================================


// --- API Endpoints ---
app.get('/', (req, res) => {
  res.send('SCP Foundation Server is Running.');
});

app.post('/api/register', async (req, res) => {
  // ... (This code remains unchanged)
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  // ... (This code remains unchanged)
   try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { userId: user._id, accessLevel: user.accessLevel },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Login successful!', token: token });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// ==========================================================
// ===== START OF NEW CODE ==================================
// ==========================================================

// A Protected Route
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    // The verifyToken middleware has already run and attached the user data
    const user = await User.findById(req.user.userId).select('-password'); // Find user but exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// ==========================================================
// ===== END OF NEW CODE ====================================
// ==========================================================

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});