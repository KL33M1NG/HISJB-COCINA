# Backend HISJB V3 · Preparación para pruebas

> **NO instalar sobre el Apps Script de producción**. Este código es una base experimental. Su integración con GitHub Pages y su seguridad todavía requieren revisión antes de usar personal real.

## Estado de la integración
- **Integración HtmlService de pruebas disponible**: `AccesoV3.html` es el ingreso único por contraseña y dirige a las vistas de Personal o Cocina/Nutrición mediante `google.script.run` y roles de `Code.gs`. `PersonalV3.html` y `CocinaV3.html` se mantienen como referencias iniciales. **Todavía no fue probado por el usuario en navegador ni habilitado para producción**. Guías: [ACCESO-SOLO-CLAVE.md](./ACCESO-SOLO-CLAVE.md) e [INTEGRACION-HTMLSERVICE.md](./INTEGRACION-HTMLSERVICE.md).
- Implementados en `Code.gs`: login por servicio, roles WEB/SUPERVISOR/COCINA/NUTRICION/ADMIN, consulta de nómina **del propio servicio**, registro de una o varias personas, dos pedidos (MAÑANA/NOCHE) para guardias de 24 h, detección de repetidos en el servidor bajo `LockService`, entrega y reversión con auditoría.
- **Pendiente:** prueba de la interfaz en navegador, pruebas de concurrencia, controles antiabuso, edición de menú con permisos de Nutrición, migración de nómina y puesta en producción. El HTML de GitHub Pages sigue siendo demostrativo.
- El HTML dentro de `versiones/v3/` sigue siendo **solo demostración local**: no tiene clave de acceso y **no utiliza este archivo**.
- El código NO contiene datos de trabajadores ni contraseñas.

## Instalación segura en entorno de pruebas (solo administración)
1. Crear **otra Google Sheet** distinta de la que opera Cocina, con acceso limitado.
2. Crear un **proyecto nuevo de Apps Script** vinculado a esa hoja de pruebas; no reemplazar el Apps Script vigente.
3. Copiar `Code.gs` en el proyecto nuevo.
4. Desde *Configuración del proyecto → Propiedades de la secuencia de comandos*, agregar `HISJB_V3_TEST_SHEET_ID` con el ID de **la hoja nueva**.
5. Ejecutar desde una función auxiliar del editor que llame a `v3HojasIniciales_()` una sola vez para crear las pestañas `Personal_V3`, `Pedidos_V3` y `Auditoria_V3`.
6. Completar `Personal_V3` con **datos ficticios**, encabezados exactos: `ID_PERSONAL`, `NOMBRE`, `SERVICIO`, `DIETA`, `ACTIVO`. Usar IDs únicos, `SI` en ACTIVO y un servicio que coincida con el acceso creado.
7. Crear cuentas **solo dentro del proyecto privado**, invocando `v3ProvisionarCuenta_('ENFERMERIA', 'SUPERVISOR', claveLargaDePrueba)` desde una función auxiliar temporal en el editor privado; eliminar esa función temporal tras ejecutarla. Nunca subir contraseñas a GitHub. Configurar también cuentas diferentes para Cocina y otros servicios.
8. Configurar el acceso web en entorno de prueba y estudiar cómo exponer el frontend con autenticación sin poner tokens en URL ni permitir consultas públicas de nómina. **No cambiar la URL de producción**.

## Importante: GitHub Pages + Apps Script
GitHub Pages es un sitio estático: no protege endpoints ni puede guardar claves privadas. El script debe validar **cada** operación, sin confiar en `servicio` o `tipo` recibidos del navegador. Las llamadas `fetch` desde GitHub Pages hacia Apps Script pueden presentar limitaciones CORS/redirección. Para el entorno de pruebas se adoptó HtmlService con `google.script.run`, y se deshabilitó el POST JSON anterior. Evitar usar JSONP o parámetros GET para contraseñas/tokens. La interfaz operativa de pruebas se sirve desde `HtmlService` del propio Apps Script; GitHub Pages queda como portal/selector visual y demo.

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
