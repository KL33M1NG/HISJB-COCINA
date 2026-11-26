/**
 * HISJB Cocina V3 — Regresión sin escritura / sin contraseñas.
 * Ejecutar pruebasCocinaSoloLecturaV3 desde Apps Script DE PRUEBAS.
 */
function pruebasCocinaSoloLecturaV3() {
  var passed=0;
  function ok(nombre,condicion){if(!condicion)throw Error('FALLO: '+nombre);passed++;Logger.log('OK: '+nombre);}
  function denegar(nombre,fn,fragmento) {
    var denied=false;
    try{fn();}catch(e){denied=String(e.message).indexOf(fragmento)>=0}
    ok(nombre,denied);
  }
  var supervisor={rol:'SUPERVISOR',servicio:'ENFERMERIA'},cocina={rol:'COCINA',servicio:'COCINA'};
  denegar('Supervisor no puede cerrar turno',function(){
    v3CerrarTurno_(supervisor,{turno:'MAÑANA'});
  },'Solo Cocina o Nutrición puede cerrar turnos');
  denegar('Supervisor no puede entregar por lote',function(){
    v3EntregaLote_(supervisor,{ids:['TEST']});
  },'Solo Cocina o Nutrición puede validar o revertir');
  denegar('Nutrición tiene permiso de cierre, pero rechaza un turno inválido',function(){
    v3CerrarTurno_({rol:'NUTRICION',servicio:'NUTRICION'},{turno:'INEXISTENTE'});
  },'Turno inválido');
  denegar('Validación rechaza un turno inválido',function(){
    v3TurnoCanonico_('INEXISTENTE');
  },'Turno inválido');
  var f=[
    ['id1','2026-11-21','MAÑANA','A','Persona Uno','ENFERMERIA','12','GENERAL','ENTREGADO'],
    ['id2','2026-11-21','MAÑANA','A','Persona Uno','ENFERMERIA','12','GENERAL','PENDIENTE'],
    ['id3','2026-11-21','MAÑANA','B','Persona Dos','SEGURIDAD','12','CELIACA','PENDIENTE'],
    ['id4','2026-11-21','NOCHE','B','Persona Dos','SEGURIDAD','12','CELIACA','PENDIENTE']
  ];
  var resumen=v3EstadisticasTurno_(f,'MAÑANA');
  ok('Almuerzo deduplica filas históricas',resumen.total===2&&resumen.duplicadosHistoricos===1);
  ok('Resumen conserva prioridad a entregado',resumen.entregados===1&&resumen.pendientes===1);
  ok('Dietas por pedido único',resumen.dietas.GENERAL.entregados===1&&resumen.dietas.CELIACA.pendientes===1);
  ok('Cenas no se mezclan con almuerzos',v3EstadisticasTurno_(f,'NOCHE').total===1);
  var estado=v3EstadoTurno_(cocina,{turno:'MAÑANA'});
  ok('Consulta de estado protegida funciona',estado.status==='success'&&estado.resumen.total>=0);
  Logger.log('RESULTADO: '+passed+'/9 pruebas Cocina V3 (sin escritura)');
}

/** Historial V3: solo lectura y validación de permisos/fechas. */
function pruebasHistorialSoloLecturaV3() {
  var passed=0;
  function ok(nombre,cond){if(!cond)throw Error('FALLO: '+nombre);passed++;Logger.log('OK: '+nombre);}
  function rechaza(nombre,fn,frase){
    var error='';
    try{fn()}catch(e){error=String(e.message||'')}
    ok(nombre,error.indexOf(frase)>=0);
  }
  var cocina={rol:'COCINA',servicio:'COCINA'};
  var nutricion={rol:'NUTRICION',servicio:'NUTRICION'};
  var web={rol:'WEB',servicio:'TRAUMATOLOGIA'};
  rechaza('WEB no puede consultar cierres internos',function(){
    v3HistorialCierres_(web,{desde:'2026-11-01',hasta:'2026-11-21'});
  },'Acceso denegado');
  rechaza('Rechaza fechas inválidas',function(){
    v3HistorialCierres_(cocina,{desde:'2026-02-30',hasta:'2026-11-21'});
  },'Rango de fechas inválido');
  rechaza('Rechaza rango mayor a 91 días',function(){
    v3HistorialCierres_(cocina,{desde:'2026-01-01',hasta:'2026-11-21'});
  },'Rango máximo: 91 días');
  var c=v3HistorialCierres_(cocina,{desde:'2026-11-01',hasta:'2026-11-21'});
  ok('Cocina puede leer el historial',c.status==='success'&&Array.isArray(c.registros));
  var n=v3HistorialCierres_(nutricion,{desde:'2026-11-01',hasta:'2026-11-21'});
  ok('Nutrición puede leer el historial',n.status==='success'&&Array.isArray(n.registros));
  ok('Los resúmenes incluyen cifras',typeof c.resumen.total==='number'&&typeof c.resumen.entregados==='number');
  Logger.log('RESULTADO: '+passed+'/6 pruebas de historial (sin escritura)');
}
