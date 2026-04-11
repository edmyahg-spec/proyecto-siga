<?php
session_start();
if (!isset($_SESSION['usuario'])) { header("Location: login.php"); exit; }
require "conexion.php";

// Métricas principales
$totalProd = $conexion->query("SELECT COUNT(*) c FROM productos")->fetch_row()[0];
$lowStock = $conexion->query("SELECT COUNT(*) c FROM productos WHERE stock <= stock_min AND stock>0")->fetch_row()[0];
$outStock = $conexion->query("SELECT COUNT(*) c FROM productos WHERE stock = 0")->fetch_row()[0];
$ventasHoy = $conexion->query("SELECT IFNULL(SUM(total),0) s FROM ventas WHERE DATE(fecha)=CURDATE()")->fetch_row()[0];

// Métricas adicionales
$comprasHoy = $conexion->query("SELECT IFNULL(SUM(cantidad * precio_compra),0) s FROM compras WHERE DATE(fecha)=CURDATE()")->fetch_row()[0];
$totalUsuarios = $conexion->query("SELECT COUNT(*) c FROM usuarios")->fetch_row()[0];
$ventasMes = $conexion->query("SELECT IFNULL(SUM(total),0) s FROM ventas WHERE MONTH(fecha)=MONTH(CURDATE()) AND YEAR(fecha)=YEAR(CURDATE())")->fetch_row()[0];

