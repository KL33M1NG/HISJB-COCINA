/** Regresión V3 del cierre de turno: SOLO LECTURA. */
function pruebasCierreSeguroSoloLecturaV3(){
 var n=0;
 function ok(nombre,v){if(!v)throw Error('FALLO: '+nombre);n++;Logger.log('OK: '+nombre);}
 function bloquea(nombre,fn,m){
  var err='';try{fn()}catch(e){err=String(e.message||'')}
  ok(nombre,err.indexOf(m)>=0);
 }
 var rows=[
 ['a','2026-11-21','MAÑANA','x','Persona Uno','ENFERMERIA','12','GENERAL','ENTREGADO'],
 ['b','2026-11-21','MAÑANA','y','Persona Dos','ENFERMERIA','12','CELIACA','PENDIENTE'],
 ['c','2026-11-21','MAÑANA','z','Persona Tres','TRAUMATOLOGIA','12','GENERAL','PENDIENTE'],
 ['d','2026-11-21','NOCHE','z','Persona Tres','TRAUMATOLOGIA','12','GENERAL','PENDIENTE']
 ];
 var snapshot=JSON.stringify(rows),prev=v3EstadisticasTurno_(rows,'MAÑANA'),projected=v3ProyectarCierre_(rows,'MAÑANA');
 ok('Resumen previo de almuerzo 3 pedidos',prev.total===3&&prev.entregados===1&&prev.pendientes===2);
 ok('Proyección sin pendientes',projected.total===3&&projected.entregados===1&&projected.pendientes===0&&projected.noEntregados===2);
 ok('Proyección no modifica los pedidos',JSON.stringify(rows)===snapshot);
 ok('Cena independiente',v3ProyectarCierre_(rows,'NOCHE').noEntregados===1);
 ok('Desglose conserva dietas y servicios',projected.dietas.CELIACA.noEntregados===1&&projected.servicios.TRAUMATOLOGIA.noEntregados===1);
 bloquea('Turno desconocido es rechazado',function(){v3ProyectarCierre_(rows,'INVALIDO')},'Turno inválido');
 bloquea('WEB no puede diagnosticar cierres',function(){v3DiagnosticarCierre_({rol:'WEB'}, {turno:'MAÑANA'})},'Solo Administración puede revisar cierres');
 bloquea('Cocina no puede reconciliar cierre',function(){v3ReconciliarCierre_({rol:'COCINA'},{turno:'MAÑANA',confirmacion:true})},'Solo Administración puede reparar cierres');
 bloquea('ADMIN requiere confirmación para reconciliar',function(){v3ReconciliarCierre_({rol:'ADMIN'},{turno:'MAÑANA',confirmacion:false})},'Confirmación de cierre incorrecta');
 var hoy=v3Hoy_(v3Planilla_());
 var cierre=v3CierreExiste_(v3Planilla_(),hoy,'MAÑANA');
 if(cierre){
   bloquea('No se permite cierre duplicado',function(){v3ExigirAbierto_(v3Planilla_(),['MAÑANA'])},'El turno ya está cerrado');
 }else{
   ok('El turno de prueba todavía no se ha cerrado hoy',true);
 }
 Logger.log('RESULTADO: '+n+'/10 pruebas de cierre seguro (sin escritura)');
}
