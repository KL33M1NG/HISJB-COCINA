# Sesión operativa de una hora

- Los perfiles WEB, SUPERVISOR, COCINA y NUTRICION pueden mantener la sesión en la misma pestaña, incluso al recargar. El vencimiento absoluto se calcula en el servidor al inicio de sesión; restaurarla no lo amplía. El servidor puede expirar antes por disponibilidad de la caché. Al vencer, volver a ingresar.
- ADMIN no guarda ni restaura sesión y su duración máxima es 30 minutos. No almacenar contraseñas desde JavaScript. El campo es compatible con autocompletado de contraseña del navegador, sujeto a su configuración; no se garantiza que Chrome ofrezca guardar una clave en todos los contextos de Apps Script. No se envía automáticamente la contraseña al abrir.
- El token temporal se guarda en `sessionStorage` (si está disponible), no en `localStorage`. Cerrar sesión borra la copia local e invalida el token en el servidor. La restauración vuelve a verificar la cuenta, la caducidad y el identificador de navegador. Las sesiones antiguas sin vencimiento explícito deberán iniciar nuevamente cuando se publique la actualización.
- Para computadoras compartidas, usar un perfil de Chrome exclusivo, sin cuentas Google múltiples, con acceso físico controlado. Invitado no conserva claves al cerrar. No guardar ADMIN ni claves de otros servicios en ese perfil.

## Validación en pruebas
1. Ingresar con SUPERVISOR ficticio y marcar mantener sesión. Recargar y comprobar que vuelve al panel; comprobar que la sesión no se prolonga. Cerrar sesión y recargar para comprobar que vuelve al acceso.
2. Confirmar que ADMIN no restaura sesión, y que una sesión vencida se rechaza. No modificar reloj ni datos de producción para probarlo.
3. Regenerar ambos paquetes privados productivos mediante las herramientas existentes, conservar configuración y cuentas, y actualizar cada implementación por separado tras la aprobación.
