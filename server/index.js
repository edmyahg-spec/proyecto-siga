const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sistema_vidrios'
});

// Conectar a MySQL
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        console.log('\n⚠️  Asegúrate de que:');
        console.log('1. XAMPP/WAMP esté corriendo');
        console.log('2. MySQL esté iniciado');
        console.log('3. La base de datos "sistema_vidrios" exista');
        return;
    }
    console.log('✓ Conectado a MySQL');

    const createTable = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            usuario VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            rol ENUM('admin', 'empleado') DEFAULT 'empleado',
            estado ENUM('activo', 'inactivo') DEFAULT 'activo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTable, (err) => {
        if (err) {
            console.error('Error creando tabla:', err);
        } else {
            console.log('✓ Tabla usuarios verificada');

            const checkAdmin = "SELECT * FROM usuarios WHERE usuario = 'admin'";
            db.query(checkAdmin, async (err, results) => {
                if (err) return;
                if (results.length === 0) {
                    const hashedPassword = await bcrypt.hash('Admin123!', 10);
                    const insertAdmin = "INSERT INTO usuarios (nombre, usuario, password, rol, estado) VALUES ('Administrador', 'admin', ?, 'admin', 'activo')";
                    db.query(insertAdmin, [hashedPassword], (err) => {
                        if (!err) console.log('✓ Usuario admin creado');
                    });
                }
            });
        }
    });
});

// ============================================================
// HELPERS PDF
// ============================================================

function pdfHeader(doc, titulo) {
    doc.fontSize(20).font('Helvetica-Bold').text('Sistema Vidrios & Aluminios', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(titulo, { align: 'center' });
    doc.fontSize(9).fillColor('#666666').text(`Generado: ${new Date().toLocaleString('es-MX')}`, { align: 'center' });
    doc.fillColor('#000000').moveDown(0.8);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1.5).stroke();
    doc.moveDown(0.5);
}

function pdfTableHeader(doc, columns) {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
    doc.rect(40, y - 2, 515, 14).fill('#4a4a4a');
    columns.forEach(col => {
        doc.fillColor('#ffffff').text(col.label, col.x, y, { width: col.width, align: col.align || 'left' });
    });
    doc.fillColor('#000000').font('Helvetica').moveDown(0.2);
}

function pdfTableRow(doc, columns, row, index) {
    if (doc.y > 720) doc.addPage();
    const y = doc.y;

    // Calcular la altura real de la fila según el texto más alto
    let maxHeight = 0;
    columns.forEach(col => {
        const text = String(row[col.key] ?? '');
        const h = doc.heightOfString(text, { width: col.width });
        if (h > maxHeight) maxHeight = h;
    });

    const rowHeight = maxHeight + 4;

    // Fondo alternado
    if (index % 2 === 0) {
        doc.rect(40, y - 1, 515, rowHeight).fill('#f5f5f5');
    }

    // Dibujar texto de cada columna
    doc.fillColor('#000000').font('Helvetica').fontSize(7.5);
    columns.forEach(col => {
        doc.text(String(row[col.key] ?? ''), col.x, y, { width: col.width, align: col.align || 'left' });
    });

    // Avanzar exactamente la altura calculada
    doc.y = y + rowHeight;
}

function pdfFooter(doc, total) {
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor('#444444').text(`Total de registros: ${total}`, 40);
}

// ============================================================
// AUTENTICACIÓN
// ============================================================

app.post('/api/auth/login', (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const query = 'SELECT id, nombre, usuario, password, rol, estado FROM usuarios WHERE usuario = ?';
    db.query(query, [usuario], async (err, results) => {
        if (err) {
            console.error('Error en consulta:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = results[0];

        if (user.estado !== 'activo') {
            return res.status(401).json({ error: 'Usuario inactivo' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre },
            'mi-secreto-jwt-2024',
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol }
        });
    });
});

// ============================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, 'mi-secreto-jwt-2024', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// ============================================================
// PRODUCTOS
// ============================================================

app.get('/api/productos/activos', authenticateToken, (req, res) => {
    db.query(
        "SELECT id, codigo, nombre, stock, precio_venta, precio_compra, proveedor_id FROM productos WHERE estado='activo' ORDER BY nombre",
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al cargar productos' });
            }
            res.json(results);
        }
    );
});

