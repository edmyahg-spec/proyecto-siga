<?php
session_start();
if (!isset($_SESSION['usuario'])) { header("Location: login.php"); exit; }
require "conexion.php";

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id            = intval($_POST['id'] ?? 0) ?: null;
    $codigo        = trim($_POST['codigo']);
    $nombre        = trim($_POST['nombre']);
    $categoria     = trim($_POST['categoria']);
    if ($categoria === '__nueva__') {
        $categoria = trim($_POST['categoria_nueva'] ?? '');
    }
    $proveedor     = trim($_POST['proveedor']);
    $precio_compra = floatval($_POST['precio_compra'] ?? 0);
    $precio_venta  = floatval($_POST['precio_venta'] ?? 0);
    $stock         = intval($_POST['stock'] ?? 0);
    $stock_min     = intval($_POST['stock_min'] ?? 0);
    $estado        = $_POST['estado'] ?? 'activo';

    if (!$codigo || !$nombre) {
        $error = "Código y nombre son obligatorios.";
    } elseif (!$categoria) {
        $error = "La categoría es obligatoria.";
    } elseif ($precio_venta < $precio_compra) {
        $error = "El precio de venta no puede ser menor al precio de compra.";
    } elseif ($stock_min > $stock) {
        $error = "El stock mínimo no puede ser mayor al stock actual.";
    } else {
        // Verificar código duplicado
        $checkId = $id ?? 0;
        $stmtCheck = $conexion->prepare("SELECT id FROM productos WHERE codigo = ? AND id != ?");
        $stmtCheck->bind_param("si", $codigo, $checkId);
        $stmtCheck->execute();
        $stmtCheck->get_result()->num_rows > 0
            ? $error = "Ya existe un producto con ese código."
            : null;

        if (empty($error)) {
            if ($id) {
                $stmt = $conexion->prepare("UPDATE productos SET codigo=?, nombre=?, categoria=?, proveedor=?, precio_compra=?, precio_venta=?, stock=?, stock_min=?, estado=? WHERE id=?");
                $stmt->bind_param("ssssddiisi", $codigo, $nombre, $categoria, $proveedor, $precio_compra, $precio_venta, $stock, $stock_min, $estado, $id);
            } else {
                $stmt = $conexion->prepare("INSERT INTO productos (codigo,nombre,categoria,proveedor,precio_compra,precio_venta,stock,stock_min,estado) VALUES (?,?,?,?,?,?,?,?,?)");
                $stmt->bind_param("ssssddiis", $codigo, $nombre, $categoria, $proveedor, $precio_compra, $precio_venta, $stock, $stock_min, $estado);
            }
            $stmt->execute();
            $accion = $id ? 'editado' : 'creado';
            header("Location: productos.php?success=$accion");
            exit;
        }
    }
}

