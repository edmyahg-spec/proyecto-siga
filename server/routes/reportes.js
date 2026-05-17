const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generar reporte de inventario
router.get('/inventario', authenticateToken, requireAdmin, async (req, res) => {
  const { formato } = req.query;
  
  try {
    const [rows] = await db.query(`
      SELECT codigo, nombre, categoria, proveedor, stock, stock_min as minimo,
             CASE WHEN stock <= stock_min THEN 'BAJO' ELSE 'NORMAL' END as estado
      FROM productos 
      ORDER BY nombre
    `);
    
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_inventario_${Date.now()}.csv"`);
      
      let csv = "\uFEFF";
      csv += "Código,Nombre,Categoría,Proveedor,Stock,Mínimo,Estado\n";
      rows.forEach(row => {
        csv += `"${row.codigo}","${row.nombre}","${row.categoria || ''}","${row.proveedor || ''}",${row.stock},${row.minimo},"${row.estado}"\n`;
      });
      res.send(csv);
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Generar reporte de ventas
router.get('/ventas', authenticateToken, requireAdmin, async (req, res) => {
  const { formato } = req.query;
  
  try {
    const [rows] = await db.query(`
      SELECT v.fecha, v.folio, 
             GROUP_CONCAT(p.nombre SEPARATOR ', ') as productos,
             v.total, 
             COALESCE(v.metodo_pago, 'No especificado') as tipo_pago,
             COALESCE(v.notas, '') as observaciones,
             v.usuario
      FROM ventas v
      JOIN ventas_detalle vd ON v.id = vd.venta_id
      JOIN productos p ON vd.producto_id = p.id
      GROUP BY v.id
      ORDER BY v.fecha DESC
    `);
    
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${Date.now()}.csv"`);
      
      let csv = "\uFEFF";
      csv += "Fecha,Folio,Productos,Total,Tipo Pago,Observaciones,Usuario\n";
      rows.forEach(row => {
        csv += `"${row.fecha}","${row.folio}","${row.productos}",${row.total},"${row.tipo_pago}","${row.observaciones}","${row.usuario}"\n`;
      });
      res.send(csv);
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Generar reporte de movimientos
router.get('/movimientos', authenticateToken, requireAdmin, async (req, res) => {
  const { formato } = req.query;
  
  try {
    const [rows] = await db.query(`
      SELECT fecha, tipo, producto, cantidad, usuario, observaciones
      FROM movimientos 
      ORDER BY fecha DESC
    `);
    
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_movimientos_${Date.now()}.csv"`);
      
      let csv = "\uFEFF";
      csv += "Fecha,Tipo,Producto,Cantidad,Usuario,Observaciones\n";
      rows.forEach(row => {
        csv += `"${row.fecha}","${row.tipo}","${row.producto}",${row.cantidad},"${row.usuario}","${row.observaciones || ''}"\n`;
      });
      res.send(csv);
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Generar reporte de usuarios
router.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  const { formato } = req.query;
  
  try {
    const [rows] = await db.query(`
      SELECT usuario, nombre, rol, estado
      FROM usuarios 
      ORDER BY nombre
    `);
    
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_usuarios_${Date.now()}.csv"`);
      
      let csv = "\uFEFF";
      csv += "Usuario,Nombre,Rol,Estado\n";
      rows.forEach(row => {
        csv += `"${row.usuario}","${row.nombre}","${row.rol}","${row.estado}"\n`;
      });
      res.send(csv);
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

module.exports = router;