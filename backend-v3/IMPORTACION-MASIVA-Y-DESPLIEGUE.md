# HISJB Cocina V3 — Incorporación masiva y preparación del despliegue

**Solo V3 de pruebas. La rama `main` y el Apps Script estable NO se modificaron.**

## Incorporación masiva del personal

Se agregó el panel **Administración · Incorporación masiva de personal**, visible únicamente con la cuenta `ADMIN`. Cocina y Nutrición no pueden importar personal.

Copiar una persona por línea, con exactamente tres campos separados por punto y coma:

```text
Pérez Juan; ENFERMERIA; GENERAL
López María; TRAUMATOLOGIA; CELIACA
González Ana; ENFERMERIA; HIPOSODICA
```

**No se pide DNI.** El servidor genera un ID interno único por trabajador. Hasta **150 personas por operación**. Las dietas válidas son GENERAL, HIPOSODICA, DIABETICA, CELIACA, GASTRICA, ASTRINGENTE, VEGETARIANA.

1. Pulsar **Revisar antes de incorporar**. Se muestra cuántos son nuevos y cuántos ya existen. No escribe datos.
2. Confirmar mediante **Confirmar incorporación masiva**. El servidor vuelve a validar bajo bloqueo y registra una fila en `Auditoria_V3`.
3. Los trabajadores ya existentes por servicio+nombre se omiten. No se reescriben dietas ni estado activo. La resolución de homónimos y reactivaciones requiere revisión administrativa; no usar esta función para corregirlos.
4. La importación alimenta **Personal_V3**; **NO registra automáticamente viandas**. Los supervisores pueden luego seleccionar a todo el personal de su servicio para registrar guardias.

**Permisos**: solo ADMIN. Si no existe cuenta ADMIN, debe configurarse desde el editor privado de Apps Script siguiendo el procedimiento actual `v3ProvisionarCuenta_`, con contraseña nueva que no se escriba en el repositorio.

## Sincronizar nueva estación de trabajo

```powershell
cd "C:\HISJB\HISJB-COCINA"
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp.cmd status
```

Conservar el archivo local `appsscript.json` **igual al del Apps Script V3 de pruebas**, incluyendo sus propiedades `webapp`. Confirmar `scriptId` de la V3 de pruebas en `.clasp.json` antes de ejecutar:

```powershell
clasp.cmd push
```

## Pruebas nuevas, sin escritura

En Apps Script, ejecutar la función `pruebasImportacionNominaSoloLecturaV3`. **Esperado: 9/9**. Verifica roles, detección de duplicados, nombres y dietas, y la vista previa. No importa trabajadores.

También ejecutar `pruebasCocinaSoloLecturaV3` (**9/9**) y `pruebasHistorialSoloLecturaV3` (**6/6**).

## Prueba CONTROLADA de cierre

Antes de cerrar un turno en V3:
- Hacer copia de la hoja de cálculo de pruebas. No usar datos de pacientes ni empleados reales.
- Confirmar que el turno elegido esté abierto; la fecha debe ser la fecha local **actual** del Apps Script.
- Registrar tres viandas de personas ficticias diferentes en el mismo turno.
- Entregar dos; dejar una pendiente.
- En **Vista previa** comprobar total=3, entregados=2, pendientes=1 *si el turno no tiene otros pedidos anteriores*. Si los tiene, los totales serán mayores: usar un turno limpio.
- Escribir el texto exacto solicitado por el cierre y confirmar solo después de revisar.
- Confirmar una fila nueva en `Cierres_V3` y estado `NO_ENTREGADO` de la pendiente. Verificar que **Historial de cierres y estadísticas** muestre esa fecha y turno.
- Intentar registrar después de cerrar ese turno debe ser rechazado. El turno contrario debe permanecer abierto.

## Bloqueantes para producción

**El sistema no está listo todavía para su despliegue con personal real**, aunque la interfaz y las consultas se hayan probado:
- Validar cierre y recuperación si una operación de Google Sheets falla a mitad del proceso; el cierre actual no es transaccional.
- Ensayo con varias estaciones de Cocina registrando entregas a la vez, además de supervisores registrando pedidos.
- Procedimiento de reapertura excepcional, roles y auditoría de cambios.
- Actualizar las contraseñas temporales de pruebas y revisar control de acceso y permisos del proyecto publicado.
- Confirmar rendimiento con cantidad realista de servicios y viandas, copias de seguridad, y aceptación por Cocina, Nutrición y responsables del hospital.
- No copiar datos reales a la planilla de prueba ni abrir la aplicación al público.

El despliegue de pruebas `/dev` es diferente de publicar la aplicación `/exec`.
