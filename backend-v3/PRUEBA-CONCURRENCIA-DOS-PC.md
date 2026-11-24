# HISJB Cocina V3 — prueba de dos computadoras y protección de entregas

SOLO Apps Script V3 de pruebas y planilla con personas ficticias. El sistema estable en main no se toca.

## Actualizar
1. Crear copia de la planilla V3 de pruebas y comprobar que no tiene nombres reales.
2. PowerShell:
    cd "C:\HISJB\HISJB-COCINA"
    git pull origin desarrollo-selector-v3-2026-11-20
    cd .\backend-v3
    clasp.cmd status
3. Comprobar que .clasp.json apunta SOLO al proyecto de pruebas y que appsscript.json es el original de ese proyecto. Ejecutar clasp.cmd push.
4. En Apps Script ejecutar pruebasProteccionEntregasV3. Resultado esperado: 9/9, sin escrituras. También ejecutar pruebasCierreSeguroSoloLecturaV3 (10/10).

## Prueba de concurrencia de entrega en DOS sesiones
1. Usar dos computadoras o dos ventanas privadas distintas, ambas con la URL /dev del proyecto V3 de pruebas. Ingresar ambas como COCINA. No usar /exec real.
2. En un turno ABIERTO del día, crear una única vianda para un empleado FICTICIO desde el servicio correspondiente. Si ya cerró MAÑANA, usar NOCHE solo si está abierto.
3. En ambas sesiones Cocina, seleccionar el mismo turno, pulsar Actualizar y verificar el mismo pedido PENDIENTE.
4. Coordinar para pulsar Entregar la MISMA vianda casi al mismo tiempo en ambas sesiones.
5. Resultado esperado: UNA entrega exitosa. La otra debe indicar Estado incompatible o rechazo equivalente. No debe quedar una segunda fila de entrega.
6. Actualizar ambas páginas: ambas deben mostrar ENTREGADO. Revisar Pedidos_V3: un registro con estado ENTREGADO y fecha de entrega, sin duplicados. Revisar Auditoria_V3: un solo evento ENTREGAR para ese ID.
7. Repetir con dos sesiones del servicio que registran el mismo empleado al mismo tiempo. Se espera una fila nueva y una segunda solicitud omitida como duplicada. Verificar los duplicados y el conteo en la hoja.
8. Ejecutar en un turno abierto distinto la prueba de cierre únicamente después del respaldo; si un operador intenta entregar durante el cierre, debe rechazarse tras el bloqueo.

## Si aparece un resultado inesperado
NO editar ni borrar filas manualmente sin antes guardar copia. Capturar únicamente horario, texto de error y resumen estadístico, sin claves ni nombres del personal. Suspender los ensayos si se detectan dos entregas exitosas para un mismo pedido o si la auditoría es inconsistente.

## Límites pendientes
Esta prueba manual no simula decenas de usuarios. Google Apps Script usa LockService pero Sheets no ofrece transacciones ACID; hay que ensayar fallos de red y cuotas, latencia real con varios dispositivos y recuperación ante escrituras parciales. La autenticación por clave de servicio y las credenciales en el HTML original deben someterse a revisión de seguridad antes de producción.