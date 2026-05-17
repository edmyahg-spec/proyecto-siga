const express = require('express');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [totalProd] = await db.query("SELECT COUNT(*) as count FROM productos");
    const [lowStock] = await db.query("SELECT COUNT(*) as count FROM productos WHERE stock <= stock_min AND stock > 0");
    const [outStock] = await db.query("SELECT COUNT(*) as count FROM productos WHERE stock = 0");
    const [ventasHoy] = await db.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE DATE(fecha) = CURDATE()");
    const [comprasHoy] = await db.query("SELECT IFNULL(SUM(cantidad * precio_compra), 0) as total FROM compras WHERE DATE(fecha) = CURDATE()");
    const [totalUsuarios] = await db.query("SELECT COUNT(*) as count FROM usuarios");
    const [ventasMes] = await db.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())");

    const [productosBajoStock] = await db.query(`
      SELECT codigo, nombre, stock, stock_min 
      FROM productos 
      WHERE stock <= stock_min AND stock > 0 
      ORDER BY stock ASC 
      LIMIT 10
    `);

    const [productosAgotados] = await db.query(`
      SELECT codigo, nombre, stock, stock_min 
      FROM productos 
      WHERE stock = 0 
      ORDER BY nombre ASC 
      LIMIT 10
    `);

    const [productosMasVendidos] = await db.query(`
      SELECT p.nombre, SUM(vd.cantidad) as total_vendido 
      FROM ventas_detalle vd 
      JOIN productos p ON vd.producto_id = p.id 
      GROUP BY p.id, p.nombre
      ORDER BY total_vendido DESC 
      LIMIT 5
    `);

    const [ventasUltimaSemana] = await db.query(`
      SELECT DATE(fecha) as dia, IFNULL(SUM(total), 0) as total 
      FROM ventas 
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      GROUP BY DATE(fecha) 
      ORDER BY dia
    `);

    const [stockPorCategoria] = await db.query(`
      SELECT IFNULL(categoria, 'Sin categoría') as categoria, 
             COUNT(*) as cantidad, 
             SUM(stock) as stock_total 
      FROM productos 
      GROUP BY categoria 
      ORDER BY cantidad DESC
      LIMIT 6
    `);

    res.json({
      metrics: {
        totalProductos: totalProd[0].count,
        lowStock: lowStock[0].count,
        outStock: outStock[0].count,
        ventasHoy: parseFloat(ventasHoy[0].total),
        comprasHoy: parseFloat(comprasHoy[0].total),
        totalUsuarios: totalUsuarios[0].count,
        ventasMes: parseFloat(ventasMes[0].total)
      },
      productosBajoStock,
      productosAgotados,
      productosMasVendidos,
      ventasUltimaSemana: ventasUltimaSemana.map(v => ({ dia: v.dia, total: parseFloat(v.total) })),
      stockPorCategoria
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error al cargar datos del dashboard' });
  }
});

module.exports = router;