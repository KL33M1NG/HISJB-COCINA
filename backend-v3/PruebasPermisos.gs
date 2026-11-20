/**
 * Copiar solamente en el Apps Script PRIVADO de pruebas.
 * No agregar contraseñas ni tokens en GitHub.
 * NO escribe ni elimina pedidos.
 *
 * Uso: crear la función temporal:
 * function ejecutarPruebasPermisos() {
 *   pruebasPermisosV3_(
 *     v3Sesion_(v3Login_({servicio:'ENFERMERIA', clave:'TU_CLAVE_DE_PRUEBA'}).token),
 *     v3Sesion_(v3Login_({servicio:'TRAUMATOLOGIA', clave:'TU_CLAVE_DE_PRUEBA'}).token),
 *     v3Sesion_(v3Login_({servicio:'COCINA', clave:'TU_CLAVE_DE_PRUEBA'}).token)
 *   );
 * }
 * Reemplazar los marcadores SOLO en el editor privado, ejecutar y eliminar
 * después la función temporal con las claves.
 */
function pruebasPermisosV3_(enfermeria, trauma, cocina) {
  var resultados = [];
  function verificar(nombre, condicion) {
    resultados.push({prueba:nombre, correcto:!!condicion});
    Logger.log((condicion ? 'OK' : 'FALLO') + ': ' + nombre);
  }
  function debeRechazar(nombre, accion) {
    try {
      accion();
      verificar(nombre, false);
    } catch (err) {
      verificar(nombre, true);
    }
  }
  verificar('SUPERVISOR identificado como ENFERMERIA',
    enfermeria.rol === 'SUPERVISOR' && enfermeria.servicio === 'ENFERMERIA');
  verificar('WEB identificado como TRAUMATOLOGIA',
    trauma.rol === 'WEB' && trauma.servicio === 'TRAUMATOLOGIA');
  verificar('COCINA identificado correctamente', cocina.rol === 'COCINA');

  var lista = v3Personal_(enfermeria).personas;
  verificar('Enfermería ve únicamente su servicio',
    lista.length >= 2 && lista.every(function(p) {
      return v3Norm_(p.servicio) === 'ENFERMERIA';
    }));
  verificar('Enfermería ve TEST003 y TEST004',
    ['TEST003','TEST004'].every(function(id) {
      return lista.some(function(p) {return p.id === id;});
    }));
  var listaTrauma = v3Personal_(trauma).personas;
  verificar('WEB Traumatología solo ve su servicio',
    listaTrauma.length >= 2 && listaTrauma.every(function(p) {
      return v3Norm_(p.servicio) === 'TRAUMATOLOGIA';
    }));

  // Todas las llamadas siguientes DEBEN fallar antes de escribir en Sheets.
  debeRechazar('SUPERVISOR no registra persona de otro servicio', function(){
    v3Registrar_(enfermeria, {ids:['TEST001'], guardia:'24', turno:'MAÑANA'});
  });
  debeRechazar('WEB no registra varias personas a la vez', function(){
    v3Registrar_(trauma, {ids:['TEST001','TEST002'], guardia:'12', turno:'MAÑANA'});
  });
  debeRechazar('COCINA no puede registrar personal', function(){
    v3Registrar_(cocina, {ids:['TEST003'], guardia:'12', turno:'MAÑANA'});
  });
  debeRechazar('SUPERVISOR no valida entregas', function(){
    v3Entrega_(enfermeria, {id:'ID_NO_UTILIZADO', revertir:false});
  });
  debeRechazar('WEB no consulta listados internos de Cocina', function(){
    v3Listado_(trauma, {turno:'MAÑANA'});
  });
  debeRechazar('COCINA no obtiene nómina de Personal', function(){
    v3Personal_(cocina);
  });

  var ok = resultados.filter(function(r){return r.correcto;}).length;
  Logger.log('RESULTADO: ' + ok + '/' + resultados.length);
  if(ok !== resultados.length) {
    throw Error('Pruebas de permisos NO superadas. No integrar V3 todavía.');
  }
  return resultados;
}