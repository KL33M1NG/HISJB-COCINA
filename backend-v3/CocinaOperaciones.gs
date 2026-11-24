/**
 * HISJB Cocina V3 — Operaciones y cierre de turno. SOLO PRUEBAS.
 * Se usan los mismos bloqueos de Apps Script que los registros y entregas.
 */
function v3TurnoCanonico_(t) {
  var n=v3Norm_(t);
  if(n==='MANANA')return 'MAÑANA';
  if(n==='NOCHE')return 'NOCHE';
  throw Error('Turno inválido');
}
function v3CierreHoja_(ss) {
  return v3PrepararHoja_(ss,'Cierres_V3',[
    'FECHA','TURNO','FECHA_HORA_CIERRE','TOTAL','ENTREGADOS','NO_ENTREGADOS',
    'DUPLICADOS_HISTORICOS','RESUMEN_DIETAS_JSON','RESUMEN_SERVICIOS_JSON','RESPONSABLE'
  ]);
}
function v3CierreExiste_(ss,fecha,turno) {
  var hoja=ss.getSheetByName('Cierres_V3');
  if(!hoja||hoja.getLastRow()<2)return null;
  var zona=ss.getSpreadsheetTimeZone();
  for(var r of v3Rows_(hoja)){
    if(v3FechaClave_(r[0],zona)===fecha && v3Norm_(r[1])===v3Norm_(turno))
      return {fecha:fecha,turno:turno,fechaCierre:r[2] instanceof Date?
        Utilities.formatDate(r[2],zona,'dd/MM/yyyy HH:mm'):String(r[2]),
        total:Number(r[3])||0,entregados:Number(r[4])||0,
        noEntregados:Number(r[5])||0,duplicados:Number(r[6])||0};
  }
  return null;
}
function v3ExigirAbierto_(ss,turnos) {
  var fecha=v3Hoy_(ss);
  turnos.forEach(function(turno){
    if(v3CierreExiste_(ss,fecha,turno))throw Error('El turno ya está cerrado');
  });
}
function v3UnicosTurno_(rows,turno) {
  var seleccion=new Map(),cuentas=new Map(),t=v3Norm_(turno);
  rows.filter(function(r){return v3Norm_(r[2])===t && v3Norm_(r[8])!=='ANULADO';})
    .forEach(function(r){
      var clave=v3PedidoClave_(r[4],r[5],r[2]);
      cuentas.set(clave,(cuentas.get(clave)||0)+1);
      if(!seleccion.has(clave)||v3Norm_(r[8])==='ENTREGADO')seleccion.set(clave,r);
    });
  return {filas:[...seleccion.values()],duplicados:[...cuentas.values()].reduce(function(a,n){return a+Math.max(0,n-1)},0)};
}
function v3EstadisticasTurno_(rows,turno) {
  var data=v3UnicosTurno_(rows,turno),res={
    turno:turno,total:0,entregados:0,pendientes:0,noEntregados:0,
    duplicadosHistoricos:data.duplicados,dietas:{},servicios:{}
  };
  data.filas.forEach(function(r){
    res.total++;
    var estado=v3Norm_(r[8]),dieta=v3Norm_(r[7]||'GENERAL'),servicio=String(r[5]||'SIN SERVICIO');
    if(estado==='ENTREGADO')res.entregados++;
    else if(estado==='NO_ENTREGADO')res.noEntregados++;
    else res.pendientes++;
    if(!res.dietas[dieta])res.dietas[dieta]={total:0,entregados:0,pendientes:0,noEntregados:0};
    var d=res.dietas[dieta];d.total++;
    if(estado==='ENTREGADO')d.entregados++;
    else if(estado==='NO_ENTREGADO')d.noEntregados++;
    else d.pendientes++;
    if(!res.servicios[servicio])res.servicios[servicio]={total:0,entregados:0,pendientes:0,noEntregados:0};
    var svc=res.servicios[servicio];svc.total++;
    if(estado==='ENTREGADO')svc.entregados++;
    else if(estado==='NO_ENTREGADO')svc.noEntregados++;
    else svc.pendientes++;
  });
  return res;
}
function v3EstadoTurno_(sesion,p) {
  if(!v3EsGestion_(sesion))throw Error('Acceso denegado');
  var turno=v3TurnoCanonico_(p.turno),ss=v3Planilla_(),fecha=v3Hoy_(ss);
  return {status:'success',turno:turno,fecha:fecha,
    cierre:v3CierreExiste_(ss,fecha,turno),
    resumen:v3EstadisticasTurno_(v3PedidosHoy_(ss),turno)};
}
/** Validar por ID y lote de entregas en UNA operación; si un ID falla no modificar nada. */
function v3EntregaLote_(sesion,p) {
  if(!['COCINA','ADMIN'].includes(sesion.rol))throw Error('Solo Cocina puede validar o revertir');
  var ids=Array.isArray(p.ids)?p.ids.map(String):[];
  if(!ids.length||ids.length>150||new Set(ids).size!==ids.length||ids.some(function(x){return !x.trim();}))
    throw Error('Selección inválida');
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(30000))throw Error('Sistema ocupado');
  try{
    var ss=v3Planilla_(),hoja=ss.getSheetByName(V3.pedidos),rows=v3Rows_(hoja);
    var fecha=v3Hoy_(ss),zona=ss.getSpreadsheetTimeZone(),elegidos=[];
    ids.forEach(function(id){
      var pos=rows.findIndex(function(r){return String(r[0])===id});
      if(pos<0)throw Error('Pedido inexistente');
      var r=rows[pos],turno=v3TurnoCanonico_(r[2]);
      if(v3FechaClave_(r[1],zona)!==fecha)throw Error('Solo se pueden entregar pedidos de hoy');
      if(v3Norm_(r[8])!=='PENDIENTE')throw Error('Estado incompatible');
      v3ExigirAbierto_(ss,[turno]);
      elegidos.push({id:id,pos:pos,row:r,turno:turno});
    });
    var selectedKeys=new Set();
    elegidos.forEach(function(item){
      var r=item.row,key=v3PedidoClave_(r[4],r[5],r[2]);
      if(selectedKeys.has(key))throw Error('La selección incluye pedidos repetidos');
      selectedKeys.add(key);
      var iguales=rows.filter(function(other){
        return v3FechaClave_(other[1],zona)===fecha &&
          v3Norm_(other[8])!=='ANULADO' &&
          v3PedidoClave_(other[4],other[5],other[2])===key;
      });
      if(iguales.some(function(other){return v3Norm_(other[8])==='ENTREGADO';}))
        throw Error('Ya existe una entrega de esta persona para esta comida');
      if(iguales.length>1 && String(iguales[0][0])!==item.id)
        throw Error('El pedido seleccionado es un duplicado histórico; no se puede entregar');
    });
    var ahora=new Date();
    elegidos.forEach(function(item){
      hoja.getRange(item.pos+2,9,1,2).setValues([['ENTREGADO',ahora]]);
    });
    v3Auditar_(ss,'ENTREGA_LOTE',sesion.servicio,JSON.stringify({ids:ids,cantidad:ids.length}));
    return {status:'success',entregados:ids.length};
  }finally{lock.releaseLock();}
}
/** Proyecta el resultado del cierre sin tocar la hoja; útil para verificar el registro antes de escribir. */
function v3ProyectarCierre_(rows,turno) {
 var t=v3TurnoCanonico_(turno);
 return v3EstadisticasTurno_(rows.map(function(r){
   var c=r.slice();
   if(v3Norm_(c[2])===v3Norm_(t)&&v3Norm_(c[8])==='PENDIENTE')c[8]='NO_ENTREGADO';
   return c;
 }),t);
}
function v3CerrarTurno_(sesion,p) {
  if(!['COCINA','ADMIN'].includes(sesion.rol))throw Error('Solo Cocina puede cerrar turnos');
  var turno=v3TurnoCanonico_(p.turno),lock=LockService.getScriptLock();
  if(!lock.tryLock(30000))throw Error('Sistema ocupado');
  try{
    var ss=v3Planilla_(),hoy=v3Hoy_(ss),zona=ss.getSpreadsheetTimeZone();
    v3ExigirAbierto_(ss,[turno]);
    var hoja=ss.getSheetByName(V3.pedidos),rows=v3Rows_(hoja),original=v3EstadisticasTurno_(
      rows.filter(function(r){return v3FechaClave_(r[1],zona)===hoy;}),turno);
    if(p.confirmacion!==true)throw Error('Confirmación de cierre incorrecta');
    if(p.totalEsperado!==original.total || p.pendientesEsperados!==original.pendientes)
      throw Error('El turno cambió: actualizá el resumen antes de cerrar');
    // Solo filas pendientes del turno seleccionado. No tocar almuerzo y cena a la vez.
    var posiciones=[];
    rows.forEach(function(r,i){
      if(v3FechaClave_(r[1],zona)===hoy &&
         v3Norm_(r[2])===v3Norm_(turno) && v3Norm_(r[8])==='PENDIENTE')posiciones.push(i+2);
    });
    // BARRERA DE CIERRE: registrar primero la decisión bajo lock. Hasta que
    // exista esa fila, ninguna inscripción ni entrega queda bloqueada.
    // Después de appendRow + flush, las demás operaciones rechazan el turno.
    // Si la actualización de estados falla, ADMIN puede reconciliar
    // exclusivamente los pendientes de este cierre; no se reabre el turno.
    var rowsHoy=rows.filter(function(r){return v3FechaClave_(r[1],zona)===hoy});
    var cierre=v3ProyectarCierre_(rowsHoy,turno);
    var cierres=v3CierreHoja_(ss);
    cierres.appendRow([hoy,turno,new Date(),cierre.total,
      cierre.entregados,cierre.noEntregados,cierre.duplicadosHistoricos,
      JSON.stringify(cierre.dietas),JSON.stringify(cierre.servicios),sesion.servicio]);
    SpreadsheetApp.flush();
    posiciones.forEach(function(i){hoja.getRange(i,9).setValue('NO_ENTREGADO')});
    SpreadsheetApp.flush();
    v3Auditar_(ss,'CERRAR_TURNO',sesion.servicio,
      'Turno '+turno+', total '+cierre.total+', entregados '+cierre.entregados+
      ', no entregados '+cierre.noEntregados);
    return {status:'success',turno:turno,resumen:cierre};
  }finally{lock.releaseLock();}
}
