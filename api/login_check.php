<?php
session_start();
require_once "../conexion.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../login.php");
    exit;
}

$user = trim($_POST['usuario'] ?? '');
$pass = $_POST['password'] ?? '';

if ($user === '' || $pass === '') {
    header("Location: ../login.php?error=1");
    exit;
}

$stmt = $conexion->prepare("SELECT id, nombre, usuario, password, rol, estado FROM usuarios WHERE usuario = ?");
$stmt->bind_param("s", $user);
$stmt->execute();
$res = $stmt->get_result();

if ($res && $res->num_rows === 1) {
    $row = $res->fetch_assoc();
    if ($row['estado'] !== 'activo') {
        header("Location: ../login.php?error=1");
        exit;
    }
    if (password_verify($pass, $row['password'])) {
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['usuario'] = $row['usuario'];
        $_SESSION['nombre'] = $row['nombre'];
        $_SESSION['rol'] = $row['rol'];
        header("Location: ../dashboard.php");
        exit;
    }
}

header("Location: ../login.php?error=1");
exit;
