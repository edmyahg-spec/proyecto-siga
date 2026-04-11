<?php
session_start();
if (!isset($_SESSION['usuario']) || $_SESSION['rol'] !== 'admin') { header("Location: login.php"); exit; }
require "conexion.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?: null;
    $nombre = trim($_POST['nombre']);
    $usuario = trim($_POST['usuario']);
    $password = $_POST['password'] ?? '';
    $rol = $_POST['rol'] ?? 'empleado';
    $estado = $_POST['estado'] ?? 'activo';

    if (!$nombre || !$usuario) {
        $error = "Nombre y usuario obligatorios";
    } else {
        if ($id) {
            if ($password) {
                $pw = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $conexion->prepare("UPDATE usuarios SET nombre=?, usuario=?, password=?, rol=?, estado=? WHERE id=?");
                $stmt->bind_param("sssssi",$nombre,$usuario,$pw,$rol,$estado,$id);
            } else {
                $stmt = $conexion->prepare("UPDATE usuarios SET nombre=?, usuario=?, rol=?, estado=? WHERE id=?");
                $stmt->bind_param("ssssi",$nombre,$usuario,$rol,$estado,$id);
            }
            $stmt->execute();
        } else {
            // nuevo
            $pw = password_hash($password ?: '123456', PASSWORD_DEFAULT); // Contraseña por defecto
            $stmt = $conexion->prepare("INSERT INTO usuarios (nombre,usuario,password,rol,estado) VALUES (?,?,?,?,?)");
            $stmt->bind_param("sssss",$nombre,$usuario,$pw,$rol,$estado);
            $stmt->execute();
        }
        header("Location: usuarios.php");
        exit;
    }
}

if (isset($_GET['action']) && $_GET['action']=='delete' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    if ($id == ($_SESSION['user_id'] ?? 0)) { 
        $error = "No puede eliminar su propio usuario."; 
    } else { 
        $conexion->query("DELETE FROM usuarios WHERE id=$id"); 
        header("Location: usuarios.php"); 
        exit; 
    }
}

// Cargar usuario para editar
$editUser = null;
if (isset($_GET['edit'])) {
    $stmt = $conexion->prepare("SELECT * FROM usuarios WHERE id=?");
    $stmt->bind_param("i", $_GET['edit']);
    $stmt->execute();
    $editUser = $stmt->get_result()->fetch_assoc();
}

$usuarios = $conexion->query("SELECT id,nombre,usuario,rol,estado,created_at FROM usuarios ORDER BY id DESC");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Usuarios - Sistema</title>
<link rel="stylesheet" href="css/estilos.css">
<style>
.usuarios-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 968px) {
  .usuarios-grid {
    grid-template-columns: 1fr;
  }
}

