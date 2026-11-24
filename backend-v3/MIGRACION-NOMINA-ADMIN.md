# HISJB Cocina V3 — Migración privada y cuenta ADMIN

SOLO rama de desarrollo. La versión estable no se modifica. NO trasladar trabajadores reales a la planilla ficticia V3.

## Revisión de la nómina original
El extractor de personal.html identifica 636 registros: 584 importables, 51 repeticiones por nombre y servicio, y 1 con dieta desconocida DIETA (revisar). Se preparan 4 lotes de hasta 150 trabajadores, provenientes de 31 servicios. Son datos por verificar antes de una migración real.

## Paso 1: actualizar la V3 de pruebas
En PowerShell:
    cd "C:\HISJB\HISJB-COCINA"
    git pull origin desarrollo-selector-v3-2026-11-20
    cd .\backend-v3
    clasp.cmd status
Verificar el vínculo con el proyecto V3 de pruebas y conservar el appsscript.json original. Después ejecutar: clasp.cmd push.

## Paso 2: crear cuenta ADMIN de pruebas
En el editor de Apps Script V3 → Configuración del proyecto → Propiedades de la secuencia de comandos, crear HISJB_V3_ADMIN_BOOTSTRAP con una contraseña PRIVADA NUEVA de 16+ caracteres. No compartirla por chat ni guardarla en GitHub. Ejecutar v3ConfigurarAdminSeguro_ de AdminBootstrap.gs. Resultado esperado: Cuenta creada para ADMIN (ADMIN). La función borra la propiedad temporal y guarda el hash/salt en las propiedades privadas. Si ya existe ADMIN, actualiza su clave. Entrar a /dev con esa clave.

## Paso 3: preparar lotes LOCALES
En PowerShell desde la raíz del repositorio:
    cd "C:\HISJB\HISJB-COCINA"
    node .\tools\migrar-personal-v3.js "C:\HISJB\V3-MIGRACION-PRIVADA"
Se generan fuera del repositorio RESUMEN.json, LOTE-01.txt (y siguientes), REVISAR-MANUALMENTE.csv, DUPLICADOS-ORIGEN.csv y SERVICIOS-PARA-REVISAR.csv (con rol sugerido pero SIN contraseñas). El extractor NO ejecuta el JavaScript de personal.html y NO copia DNI ni contraseñas. Los archivos resultantes SÍ contienen nombres del personal y requieren custodia restringida; no subir a GitHub, no pegarlos en el chat y eliminarlos según políticas del hospital.

## Paso 4: usar el importador
En la sesión ADMIN de la interfaz V3 aparece Incorporación masiva de personal. Permite seleccionar un archivo LOTE-XX.txt desde la PC, ejecutar Revisar antes de incorporar y, solo tras validar los totales, Confirmar incorporación masiva. La operación genera IDs internos, omite repeticiones y registra auditoría. No actualiza dieta ni estado activo de personas existentes. Importa Personal_V3 pero NO crea pedidos ni contraseñas por servicio.
PROHIBIDO importar nómina REAL en el proyecto V3 de PRUEBAS. Para ensayar, crear TXT con 3 personas ficticias.

## Configuración de servicios
SERVICIOS-PARA-REVISAR.csv extrae nombres y roles sugeridos del archivo original sin copiar valores de contraseñas. Cada servicio requerirá credencial NUEVA Y ÚNICA y revisión de rol antes de migrar; las claves del HTML original están expuestas en código fuente, por lo que se deben rotar y retirar de los archivos publicados e historial según las políticas vigentes.

## Pruebas y bloqueantes
Ejecutar pruebasImportacionNominaSoloLecturaV3 (esperado 9/9), pruebasHistorialSoloLecturaV3 (6/6), pruebasCocinaSoloLecturaV3 (9/9). Validar login ADMIN y una vista previa de lote ficticio. Hacer copia de la planilla ficticia antes del ensayo de cierre. Aún faltan recuperación transaccional del cierre, pruebas de concurrencia, homónimos, respaldo, permisos y aceptación institucional. No modificar main, producción ni desplegar /exec sin aprobación.
