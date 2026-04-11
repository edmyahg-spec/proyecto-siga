<?php
if(!isset($_SESSION)) session_start();

// Determinar la página actual para resaltar el menú activo
$current_page = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html>
<head>
<style>
/* Topbar Styles */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: linear-gradient(90deg, #8B7355, #A68A6D);
  color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 95px;
  z-index: 1000;
}

.brand {
  display: flex;
  gap: 15px;
  align-items: center;
}

.logo-small {
  width: 45px;
  height: 45px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.2);
}

.brand-text {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.brand-subtitle {
  font-size: 11px;
  opacity: 0.8;
  margin: 0;
}

.top-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.user-info {
  font-weight: 600;
  font-size: 14px;
}

.user-role {
  font-size: 11px;
  opacity: 0.8;
  text-transform: capitalize;
}

.logout-btn {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  margin-top: 4px;
  border: 1px solid rgba(255,255,255,0.3);
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.3);
}

/* Sidebar Styles */
.sidebar {
  position: fixed;
  left: 0;
  top: 100px; /* Debajo del topbar */
  width: 250px;
  height: calc(100vh - 80px);
  background: #fff;
  padding: 20px 15px;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  z-index: 999;
}

.sidebar a {
  display: block;
  padding: 12px 15px;
  margin-bottom: 8px;
  border-radius: 12px;
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.sidebar a:hover {
  background: #f7fafc;
  color: #2d3748;
  border-color: #e2e8f0;
}

.sidebar a.active {
  background: linear-gradient(135deg, #8B7355, #A68A6D);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
  border: 1px solid #8B7355;
  font-weight: 600;
}

/* Main content adjustment - ESTO ES LO IMPORTANTE */
.main-content {
  margin-left: 250px;
  margin-top: 90px; /* Esto empuja el contenido hacia abajo */
  padding: 25px;
  min-height: calc(100vh - 80px);
  background: #f8f9fa;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    margin-top: 80px;
  }
  
  .topbar {
    padding: 12px 15px;
  }
  
  .brand-text {
    font-size: 14px;
  }
  
  .brand-subtitle {
    font-size: 10px;
  }
}

/* Estilos adicionales para el contenido */
.container {
  max-width: 1200px;
  margin: 0 auto;
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
  margin-bottom: 20px;
}
</style>
</head>
<body>

<div class="topbar">
  <div class="brand">
    <img src="img/ga.jpg" alt="logo" class="logo-small">
    <div>
      <div class="brand-text">Vidrios y Aluminios Grupo Águila</div>
      <div class="brand-subtitle">Sistema de Gestión Comercial</div>
    </div>
  </div>

  <div class="top-actions">
    <span class="user-info"><?= htmlspecialchars($_SESSION['nombre'] ?? ''); ?></span>
    <span class="user-role"><?= htmlspecialchars($_SESSION['rol'] ?? ''); ?></span>
    <a href="logout.php" class="logout-btn">Cerrar sesión</a>
  </div>
</div>

<div class="sidebar">
  <a href="dashboard.php" class="<?= $current_page == 'dashboard.php' ? 'active' : '' ?>">Tablero</a>
  <a href="productos.php" class="<?= $current_page == 'productos.php' ? 'active' : '' ?>">Productos</a>
  <a href="compras.php" class="<?= $current_page == 'compras.php' ? 'active' : '' ?>">Compras</a>
  <a href="ventas.php" class="<?= $current_page == 'ventas.php' ? 'active' : '' ?>">Ventas</a>
  <?php if(($_SESSION['rol'] ?? '') === 'admin'): ?>
    <a href="usuarios.php" class="<?= $current_page == 'usuarios.php' ? 'active' : '' ?>">Usuarios</a>
    <a href="reportes.php" class="<?= $current_page == 'reportes.php' ? 'active' : '' ?>">Reportes</a>
  <?php endif; ?>
</div>

</body>
</html>