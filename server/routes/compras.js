const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Registrar compra
router.post('/', authenticateToken, async (req, res) => {
  const { producto_id, cantidad, precio_compra, proveedor } = req.body;
  const user = req.user.usuario;

  if (!producto_id || !cantidad || cantidad <= 0 || !precio_compra || !proveedor) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Obtener producto para el movimiento
    const [productoRows] = await connection.query(
      "SELECT nombre FROM productos WHERE id = ?",
      [producto_id]
    );
    
    if (productoRows.length === 0) {
      throw new Error('Producto no encontrado');
    }
    
    const productoNombre = productoRows[0].nombre;

    // Registrar compra
    await connection.query(
      "INSERT INTO compras (producto_id, cantidad, precio_compra, proveedor, usuario) VALUES (?, ?, ?, ?, ?)",
      [producto_id, cantidad, precio_compra, proveedor, user]
    );

    // Actualizar stock
    await connection.query(
      "UPDATE productos SET stock = stock + ? WHERE id = ?",
      [cantidad, producto_id]
    );

    // Registrar movimiento
    await connection.query(
      "INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES (?, ?, ?, ?, ?)",
      ['compra', productoNombre, cantidad, user, proveedor]
    );

    await connection.commit();
    res.json({ success: true, message: 'Compra registrada' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al registrar compra' });
  } finally {
    connection.release();
  }
});

// Obtener historial de compras
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, p.codigo, p.nombre, c.cantidad, c.precio_compra, c.proveedor, c.fecha, c.usuario 
      FROM compras c 
      JOIN productos p ON c.producto_id = p.id 
      ORDER BY c.fecha DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar compras' });
  }
});

module.exports = router;