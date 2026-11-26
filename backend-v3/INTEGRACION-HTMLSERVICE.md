# HISJB Cocina V3 — Primera prueba de interfaz real con clasp

> **Solo proyecto de Apps Script de PRUEBAS**, con Sheets ficticio, nunca producción. La rama main no se modifica.

## Qué cambia
- \`Code.gs\`: \`doGet\` entrega páginas HtmlService; \`v3UiCall\` es la única función pública de interacción con el navegador y valida sesión/rol en cada operación.
- \`PersonalV3.html\`: autenticación por servicio, nómina de su servicio, selección individual (WEB) o múltiple (SUPERVISOR), guardia de 24 h = almuerzo y cena.
- \`CocinaV3.html\`: autenticación Cocina/Nutrición, filtros, pendientes primero, entregados abajo, entrega y reversión COCINA/NUTRICION/ADMIN.
- Nutrición conserva menús y avisos; el cierre del turno está reservado a Cocina y ADMIN.
- \`doPost\` devuelve error: la UI usa \`google.script.run\`, no un POST JSON entre dominios. Si hay integraciones anteriores contra este proyecto de pruebas, dejarán de funcionar.
- Funciones administrativas renombradas a \`v3ProvisionarCuenta_\` y \`v3HojasIniciales_\`: ya **no** pueden invocarse desde el navegador. En el editor de Apps Script solo se pueden llamar mediante una función temporal auxiliar sin sufijo \`_\`, exclusivamente por el administrador.

## Sincronización desde Windows (PowerShell)
1. En **Google Apps Script de pruebas**, eliminar las funciones temporales que incluyan contraseñas. No ejecutar \`clasp pull\`; puede sobreescribir el código del repositorio.
2. Comprobar que la carpeta \`backend-v3\` sigue vinculada al **script de pruebas** y que su \`.clasp.json\` permanece fuera de Git.
3. En PowerShell:

\`\`\`powershell
cd "$HOME\Documents\HISJB-COCINA"
git branch --show-current
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp status
\`\`\`

Debe mostrar los archivos rastreados \`Code.gs\`, \`PruebasPermisos.gs\`, \`PersonalV3.html\`, \`CocinaV3.html\` y \`appsscript.json\`. Si faltan archivos o hay diferencias inesperadas, detenerse.

4. Recién cuando estén confirmados los archivos y el proyecto destino, ejecutar:

\`\`\`powershell
clasp push
\`\`\`

El código remoto de pruebas será reemplazado; datos, propiedades privadas y planilla **no** se reemplazan. No debería solicitar un nuevo \`scriptId\`.

## Abrir en navegador — SOLO administrador de pruebas

1. En PowerShell: \`clasp open-script\` (no \`clasp open\`).
2. En Google Apps Script seleccionar **Implementar → Probar implementaciones** (o **Deploy → Test deployments**) y elegir la URL de la aplicación web de desarrollo (\`/dev\`). Esta vista requiere permisos de editor del proyecto y ejecuta el código más reciente guardado.
3. Si todavía no ofrece una URL de aplicación web, se puede crear una nueva implementación **exclusivamente en el proyecto de pruebas**, tipo **Aplicación web**, \`Ejecutar como: Yo\`, \`Quién tiene acceso: Solo yo\`. Nunca usar \`Cualquier persona\` durante estas pruebas.
4. Página Personal: URL de pruebas sin parámetro (o \`?page=personal\`).
5. Página Cocina: la misma URL con \`?page=cocina\`. Usar ambas páginas abiertas desde la cuenta autorizada. El enlace interno de una página a otra puede depender de cómo Google redirige la URL de HtmlService; si falla, abrirlas directamente con esas direcciones.

**No pegar URL, contraseñas ni tokens en un repositorio público o en capturas.** Solo compartir mensajes de error sin secretos.

## Prueba breve con datos ficticios
- Entrar a Personal como ENFERMERIA/SUPERVISOR (clave privada configurada en ScriptProperties).
- Confirmar que se ven únicamente TEST003 y TEST004.
- Seleccionar ambos y guardia 24 h. Dado que ya existen registros de fecha actual en la planilla de pruebas, lo esperado es **0 creados / 4 repetidos**. No se deben añadir filas.
- Entrar a Cocina como COCINA, elegir MAÑANA, comprobar la lista real de prueba, entregar un pedido **ficticio** y revertir. Debe registrarse en Auditoria_V3.
- Si se dispone de una cuenta de Nutrición de prueba, confirmar que ve pedidos y botones de entrega, sin acceso al cierre del turno.
- Si aparece un error, detener antes de tocar producción y revisar que la propiedad \`HISJB_V3_TEST_SHEET_ID\` apunte a la **planilla ficticia**.

## Limitaciones pendientes
- El bloqueo de duplicados se verificó mediante pruebas secuenciales, **no** se ha demostrado aún concurrencia bajo carga.
- El backend utiliza contraseñas por servicio y sesiones de 180 min, sin rate-limiting; solo es apto para pruebas restringidas, no para publicar a todo el personal.
- Historial de pedidos: la vista muestra únicamente hoy. No hay edición del menú desde V3, alta manual, ni horarios de médicos.
- En GitHub Pages, los archivos \`versiones/v3/\` siguen siendo la **demo offline** separada. La UI operativa nueva está bajo \`backend-v3/\` y se ejecuta en Apps Script.
- El cambio de archivos **no publica** automáticamente una versión definitiva de la aplicación web; no modificar despliegues de producción.
