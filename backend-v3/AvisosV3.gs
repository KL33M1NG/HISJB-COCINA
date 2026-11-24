/** Tres avisos en una única versión; conserva los cinco encabezados existentes. */
function v3AvisosVacios_(){return [1,2,3].map(function(){return {texto:'',activo:false,fijo:false,hasta:''}})}
function v3NormalizarAvisos_(avisos,hoy){
 if(!Array.isArray(avisos)||avisos.length>3)throw Error('Se admiten hasta tres avisos');
 var salida=v3AvisosVacios_();
 avisos.forEach(function(a,i){
  a=a||{};var texto=String(a.texto||'').trim(),fijo=a.fijo===true,activo=a.activo===true&&!!texto,hasta=fijo?'':String(a.hasta||hoy);
  if(texto.length>500)throw Error('Texto de aviso demasiado largo');
  if(!fijo&&activo){var d=new Date(hasta+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(hasta)||isNaN(d.getTime())||d.toISOString().slice(0,10)!==hasta||hasta<hoy)throw Error('Fecha de vencimiento inválida');}
  salida[i]={texto:texto,fijo:fijo,activo:activo,hasta:hasta};
 });return salida;
}
function v3LeerAvisos_(ss){
 var rows=v3Rows_(ss.getSheetByName(V3.avisos)),hoy=v3Hoy_(ss),avisos=v3AvisosVacios_(),version=rows.length;
 for(var i=rows.length-1;i>=0;i--){
  var r=rows[i],texto=String(r[1]||'');
  if(texto.indexOf('V3_ALERTAS:')===0){
   var datos=JSON.parse(texto.slice('V3_ALERTAS:'.length));
   if(!Array.isArray(datos)||datos.length!==3)throw Error('Configuración de avisos inválida');
   return {avisos:datos,version:version,hoy:hoy};
  }
  if(r[0]&&v3FechaClave_(r[0],ss.getSpreadsheetTimeZone())===hoy){avisos[0]={texto:texto,activo:!!texto,fijo:false,hasta:hoy};break;}
 }
 return {avisos:avisos,version:version,hoy:hoy};
}
function v3AvisosAdmin_(s){
 if(!['ADMIN','NUTRICION'].includes(s.rol))throw Error('Solo Nutrición puede editar menús y avisos');
 var estado=v3LeerAvisos_(v3Planilla_());estado.status='success';return estado;
}
