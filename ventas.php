<?php
session_start();
if (!isset($_SESSION['usuario'])) { header("Location: login.php"); exit; }
require "conexion.php";

// iniciar carrito en sesión
if (!isset($_SESSION['carrito'])) $_SESSION['carrito'] = [];

// acciones: agregar item, eliminar item, vaciar carrito
$action = $_GET['action'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_item'])) {
    $producto_id = intval($_POST['producto_id']);
    $cantidad = intval($_POST['cantidad']);
    $precio_unit = floatval($_POST['precio_unit']);
    $descuento = floatval($_POST['descuento'] ?? 0);

    // validar
   // validar
    $stmt = $conexion->prepare("SELECT * FROM productos WHERE id=?");
    $stmt->bind_param("i", $producto_id);
    $stmt->execute();
    $p = $stmt->get_result()->fetch_assoc();
    
    if (!$p) { $error = "Producto no válido"; }
    elseif ($cantidad <= 0) { $error = "Cantidad inválida"; }
    elseif ($cantidad > $p['stock']) { $error = "No hay suficiente stock"; }
    else {
        // push al carrito
        $_SESSION['carrito'][] = [
            'producto_id' => $producto_id,
            'codigo' => $p['codigo'],
            'nombre' => $p['nombre'],
            'cantidad' => $cantidad,
            'precio_unit' => $precio_unit,
            'descuento' => $descuento
        ];
        header("Location: ventas.php");
        exit;
    }
}

if ($action === 'remove' && isset($_GET['idx'])) {
    $idx = intval($_GET['idx']);
    if (isset($_SESSION['carrito'][$idx])) {
        array_splice($_SESSION['carrito'], $idx, 1);
    }
    header("Location: ventas.php");
    exit;
}

if ($action === 'clear') {
    $_SESSION['carrito'] = [];
    header("Location: ventas.php");
    exit;
}

// confirmar venta
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_sale'])) {
    $metodo_pago = $_POST['metodo_pago'] ?? '';
    $notas = $_POST['notas'] ?? '';
    $user = $_SESSION['usuario'];

    if (empty($_SESSION['carrito'])) {
        $error = "No hay productos en la venta.";
    } elseif (!$metodo_pago) {
        $error = "Seleccione método de pago.";
    } else {
        $total = 0;
        foreach ($_SESSION['carrito'] as $it) {
            $total += ($it['precio_unit'] * $it['cantidad']) - $it['descuento'];
        }

        // Folio seguro con insert_id
        $folioTemp = "V-TEMP";
        $stmt = $conexion->prepare("INSERT INTO ventas (folio, total, usuario, metodo_pago, notas) VALUES (?,?,?,?,?)");
        $stmt->bind_param("sdsss", $folioTemp, $total, $user, $metodo_pago, $notas);
        $stmt->execute();
        $venta_id = $conexion->insert_id;
        $folio = "V-" . str_pad($venta_id, 4, "0", STR_PAD_LEFT);
        $upd = $conexion->prepare("UPDATE ventas SET folio = ? WHERE id = ?");
        $upd->bind_param("si", $folio, $venta_id);
        $upd->execute();

        // Detalle, stock atómico y movimientos
        $error = '';
        foreach ($_SESSION['carrito'] as $it) {
            $subtotal = ($it['precio_unit'] * $it['cantidad']) - $it['descuento'];

            $stmt2 = $conexion->prepare("INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unit, descuento, subtotal) VALUES (?,?,?,?,?,?)");
            $stmt2->bind_param("iiiddd", $venta_id, $it['producto_id'], $it['cantidad'], $it['precio_unit'], $it['descuento'], $subtotal);
            $stmt2->execute();

            // Stock atómico
            $stmt3 = $conexion->prepare("UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?");
            $stmt3->bind_param("iii", $it['cantidad'], $it['producto_id'], $it['cantidad']);
            $stmt3->execute();
            if ($stmt3->affected_rows === 0) {
                $error = "Stock insuficiente al confirmar: " . htmlspecialchars($it['nombre']);
                break;
            }

            // Movimiento con prepared statement
            $cantNeg = -intval($it['cantidad']);
            $tipo = 'venta';
            $stmt4 = $conexion->prepare("INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES (?,?,?,?,?)");
            $stmt4->bind_param("ssiss", $tipo, $it['nombre'], $cantNeg, $user, $notas);
            $stmt4->execute();
        }

        if ($error) {
            header("Location: ventas.php?error=stock");
            exit;
        }

        // Armar lista de productos para alerta
        $codigos = array_map(fn($it) => $it['codigo'], $_SESSION['carrito']);
        $_SESSION['venta_alerta'] = "Venta registrada: " . implode(', ', $codigos);
        $_SESSION['carrito'] = [];
        header("Location: ticket.php?id=$venta_id");
        exit;
    }
}


