# Pruebas de aceptación — backend V3
## Estado previo
Al 20/11/2026 existían 10 filas de pruebas en Pedidos_V3: 8 de los primeros dos intentos y 2 almuerzos agregados durante la corrección. El diagnóstico de turno encontró las cuatro claves TEST003 / TEST004 + MAÑANA / NOCHE.

## 1. Prueba del registro corregido (con escritura potencial)
Solo después de haber instalado el último `backend-v3/Code.gs` en el Apps Script de **pruebas**, ejecutar la función temporal `probarGuardia24V3` que ya existe en el editor.

Resultado esperado: `Pedidos creados: 0`, `Duplicados: 4`. El número total de filas de datos no debe aumentar. Si no coincide, **detener**, no reiterar la función y revisar logs.

## 2. Limpiar exclusivamente la planilla de pruebas
Una vez superada la prueba anterior, guardar una copia de la planilla de pruebas si se necesita el historial diagnóstico. Borrar las filas de datos duplicados de `Pedidos_V3`, preservando encabezados; puede ser más simple borrar *solo las diez filas de pruebas* y volver a empezar. No modificar jamás la hoja en producción.

## 3. Ensayo de entrega/reversión por ID y por comida
Crear exactamente dos filas para una persona ficticia, una MAÑANA y otra NOCHE, usando guardia=24.
Elegir el ID de pedido MAÑANA desde la hoja y probar `v3Entrega_` con una sesión de COCINA; confirmar que solo ese ID pasa a ENTREGADO y NOCHE sigue PENDIENTE; probar reversión y comprobar auditoría.
Para evitar acciones sobre datos de producción, no automatizar esta prueba sin confirmación del identificador.

## 4. Permisos
WEB puede registrar solo un ID propio por llamada; SUPERVISOR solo IDs del propio servicio; COCINA no debe registrar personal y SUPERVISOR no debe entregar.

## Precaución
El backend es de prueba; el HTML todavía no está conectado. Se necesita comprobar transporte seguro y reforzar controles antes de un despliegue real.