app.get('/api/productos', authenticateToken, (req, res) => {
    const query = "SELECT p.*, prov.nombre as proveedor_nombre FROM productos p LEFT JOIN proveedores prov ON p.proveedor_id = prov.id ORDER BY p.id DESC";
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al cargar productos:', err);
            return res.status(500).json({ error: 'Error al cargar productos' });
        }
        res.json(results);
    });
});

app.get('/api/productos/categorias', authenticateToken, (req, res) => {
    const query = "SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria";
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al cargar categorías:', err);
            return res.status(500).json({ error: 'Error al cargar categorías' });
        }
        res.json(results.map(r => r.categoria));
    });
});

app.post('/api/productos', authenticateToken, (req, res) => {
    const { codigo, nombre, categoria, proveedor_id, precio_compra, precio_venta, stock, stock_min, estado } = req.body;

    if (!codigo || !nombre || !categoria) {
        return res.status(400).json({ error: 'Código, nombre y categoría son requeridos' });
    }

    db.query("SELECT id FROM productos WHERE codigo = ?", [codigo], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'El código de producto ya existe' });
        }

        const query = `INSERT INTO productos (codigo, nombre, categoria, proveedor_id, precio_compra, precio_venta, stock, stock_min, estado) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(query, [codigo, nombre, categoria, proveedor_id || null, precio_compra || 0, precio_venta || 0, stock || 0, stock_min || 0, estado || 'activo'],
            (err, result) => {
                if (err) {
                    console.error('Error al crear producto:', err);
                    return res.status(500).json({ error: 'Error al crear producto' });
                }
                res.json({ success: true, id: result.insertId, message: 'Producto creado' });
            }
        );
    });
});

app.put('/api/productos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, proveedor_id, precio_compra, precio_venta, stock, stock_min, estado } = req.body;

    if (!nombre || !categoria) {
        return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
    }

    const query = `UPDATE productos SET nombre=?, categoria=?, proveedor_id=?, precio_compra=?, precio_venta=?, stock=?, stock_min=?, estado=? WHERE id=?`;

    db.query(query, [nombre, categoria, proveedor_id || null, precio_compra || 0, precio_venta || 0, stock || 0, stock_min || 0, estado || 'activo', id],
        (err, result) => {
            if (err) {
                console.error('Error al actualizar producto:', err);
                return res.status(500).json({ error: 'Error al actualizar producto' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ success: true, message: 'Producto actualizado' });
        }
    );
});

app.delete('/api/productos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM productos WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ error: 'Error al eliminar producto' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ success: true, message: 'Producto eliminado' });
    });
});

// ============================================================
// PROVEEDORES
// ============================================================

app.get('/api/proveedores', authenticateToken, (req, res) => {
    db.query("SELECT id, nombre FROM proveedores ORDER BY nombre", (err, results) => {
        if (err) {
            console.error('Error al cargar proveedores:', err);
            return res.status(500).json({ error: 'Error al cargar proveedores' });
        }
        res.json(results);
    });
});

app.get('/api/proveedores/todos', authenticateToken, (req, res) => {
    db.query("SELECT id, nombre FROM proveedores ORDER BY nombre", (err, results) => {
        if (err) {
            console.error('Error al cargar proveedores:', err);
            return res.status(500).json({ error: 'Error al cargar proveedores' });
        }
        res.json(results);
    });
});

app.post('/api/proveedores', authenticateToken, (req, res) => {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
    }

    db.query("SELECT id FROM proveedores WHERE nombre = ?", [nombre], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'El proveedor ya existe' });
        }

        db.query("INSERT INTO proveedores (nombre) VALUES (?)", [nombre], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al crear proveedor' });
            }
            res.json({ success: true, id: result.insertId, nombre });
        });
    });
});

// ============================================================
// VENTAS
// ============================================================

app.post('/api/ventas', authenticateToken, (req, res) => {
    const { items, metodo_pago, notas, total } = req.body;
    const user = req.user.usuario;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No hay productos en la venta' });
    }

    const folioTemp = 'V-TEMP';

    db.query(
        "INSERT INTO ventas (folio, total, usuario, metodo_pago, notas) VALUES (?, ?, ?, ?, ?)",
        [folioTemp, total, user, metodo_pago, notas],
        (err, result) => {
            if (err) {
                console.error('Error al insertar venta:', err);
                return res.status(500).json({ error: 'Error al registrar venta' });
            }

            const ventaId = result.insertId;
            const folio = `V-${String(ventaId).padStart(4, '0')}`;

            db.query("UPDATE ventas SET folio = ? WHERE id = ?", [folio, ventaId]);

            let processed = 0;
            let errorOccurred = false;

            items.forEach((item) => {
                const importe = (item.precio_unit * item.cantidad) - (item.descuento || 0);

                db.query(
                    "INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unit, descuento, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
                    [ventaId, item.id, item.cantidad, item.precio_unit, item.descuento || 0, importe],
                    (err) => {
                        if (err) {
                            console.error('Error al insertar detalle:', err);
                            errorOccurred = true;
                            return;
                        }

                        db.query(
                            "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?",
                            [item.cantidad, item.id, item.cantidad],
                            (err) => {
                                if (err) {
                                    console.error('Error al actualizar stock:', err);
                                    errorOccurred = true;
                                    return;
                                }

                                const cantidadNegativa = -item.cantidad;
                                const observacionesVenta = notas && notas.trim() !== '' ? notas : `Venta ${folio}`;

                                db.query(
                                    "INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES (?, ?, ?, ?, ?)",
                                    ['venta', item.nombre, cantidadNegativa, user, observacionesVenta],
                                    (err) => { if (err) console.error('Error al registrar movimiento:', err); }
                                );

                                processed++;
                                if (processed === items.length && !errorOccurred) {
                                    res.json({ success: true, venta_id: ventaId, folio });
                                } else if (processed === items.length && errorOccurred) {
                                    res.status(500).json({ error: 'Error al procesar la venta' });
                                }
                            }
                        );
                    }
                );
            });
        }
    );
});

app.get('/api/ventas/recientes', authenticateToken, (req, res) => {
    db.query(`
        SELECT v.id, v.folio, v.fecha, v.total, v.usuario,
               COUNT(DISTINCT vd.producto_id) as total_productos,
               GROUP_CONCAT(DISTINCT p.nombre ORDER BY p.nombre SEPARATOR ', ') as productos_detalle
        FROM ventas v 
        LEFT JOIN ventas_detalle vd ON v.id = vd.venta_id
        LEFT JOIN productos p ON vd.producto_id = p.id
        GROUP BY v.id 
        ORDER BY v.fecha DESC 
        LIMIT 10
    `, (err, results) => {
        if (err) {
            console.error('Error en ventas recientes:', err);
            return res.status(500).json({ error: 'Error al cargar ventas' });
        }
        res.json(results);
    });
});

app.get('/api/ventas/:id/ticket', authenticateToken, (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM ventas WHERE id = ?", [id], (err, ventaRows) => {
        if (err) {
            console.error('Error en venta:', err);
            return res.status(500).json({ error: 'Error al cargar venta' });
        }

        if (ventaRows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const venta = ventaRows[0];

        db.query(`
            SELECT vd.*, p.nombre, p.codigo 
            FROM ventas_detalle vd 
            LEFT JOIN productos p ON vd.producto_id = p.id 
            WHERE vd.venta_id = ?
        `, [id], (err, detalleRows) => {
            if (err) {
                console.error('Error en detalles:', err);
                return res.status(500).json({ error: 'Error al cargar detalles' });
            }

            const detalles = detalleRows.map(row => ({
                ...row,
                cantidad: Number(row.cantidad),
                precio_unit: Number(row.precio_unit),
                descuento: Number(row.descuento || 0),
                subtotal: Number(row.subtotal)
            }));

            res.json({
                venta: { ...venta, total: Number(venta.total) },
                detalles
            });
        });
    });
});

// ============================================================
// COMPRAS
// ============================================================

app.get('/api/compras', authenticateToken, (req, res) => {
    db.query(`
        SELECT c.id, p.codigo, p.nombre, c.cantidad, c.precio_compra, c.proveedor_id, c.fecha, c.usuario 
        FROM compras c 
        JOIN productos p ON c.producto_id = p.id 
        ORDER BY c.fecha DESC
    `, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al cargar compras' });
        }
        res.json(results);
    });
});

app.post('/api/compras', authenticateToken, (req, res) => {
    const { producto_id, cantidad, precio_compra, proveedor_id } = req.body;
    const user = req.user.usuario;

    if (!producto_id || cantidad <= 0 || !precio_compra) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    db.query("SELECT nombre FROM productos WHERE id = ?", [producto_id], (err, productRows) => {
        if (err || productRows.length === 0) {
            return res.status(400).json({ error: 'Producto no encontrado' });
        }

        const productoNombre = productRows[0].nombre;

        db.query(
            "INSERT INTO compras (producto_id, cantidad, precio_compra, proveedor_id, usuario) VALUES (?, ?, ?, ?, ?)",
            [producto_id, cantidad, precio_compra, proveedor_id, user],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al registrar compra' });
                }

                db.query(
                    "UPDATE productos SET stock = stock + ? WHERE id = ?",
                    [cantidad, producto_id],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: 'Error al actualizar stock' });
                        }

                        db.query(
                            "INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES (?, ?, ?, ?, ?)",
                            ['compra', productoNombre, cantidad, user, 'Compra registrada'],
                            (err) => { if (err) console.error('Error al registrar movimiento:', err); }
                        );

                        res.json({ success: true, message: 'Compra registrada' });
                    }
                );
            }
        );
    });
});

// ============================================================
// DASHBOARD
// ============================================================

app.get('/api/dashboard', authenticateToken, (req, res) => {
    const queries = {
        totalProductos: "SELECT COUNT(*) as count FROM productos",
        lowStock: "SELECT COUNT(*) as count FROM productos WHERE stock <= stock_min AND stock > 0",
        outStock: "SELECT COUNT(*) as count FROM productos WHERE stock = 0",
        ventasHoy: "SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE DATE(fecha) = CURDATE()",
        comprasHoy: "SELECT IFNULL(SUM(cantidad * precio_compra), 0) as total FROM compras WHERE DATE(fecha) = CURDATE()",
        totalUsuarios: "SELECT COUNT(*) as count FROM usuarios",
        ventasMes: "SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())",
        productosBajoStock: "SELECT codigo, nombre, stock, stock_min FROM productos WHERE stock <= stock_min AND stock > 0 ORDER BY stock ASC LIMIT 10",
        productosMasVendidos: `
            SELECT p.nombre, SUM(vd.cantidad) as total_vendido 
            FROM ventas_detalle vd 
            JOIN productos p ON vd.producto_id = p.id 
            GROUP BY p.id, p.nombre
            ORDER BY total_vendido DESC 
            LIMIT 5
        `
    };

    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    for (const [key, query] of Object.entries(queries)) {
        db.query(query, (err, rows) => {
            if (err) {
                console.error(`Error en ${key}:`, err);
                results[key] = key.includes('productos') ? [] : { count: 0, total: 0 };
            } else {
                results[key] = key.includes('productos') ? rows : rows[0];
            }

            completed++;
            if (completed === total) {
                res.json({
                    metrics: {
                        totalProductos: results.totalProductos?.count || 0,
                        lowStock: results.lowStock?.count || 0,
                        outStock: results.outStock?.count || 0,
                        ventasHoy: parseFloat(results.ventasHoy?.total || 0),
                        comprasHoy: parseFloat(results.comprasHoy?.total || 0),
                        totalUsuarios: results.totalUsuarios?.count || 0,
                        ventasMes: parseFloat(results.ventasMes?.total || 0)
                    },
                    productosBajoStock: results.productosBajoStock || [],
                    productosMasVendidos: results.productosMasVendidos || [],
                    ventasUltimaSemana: [],
                    stockPorCategoria: []
                });
            }
        });
    }
});

// ============================================================
// USUARIOS
// ============================================================

app.get('/api/usuarios', authenticateToken, (req, res) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    db.query("SELECT id, nombre, usuario, rol, estado, created_at FROM usuarios ORDER BY id DESC", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al cargar usuarios' });
        }
        res.json(results);
    });
});

app.post('/api/usuarios', authenticateToken, async (req, res) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { nombre, usuario, password, rol, estado } = req.body;

    if (!nombre || !usuario) {
        return res.status(400).json({ error: 'Nombre y usuario son requeridos' });
    }

    db.query("SELECT id FROM usuarios WHERE usuario = ?", [usuario], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        db.query(
            "INSERT INTO usuarios (nombre, usuario, password, rol, estado) VALUES (?, ?, ?, ?, ?)",
            [nombre, usuario, hashedPassword, rol || 'empleado', estado || 'activo'],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al crear usuario' });
                }
                res.json({ message: 'Usuario creado' });
            }
        );
    });
});

// ============================================================
// INVENTARIO
// ============================================================

app.get('/api/inventario/stock', authenticateToken, (req, res) => {
    const query = `
        SELECT codigo, nombre, stock, stock_min, categoria,
               CASE WHEN stock = 0 THEN 'agotado'
                    WHEN stock <= stock_min THEN 'bajo'
                    ELSE 'ok'
               END as estado_stock
        FROM productos
        WHERE estado = 'activo'
        ORDER BY 
            CASE 
                WHEN stock = 0 THEN 1
                WHEN stock <= stock_min THEN 2
                ELSE 3
            END,
            nombre ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en stock:', err);
            return res.status(500).json({ error: 'Error al cargar stock: ' + err.message });
        }
        res.json(results || []);
    });
});

