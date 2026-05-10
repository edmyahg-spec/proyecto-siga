<?php
session_start();
if (!isset($_SESSION['usuario'])) { header("Location: login.php"); exit; }
if ($_SESSION['rol'] !== 'admin') { header("Location: dashboard.php"); exit; }
require "conexion.php";


$filtro_tipo    = $_GET['tipo'] ?? '';
$filtro_product = trim($_GET['producto'] ?? '');
$filtro_desde   = $_GET['desde'] ?? '';
$filtro_hasta   = $_GET['hasta'] ?? '';


$where = "WHERE 1=1";
$params = [];
$types  = "";

if ($filtro_tipo) {
    $where .= " AND m.tipo = ?";
    $params[] = $filtro_tipo;
    $types   .= "s";
}
if ($filtro_product) {
    $where .= " AND m.producto LIKE ?";
    $like = "%$filtro_product%";
    $params[] = $like;
    $types   .= "s";
}
if ($filtro_desde) {
    $where .= " AND DATE(m.fecha) >= ?";
    $params[] = $filtro_desde;
    $types   .= "s";
}
if ($filtro_hasta) {
    $where .= " AND DATE(m.fecha) <= ?";
    $params[] = $filtro_hasta;
    $types   .= "s";
}

$sql = "SELECT m.id, m.tipo, m.producto, m.cantidad, m.usuario, m.fecha, m.observaciones
        FROM movimientos m
        $where
        ORDER BY m.fecha DESC";

$stmt = $conexion->prepare($sql);
if ($types) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$movimientos = $stmt->get_result();


