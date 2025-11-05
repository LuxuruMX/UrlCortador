const express = require('express');
const { db, parseDomainInfo } = require('../models');
const router = express.Router();

router.patch('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const { url: newUrl, token } = req.body;

  if (!newUrl || !token) {
    return res.status(400).json({ error: 'Nueva URL y Token son requeridos' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT originalUrl, usuario, token AS storedToken FROM urls WHERE shortUrl = ?',
      [shortUrl]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'URL no encontrada' });
    }

    const { originalUrl: currentUrl, usuario, storedToken } = rows[0];

    if (storedToken !== token) {
      return res.status(403).json({ error: 'Token inválido. No autorizado para actualizar esta URL.' });
    }

    parseDomainInfo(newUrl);

    await db.execute(
      'UPDATE urls SET originalUrl = ? WHERE shortUrl = ?',
      [newUrl, shortUrl]
    );

    res.status(200).json({
      message: 'URL actualizada exitosamente',
      shortUrl: shortUrl,
      originalUrlAnterior: currentUrl,
      originalUrlNueva: newUrl
    });

  } catch (error) {
    console.error('Error al actualizar la URL:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;