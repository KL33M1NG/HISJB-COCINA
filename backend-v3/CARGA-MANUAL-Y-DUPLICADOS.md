# HISJB V3 — Carga manual sin DNI y duplicados históricos

> **Solo planilla y Apps Script de pruebas.** Código preparado para prueba funcional en navegador; no validado todavía con usuarios reales.

## Cambios nuevos

### Supervisor
Al ingresar con la clave de un servicio que tenga rol `SUPERVISOR`, debajo de la nómina aparece **Carga manual sin DNI**:
- Apellido y nombre (dos palabras como mínimo, entre 5 y 100 caracteres)
- Categoría: Policía, Seguridad o Residente
- Dieta: General, Hiposódica, Celíaca, Vegetariana o Diabética
- Guardia y comida se toman de los selectores superiores. Una guardia de 24 horas genera las dos comidas.

No se solicita DNI ni se agrega una persona permanentemente a `Personal_V3`; se registra solo el pedido correspondiente en `Pedidos_V3`, con `TIPO = MANUAL:<CATEGORIA>` y un ID técnico aleatorio. La auditoría registra `REGISTRAR_MANUAL`.

El servicio se **deriva de la sesión del supervisor**. No es posible cambiarlo desde el formulario. El rol WEB y Cocina no tienen permisos de carga manual.

### Duplicados
- Bajo `LockService`, el servidor comprueba `nombre normalizado + servicio + comida + fecha` entre pedidos ya registrados, incluyendo los entregados; también evita cargar manualmente a alguien ya presente en la nómina activa del servicio.
- Cocina señala los grupos repetidos que quedaron de las pruebas antiguas. Cada fila repetida sigue visible para conservar auditoría; las filas redundantes quedan **sin botón Entregar**.
- El servidor vuelve a validar por fecha, nombre, sector y comida antes de confirmar una entrega, aunque alguien intente saltar el control de pantalla. Si ya hay una entrega, bloquea una segunda.
- No se eliminan ni anulan automáticamente los pedidos históricos. Una persona homónima del mismo servicio requerirá revisión: la prevención conservadora puede bloquearla; por eso no es un identificador de identidad perfecto.

## Cómo instalar

Desde PowerShell, **sobre el proyecto de pruebas que ya está vinculado**:

```powershell
cd "$HOME\Documents\HISJB-COCINA"
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp status
clasp push
```

Abrir la URL `/dev` del Apps Script de pruebas, refrescar y acceder solo con la clave ficticia de Enfermería (SUPERVISOR). Debería verse un segundo bloque **Carga manual sin DNI**.

## Pruebas antes de producir

1. En el editor de Apps Script ejecutar `pruebasManualSoloLecturaV3`: se esperan **5/5** comprobaciones. No modifica datos.
2. En la pantalla de Enfermería, usar una identidad **ficticia no presente en la nómina**, por ejemplo `Prueba Guardia` como Seguridad, guardia 24 h. Debería crear 2 pedidos.
3. Volver a registrar exactamente la misma persona y guardia: **0 creados / 2 repetidos**.
4. Intentar registrar manualmente a `Ana González` si figura como activa en la nómina de Enfermería: debe rechazarlo indicando que se seleccione desde el listado.
5. Entrar a Cocina, comprobar que aparecen los pedidos manuales con su categoría y que las filas repetidas previas se marcan como **Duplicado histórico**.
6. Verificar que solo un pedido del mismo trabajador/sector/comida se pueda entregar, y que la reversión funcione.
7. En TRAUMATOLOGIA/WEB no debe verse el formulario de carga manual.

**No ejecutar pruebas destructivas sobre la hoja de producción.** No se sustituyen las credenciales ni las propiedades de ScriptProperties mediante clasp. La implementación `/dev` carga la última versión; una implementación `/exec` existente requeriría actualización explícita y no debe modificarse sin probar primero.
