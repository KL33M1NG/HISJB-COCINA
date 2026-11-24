/** Gestión exclusiva de ADMIN; no devuelve hashes, sales ni contraseñas. */
function v3AdminExigir_(s){if(s.rol!=='ADMIN')throw Error('Solo Administración puede gestionar personal y accesos');}
function v3AdminPersonal_(s){
 v3AdminExigir_(s);
 var rows=v3Rows_(v3Planilla_().getSheetByName(V3.personal)),cuentas=JSON.parse(PropertiesService.getScriptProperties().getProperty(V3.cuentasProp)||'{}');
 var servicios=new Set(['COCINA','NUTRICION']);
 var personas=rows.filter(function(r){return String(r[0]||'').trim()}).map(function(r){
  var servicio=v3Norm_(r[2]);if(servicio)servicios.add(servicio);
  return {id:String(r[0]),nombre:String(r[1]),servicio:servicio,dieta:String(r[3]||'GENERAL'),activo:!['NO','FALSE'].includes(v3Norm_(r[4]))};
 });
 Object.keys(cuentas).forEach(function(k){servicios.add(k)});
 return {status:'success',personas:personas,servicios:Array.from(servicios).sort().map(function(k){return {nombre:k,rol:cuentas[k]?cuentas[k].rol:null}})};
}
function v3AdminGuardarPersonal_(s,p){
 v3AdminExigir_(s);
 var dato=v3NormalizarImportacion_([{nombre:p.nombre,servicio:p.servicio,dieta:p.dieta}])[0];
 var id=String(p.id||''),lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw Error('Sistema ocupado');
 try{
  var ss=v3Planilla_(),hoja=ss.getSheetByName(V3.personal),rows=v3Rows_(hoja),pos=id?rows.findIndex(function(r){return String(r[0])===id}):-1;
  if(id&&pos<0)throw Error('Trabajador inexistente');
  if(rows.some(function(r,i){return i!==pos&&v3Norm_(r[2])+'|'+v3NombreClave_(r[1])===dato.key}))throw Error('Ya existe una persona con ese nombre en este servicio');
  if(pos>=0&&(v3Norm_(rows[pos][2])+'|'+v3NombreClave_(rows[pos][1])!==dato.key)&&v3PedidosHoy_(ss).some(function(r){return String(r[3])===id}))throw Error('La persona tiene pedidos de hoy; cambiá su nombre o servicio después de cerrar el día');
  if(!id)id='V3-'+Utilities.getUuid();
  var valores=[id,dato.nombre,dato.servicio,dato.dieta,p.activo===false?'NO':'SI'];
  if(pos<0)hoja.appendRow(valores);else hoja.getRange(pos+2,1,1,5).setValues([valores]);
  v3Auditar_(ss,'ADMIN_PERSONAL',s.servicio,pos<0?'Alta individual':'Actualización individual');
  return {status:'success'};
 }finally{lock.releaseLock()}
}
function v3AdminGuardarAcceso_(s,p){
 v3AdminExigir_(s);
 var servicio=v3Norm_(p.servicio),rol=v3Norm_(p.rol),clave=String(p.clave||'');
 if(!['WEB','SUPERVISOR','COCINA','NUTRICION'].includes(rol))throw Error('Rol incorrecto');
 if(clave.length<16||clave.length>128)throw Error('Requiere clave de 16 a 128 caracteres');
 var lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw Error('Sistema ocupado');
 try{
  var estado=v3AdminPersonal_(s),cuenta=estado.servicios.find(function(x){return x.nombre===servicio});
  if(!cuenta)throw Error('Servicio sin personal registrado');
  if(cuenta.rol==='ADMIN'||servicio==='ADMIN')throw Error('No se puede modificar el acceso ADMIN');
  if(cuenta.rol&&p.rotar!==true)throw Error('Servicio ya tiene una cuenta');
  if((rol==='COCINA'&&servicio!=='COCINA')||(rol==='NUTRICION'&&servicio!=='NUTRICION')||(['COCINA','NUTRICION'].includes(servicio)&&rol!==servicio))throw Error('Rol incorrecto');
  v3ProvisionarCuenta_(servicio,rol,clave);
  v3Auditar_(v3Planilla_(),'ADMIN_ACCESO',s.servicio,'Acceso de '+servicio+' ('+rol+') actualizado');
  return {status:'success'};
 }finally{lock.releaseLock()}
}
