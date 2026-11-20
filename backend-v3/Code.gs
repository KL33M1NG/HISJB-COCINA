/**
 * HISJB Cocina V3 · BACKEND DE PRUEBA · no desplegar sobre el Apps Script actual.
 * Requiere una planilla NUEVA de pruebas y configurar sus credenciales de forma privada.
 * Este archivo NO contiene DNI, nómina ni contraseñas.
 */
const V3 = Object.freeze({
  pedidos: 'Pedidos_V3', personal: 'Personal_V3', auditoria: 'Auditoria_V3',
  cuentasProp: 'HISJB_V3_CUENTAS', hojaProp: 'HISJB_V3_TEST_SHEET_ID',
  secretProp: 'HISJB_V3_PEPPER', sesionMinutos: 180
});

function v3Salida_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Interfaz V3: HtmlService + google.script.run (mismo proyecto).
 * No se transmiten claves en URLs ni se utiliza JSONP/CORS entre orígenes.
 * Solo desplegar en el proyecto de PRUEBAS.
 */
function doGet(e) {
  var page = 'acceso';
  var template = HtmlService.createTemplateFromFile('AccesoV3');
  template.page = page;
  return template.evaluate().setTitle('HISJB · Cocina V3 — PRUEBAS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function v3UiCall(p) {
  try {
    if (!p || typeof p !== 'object') throw Error('Solicitud no válida');
    var accion = String(p.accion || '');
    if (accion === 'login') return v3Login_(p);
    if (accion === 'logout') {
      v3CerrarSesion_(p.token);
      return {status:'success'};
    }
    var sesion = v3Sesion_(p.token);
    if (accion === 'personal') return v3Personal_(sesion);
    if (accion === 'registrar') return v3Registrar_(sesion,p);
    if (accion === 'registrarManual') return v3RegistrarManual_(sesion,p);
    if (accion === 'listado') return v3Listado_(sesion,p);
    if (accion === 'entrega') return v3Entrega_(sesion,p);
    throw Error('Acción no permitida');
  } catch (err) {
    // No devolver trazas ni detalles del servidor al navegador.
    var m = String(err && err.message || '');
    var conocidos = [
      'Credenciales incorrectas','Sesión inválida','Sesión vencida: volver a ingresar',
      'Acceso denegado','Permiso insuficiente','Selección inválida',
      'WEB admite un registro por operación','Guardia no válida',
      'Comida inválida','Trabajador no habilitado','Trabajador de otro servicio: acceso denegado',
      'Sistema ocupado, reintentar','Sistema ocupado','Turno inválido',
      'Solo Cocina puede validar o revertir','Estado incompatible','Pedido inexistente',
      'Acción no permitida','Nombre inválido','Categoría inválida',
      'La persona ya está en la nómina; seleccionála desde el listado',
      'Dieta inválida','Servicio inválido',
      'El pedido seleccionado es un duplicado histórico; no se puede entregar',
      'Ya existe una entrega de esta persona para esta comida'
    ];
    return {status:'error',message:conocidos.indexOf(m)>=0?m:'No fue posible completar la operación'};
  }
}

function v3CerrarSesion_(token) {
  v3Sesion_(token);
  CacheService.getScriptCache().remove('v3:'+token);
}

/** API externa deshabilitada: usar exclusivamente la interfaz HtmlService de pruebas. */
function doPost(e) {
  return v3Salida_({status:'error',message:'Utilizar la interfaz web de pruebas'});
}

function v3Planilla_() {
  var id = PropertiesService.getScriptProperties().getProperty(V3.hojaProp);
  if (!id) throw Error('Falta configurar hoja de PRUEBAS');
  return SpreadsheetApp.openById(id);
}

function v3HojasIniciales_() {
  var ss = v3Planilla_();
  var specs = {};
  specs[V3.personal] = ['ID_PERSONAL','NOMBRE','SERVICIO','DIETA','ACTIVO'];
  specs[V3.pedidos] = ['ID','FECHA','TURNO','ID_PERSONAL','NOMBRE','SERVICIO','GUARDIA','DIETA','ESTADO','HORA_ENTREGA','TIPO','LOTE'];
  specs[V3.auditoria] = ['FECHA_HORA','ACCION','SERVICIO','DETALLE'];
  Object.keys(specs).forEach(function(nombre) {
    var s = ss.getSheetByName(nombre);
    if (!s) {s = ss.insertSheet(nombre); s.appendRow(specs[nombre]);}
    else if (s.getLastRow() === 0) s.appendRow(specs[nombre]);
  });
  return 'Hojas de prueba preparadas; cargar nómina ficticia en Personal_V3';
}

/**
 * Provisionar cuentas desde el editor PRIVADO de Apps Script.
 * Invocar desde un script de configuración temporal (nunca guardar claves en GitHub).
 * rol = WEB, SUPERVISOR, COCINA, NUTRICION o ADMIN.
 * WEB y SUPERVISOR deben usar el servicio exacto que aparece en Personal_V3.
 */
function v3ProvisionarCuenta_(servicio, rol, clave) {
  servicio = v3Norm_(servicio);
  rol = v3Norm_(rol);
  if (!['WEB','SUPERVISOR','COCINA','NUTRICION','ADMIN'].includes(rol)) throw Error('Rol incorrecto');
  if (!servicio || String(clave || '').length < 12) throw Error('Requiere servicio y clave de 12+ caracteres');
  var props = PropertiesService.getScriptProperties();
  var pepper = props.getProperty(V3.secretProp);
  if (!pepper) {pepper = Utilities.getUuid()+Utilities.getUuid();props.setProperty(V3.secretProp,pepper);}
  var cuentas = JSON.parse(props.getProperty(V3.cuentasProp) || '{}');
  // En el acceso sin usuario cada contraseña debe identificar UN solo servicio.
  Object.keys(cuentas).forEach(function(nombre) {
    var actual = cuentas[nombre];
    if (nombre !== servicio && v3Hash_(actual.salt+':'+clave+':'+pepper) === actual.hash) {
      throw Error('Esta contraseña ya pertenece a otro servicio');
    }
  });
  var salt = Utilities.getUuid();
  cuentas[servicio] = {rol:rol, salt:salt, hash:v3Hash_(salt+':'+clave+':'+pepper)};
  props.setProperty(V3.cuentasProp,JSON.stringify(cuentas));
  return 'Cuenta creada para '+servicio+' ('+rol+')';
}

function v3Hash_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8);
  return bytes.map(function(b){return ('0'+(b&255).toString(16)).slice(-2)}).join('');
}
function v3Norm_(s) {
  return String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function v3Login_(p) {
  // La pantalla principal solicita SOLO la clave. El servidor identifica rol y servicio.
  // Un servicio opcional solo se acepta por compatibilidad con pruebas internas existentes.
  var solicitado = v3Norm_(p && p.servicio);
  var clave = String(p && p.clave || '');
  if (!clave) throw Error('Credenciales incorrectas');
  var cuentas = JSON.parse(PropertiesService.getScriptProperties().getProperty(V3.cuentasProp) || '{}');
  var pepper = PropertiesService.getScriptProperties().getProperty(V3.secretProp);
  if (!pepper) throw Error('Credenciales incorrectas');
  var coincidencias = [];
  Object.keys(cuentas).forEach(function(nombre) {
    var c = cuentas[nombre];
    if (c && c.salt && c.hash && v3Hash_(c.salt+':'+clave+':'+pepper) === c.hash) {
      coincidencias.push({servicio:nombre,rol:c.rol});
    }
  });
  // Si hay claves iguales entre servicios, no se permite acceder ambiguamente.
  if (coincidencias.length !== 1) throw Error('Credenciales incorrectas');
  var cuenta = coincidencias[0];
  if (solicitado && solicitado !== cuenta.servicio) throw Error('Credenciales incorrectas');
  var token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('v3:'+token,JSON.stringify(cuenta),V3.sesionMinutos*60);
  return {status:'success',token:token,servicio:cuenta.servicio,rol:cuenta.rol,expiraMinutos:V3.sesionMinutos};
}
function v3Sesion_(token) {
  if (!/^[a-f\d-]{72}$/.test(String(token || ''))) throw Error('Sesión inválida');
  var val = CacheService.getScriptCache().get('v3:'+token);
  if (!val) throw Error('Sesión vencida: volver a ingresar');
  return JSON.parse(val);
}
function v3Rows_(s) {
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues();
}
function v3EsGestion_(sesion) {
  return ['COCINA','NUTRICION','ADMIN'].includes(sesion.rol);
}
function v3Personal_(sesion) {
  if (!['WEB','SUPERVISOR','ADMIN'].includes(sesion.rol)) throw Error('Acceso denegado');
  var rows = v3Rows_(v3Planilla_().getSheetByName(V3.personal));
  return {status:'success', personas:rows.filter(function(r){
    return v3Norm_(r[4]) !== 'NO' && v3Norm_(r[4]) !== 'FALSE' && (sesion.rol==='ADMIN' || v3Norm_(r[2])===sesion.servicio);
  }).map(function(r){return {id:String(r[0]),nombre:String(r[1]),servicio:String(r[2]),dieta:String(r[3]||'GENERAL')};})};
}
function v3FechaClave_(valor, zonaHoraria) {
  // Sheets puede devolver Date aunque el valor se haya escrito como texto ISO.
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, zonaHoraria, 'yyyy-MM-dd');
  }
  var s = String(valor == null ? '' : valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var es = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (es) return es[3] + '-' + es[2] + '-' + es[1];
  throw Error('Fecha inválida en Pedidos_V3: ' + s);
}
function v3Hoy_(ss) {return Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyy-MM-dd');}

/**
 * Identidad de un pedido. Dos filas para una misma persona/servicio/comida
 * se consideran repetidas aunque provengan de mecanismos diferentes.
 * Los nombres se usan solo para detectar coincidencias, NO como identificador único
 * de largo plazo: personas homónimas requieren revisión manual.
 */
function v3NombreClave_(v) {
  return v3Norm_(v).replace(/\\s+/g,' ').trim();
}
function v3PedidoClave_(nombre,servicio,turno) {
  return v3Norm_(servicio)+'|'+v3NombreClave_(nombre)+'|'+v3Norm_(turno);
}
function v3Turnos_(guardia,turno) {
  var g=String(guardia||'12'),t=v3Norm_(turno||'MAÑANA');
  if (!['12','16','20','24'].includes(g)) throw Error('Guardia no válida');
  if (!['MANANA','NOCHE'].includes(t)) throw Error('Comida inválida');
  return {guardia:g,turnos:g==='24'?['MAÑANA','NOCHE']:[t==='MANANA'?'MAÑANA':'NOCHE']};
}
function v3PedidosHoy_(ss) {
  var hoy=v3Hoy_(ss),zona=ss.getSpreadsheetTimeZone();
  return v3Rows_(ss.getSheetByName(V3.pedidos)).filter(function(r){
    return v3FechaClave_(r[1],zona)===hoy && v3Norm_(r[8])!=='ANULADO';
  });
}

function v3Registrar_(sesion,p) {
  if (!['WEB','SUPERVISOR','ADMIN'].includes(sesion.rol)) throw Error('Permiso insuficiente');
  if (!Array.isArray(p.ids) || !p.ids.length || p.ids.length>250) throw Error('Selección inválida');
  if (sesion.rol==='WEB' && p.ids.length!==1) throw Error('WEB admite un registro por operación');
  var timing=v3Turnos_(p.guardia,p.turno);
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw Error('Sistema ocupado, reintentar');
  try {
    var ss=v3Planilla_(), personal=ss.getSheetByName(V3.personal),pedidos=ss.getSheetByName(V3.pedidos);
    var roster=new Map(v3Rows_(personal).map(function(r){return [String(r[0]).trim(),r];}));
    var existentes=new Set();
    v3PedidosHoy_(ss).forEach(function(r){
      existentes.add('ID|'+String(r[3]).trim()+'|'+v3Norm_(r[2]));
      existentes.add('NOMBRE|'+v3PedidoClave_(r[4],r[5],r[2]));
    });
    var ids=[...new Set(p.ids.map(function(v){return String(v).trim();}))];
    var insertar=[],repetidos=[],lote=Utilities.getUuid(),hoy=v3Hoy_(ss);
    ids.forEach(function(id){
      var r=roster.get(id);
      if(!r || !String(r[1]).trim() || ['NO','FALSE'].includes(v3Norm_(r[4]))) throw Error('Trabajador no habilitado');
      if(sesion.rol!=='ADMIN' && v3Norm_(r[2])!==sesion.servicio) throw Error('Trabajador de otro servicio: acceso denegado');
      timing.turnos.forEach(function(t){
        var porId='ID|'+id+'|'+v3Norm_(t), porNombre='NOMBRE|'+v3PedidoClave_(r[1],r[2],t);
        if(existentes.has(porId)||existentes.has(porNombre)){repetidos.push({id:id,turno:t});return;}
        existentes.add(porId);existentes.add(porNombre);
        insertar.push([Utilities.getUuid(),hoy,t,id,String(r[1]),String(r[2]),timing.guardia,String(r[3]||'GENERAL'),'PENDIENTE','',sesion.rol==='WEB'?'WEB':'SUPERVISOR',lote]);
      });
    });
    if(insertar.length) pedidos.getRange(pedidos.getLastRow()+1,1,insertar.length,12).setValues(insertar);
    v3Auditar_(ss,'REGISTRAR',sesion.servicio,'Añadidos '+insertar.length+', repetidos '+repetidos.length+', lote '+lote);
    return {status:'success',creados:insertar.length,duplicados:repetidos,lote:lote};
  } finally {lock.releaseLock();}
}

/**
 * Alta manual puntual para seguridad/policía/residencia: sin DNI y sin
 * agregar a la nómina permanente. Un supervisor registra únicamente
 * para su sector; ADMIN debe indicar el sector explícitamente.
 */
function v3RegistrarManual_(sesion,p) {
  if(!['SUPERVISOR','ADMIN'].includes(sesion.rol)) throw Error('Permiso insuficiente');
  var nombre=String(p.nombre||'').trim().replace(/\\s+/g,' ');
  if(nombre.length<5 || nombre.length>100 || !/^[\\p{L}\\p{M} .'-]+$/u.test(nombre) || nombre.split(' ').length<2) throw Error('Nombre inválido');
  var categoria=v3Norm_(p.categoria);
  if(!['POLICIA','SEGURIDAD','RESIDENTE'].includes(categoria)) throw Error('Categoría inválida');
  var dieta=v3Norm_(p.dieta||'GENERAL');
  if(!['GENERAL','HIPOSODICA','CELIACA','VEGETARIANA','DIABETICA'].includes(dieta)) throw Error('Dieta inválida');
  var servicio=sesion.rol==='ADMIN'?v3Norm_(p.servicio):sesion.servicio;
  if(!servicio || servicio.length>60) throw Error('Servicio inválido');
  var timing=v3Turnos_(p.guardia,p.turno),lock=LockService.getScriptLock();
  if(!lock.tryLock(30000)) throw Error('Sistema ocupado, reintentar');
  try {
    var ss=v3Planilla_(),pedidos=ss.getSheetByName(V3.pedidos),hoy=v3Hoy_(ss);
    // Impedir cargar manualmente a una persona ya presente en la nómina del sector.
    var estaEnNomina=v3Rows_(ss.getSheetByName(V3.personal)).some(function(r){
      return v3Norm_(r[2])===servicio && v3NombreClave_(r[1])===v3NombreClave_(nombre)
        && !['NO','FALSE'].includes(v3Norm_(r[4]));
    });
    if(estaEnNomina) throw Error('La persona ya está en la nómina; seleccionála desde el listado');
    var existentes=new Set(v3PedidosHoy_(ss).map(function(r){return v3PedidoClave_(r[4],r[5],r[2]);}));
    var nuevo=[],duplicados=[],lote=Utilities.getUuid();
    timing.turnos.forEach(function(t){
      var clave=v3PedidoClave_(nombre,servicio,t);
      if(existentes.has(clave)){duplicados.push({nombre:nombre,turno:t});return;}
      existentes.add(clave);
      nuevo.push([Utilities.getUuid(),hoy,t,'MAN-'+Utilities.getUuid(),nombre,servicio,timing.guardia,dieta,'PENDIENTE','','MANUAL:'+categoria,lote]);
    });
    if(nuevo.length) pedidos.getRange(pedidos.getLastRow()+1,1,nuevo.length,12).setValues(nuevo);
    v3Auditar_(ss,'REGISTRAR_MANUAL',servicio,'Categoría '+categoria+', añadidos '+nuevo.length+', repetidos '+duplicados.length+', lote '+lote);
    return {status:'success',creados:nuevo.length,duplicados:duplicados,lote:lote};
  } finally {lock.releaseLock();}
}
function v3Listado_(sesion,p) {
  if(!v3EsGestion_(sesion)) throw Error('Acceso denegado');
  var turno=v3Norm_(p.turno||'MAÑANA');
  if(!['MANANA','NOCHE'].includes(turno)) throw Error('Turno inválido');
  var ss=v3Planilla_();
  var rows=v3PedidosHoy_(ss).filter(function(r){return v3Norm_(r[2])===turno;});
  var canonic=new Map(),cuentas=new Map();
  rows.forEach(function(r,i){
    var key=v3PedidoClave_(r[4],r[5],r[2]);
    cuentas.set(key,(cuentas.get(key)||0)+1);
    // Preferir el ya entregado para que no se habilite otra entrega.
    if(!canonic.has(key)||v3Norm_(r[8])==='ENTREGADO') canonic.set(key,i);
  });
  return {status:'success',pedidos:rows.map(function(r,i){
    var key=v3PedidoClave_(r[4],r[5],r[2]);
    return {id:String(r[0]),nombre:String(r[4]),servicio:String(r[5]),guardia:String(r[6]),
      dieta:String(r[7]),estado:String(r[8]),hora:r[9]?String(r[9]):'',
      tipo:String(r[10]),duplicado:canonic.get(key)!==i,grupoDuplicado:cuentas.get(key)>1};
  })};
}
function v3Entrega_(sesion,p) {
  if (!['COCINA','ADMIN'].includes(sesion.rol)) throw Error('Solo Cocina puede validar o revertir');
  var id=String(p.id||''),revertir=p.revertir===true;
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw Error('Sistema ocupado');
  try {
    var ss=v3Planilla_(),s=ss.getSheetByName(V3.pedidos),rows=v3Rows_(s);
    for(var i=0;i<rows.length;i++){
      if(String(rows[i][0])!==id) continue;
      var estado=String(rows[i][8]);
      if (estado!==(revertir?'ENTREGADO':'PENDIENTE')) throw Error('Estado incompatible');
      if(!revertir){
        var objetivo=rows[i],key=v3PedidoClave_(objetivo[4],objetivo[5],objetivo[2]);
        var fecha=v3FechaClave_(objetivo[1],ss.getSpreadsheetTimeZone());
        var iguales=rows.filter(function(r){
          return v3FechaClave_(r[1],ss.getSpreadsheetTimeZone())===fecha &&
            v3Norm_(r[8])!=='ANULADO' && v3PedidoClave_(r[4],r[5],r[2])===key;
        });
        if(iguales.some(function(r){return v3Norm_(r[8])==='ENTREGADO';}))
          throw Error('Ya existe una entrega de esta persona para esta comida');
        if(iguales.length>1 && String(iguales[0][0])!==id)
          throw Error('El pedido seleccionado es un duplicado histórico; no se puede entregar');
      }
      s.getRange(i+2,9).setValue(revertir?'PENDIENTE':'ENTREGADO');
      s.getRange(i+2,10).setValue(revertir?'':new Date());
      v3Auditar_(ss,revertir?'REVERTIR':'ENTREGAR',sesion.servicio,id);
      return {status:'success',id:id,estado:revertir?'PENDIENTE':'ENTREGADO'};
    }
    throw Error('Pedido inexistente');
  } finally {lock.releaseLock();}
}
function v3Auditar_(ss,accion,servicio,detalle){
  ss.getSheetByName(V3.auditoria).appendRow([new Date(),accion,servicio,detalle]);
}
