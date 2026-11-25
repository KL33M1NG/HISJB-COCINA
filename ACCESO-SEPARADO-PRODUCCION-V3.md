# Preparación: ADMIN privado y acceso de servicios

Dos paquetes **versionados del mismo Apps Script productivo**, para conservar el bloqueo compartido (`LockService`), la misma planilla y las propiedades de cuentas. No se crea otro proyecto ni se copia información. ADMIN sólo admite rol ADMIN; OPERATIVO sólo admite WEB, SUPERVISOR, COCINA y NUTRICION. El servidor valida el canal de cada sesión, no sólo la visibilidad de los botones. Ambos paquetes iniciales conservan MYSELF. Se excluyen la inicialización, las funciones de pruebas y los auxiliares temporales.

## Preparación local
Desde el repositorio actualizado en Windows:

```powershell
cd "$env:USERPROFILE\Documents\HISJB-COCINA"
git pull --ff-only origin desarrollo-selector-v3-2026-11-20
node .\tools\preparar-acceso-separado-v3.js "$env:USERPROFILE\Documents\HISJB-V3-PRODUCCION-PRIVADA" "$env:USERPROFILE\Documents\HISJB-V3-CANALES-PRIVADOS"
```

El preparador no toca la carpeta anterior ni conecta con Google. El identificador productivo permanece en las carpetas privadas. No subirlas a GitHub.

## Instalación por etapas (cada vez verificar el proyecto nuevo)
1. Entrar a `HISJB-V3-CANALES-PRIVADOS\ADMIN`, comprobar `clasp.cmd status`, ID y manifiesto MYSELF; instalar código sólo en el proyecto productivo nuevo. La instalación excluye `InstalacionProduccion.gs` y no cambia las propiedades ni las hojas. Revisar que el activador diario conserve su función privada.
2. Probar ADMIN en `/dev` y crear una **implementación versionada privada** de administración, accesible sólo por el propietario; conservar su URL `/exec` privada. Verificar acceso correcto y rechazo de perfiles operativos. No compartir el enlace público ni publicar una contraseña.
3. Sólo después de verificar esa implementación privada, preparar la versión OPERATIVO manteniendo MYSELF para un piloto privado. Probar los cuatro roles permitidos y rechazo de ADMIN, incluso con una sesión creada en el otro canal. No sustituir el despliegue versionado privado ADMIN. HEAD y `/dev` pasan a mostrar exclusivamente el canal recién sincronizado.
4. Revisar seguridad del acceso sin Google, privacidad de datos, límites de solicitudes, capacidad, recuperación y la exposición heredada del repositorio. Con autorización separada, crear una nueva implementación versionada operativa con la configuración aprobada. Nunca ampliar el acceso de la implementación ADMIN. No activar la redirección de GitHub aún.

La aplicación actual del hospital permanece intacta hasta que se apruebe el corte. Las URLs `/exec` versionadas no se actualizan sólo por cambiar HEAD; revisar las versiones y rutas cuidadosamente en cada actualización futura.