// Productos con bajo stock
$productosBajoStock = $conexion->query("
    SELECT codigo, nombre, stock, stock_min 
    FROM productos 
    WHERE stock <= stock_min AND stock > 0 
    ORDER BY stock ASC 
    LIMIT 10
");

// Productos agotados
$productosAgotados = $conexion->query("
    SELECT codigo, nombre, stock, stock_min 
    FROM productos 
    WHERE stock = 0 
    ORDER BY nombre ASC 
    LIMIT 10
");

// Productos más vendidos
$productosMasVendidos = $conexion->query("
    SELECT p.nombre, SUM(vd.cantidad) as total_vendido 
    FROM ventas_detalle vd 
    JOIN productos p ON vd.producto_id = p.id 
    GROUP BY p.id, p.nombre
    ORDER BY total_vendido DESC 
    LIMIT 5
");

// Stock por categoría
$stockPorCategoria = $conexion->query("
    SELECT IFNULL(categoria, 'Sin categoría') as categoria, 
           COUNT(*) as cantidad, 
           SUM(stock) as stock_total 
    FROM productos 
    GROUP BY categoria 
    ORDER BY cantidad DESC
    LIMIT 6
");

// Ventas última semana
$ventasUltimaSemana = $conexion->query("
    SELECT DATE(fecha) as dia, IFNULL(SUM(total), 0) as total 
    FROM ventas 
    WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
    GROUP BY DATE(fecha) 
    ORDER BY dia
");

// Verificar si hay datos para los gráficos
$hayVentasSemana = $ventasUltimaSemana->num_rows > 0;
$hayCategorias = $stockPorCategoria->num_rows > 0;
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Tablero - Vidrios y Aluminios Grupo Águila</title>
<link rel="stylesheet" href="css/estilos.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #f5f5f5;
        color: #333;
        min-height: 100vh;
    }

    .main {
        padding: 20px;
        min-height: calc(100vh - 60px);
        margin-top: 80px; /* Añadido margen superior para separar del header */
    }

    .container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        background: #ffffff;
        padding: 20px 25px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-left: 4px solid #8B7355;
    }

    .header h1 {
        font-size: 24px;
        color: #5D4037;
        margin-bottom: 5px;
        font-weight: 600;
    }

    .header p {
        color: #757575;
        font-size: 14px;
    }

    .welcome-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .welcome-text h2 {
        color: #5D4037;
        font-size: 18px;
        margin-bottom: 3px;
    }

    .welcome-text p {
        color: #757575;
        font-size: 13px;
    }

    .date-info {
        background: #8B7355;
        color: white;
        padding: 8px 15px;
        border-radius: 6px;
        font-weight: 500;
        font-size: 13px;
    }

    .grid-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 25px;
    }

    .card {
        background: #ffffff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
        border-left: 4px solid;
        position: relative;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .card-productos {
        border-left-color: #8B7355;
    }

    .card-bajo-stock {
        border-left-color: #A1887F;
    }

    .card-agotados {
        border-left-color: #795548;
    }

    .card-ventas-hoy {
        border-left-color: #6D4C41;
    }

    .card-compras-hoy {
        border-left-color: #5D4037;
    }

    .card-usuarios {
        border-left-color: #4E342E;
    }

    .card-ventas-mes {
        border-left-color: #3E2723;
    }

    .card h3 {
        font-size: 13px;
        color: #757575;
        text-transform: uppercase;
        margin-bottom: 8px;
        font-weight: 500;
        letter-spacing: 0.5px;
    }

    .value {
        font-size: 28px;
        font-weight: 600;
        color: #5D4037;
        margin-bottom: 5px;
    }

    .card-footer {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #9E9E9E;
    }

    .product-list {
        margin-top: 15px;
        max-height: 200px;
        overflow-y: auto;
    }

    .product-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .product-item:last-child {
        border-bottom: none;
    }

    .product-info {
        flex: 1;
    }

    .product-name {
        font-size: 12px;
        color: #5D4037;
        font-weight: 500;
        margin-bottom: 2px;
    }

    .product-code {
        font-size: 10px;
        color: #9E9E9E;
    }

    .product-stock {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 8px;
        text-align: center;
        min-width: 40px;
    }

    .stock-warning {
        background: #FFF3E0;
        color: #EF6C00;
    }

    .stock-danger {
        background: #FFEBEE;
        color: #C62828;
    }

    .empty-list {
        text-align: center;
        color: #9E9E9E;
        font-style: italic;
        font-size: 12px;
        padding: 20px 0;
    }

    .charts-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        margin-bottom: 25px;
    }

    .chart-card {
        background: #ffffff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .chart-card h3 {
        color: #5D4037;
        margin-bottom: 15px;
        font-weight: 600;
        border-bottom: 1px solid #E0E0E0;
        padding-bottom: 8px;
        font-size: 16px;
    }

    .chart-container {
        height: 250px;
        position: relative;
    }

    .no-data {
        text-align: center;
        color: #9E9E9E;
        padding: 40px 20px;
        font-style: italic;
        font-size: 14px;
    }

    .tables-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 25px;
    }

    .table-card {
        background: #ffffff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .table-card h3 {
        color: #5D4037;
        margin-bottom: 15px;
        font-weight: 600;
        border-bottom: 1px solid #E0E0E0;
        padding-bottom: 8px;
        font-size: 16px;
    }

    .table-container {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        background: #5D4037;
        color: white;
        padding: 10px 12px;
        text-align: left;
        font-weight: 500;
        font-size: 13px;
    }

    td {
        padding: 10px 12px;
        border-bottom: 1px solid #E0E0E0;
        color: #616161;
        font-size: 13px;
    }

    tr:hover {
        background-color: #FAFAFA;
    }

    .badge {
        padding: 3px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
    }

    .badge-success {
        background: #E8F5E8;
        color: #2E7D32;
    }

    .badge-warning {
        background: #FFF3E0;
        color: #EF6C00;
    }

    .badge-danger {
        background: #FFEBEE;
        color: #C62828;
    }

    .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 20px;
    }

    .action-btn {
        background: #8B7355;
        color: white;
        padding: 12px;
        border-radius: 6px;
        text-decoration: none;
        text-align: center;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
    }

    .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(139, 115, 85, 0.3);
        background: #795548;
    }

    .action-btn.warning {
        background: #A1887F;
    }

    .action-btn.warning:hover {
        box-shadow: 0 2px 6px rgba(161, 136, 127, 0.3);
        background: #8D6E63;
    }

    .action-btn.success {
        background: #6D4C41;
    }

    .action-btn.success:hover {
        box-shadow: 0 2px 6px rgba(109, 76, 65, 0.3);
        background: #5D4037;
    }

    @media (max-width: 1024px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }
        
        .tables-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .grid-cards {
            grid-template-columns: 1fr;
        }
        
        .welcome-section {
            flex-direction: column;
            gap: 10px;
            text-align: center;
        }
        
        .quick-actions {
            grid-template-columns: 1fr;
        }
        
        .main {
            padding: 15px;
            margin-top: 70px; /* Margen reducido para móviles */
        }
        
        .container {
            padding: 0 10px;
        }
    }
