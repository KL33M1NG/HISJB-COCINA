/**
 * HISJB V3 — respaldos PRIVADOS de la planilla de PRUEBAS.
 * No guarda copias en GitHub ni envía nombres del personal al cliente.
 * La restauración automática está deliberadamente deshabilitada.
 */
var V3_BACKUP_FOLDER_PROP_='HISJB_V3_BACKUP_FOLDER_ID';
var V3_BACKUP_TRIGGER_HANDLER_='v3RespaldoDiarioProgramado';
var V3_BACKUP_REQUIRED_={
 'Personal_V3':['ID_PERSONAL','NOMBRE','SERVICIO','DIETA','ACTIVO'],
 'Pedidos_V3':['ID','FECHA','TURNO','ID_PERSONAL','NOMBRE','SERVICIO','GUARDIA','DIETA','ESTADO','HORA_ENTREGA','TIPO','LOTE'],
 'Auditoria_V3':['FECHA_HORA','ACCION','SERVICIO','DETALLE'],
 'Menu_V3':['FECHA','TURNO','PLATO','POSTRE','GENERAL','HIPOSODICA','DIABETICA','CELIACA','GASTRICA','ASTRINGENTE','VEGETARIANA','SERVICIO_EDITOR','ACTUALIZADO_EN','VERSION'],
 'Avisos_V3':['FECHA','TEXTO','SERVICIO_EDITOR','ACTUALIZADO_EN','VERSION'],
 'Cierres_V3':['FECHA','TURNO','FECHA_HORA_CIERRE','TOTAL','ENTREGADOS','NO_ENTREGADOS','DUPLICADOS_HISTORICOS','RESUMEN_DIETAS_JSON','RESUMEN_SERVICIOS_JSON','RESPONSABLE']
};
function v3BackupFolder_(){
 var folderId=PropertiesService.getScriptProperties().getProperty(V3_BACKUP_FOLDER_PROP_);
 if(!folderId||!/^[a-zA-Z0-9_-]{15,}$/.test(folderId))
   throw Error('Falta configurar la carpeta privada de respaldos V3');
 var folder=DriveApp.getFolderById(folderId);
 if(folder.isTrashed())throw Error('Carpeta de respaldos V3 en papelera');
 return folder;
}
/** Devuelve solo tamaños, no devuelve contenido ni nombres de trabajadores. */
function v3BackupInventario_(ss){
 var resultado={},correcto=true;
 Object.keys(V3_BACKUP_REQUIRED_).forEach(function(name){
  var hoja=ss.getSheetByName(name),cab=V3_BACKUP_REQUIRED_[name],valid=false,cantidad=0;
  if(hoja){
   cantidad=Math.max(hoja.getLastRow()-1,0);
   var actual=hoja.getRange(1,1,1,cab.length).getDisplayValues()[0];
   valid=cab.every(function(col,i){return actual[i]===col});
  }else if(name==='Cierres_V3'){
   // La hoja de cierres puede faltar antes del primer cierre.
   valid=true;
  }
  resultado[name]={filas:cantidad,encabezadosCorrectos:valid,presente:!!hoja};
  if(!valid)correcto=false;
 });
 return {correcto:correcto,hojas:resultado};
}
function v3BackupListar_(sesion){
 if(sesion.rol!=='ADMIN')throw Error('Solo Administración puede gestionar respaldos');
 var ss=v3Planilla_(),folder=v3BackupFolder_();
 var files=folder.getFiles(),list=[];
 while(files.hasNext()){
   var f=files.next();
   if(f.isTrashed()||f.getMimeType()!==MimeType.GOOGLE_SHEETS||
      !/^HISJB-V3-PRUEBAS-/.test(f.getName()))continue;
   list.push({id:f.getId(),nombre:f.getName(),fecha:f.getDateCreated().getTime()});
 }
 list.sort(function(a,b){return b.fecha-a.fecha});
 list=list.slice(0,12).map(function(f){
  return {id:f.id,nombre:f.nombre,fecha:Utilities.formatDate(new Date(f.fecha),ss.getSpreadsheetTimeZone(),'dd/MM/yyyy HH:mm')};
 });
 return {status:'success',cantidad:list.length,respaldos:list,
   inventarioActual:v3BackupInventario_(ss),programado:v3BackupProgramado_()};
}
function v3BackupNombre_(ss,ahora){
 return 'HISJB-V3-PRUEBAS-'+Utilities.formatDate(ahora,ss.getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss');
}
/** Bajo script lock: evita copias en medio de escrituras propias de V3. */
function v3BackupCrear_(sesion){
 if(sesion.rol!=='ADMIN')throw Error('Solo Administración puede gestionar respaldos');
 return v3BackupCrearSeguro_('MANUAL',sesion.servicio);
}
function v3BackupCrearSeguro_(tipo,responsable){
 var lock=LockService.getScriptLock();
 if(!lock.tryLock(30000))throw Error('Sistema ocupado');
 try{
  var ss=v3Planilla_(),folder=v3BackupFolder_();
  var source=DriveApp.getFileById(ss.getId());
  if(source.getId()===folder.getId())throw Error('Configuración de respaldo inválida');
  var inv=v3BackupInventario_(ss);
  if(!inv.correcto)throw Error('Encabezados inválidos en la planilla V3');
  SpreadsheetApp.flush();
  var name=v3BackupNombre_(ss,new Date()),copy=source.makeCopy(name,folder);
  try{
   var copiedSheet=SpreadsheetApp.openById(copy.getId()),validated=v3BackupInventario_(copiedSheet);
   if(!validated.correcto)throw Error('Respaldo creado, pero falló la verificación de encabezados');
   Object.keys(inv.hojas).forEach(function(key){
     if(inv.hojas[key].filas!==validated.hojas[key].filas)
       throw Error('Respaldo creado, pero los recuentos de filas no coinciden');
   });
  }catch(e){
   // No borrar automáticamente una copia cuya validación falló: revisar manualmente.
   throw Error('El respaldo requiere revisión manual en Drive');
  }
  // No auditar con nombres de personas ni registrar URL del archivo.
  v3Auditar_(ss,'RESPALDO_V3',responsable,tipo+'; resultado VERIFICADO');
  return {status:'success',nombre:name,verificado:true,hojas:Object.keys(inv.hojas).length};
 }finally{lock.releaseLock()}
}
/** Respaldo automático por trigger instalable, no llamado desde navegador. */
function v3RespaldoDiarioProgramado(){
 var propietario=Session.getEffectiveUser().getEmail();
 // La propiedad está en el proyecto V3 de pruebas, no compartida con el navegador.
 return v3BackupCrearSeguro_('PROGRAMADO',propietario?'SISTEMA':'SISTEMA');
}
function v3BackupProgramado_(){
 return ScriptApp.getProjectTriggers().some(function(t){
  return t.getHandlerFunction()===V3_BACKUP_TRIGGER_HANDLER_;
 });
}
/**
 * Ejecutar SOLO en editor privado V3 tras configurar la carpeta,
 * con la cuenta propietaria y autorización Drive.
 * Instala una sola tarea diaria, aprox. 02h zona del script.
 */
function v3InstalarRespaldoDiarioV3(){
 var props=PropertiesService.getScriptProperties();
 if(!props.getProperty(V3.hojaProp))throw Error('No se configuró planilla V3');
 v3BackupFolder_();
 if(v3BackupProgramado_())return 'El respaldo diario V3 ya estaba programado';
 ScriptApp.newTrigger(V3_BACKUP_TRIGGER_HANDLER_).timeBased().everyDays(1).atHour(2).create();
 return 'Respaldo diario V3 programado (aprox. 02:00, hora del proyecto)';
}
