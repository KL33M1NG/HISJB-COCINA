# Verificación sin escritura: corrección de MAÑANA

## Hallazgo 20/11/2026

El diagnóstico del usuario identificó que las fechas en las filas 2–11 se normalizan correctamente a `2026-11-20`. La primera corrección produjo `2 creados / 2 duplicados` debido al turno:

- `v3Norm_('MAÑANA')` devuelve `MANANA` (elimina marcas diacríticas).
- El conjunto de pedidos existentes guardaba la clave `TEST003|MANANA`.
- La verificación de nuevos pedidos consultaba `TEST003|MAÑANA`.
- `NOCHE` no presenta diferencias y se reconocía como duplicada.

Se corrigió **ambas rutas**: clave al registrar e igualdad del filtro en `v3Listado_`.

## Verificación de solo lectura, sin registrar más pedidos

Después de reemplazar el código de Apps Script de **pruebas** con la revisión actual de `Code.gs`, ejecutar esta función temporal desde el editor:

```js
function diagnosticarClavesTurnoV3() {
  const ss = v3Planilla_();
  const rows = v3Rows_(ss.getSheetByName(V3.pedidos));
  const hoy = v3Hoy_(ss);
  const existentes = new Set();

  rows.forEach(function(r) {
    const fecha = v3FechaClave_(r[1], ss.getSpreadsheetTimeZone());
    if (fecha === hoy && v3Norm_(r[8]) !== 'ANULADO') {
      existentes.add(String(r[3]).trim() + '|' + v3Norm_(r[2]));
    }
  });

  ['TEST003', 'TEST004'].forEach(function(id) {
    ['MAÑANA', 'NOCHE'].forEach(function(turno) {
      const clave = id + '|' + v3Norm_(turno);
      Logger.log(clave + ': ' + (existentes.has(clave) ? 'DUPLICADO' : 'AUSENTE'));
    });
  });
}
```

### Resultado esperado (con las 10 filas compartidas)

```
TEST003|MANANA: DUPLICADO
TEST003|NOCHE: DUPLICADO
TEST004|MANANA: DUPLICADO
TEST004|NOCHE: DUPLICADO
```

Esta prueba no ejecuta `v3Registrar_`, no agrega ni borra filas. Si falla alguna clave, enviar los mensajes de log sin contraseñas ni tokens.

**Atención**: las filas históricas repetidas seguirán existiendo. Cuando validemos, planificaremos una limpieza controlada en la planilla de prueba, sin tocar producción.
