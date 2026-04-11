<?php
session_start();
if (isset($_SESSION['usuario'])) {
  header("Location: dashboard.php");
  exit;
}
?>
<!doctype html>
<html lang="es">

<head>
  <meta charset="utf-8">
  <title>Vidrios y Aluminios Grupo Águila</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #3b2b1f, #8a7765);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .login-wrapper {
      background: #ffffff;
      width: 420px;
      padding: 40px 35px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .login-wrapper img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 50%;
      margin-bottom: 20px;
      border: 4px solid #3b2b1f;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    h1 {
      margin: 0 0 30px 0;
      color: #3b2b1f;
      font-weight: 700;
      font-size: 28px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .input-group {
      margin-bottom: 20px;
      text-align: left;
    }

    .input-label {
      font-size: 14px;
      font-weight: 600;
      color: #3b2b1f;
      display: block;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-field {
      width: 100%;
      padding: 14px 16px;
      border-radius: 12px;
      border: 2px solid #d6c6b5;
      background: #f8f5f2;
      outline: none;
      font-size: 16px;
      color: #3b2b1f;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .input-field:focus {
      border-color: #3b2b1f;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 43, 31, 0.1);
      transform: translateY(-2px);
    }

    .btn-login {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #3b2b1f, #5a4433);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 10px 0;
      box-shadow: 0 4px 15px rgba(59, 43, 31, 0.3);
    }

    .btn-login:hover {
      background: linear-gradient(135deg, #5a4433, #3b2b1f);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 43, 31, 0.4);
    }

    .btn-forgot {
      width: 100%;
      padding: 12px;
      background: transparent;
      color: #3b2b1f;
      border: 2px solid #d6c6b5;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 5px 0;
    }

    .btn-forgot:hover {
      background: #f8f5f2;
      border-color: #3b2b1f;
    }

    .credentials {
      margin-top: 25px;
      padding: 15px;
      background: #f8f5f2;
      border-radius: 10px;
      border: 1px solid #e8ddd4;
    }

    .credentials p {
      margin: 0;
      font-size: 13px;
      color: #5a4433;
      font-weight: 500;
    }

    .credentials strong {
      color: #3b2b1f;
    }

    .alert {
      padding: 12px 16px;
      background: #e15d63;
      color: white;
      border-radius: 10px;
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 14px;
      border: 2px solid #d04c52;
    }

    .toggle-password {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      color: #5a4433;
    }
  </style>
</head>

<body>

  <div class="login-wrapper">
    <img src="img/ga.jpg" alt="logo">

    <h1>Vidrios y Aluminios<br>Grupo Águila</h1>

    <?php
    $errorTipo = $_GET['error'] ?? '';

    $mensajes = [
      'credenciales' => 'Usuario o contraseña incorrectos.',
      'inactivo'     => 'Tu cuenta está desactivada. Contacta al administrador.',
      'vacio'        => 'Debes ingresar usuario y contraseña.',
    ];

    $errorMsg = $mensajes[$errorTipo] ?? '';
    ?>

    <?php if ($errorMsg): ?>
      <div class="alert">
        <?= htmlspecialchars($errorMsg) ?>
      </div>
    <?php endif; ?>

    <form action="api/login_check.php" method="post">
      <div class="input-group">
        <label class="input-label">Usuario</label>
        <input type="text" name="usuario" class="input-field" required placeholder="Ingrese su usuario">
      </div>

      <div class="input-group">
        <label class="input-label">Contraseña</label>
        <div style="position: relative;">
          <input type="password" name="password" id="password" class="input-field" required placeholder="Ingrese su contraseña" style="padding-right: 48px;">
          <button type="button" class="toggle-password" onclick="togglePass()">
            <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <button class="btn-login" type="submit">Iniciar sesión</button>
      <button type="button" class="btn-forgot" onclick="alert('Contacte al administrador del sistema')">¿Olvidó su contraseña?</button>
    </form>

    <div class="credentials">
      <p>Usuario: <strong>admin</strong> - Contraseña: <strong>Admin123!</strong></p>
    </div>
  </div>

  <script>
    function togglePass() {
      const input = document.getElementById('password');
      const icon = document.getElementById('eyeIcon');
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      icon.innerHTML = visible
        ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
        : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
    }
  </script>

</body>

</html>