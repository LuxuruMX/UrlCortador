// delete.js
const express = require('express');
const { db } = require('../models');

const router = express.Router();

router.delete('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token es requerido para eliminar la URL.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT usuario, token AS storedToken FROM urls WHERE shortUrl = ?',
      [shortUrl]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'URL no encontrada' });
    }

    const { usuario, storedToken } = rows[0];

    if (storedToken !== token) {
      return res.status(403).json({ error: 'Token inválido. No autorizado para eliminar esta URL.' });
    }

    await db.execute(
      'DELETE FROM urls WHERE shortUrl = ?',
      [shortUrl]
    );

    res.status(200).json({
      message: 'URL eliminada exitosamente',
      shortUrl: shortUrl
    });

  } catch (error) {
    console.error('Error al eliminar la URL:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;