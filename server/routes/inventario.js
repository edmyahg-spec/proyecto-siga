const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener stock actual
router.get('/stock', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT codigo, nombre, stock, stock_min, categoria,
             CASE WHEN stock = 0 THEN 'agotado'
                  WHEN stock <= stock_min THEN 'bajo'
                  ELSE 'ok'
             END as estado_stock
      FROM productos
      WHERE estado = 'activo'
      ORDER BY estado_stock ASC, nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar stock' });
  }
});

// Obtener movimientos con filtros
router.get('/movimientos', authenticateToken, async (req, res) => {
  const { tipo, producto, desde, hasta } = req.query;
  
  let query = "SELECT id, tipo, producto, cantidad, usuario, fecha, observaciones FROM movimientos WHERE 1=1";
  const params = [];
  
  if (tipo) {
    query += " AND tipo = ?";
    params.push(tipo);
  }
  
  if (producto) {
    query += " AND producto LIKE ?";
    params.push(`%${producto}%`);
  }
  
  if (desde) {
    query += " AND DATE(fecha) >= ?";
    params.push(desde);
  }
  
  if (hasta) {
    query += " AND DATE(fecha) <= ?";
    params.push(hasta);
  }
  
  query += " ORDER BY fecha DESC";
  
  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar movimientos' });
  }
});

module.exports = router;