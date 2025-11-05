// resumen.js
const express = require('express');
const { db } = require('../models'); 
const router = express.Router();

router.get('/resume', async (req, res) => {
  try {
    const [costosPorUsuario] = await db.execute(`
      SELECT usuario, total_cost
      FROM user_costs
    `);

    const [totalGlobalRow] = await db.execute(`
      SELECT SUM(total_cost) AS total_global
      FROM user_costs
    `);

    const totalGlobal = totalGlobalRow[0].total_global || 0.00;

    res.status(200).json({
      totalGlobal: parseFloat(totalGlobal).toFixed(2),
      costosPorUsuario: costosPorUsuario.map(row => ({
        usuario: row.usuario,
        totalCosto: parseFloat(row.total_cost).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Error al obtener el resumen de costos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;