</style>
</head>
<body>
<?php include "menu.php"; ?>

<main class="main">
  <div class="container">
    <div class="header">
        <p>Sistema de Gestión Comercial - Tablero</p>
        
        <div class="welcome-section">
            <div class="welcome-text">
                <h2>Bienvenido, <?php echo $_SESSION['usuario']; ?></h2>
                <p>Resumen general del sistema</p>
            </div>
            <div class="date-info">
                <?php echo date('d/m/Y - H:i'); ?>
            </div>
        </div>
    </div>

    <!-- Métricas principales -->
    <div class="grid-cards">
      <div class="card card-productos">
        <h3>Productos Totales</h3>
        <div class="value"><?= $totalProd ?></div>
        <div class="card-footer">
            Todos los productos registrados
        </div>
      </div>
      
      <div class="card card-bajo-stock">
        <h3>Bajo Stock</h3>
        <div class="value"><?= $lowStock ?></div>
        <div class="card-footer">
            Productos que necesitan reposición
        </div>
        
        <?php if ($productosBajoStock->num_rows > 0): ?>
        <div class="product-list">
            <?php while($producto = $productosBajoStock->fetch_assoc()): ?>
            <div class="product-item">
                <div class="product-info">
                    <div class="product-name"><?= htmlspecialchars($producto['nombre']) ?></div>
                    <div class="product-code"><?= htmlspecialchars($producto['codigo']) ?></div>
                </div>
                <div class="product-stock stock-warning">
                    <?= intval($producto['stock']) ?>
                </div>
            </div>
            <?php endwhile; ?>
        </div>
        <?php else: ?>
        <div class="empty-list">
            No hay productos con bajo stock
        </div>
        <?php endif; ?>
      </div>
      
      <div class="card card-agotados">
        <h3>Agotados</h3>
        <div class="value"><?= $outStock ?></div>
        <div class="card-footer">
            Productos sin existencia
        </div>
        
        <?php if ($productosAgotados->num_rows > 0): ?>
        <div class="product-list">
            <?php while($producto = $productosAgotados->fetch_assoc()): ?>
            <div class="product-item">
                <div class="product-info">
                    <div class="product-name"><?= htmlspecialchars($producto['nombre']) ?></div>
                    <div class="product-code"><?= htmlspecialchars($producto['codigo']) ?></div>
                </div>
                <div class="product-stock stock-danger">
                    <?= intval($producto['stock']) ?>
                </div>
            </div>
            <?php endwhile; ?>
        </div>
        <?php else: ?>
        <div class="empty-list">
            No hay productos agotados
        </div>
        <?php endif; ?>
      </div>
      
      <div class="card card-ventas-hoy">
        <h3>Ventas Hoy</h3>
        <div class="value">$<?= number_format($ventasHoy,2) ?></div>
        <div class="card-footer">
            Total vendido hoy
        </div>
      </div>

      <div class="card card-compras-hoy">
        <h3>Compras Hoy</h3>
        <div class="value">$<?= number_format($comprasHoy,2) ?></div>
        <div class="card-footer">
            Total comprado hoy
        </div>
      </div>

      <div class="card card-usuarios">
        <h3>Usuarios</h3>
        <div class="value"><?= $totalUsuarios ?></div>
        <div class="card-footer">
            Usuarios del sistema
        </div>
      </div>

      <div class="card card-ventas-mes">
        <h3>Ventas del Mes</h3>
        <div class="value">$<?= number_format($ventasMes,2) ?></div>
        <div class="card-footer">
            Total del mes actual
        </div>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="charts-grid">
        <div class="chart-card">
            <h3>Ventas de la Última Semana</h3>
            <div class="chart-container">
                <?php if ($hayVentasSemana): ?>
                    <canvas id="ventasChart"></canvas>
                <?php else: ?>
                    <div class="no-data">
                        <p>No hay datos de ventas para la última semana</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="chart-card">
            <h3>Stock por Categoría</h3>
            <div class="chart-container">
                <?php if ($hayCategorias): ?>
                    <canvas id="stockChart"></canvas>
                <?php else: ?>
                    <div class="no-data">
                        <p>No hay datos de categorías disponibles</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Tablas informativas -->
    <div class="tables-grid">
        <div class="table-card">
            <h3>Productos Más Vendidos</h3>
            <div class="table-container">
                <?php if ($productosMasVendidos->num_rows > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Unidades Vendidas</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($producto = $productosMasVendidos->fetch_assoc()): ?>
                        <tr>
                            <td><?= htmlspecialchars($producto['nombre']) ?></td>
                            <td><?= $producto['total_vendido'] ?></td>
                            <td>
                                <span class="badge badge-success">Popular</span>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                <?php else: ?>
                    <div class="no-data">
                        <p>No hay datos de productos vendidos</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <div class="table-card">
            <h3>Resumen por Categoría</h3>
            <div class="table-container">
                <?php if ($stockPorCategoria->num_rows > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Productos</th>
                            <th>Stock Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($categoria = $stockPorCategoria->fetch_assoc()): ?>
                        <tr>
                            <td><?= htmlspecialchars($categoria['categoria']) ?></td>
                            <td><?= $categoria['cantidad'] ?></td>
                            <td><?= $categoria['stock_total'] ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                <?php else: ?>
                    <div class="no-data">
                        <p>No hay datos de categorías disponibles</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
  </div>
</main>

<?php if ($hayVentasSemana || $hayCategorias): ?>
<script>
// Gráfico de ventas
<?php if ($hayVentasSemana): ?>
const ventasCtx = document.getElementById('ventasChart').getContext('2d');
const ventasChart = new Chart(ventasCtx, {
    type: 'line',
    data: {
        labels: [
            <?php 
            $ventasUltimaSemana->data_seek(0);
            while($venta = $ventasUltimaSemana->fetch_assoc()): 
                echo "'" . date('d/m', strtotime($venta['dia'])) . "',";
            endwhile; 
            ?>
        ],
        datasets: [{
            label: 'Ventas ($)',
            data: [
                <?php 
                $ventasUltimaSemana->data_seek(0);
                while($venta = $ventasUltimaSemana->fetch_assoc()): 
                    echo $venta['total'] . ",";
                endwhile; 
                ?>
            ],
            borderColor: '#8B7355',
            backgroundColor: 'rgba(139, 115, 85, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#5D4037'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.05)'
                },
                ticks: {
                    color: '#757575'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#757575'
                }
            }
        }
    }
});
<?php endif; ?>

// Gráfico de stock por categoría
<?php if ($hayCategorias): ?>
const stockCtx = document.getElementById('stockChart').getContext('2d');
const stockChart = new Chart(stockCtx, {
    type: 'doughnut',
    data: {
        labels: [
            <?php 
            $stockPorCategoria->data_seek(0);
            while($cat = $stockPorCategoria->fetch_assoc()): 
                echo "'" . htmlspecialchars($cat['categoria']) . "',";
            endwhile; 
            ?>
        ],
        datasets: [{
            data: [
                <?php 
                $stockPorCategoria->data_seek(0);
                while($cat = $stockPorCategoria->fetch_assoc()): 
                    echo $cat['stock_total'] . ",";
                endwhile; 
                ?>
            ],
            backgroundColor: [
                '#8B7355', '#A1887F', '#795548', '#6D4C41', 
                '#5D4037', '#4E342E', '#3E2723', '#BCAAA4'
            ],
            borderWidth: 1,
            borderColor: '#fff'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#5D4037',
                    font: {
                        size: 11
                    }
                }
            }
        }
    }
});
<?php endif; ?>
</script>
<?php endif; ?>

</body>
</html>