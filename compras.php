<?php
session_start();
if (!isset($_SESSION['usuario'])) { header("Location: login.php"); exit; }
require "conexion.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $producto_id = intval($_POST['producto_id']);
    $cantidad = intval($_POST['cantidad']);
    $precio_compra = floatval($_POST['precio_compra']);
    $proveedor = trim($_POST['proveedor']);

    if ($producto_id && $cantidad > 0) {
        $stmt = $conexion->prepare("INSERT INTO compras (producto_id, cantidad, precio_compra, proveedor, usuario) VALUES (?,?,?,?,?)");
        $usern = $_SESSION['usuario'];
        $stmt->bind_param("iidss", $producto_id, $cantidad, $precio_compra, $proveedor, $usern);
        $stmt->execute();

        // actualizar stock
        $conexion->query("UPDATE productos SET stock = stock + $cantidad WHERE id = $producto_id");

        // movimiento
        $p = $conexion->query("SELECT nombre FROM productos WHERE id=$producto_id")->fetch_assoc()['nombre'];
        $mov = $conexion->prepare("INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES ('compra',?,?,?,?,?)");
        // we'll just insert simple
        $conexion->query("INSERT INTO movimientos (tipo, producto, cantidad, usuario, observaciones) VALUES ('compra', '".$conexion->real_escape_string($p)."', $cantidad, '".$conexion->real_escape_string($usern)."', '". $conexion->real_escape_string($proveedor) ."')");

        header("Location: compras.php?ok=1");
        exit;
    } else {
        $error = "Datos inválidos";
    }
}

$productos = $conexion->query("SELECT id, codigo, nombre, stock FROM productos ORDER BY nombre");

// Obtener historial de compras
$compras = $conexion->query("
    SELECT c.id, p.codigo, p.nombre, c.cantidad, c.precio_compra, c.proveedor, c.fecha, c.usuario 
    FROM compras c 
    JOIN productos p ON c.producto_id = p.id 
    ORDER BY c.fecha DESC
");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Compras - Vidrios y Aluminios Grupo Águila</title>
<link rel="stylesheet" href="css/estilos.css">
<style>
    .main {
        padding: 20px;
    }
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
    .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
        margin-bottom: 20px;
    }
    .card h2 {
        margin-top: 0;
        color: #333;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }
    .form-group {
        margin-bottom: 15px;
    }
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
    }
    select, input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }
    .btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    .btn:hover {
        background: #2980b9;
    }
    .table-container {
        overflow-x: auto;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }
    th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    th {
        background-color: #f8f9fa;
        font-weight: bold;
        color: #333;
    }
    tr:hover {
        background-color: #f5f5f5;
    }
    .alert {
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 20px;
    }
    .alert.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    .alert.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
</style>
</head>
<body>
<?php include "menu.php"; ?>
<main class="main">
  <div class="container">
    <h1>Gestión de Compras</h1>
    
    <?php if(isset($_GET['ok'])): ?>
    <div class="alert success">Compra registrada correctamente.</div>
    <?php endif; ?>
    
    <?php if(!empty($error)): ?>
    <div class="alert error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <!-- Card para registrar compra -->
    <div class="card">
      <h2>Registrar Nueva Compra</h2>
      <form method="post">
        <div class="form-group">
          <label>Producto</label>
          <select name="producto_id" required>
            <?php while($p = $productos->fetch_assoc()): ?>
              <option value="<?= $p['id'] ?>">
                <?= htmlspecialchars($p['codigo'] . ' - ' . $p['nombre'] . ' (stock: ' . $p['stock'] . ')') ?>
              </option>
            <?php endwhile; ?>
          </select>
        </div>

        <div class="form-group">
          <label>Cantidad</label>
          <input type="number" name="cantidad" min="1" required>
        </div>

        <div class="form-group">
          <label>Precio compra unitario</label>
          <input type="number" name="precio_compra" step="0.01" required>
        </div>

        <div class="form-group">
          <label>Proveedor</label>
          <input type="text" name="proveedor" required>
        </div>

        <div>
          <button class="btn" type="submit">Registrar compra</button>
        </div>
      </form>
    </div>

    <!-- Card para historial de compras -->
    <div class="card">
      <h2>Historial de Compras</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            <?php while($compra = $compras->fetch_assoc()): 
              $total = $compra['cantidad'] * $compra['precio_compra'];
            ?>
            <tr>
              <td><?= $compra['id'] ?></td>
              <td><?= htmlspecialchars($compra['codigo']) ?></td>
              <td><?= htmlspecialchars($compra['nombre']) ?></td>
              <td><?= $compra['cantidad'] ?></td>
              <td>$<?= number_format($compra['precio_compra'], 2) ?></td>
              <td>$<?= number_format($total, 2) ?></td>
              <td><?= htmlspecialchars($compra['proveedor']) ?></td>
              <td><?= date('d/m/Y H:i', strtotime($compra['fecha'])) ?></td>
              <td><?= htmlspecialchars($compra['usuario']) ?></td>
            </tr>
            <?php endwhile; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</main>
</body>
</html>