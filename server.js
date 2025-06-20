const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('SCP Foundation Server is Running');
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});