/** Validaciones solo lectura del sistema de respaldos V3. */
function pruebasRespaldosSoloLecturaV3(){
 var passed=0;
 function ok(name,value){if(!value)throw Error('FALLO: '+name);passed++;Logger.log('OK: '+name)}
 function denied(name,fn,fragment){
  var text='';try{fn()}catch(err){text=String(err.message||'')}
  ok(name,text.indexOf(fragment)>=0)
 }
 denied('COCINA no puede listar respaldos',function(){
  v3BackupListar_({rol:'COCINA'});
 },'Solo Administración puede gestionar respaldos');
 denied('WEB no puede crear respaldos',function(){
  v3BackupCrear_({rol:'WEB'});
 },'Solo Administración puede gestionar respaldos');
 denied('NUTRICION no puede crear respaldos',function(){
  v3BackupCrear_({rol:'NUTRICION'});
 },'Solo Administración puede gestionar respaldos');
 ok('Catálogo incluye hoja de pedidos',!!V3_BACKUP_REQUIRED_['Pedidos_V3']);
 ok('Catálogo incluye personal',!!V3_BACKUP_REQUIRED_['Personal_V3']);
 ok('Catálogo incluye auditoría',!!V3_BACKUP_REQUIRED_['Auditoria_V3']);
 ok('Catálogo incluye historial de cierres',!!V3_BACKUP_REQUIRED_['Cierres_V3']);
 ok('Nombre de la copia conserva marca de pruebas',
   v3BackupNombre_({getSpreadsheetTimeZone:function(){return 'America/Argentina/Buenos_Aires'}},new Date('2026-11-21T15:30:00Z'))
     .indexOf('HISJB-V3-PRUEBAS-')===0);
 // No ejecutar v3BackupCrearSeguro_ ni alterar propiedades, Drive o planillas.
 Logger.log('RESULTADO: '+passed+'/8 pruebas de respaldos (sin escritura)');
}