// Eliminar con prepared statement
if ($action === 'delete' && isset($_GET['id']) && $_SESSION['rol'] === 'admin') {
    $id = intval($_GET['id']);
    $stmt = $conexion->prepare("DELETE FROM productos WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    header("Location: productos.php?success=eliminado");
    exit;
}

// Cargar para editar
$editProduct = null;
if ($action === 'edit' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $conexion->prepare("SELECT * FROM productos WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $editProduct = $stmt->get_result()->fetch_assoc();
}

// Categorías únicas
$categorias_db    = $conexion->query("SELECT DISTINCT categoria FROM productos WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria");
$categorias_array = [];
while ($cat = $categorias_db->fetch_assoc()) {
    $categorias_array[] = $cat['categoria'];
}

// Mensaje de éxito
$mensajesExito = [
    'creado'    => ' Producto creado correctamente.',
    'editado'   => ' Producto actualizado correctamente.',
    'eliminado' => ' Producto eliminado correctamente.',
];
$successMsg = $mensajesExito[$_GET['success'] ?? ''] ?? '';

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
    .products-grid  { grid-template-columns: 1fr; }
    .main-content   { margin-left: 0; padding: 15px; }
}
.form-section, .filter-section {
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
.form-group { margin-bottom: 15px; }
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
    box-sizing: border-box;
}
.form-control:focus {
    outline: none;
    border-color: #3b2b1f;
    background: #fff;
}
.btn-primary   { background: #3b2b1f; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-secondary { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-outline   { background: transparent; color: #3b2b1f; padding: 10px 20px; border: 1px solid #3b2b1f; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
.products-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.products-table th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; color: #3b2b1f; border-bottom: 2px solid #dee2e6; }
.products-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
.status-badge    { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.status-active   { background: #d4edda; color: #155724; }
.status-inactive { background: #f8d7da; color: #721c24; }
.stock-low       { background: #fff3cd; color: #856404; }
.stock-ok        { background: #d1ecf1; color: #0c5460; }
.action-buttons  { display: flex; gap: 5px; }
.btn-sm          { padding: 6px 12px; font-size: 12px; }
.divider         { height: 1px; background: #dee2e6; margin: 20px 0; }
.page-header     { margin-bottom: 30px; }
.page-title      { color: #3b2b1f; margin-bottom: 5px; font-size: 24px; font-weight: 700; }
.page-subtitle   { color: #6c757d; font-size: 14px; }
.alert-error     { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight: 500; }
.alert-success   { background: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight: 500; }

/* Contador de resultados de búsqueda */
#searchResultBanner {
    display: none;
    background: #3b2b1f;
    color: #fff;
    padding: 10px 16px;
    border-radius: 6px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 500;
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

  <?php if (!empty($error)): ?>
    <div class="alert-error"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>

  <?php if ($successMsg): ?>
    <div class="alert-success"><?= htmlspecialchars($successMsg) ?></div>
  <?php endif; ?>

  <div class="products-grid">

    <!-- Formulario -->
    <div class="form-section">
      <h3 class="section-title">Agregar / Editar producto</h3>
      <form method="post" id="prodForm">
        <input type="hidden" name="id" value="<?= htmlspecialchars($editProduct['id'] ?? '') ?>">

        <div class="form-group">
          <label>Código</label>
          <input type="text" name="codigo" class="form-control"
                 value="<?= htmlspecialchars($editProduct['codigo'] ?? '') ?>"
                 placeholder="Ej. VID-001" required>
        </div>

        <div class="form-group">
          <label>Nombre</label>
          <input type="text" name="nombre" class="form-control"
                 value="<?= htmlspecialchars($editProduct['nombre'] ?? '') ?>"
                 placeholder="Nombre del producto" required>
        </div>

        <div class="form-group">
          <label>Categoría</label>
          <select id="catSelect" name="categoria" class="form-control" required>
            <option value="">Seleccione...</option>
            <?php foreach ($categorias_array as $cat): ?>
              <option value="<?= htmlspecialchars($cat) ?>"
                <?= (($editProduct['categoria'] ?? '') === $cat) ? 'selected' : '' ?>>
                <?= htmlspecialchars($cat) ?>
              </option>
            <?php endforeach; ?>
            <option value="__nueva__">+ Nueva categoría...</option>
          </select>
          <input type="text" id="catNueva" name="categoria_nueva" class="form-control"
                 placeholder="Escribe la nueva categoría"
                 style="margin-top:8px; display:none;">
        </div>

        <div class="form-group">
          <label>Proveedor</label>
          <input type="text" name="proveedor" class="form-control"
                 value="<?= htmlspecialchars($editProduct['proveedor'] ?? '') ?>"
                 placeholder="Nombre del proveedor">
        </div>

        <div class="form-group">
          <label>Precio compra</label>
          <input type="number" id="precioCompra" name="precio_compra" class="form-control" step="0.01" min="0"
                 value="<?= htmlspecialchars($editProduct['precio_compra'] ?? '0.00') ?>" required>
        </div>

        <div class="form-group">
          <label>Precio venta</label>
          <input type="number" id="precioVenta" name="precio_venta" class="form-control" step="0.01" min="0"
                 value="<?= htmlspecialchars($editProduct['precio_venta'] ?? '0.00') ?>" required>
        </div>

        <div class="form-group">
          <label>Stock actual</label>
          <input type="number" id="stockActual" name="stock" class="form-control" min="0"
                 value="<?= htmlspecialchars($editProduct['stock'] ?? '0') ?>" required>
        </div>

        <div class="form-group">
          <label>Stock mínimo</label>
          <input type="number" id="stockMin" name="stock_min" class="form-control" min="0"
                 value="<?= htmlspecialchars($editProduct['stock_min'] ?? '0') ?>" required>
        </div>

        <div class="form-group">
          <label>Estado</label>
          <select name="estado" class="form-control" required>
            <option value="activo"   <?= (($editProduct['estado'] ?? 'activo') === 'activo')   ? 'selected' : '' ?>>Activo</option>
            <option value="inactivo" <?= (($editProduct['estado'] ?? '') === 'inactivo') ? 'selected' : '' ?>>Inactivo</option>
          </select>
        </div>

        <div style="display:flex; gap:10px; margin-top:20px;">
          <button type="submit" class="btn-primary">Guardar</button>
          <a href="productos.php" class="btn-outline" style="text-decoration:none; display:inline-block;">Nuevo</a>
        </div>
      </form>
    </div>

    <!-- Filtros -->
    <div class="filter-section">
      <h3 class="section-title">Buscar / Filtrar</h3>

      <div class="form-group">
        <label>Buscar por nombre o código</label>
        <input type="text" id="prodSearchText" class="form-control" placeholder="Ej. VID-001 o 'templado'">
      </div>

      <div class="form-group">
        <label>Categoría</label>
        <select id="prodSearchCategory" class="form-control">
          <option value="">(Todas)</option>
          <?php foreach ($categorias_array as $cat): ?>
            <option value="<?= htmlspecialchars($cat) ?>"><?= htmlspecialchars($cat) ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="form-group">
        <label>Estado</label>
        <select id="prodSearchStatus" class="form-control">
          <option value="">(Todos)</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div style="display:flex; gap:10px; margin-top:20px;">
        <button type="button" id="prodSearchBtn" class="btn-primary">Aplicar filtros</button>
        <button type="button" id="prodSearchClear" class="btn-outline">Limpiar</button>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Listado -->
  <div class="form-section">
    <h3 class="section-title">Listado de productos</h3>

    <!-- Banner de resultados de búsqueda (visible solo al filtrar) -->
    <div id="searchResultBanner"></div>

    <table class="products-table" id="prodTable">
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
        <?php while ($row = $result->fetch_assoc()):
          $estadoClass = $row['estado'] === 'activo' ? 'status-active status-badge' : 'status-inactive status-badge';
          $stockClass  = ($row['stock'] <= $row['stock_min']) ? 'stock-low status-badge' : 'stock-ok status-badge';
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
                <a class="btn-primary btn-sm" href="productos.php?action=edit&id=<?= $row['id'] ?>" style="text-decoration:none;">Editar</a>
                <?php if ($_SESSION['rol'] === 'admin'): ?>
                  <a class="btn-secondary btn-sm"
                     href="productos.php?action=delete&id=<?= $row['id'] ?>"
                     onclick="return confirm('¿Está seguro de eliminar este producto?')"
                     style="text-decoration:none;">Eliminar</a>
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
// ── Nueva categoría ──────────────────────────────────────────
const catSelect = document.getElementById('catSelect');
const catNueva  = document.getElementById('catNueva');
catSelect.addEventListener('change', function () {
    const esNueva = this.value === '__nueva__';
    catNueva.style.display = esNueva ? 'block' : 'none';
    catNueva.required = esNueva;
});

// ── Validación cliente ───────────────────────────────────────
document.getElementById('prodForm').addEventListener('submit', function (e) {
    const compra  = parseFloat(document.getElementById('precioCompra').value);
    const venta   = parseFloat(document.getElementById('precioVenta').value);
    const stock   = parseInt(document.getElementById('stockActual').value);
    const stockM  = parseInt(document.getElementById('stockMin').value);

    if (venta < compra) {
        e.preventDefault();
        alert('El precio de venta no puede ser menor al precio de compra.');
        return;
    }
    if (stockM > stock) {
        e.preventDefault();
        alert('El stock mínimo no puede ser mayor al stock actual.');
    }
});

// ── Filtros + banner de resultados ───────────────────────────
function aplicarFiltros() {
    const texto    = document.getElementById('prodSearchText').value.toLowerCase();
    const cat      = document.getElementById('prodSearchCategory').value;
    const estado   = document.getElementById('prodSearchStatus').value;
    const rows     = document.querySelectorAll('.products-table tbody tr');
    const banner   = document.getElementById('searchResultBanner');
    let visibles   = 0;

    rows.forEach(row => {
        const code      = row.cells[0].textContent.toLowerCase();
        const name      = row.cells[1].textContent.toLowerCase();
        const rowCat    = row.cells[2].textContent.trim();
        const rowEstado = row.cells[8].textContent.toLowerCase().trim();

        const txtOk    = !texto  || code.includes(texto) || name.includes(texto);
        const catOk    = !cat    || rowCat === cat;
        const estadoOk = !estado || rowEstado === estado;
        const visible  = txtOk && catOk && estadoOk;

        row.style.display = visible ? '' : 'none';
        if (visible) visibles++;
    });

    const filtrando = texto || cat || estado;
    if (filtrando) {
        banner.style.display = 'block';
        banner.textContent   = visibles === 0
            ? 'No se encontraron productos con esos criterios.'
            : `Se encontraron ${visibles} producto(s) con los filtros aplicados.`;
        // Hacer scroll suave hacia la tabla
        document.getElementById('prodTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        banner.style.display = 'none';
    }
}

document.getElementById('prodSearchBtn').addEventListener('click', aplicarFiltros);

document.getElementById('prodSearchClear').addEventListener('click', function () {
    document.getElementById('prodSearchText').value      = '';
    document.getElementById('prodSearchCategory').value  = '';
    document.getElementById('prodSearchStatus').value    = '';
    document.querySelectorAll('.products-table tbody tr').forEach(r => r.style.display = '');
    document.getElementById('searchResultBanner').style.display = 'none';
});
</script>

</body>
</html>