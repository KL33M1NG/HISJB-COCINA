# Vincular HISJB Cocina V3 a Google Apps Script con clasp (Windows)

**Únicamente Apps Script / Google Sheets de PRUEBAS. No conectar producción.**

Clasp sincroniza el código, **no** las hojas ni sus datos. El archivo de configuración `.clasp.json` y las credenciales de Google jamás deben subirse a GitHub.

## 1. Instalar herramientas

- [Node.js LTS](https://nodejs.org/) (v20 o posterior).
- [Git para Windows](https://git-scm.com/downloads/win).
- Abrir PowerShell y ejecutar:

```powershell
node --version
npm --version
git --version
npm install -g @google/clasp
clasp --version
```

## 2. Autorizar el acceso

1. Desde la **cuenta de Google que administra el proyecto de pruebas**, activar Google Apps Script API en [Configuración de Apps Script](https://script.google.com/home/usersettings).
2. En PowerShell:

```powershell
clasp login
```

Autorizar en el navegador. No copiar tokens ni `.clasprc.json` al repositorio o al chat.

## 3. Descargar la rama de desarrollo

En PowerShell:

```powershell
cd "$HOME\Documents"
git clone --branch desarrollo-selector-v3-2026-11-20 https://github.com/KL33M1NG/HISJB-COCINA.git
cd HISJB-COCINA
git branch --show-current
```

Debe indicar `desarrollo-selector-v3-2026-11-20`. Si ya tenés el repositorio clonado, usar `git fetch` y cambiar a esa rama en vez de intentar clonarlo nuevamente.

## 4. Hacer un respaldo del proyecto remoto *antes* de sincronizar

- Abrir el **Apps Script de pruebas** en Google y copiar el *ID de secuencia de comandos* desde Configuración del proyecto → IDs. **No confundirlo con el ID de la planilla**.
- Desde la raíz del repositorio (donde están las carpetas `backend-v3` y `versiones`):

```powershell
New-Item -ItemType Directory -Path "$HOME\Documents\HISJB-V3-respaldo-script" -Force
cd "$HOME\Documents\HISJB-V3-respaldo-script"
clasp clone TU_ID_DEL_SCRIPT_DE_PRUEBAS
```

Esto descarga el proyecto actual a una **carpeta separada**, con sus funciones temporales y el manifiesto. Si el editor contiene funciones que necesitan conservarse, respaldarlas aquí antes de subir cualquier cosa. **No usar `clasp push` todavía**.

## 5. Crear vínculo LOCAL con el proyecto de pruebas

```powershell
cd "$HOME\Documents\HISJB-COCINA\backend-v3"
```

Crear `backend-v3/.clasp.json` localmente con este formato; sustituir el ID por el del **proyecto de pruebas**:

```json
{
  "scriptId": "TU_ID_DEL_SCRIPT_DE_PRUEBAS"
}
```

Para mantener el manifiesto existente sin alterar configuración de zona horaria/permisos, copiar el archivo descargado del respaldo:

```powershell
Copy-Item "$HOME\Documents\HISJB-V3-respaldo-script\appsscript.json" ".\appsscript.json"
```

Si falta el manifiesto, detener y revisar por qué no se descargó; **no inventar permisos ni reemplazar configuraciones**.

## 6. Revisar y sincronizar (solo después de comprobar el ID)

```powershell
clasp status
git status --short
```

En `clasp status` comprobar que los archivos a enviar sean los de `backend-v3`, nunca las páginas del sistema real. `git status` debe mostrar `appsscript.json` si todavía no está versionado; **no agregar ni commitear `.clasp.json` ni credenciales**.

**Precaución:** `clasp push` reemplaza el conjunto de archivos del proyecto remoto. Es recomendable copiar antes las funciones temporales que quieras conservar al archivo local y revisar todo el contenido de la carpeta. Si el proyecto remoto tiene archivos adicionales, no hacer push hasta reconciliarlos con la carpeta local.

Recién cuando se confirme que el proyecto destino y los archivos son correctos:

```powershell
clasp push
```

Si `clasp push` pregunta por sobrescribir el manifiesto, detenerse y revisar.

## 7. Trabajo cotidiano

- Yo edito los archivos de `backend-v3` en la rama de desarrollo de GitHub.
- Vos obtenés los cambios con `git pull` desde esa rama.
- Revisás el diff y hacés `clasp status`; cuando lo apruebes, `clasp push` actualiza **solo el Apps Script de pruebas**.
- Para inspeccionar cambios hechos desde Google Apps Script, primero usar respaldo o rama local dedicada antes de ejecutar `clasp pull`, porque puede sobrescribir archivos locales.
- Las propiedades privadas (como `HISJB_V3_TEST_SHEET_ID`) y los datos de Sheets no se sincronizan con GitHub ni se almacenan en el código.

**Comandos de comprobación**: `clasp --version`, `git branch --show-current`, `clasp status`. Nunca compartir capturas ni logs que incluyan tokens o credenciales.

Documentación: https://developers.google.com/apps-script/guides/clasp
