<?php
session_start();
if (!isset($_SESSION['usuario'])) { header("Location: login.php"); exit; }
require "conexion.php";

// acciones: crear / editar / eliminar
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Guardar (crear o actualizar)
    $id = $_POST['id'] ?: null;
    $codigo = trim($_POST['codigo']);
    $nombre = trim($_POST['nombre']);
    $categoria = trim($_POST['categoria']);
    $proveedor = trim($_POST['proveedor']);
    $precio_compra = floatval($_POST['precio_compra'] ?? 0);
    $precio_venta = floatval($_POST['precio_venta'] ?? 0);
    $stock = intval($_POST['stock'] ?? 0);
    $stock_min = intval($_POST['stock_min'] ?? 0);
    $estado = $_POST['estado'] ?? 'activo';

    if (!$codigo || !$nombre) {
        $error = "Código y nombre son obligatorios.";
    } else {
        if ($id) {
            $stmt = $conexion->prepare("UPDATE productos SET codigo=?, nombre=?, categoria=?, proveedor=?, precio_compra=?, precio_venta=?, stock=?, stock_min=?, estado=? WHERE id=?");
            $stmt->bind_param("ssssddiisi", $codigo, $nombre, $categoria, $proveedor, $precio_compra, $precio_venta, $stock, $stock_min, $estado, $id);
            $stmt->execute();
        } else {
            $stmt = $conexion->prepare("INSERT INTO productos (codigo,nombre,categoria,proveedor,precio_compra,precio_venta,stock,stock_min,estado) VALUES (?,?,?,?,?,?,?,?,?)");
            $stmt->bind_param("ssssddiis", $codigo, $nombre, $categoria, $proveedor, $precio_compra, $precio_venta, $stock, $stock_min, $estado);
            $stmt->execute();
        }
        header("Location: productos.php");
        exit;
    }
}

if ($action === 'delete' && isset($_GET['id']) && $_SESSION['rol'] === 'admin') {
    $id = intval($_GET['id']);
    $stmt = $conexion->prepare("DELETE FROM productos WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    header("Location: productos.php");
    exit;
}

// editar carga
$editProduct = null;
if ($action === 'edit' && isset($_GET['id'])) {
    $stmt = $conexion->prepare("SELECT * FROM productos WHERE id=?");
    $stmt->bind_param("i", $_GET['id']);
    $stmt->execute();
    $editProduct = $stmt->get_result()->fetch_assoc();
}

// Obtener categorías únicas de la base de datos
$categorias_db = $conexion->query("SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria");
$categorias_array = [];
while($cat = $categorias_db->fetch_assoc()) {
    $categorias_array[] = $cat['categoria'];
}

// listar
$result = $conexion->query("SELECT * FROM productos ORDER BY id DESC");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Productos - Sistema</title>
<link rel="stylesheet" href="css/estilos.css">
<style>
.main-content {
    margin-left: 280px;
    padding: 20px;
    min-height: calc(100vh - 80px);
}

.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 968px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
}

