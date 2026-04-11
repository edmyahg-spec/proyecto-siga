<?php
session_start();
require "conexion.php";
if (!isset($_SESSION['usuario'])) { 
    header("Location: login.php"); 
    exit; 
}

$id = intval($_GET['id'] ?? 0);
if (!$id) { 
    echo "<div style='padding:20px; text-align:center;'>Venta no encontrada</div>";
    exit; 
}

// Obtener datos de la venta
$venta = $conexion->query("SELECT * FROM ventas WHERE id=$id")->fetch_assoc();
if (!$venta) {
    echo "<div style='padding:20px; text-align:center;'>Venta no encontrada en la base de datos</div>";
    exit;
}

// Obtener detalles de la venta - CORREGIDO: usar precio_venta
$det = $conexion->query("SELECT vd.*, p.nombre, p.codigo, p.precio_venta as precio_unitario, vd.descuento 
                         FROM ventas_detalle vd 
                         LEFT JOIN productos p ON vd.producto_id=p.id 
                         WHERE vd.venta_id=$id");
if (!$det) {
    echo "<div style='padding:20px; text-align:center;'>Error al cargar los detalles de la venta</div>";
    exit;
}

?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Ticket <?= htmlspecialchars($venta['folio'] ?? 'N/A') ?></title>
<link rel="stylesheet" href="css/estilos.css">
<style>
  /* estilos específicos para imprimir ticket */
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display:none !important; }
    .ticket { box-shadow: none !important; }
  }
  
  body {
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .ticket {
    width: 320px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 6px 16px rgba(139, 69, 19, 0.15);
    overflow: hidden;
    font-family: 'Courier New', monospace;
    border: 1px solid #d7ccc8;
  }
  
  .ticket-header {
    background: linear-gradient(135deg, #a1887f, #bcaaa4);
    color: #4e342e;
    padding: 20px 15px;
    text-align: center;
  }
  
  .ticket-header img {
    width: 100px;
    height: 100px;
    margin-bottom: 12px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    object-fit: cover;
  }
  
  .ticket-header h2 {
    margin: 0 0 6px 0;
    font-size: 17px;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
  
  .ticket-header h2:last-child {
    margin-bottom: 0;
    font-size: 15px;
  }
  
  .ticket-info {
    background: linear-gradient(to bottom, #efebe9, #f5f5f5);
    padding: 12px 15px;
    border-bottom: 2px dashed #bcaaa4;
    font-size: 12px;
    color: #5d4037;
  }
  
  .ticket-info div {
    margin-bottom: 5px;
  }
  
  .ticket-details {
    padding: 15px;
    background-color: #fafafa;
  }
  
  .ticket table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  
  .ticket thead {
    border-bottom: 2px solid #a1887f;
    background-color: #f5f5f5;
  }
  
  .ticket th {
    text-align: left;
    padding: 10px 5px;
    font-weight: 700;
    color: #5d4037;
    border-bottom: 1px solid #d7ccc8;
    background-color: #efebe9;
  }
  
  .ticket td {
    padding: 8px 5px;
    border-bottom: 1px dashed #e0e0e0;
    background-color: white;
  }
  
  .ticket td:nth-child(2),
  .ticket td:nth-child(3),
  .ticket td:nth-child(4),
  .ticket td:nth-child(5) {
    text-align: center;
  }
  
  .ticket td:last-child {
    text-align: right;
  }
  
  .descuento-item {
    color: #d32f2f;
    font-size: 10px;
    font-weight: 600;
  }
  
  .ticket-totals {
    padding: 15px;
    background: linear-gradient(to bottom, #f5f5f5, #efebe9);
    border-top: 2px solid #a1887f;
  }
  
  .total-line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
  }
  
  .total-line.subtotal {
    color: #6d4c41;
  }
  
  .total-line.descuento {
    color: #d32f2f;
    font-weight: 600;
  }
  
  .total-line.total {
    font-weight: 800;
    font-size: 17px;
    color: #4e342e;
    border-top: 2px solid #bcaaa4;
    padding-top: 10px;
    margin-top: 10px;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 10px 8px;
    border-radius: 6px;
    margin-bottom: 0;
  }
  
  .ticket-footer {
    padding: 15px;
    font-size: 12px;
    border-top: 2px dashed #bcaaa4;
    background: linear-gradient(to bottom, #efebe9, #f5f5f5);
  }
  
  .ticket-footer div {
    margin-bottom: 8px;
  }
  
  .ticket-actions {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: #f5f5f5;
  }
  
  .btn {
    background: linear-gradient(135deg, #a1887f, #8d6e63);
    color: white;
    border: none;
    padding: 12px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
    text-align: center;
    text-decoration: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .btn:hover {
    background: linear-gradient(135deg, #8d6e63, #795548);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .btn.ghost {
    background: transparent;
    color: #8d6e63;
    border: 2px solid #8d6e63;
  }
  
  .btn.ghost:hover {
    background: #efebe9;
    color: #5d4037;
  }
  
  .folio {
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 1px;
    color: #5d4037;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
  
  .metodo-pago {
    display: inline-block;
    background: linear-gradient(135deg, #d7ccc8, #bcaaa4);
    color: #4e342e;
    padding: 4px 10px;
    border-radius: 15px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid #a1887f;
  }
  
  .empty-message {
    text-align: center;
    padding: 20px;
    color: #8d6e63;
    font-style: italic;
    background-color: #f5f5f5;
    border-radius: 6px;
  }
  
  .product-name {
    font-weight: 600;
    color: #5d4037;
  }
  
  .product-code {
    font-size: 10px;
    color: #8d6e63;
  }
  
  .notas-section {
    background-color: white;
    padding: 10px;
    border-radius: 6px;
    border-left: 3px solid #a1887f;
    margin-top: 8px;
  }
</style>
</head>
<body>
<div class="ticket">
  <div class="ticket-header">
    <img src="img/ga.jpg" alt="Logo">
    <h2>Vidrios y Aluminios</h2>
    <h2>Grupo Águila</h2>
  </div>
  
  <div class="ticket-info">
    <div class="folio"><?= htmlspecialchars($venta['folio'] ?? 'N/A') ?></div>
    <div><?= htmlspecialchars($venta['fecha'] ?? 'N/A') ?></div>
    <div>Atendió: <?= htmlspecialchars($venta['usuario'] ?? 'N/A') ?></div>
  </div>

  <div class="ticket-details">
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cant</th>
          <th>P.Unit</th>
          <th>Desc</th>
          <th>Importe</th>
        </tr>
      </thead>
      <tbody>
        <?php 
        $hasProducts = false;
        $subtotal = 0;
        $totalDescuento = 0;
        
        if ($det && $det->num_rows > 0): 
            $hasProducts = true;
            while($r = $det->fetch_assoc()): 
                // CORREGIDO: Usar precio_venta como precio unitario
                $precioUnitario = $r['precio_unitario'] ?? 0;
                $cantidad = $r['cantidad'] ?? 0;
                $descuento = $r['descuento'] ?? 0;
                
                // Calcular importe correctamente
                $importeSinDescuento = $precioUnitario * $cantidad;
                $importe = $importeSinDescuento - $descuento;
                
                $subtotal += $importeSinDescuento;
                $totalDescuento += $descuento;
        ?>
            <tr>
              <td>
                <div class="product-name"><?= htmlspecialchars($r['nombre'] ?? '') ?></div>
                <div class="product-code"><?= htmlspecialchars($r['codigo'] ?? '') ?></div>
              </td>
              <td><?= $cantidad ?></td>
              <td>$<?= number_format($precioUnitario, 2) ?></td>
              <td>
                <?php if($descuento > 0): ?>
                  <div class="descuento-item">-$<?= number_format($descuento, 2) ?></div>
                <?php else: ?>
                  -
                <?php endif; ?>
              </td>
              <td>$<?= number_format($importe, 2) ?></td>
            </tr>
            <?php endwhile; 
        else: ?>
            <tr>
              <td colspan="5" class="empty-message">No hay productos en esta venta</td>
            </tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

  <div class="ticket-totals">
    <div class="total-line subtotal">
      <div>Subtotal:</div>
      <div>$<?= number_format($subtotal, 2) ?></div>
    </div>
    
    <?php if($totalDescuento > 0): ?>
    <div class="total-line descuento">
      <div>Descuento:</div>
      <div>-$<?= number_format($totalDescuento, 2) ?></div>
    </div>
    <?php endif; ?>
    
    <div class="total-line total">
      <div>TOTAL:</div>
      <div>$<?= number_format($venta['total'] ?? ($subtotal - $totalDescuento), 2) ?></div>
    </div>
  </div>

  <div class="ticket-footer">
    <div>
      Método: <span class="metodo-pago"><?= htmlspecialchars($venta['metodo_pago'] ?? 'No especificado') ?></span>
    </div>
    <?php if(!empty($venta['notas'])): ?>
      <div class="notas-section">
        <strong>Notas:</strong><br>
        <?= nl2br(htmlspecialchars($venta['notas'])) ?>
      </div>
    <?php endif; ?>
    <div style="text-align:center; margin-top:15px; font-size:11px; color:#8d6e63; font-weight:600;">
      ¡Gracias por su preferencia!
    </div>
  </div>

  <div class="ticket-actions no-print">
    <button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button>
    <a class="btn ghost" href="ventas.php">Volver a ventas</a>
  </div>
</div>
</body>
</html>