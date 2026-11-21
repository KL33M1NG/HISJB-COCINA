/**
 * Diagnóstico y recuperación del cierre V3 — solo ADMIN.
 * Nunca modifica pedidos de turnos abiertos ni de otras fechas.
 */
function v3DiagnosticarCierre_(sesion,p) {
 if(sesion.rol!=='ADMIN')throw Error('Solo Administración puede revisar cierres');
 var turno=v3TurnoCanonico_(p.turno),ss=v3Planilla_(),hoy=v3Hoy_(ss);
 var cierre=v3CierreExiste_(ss,hoy,turno);
 if(!cierre)throw Error('No existe un cierre para este turno');
 var rows=v3Rows_(ss.getSheetByName(V3.pedidos)),zona=ss.getSpreadsheetTimeZone(),pendientes=0;
 var hoyRows=rows.filter(function(r){return v3FechaClave_(r[1],zona)===hoy});
 hoyRows.forEach(function(r){if(v3Norm_(r[2])===v3Norm_(turno)&&v3Norm_(r[8])==='PENDIENTE')pendientes++});
 var proyectado=v3ProyectarCierre_(hoyRows,turno);
 return {status:'success',fecha:hoy,turno:turno,cierre:cierre,
   filasPendientes:pendientes,coincide:proyectado.total===cierre.total&&
   proyectado.entregados===cierre.entregados&&proyectado.noEntregados===cierre.noEntregados&&
   proyectado.duplicadosHistoricos===cierre.duplicados};
}
function v3ReconciliarCierre_(sesion,p) {
 if(sesion.rol!=='ADMIN')throw Error('Solo Administración puede reparar cierres');
 if(p.confirmacion!==true)throw Error('Confirmación de cierre incorrecta');
 var turno=v3TurnoCanonico_(p.turno),lock=LockService.getScriptLock();
 if(!lock.tryLock(30000))throw Error('Sistema ocupado');
 try{
   var ss=v3Planilla_(),hoy=v3Hoy_(ss),cierre=v3CierreExiste_(ss,hoy,turno);
   if(!cierre)throw Error('No existe un cierre para este turno');
   var hoja=ss.getSheetByName(V3.pedidos),zona=ss.getSpreadsheetTimeZone(),rows=v3Rows_(hoja);
   var actuales=rows.filter(function(r){return v3FechaClave_(r[1],zona)===hoy});
   var esperado=v3ProyectarCierre_(actuales,turno);
   if(esperado.total!==cierre.total||esperado.entregados!==cierre.entregados||
      esperado.noEntregados!==cierre.noEntregados||
      esperado.duplicadosHistoricos!==cierre.duplicados)
      throw Error('Las cifras del cierre no coinciden: revisión manual obligatoria');
   var posiciones=[];
   rows.forEach(function(r,i){
     if(v3FechaClave_(r[1],zona)===hoy&&v3Norm_(r[2])===v3Norm_(turno)&&
        v3Norm_(r[8])==='PENDIENTE')posiciones.push(i+2);
   });
   posiciones.forEach(function(i){hoja.getRange(i,9).setValue('NO_ENTREGADO')});
   SpreadsheetApp.flush();
   v3Auditar_(ss,'RECONCILIAR_CIERRE',sesion.servicio,
     'Fecha '+hoy+' turno '+turno+' filas completadas '+posiciones.length);
   return {status:'success',reparadas:posiciones.length,turno:turno,fecha:hoy};
 }finally{lock.releaseLock()}
}