// listar productos activos
$prods = $conexion->query("SELECT id, codigo, nombre, stock, precio_venta FROM productos WHERE estado='activo' ORDER BY nombre");

// CORRECCIÓN: Ventas recientes - Sumar las cantidades en lugar de contar líneas
$ventas_recientes = $conexion->query("
    SELECT v.*, 
           SUM(vd.cantidad) as total_unidades,
           GROUP_CONCAT(CONCAT(p.codigo, ' x', vd.cantidad) ORDER BY p.codigo SEPARATOR ', ') as productos_detalle
    FROM ventas v 
    LEFT JOIN ventas_detalle vd ON v.id = vd.venta_id
    LEFT JOIN productos p ON vd.producto_id = p.id
    GROUP BY v.id 
    ORDER BY v.fecha DESC 
    LIMIT 10");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ventas - Sistema</title>
<link rel="stylesheet" href="css/estilos.css">
<style>
.ventas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 968px) {
  .ventas-grid {
    grid-template-columns: 1fr;
  }
}

.form-section {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.detail-section {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #3b2b1f;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #3b2b1f;
  margin-bottom: 5px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: #fafafa;
}

.form-control:focus {
  outline: none;
  border-color: #3b2b1f;
  background: #fff;
}

.btn-primary {
  background: #3b2b1f;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-outline {
  background: transparent;
  color: #3b2b1f;
  padding: 10px 20px;
  border: 1px solid #3b2b1f;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.ventas-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.ventas-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #3b2b1f;
  border-bottom: 2px solid #dee2e6;
}

.ventas-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

.detalle-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.detalle-table th {
  background: #f8f9fa;
  padding: 10px;
  text-align: left;
  font-weight: 600;
  color: #3b2b1f;
  border-bottom: 2px solid #dee2e6;
  font-size: 13px;
}

.detalle-table td {
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
  font-size: 13px;
}

.total-row {
  font-weight: 700;
  background: #f8f9fa;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.divider {
  height: 1px;
  background: #dee2e6;
  margin: 20px 0;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}
</style>
</head>
<body>

<?php include "menu.php"; ?>

<div class="main-content">
  <div class="page-header">
    <h1 class="page-title">Registro de ventas</h1>
    <p class="page-subtitle">Sistema de Gestión Comercial</p>
  </div>

<?php if(!empty($error)): ?>
    <div style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight:500;">
      <?= htmlspecialchars($error) ?>
    </div>
  <?php endif; ?>

  <?php if(!empty($_SESSION['venta_alerta'])): ?>
    <div id="ventaAlerta" style="background: #d4edda; color: #155724; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-weight:500; display:flex; justify-content:space-between; align-items:center;">
      <span>✔ <?= htmlspecialchars($_SESSION['venta_alerta']) ?></span>
      <button onclick="document.getElementById('ventaAlerta').style.display='none'" style="background:none; border:none; cursor:pointer; font-size:16px; color:#155724;">✕</button>
    </div>
  <?php unset($_SESSION['venta_alerta']); endif; ?>
  

  <div class="ventas-grid">
    <!-- Formulario Agregar Producto -->
    <div class="form-section">
      <h3 class="section-title">Agregar producto a la venta</h3>
      <form method="post">
        <input type="hidden" name="add_item" value="1">
        
        <div class="form-group">
          <label for="productoSelect">Producto</label>
          <select id="productoSelect" name="producto_id" class="form-control" required>
            <option value="">Seleccione un producto para vender</option>
            <?php while($r = $prods->fetch_assoc()): ?>
              <option value="<?= $r['id'] ?>" data-price="<?= $r['precio_venta'] ?>" data-stock="<?= $r['stock'] ?>">
                <?= htmlspecialchars($r['codigo'] . ' - ' . $r['nombre'] . ' (stock: '.$r['stock'].')') ?>
              </option>
            <?php endwhile; ?>
          </select>
        </div>

        <div class="form-group">
          <label for="ventaCantidad">Cantidad</label>
          <input type="number" id="ventaCantidad" name="cantidad" class="form-control" min="1" value="1" required>
        </div>

        <div class="form-group">
          <label for="ventaPrecio">Precio unitario</label>
          <input type="number" id="ventaPrecio" name="precio_unit" class="form-control" step="0.01" required>
        </div>

        <div class="form-group">
          <label for="ventaDescuento">Descuento (cantidad fija)</label>
          <input type="number" id="ventaDescuento" name="descuento" class="form-control" step="0.01" value="0">
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" class="btn-primary">Agregar</button>
          <a href="ventas.php?action=clear" class="btn-outline">Vaciar</a>
        </div>
      </form>
    </div>

    <!-- Detalle de la Venta -->
    <div class="detail-section">
      <h3 class="section-title">Detalle de la venta</h3>
      
      <?php if(empty($_SESSION['carrito'])): ?>
        <p style="color: #6c757d; text-align: center; padding: 20px;">No hay productos en el carrito</p>
      <?php else: ?>
        <table class="detalle-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant</th>
              <th>Precio</th>
              <th>Desc</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <?php $total = 0; foreach($_SESSION['carrito'] as $i=>$it): 
              $subtotal = ($it['precio_unit'] * $it['cantidad']) - $it['descuento'];
              $total += $subtotal;
            ?>
              <tr>
                <td><?= htmlspecialchars($it['codigo'].' - '.$it['nombre']) ?></td>
                <td class="text-center"><?= intval($it['cantidad']) ?></td>
                <td class="text-right">$<?= number_format($it['precio_unit'],2) ?></td>
                <td class="text-right">$<?= number_format($it['descuento'],2) ?></td>
                <td class="text-right">$<?= number_format($subtotal,2) ?></td>
                <td class="text-center">
                  <a href="ventas.php?action=remove&idx=<?= $i ?>" class="btn-outline btn-sm">Quitar</a>
                </td>
              </tr>
            <?php endforeach; ?>
            <tr class="total-row">
              <td colspan="4" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong>$<?= number_format($total,2) ?></strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <form method="post">
          <input type="hidden" name="confirm_sale" value="1">
          
          <div class="form-group">
            <label for="metodo_pago">Método de pago</label>
            <select id="metodo_pago" name="metodo_pago" class="form-control" required>
              <option value="">Seleccione el método de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div class="form-group">
            <label for="notas">Observaciones</label>
            <textarea id="notas" name="notas" class="form-control" rows="2"></textarea>
          </div>

          <div style="margin-top: 15px;">
            <button type="submit" class="btn-primary">Confirmar venta</button>
          </div>
        </form>
      <?php endif; ?>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Ventas Recientes -->
  <div class="form-section">
    <h3 class="section-title">Ventas recientes</h3>
    <table class="ventas-table">
     <thead>
        <tr>
          <th>Fecha</th>
          <th>Folio</th>
          <th>Productos vendidos</th>
          <th>Total</th>
          <th>Usuario</th>
        </tr>
      </thead>
      <tbody>
        <?php 
        $ventas_array = [];
        while($venta = $ventas_recientes->fetch_assoc()):
            $ventas_array[] = $venta;
        endwhile;

        if (empty($ventas_array)): ?>
          <tr><td colspan="5" style="text-align:center; color:#6c757d;">No hay ventas recientes</td></tr>
        <?php else: ?>
          <?php foreach($ventas_array as $venta): ?>
          <tr>
            <td><?= date('d/m/Y H:i', strtotime($venta['fecha'])) ?></td>
            <td><strong><?= htmlspecialchars($venta['folio']) ?></strong></td>
            <td>
              <span style="font-size:13px; color:#3b2b1f;">
                <?= htmlspecialchars($venta['productos_detalle'] ?? 'Sin detalle') ?>
              </span>
            </td>
            <td class="text-right">$<?= number_format($venta['total'], 2) ?></td>
            <td><?= htmlspecialchars($venta['usuario']) ?></td>
          </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>


        <?php while($venta = $ventas_recientes->fetch_assoc()): ?>
          <tr>
            <td><?= date('d/m/Y H:i', strtotime($venta['fecha'])) ?></td>
            <td><strong><?= htmlspecialchars($venta['folio']) ?></strong></td>
            <td>
              <?php 
              // Obtener cantidad de productos diferentes en esta venta
              $productos_count = $conexion->query("SELECT COUNT(DISTINCT producto_id) as count FROM ventas_detalle WHERE venta_id = " . $venta['id'])->fetch_assoc()['count'];
              echo $productos_count . " productos";
              ?>
            </td>
            <td class="text-center"><?= intval($venta['total_unidades']) ?> unidades</td>
            <td class="text-right">$<?= number_format($venta['total'], 2) ?></td>
            <td><?= htmlspecialchars($venta['usuario']) ?></td>
          </tr>
        <?php endwhile; ?>
        <?php if($ventas_recientes->num_rows == 0): ?>
          <tr><td colspan="6" style="text-align:center; color:#6c757d;">No hay ventas recientes</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<script>
// Auto-completar precio cuando se selecciona producto
document.getElementById('productoSelect').addEventListener('change', function() {
  const selectedOption = this.options[this.selectedIndex];
  if (selectedOption.value !== '') {
    const precio = selectedOption.getAttribute('data-price');
    document.getElementById('ventaPrecio').value = precio;
  }
});
</script>

</body>
</html>