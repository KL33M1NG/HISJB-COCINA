# HISJB Cocina V3 — Entrega rápida en fila

Actualización de la pantalla de pruebas diseñada para filas con muchas viandas.

## Flujo principal
1. Elegir **almuerzo** o **cena**.
2. **Filtrar por servicio** (p. ej. Enfermería). Opcionalmente buscar un nombre.
3. Para una sola vianda, presionar el botón verde **✓ Entregar** de la fila: **sin escribir ID ni confirmar con una ventana**. Esperar el resultado de la operación; la fila cambiará a `ENTREGADO`, bajará en la lista, y se podrá **Revertir** si fue un error.
4. Para varias viandas, marcar casillas o presionar **☑️ Seleccionar todos los pendientes del filtro**. Esto toma solo los pendientes del servicio y búsqueda mostrados; no incluye entregados, no entregados ni duplicados históricos.
5. Pulsar **✅ Entregar seleccionados (N)**. El sistema pide **una sola confirmación para el grupo**, no una por persona. La operación de servidor valida las selecciones bajo un bloqueo antes de escribir.
6. La validación por ID se conserva bajo **Opción adicional: validar por ID**, cerrada por defecto.

## Controles y límites
- Las acciones de entrega se muestran con cuenta `COCINA`, `NUTRICION` o `ADMIN`. El cierre de turno permanece reservado a Cocina y ADMIN.
- El servidor rechaza un ID repetido, un pedido ya entregado, un duplicado histórico o un turno cerrado.
- Máximo de **150 viandas por solicitud de lote**, por ahora. Si se necesita más, dividir por servicio o grupos.
- Un clic individual solo envía una acción al servidor, sin recargar automáticamente todo el listado. Se actualizan los indicadores de fondo. Para ver nuevos pedidos cargados desde otras terminales usar **Actualizar pedidos**.
- La reversión cambia una sola vianda y sigue quedando registrada en auditoría.
- No hay operación real en producción ni cambio a `main`.

## Actualización de la copia de prueba (Windows)
```powershell
cd "$HOME\Documents\HISJB-COCINA"
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp status
clasp push
```
Abrir la URL de desarrollo `/dev` y refrescar con Ctrl+F5.

## Prueba recomendada
- Entrar con la cuenta ficticia de Cocina y elegir el turno abierto.
- Filtrar por un servicio con pedidos pendientes y comprobar que **Seleccionar todos** marca solo esos pendientes.
- Desmarcar una persona ausente. La cuenta del botón debe decrementar.
- Entregar a las personas seleccionadas en una acción.
- Comprobar que las filas entregadas bajaron y se pueden revertir.
- Entregar una vianda individual con **✓ Entregar**, sin ventana de confirmación ni ID.
- Comprobar que el panel de Nutrición muestra los mismos controles de entrega y reversión, pero no puede cerrar el turno.
- No ejecutar **Cerrar turno** en la primera prueba de este flujo.

**La versión estable del hospital sigue sin alteraciones.**
