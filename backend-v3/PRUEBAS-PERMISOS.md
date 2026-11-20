# Prueba de permisos del backend V3 — Solo entorno ficticio

Esta prueba se suma a la validación de duplicados y a la prueba de entregar/revertir. **No modifica pedidos ni la planilla actual del hospital.**

## Requisitos
- Proyecto Apps Script V3 **de pruebas** con el último `Code.gs`.
- `Personal_V3` contiene `TEST001`, `TEST002` (TRAUMATOLOGIA) y `TEST003`, `TEST004` (ENFERMERIA).
- Las cuentas de prueba de TRAUMATOLOGIA (WEB), ENFERMERIA (SUPERVISOR) y COCINA (COCINA) fueron provisionadas.

## Cómo ejecutar
1. En Apps Script **privado** de pruebas, agregar las funciones del archivo [PruebasPermisos.gs](./PruebasPermisos.gs).
2. Agregar esta función temporal, reemplazando las tres claves por las que configuraste **solo en tu editor privado**:

```js
function ejecutarPruebasPermisos() {
  const enfermeria = v3Sesion_(v3Login_({
    servicio: 'ENFERMERIA',
    clave: 'CLAVE_DE_PRUEBA_ENFERMERIA'
  }).token);
  const trauma = v3Sesion_(v3Login_({
    servicio: 'TRAUMATOLOGIA',
    clave: 'CLAVE_DE_PRUEBA_TRAUMATOLOGIA'
  }).token);
  const cocina = v3Sesion_(v3Login_({
    servicio: 'COCINA',
    clave: 'CLAVE_DE_PRUEBA_COCINA'
  }).token);
  pruebasPermisosV3_(enfermeria, trauma, cocina);
}
```

3. Ejecutar `ejecutarPruebasPermisos` una sola vez.
4. Resultado esperado: **11/11 OK**. No debe añadirse ninguna fila a `Pedidos_V3`. Puede observarse también la pestaña `Auditoria_V3` para asegurarse de que no se registraron operaciones de entrega.
5. Eliminar la función temporal con contraseñas al terminar. No publicar contraseñas ni tokens en GitHub ni en el chat.

**Límite de la prueba:** verifica permisos de funciones internas, no autentica todavía solicitudes de navegadores. Antes de producción se requieren pruebas de autenticación remota, sesiones, revocación, permisos de menú y comunicación entre GitHub Pages y Apps Script.
