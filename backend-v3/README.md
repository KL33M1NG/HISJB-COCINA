# Backend HISJB V3 · Preparación para pruebas

> **NO instalar sobre el Apps Script de producción**. Este código es una base experimental. Su integración con GitHub Pages y su seguridad todavía requieren revisión antes de usar personal real.

## Estado de la integración
- Implementados en `Code.gs`: login por servicio, roles WEB/SUPERVISOR/COCINA/NUTRICION/ADMIN, consulta de nómina **del propio servicio**, registro de una o varias personas, dos pedidos (MAÑANA/NOCHE) para guardias de 24 h, detección de repetidos en el servidor bajo `LockService`, entrega y reversión con auditoría.
- **Pendiente:** conectar el HTML a este backend, probar autenticación y transportes entre GitHub Pages y Apps Script, pruebas de permisos y concurrencia, migración de nómina (con controles de calidad) y puesta en producción.
- El HTML dentro de `versiones/v3/` sigue siendo **solo demostración local**: no tiene clave de acceso y **no utiliza este archivo**.
- El código NO contiene datos de trabajadores ni contraseñas.

## Instalación segura en entorno de pruebas (solo administración)
1. Crear **otra Google Sheet** distinta de la que opera Cocina, con acceso limitado.
2. Crear un **proyecto nuevo de Apps Script** vinculado a esa hoja de pruebas; no reemplazar el Apps Script vigente.
3. Copiar `Code.gs` en el proyecto nuevo.
4. Desde *Configuración del proyecto → Propiedades de la secuencia de comandos*, agregar `HISJB_V3_TEST_SHEET_ID` con el ID de **la hoja nueva**.
5. Ejecutar desde el editor `v3HojasIniciales()` una sola vez para crear las pestañas `Personal_V3`, `Pedidos_V3` y `Auditoria_V3`.
6. Completar `Personal_V3` con **datos ficticios**, encabezados exactos: `ID_PERSONAL`, `NOMBRE`, `SERVICIO`, `DIETA`, `ACTIVO`. Usar IDs únicos, `SI` en ACTIVO y un servicio que coincida con el acceso creado.
7. Crear cuentas **solo dentro del proyecto privado**, invocando `v3ProvisionarCuenta('ENFERMERIA', 'SUPERVISOR', claveLargaDePrueba)` desde una función temporal privada; eliminar esa función temporal tras ejecutarla. Nunca subir contraseñas a GitHub. Configurar también cuentas diferentes para Cocina y otros servicios.
8. Configurar el acceso web en entorno de prueba y estudiar cómo exponer el frontend con autenticación sin poner tokens en URL ni permitir consultas públicas de nómina. **No cambiar la URL de producción**.

## Importante: GitHub Pages + Apps Script
GitHub Pages es un sitio estático: no protege endpoints ni puede guardar claves privadas. El script debe validar **cada** operación, sin confiar en `servicio` o `tipo` recibidos del navegador. Las llamadas `fetch` desde GitHub Pages hacia Apps Script pueden presentar limitaciones CORS/redirección; este backend usa JSON POST y no debe darse por conectado hasta elegir y probar el mecanismo de comunicación. Evitar usar JSONP o parámetros GET para contraseñas/tokens. Una alternativa a evaluar es servir la interfaz operativa desde `HtmlService` del propio Apps Script y dejar GitHub Pages como portal/selector visual, o usar un backend HTTPS con CORS y sesiones adecuados.

## Reglas de negocio
- `WEB`: registra una persona por solicitud, solo de su servicio.
- `SUPERVISOR`: registra una selección (hasta 250 IDs), exclusivamente del servicio de su sesión.
- Guardias de **24 horas**: una selección crea **dos filas** en `Pedidos_V3`, para almuerzo y cena, con `LOTE` común.
- Guardias de otras duraciones: una comida según turno solicitado.
- Clave de deduplicación: `ID_PERSONAL + FECHA + TURNO`; estado `ENTREGADO` también impide duplicación.
- `COCINA`: puede entregar o revertir, con una entrada de auditoría.
- `NUTRICION`: por ahora puede consultar el listado, **no** editar menús mediante este backend.
- Este prototipo aún no implementa permisos más granulares, cierre de turnos, menú, carga manual de personas nuevas, login rate-limiting, revocación de sesiones, ni migración desde los registros reales.

## Pruebas mínimas obligatorias antes de producción
1. Contraseña incorrecta no debe iniciar sesión.
2. Supervisor de Enfermería no debe visualizar ni registrar trabajadores de otro servicio.
3. El mismo trabajador, fecha y comida no se registra dos veces aunque se envíen dos solicitudes simultáneas.
4. Guardia 24 h crea almuerzo y cena una vez cada uno, con el mismo lote; cada comida puede entregarse independientemente.
5. Reversión no crea un pedido adicional, y queda auditada.
6. Los datos permanecen en la hoja de prueba y no aparecen en la planilla real.
7. En navegador móvil, las pantallas y mensajes de error funcionan sin exponer contraseñas/tokens.

## Volver atrás
La rama `main` original sigue activa. No cambiar `version-config.js` a `v3` antes de terminar integración y pruebas. Cambiar la versión de la web **no** revierte cambios de Apps Script o Sheets.
