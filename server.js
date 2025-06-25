require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json()); // Middleware to understand JSON data from requests

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// Connect to the database
mongoose.connect(DATABASE_URL)
  .then(() => console.log('Successfully connected to database'))
  .catch(err => console.error('Database connection error:', err));

// 1. Define the User "Blueprint" (Schema)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  accessLevel: { type: String, required: true, default: 'Level 1' }
});

// 2. Create a "Model" to interact with the users collection
const User = mongoose.model('User', userSchema);


// API Endpoints
app.get('/', (req, res) => {
  res.send('SCP Foundation Server is Running.');
});

// 3. Create the User Registration Endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Create a new user
    const newUser = new User({
      username: username,
      password: hashedPassword,
      // accessLevel will default to 'Level 1'
    });

    await newUser.save(); // Save the new user to the database
    res.status(201).json({ message: 'User created successfully.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});