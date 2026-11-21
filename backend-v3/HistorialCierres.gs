/**
 * Historial de cierres diarios V3.
 * Lectura de resúmenes almacenados en Cierres_V3, no altera pedidos.
 * Acceso restringido a COCINA, NUTRICION o ADMIN.
 */
function v3HistorialCierres_(sesion,p) {
  if (!v3EsGestion_(sesion)) throw Error('Acceso denegado');
  var ss=v3Planilla_(),hoy=v3Hoy_(ss),hasta=String(p.hasta||hoy);
  var desde=String(p.desde||'');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hasta) ||
      (desde && !/^\d{4}-\d{2}-\d{2}$/.test(desde)))
    throw Error('Rango de fechas inválido');
  function fechaUtc(s) {
    var d=new Date(s+'T00:00:00Z');
    if (isNaN(d.getTime())||d.toISOString().slice(0,10)!==s)throw Error('Rango de fechas inválido');
    return d.getTime();
  }
  var max=fechaUtc(hasta);
  if(!desde){
    var d=new Date(max-29*86400000);
    desde=d.toISOString().slice(0,10);
  }
  var min=fechaUtc(desde);
  if(min>max || max-min>90*86400000)throw Error('Rango máximo: 91 días');
  var hoja=ss.getSheetByName('Cierres_V3'),zona=ss.getSpreadsheetTimeZone();
  var filas=hoja?v3Rows_(hoja):[];
  var cierres=[],resumen={total:0,entregados:0,noEntregados:0,duplicados:0,almuerzos:0,cenas:0,turnosCerrados:0};
  // Cargar solamente estadísticas agregadas. No devolver identificadores de pacientes/trabajadores.
  filas.forEach(function(r){
    var fecha=v3FechaClave_(r[0],zona);
    if(fecha<desde||fecha>hasta)return;
    var turno=v3TurnoCanonico_(r[1]);
    function datos(col) {
      try {
        var parsed=JSON.parse(String(col||'{}'));
        if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
        return parsed;
      }catch(e){return {};}
    }
    var item={fecha:fecha,turno:turno,fechaCierre:r[2] instanceof Date?
      Utilities.formatDate(r[2],zona,'dd/MM/yyyy HH:mm'):String(r[2]||''),
      total:Number(r[3])||0,entregados:Number(r[4])||0,noEntregados:Number(r[5])||0,
      duplicados:Number(r[6])||0,dietas:datos(r[7]),servicios:datos(r[8]),
      responsable:String(r[9]||'')};
    cierres.push(item);
    resumen.total+=item.total;resumen.entregados+=item.entregados;
    resumen.noEntregados+=item.noEntregados;resumen.duplicados+=item.duplicados;
    if(turno==='MAÑANA')resumen.almuerzos+=item.total;else resumen.cenas+=item.total;
    resumen.turnosCerrados++;
  });
  cierres.sort(function(a,b){return b.fecha.localeCompare(a.fecha)||
      (a.turno==='MAÑANA'?-1:1)});
  return {status:'success',desde:desde,hasta:hasta,registros:cierres,resumen:resumen};
}