app.get('/api/inventario/movimientos', authenticateToken, (req, res) => {
    const { tipo, producto, desde, hasta } = req.query;

    let query = "SELECT id, tipo, producto, cantidad, usuario, fecha, observaciones FROM movimientos WHERE 1=1";
    const params = [];

    if (tipo && tipo !== '') { query += " AND tipo = ?"; params.push(tipo); }
    if (producto && producto !== '') { query += " AND producto LIKE ?"; params.push(`%${producto}%`); }
    if (desde && desde !== '') { query += " AND DATE(fecha) >= ?"; params.push(desde); }
    if (hasta && hasta !== '') { query += " AND DATE(fecha) <= ?"; params.push(hasta); }

    query += " ORDER BY fecha DESC LIMIT 200";

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error en movimientos:', err);
            return res.status(500).json({ error: 'Error al cargar movimientos: ' + err.message });
        }
        res.json(results || []);
    });
});

// ============================================================
// REPORTES — INVENTARIO
// ============================================================

app.get('/api/reportes/inventario', authenticateToken, (req, res) => {
    const { formato } = req.query;
    
    const query = `
        SELECT p.codigo, p.nombre, p.categoria, 
               COALESCE(prov.nombre, p.proveedor, 'N/A') as proveedor,
               p.stock, p.stock_min as minimo,
               CASE WHEN p.stock <= p.stock_min THEN 'BAJO' ELSE 'NORMAL' END as estado
        FROM productos p
        LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
        ORDER BY p.nombre
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en reporte inventario:', err);
            return res.status(500).json({ error: 'Error al generar reporte' });
        }
        
        if (formato === 'csv') {
            let csv = '\uFEFF';
            csv += 'Código,Nombre,Categoría,Proveedor,Stock,Mínimo,Estado\n';
            
            results.forEach(row => {
                const escape = (str) => {
                    if (str === null || str === undefined) return '';
                    str = String(str);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        str = str.replace(/"/g, '""');
                        return `"${str}"`;
                    }
                    return str;
                };
                
                csv += `${escape(row.codigo)},${escape(row.nombre)},${escape(row.categoria)},${escape(row.proveedor)},${row.stock},${row.minimo},${escape(row.estado)}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_inventario_${Date.now()}.csv"`);
            return res.send(csv);
        }
        
        res.json(results);
    });
});

