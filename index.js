const express = require('express');
const createApp = require('./routes/create');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/', createApp);







app.listen(PORT, () => {
  console.log('http://localhost:${PORT}');
});