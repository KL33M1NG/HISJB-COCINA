# HISJB Cocina V3 — Historial diario de cierres

**Exclusivamente proyecto y planilla de PRUEBAS. No cambiar `main` ni producción.**

## Funcionalidad

La pantalla unificada de gestión V3 tiene la sección **Historial de cierres y estadísticas**, visible para las cuentas `COCINA`, `NUTRICION` y `ADMIN`.

- Selección de fechas **Desde** y **Hasta**, por defecto últimos 30 días (máximo 91 días inclusive).
- Indicadores del período: turnos cerrados, total de viandas, almuerzos, cenas, entregadas, no entregadas y duplicados históricos excluidos.
- Cada cierre muestra fecha, turno, hora del cierre, responsable por sector y conteos.
- Al expandir un cierre: estadísticas por dieta y servicio (total, entregadas y no entregadas).
- Los datos provienen de **Cierres_V3**, se almacenan cuando Cocina cierra un turno y son agregados: no se exponen nombres ni IDs personales.
- Si no hay cierres para ese período, se informa que no existen registros. **No crea cierres ficticios**.
- No hay función de exportación todavía ni actualización automática en tiempo real.
- Nutrición puede **consultar** el historial pero **no cerrar** turnos.
- Los usuarios `WEB` y `SUPERVISOR` no pueden consultar esos informes.

## Cómo sincronizar

Desde PowerShell, verificar que `.clasp.json` sigue vinculado a Apps Script **de pruebas**:

```powershell
cd "$HOME\Documents\HISJB-COCINA"
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp status
clasp push
```

El archivo nuevo **HistorialCierres.gs** deberá aparecer en el listado y subirse con clasp.

## Probar SIN cerrar turnos

1. Ejecutar en Apps Script **`pruebasHistorialSoloLecturaV3`**. Esperado: **6/6**. No se escriben pedidos ni cierres.
2. Entrar en la URL de desarrollo `/dev` con el acceso ficticio de **COCINA**.
3. Localizar **Historial de cierres y estadísticas** al final del panel de Cocina.
4. Elegir período y pulsar **Consultar historial**.
5. Si aún no se ha cerrado ningún turno, debería mostrar **0** y el mensaje «No hay turnos cerrados dentro del período seleccionado».
6. Comprobar acceso también como Nutrición. No debe existir la función de cierre habilitada para Nutrición.
7. **No pulsar Cerrar turno** en esta primera verificación.

## Prueba posterior, únicamente con planilla ficticia

Solo después de guardar **una copia de la planilla V3**, revisar los totales pendientes del turno, confirmar el cierre con su texto exacto, y comprobar:
- `Cierres_V3` tiene exactamente una fila nueva para fecha+turno;
- `Pedidos_V3` conservó las filas pero dejó `NO_ENTREGADO` en las pendientes;
- El historial muestra ese turno y sus estadísticas;
- El otro turno continúa abierto.

**Advertencia:** Google Sheets no ofrece transacciones atómicas entre varias operaciones. El cierre actual usa `LockService` y confirmación pero, ante un fallo del servidor después de marcar pendientes y antes de grabar el resumen, puede requerir conciliación manual. No promover a producción sin probar recuperación ante fallos y sin procedimiento auditado de reapertura.
