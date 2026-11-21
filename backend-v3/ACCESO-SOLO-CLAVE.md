# V3 — Acceso por contraseña de servicio (sin usuario)

## Cambio solicitado
El personal no escribe ni elige un servicio. Ingresa **solo una contraseña** y el servidor identifica automáticamente el servicio y el rol:
- **WEB:** solo ve su servicio y registra un trabajador por vez.
- **SUPERVISOR:** ve la nómina de su servicio y puede seleccionar todos, quitar ausentes o seleccionar personas individualmente.
- **COCINA:** abre el panel de entregas.
- **NUTRICION:** abre el panel de gestión en modo consulta.
- **ADMIN:** abre por defecto el panel de gestión (administración ampliada pendiente).

El archivo \`AccesoV3.html\` contiene la pantalla principal única. Se conserva \`PersonalV3.html\` y \`CocinaV3.html\` en el repositorio como referencias de la primera integración, pero \`doGet\` dirige ambos enlaces a \`AccesoV3\` y no exige un segundo ingreso. Esto es intencional.

## Seguridad de claves
El login del servidor recorre las cuentas de ScriptProperties y compara el verificador de cada una. Si no existe **exactamente una** coincidencia, deniega el ingreso. \`v3ProvisionarCuenta_\` también bloquea reutilizar una contraseña entre dos servicios nuevos. Las cuentas existentes no deben compartir contraseñas.

El acceso continúa siendo **experimental**, no apto para despliegue abierto: el modelo de contraseña compartida por servicio no identifica personas individualmente ni brinda trazabilidad de quién realizó cada acción. Faltan protección antiintentos reiterados, rotación de claves, auditoría individual, validaciones de acceso remoto y revisión para uso real.

## Sincronización Windows
1. Eliminar cualquier función temporal que contenga contraseñas del Apps Script remoto.
2. Dentro de PowerShell:

\`\`\`powershell
cd "$HOME\Documents\HISJB-COCINA"
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp status
\`\`\`

3. Asegurarse de ver los **seis** archivos principales: \`Code.gs\`, \`PruebasPermisos.gs\`, \`PersonalV3.html\`, \`CocinaV3.html\`, \`AccesoV3.html\`, \`appsscript.json\`.
4. Verificar que se sigue apuntando al proyecto de pruebas, después \`clasp push\`.
5. Abrir el Apps Script de pruebas con \`clasp open-script\`; usar **Implementar → Probar implementaciones** y la URL **/dev**. La pantalla debe pedir *solo contraseña*.
6. Probar con clave ficticia de ENFERMERIA: debe mostrar su nómina y botones de selección masiva. Con clave ficticia TRAUMATOLOGIA debe mostrar un trabajador a la vez; con COCINA debe abrir el panel de pedidos.

## Prueba automatizada opcional sin escritura
En el editor **privado** de Apps Script, ejecutar desde una función temporal que llama a \`pruebasClaveUnicaV3_(claveEnfermeria,claveTrauma,claveCocina)\` sin subir las claves a GitHub. Resultado esperado: \`4/4\`. Eliminar inmediatamente esa función temporal.

**No** actualizar la URL estable ni la rama \`main\`. Los datos de \`Pedidos_V3\` son ficticios y ya incluyen duplicados históricos de las pruebas anteriores.
