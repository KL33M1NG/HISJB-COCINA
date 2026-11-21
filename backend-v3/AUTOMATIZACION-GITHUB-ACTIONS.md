# HISJB Cocina V3 — Sincronización protegida con GitHub Actions

## Lo que ya se instaló
Workflow: `.github/workflows/hisjb-v3-pruebas.yml`.
- En cada cambio de `backend-v3/**` en la rama `desarrollo-selector-v3-2026-11-20`, se ejecuta primero `node tools/verificar-v3-ci.js` (revisión estática, **sin credenciales**).
- El trabajo `sincronizar_pruebas` se ejecuta SOLO si creás una variable GitHub con nombre `V3_TEST_DEPLOY_ENABLED` y valor exacto `true`.
- El destino está **fijado** en el código del workflow al Apps Script V3 de pruebas: `1EdznVOmQEuvmDQPbPqgmeLZoWAZ-g7pyXKiIjXjTLSRvla6eifgesn13`. No hay destino de producción.
- El manifest de pruebas se genera con `webapp.access=MYSELF` y `executeAs=USER_DEPLOYING`; evita omitir `appsscript.json` sin colocar el archivo local en Git.
- Se ejecuta `clasp push --force` a **código HEAD del proyecto de pruebas**, no `clasp deploy` ni `redeploy`. La app de pruebas `/dev` refleja el código nuevo. Una URL `/exec` con versión implementada NO se actualiza por ese push.

## Activación segura desde la web GitHub

**Importante: todavía NO está activado el despliegue.** No publicar las credenciales ni enviarlas al chat.

1. En GitHub, abrir repositorio `KL33M1NG/HISJB-COCINA` → **Settings → Environments**.
2. Crear el entorno exactamente `v3-pruebas`.
3. En ese entorno activar **Required reviewers** (si tu plan y el repositorio lo permiten) y elegirse como revisor. Además, restringir las ramas de despliegue a `desarrollo-selector-v3-2026-11-20`. Si GitHub no ofrece aprobaciones por entorno, dejar deshabilitado el despliegue automático hasta acordar otro mecanismo de aprobación.
4. Usar preferentemente una cuenta Google dedicada a la automatización, con **Editor SOLO en el Apps Script V3 de pruebas**, sin acceso a Apps Script productivo ni a planillas reales. Esa cuenta debe tener habilitada la API de Apps Script. **No reutilizar un token OAuth de una cuenta personal con acceso a producción**: el token de clasp tiene permisos amplios sobre los proyectos disponibles a esa cuenta.
5. Iniciar `clasp.cmd login` **con esa cuenta limitada** en una sesión separada y privada. Google creará `.clasprc.json` dentro del perfil de Windows. Este archivo contiene un token reutilizable.
6. En **Settings → Environments → v3-pruebas → Environment secrets**, agregar el secreto llamado exactamente `V3_TEST_CLASPRC_JSON` con el **contenido completo** de `.clasprc.json`. Copiarlo directamente desde tu PC al campo cifrado de GitHub, sin pegarlo en chat, issues, commits, capturas, ni archivos del repositorio.
7. En **Settings → Secrets and variables → Actions → Variables** crear `V3_TEST_DEPLOY_ENABLED` con valor `true` **solo cuando el entorno esté protegido y se haya guardado el secreto**.
8. Para arrancar la primera sincronización, realizar un nuevo cambio en `backend-v3/**` dentro de la rama de desarrollo, o usar el botón **Run workflow** si GitHub muestra ese flujo (la interfaz puede requerir que el archivo exista en la rama predeterminada para `workflow_dispatch`; la opción por `push` a la rama de desarrollo funciona sin modificar `main`). Revisar **Actions → HISJB V3 - pruebas** y aprobar el entorno.
9. Revisar el job de sincronización; debería decir que se empujó el código a V3 de pruebas. Refrescar `/dev`, probar Inicio, Personal, Cocina, Nutrición y ADMIN.

**Si por seguridad no querés guardar un token OAuth de `clasp` en GitHub**, no activés la variable. La revisión estática seguirá funcionando y el despliegue manual desde PC permanecerá disponible.

## Desactivación inmediata
- Cambiar `V3_TEST_DEPLOY_ENABLED` a `false` o eliminarla.
- Quitar el secreto del entorno `v3-pruebas` y/o revocar el token de la cuenta Google dedicada cuando deje de ser necesario.

## Limitaciones y seguridad
- Los workflows ejecutan código del repositorio. Restringí quién puede escribir en la rama y revisar cambios en `.github/workflows/**`.
- Un token `.clasprc.json` no es exclusivo del proyecto: usar cuenta Google con acceso solamente al proyecto de pruebas.
- Crear una copia del Apps Script original y de la planilla V3 de pruebas antes de activar. Las propiedades privadas de script no están en Git.
- El manifiesto de Apps Script se mantiene bajo configuración fija en el workflow para la versión de prueba.
- La etapa de verificación comprueba sintaxis JavaScript y elementos HTML. No ejecuta pruebas contra Sheets ni garantiza ausencia de errores operativos.
- El job usa `--force`: se sobreescribe el código del Apps Script de pruebas con lo presente en la rama. No hacer ediciones manuales en el editor sin reflejarlas antes en GitHub.
- Este flujo **NO es un pase a producción**, ni migra nóminas o contraseñas ni modifica el GitHub Pages original.

Documentación de Google: https://developers.google.com/apps-script/guides/clasp?hl=es-419