// ============================================================
// REPORTES — VENTAS
// ============================================================

app.get('/api/reportes/ventas', authenticateToken, (req, res) => {
    const { formato } = req.query;
    
    const query = `
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
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en reporte ventas:', err);
            return res.status(500).json({ error: 'Error al generar reporte' });
        }
        
        if (formato === 'csv') {
            let csv = '\uFEFF';
            csv += 'Fecha,Folio,Productos,Total,Tipo Pago,Observaciones,Usuario\n';
            
            results.forEach(row => {
                const escape = (str) => {
                    if (str === null || str === undefined) return '';
                    str = String(str);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        str = str.replace(/"/g, '""');
                        return `"${str}"`;
                    }
                    return str;
                };
                
                csv += `${escape(row.fecha)},${escape(row.folio)},${escape(row.productos)},${row.total},${escape(row.tipo_pago)},${escape(row.observaciones)},${escape(row.usuario)}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${Date.now()}.csv"`);
            return res.send(csv);
        }
        
        res.json(results);
    });
});

// ============================================================
// REPORTES — MOVIMIENTOS
// ============================================================

app.get('/api/reportes/movimientos', authenticateToken, (req, res) => {
    const { formato } = req.query;
    
    const query = `
        SELECT fecha, tipo, producto, cantidad, usuario, 
               IFNULL(observaciones, '') as observaciones
        FROM movimientos 
        ORDER BY fecha DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en reporte movimientos:', err);
            return res.status(500).json({ error: 'Error al generar reporte' });
        }
        
        if (formato === 'csv') {
            let csv = '\uFEFF';
            csv += 'Fecha,Tipo,Producto,Cantidad,Usuario,Observaciones\n';
            
            results.forEach(row => {
                const escape = (str) => {
                    if (str === null || str === undefined) return '';
                    str = String(str);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        str = str.replace(/"/g, '""');
                        return `"${str}"`;
                    }
                    return str;
                };
                
                csv += `${escape(row.fecha)},${escape(row.tipo)},${escape(row.producto)},${row.cantidad},${escape(row.usuario)},${escape(row.observaciones)}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_movimientos_${Date.now()}.csv"`);
            return res.send(csv);
        }
        
        res.json(results);
    });
});

