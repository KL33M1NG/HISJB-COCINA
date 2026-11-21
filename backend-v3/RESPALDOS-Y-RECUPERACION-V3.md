# HISJB Cocina V3 — Respaldos, comprobación y recuperación

**Solo entorno V3 de pruebas.** El código de GitHub no contiene datos de trabajadores ni secretos de Google.

## Alcance
- ADMIN puede consultar el inventario de la planilla V3 y las 12 copias privadas más recientes en una carpeta de Google Drive, sin mostrar nóminas.
- ADMIN puede crear una copia de la hoja de cálculo con nombre `HISJB-V3-PRUEBAS-AAAAMMDD-HHMMSS`. El backend revisa encabezados y número de filas del original y de la copia. Un fallo de verificación exige revisión manual; no borra copias automáticamente.
- Opcionalmente se puede instalar **un disparador diario aproximado a las 02:00** (zona horaria del proyecto); no se instala solo al desplegar el código.
- Todo se ejecuta usando LockService para no coincidir con operaciones de V3 que usen el mismo bloqueo.
- **NO existe botón de restauración**: no se sobrescribe la planilla, no se actualiza la propiedad `HISJB_V3_TEST_SHEET_ID`, no se borran registros ni se reabren turnos.
- El proyecto de Apps Script y sus propiedades secretas (cuentas, claves derivadas, pepper, configuración de pruebas) **NO se incluyen en la copia de Sheets**; GitHub conserva el código pero los secretos deben mantenerse y protegerse por separado.

## Antes de probar
1. Crear en Google Drive una carpeta **privada**, por ejemplo `HISJB V3 RESPALDOS PRUEBAS`. La validación exige acceso restringido, propietario identificable y ningún colaborador/editor/lector adicional.
2. Obtener el **ID de la carpeta** de la URL de Drive (solo el texto después de `/folders/`, no la URL completa).
3. Abrir el editor del Apps Script V3 de PRUEBAS → **Configuración del proyecto → Propiedades de secuencia de comandos**.
4. Agregar una propiedad con nombre exacto `HISJB_V3_BACKUP_FOLDER_ID` y valor **ID de la carpeta**. Nunca poner el ID en el repositorio público ni enviar links del contenido por chat.
5. Comprobar que `HISJB_V3_TEST_SHEET_ID` sigue apuntando exclusivamente a la planilla V3 ficticia. El proyecto tiene que estar autorizado para usar Drive; si Google solicita permisos nuevos, revisarlos y autorizarlos conscientemente desde el editor.
6. Actualizar `/dev` y entrar como ADMIN → **Administración · Respaldos de V3** → `Consultar respaldos`.
7. Ejecutar primero `pruebasRespaldosSoloLecturaV3` desde el editor: resultado esperado **8/8**, sin creación de copias.
8. En el panel ADMIN, pulsar `Crear y verificar respaldo`. Revisar que informe `Respaldo verificado` y confirmar en la carpeta privada de Drive que existe la copia.

## Programación diaria (solo después de validar copia manual)
En el editor privado V3 de Apps Script, ejecutar una vez `v3InstalarRespaldoDiarioV3_` como propietario/autorizado. Conceder permisos Drive/Triggers si Google los solicita. La tarea se ejecutará cerca de las 02:00 según la zona horaria del proyecto; no se garantiza un minuto exacto. El botón **Consultar respaldos** mostrará si el usuario que ejecuta la app puede ver el disparador instalado. No instalar con varias cuentas. Si existiera un disparador con el nombre anterior `v3RespaldoDiarioProgramado`, revisarlo y retirarlo desde el editor antes de instalar el nuevo.

**Se recomienda controlar las copias periódicamente**. No hay borrado automático ni retención configurada, para evitar eliminar respaldos por error. Definir política de retención, permisos de acceso, almacenamiento disponible y responsables institucionales antes de producción.

## Validación integral en un solo paso
Una vez confirmada la propiedad de la planilla de pruebas y configurada la carpeta privada, ejecutar `v3ValidacionIntegralV3_` **desde el editor de Apps Script V3**. Ejecuta las ocho suites de solo lectura, crea un respaldo y una copia adicional aislada `SIMULACRO-RESTAURACION-HISJB-V3-PRUEBAS-...`, comprueba su privacidad e inventario de hojas y registra el resultado sin exponer IDs ni contenido. Se conserva la copia aislada para revisión manual; no reemplaza el original. Si alguna prueba falla, no se inicia la copia; si una copia falla, se conserva para revisión. No es una restauración de producción ni coteja todas las celdas. La tarea diaria se instala por separado después de verificar el ensayo.

La sincronización protegida de GitHub Actions no debe confundirse con ejecución remota. La API de ejecución exigiría una implementación específica y autorización OAuth adicional para Sheets y Drive, distinta de la sincronización de código. No se habilita dicha API ni se amplía la credencial actual: las operaciones reales permanecen en el editor y en el disparador privado.

## Recuperación segura (simulacro en otro archivo, nunca sobre datos activos)
1. Suspender la carga de datos del entorno de pruebas, registrar hora e incidente.
2. Elegir una copia anterior, verificar fecha, encabezados y números de filas. Recordar que se perderían los cambios posteriores a esa copia si se usara como restauración.
3. En Drive, abrir una **copia de la copia** o una hoja de cálculo adicional aislada, no el original. Revisar `Personal_V3`, `Pedidos_V3`, `Auditoria_V3`, `Menu_V3`, `Avisos_V3` y `Cierres_V3`.
4. Documentar qué cambios se perderían y qué pedidos/cierres nuevos deben reconciliarse desde la auditoría. Guardar los documentos de validación en un lugar privado.
5. Con aprobación institucional explícita, planificar un procedimiento de cambio de planilla en ventana de mantenimiento; **esta actualización no incluye cambio automático de origen ni restauración destructiva**.
6. Comprobar de forma independiente las propiedades privadas de Apps Script y el código desplegado. Estas no están incluidas en los respaldos de Sheets.

## Advertencias de seguridad
- No subir los respaldos a GitHub, GitHub Actions ni al navegador como archivo descargable público.
- No copiar nombres del personal, contraseñas, tokens, ID privados de carpeta ni capturas con datos personales a issues o logs públicos.
- La cuenta que ejecuta el script necesita acceso a la carpeta destino y al archivo fuente; si pierde permisos, el respaldo fallará.
- Que la interfaz diga `Respaldo verificado` significa que coincidieron encabezados y recuentos de filas, **no** que se haya realizado una restauración exitosa ni una comparación celda a celda.
- La seguridad de accesos, rotación de contraseñas antiguas y ensayo de recuperación ante cortes de red siguen pendientes para producción.

## GitHub Actions
La rama de desarrollo se sincroniza automáticamente con el Apps Script V3 solamente después de pasar las verificaciones y recibir la aprobación correspondiente en el entorno `v3-pruebas`. La nueva configuración privada de Drive se realiza desde Apps Script, no mediante GitHub.
