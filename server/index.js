const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    
    // Crear tabla de usuarios si no existe
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
            
            // Insertar usuario admin si no existe
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

// ============== RUTAS DE AUTENTICACIÓN ==============
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
            user: {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                rol: user.rol
            }
        });
    });
});

// ============== MIDDLEWARE DE AUTENTICACIÓN ==============
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

app.get('/api/productos/activos', authenticateToken, (req, res) => {
    db.query("SELECT id, codigo, nombre, stock, precio_venta, precio_compra, proveedor_id FROM productos WHERE estado='activo' ORDER BY nombre", 
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al cargar productos' });
            }
            res.json(results);
        }
    );
});

// ============== RUTAS DE PRODUCTOS ==============

// Obtener todos los productos
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

// Obtener productos activos (para ventas y compras)
app.get('/api/productos/activos', authenticateToken, (req, res) => {
    const query = "SELECT id, codigo, nombre, stock, precio_venta, precio_compra, proveedor_id FROM productos WHERE estado='activo' ORDER BY nombre";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al cargar productos activos:', err);
            return res.status(500).json({ error: 'Error al cargar productos' });
        }
        res.json(results);
    });
});

// Obtener categorías de productos
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

// Crear producto
app.post('/api/productos', authenticateToken, (req, res) => {
    const { codigo, nombre, categoria, proveedor_id, precio_compra, precio_venta, stock, stock_min, estado } = req.body;

    if (!codigo || !nombre || !categoria) {
        return res.status(400).json({ error: 'Código, nombre y categoría son requeridos' });
    }

    // Verificar si el código ya existe
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

// Actualizar producto
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

// Eliminar producto
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

app.get('/api/productos/categorias', authenticateToken, (req, res) => {
    db.query("SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al cargar categorías' });
        }
        res.json(results.map(r => r.categoria));
    });
});

app.get('/api/proveedores', authenticateToken, (req, res) => {
    const query = "SELECT id, nombre FROM proveedores ORDER BY nombre";
    
    db.query(query, (err, results) => {
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



// ============== RUTAS DE VENTAS ==============
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
                                
                                // ✅ REGISTRAR MOVIMIENTO CON OBSERVACIONES DEL USUARIO
                                const cantidadNegativa = -item.cantidad;
                                const observacionesVenta = notas && notas.trim() !== '' ? notas : `Venta ${folio}`;
                                
                                db.query(
                                    "INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES (?, ?, ?, ?, ?)",
                                    ['venta', item.nombre, cantidadNegativa, user, observacionesVenta],
                                    (err) => {
                                        if (err) console.error('Error al registrar movimiento:', err);
                                    }
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
        if (err || ventaRows.length === 0) {
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
                return res.status(500).json({ error: 'Error al cargar detalles' });
            }
            
            let subtotal = 0;
            let totalDescuento = 0;
            detalleRows.forEach(item => {
                subtotal += item.precio_unit * item.cantidad;
                totalDescuento += item.descuento || 0;
            });
            
            res.json({
                venta: { ...venta, subtotal, total_descuento: totalDescuento },
                detalles: detalleRows
            });
        });
    });
});

