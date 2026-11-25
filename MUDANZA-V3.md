# Transición de enlaces históricos a V3

Sólo preparación en desarrollo. `index.html`, `personal.html`, `cocina.html` y `nutricion.html` siguen intactos. La maqueta `mudanza-v3.html` no redirige mientras `mudanza-config.js` esté en modo `pendiente` y el destino esté vacío.

## Antes del corte
- Preparar y aprobar un proyecto Apps Script productivo independiente, planilla privada, respaldos y cuentas propias. Resolver la exposición de datos y credenciales heredadas del repositorio público con los responsables institucionales. No publicar `/dev`, no cambiar visibilidad ni reescribir el historial sin autorización específica.
- Verificar acceso desde teléfono sin sesión de Google, autorización por perfil, integridad de pedidos y contingencia. Confirmar la URL HTTPS versionada `/exec` de producción. El workflow existente se mantiene limitado a V3 de pruebas.
- Definir fecha y hora del corte entre turnos; cerrar o conciliar pendientes en el sistema anterior y evitar dos circuitos de escritura simultáneos.

## Etapa 1: aviso (duración sugerida: siete días)
Tras aprobación expresa del corte, utilizar la página de mudanza como destino de `index.html` y de los tres enlaces históricos. Reemplazar las antiguas interfaces públicas por páginas de transición sin datos ni credenciales, manteniendo la misma ruta. Conservar el sistema anterior e histórico de forma privada, no mediante otro enlace público. En `mudanza-config.js`, configurar el destino productivo revisado y modo `aviso`. El usuario debe pulsar el botón para entrar a V3.

## Etapa 2: redirección
Después del período de aviso y de comprobar la estabilidad, cambiar el modo a `redireccion` mediante una aprobación independiente. Todos los enlaces anteriores seguirán funcionando y dirigirán al mismo destino. Se mantiene un botón de respaldo visible mientras carga la navegación. No hay cambio automático por fecha sin revisión operativa.

## Contingencia
No reactivar escrituras antiguas automáticamente. Si se necesita retroceder, suspender nuevas solicitudes, reconciliar cambios posteriores al corte y decidir con responsables institucionales. Una redirección no restaura datos. Las copias del historial de GitHub y forks no desaparecen simplemente reemplazando el HTML.
