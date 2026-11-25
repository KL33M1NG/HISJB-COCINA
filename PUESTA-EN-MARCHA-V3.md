# Puesta en marcha controlada — canal SERVICIOS

Antes del corte, generar un paquete operativo nuevo que impida toda escritura operativa mientras la propiedad privada `HISJB_V3_PROD_SERVICIOS_HABILITADOS` no sea `SI`. ADMIN se conserva en su implementación versionada privada, sin cambios. Se permite autenticar y consultar información autorizada; no se habilitan pedidos, entregas, cierre, menús ni avisos. Los avisos de mantenimiento se reflejan en el navegador. Un cambio de la propiedad no revierte operaciones que ya estuvieran en curso.

## Preparar localmente
```powershell
cd "$env:USERPROFILE\Documents\HISJB-COCINA"
git pull --ff-only origin desarrollo-selector-v3-2026-11-20
node .\tools\preparar-puesta-marcha-v3.js "$env:USERPROFILE\Documents\HISJB-V3-CANALES-PRIVADOS\OPERATIVO" "$env:USERPROFILE\Documents\HISJB-V3-PUESTA-MARCHA"
```

El código y manifiesto siguen privados; no se modifica el proyecto anterior ni se publica automáticamente. Revisar destino y archivos antes de sincronizar únicamente HEAD del proyecto V3 productivo. Comprobar el aviso de preparación, el acceso por rol y la configuración cerrada. No probar con datos reales innecesarios. La implementación privada ADMIN `/exec` continúa en su versión anterior.

## Antes de la apertura pública
Confirmar autorización institucional, gestión de datos personales, retiro/rotación de credenciales antiguas, disponibilidad de operación y pausa de versiones anteriores. El bloqueo de navegador no es identidad física ni protección suficiente por sí solo; se requiere revisión de autenticación y medidas complementarias de limitación de intentos y disponibilidad. No habilitar acceso público a ADMIN ni publicar datos en GitHub. El destino operativo definitivo debe verificarse desde un teléfono sin Google antes de asociarlo al enlace de mudanza.

## Corte autorizado después de las 23:00 (hora argentina)
Cerrar el turno del sistema anterior, respaldar y conciliar pendientes; impedir nuevas escrituras en su backend y confirmar el resultado. No basta ocultar la interfaz. Sólo entonces colocar `HISJB_V3_PROD_SERVICIOS_HABILITADOS=SI` en el proyecto V3, comprobar su funcionamiento y activar los enlaces de mudanza tras aprobación. Retirar la propiedad permite detener nuevas operaciones V3. No activar redirección antes de disponer del destino productivo y verificar que ADMIN permanece privado.
