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

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw Error('Solicitud vacía');
    var p = JSON.parse(e.postData.contents);
    var accion = String(p.accion || '');
    if (accion === 'login') return v3Salida_(v3Login_(p));
    var sesion = v3Sesion_(p.token);
    if (accion === 'personal') return v3Salida_(v3Personal_(sesion));
    if (accion === 'registrar') return v3Salida_(v3Registrar_(sesion, p));
    if (accion === 'listado') return v3Salida_(v3Listado_(sesion, p));
    if (accion === 'entrega') return v3Salida_(v3Entrega_(sesion, p));
    throw Error('Acción no permitida');
  } catch (err) {
    return v3Salida_({status:'error', message:String(err.message || err)});
  }
}

// Solo para una prueba de conectividad; no admite cambios ni devuelve datos del personal.
function doGet(e) {
  return v3Salida_({status:'ok', entorno:'V3_PRUEBAS', conectado:true});
}

function v3Planilla_() {
  var id = PropertiesService.getScriptProperties().getProperty(V3.hojaProp);
  if (!id) throw Error('Falta configurar hoja de PRUEBAS');
  return SpreadsheetApp.openById(id);
}

function v3HojasIniciales() {
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
function v3ProvisionarCuenta(servicio, rol, clave) {
  servicio = v3Norm_(servicio);
  rol = v3Norm_(rol);
  if (!['WEB','SUPERVISOR','COCINA','NUTRICION','ADMIN'].includes(rol)) throw Error('Rol incorrecto');
  if (!servicio || String(clave || '').length < 12) throw Error('Requiere servicio y clave de 12+ caracteres');
  var props = PropertiesService.getScriptProperties();
  var pepper = props.getProperty(V3.secretProp);
  if (!pepper) {pepper = Utilities.getUuid()+Utilities.getUuid();props.setProperty(V3.secretProp,pepper);}
  var cuentas = JSON.parse(props.getProperty(V3.cuentasProp) || '{}');
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
  var servicio = v3Norm_(p.servicio);
  var cuentas = JSON.parse(PropertiesService.getScriptProperties().getProperty(V3.cuentasProp) || '{}');
  var cuenta = cuentas[servicio];
  if (!cuenta) throw Error('Credenciales incorrectas');
  var pepper = PropertiesService.getScriptProperties().getProperty(V3.secretProp);
  if (v3Hash_(cuenta.salt+':'+String(p.clave || '')+':'+pepper) !== cuenta.hash) throw Error('Credenciales incorrectas');
  var token = Utilities.getUuid() + Utilities.getUuid();
  var sesion = {servicio:servicio,rol:cuenta.rol};
  CacheService.getScriptCache().put('v3:'+token,JSON.stringify(sesion),V3.sesionMinutos*60);
  return {status:'success', token:token, servicio:servicio, rol:cuenta.rol, expiraMinutos:V3.sesionMinutos};
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

function v3Registrar_(sesion,p) {
  if (!['WEB','SUPERVISOR','ADMIN'].includes(sesion.rol)) throw Error('Permiso insuficiente');
  if (!Array.isArray(p.ids) || p.ids.length===0 || p.ids.length>250) throw Error('Selección inválida');
  if (sesion.rol==='WEB' && p.ids.length!==1) throw Error('WEB admite un registro por operación');
  var guardia=String(p.guardia||'12');
  if (!['12','16','20','24'].includes(guardia)) throw Error('Guardia no válida');
  var turno=String(p.turno||'MAÑANA').toUpperCase();
  if (!['MAÑANA','NOCHE'].includes(turno)) throw Error('Comida inválida');
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw Error('Sistema ocupado, reintentar');
  try {
    var ss=v3Planilla_(), personal=ss.getSheetByName(V3.personal), pedidos=ss.getSheetByName(V3.pedidos);
    var roster = new Map(v3Rows_(personal).map(function(r){return [String(r[0]),r];}));
    var existentes = new Set(),hoy=v3Hoy_(ss);
    v3Rows_(pedidos).forEach(function(r){if(v3FechaClave_(r[1], ss.getSpreadsheetTimeZone())===hoy && v3Norm_(r[8])!=='ANULADO') existentes.add(String(r[3]).trim()+'|'+v3Norm_(r[2]));});
    var ids=[...new Set(p.ids.map(String))],insertar=[],repetidos=[],turnos=guardia==='24'?['MAÑANA','NOCHE']:[turno],lote=Utilities.getUuid();
    ids.forEach(function(id){
      var r=roster.get(id);
      if (!r || !String(r[1]).trim() || v3Norm_(r[4])==='NO' || v3Norm_(r[4])==='FALSE') throw Error('Trabajador no habilitado');
      if (sesion.rol!=='ADMIN' && v3Norm_(r[2])!==sesion.servicio) throw Error('Trabajador de otro servicio: acceso denegado');
      turnos.forEach(function(t){
        var key=id+'|'+t;
        if (existentes.has(key)){repetidos.push({id:id,turno:t});return;}
        existentes.add(key);
        insertar.push([Utilities.getUuid(),hoy,t,id,String(r[1]),String(r[2]),guardia,String(r[3]||'GENERAL'),'PENDIENTE','',sesion.rol==='WEB'?'WEB':'SUPERVISOR',lote]);
      });
    });
    if (insertar.length) pedidos.getRange(pedidos.getLastRow()+1,1,insertar.length,12).setValues(insertar);
    v3Auditar_(ss,'REGISTRAR',sesion.servicio, 'Añadidos '+insertar.length+', repetidos '+repetidos.length+', lote '+lote);
    return {status:'success',creados:insertar.length,duplicados:repetidos,lote:lote};
  } finally {lock.releaseLock();}
}
function v3Listado_(sesion,p) {
  if (!v3EsGestion_(sesion)) throw Error('Acceso denegado');
  var turno=String(p.turno||'MAÑANA').toUpperCase();
  if (!['MAÑANA','NOCHE'].includes(turno)) throw Error('Turno inválido');
  var ss=v3Planilla_(),hoy=v3Hoy_(ss);
  var rows=v3Rows_(ss.getSheetByName(V3.pedidos)).filter(function(r){return v3FechaClave_(r[1],ss.getSpreadsheetTimeZone())===hoy&&v3Norm_(r[2])===turno;});
  return {status:'success',pedidos:rows.map(function(r){return {id:r[0],nombre:r[4],servicio:r[5],guardia:r[6],dieta:r[7],estado:r[8],hora:r[9] ? String(r[9]) : ''};})};
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
