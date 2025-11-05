const express = require('express');
const createURL = require('./routes/create');


const app = express();
const PORT = process.env.PORT || 3000;

app.use('/', createURL);







app.listen(PORT, () => {
  console.log('http://localhost:',PORT);
});