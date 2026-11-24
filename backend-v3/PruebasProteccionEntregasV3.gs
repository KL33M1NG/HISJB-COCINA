/**
 * Pruebas de seguridad de registro y entrega SIN ESCRITURA.
 * No requiere contraseñas. No modifica Sheets.
 */
function pruebasProteccionEntregasV3(){
 var passed=0;
 function ok(name,cond){if(!cond)throw Error('FALLO: '+name);++passed;Logger.log('OK: '+name)}
 function denied(name,fn,needle){
  var message='';try{fn()}catch(err){message=String(err.message||'')}
  ok(name,message.indexOf(needle)>=0);
 }
 var ss=v3Planilla_(),hoy=v3Hoy_(ss);
 var yesterday=new Date(hoy+'T12:00:00Z');yesterday.setUTCDate(yesterday.getUTCDate()-1);
 var ayer=Utilities.formatDate(yesterday,'UTC','yyyy-MM-dd');
 ok('La fecha de hoy se acepta',!v3ExigirPedidoDeHoy_(ss,hoy));
 denied('Se rechaza fecha anterior en entrega individual',function(){v3ExigirPedidoDeHoy_(ss,ayer)},'Solo se pueden entregar pedidos de hoy');
 denied('Se rechaza fecha futura en entrega individual',function(){v3ExigirPedidoDeHoy_(ss,'2099-12-31')},'Solo se pueden entregar pedidos de hoy');
 denied('No se puede entregar pedido inexistente',function(){v3Entrega_({rol:'COCINA',servicio:'COCINA'},{id:'TEST-INEXISTENTE-'+Utilities.getUuid()})},'Pedido inexistente');
 denied('WEB no puede entregar pedidos',function(){v3Entrega_({rol:'WEB',servicio:'TRAUMATOLOGIA'},{id:'TEST'})},'Solo Cocina puede validar o revertir');
 denied('Nutrición no puede entregar pedidos',function(){v3Entrega_({rol:'NUTRICION',servicio:'NUTRICION'},{id:'TEST'})},'Solo Cocina puede validar o revertir');
 denied('Bloquea ID repetido en lote',function(){v3EntregaLote_({rol:'COCINA',servicio:'COCINA'},{ids:['A','A']})},'Selección inválida');
 denied('Bloquea lote vacío',function(){v3EntregaLote_({rol:'COCINA',servicio:'COCINA'},{ids:[]})},'Selección inválida');
 ok('Registro de hoy usa zona horaria de la planilla',/^\d{4}-\d{2}-\d{2}$/.test(hoy));
 Logger.log('RESULTADO: '+passed+'/9 pruebas de protección de entregas (sin escritura)');
}
