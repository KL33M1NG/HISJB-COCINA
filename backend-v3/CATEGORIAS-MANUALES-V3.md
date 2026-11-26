# Categorías de carga sin DNI

ADMIN dispone de una pestaña «Categorías sin DNI» para agregar categorías globales. Policía, Seguridad y Residente siguen disponibles. Se admiten hasta 40 nuevas categorías (2 a 60 caracteres, sin diferencias por mayúsculas, tildes o espacios repetidos). Los supervisores pueden actualizar el desplegable sin cerrar sesión. El servidor valida las categorías y mantiene los permisos y la deduplicación de pedidos existentes; no se modifica ningún pedido histórico.

El catálogo adicional se guarda en la propiedad privada `HISJB_V3_CATEGORIAS_MANUALES`; no contiene personas ni contraseñas. Las copias de la planilla no incluyen propiedades del script: conservar una copia privada de esta configuración cuando se agreguen categorías. ADMIN y SERVICIOS comparten la propiedad si pertenecen al mismo proyecto.

## Pruebas y publicación

1. Ejecutar `node tools/verificar-v3-ci.js` y `node tools/probar-v3-ci.js`. En V3 de pruebas, verificar un alta ficticia desde ADMIN, ausencia de edición en SUPERVISOR y registro manual ficticio con la categoría nueva.
2. Acordar una ventana de actualización productiva y respaldar datos y código. Regenerar los paquetes privados en carpetas nuevas mediante los preparadores existentes; no ejecutar instaladores ni modificar las propiedades de producción existentes. Conservar el aislamiento de roles y la configuración de acceso de cada implementación.
3. Actualizar primero SERVICIOS a una versión nueva del paquete operativo con apertura controlada; validar que los supervisores pueden leer las categorías. Después actualizar ADMIN a su propia versión del paquete ADMIN; mantenerlo privado. Verificar que cada enlace sigue apuntando a su canal y no volver a publicar versiones antiguas.
4. Verificar desde ADMIN una categoría realmente necesaria y desde SUPERVISOR el desplegable. No crear viandas ficticias en producción. No cambiar los enlaces de GitHub Pages ni el proyecto de pruebas.
