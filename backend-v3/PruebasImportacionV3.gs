/**
 * Prueba sin escritura de importación masiva V3. No carga personal.
 */
function pruebasImportacionNominaSoloLecturaV3() {
 var total=0;
 function ok(n,v){if(!v)throw Error('FALLO: '+n);total++;Logger.log('OK: '+n);}
 function falla(n,fn,msg){var e='';try{fn()}catch(x){e=String(x.message||'')}ok(n,e.indexOf(msg)>=0)}
 var admin={rol:'ADMIN',servicio:'ADMIN'},cocina={rol:'COCINA',servicio:'COCINA'};
 falla('Cocina no puede importar nómina',function(){
   v3ImportarNomina_(cocina,{filas:[{nombre:'Persona Prueba',servicio:'ENFERMERIA',dieta:'GENERAL'}]});
 },'Solo Administración puede importar personal');
 falla('Nómina vacía rechazada',function(){v3NormalizarImportacion_([])},'La importación admite');
 falla('No admite nombres incompletos',function(){v3NormalizarImportacion_([
   {nombre:'Ana',servicio:'ENFERMERIA',dieta:'GENERAL'}
 ])},'Importación inválida');
 falla('No admite dietas desconocidas',function(){v3NormalizarImportacion_([
   {nombre:'Persona Prueba',servicio:'ENFERMERIA',dieta:'SIN DIETA'}
 ])},'Importación inválida');
 falla('Detecta dos personas iguales en lote',function(){v3NormalizarImportacion_([
   {nombre:'Persona Prueba',servicio:'ENFERMERIA',dieta:'GENERAL'},
   {nombre:'persona prueba',servicio:'Enfermeria',dieta:'GENERAL'}
 ])},'Importación inválida');
 falla('Evita fórmulas en celdas',function(){v3NormalizarImportacion_([
   {nombre:'=SUM(1,2)',servicio:'ENFERMERIA',dieta:'GENERAL'}
 ])},'Importación inválida');
 var filas=v3NormalizarImportacion_([
   {nombre:'Persona Prueba',servicio:'ENFERMERIA',dieta:'GENERAL'},
   {nombre:'Otra Persona',servicio:'TRAUMATOLOGIA',dieta:'CELIACA'}
 ]);
 ok('Normaliza dos personas',filas.length===2&&filas[1].dieta==='CELIACA');
 var preview=v3ImportarNomina_(admin,{filas:filas,confirmar:false});
 ok('ADMIN obtiene vista previa sin escritura',preview.status==='success'&&!preview.confirmado&&preview.recibidos===2);
 ok('Total se divide entre nuevos y existentes',preview.nuevos+preview.existentes===2);
 Logger.log('RESULTADO: '+total+'/9 pruebas de importación (sin escritura)');
}
