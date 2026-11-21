/**
 * Ejecutar SOLO en el proyecto privado V3 de PRUEBAS desde Apps Script.
 * ANTES: crear propiedad de secuencia HISJB_V3_ADMIN_BOOTSTRAP con una clave
 * nueva de 16+ caracteres, distinta de las demás cuentas.
 * DESPUÉS: la propiedad temporal se borra tras crear la cuenta.
 * Nunca incluir contraseñas en el código fuente o registros.
 */
function v3ConfigurarAdminSeguro_() {
  var props=PropertiesService.getScriptProperties();
  var nombre='HISJB_V3_ADMIN_BOOTSTRAP';
  var clave=props.getProperty(nombre);
  if(!clave||clave.length<16)throw Error('Configurá HISJB_V3_ADMIN_BOOTSTRAP con clave privada de 16+ caracteres');
  try {
    var mensaje=v3ProvisionarCuenta_('ADMIN','ADMIN',clave);
    Logger.log(mensaje);
    Logger.log('La clave ADMIN no fue registrada en el código ni en los logs.');
    return mensaje;
  } finally {
    // Retirar la clave temporal incluso si la provisión falla.
    props.deleteProperty(nombre);
  }
}
