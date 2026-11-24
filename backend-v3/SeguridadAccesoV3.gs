/** Protección de acceso V3. Identificador aleatorio del navegador, no huella física.
 * Nunca almacenar contraseñas introducidas, ni siquiera las incorrectas.
 */
var V3_LOGIN_PREFIX_='HISJB_V3_LOGIN_DEVICE_';
var V3_LOGIN_WINDOW_MS_=30*60*1000;
var V3_LOGIN_MAX_TRACKED_=250;
function v3LoginDeviceKey_(id){
 if(typeof id!=='string'||!/^[a-f0-9]{48}$/.test(id))throw Error('No se pudo identificar el navegador. Actualizá la página');
 return V3_LOGIN_PREFIX_+v3Hash_('v3-device:'+id);
}
function v3LoginEstado_(props,key){var value=props.getProperty(key);return value?JSON.parse(value):null}
function v3LoginLimpiar_(props,now){
 var all=props.getProperties(),n=0;
 Object.keys(all).filter(function(k){return k.indexOf(V3_LOGIN_PREFIX_)===0}).forEach(function(k){
  var r=JSON.parse(all[k]);if(!r.bloqueado&&now-r.ultimo>V3_LOGIN_WINDOW_MS_)props.deleteProperty(k);else n++;
 });return n;
}
function v3LoginControlado_(p){
 var key=v3LoginDeviceKey_(p.dispositivo),props=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock();
 if(!lock.tryLock(3000))throw Error('Sistema ocupado, reintentar');
 try{
  var now=Date.now(),r=v3LoginEstado_(props,key);
  if(r&&r.bloqueado)throw Error('Navegador bloqueado. Contactá a Administración');
  if(r&&now-r.ultimo>V3_LOGIN_WINDOW_MS_){props.deleteProperty(key);r=null;}
  try{
   var login=v3Login_(p,key);if(r)props.deleteProperty(key);return login;
  }catch(err){
   if(String(err.message)!=='Credenciales incorrectas')throw err;
   if(!r&&v3LoginLimpiar_(props,now)>=V3_LOGIN_MAX_TRACKED_)throw Error('Sistema ocupado, reintentar');
   r=r||{intentos:0,primero:now,ultimo:now,bloqueado:false};
   r.intentos++;r.ultimo=now;if(r.intentos>=5){r.bloqueado=true;r.fechaBloqueo=now;}
   props.setProperty(key,JSON.stringify(r));
   if(r.bloqueado)throw Error('Navegador bloqueado. Contactá a Administración');
   throw Error('Credenciales incorrectas');
  }
 }finally{lock.releaseLock()}
}
function v3AdminSeguridad_(s){
 v3AdminExigir_(s);var props=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock();
 if(!lock.tryLock(3000))throw Error('Sistema ocupado, reintentar');
 try{
  v3LoginLimpiar_(props,Date.now());var all=props.getProperties(),lista=[];
  Object.keys(all).filter(function(k){return k.indexOf(V3_LOGIN_PREFIX_)===0}).forEach(function(k){var r=JSON.parse(all[k]);if(r.intentos>=2||r.bloqueado)lista.push({id:k.slice(V3_LOGIN_PREFIX_.length),intentos:r.intentos,primero:r.primero,ultimo:r.ultimo,bloqueado:r.bloqueado,fechaBloqueo:r.fechaBloqueo||null});});
  lista.sort(function(a,b){return Number(b.bloqueado)-Number(a.bloqueado)||b.ultimo-a.ultimo});
  return {status:'success',dispositivos:lista,bloqueados:lista.filter(function(r){return r.bloqueado}).length};
 }finally{lock.releaseLock()}
}
function v3AdminDesbloquear_(s,p){
 v3AdminExigir_(s);if(typeof p.id!=='string'||!/^[a-f0-9]{64}$/.test(p.id))throw Error('Identificador inválido');
 var props=PropertiesService.getScriptProperties(),key=V3_LOGIN_PREFIX_+p.id,lock=LockService.getScriptLock();
 if(!lock.tryLock(3000))throw Error('Sistema ocupado, reintentar');
 try{
  var r=v3LoginEstado_(props,key);if(!r||!r.bloqueado)throw Error('El navegador no está bloqueado');
  v3Auditar_(v3Planilla_(),'ADMIN_DESBLOQUEO',s.servicio,'Navegador '+p.id.slice(0,12)+' desbloqueado');
  props.deleteProperty(key);return {status:'success'};
 }finally{lock.releaseLock()}
}