$resumen = $conexion->query("
    SELECT p.codigo, p.nombre, p.stock, p.stock_min, p.categoria,
           CASE WHEN p.stock = 0 THEN 'agotado'
                WHEN p.stock <= p.stock_min THEN 'bajo'
                ELSE 'ok'
           END as estado_stock
    FROM productos p
    WHERE p.estado = 'activo'
    ORDER BY estado_stock ASC, p.nombre ASC
");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Inventario - Sistema</title>
<link rel="stylesheet" href="css/estilos.css">
<style>
.main-content {
    margin-left: 280px;
    padding: 20px;
    min-height: calc(100vh - 80px);
}

@media (max-width: 968px) {
    .main-content { margin-left: 0; padding: 15px; }
}

.section-card {
    background: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 25px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #3b2b1f;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f0;
}

.page-title   { color: #3b2b1f; font-size: 24px; font-weight: 700; margin-bottom: 5px; }
.page-subtitle{ color: #6c757d; font-size: 14px; margin-bottom: 25px; }

/* Tarjetas resumen */
.stock-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 5px;
}

.stock-card {
    padding: 14px;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    background: #fafafa;
}

.stock-card .prod-nombre {
    font-weight: 600;
    font-size: 13px;
    color: #3b2b1f;
    margin-bottom: 2px;
}

.stock-card .prod-codigo {
    font-size: 11px;
    color: #6c757d;
    margin-bottom: 8px;
}

.stock-card .prod-stock {
    font-size: 22px;
    font-weight: 700;
}

.stock-card .prod-min {
    font-size: 11px;
    color: #6c757d;
    margin-top: 2px;
}

.stock-ok     { border-left: 4px solid #28a745; }
.stock-ok .prod-stock { color: #28a745; }

.stock-bajo   { border-left: 4px solid #ffc107; }
.stock-bajo .prod-stock { color: #856404; }

.stock-agotado{ border-left: 4px solid #dc3545; }
.stock-agotado .prod-stock { color: #dc3545; }

/* Filtros */
.filtros-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    align-items: end;
}

.form-group { margin-bottom: 0; }
.form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #3b2b1f;
    margin-bottom: 5px;
}

.form-control {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
    background: #fafafa;
    box-sizing: border-box;
}

.form-control:focus {
    outline: none;
    border-color: #3b2b1f;
    background: #fff;
}

.btn-primary { background: #3b2b1f; color: white; padding: 9px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-outline { background: transparent; color: #3b2b1f; padding: 9px 18px; border: 1px solid #3b2b1f; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; text-decoration: none; display: inline-block; }

/* Tabla movimientos */
.mov-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 13px;
}

.mov-table th {
    background: #f8f9fa;
    padding: 11px 12px;
    text-align: left;
    font-weight: 600;
    color: #3b2b1f;
    border-bottom: 2px solid #dee2e6;
}

.mov-table td {
    padding: 11px 12px;
    border-bottom: 1px solid #dee2e6;
}

.badge {
    padding: 3px 9px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.badge-compra    { background: #d4edda; color: #155724; }
.badge-venta     { background: #f8d7da; color: #721c24; }
.badge-ajuste    { background: #d1ecf1; color: #0c5460; }

.cantidad-positiva { color: #28a745; font-weight: 700; }
.cantidad-negativa { color: #dc3545; font-weight: 700; }

.empty-row td {
    text-align: center;
    color: #6c757d;
    padding: 30px;
}
</style>
</head>
<body>

<?php include "menu.php"; ?>

<div class="main-content">
    <h1 class="page-title">Inventario</h1>
    <p class="page-subtitle">Resumen de stock y movimientos de entradas y salidas</p>

    <!-- Resumen de stock -->
    <div class="section-card">
        <h3 class="section-title">Stock actual por producto</h3>
        <div class="stock-grid">
            <?php while ($prod = $resumen->fetch_assoc()):
                $clase = 'stock-' . $prod['estado_stock'];
            ?>
                <div class="stock-card <?= $clase ?>">
                    <div class="prod-nombre"><?= htmlspecialchars($prod['nombre']) ?></div>
                    <div class="prod-codigo"><?= htmlspecialchars($prod['codigo']) ?> · <?= htmlspecialchars($prod['categoria']) ?></div>
                    <div class="prod-stock"><?= intval($prod['stock']) ?></div>
                    <div class="prod-min">Mínimo: <?= intval($prod['stock_min']) ?></div>
                </div>
            <?php endwhile; ?>
        </div>
    </div>

    <!-- Filtros -->
    <div class="section-card">
        <h3 class="section-title">Filtrar movimientos</h3>
        <form method="get">
            <div class="filtros-grid">
                <div class="form-group">
                    <label>Tipo</label>
                    <select name="tipo" class="form-control">
                        <option value="">(Todos)</option>
                        <option value="compra"  <?= $filtro_tipo === 'compra'  ? 'selected' : '' ?>>Entrada (compra)</option>
                        <option value="venta"   <?= $filtro_tipo === 'venta'   ? 'selected' : '' ?>>Salida (venta)</option>
                        <option value="ajuste"  <?= $filtro_tipo === 'ajuste'  ? 'selected' : '' ?>>Ajuste manual</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Producto</label>
                    <input type="text" name="producto" class="form-control"
                           placeholder="Buscar producto..."
                           value="<?= htmlspecialchars($filtro_product) ?>">
                </div>

                <div class="form-group">
                    <label>Desde</label>
                    <input type="date" name="desde" class="form-control"
                           value="<?= htmlspecialchars($filtro_desde) ?>">
                </div>

                <div class="form-group">
                    <label>Hasta</label>
                    <input type="date" name="hasta" class="form-control"
                           value="<?= htmlspecialchars($filtro_hasta) ?>">
                </div>

                <div class="form-group" style="display:flex; gap:8px;">
                    <button type="submit" class="btn-primary">Filtrar</button>
                    <a href="inventario.php" class="btn-outline">Limpiar</a>
                </div>
            </div>
        </form>
    </div>

    <!-- Tabla de movimientos -->
    <div class="section-card">
        <h3 class="section-title">Movimientos</h3>
        <table class="mov-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Usuario</th>
                    <th>Observaciones</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($movimientos->num_rows === 0): ?>
                    <tr class="empty-row">
                        <td colspan="7">No hay movimientos que coincidan con los filtros.</td>
                    </tr>
                <?php else: ?>
                    <?php while ($mov = $movimientos->fetch_assoc()):
                        $esPositivo = $mov['cantidad'] > 0;
                        $cantClass  = $esPositivo ? 'cantidad-positiva' : 'cantidad-negativa';
                        $cantPrefix = $esPositivo ? '+' : '';

                        $badgeClass = match($mov['tipo']) {
                            'compra' => 'badge-compra',
                            'venta'  => 'badge-venta',
                            default  => 'badge-ajuste'
                        };
                    ?>
                        <tr>
                            <td><?= intval($mov['id']) ?></td>
                            <td><?= date('d/m/Y H:i', strtotime($mov['fecha'])) ?></td>
                            <td><span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($mov['tipo']) ?></span></td>
                            <td><?= htmlspecialchars($mov['producto']) ?></td>
                            <td class="<?= $cantClass ?>"><?= $cantPrefix . intval($mov['cantidad']) ?></td>
                            <td><?= htmlspecialchars($mov['usuario']) ?></td>
                            <td><?= htmlspecialchars($mov['observaciones'] ?? '-') ?></td>
                        </tr>
                    <?php endwhile; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

</body>
</html>