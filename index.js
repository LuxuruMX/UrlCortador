const express = require('express');
const createURL = require('./routes/create');
const redirecURL = require('./routes/get');
const updateURL = require('./routes/update');
const deleteURL = require('./routes/delete')

const app = express();
const PORT = process.env.PORT || 3000;



app.use('/', createURL);
app.use('/', redirecURL);
app.use('/', updateURL);
app.use('/', deleteURL)





app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});