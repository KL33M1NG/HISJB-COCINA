# HISJB – Cocina V3: entregas por ID, lote y cierre de turno

> Solo **App Script y Google Sheets V3 ficticios**. No cambiar producción ni fusionar esta rama con \`main\`.

## Cambios preparados
- Filtros por comida (MAÑANA/NOCHE), estado, servicio y búsqueda de nombre/servicio/ID exacto.
- Botón «Validar por ID». Solo para un pedido pendiente del turno seleccionado.
- Casillas para seleccionar múltiples pendientes; seleccionar todos los visibles, limpiar selección y entregar seleccionados. Servidor valida cada ID **antes** de modificar cualquier fila bajo \`LockService\`; impide repeticiones y entregas de duplicados históricos.
- Indicadores previos de total diario, almuerzo/cena, dietas, entregados y pendientes continúan disponibles.
- Panel de cierre con **vista previa** por dieta y servicio y confirmación doble. Requiere escribir exactamente \`CERRAR MAÑANA\` o \`CERRAR NOCHE\`.
- Al cerrar: marca \`PENDIENTE\` → \`NO_ENTREGADO\` para la fecha y comida seleccionadas, registra estadísticas **deduplicadas** por servicio y dieta en \`Cierres_V3\`, y agrega una entrada \`CERRAR_TURNO\` en \`Auditoria_V3\`.
- El cierre bloquea **en servidor** toda nueva inscripción, entrega y reversión de la comida cerrada, incluso si se intenta saltar la interfaz. Una guardia de 24 horas necesita ambos turnos abiertos.
- Nutrición conserva capacidad de cambiar menús/avisos en cualquier momento (también después del cierre); esto no reabre pedidos.

## IMPORTANTE
El cierre es irreversible desde el panel. **No probarlo sobre datos que se necesiten conservar.** La planilla V3 tiene duplicados históricos de pruebas anteriores; deben comprobarse las estadísticas y conservar una copia antes de cerrar.

Para un turno ya cerrado, no se permite registrarse de nuevo aunque cambien los menús. Si hay una emergencia que requiere reabrir un turno, no hay función de reapertura implementada: requerirá procedimiento administrativo auditado y probado.

La instantánea registrada incluye fecha, turno, fecha-hora, totales, entregados, no entregados, cantidad de duplicados, JSON de dietas y servicios y sector responsable. No se eliminan filas de pedidos.

## Actualizar desde Windows (clasp)
\`\`\`powershell
cd "$HOME\Documents\HISJB-COCINA"
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp status
clasp push
\`\`\`

\`clasp status\` debe listar **CocinaOperaciones.gs** y **PruebasCocinaV3.gs**, además de \`Code.gs\`, \`AccesoV3.html\` y el resto de archivos habituales. Revisar que el \`.clasp.json\` apunte solo a V3 de pruebas.

## Pruebas en orden
1. En Apps Script de pruebas, ejecutar \`pruebasCocinaSoloLecturaV3()\`. **Resultado esperado: 9/9**. No modifica pedidos ni los cierra.
2. Abrir \`/dev\` y entrar con la cuenta de **COCINA** ficticia.
3. Seleccionar almuerzo, filtrar por servicio y buscar una persona ficticia por nombre o ID.
4. Validar una vianda ficticia con el ID exacto. Luego comprobar que ya no aparece pendiente y que los indicadores cambian.
5. Si hay dos pendientes ficticios únicos, marcarlos con casillas y entregarlos juntos; verificar que se rechaza un grupo si contiene un ID incompatible.
6. Seleccionar el turno de prueba elegido y pulsar **Actualizar vista previa**. Comprobar el total de pedidos únicos, entregados, pendientes y duplicados y el desglose por servicio y dieta.
7. **Antes de ejecutar el cierre**, hacer una copia de la planilla ficticia. Luego, solo si se acepta perder la posibilidad de operar ese turno de pruebas, pulsar \`Cerrar turno seleccionado\`, escribir el texto exacto de confirmación y confirmar la segunda advertencia.
8. Confirmar hoja \`Cierres_V3\`: una fila para ese turno y fecha. \`Pedidos_V3\` debe conservar sus filas y tener \`NO_ENTREGADO\` donde correspondía. \`Auditoria_V3\` registra \`CERRAR_TURNO\`.
9. Comprobar que una inscripción de ese turno o una entrega posterior sean rechazadas por el servidor.
10. Revisar que **la otra comida sigue abierta** y que Nutrición aún pueda editar el menú del día.

## Pendiente antes de producción
- Pruebas reales de concurrencia y recuperación ante errores parciales de Apps Script/Sheets.
- Procedimiento auditado para reapertura excepcional y gestión de fallos durante el cierre.
- Seguridad y trazabilidad: contraseña compartida por servicio no identifica qué persona hizo la entrega.
- Separación de estadísticas cerradas de totales actuales, exportación y controles de horarios.
- No publicar esta versión para personal real hasta validación completa.
