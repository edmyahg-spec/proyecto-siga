<?php
session_start();
require_once "../conexion.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../login.php");
    exit;
}


if (!isset($_SESSION['fallos_login'])) {
    $_SESSION['fallos_login'] = 0;
}

$delays = [0, 2, 4, 8];
$delay  = $delays[min($_SESSION['fallos_login'], count($delays) - 1)];
if ($delay > 0) sleep($delay);

$user = trim($_POST['usuario'] ?? '');
$pass = $_POST['password'] ?? '';

if ($user === '' || $pass === '') {
    $_SESSION['fallos_login']++;
    header("Location: ../login.php?error=vacio");
    exit;
}

$stmt = $conexion->prepare("SELECT id, nombre, usuario, password, rol, estado FROM usuarios WHERE usuario = ?");
$stmt->bind_param("s", $user);
$stmt->execute();
$res = $stmt->get_result();

if ($res && $res->num_rows === 1) {
    $row = $res->fetch_assoc();

    if ($row['estado'] !== 'activo') {
        $_SESSION['fallos_login']++;
        header("Location: ../login.php?error=inactivo");
        exit;
    }

    if (password_verify($pass, $row['password'])) {
        $_SESSION['fallos_login'] = 0;
        $_SESSION['user_id']  = $row['id'];
        $_SESSION['usuario']  = $row['usuario'];
        $_SESSION['nombre']   = $row['nombre'];
        $_SESSION['rol']      = $row['rol'];
        header("Location: ../dashboard.php");
        exit;
    }
}

$_SESSION['fallos_login']++;
header("Location: ../login.php?error=credenciales");
exit;