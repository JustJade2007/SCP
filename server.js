require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- ADD THIS LINE

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// You'll need a secret key for your tokens. Add this to your .env file
// JWT_SECRET='some_long_random_string_of_characters'
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

// --- API Endpoints ---
app.get('/', (req, res) => {
  res.send('SCP Foundation Server is Running.');
});

// User Registration Endpoint (no changes here)
app.post('/api/register', async (req, res) => {
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

// ==========================================================
// ===== START OF NEW CODE ==================================
// ==========================================================

// User Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user in the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 3. If credentials are correct, create a token
    const token = jwt.sign(
      { userId: user._id, accessLevel: user.accessLevel }, // This is the data stored in the token
      JWT_SECRET, // The secret key to sign the token
      { expiresIn: '1h' } // The token will expire in 1 hour
    );

    res.json({ message: 'Login successful!', token: token });

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