# HISJB Cocina V3 · Diseño institucional y preferencias visuales

## Actualización realizada en rama de desarrollo
- Rediseño de la interfaz unificada `AccesoV3.html`: acceso, personal, supervisión, Cocina, Nutrición y Administración.
- Apariencia institucional de azul y blanco, tarjetas de estadísticas, estados de pedidos y jerarquías visuales.
- Identidad visual según rol (WEB/SUPERVISOR azul, COCINA naranja, NUTRICION verde y ADMIN violeta). El color es orientativo; el servidor sigue controlando permisos.
- Nuevo botón **⚙️ Apariencia** visible antes y después de iniciar sesión: modo claro u oscuro, tamaño de letra normal/grande y espaciado cómodo/compacto.
- Preferencias guardadas solo en localStorage del navegador bajo `hisjb-v3-apariencia`. No se guardan contraseñas, DNI, datos del personal ni pedidos.
- Ajustes para móviles, foco visible de teclado, movimientos reducidos y botones de 44px.

## Actualización única de pruebas
1. Hacer respaldo de la planilla ficticia V3 antes de seguir; **no usar nombres reales ni copiar el archivo privado de migración**.
2. Ejecutar PowerShell:
    cd "C:\HISJB\HISJB-COCINA"
    git pull origin desarrollo-selector-v3-2026-11-20
    cd .\backend-v3
    clasp.cmd status
3. Confirmar que `.clasp.json` apunta únicamente al Apps Script V3 de pruebas y que `appsscript.json` es el original de ese proyecto.
4. Ejecutar `clasp.cmd push` y abrir la URL `/dev` del sistema de pruebas; recargar la página con Ctrl+F5.

## Inspección rápida (sin escritura)
- En pantalla de acceso, abrir ⚙️ Apariencia; probar tema oscuro, letras grandes y espaciado compacto; refrescar y comprobar que se conservan.
- Comprobar visualmente las pantallas de Personal, Cocina, Nutrición y ADMIN con sus cuentas ficticias. No hace falta ejecutar cierres nuevos.
- Abrir en celular para comprobar botones, tarjetas y listados.
- Verificar que los permisos siguen funcionando y no aparecieron datos de otros servicios.
- No desplegar `/exec`, ni modificar `main` hasta la aceptación por los equipos.

## Seguridad y continuidad pendientes antes de producción
- Sustituir contraseñas incrustadas en el HTML original (no copiarlas a V3). Revisar exposición del repositorio.
- Diseñar respaldo periódico de Sheets y restauración probada con la cuenta institucional designada.
- Confirmar control de permisos en las hojas y rol de despliegue de Apps Script.
- Hacer ensayo de falla a mitad de cierre y revisar auditoría de recuperación con datos ficticios.
- Probar registro simultáneo de la misma persona desde dos sesiones; la entrega simultánea se ensayó previamente.
- Los 150 pedidos diarios esperados justifican omitir el ensayo de carga de 300–500, pero no las comprobaciones básicas de concurrencia.

## Acceso y despliegue
Los cambios se editaron directamente en el repositorio GitHub conectado; el asistente no obtuvo acceso a la sesión local de `clasp` ni al entorno privado de Apps Script. La sincronización desde PC sigue requiriendo ejecución por el propietario/autorizado o un mecanismo explícito de despliegue futuro. No compartir claves, tokens `.clasprc.json` ni credenciales en el chat.