// ============================================================
// REPORTES — COMPRAS
// ============================================================

app.get('/api/reportes/compras', authenticateToken, (req, res) => {
    const { formato, proveedor_id, desde, hasta } = req.query;

    let query = `
        SELECT c.id, p.codigo, p.nombre as producto, 
               c.cantidad, c.precio_compra,
               (c.cantidad * c.precio_compra) as total,
               prov.nombre as proveedor,
               c.fecha, c.usuario
        FROM compras c
        JOIN productos p ON c.producto_id = p.id
        LEFT JOIN proveedores prov ON c.proveedor_id = prov.id
    `;

    const params = [];
    const conditions = [];

    if (proveedor_id && proveedor_id !== '') { conditions.push("c.proveedor_id = ?"); params.push(proveedor_id); }
    if (desde && desde !== '') { conditions.push("DATE(c.fecha) >= ?"); params.push(desde); }
    if (hasta && hasta !== '') { conditions.push("DATE(c.fecha) <= ?"); params.push(hasta); }

    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY c.fecha DESC";

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error en reporte de compras:', err);
            return res.status(500).json({ error: 'Error al generar reporte' });
        }

       if (formato === 'csv') {
    let csv = '\uFEFF'; // BOM para caracteres especiales
    csv += 'ID,Código,Producto,Cantidad,Precio Unitario,Total,Proveedor,Fecha,Usuario\n';
    
    results.forEach(row => {
        // Función para escapar campos de texto
        const escapeCSV = (str) => {
            if (str === null || str === undefined) return '""';
            str = String(str);
            // Si contiene comas, comillas dobles o saltos de línea, envolver entre comillas
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                str = str.replace(/"/g, '""'); // Escapar comillas dobles
                return `"${str}"`;
            }
            return str;
        };
        
        const producto = escapeCSV(row.producto);
        const codigo = escapeCSV(row.codigo);
        const proveedor = escapeCSV(row.proveedor || 'N/A');
        
        csv += `${row.id},${codigo},${producto},${row.cantidad},${row.precio_compra},${row.total},${proveedor},${row.fecha},${row.usuario}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_compras_${Date.now()}.csv"`);
    return res.send(csv);
}

        if (formato === 'pdf') {
            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_compras_${Date.now()}.pdf"`);
            doc.pipe(res);

            pdfHeader(doc, 'Reporte de Compras');

            const cols = [
                { label: 'ID',         key: 'id',           x: 40,  width: 30, align: 'right' },
                { label: 'Código',     key: 'codigo',       x: 75,  width: 60 },
                { label: 'Producto',   key: 'producto',     x: 140, width: 160 },
                { label: 'Cantidad',   key: 'cantidad',     x: 305, width: 55, align: 'right' },
                { label: 'P. Unit.',   key: 'precio_compra',x: 365, width: 65, align: 'right' },
                { label: 'Total',      key: 'total',        x: 435, width: 65, align: 'right' },
                { label: 'Proveedor',  key: 'proveedor',    x: 505, width: 90 },
                { label: 'Fecha',      key: 'fecha',        x: 600, width: 65 },
            ];

            pdfTableHeader(doc, cols);
            results.forEach((row, i) => {
                const displayRow = {
                    ...row,
                    fecha: row.fecha ? new Date(row.fecha).toLocaleDateString('es-MX') : '',
                    precio_compra: `$${Number(row.precio_compra).toFixed(2)}`,
                    total: `$${Number(row.total).toFixed(2)}`,
                    proveedor: row.proveedor || 'N/A'
                };
                pdfTableRow(doc, cols, displayRow, i);
            });

            const totalGeneral = results.reduce((sum, r) => sum + Number(r.total || 0), 0);
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold').fontSize(9)
               .text(`Total general: $${totalGeneral.toFixed(2)}`, 40, doc.y, { align: 'right', width: 625 });

            pdfFooter(doc, results.length);
            doc.end();
            return;
        }

        res.json(results);
    });
});

