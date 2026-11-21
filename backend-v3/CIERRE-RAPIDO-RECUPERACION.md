# HISJB Cocina V3 — cierre rápido y recuperación controlada

## Cambios de esta actualización
- Cierre para Cocina: pulsar **Cerrar almuerzo/cena** y luego **Confirmar cierre** en un panel integrado. No pide escribir CERRAR MAÑANA ni abre dos cuadros del navegador.
- Se mantiene bloqueo de acceso solo para COCINA o ADMIN y control de totales/pedidos pendientes vigentes en el servidor bajo LockService.
- Cierre guarda primero el registro resumido en Cierres_V3 y hace SpreadsheetApp.flush(); después actualiza estados pendientes a NO_ENTREGADO. Ese registro bloquea inmediatamente nuevas inscripciones, entregas o reversiones del mismo turno.
- Si la actualización de pedidos falla después de grabar el cierre, ADMIN dispone de **Verificar integridad del cierre** y **Completar estados pendientes**. La función solo corrige pedidos PENDIENTES del turno cerrado si las cifras proyectadas coinciden con el cierre guardado. Rechaza discrepancias y jamás reabre turnos.
- El diagnóstico/reconciliación cubre solo cierres de **hoy** en el horario de la planilla; los cierres de fechas anteriores requieren revisión manual. No es una transacción de base de datos y todavía hace falta validar fallas simuladas y concurrentes.

## Actualizar SOLO proyecto V3 de pruebas
1. Hacer copia de Google Sheets V3 de pruebas. Confirmar que no contiene personal real.
2. PowerShell:
    cd "C:\HISJB\HISJB-COCINA"
    git pull origin desarrollo-selector-v3-2026-11-20
    cd .\backend-v3
    clasp.cmd status
3. Confirmar que `.clasp.json` corresponde al Apps Script **V3 PRUEBAS** y que `appsscript.json` conserva la configuración original. Ejecutar `clasp.cmd push`.
4. Abrir /dev y actualizar navegador. **No tocar proyecto productivo**.

## Comprobaciones sin escritura
- Ejecutar `pruebasCierreSeguroSoloLecturaV3`: esperado **10/10**; no escribe ni cierra turnos.
- Repetir `pruebasCocinaSoloLecturaV3`: esperado 9/9.
- Repetir `pruebasHistorialSoloLecturaV3`: esperado 6/6.
- Verificar visualmente que al tocar **Cerrar almuerzo/cena** aparece un panel con botón **Cancelar** y **Confirmar cierre** y que Cancelar no efectúa ninguna escritura.
- Recordatorio: el turno de almuerzo del **21/11/2026** ya está cerrado. No intentarlo de nuevo ni editar manualmente ese cierre.

## Prueba posterior con datos ficticios
En otro día o turno abierto, registrar al menos 3 pedidos de test, entregar 2 y dejar 1 pendiente; si existen más pedidos, revisar la suma completa. Crear respaldo antes de cerrar. Una sola confirmación integrada: **Confirmar cierre**. Revisar luego Pedidos_V3, Cierres_V3 e historial.
El panel ADMIN permite **Verificar integridad del cierre**, pero nunca usar **Completar estados pendientes** si no hay una discrepancia real, y nunca antes de hacer copia de seguridad.

## Antes de producción
Pendientes: ensayo de errores simulados a mitad de cierre, pruebas de concurrencia (varias estaciones), restauración de respaldo, análisis de duplicados y homónimos, rotación de claves expuestas en HTML original, revisión de permisos de publicación, aprobación de Cocina/Nutrición/Administración. Sin autorización no subir a main ni desplegar sobre /exec de producción.