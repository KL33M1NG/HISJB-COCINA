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
/**
 * Probar acceso SOLO POR CONTRASEÑA, sin escribir datos.
 * Recibe las claves desde una función temporal PRIVADA, nunca desde GitHub.
 */
function pruebasClaveUnicaV3_(claveEnfermeria, claveTrauma, claveCocina) {
  var casos = [
    {clave:claveEnfermeria, servicio:'ENFERMERIA',rol:'SUPERVISOR'},
    {clave:claveTrauma, servicio:'TRAUMATOLOGIA',rol:'WEB'},
    {clave:claveCocina, servicio:'COCINA',rol:'COCINA'}
  ];
  casos.forEach(function(c) {
    var login = v3Login_({clave:c.clave});
    if (login.servicio !== c.servicio || login.rol !== c.rol) {
      throw Error('El acceso por contraseña no identificó correctamente ' + c.servicio);
    }
    Logger.log('OK: clave única identificó ' + login.servicio + ' (' + login.rol + ')');
    v3CerrarSesion_(login.token);
  });
  try {
    v3Login_({clave:'CLAVE_INCORRECTA_V3_000000000000'});
    throw Error('FALLO: aceptó una contraseña incorrecta');
  } catch(e) {
    if (String(e.message).indexOf('FALLO') === 0) throw e;
  }
  Logger.log('RESULTADO: 4/4 pruebas de login sin servicio');
}

/**
 * Regresión de carga manual y claves de duplicados (sin escritura).
 * Puede ejecutarse desde Apps Script sin contraseñas.
 */
function pruebasManualSoloLecturaV3() {
  var claveA=v3PedidoClave_('Pérez Juan','ENFERMERIA','MAÑANA');
  var claveB=v3PedidoClave_('  PEREZ   JUAN  ','ENFERMERIA','MANANA');
  if(claveA!==claveB) throw Error('Normalización de identidad manual incorrecta');
  if(v3PedidoClave_('Pérez Juan','TRAUMATOLOGIA','MAÑANA')===claveA)
    throw Error('La identidad de otro servicio no debe coincidir');
  if(v3PedidoClave_('Pérez Juan','ENFERMERIA','NOCHE')===claveA)
    throw Error('Las comidas distintas no deben coincidir');

  var cocina={rol:'COCINA',servicio:'COCINA'};
  var web={rol:'WEB',servicio:'TRAUMATOLOGIA'};
  function debeRechazar(sesion) {
    try {
      v3RegistrarManual_(sesion,{nombre:'Pérez Juan',categoria:'SEGURIDAD',guardia:'12',turno:'MAÑANA'});
      throw Error('FALLO: se autorizó una carga manual sin permisos');
    } catch(e) {
      if(String(e.message).indexOf('FALLO')===0) throw e;
      if(String(e.message)!=='Permiso insuficiente') throw e;
    }
  }
  debeRechazar(cocina);
  debeRechazar(web);
  Logger.log('OK: 5/5 pruebas de normalización y autorización manual (solo lectura)');
}

/**
 * Regresión de Nutrición, Cocina y aviso del día, sin escrituras.
 * No expone contraseñas ni requiere una cuenta real de Nutrición.
 */
function pruebasMenusSoloLecturaV3() {
  var cocina={rol:'COCINA',servicio:'COCINA'};
  var supervisor={rol:'SUPERVISOR',servicio:'ENFERMERIA'};
  var nutricion={rol:'NUTRICION',servicio:'NUTRICION'};
  function rechaza(nombre,fn) {
    try {fn();throw Error('FALLO: '+nombre+' aceptó una operación restringida');}
    catch(e){
      if(String(e.message).indexOf('FALLO')===0)throw e;
      if(String(e.message)!=='Solo Nutrición puede editar menús y avisos')throw e;
      Logger.log('OK: '+nombre);
    }
  }
  rechaza('Cocina no puede editar menú',function(){
    v3GuardarMenu_(cocina,{turno:'MAÑANA',plato:'PRUEBA'});
  });
  rechaza('Supervisor no puede editar menú',function(){
    v3GuardarMenu_(supervisor,{turno:'MAÑANA',plato:'PRUEBA'});
  });
  rechaza('Cocina no puede publicar avisos',function(){
    v3GuardarAviso_(cocina,{texto:'PRUEBA'});
  });
  rechaza('Supervisor no puede publicar avisos',function(){
    v3GuardarAviso_(supervisor,{texto:'PRUEBA'});
  });
  var publicacion=v3AvisoPublico_();
  if(publicacion.status!=='success'||typeof publicacion.aviso!=='string')
    throw Error('Error en lectura pública del aviso');
  Logger.log('OK: aviso público de solo lectura');
  var consulta=v3MenusHoy_(nutricion);
  if(consulta.status!=='success'||!consulta.menus ||
     !('MAÑANA' in consulta.menus)||!('NOCHE' in consulta.menus))
    throw Error('Error al consultar menús del día');
  Logger.log('OK: consulta de menús por rol Nutrición');
  var resumen=v3ResumenCocina_(cocina);
  if(resumen.status!=='success'||resumen.resumen.total<0)
    throw Error('Error al consultar resumen Cocina');
  Logger.log('OK: indicadores Cocina disponibles');
  Logger.log('RESULTADO: 7/7 pruebas de permisos/consultas Nutrición');
}
