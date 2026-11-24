# Nutrición V3 — menús editables, alerta del día e indicadores de Cocina

## Qué se implementó (solo entorno de PRUEBAS)
Se tomó como referencia la versión estable de nutricion.html, personal.html y cocina.html y las cuatro capturas del hospital. **No se han modificado los archivos originales ni la rama main.**

### Nutrición
- Un mismo panel de Cocina/Nutrición: con rol **NUTRICION** o **ADMIN** aparece un formulario para **publicar o cambiar** el menú de almuerzo o cena en cualquier momento, incluso si ya existen pedidos. El cambio no edita ni elimina los pedidos existentes.
- Campos: plato principal (obligatorio), postre, dietas GENERAL, HIPOSODICA, DIABETICA, CELIACA, GASTRICA, ASTRINGENTE y VEGETARIANA. Si no se rellena una dieta, en la visualización se utiliza el plato principal genérico.
- Cada modificación crea una nueva versión con hora y servicio editor en **Menu_V3** y agrega una entrada a **Auditoria_V3**.
- Los menús muestran estado «En preparación» si todavía no se publicaron. No se bloquea el registro de viandas en esta etapa (regla de negocio para validar posteriormente con Nutrición).

### Alerta del día
- Nutrición y ADMIN pueden publicar/cambiar un mensaje diario de hasta 500 caracteres o retirarlo dejando el campo vacío.
- El aviso aparece **debajo del campo de ingreso de contraseña**, sin iniciar sesión.
- Se guarda con historial por fecha y versión en **Avisos_V3** y auditoría. Al cambiar el día se deja de mostrar automáticamente; no publica el texto de días anteriores.
- El aviso se muestra como **texto plano**: no permite HTML.
- La URL de la aplicación de pruebas no debe compartirse públicamente todavía. El aviso es intencionalmente visible sin login.

### Cocina
- Indicadores del día: total de viandas, almuerzos, cenas, entregados y pendientes; excluyen registros duplicados históricos.
- Indicadores de dietas pendientes para la comida elegida (7 tipos y otros presentes).
- Tarjetas de los dos menús con versión, hora, postre y detalles por dieta.
- Conserva búsqueda, entregas, reversión, roles y marcas de duplicados previos.

### Personal
- Conserva acceso por **solo contraseña** del servicio, selección individual o masiva, guardias, registro manual sin DNI según rol.
- Muestra el menú del día con almuerzo y cena luego de ingresar.

## Persistencia
Se crean automáticamente al realizar la primera publicación las hojas **Menu_V3** y **Avisos_V3**, con encabezados propios. También se incluyeron las cabeceras en \`v3HojasIniciales_\`, que se reserva a administración.

**Nunca cambiar** \`HISJB_V3_TEST_SHEET_ID\` a la planilla de producción durante estas pruebas.

## Cuenta de Nutrición de pruebas

El backend no crea por sí solo cuentas nuevas. Para probar la edición desde el navegador, crear una cuenta de Nutrición **solo en el Apps Script privado de pruebas**, usando una función temporal, con una clave nueva y distinta de las otras tres:

\`\`\`js
function crearNutricionTemporal() {
  Logger.log(v3ProvisionarCuenta_(
    'NUTRICION',
    'NUTRICION',
    'ELEGIR_CLAVE_PRIVADA_DE_PRUEBA_LARGA'
  ));
}
\`\`\`

Reemplazar el marcador **únicamente en el editor privado de pruebas**, ejecutar una sola vez y luego **eliminar esa función**. Nunca guardar la clave en GitHub ni enviarla por chat.

## Actualización Windows / clasp

\`\`\`powershell
cd "$HOME\Documents\HISJB-COCINA"
git pull origin desarrollo-selector-v3-2026-11-20
cd .\backend-v3
clasp status
clasp push
\`\`\`

Confirmar previamente que el \`.clasp.json\` sigue apuntando al proyecto de pruebas. Usar \`/dev\` para probar el código nuevo y refrescar con Ctrl+F5. No actualizar despliegues de producción.

## Plan de prueba

1. **Solo lectura**: ejecutar \`pruebasMenusSoloLecturaV3()\` desde el editor privado. Esperado: **7/7**. No modifica hojas.
2. Crear una cuenta NUTRICION ficticia como se explicó arriba, abrir \`/dev\`, iniciar sesión solo con su contraseña.
3. Publicar almuerzo ficticio y postre. Debería aparecer en la vista de Nutrición y después, al actualizar, en Cocina y Personal.
4. Modificar el mismo menú: debe quedar **versión 2**, historial de dos filas y \`MENU_ACTUALIZADO\` en Auditoria_V3. Los pedidos existentes no deben cambiar.
5. Publicar aviso «Prueba: retirar tras verificar». Cerrar sesión y verificar que el texto esté **debajo del formulario de contraseña**.
6. Volver a ingresar a Nutrición y elegir **Retirar alerta**. Confirmar que desaparece del ingreso.
7. Entrar como Cocina: debe ver indicadores y menús, pero nunca el formulario de modificación.
8. Entrar como Enfermería: debe ver los menús, la nómina y sus controles de supervisor. No debe poder editar el menú o aviso.
9. Revisar total del día y duplicados históricos: los indicadores agregados no deben sumar registros redundantes.

## Pendientes antes de producción
- Las actualizaciones son visibles **al recargar/actualizar las pantallas**; no implementamos aún mensajes push o notificaciones en vivo.
- Faltan bloqueos según horario, cierre de turno, reglas de selección por dieta según menú, controles de ataques de fuerza bruta y pruebas de múltiples usuarios concurrentes.
- La cuenta por contraseña compartida no identifica individualmente a quien publica; la auditoría muestra el servicio y no la persona.
- Los datos mostrados de pruebas son ficticios; la versión estable y sus tres páginas originales siguen intactas.