.form-section {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.filter-section {
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

.btn-secondary {
  background: #6c757d;
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
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.products-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #3b2b1f;
  border-bottom: 2px solid #dee2e6;
}

.products-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-inactive {
  background: #f8d7da;
  color: #721c24;
}

.stock-low {
  background: #fff3cd;
  color: #856404;
}

.stock-ok {
  background: #d1ecf1;
  color: #0c5460;
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

.page-header {
  margin-bottom: 30px;
}

.page-title {
  color: #3b2b1f;
  margin-bottom: 5px;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  color: #6c757d;
  font-size: 14px;
}
</style>
</head>
<body>

<?php include "menu.php"; ?>

<div class="main-content">
  <div class="page-header">
    <h1 class="page-title">Gestión de productos</h1>
    <p class="page-subtitle">Sistema de Gestión Comercial</p>
  </div>

  <?php if(!empty($error)): ?>
    <div class="alert error" style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
      <?=htmlspecialchars($error)?>
    </div>
  <?php endif; ?>

  <div class="products-grid">
    <!-- Formulario Agregar/Editar -->
    <div class="form-section">
      <h3 class="section-title">Agregar / Editar producto</h3>
      <form method="post">
        <input type="hidden" name="id" value="<?= htmlspecialchars($editProduct['id'] ?? '') ?>">
        
        <div class="form-group">
          <label for="prodCode">Código</label>
          <input type="text" id="prodCode" name="codigo" class="form-control" 
                 value="<?= htmlspecialchars($editProduct['codigo'] ?? '') ?>" 
                 placeholder="Ej. VID-001" required>
        </div>

        <div class="form-group">
          <label for="prodName">Nombre</label>
          <input type="text" id="prodName" name="nombre" class="form-control" 
                 value="<?= htmlspecialchars($editProduct['nombre'] ?? '') ?>" 
                 placeholder="Nombre del producto" required>
        </div>

        <div class="form-group">
          <label for="prodCategory">Categoría</label>
          <select id="prodCategory" name="categoria" class="form-control" required>
            <option value="">Seleccione...</option>
            <?php foreach($categorias_array as $categoria): ?>
              <option value="<?= htmlspecialchars($categoria) ?>" 
                      <?= ( ($editProduct['categoria'] ?? '') === $categoria) ? 'selected' : '' ?>>
                <?= htmlspecialchars($categoria) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>

        <div class="form-group">
          <label for="prodSupplier">Proveedor</label>
          <input type="text" id="prodSupplier" name="proveedor" class="form-control" 
                 value="<?= htmlspecialchars($editProduct['proveedor'] ?? '') ?>" 
                 placeholder="Nombre del proveedor">
        </div>

        <div class="form-group">
          <label for="prodBuyPrice">Precio compra</label>
          <input type="number" id="prodBuyPrice" name="precio_compra" class="form-control" step="0.01" 
                 value="<?= htmlspecialchars($editProduct['precio_compra'] ?? '0.00') ?>" required>
        </div>

        <div class="form-group">
          <label for="prodSellPrice">Precio venta</label>
          <input type="number" id="prodSellPrice" name="precio_venta" class="form-control" step="0.01" 
                 value="<?= htmlspecialchars($editProduct['precio_venta'] ?? '0.00') ?>" required>
        </div>

        <div class="form-group">
          <label for="prodStock">Stock inicial</label>
          <input type="number" id="prodStock" name="stock" class="form-control" min="0" 
                 value="<?= htmlspecialchars($editProduct['stock'] ?? '0') ?>" required>
        </div>

        <div class="form-group">
          <label for="prodMinStock">Stock mínimo</label>
          <input type="number" id="prodMinStock" name="stock_min" class="form-control" min="0" 
                 value="<?= htmlspecialchars($editProduct['stock_min'] ?? '0') ?>" required>
        </div>

        <div class="form-group">
          <label for="prodStatus">Estado</label>
          <select id="prodStatus" name="estado" class="form-control" required>
            <option value="activo" <?= ( ($editProduct['estado'] ?? '') === 'activo') ? 'selected' : '' ?>>Activo</option>
            <option value="inactivo" <?= ( ($editProduct['estado'] ?? '') === 'inactivo') ? 'selected' : '' ?>>Inactivo</option>
          </select>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" class="btn-primary">Guardar</button>
          <a href="productos.php" class="btn-outline" style="text-decoration: none; display: inline-block;">Nuevo</a>
        </div>
      </form>
    </div>

    <!-- Sección de Filtros -->
    <div class="filter-section">
      <h3 class="section-title">Buscar / Filtrar</h3>
      
      <div class="form-group">
        <label for="prodSearchText">Buscar por nombre o código</label>
        <input type="text" id="prodSearchText" class="form-control" placeholder="Ej. VID-001 o 'templado'">
      </div>

      <div class="form-group">
        <label for="prodSearchCategory">Categoría</label>
        <select id="prodSearchCategory" class="form-control">
          <option value="">(Todas)</option>
          <?php foreach($categorias_array as $categoria): ?>
            <option value="<?= htmlspecialchars($categoria) ?>"><?= htmlspecialchars($categoria) ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="form-group">
        <label for="prodSearchStatus">Estado</label>
        <select id="prodSearchStatus" class="form-control">
          <option value="">(Todos)</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button type="button" id="prodSearchBtn" class="btn-primary">Aplicar filtros</button>
        <button type="button" id="prodSearchClear" class="btn-outline">Limpiar</button>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Listado de productos -->
  <div class="form-section">
    <h3 class="section-title">Listado de productos</h3>
    <table class="products-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Proveedor</th>
          <th>P. compra</th>
          <th>P. venta</th>
          <th>Stock</th>
          <th>Mínimo</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <?php while($row = $result->fetch_assoc()): 
          $estadoClass = $row['estado'] === 'activo' ? 'status-active status-badge' : 'status-inactive status-badge';
          $stockClass = $row['stock'] == 0 ? 'stock-low status-badge' : ($row['stock'] <= $row['stock_min'] ? 'stock-low status-badge' : 'stock-ok status-badge');
        ?>
          <tr>
            <td><strong><?= htmlspecialchars($row['codigo']) ?></strong></td>
            <td><?= htmlspecialchars($row['nombre']) ?></td>
            <td><?= htmlspecialchars($row['categoria']) ?></td>
            <td><?= htmlspecialchars($row['proveedor']) ?></td>
            <td>$<?= number_format($row['precio_compra'], 2) ?></td>
            <td><strong>$<?= number_format($row['precio_venta'], 2) ?></strong></td>
            <td><span class="<?= $stockClass ?>"><?= intval($row['stock']) ?></span></td>
            <td><?= intval($row['stock_min']) ?></td>
            <td><span class="<?= $estadoClass ?>"><?= ucfirst($row['estado']) ?></span></td>
            <td>
              <div class="action-buttons">
                <a class="btn-primary btn-sm" href="productos.php?action=edit&id=<?= $row['id'] ?>" style="text-decoration: none;">Editar</a>
                <?php if($_SESSION['rol']==='admin'): ?>
                  <a class="btn-secondary btn-sm" href="productos.php?action=delete&id=<?= $row['id'] ?>" onclick="return confirm('¿Está seguro de eliminar este producto?')" style="text-decoration: none;">Eliminar</a>
                <?php endif; ?>
              </div>
            </td>
          </tr>
        <?php endwhile; ?>
      </tbody>
    </table>
  </div>
</div>

<script>
document.getElementById('prodSearchBtn').addEventListener('click', function() {
  const searchText = document.getElementById('prodSearchText').value.toLowerCase();
  const category = document.getElementById('prodSearchCategory').value;
  const status = document.getElementById('prodSearchStatus').value;
  
  const rows = document.querySelectorAll('.products-table tbody tr');
  
  rows.forEach(row => {
    const code = row.cells[0].textContent.toLowerCase();
    const name = row.cells[1].textContent.toLowerCase();
    const rowCategory = row.cells[2].textContent;
    const rowStatus = row.cells[8].textContent.toLowerCase();
    
    const textMatch = !searchText || code.includes(searchText) || name.includes(searchText);
    const categoryMatch = !category || rowCategory === category;
    const statusMatch = !status || rowStatus === status;
    
    row.style.display = (textMatch && categoryMatch && statusMatch) ? '' : 'none';
  });
});

document.getElementById('prodSearchClear').addEventListener('click', function() {
  document.getElementById('prodSearchText').value = '';
  document.getElementById('prodSearchCategory').value = '';
  document.getElementById('prodSearchStatus').value = '';
  
  const rows = document.querySelectorAll('.products-table tbody tr');
  rows.forEach(row => row.style.display = '');
});
</script>

</body>
</html>