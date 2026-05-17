const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los productos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM productos ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar productos' });
  }
});

// Obtener productos activos
router.get('/activos', authenticateToken, async (req, res) => {
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

// Obtener categorías
router.get('/categorias', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria"
    );
    const categorias = rows.map(row => row.categoria);
    res.json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar categorías' });
  }
});

// Crear producto (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { codigo, nombre, categoria, proveedor, precio_compra, precio_venta, stock, stock_min, estado } = req.body;

  if (!codigo || !nombre || !categoria) {
    return res.status(400).json({ error: 'Código, nombre y categoría son requeridos' });
  }

  if (precio_venta < precio_compra) {
    return res.status(400).json({ error: 'El precio de venta no puede ser menor al precio de compra' });
  }

  if (stock_min > stock) {
    return res.status(400).json({ error: 'El stock mínimo no puede ser mayor al stock actual' });
  }

  try {
    // Verificar código duplicado
    const [existing] = await db.query("SELECT id FROM productos WHERE codigo = ?", [codigo]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El código ya está registrado' });
    }

    const [result] = await db.query(
      "INSERT INTO productos (codigo, nombre, categoria, proveedor, precio_compra, precio_venta, stock, stock_min, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [codigo, nombre, categoria, proveedor || null, precio_compra || 0, precio_venta, stock || 0, stock_min || 0, estado || 'activo']
    );

    res.json({ id: result.insertId, message: 'Producto creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Actualizar producto
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { codigo, nombre, categoria, proveedor, precio_compra, precio_venta, stock, stock_min, estado } = req.body;

  if (!nombre || !categoria) {
    return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
  }

  if (precio_venta < precio_compra) {
    return res.status(400).json({ error: 'El precio de venta no puede ser menor al precio de compra' });
  }

  if (stock_min > stock) {
    return res.status(400).json({ error: 'El stock mínimo no puede ser mayor al stock actual' });
  }

  try {
    // Verificar código duplicado excluyendo el actual
    const [existing] = await db.query("SELECT id FROM productos WHERE codigo = ? AND id != ?", [codigo, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El código ya está registrado en otro producto' });
    }

    await db.query(
      "UPDATE productos SET codigo=?, nombre=?, categoria=?, proveedor=?, precio_compra=?, precio_venta=?, stock=?, stock_min=?, estado=? WHERE id=?",
      [codigo, nombre, categoria, proveedor || null, precio_compra || 0, precio_venta, stock || 0, stock_min || 0, estado, id]
    );

    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar producto
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM productos WHERE id = ?", [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;