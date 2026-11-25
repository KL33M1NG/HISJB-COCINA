# Preparación privada de Cocina V3 — producción futura

No es un pase a producción. El sistema estable, GitHub Pages y el workflow de pruebas no cambian. El preparador genera código fuera del repositorio, sin nómina, pedidos, contraseñas ni propiedades privadas. El manifiesto permanece `MYSELF` (sólo el propietario autorizado).

## 1. Preparar el paquete en Windows

Desde la carpeta local del repositorio, actualizar la rama de desarrollo con `git pull --ff-only origin desarrollo-selector-v3-2026-11-20`. En el editor del **nuevo** Apps Script productivo, verificar el título y copiar su ID de secuencia de comandos (Configuración del proyecto). No usar el ID de pruebas ni el del sistema anterior.

En PowerShell:

```powershell
$idProduccion = Read-Host 'ID del NUEVO Apps Script V3 de producción'
node .\tools\preparar-produccion-v3.js "$env:USERPROFILE\Documents\HISJB-V3-PRODUCCION-PRIVADA" $idProduccion
```

El ID se conserva sólo en la configuración local generada. El preparador rechaza el proyecto de pruebas conocido y carpetas dentro del repositorio o existentes. No realiza conexiones con Google.

## 2. Instalación privada en el proyecto nuevo

Confirmar en el editor Google que el proyecto es nuevo y vacío, sin funciones ni despliegues públicos, y que la cuenta utilizada es la propietaria/autorizada. En la carpeta generada, comprobar `clasp.cmd status`; verificar con `.clasp.json` local y el editor que el ID coincide exactamente. Sólo entonces instalar el código con `clasp.cmd push` (sin `--force`; detener si pide reemplazar un proyecto existente). Nunca ejecutar este comando desde `backend-v3` ni vincular la carpeta al proyecto estable.

## 3. Inicialización privada

Crear las propiedades de secuencia de comandos **del proyecto nuevo**, sin copiar propiedades de pruebas:

| Propiedad | Valor privado |
|---|---|
| `HISJB_V3_PROD_SHEET_ID` | ID del Google Sheets nuevo, vacío y privado |
| `HISJB_V3_PROD_BACKUP_FOLDER_ID` | ID de la carpeta de respaldo nueva y privada |
| `HISJB_V3_PROD_ADMIN_BOOTSTRAP` | Contraseña ADMIN nueva, de 16 a 128 caracteres |
| `HISJB_V3_PROD_INIT` | `PREPARAR` |

La hoja y carpeta deben llamarse exactamente `HISJB Cocina V3 - PRODUCCIÓN` y `HISJB Cocina V3 - RESPALDOS PRODUCCIÓN`. Ejecutar `v3InicializarProduccion` desde el editor **privado**. Debe crear las seis hojas con sus encabezados y la cuenta ADMIN nueva. No importa registros. Consume la autorización temporal y borra la clave de inicialización; si falla luego de crear algún encabezado, detenerse y revisar la estructura, no borrar ni reinicializar automáticamente. No compartir los valores de las propiedades.

## 4. Pendiente antes de abrir a usuarios

Confirmar resultado de inicialización, luego probar acceso privado, importar sólo nómina institucional autorizada, revisar roles, generar claves nuevas y configurar/verificar respaldos. Preparar recuperación de propiedades y cuentas independiente de la planilla. Retirar el archivo de instalación temporal antes de una posible publicación, realizar revisión de seguridad del acceso anónimo y decidir el entorno definitivo. No copiar pedidos, cierres, secretos ni bloqueos de pruebas. Resolver la exposición heredada de datos/credenciales y acordar contingencia. No publicar `/exec` ni activar la página de mudanza sin autorización independiente.
