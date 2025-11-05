const express = require('express');
const { db } = require('../models');

const router = express.Router();

router.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT originalUrl FROM urls WHERE shortUrl = ?',
      [shortUrl]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'URL no encontrada' });
    }

    const originalUrl = rows[0].originalUrl;

    res.redirect(301, originalUrl);

  } catch (error) {
    console.error('Error al buscar la URL:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;