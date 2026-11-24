# Prueba del arreglo de duplicados — 20/11/2026

**Síntoma detectado:** al registrar TEST003 y TEST004 en guardias de 24 h dos veces, se crearon ocho filas: cuatro por ejecución (dos por persona). Deberían haberse creado solo cuatro en total.

**Causa:** una celda con fecha `2026-11-20` puede volver desde `getValues()` como `Date`, pero el backend comparaba `String(r[1]) === '2026-11-20'`. Esa comparación da falso. Se agregó `v3FechaClave_(valor, zonaHoraria)` y se usa en `v3Registrar_` y `v3Listado_`.

## Cómo aplicar el arreglo al Apps Script de prueba
1. Abrir el archivo actualizado `backend-v3/Code.gs` en esta rama.
2. Reemplazar **todo** el contenido de `Code.gs` en el proyecto de Apps Script de pruebas; no tocar el proyecto de producción.
3. Guardar. No es necesario crear hojas nuevas ni volver a provisionar cuentas.
4. Si todavía existen en `Pedidos_V3` las ocho filas de ejemplo del 20/11/2026, **no borrarlas aún**. Ejecutar la función de prueba abajo una vez. Esperado: `creados: 0`, `duplicados: 4` y total de filas sin cambios.
5. Confirmar además la separación por servicio con otro procedimiento de prueba.

### Función temporal en editor privado
```js
function probarCorreccionDuplicados() {
  var login = v3Login_({
    servicio: 'ENFERMERIA',
    clave: 'PruebaEnfermeria2026!'
  });
  var sesion = v3Sesion_(login.token);
  var resultado = v3Registrar_(sesion, {
    ids: ['TEST003', 'TEST004'],
    guardia: '24',
    turno: 'MAÑANA'
  });
  Logger.log(JSON.stringify({
    estado: resultado.status,
    nuevos: resultado.creados,
    duplicados: resultado.duplicados.length
  }));
}
```

No publicar contraseñas reales ni este bloque de prueba en el repositorio operativo. Eliminar la función temporal después. Si el resultado no coincide, **detener las pruebas de registro** y compartir logs sin contraseñas ni tokens.

### Limpiar filas de prueba
Cuando se verifique el arreglo, se puede vaciar el contenido de `Pedidos_V3` **solo en la planilla separada de pruebas**, dejando la fila de encabezados. No hacerlo en la planilla real, ni borrarlas antes de diagnosticar el fallo.

### Regresión futura
- Registrar dos trabajadores en guardia de 24 h: se crean cuatro filas.
- Repetir: cero nuevas, cuatro duplicadas.
- Cambiar un pedido a ENTREGADO y repetir: sigue bloqueado.
- Hacer solicitudes simultáneas y comprobar que no hay duplicados (LockService).
- Otra fecha no debe bloquear pedidos nuevos.
