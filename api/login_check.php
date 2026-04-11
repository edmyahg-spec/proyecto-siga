<?php
session_start();
require_once "../conexion.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../login.php");
    exit;
}

// Límite de intentos: máximo 5 en 15 minutos
$maxIntentos = 5;
$ventanaTiempo = 15 * 60; // 15 minutos en segundos

if (!isset($_SESSION['intentos_login'])) {
    $_SESSION['intentos_login'] = 0;
    $_SESSION['primer_intento'] = time();
}

// Si pasaron más de 15 minutos, reiniciar conteo
if (time() - $_SESSION['primer_intento'] > $ventanaTiempo) {
    $_SESSION['intentos_login'] = 0;
    $_SESSION['primer_intento'] = time();
}

// Bloquear si ya superó el límite
if ($_SESSION['intentos_login'] >= $maxIntentos) {
    $tiempoRestante = ceil(($ventanaTiempo - (time() - $_SESSION['primer_intento'])) / 60);
    header("Location: ../login.php?error=bloqueado&tiempo=" . $tiempoRestante);
    exit;
}

$user = trim($_POST['usuario'] ?? '');
$pass = $_POST['password'] ?? '';

if ($user === '' || $pass === '') {
    $_SESSION['intentos_login']++;
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
        $_SESSION['intentos_login']++;
        header("Location: ../login.php?error=inactivo");
        exit;
    }
    if (password_verify($pass, $row['password'])) {
        // Login exitoso — limpiar conteo de intentos
        $_SESSION['intentos_login'] = 0;
        $_SESSION['primer_intento'] = 0;
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['usuario'] = $row['usuario'];
        $_SESSION['nombre'] = $row['nombre'];
        $_SESSION['rol'] = $row['rol'];
        header("Location: ../dashboard.php");
        exit;
    }
}

// Contraseña incorrecta
$_SESSION['intentos_login']++;
$intentosRestantes = $maxIntentos - $_SESSION['intentos_login'];
header("Location: ../login.php?error=credenciales&restantes=" . $intentosRestantes);
exit;