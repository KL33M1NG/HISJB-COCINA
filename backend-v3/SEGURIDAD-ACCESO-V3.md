# Seguridad de acceso V3 (pruebas)

- Se registra un identificador aleatorio por navegador; en servidor se conserva solo su derivación y el número y horario de fallos. No se almacena ningún texto introducido como contraseña, tampoco el de un intento fallido.
- A partir del segundo fallo consecutivo en una ventana de 30 minutos aparece el navegador en ADMIN → Seguridad. En el quinto fallo se bloquea y el contador rojo del panel de ADMIN se actualiza aproximadamente cada 30 segundos cuando la sesión está abierta.
- Un acceso correcto reinicia los fallos previos si aún no está bloqueado. Los bloqueos no vencen automáticamente: únicamente un usuario con rol ADMIN puede levantarlos. Se audita el desbloqueo sin incluir claves ni datos personales.
- Las sesiones del mismo navegador bloqueado dejan de autorizar operaciones. El administrador debe conservar una sesión o navegador de confianza alternativo para atender bloqueos; no compartir su clave ADMIN.
- El identificador es seudónimo, no es IP, IMEI ni un identificador físico. No es una garantía de bloqueo de un dispositivo físico. El almacenamiento local depende de la política del navegador. Antes de apertura pública se necesita un mecanismo de identidad y limitación de intentos robusto adicional, así como pruebas de concurrencia y capacidad. No cambiar el manifiesto ni publicar producción con esta actualización.
- Los registros no bloqueados se eliminan después de 30 minutos sin intentos; se mantiene un límite de capacidad y los bloqueos permanecen hasta intervención administrativa.
