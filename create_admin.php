<?php

require "conexion.php";

$usuario = "admin";
$pass = password_hash("Admin123!", PASSWORD_DEFAULT);
$nombre = "Administrador";
$rol = "admin";

$stmt = $conexion->prepare("SELECT id FROM usuarios WHERE usuario=?");
$stmt->bind_param("s",$usuario);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    $ins = $conexion->prepare("INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?,?,?,?)");
    $ins->bind_param("ssss", $nombre, $usuario, $pass, $rol);
    if ($ins->execute()) {
        echo "Admin creado: usuario=admin , contraseña=Admin123! - BORRA este archivo create_admin.php";
    } else {
        echo "Error al crear admin: " . $conexion->error;
    }
} else {
    echo "El usuario admin ya existe.";
}
?>