.form-section {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.info-section {
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

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: #3b2b1f;
  margin: 15px 0 8px 0;
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

.btn-danger {
  background: #dc3545;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.usuarios-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.usuarios-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #3b2b1f;
  border-bottom: 2px solid #dee2e6;
}

.usuarios-table td {
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

.role-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background: #d1ecf1;
  color: #0c5460;
}

.role-empleado {
  background: #e2e3e5;
  color: #383d41;
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

.role-info {
  margin-bottom: 20px;
}

.role-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.4;
}
</style>
</head>
<body>

<?php include "menu.php"; ?>

<div class="main-content">
  <div class="page-header">
    <h1 class="page-title">Gestión de Usuarios</h1>
    <p class="page-subtitle">Sistema de Gestión Comercial</p>
  </div>

  <?php if(!empty($error)): ?>
    <div class="alert error" style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
      <?=htmlspecialchars($error)?>
    </div>
  <?php endif; ?>

  <div class="usuarios-grid">
    <!-- Formulario Agregar/Editar Usuario -->
    <div class="form-section">
      <h3 class="section-title">Agregar / Editar Usuario</h3>
      <form method="post">
        <input type="hidden" name="id" value="<?= htmlspecialchars($editUser['id'] ?? '') ?>">
        
        <div class="form-group">
          <label for="userUsername">Nombre de Usuario</label>
          <input type="text" id="userUsername" name="usuario" class="form-control" 
                 value="<?= htmlspecialchars($editUser['usuario'] ?? '') ?>" 
                 placeholder="Nombre de usuario" required>
        </div>

        <div class="form-group">
          <label for="userPassword">Contraseña</label>
          <input type="password" id="userPassword" name="password" class="form-control" 
                 placeholder="<?= $editUser ? 'Dejar en blanco para no cambiar' : 'Ingrese contraseña' ?>" 
                 <?= !$editUser ? 'required' : '' ?> minlength="4">
          <?php if($editUser): ?>
            <small style="color: #6c757d; font-size: 12px;">Dejar en blanco para mantener la contraseña actual</small>
          <?php endif; ?>
        </div>

        <div class="form-group">
          <label for="userName">Nombre Completo</label>
          <input type="text" id="userName" name="nombre" class="form-control" 
                 value="<?= htmlspecialchars($editUser['nombre'] ?? '') ?>" 
                 placeholder="Nombre completo del usuario" required>
        </div>

        <div class="form-group">
          <label for="userRoleSelect">Rol</label>
          <select id="userRoleSelect" name="rol" class="form-control" required>
            <option value="">Seleccione...</option>
            <option value="admin" <?= ( ($editUser['rol'] ?? '') === 'admin') ? 'selected' : '' ?>>Propietaria (Admin)</option>
            <option value="empleado" <?= ( ($editUser['rol'] ?? '') === 'empleado') ? 'selected' : '' ?>>Empleado</option>
          </select>
        </div>

        <div class="form-group">
          <label for="userStatus">Estado</label>
          <select id="userStatus" name="estado" class="form-control" required>
            <option value="activo" <?= ( ($editUser['estado'] ?? '') === 'activo') ? 'selected' : '' ?>>Activo</option>
            <option value="inactivo" <?= ( ($editUser['estado'] ?? '') === 'inactivo') ? 'selected' : '' ?>>Inactivo</option>
          </select>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" class="btn-primary">Guardar Usuario</button>
          <a href="usuarios.php" class="btn-outline">Nuevo Usuario</a>
        </div>
      </form>
    </div>

    <!-- Información de Roles -->
    <div class="info-section">
      <h3 class="section-title">Información de Roles</h3>
      
      <div class="role-info">
        <h4 class="subsection-title">Propietaria (Admin)</h4>
        <p>Acceso completo a todos los módulos del sistema: productos, ventas, reportes y gestión de usuarios.</p>
      </div>

      <div class="role-info">
        <h4 class="subsection-title">Empleado</h4>
        <p>Acceso limitado a módulos operativos: ventas y consulta de productos. No puede acceder a reportes ni gestión de usuarios.</p>
      </div>

      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <h4 class="subsection-title" style="margin-top: 0;">Nota Importante</h4>
        <p style="margin: 0; font-size: 0.85rem; color: #6c757d;">
          La contraseña por defecto para nuevos usuarios es <strong>123456</strong>. Se recomienda cambiarla después del primer acceso.
        </p>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Listado de Usuarios -->
  <div class="form-section">
    <h3 class="section-title">Listado de Usuarios</h3>
    <table class="usuarios-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Nombre</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <?php while($u = $usuarios->fetch_assoc()): 
          $estadoClass = $u['estado'] === 'activo' ? 'status-active status-badge' : 'status-inactive status-badge';
          $rolClass = $u['rol'] === 'admin' ? 'role-admin role-badge' : 'role-empleado role-badge';
          $rolText = $u['rol'] === 'admin' ? 'Propietaria' : 'Empleado';
        ?>
          <tr>
            <td><strong><?= htmlspecialchars($u['usuario']) ?></strong></td>
            <td><?= htmlspecialchars($u['nombre']) ?></td>
            <td><span class="<?= $rolClass ?>"><?= $rolText ?></span></td>
            <td><span class="<?= $estadoClass ?>"><?= ucfirst($u['estado']) ?></span></td>
            <td>
              <div class="action-buttons">
                <a class="btn-primary btn-sm" href="usuarios.php?edit=<?= $u['id'] ?>" style="text-decoration: none;">Editar</a>
                <?php if($u['id'] != ($_SESSION['user_id'] ?? 0)): ?>
                  <a class="btn-danger btn-sm" href="usuarios.php?action=delete&id=<?= $u['id'] ?>" onclick="return confirm('¿Está seguro de eliminar este usuario?')" style="text-decoration: none;">Eliminar</a>
                <?php else: ?>
                  <span style="color: #6c757d; font-size: 12px;">Actual</span>
                <?php endif; ?>
              </div>
            </td>
          </tr>
        <?php endwhile; ?>
      </tbody>
    </table>
  </div>
</div>

</body>
</html>