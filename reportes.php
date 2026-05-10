<?php
session_start();
if (!isset($_SESSION['usuario'])) { 
    header("Location: login.php"); 
    exit; 
}
require "conexion.php";

// Verificar permisos
$roles_con_acceso = ['propietaria', 'admin', 'administrador'];
$rol_usuario = $_SESSION['rol'] ?? '';

if (empty($rol_usuario) || !in_array(strtolower($rol_usuario), $roles_con_acceso)) {
    header("Location: dashboard.php");
    exit;
}

// Procesar generación de reportes
$reporte_tipo = isset($_GET['tipo']) ? $_GET['tipo'] : '';
$exportar = isset($_GET['exportar']) ? $_GET['exportar'] : '';

// Si se selecciona exportar, generar el reporte
if ($exportar && $reporte_tipo) {
    generarReporte($reporte_tipo, $exportar);
    exit;
}

function generarReporte($tipo, $formato) {
    global $conexion;
    
    // Obtener datos según el tipo de reporte
    $datos = [];
    $titulo = '';
    $columnas = [];

    switch($tipo) {
       case 'inventario':
    $titulo = 'REPORTE DE INVENTARIO';
    $columnas = ['Código', 'Nombre', 'Categoría', 'Proveedor', 'Stock', 'Mínimo', 'Estado'];
    $result = $conexion->query("
        SELECT p.codigo, p.nombre, p.categoria, 
               COALESCE(prov.nombre, p.proveedor, 'N/A') as proveedor,
               p.stock, p.stock_min as minimo,
               CASE WHEN p.stock <= p.stock_min THEN 'BAJO' ELSE 'NORMAL' END as estado
        FROM productos p
        LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
        ORDER BY p.nombre
    ");
    break;
            
        case 'ventas':
            $titulo = 'REPORTE DE VENTAS';
            // Usando las columnas que existen en la tabla ventas
            $columnas = ['Fecha', 'Folio', 'Productos', 'Total', 'Tipo Pago', 'Observaciones', 'Usuario'];
            $result = $conexion->query("
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
            ");
            break;
            
        case 'movimientos':
            $titulo = 'REPORTE DE MOVIMIENTOS';
            $columnas = ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Usuario', 'Observaciones'];
            $result = $conexion->query("
                SELECT fecha, tipo, producto, cantidad, usuario, observaciones
                FROM movimientos 
                ORDER BY fecha DESC
            ");
            break;

            case 'compras':
    $titulo = 'REPORTE DE COMPRAS';
    $columnas = ['ID', 'Código', 'Producto', 'Cantidad', 'Precio Unitario', 'Total', 'Proveedor', 'Fecha', 'Usuario'];
    $result = $conexion->query("
        SELECT c.id, p.codigo, p.nombre as producto, 
               c.cantidad, c.precio_compra,
               (c.cantidad * c.precio_compra) as total,
               COALESCE(prov.nombre, 'N/A') as proveedor,
               c.fecha, c.usuario
        FROM compras c
        JOIN productos p ON c.producto_id = p.id
        LEFT JOIN proveedores prov ON c.proveedor_id = prov.id
        ORDER BY c.fecha DESC
    ");
    break;
            
        case 'usuarios':
            $titulo = 'REPORTE DE USUARIOS';
            $columnas = ['Usuario', 'Nombre', 'Rol', 'Estado'];
            $result = $conexion->query("
                SELECT usuario, nombre, rol, estado
                FROM usuarios 
                ORDER BY nombre
            ");
            break;
    }

    if ($result && $result->num_rows > 0) {
        while($fila = $result->fetch_assoc()) {
            $datos[] = $fila;
        }
    }

    // Generar el formato solicitado
    if ($formato === 'csv') {
        generarCSV($titulo, $columnas, $datos);
    } elseif ($formato === 'pdf') {
        generarPDF($titulo, $columnas, $datos);
    }
}

function generarCSV($titulo, $columnas, $datos) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="reporte_grupo_aguila_' . date('Y-m-d_H-i-s') . '.csv"');
    
    // Crear el contenido CSV manualmente
    $csvContent = "\xEF\xBB\xBF"; // BOM para Excel
    
    // Encabezado del reporte con estilo
    $csvContent .= '"VIDRIOS Y ALUMINIOS GRUPO ÁGUILA"' . "\r\n";
    $csvContent .= '"Sistema de Gestión Comercial"' . "\r\n";
    $csvContent .= '"' . $titulo . '"' . "\r\n";
    $csvContent .= '"Generado: ' . date('d/m/Y H:i:s') . '"' . "\r\n";
    $csvContent .= '"Usuario: ' . $_SESSION['usuario'] . '"' . "\r\n";
    $csvContent .= "\r\n"; // Línea vacía
    
    // Encabezados de columnas
    $csvContent .= '"' . implode('","', $columnas) . '"' . "\r\n";
    
    // Datos
    foreach ($datos as $fila) {
        $csvContent .= '"' . implode('","', array_map(function($value) {
            // Escapar comillas dobles
            return str_replace('"', '""', $value);
        }, $fila)) . '"' . "\r\n";
    }
    
    // Footer
    $csvContent .= "\r\n";
    $csvContent .= '"Reporte generado automáticamente - Grupo Águila"' . "\r\n";
    
    // Output directo
    echo $csvContent;
    exit;
}

function generarPDF($titulo, $columnas, $datos) {
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title><?php echo $titulo; ?> - Grupo Águila</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                color: #5d4037;
                margin: 0;
                padding: 30px;
                min-height: 100vh;
            }
            
            .reporte-container {
                max-width: 1400px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(139, 69, 19, 0.1);
                overflow: hidden;
                border: 1px solid #d7ccc8;
            }
            
            .header {
                background: linear-gradient(135deg, #8d6e63, #a1887f);
                color: white;
                padding: 40px;
                text-align: center;
                position: relative;
            }
            
            .logo-container {
                margin-bottom: 20px;
            }
            
            .logo {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                border: 4px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                background: white;
                padding: 8px;
                margin: 0 auto 15px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .logo img {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .header h1 {
                font-size: 2.2rem;
                font-weight: 700;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .header h2 {
                font-size: 1.6rem;
                font-weight: 600;
                margin-bottom: 15px;
                opacity: 0.95;
            }
            
            .header p {
                font-size: 1rem;
                opacity: 0.9;
                margin-bottom: 5px;
            }
            
            .info-section {
                background: #f5f5f5;
                padding: 25px 40px;
                border-bottom: 2px dashed #bcaaa4;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
            }
            
            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                color: #5d4037;
                background: white;
                padding: 8px 15px;
                border-radius: 25px;
                border: 1px solid #d7ccc8;
            }
            
            .info-item strong {
                color: #8d6e63;
                font-weight: 600;
            }
            
            .table-container {
                padding: 30px 40px;
                background: white;
                overflow-x: auto;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(139, 69, 19, 0.08);
                min-width: 1000px;
            }
            
            thead {
                background: linear-gradient(135deg, #5d4037, #8d6e63);
            }
            
            th {
                color: white;
                padding: 18px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 0.85rem;
                border: none;
                position: relative;
                white-space: nowrap;
            }
            
            th:not(:last-child)::after {
                content: '';
                position: absolute;
                right: 0;
                top: 20%;
                height: 60%;
                width: 1px;
                background: rgba(255, 255, 255, 0.3);
            }
            
            td {
                padding: 14px 12px;
                border-bottom: 1px solid #f0f0f0;
                color: #5d4037;
                font-size: 0.82rem;
                transition: all 0.2s ease;
                vertical-align: top;
            }
            
            .observaciones {
                max-width: 200px;
                word-wrap: break-word;
                line-height: 1.3;
            }
            
            .tipo-pago {
                background: #e8f5e8;
                color: #2e7d32;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                display: inline-block;
            }
            
            tr:hover td {
                background: #fff8e1;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(139, 69, 19, 0.1);
            }
            
            tr:nth-child(even) {
                background: #fafafa;
            }
            
            tr:nth-child(even):hover td {
                background: #fff8e1;
            }
            
            .footer {
                background: linear-gradient(135deg, #f5f5f5, #eeeeee);
                padding: 30px 40px;
                text-align: center;
                border-top: 2px dashed #bcaaa4;
            }
            
            .footer p {
                color: #8d6e63;
                font-size: 0.9rem;
                font-weight: 500;
                margin: 0;
            }
            
            .no-print {
                background: #5d4037;
                padding: 25px 40px;
                text-align: center;
            }
            
            .btn {
                background: linear-gradient(135deg, #8d6e63, #a1887f);
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                margin: 0 10px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(139, 69, 19, 0.2);
            }
            
            .btn:hover {
                background: linear-gradient(135deg, #6d4c41, #8d6e63);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(139, 69, 19, 0.3);
            }
            
            @media print {
                body {
                    background: white;
                    padding: 0;
                    margin: 0;
                }
                
                .reporte-container {
                    box-shadow: none;
                    border: none;
                    border-radius: 0;
                }
                
                .no-print {
                    display: none;
                }
                
                .header {
                    background: #8d6e63 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                thead {
                    background: #5d4037 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                table {
                    min-width: auto;
                }
            }
            
            @media (max-width: 768px) {
                body {
                    padding: 15px;
                }
                
                .header {
                    padding: 25px 20px;
                }
                
                .header h1 {
                    font-size: 1.8rem;
                }
                
                .header h2 {
                    font-size: 1.3rem;
                }
                
                .info-section {
                    padding: 20px;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .table-container {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="reporte-container">
            <div class="header">
                <div class="logo-container">
                    <div class="logo">
                        <!-- Aquí va tu logo - reemplaza con la ruta correcta -->
                        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#8d6e63,#a1887f);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;text-align:center;">
                            <img src="img/ga.jpg" alt="Logo Grupo Águila" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">
                        </div>
                    </div>
                </div>
                <h1>Vidrios y Aluminios</h1>
                <h2>Grupo Águila</h2>
                <h2><?php echo $titulo; ?></h2>
            </div>

            <div class="info-section">
                <div class="info-item">
                    <strong>Fecha de generación:</strong> <?php echo date('d/m/Y H:i:s'); ?>
                </div>
                <div class="info-item">
                    <strong>Usuario:</strong> <?php echo $_SESSION['usuario']; ?>
                </div>
                <div class="info-item">
                    <strong>Registros:</strong> <?php echo count($datos); ?>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <?php foreach($columnas as $columna): ?>
                                <th><?php echo $columna; ?></th>
                            <?php endforeach; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($datos as $fila): ?>
                            <tr>
                                <?php foreach($fila as $campo => $valor): ?>
                                    <td class="<?php 
                                        if ($campo === 'observaciones') echo 'observaciones';
                                        if ($campo === 'tipo_pago') echo 'tipo-pago';
                                    ?>">
                                        <?php 
                                        if ($campo === 'total' || (is_numeric($valor) && strpos($valor, '.') !== false)) {
                                            echo '$' . number_format($valor, 2);
                                        } elseif ($campo === 'tipo_pago') {
                                            echo '<span class="tipo-pago">' . htmlspecialchars($valor) . '</span>';
                                        } else {
                                            echo htmlspecialchars($valor);
                                        }
                                        ?>
                                    </td>
                                <?php endforeach; ?>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>Vidrios y Aluminios Grupo Águila - Reporte generado automáticamente</p>
                <p>Sistema de Gestión Comercial - <?php echo date('d/m/Y'); ?></p>
            </div>

            <div class="no-print">
                <button class="btn" onclick="window.print()">Imprimir Reporte</button>
                <button class="btn" onclick="window.close()">Cerrar Ventana</button>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generar Reporte - Grupo Águila</title>
    <link rel="stylesheet" href="css/estilos.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #f5f5f5;
            color: #333;
            min-height: 100vh;
        }

        .main-container {
            display: flex;
            min-height: 100vh;
        }

        .main-content {
            flex: 1;
            padding: 40px;
            margin-left: 250px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(139, 69, 19, 0.1);
            width: 100%;
            max-width: 500px;
            border: 1px solid #d7ccc8;
        }

        h1 {
            color: #5d4037;
            margin-bottom: 30px;
            font-size: 24px;
            text-align: center;
            font-weight: 600;
        }

        .select-container {
            margin-bottom: 25px;
        }

        .select-container label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #5d4037;
        }

        select {
            width: 100%;
            padding: 12px;
            border: 2px solid #d7ccc8;
            border-radius: 8px;
            font-size: 16px;
            background: white;
            color: #5d4037;
            transition: all 0.3s ease;
        }

        select:focus {
            border-color: #8d6e63;
            box-shadow: 0 0 0 3px rgba(141, 110, 99, 0.1);
            outline: none;
        }

        .exportar-container {
            margin: 25px 0;
        }

        .btn-exportar {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #8d6e63, #a1887f);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(139, 69, 19, 0.2);
        }

        .btn-exportar:hover {
            background: linear-gradient(135deg, #6d4c41, #8d6e63);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 69, 19, 0.3);
        }

        .info-reporte {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #8d6e63;
        }

        .info-reporte h3 {
            color: #5d4037;
            margin-bottom: 10px;
            font-size: 16px;
            font-weight: 600;
        }

        .info-reporte p {
            margin-bottom: 8px;
            font-size: 14px;
            color: #666;
        }

        .info-reporte strong {
            color: #5d4037;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #8d6e63;
            font-size: 14px;
            text-align: center;
        }

        .hidden {
            display: none;
        }

        .formato-container {
            background: #f5f5f5;
            padding: 25px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #d7ccc8;
        }
    </style>
</head>
<body>
    <?php include "menu.php"; ?>
    
    <div class="main-container">
        <div class="main-content">
            <div class="container">
                <h1>Generar Reporte</h1>
                
                <form method="GET" action="">
                    <!-- Select para tipo de reporte -->
                    <div class="select-container">
                        <label for="tipo_reporte">Seleccionar tipo de reporte:</label>
                        <select name="tipo" id="tipo_reporte" required onchange="mostrarOpciones(this.value)">
                            <option value="">Seleccionar reporte...</option>
                            <option value="inventario" <?php echo $reporte_tipo === 'inventario' ? 'selected' : ''; ?>>Reporte de INVENTARIO</option>
                            <option value="ventas" <?php echo $reporte_tipo === 'ventas' ? 'selected' : ''; ?>>Reporte de VENTAS</option>
                            <option value="movimientos" <?php echo $reporte_tipo === 'movimientos' ? 'selected' : ''; ?>>Reporte de MOVIMIENTOS</option>
                            <option value="usuarios" <?php echo $reporte_tipo === 'usuarios' ? 'selected' : ''; ?>>Reporte de USUARIOS</option>
                        </select>
                    </div>

                    <!-- Información del reporte seleccionado -->
                    <div id="info_reporte" class="info-reporte <?php echo $reporte_tipo ? '' : 'hidden'; ?>">
                        <?php if ($reporte_tipo): ?>
                            <?php
                            $info_reportes = [
                                'inventario' => [
                                    'titulo' => 'Reporte de INVENTARIO',
                                    'muestra' => 'Listado completo de productos',
                                    'campos' => 'Código, nombre, categoría, proveedor, stock, mínimo, estado',
                                    'util' => 'Revisión general de existencias'
                                ],
                                'ventas' => [
                                    'titulo' => 'Reporte de VENTAS',
                                    'muestra' => 'Historial completo de ventas',
                                    'campos' => 'Fecha, folio, productos, total, tipo pago, observaciones, usuario',
                                    'util' => 'Análisis de ventas y rendimiento'
                                ],
                                'movimientos' => [
                                    'titulo' => 'Reporte de MOVIMIENTOS',
                                    'muestra' => 'Todas las transacciones de inventario',
                                    'campos' => 'Fecha, tipo, producto, cantidad, usuario, observaciones',
                                    'util' => 'Auditoría y trazabilidad'
                                ],
                                'usuarios' => [
                                    'titulo' => 'Reporte de USUARIOS',
                                    'muestra' => 'Listado del personal del sistema',
                                    'campos' => 'Usuario, nombre, rol, estado',
                                    'util' => 'Gestión de accesos y permisos'
                                ]
                            ];
                            
                            if (isset($info_reportes[$reporte_tipo])) {
                                $info = $info_reportes[$reporte_tipo];
                            ?>
                                <h3><?php echo $info['titulo']; ?></h3>
                                <p><strong>Muestra:</strong> <?php echo $info['muestra']; ?></p>
                                <p><strong>Campos:</strong> <?php echo $info['campos']; ?></p>
                                <p><strong>Útil para:</strong> <?php echo $info['util']; ?></p>
                            <?php } ?>
                        <?php endif; ?>
                    </div>

                    <!-- Select para formato de exportación -->
                    <div id="formato_container" class="<?php echo $reporte_tipo ? 'formato-container' : 'hidden'; ?>">
                        <div class="select-container">
                            <label for="formato_exportar">Formato de exportación:</label>
                            <select name="exportar" id="formato_exportar" required>
                                <option value="">Seleccionar formato...</option>
                                <option value="csv">Exportar a CSV(Excel)</option>
                                <option value="pdf">Imprimir PDF</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn-exportar">
                            Generar Reporte
                        </button>
                    </div>
                </form>

                <div class="footer">
                    <p>Vidrios y Aluminios Grupo Águila - Reporte generado automáticamente</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function mostrarOpciones(tipo) {
            const infoDiv = document.getElementById('info_reporte');
            const formatoDiv = document.getElementById('formato_container');
            const infoReportes = {
                'inventario': {
                    titulo: 'Reporte de INVENTARIO',
                    muestra: 'Listado completo de productos',
                    campos: 'Código, nombre, categoría, proveedor, stock, mínimo, estado',
                    util: 'Revisión general de existencias'
                },
                'ventas': {
                    titulo: 'Reporte de VENTAS',
                    muestra: 'Historial completo de ventas',
                    campos: 'Fecha, folio, productos, total, tipo pago, observaciones, usuario',
                    util: 'Análisis de ventas y rendimiento'
                },
                'movimientos': {
                    titulo: 'Reporte de MOVIMIENTOS',
                    muestra: 'Todas las transacciones de inventario',
                    campos: 'Fecha, tipo, producto, cantidad, usuario, observaciones',
                    util: 'Auditoría y trazabilidad'
                },
                'usuarios': {
                    titulo: 'Reporte de USUARIOS',
                    muestra: 'Listado del personal del sistema',
                    campos: 'Usuario, nombre, rol, estado',
                    util: 'Gestión de accesos y permisos'
                }
            };

            if (tipo && infoReportes[tipo]) {
                const info = infoReportes[tipo];
                infoDiv.innerHTML = `
                    <h3>${info.titulo}</h3>
                    <p><strong>Muestra:</strong> ${info.muestra}</p>
                    <p><strong>Campos:</strong> ${info.campos}</p>
                    <p><strong>Útil para:</strong> ${info.util}</p>
                `;
                infoDiv.classList.remove('hidden');
                formatoDiv.classList.remove('hidden');
                formatoDiv.classList.add('formato-container');
            } else {
                infoDiv.classList.add('hidden');
                formatoDiv.classList.add('hidden');
                formatoDiv.classList.remove('formato-container');
            }
        }

        // Mostrar información si ya hay un reporte seleccionado al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            const tipoSeleccionado = document.getElementById('tipo_reporte').value;
            if (tipoSeleccionado) {
                mostrarOpciones(tipoSeleccionado);
            }
        });
    </script>
</body>
</html>