// ============== RUTAS DE COMPRAS ==============
app.get('/api/compras', authenticateToken, (req, res) => {
    db.query(`
        SELECT c.id, p.codigo, p.nombre, c.cantidad, c.precio_compra, c.proveedor, c.fecha, c.usuario 
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
                        
                        // ✅ REGISTRAR MOVIMIENTO (AGREGAR ESTO)
                       // Usar las observaciones/notas que escribió el usuario
const observacionesVenta = notas && notas.trim() !== '' ? notas : `Venta ${folio}`;

db.query(
    "INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES (?, ?, ?, ?, ?)",
    ['venta', item.nombre, cantidadNegativa, user, observacionesVenta],
    (err) => { if (err) console.error('Error al registrar movimiento:', err); }
);
                        
                        res.json({ success: true, message: 'Compra registrada' });
                    }
                );
            }
        );
    });
});

// ============== RUTAS DE DASHBOARD ==============
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

// ============== RUTAS DE USUARIOS ==============
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
// ============== TICKET ==============
app.get('/api/ventas/:id/ticket', authenticateToken, (req, res) => {
    const id = req.params.id;
    console.log('GET /api/ventas/' + id + '/ticket');
    
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
            
            // Convertir valores a números
            const detalles = detalleRows.map(row => ({
                ...row,
                cantidad: Number(row.cantidad),
                precio_unit: Number(row.precio_unit),
                descuento: Number(row.descuento || 0),
                subtotal: Number(row.subtotal)
            }));
            
            res.json({
                venta: {
                    ...venta,
                    total: Number(venta.total)
                },
                detalles: detalles
            });
        });
    });
});
// ============== INVENTARIO ==============
app.get('/api/inventario/stock', authenticateToken, (req, res) => {
    console.log('Solicitud GET /api/inventario/stock');
    
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
        console.log(`Stock cargado: ${results.length} productos`);
        res.json(results || []);
    });
});

app.get('/api/inventario/movimientos', authenticateToken, (req, res) => {
    console.log('Solicitud GET /api/inventario/movimientos', req.query);
    
    const { tipo, producto, desde, hasta } = req.query;
    
    let query = "SELECT id, tipo, producto, cantidad, usuario, fecha, observaciones FROM movimientos WHERE 1=1";
    const params = [];
    
    if (tipo && tipo !== '') {
        query += " AND tipo = ?";
        params.push(tipo);
    }
    
    if (producto && producto !== '') {
        query += " AND producto LIKE ?";
        params.push(`%${producto}%`);
    }
    
    if (desde && desde !== '') {
        query += " AND DATE(fecha) >= ?";
        params.push(desde);
    }
    
    if (hasta && hasta !== '') {
        query += " AND DATE(fecha) <= ?";
        params.push(hasta);
    }
    
    query += " ORDER BY fecha DESC LIMIT 200";
    
    console.log('Query:', query);
    console.log('Params:', params);
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error en movimientos:', err);
            return res.status(500).json({ error: 'Error al cargar movimientos: ' + err.message });
        }
        console.log(`Movimientos cargados: ${results.length}`);
        res.json(results || []);
    });
});
// ============== INICIAR SERVIDOR ==============
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('📋 Endpoints disponibles:');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/productos');
    console.log('   GET  /api/ventas/recientes');
    console.log('   POST /api/ventas');
    console.log('   GET  /api/compras');
    console.log('   POST /api/compras');
    console.log('\n🔐 Credenciales de prueba:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: Admin123!\n');
});
// ============== REPORTES ==============
app.get('/api/reportes/inventario', authenticateToken, (req, res) => {
  const { formato } = req.query;
  
  const query = `
    SELECT codigo, nombre, categoria, 
           IFNULL(proveedor, '') as proveedor, 
           stock, stock_min as minimo,
           CASE WHEN stock <= stock_min THEN 'BAJO' ELSE 'NORMAL' END as estado
    FROM productos 
    ORDER BY nombre
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al generar reporte' });
    }
    
    if (formato === 'csv') {
      let csv = '\uFEFF';
      csv += 'Código,Nombre,Categoría,Proveedor,Stock,Mínimo,Estado\n';
      results.forEach(row => {
        csv += `"${row.codigo}","${row.nombre}","${row.categoria || ''}","${row.proveedor}",${row.stock},${row.minimo},"${row.estado}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_inventario_${Date.now()}.csv"`);
      return res.send(csv);
    }
    
    res.json(results);
  });
});

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
      console.error(err);
      return res.status(500).json({ error: 'Error al generar reporte' });
    }
    
    if (formato === 'csv') {
      let csv = '\uFEFF';
      csv += 'Fecha,Folio,Productos,Total,Tipo Pago,Observaciones,Usuario\n';
      results.forEach(row => {
        csv += `"${row.fecha}","${row.folio}","${row.productos}",${row.total},"${row.tipo_pago}","${row.observaciones}","${row.usuario}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${Date.now()}.csv"`);
      return res.send(csv);
    }
    
    res.json(results);
  });
});

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
      console.error(err);
      return res.status(500).json({ error: 'Error al generar reporte' });
    }
    
    if (formato === 'csv') {
      let csv = '\uFEFF';
      csv += 'Fecha,Tipo,Producto,Cantidad,Usuario,Observaciones\n';
      results.forEach(row => {
        csv += `"${row.fecha}","${row.tipo}","${row.producto}",${row.cantidad},"${row.usuario}","${row.observaciones}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_movimientos_${Date.now()}.csv"`);
      return res.send(csv);
    }
    
    res.json(results);
  });
});

