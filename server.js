require('dotenv').config(); // This must be at the very top
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// The secret is now loaded securely from the environment
const DATABASE_URL = process.env.DATABASE_URL;

// Connect to the database
mongoose.connect(DATABASE_URL)
  .then(() => console.log('Successfully connected to database'))
  .catch(err => console.error('Database connection error:', err));

app.get('/', (req, res) => {
  res.send('SCP Foundation Server is Running.');
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});