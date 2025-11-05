const express = require('express');
const { createShortUrl } = require('../models');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/create', async (req, res) => {
  const { usuario, url } = req.body;

  if (!usuario || !url) {
    return res.status(400).json({
      error: 'Usuario y URL son requeridos'
    });
  }

  try {
    const userIP = req.ip || req.connection.remoteAddress;

    const { shortUrl, token, precio } = await createShortUrl(usuario, url, userIP);

    res.status(201).json({
      shortUrl: shortUrl,
      originalUrl: url,
      token: token,
      precio: precio,
      moneda: 'MXN'
    });

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

module.exports = app;