# HISJB Cocina: selector de versiones (propuesta de prueba)

**No afecta la versión actual hasta integrar esta rama a main.** En esta rama se añaden archivos sin modificar cocina.html, personal.html ni nutricion.html.

- `index.html` → deriva a la versión configurada.
- `version-config.js` → `estable` (predeterminada, la única versión real) o `v3`.
- `selector.html` → links directos a todas las pantallas.
- `versiones/v3/index.html` → demostración Cocina/Nutrición sin backend.
- `versiones/v3/personal.html` → demostración WEB / SUPERVISOR sin backend.

## Cómo probar
Una vez integrada a main en GitHub Pages: `https://KL33M1NG.github.io/HISJB-COCINA/selector.html`.
Para probar *sin publicar*, descargá la rama y ejecutá un servidor local; GitHub Pages en este repositorio solo sirve main.

## Regla guardia 24 horas
La carga de una persona en guardia de 24 h genera una inscripción y **dos pedidos**, almuerzo y cena, cada uno validable independientemente. El prototipo simula esta lógica con datos locales.

## Pendientes para producción
- Conectar V3 a Apps Script y mantener los campos `WEB` y `SUPERVISOR`.
- Validar contraseña por servicio y autorización de cada empleado **en servidor**; nunca en HTML/JS público.
- Evitar duplicados de forma atómica para cada persona, fecha y comida, incluidos los entregados.
- Definir identidad estable de empleados y un registro de auditoría para reversiones.
- Tener ambiente de pruebas en Google Sheets separado del real.
- Probar en celulares y hacer backup del Apps Script/Sheets antes de cambiar producción.

## Vuelta rápida
`version-config.js` con `estable` solo revierte la página de entrada: no deshace cambios de Apps Script ni en las hojas. Los vínculos directos a archivos históricos continúan abriendo sus versiones originales.

Rama de respaldo anterior: `respaldo-estable-2026-11-20`.
