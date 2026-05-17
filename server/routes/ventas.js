const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener productos activos para venta
router.get('/productos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, codigo, nombre, stock, precio_venta FROM productos WHERE estado='activo' ORDER BY nombre"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar productos' });
  }
});

// Registrar venta
router.post('/', authenticateToken, async (req, res) => {
  const { items, metodo_pago, notas, total } = req.body;
  const user = req.user.usuario;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No hay productos en la venta' });
  }
  if (!metodo_pago) {
    return res.status(400).json({ error: 'Método de pago requerido' });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Insertar venta
    const [ventaResult] = await connection.query(
      "INSERT INTO ventas (folio, total, usuario, metodo_pago, notas) VALUES (?, ?, ?, ?, ?)",
      ['V-TEMP', total, user, metodo_pago, notas]
    );
    const ventaId = ventaResult.insertId;
    const folio = `V-${String(ventaId).padStart(4, '0')}`;
    await connection.query("UPDATE ventas SET folio = ? WHERE id = ?", [folio, ventaId]);

    let subtotal = 0;
    let totalDescuento = 0;

    // Insertar detalles y actualizar stock
    for (const item of items) {
      const importe = (item.precio_unit * item.cantidad) - item.descuento;
      subtotal += item.precio_unit * item.cantidad;
      totalDescuento += item.descuento;

      await connection.query(
        "INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unit, descuento, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
        [ventaId, item.id, item.cantidad, item.precio_unit, item.descuento, importe]
      );

      // Actualizar stock
      const [updateResult] = await connection.query(
        "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [item.cantidad, item.id, item.cantidad]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(`Stock insuficiente: ${item.nombre}`);
      }

      // Registrar movimiento
      await connection.query(
        "INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES (?, ?, ?, ?, ?)",
        ['venta', item.nombre, -item.cantidad, user, notas]
      );
    }

    await connection.commit();
    res.json({ success: true, venta_id: ventaId, folio });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al registrar venta' });
  } finally {
    connection.release();
  }
});

// Obtener ventas recientes
router.get('/recientes', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT v.id, v.folio, v.fecha, v.total, v.usuario,
             COUNT(DISTINCT vd.producto_id) as total_productos,
             GROUP_CONCAT(CONCAT(p.codigo, ' x', vd.cantidad) ORDER BY p.codigo SEPARATOR ', ') as productos_detalle
      FROM ventas v 
      LEFT JOIN ventas_detalle vd ON v.id = vd.venta_id
      LEFT JOIN productos p ON vd.producto_id = p.id
      GROUP BY v.id 
      ORDER BY v.fecha DESC 
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar ventas' });
  }
});

// Obtener ticket de venta
router.get('/:id/ticket', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [ventaRows] = await db.query(
      "SELECT * FROM ventas WHERE id = ?",
      [id]
    );
    
    if (ventaRows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const venta = ventaRows[0];
    
    const [detalleRows] = await db.query(`
      SELECT vd.*, p.nombre, p.codigo 
      FROM ventas_detalle vd 
      LEFT JOIN productos p ON vd.producto_id = p.id 
      WHERE vd.venta_id = ?
    `, [id]);

    // Calcular subtotal y descuento total
    let subtotal = 0;
    let totalDescuento = 0;
    for (const item of detalleRows) {
      subtotal += item.precio_unit * item.cantidad;
      totalDescuento += item.descuento || 0;
    }

    res.json({
      venta: {
        ...venta,
        subtotal,
        total_descuento: totalDescuento
      },
      detalles: detalleRows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar ticket' });
  }
});

module.exports = router;