// ============================================================
// REPORTES — USUARIOS
// ============================================================

app.get('/api/reportes/usuarios', authenticateToken, (req, res) => {
    const { formato } = req.query;
    
    const query = `
        SELECT usuario, nombre, rol, estado
        FROM usuarios 
        ORDER BY nombre
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en reporte usuarios:', err);
            return res.status(500).json({ error: 'Error al generar reporte' });
        }
        
        if (formato === 'csv') {
            let csv = '\uFEFF';
            csv += 'Usuario,Nombre,Rol,Estado\n';
            
            results.forEach(row => {
                const escape = (str) => {
                    if (str === null || str === undefined) return '';
                    str = String(str);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        str = str.replace(/"/g, '""');
                        return `"${str}"`;
                    }
                    return str;
                };
                
                csv += `${escape(row.usuario)},${escape(row.nombre)},${escape(row.rol)},${escape(row.estado)}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_usuarios_${Date.now()}.csv"`);
            return res.send(csv);
        }
        
        res.json(results);
    });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('📋 Endpoints disponibles:');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/productos');
    console.log('   POST /api/productos');
    console.log('   PUT  /api/productos/:id');
    console.log('   DELETE /api/productos/:id');
    console.log('   GET  /api/ventas/recientes');
    console.log('   POST /api/ventas');
    console.log('   GET  /api/compras');
    console.log('   POST /api/compras');
    console.log('   GET  /api/reportes/inventario?formato=pdf|csv');
    console.log('   GET  /api/reportes/ventas?formato=pdf|csv');
    console.log('   GET  /api/reportes/movimientos?formato=pdf|csv');
    console.log('   GET  /api/reportes/compras?formato=pdf|csv');
    console.log('   GET  /api/reportes/usuarios?formato=pdf|csv');
    console.log('\n🔐 Credenciales de prueba:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: Admin123!\n');
});