app.get('/api/reportes/usuarios', authenticateToken, (req, res) => {
  const { formato } = req.query;
  
  const query = `
    SELECT usuario, nombre, rol, estado
    FROM usuarios 
    ORDER BY nombre
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al generar reporte' });
    }
    
    if (formato === 'csv') {
      let csv = '\uFEFF';
      csv += 'Usuario,Nombre,Rol,Estado\n';
      results.forEach(row => {
        csv += `"${row.usuario}","${row.nombre}","${row.rol}","${row.estado}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_usuarios_${Date.now()}.csv"`);
      return res.send(csv);
    }
    
    res.json(results);
  });
});
// ============== INVENTARIO ==============
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
            return res.status(500).json({ error: 'Error al cargar stock' });
        }
        res.json(results || []);
    });
});

// ============== CREAR PRODUCTO ==============
app.post('/api/productos', authenticateToken, (req, res) => {
    const { codigo, nombre, categoria, proveedor, precio_compra, precio_venta, stock, stock_min, estado } = req.body;

    if (!codigo || !nombre || !categoria) {
        return res.status(400).json({ error: 'Código, nombre y categoría son requeridos' });
    }

    db.query("SELECT id FROM productos WHERE codigo = ?", [codigo], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (results.length > 0) return res.status(400).json({ error: 'El código de producto ya existe' });

        db.query(
            "INSERT INTO productos (codigo, nombre, categoria, proveedor, precio_compra, precio_venta, stock, stock_min, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [codigo, nombre, categoria, proveedor || '', precio_compra || 0, precio_venta || 0, stock || 0, stock_min || 0, estado || 'activo'],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al crear producto' });
                }
                res.json({ success: true, id: result.insertId, message: 'Producto creado' });
            }
        );
    });
});

// ============== EDITAR PRODUCTO ==============
app.put('/api/productos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, proveedor, precio_compra, precio_venta, stock, stock_min, estado } = req.body;

    if (!nombre || !categoria) {
        return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
    }

    db.query(
        "UPDATE productos SET nombre=?, categoria=?, proveedor=?, precio_compra=?, precio_venta=?, stock=?, stock_min=?, estado=? WHERE id=?",
        [nombre, categoria, proveedor || '', precio_compra || 0, precio_venta || 0, stock || 0, stock_min || 0, estado || 'activo', id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al actualizar producto' });
            }
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
            res.json({ success: true, message: 'Producto actualizado' });
        }
    );
});

// ============== ELIMINAR PRODUCTO ==============
app.delete('/api/productos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM productos WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al eliminar producto' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ success: true, message: 'Producto eliminado' });
    });
});

app.get('/api/inventario/movimientos', authenticateToken, (req, res) => {
    const { tipo, producto, desde, hasta } = req.query;
    
    let query = "SELECT id, tipo, producto, cantidad, usuario, fecha, observaciones FROM movimientos WHERE 1=1";
    const params = [];
    
    if (tipo && tipo !== '') {
        query += " AND tipo = ?";
        params.push(tipo);
    }
    
    if (producto && producto !== '') {
        query += " AND producto LIKE ?";
        params.push(`%${producto}%`);
    }
    
    if (desde && desde !== '') {
        query += " AND DATE(fecha) >= ?";
        params.push(desde);
    }
    
    if (hasta && hasta !== '') {
        query += " AND DATE(fecha) <= ?";
        params.push(hasta);
    }
    
    query += " ORDER BY fecha DESC LIMIT 200";
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error en movimientos:', err);
            return res.status(500).json({ error: 'Error al cargar movimientos' });
        }
        res.json(results || []);
    });
});