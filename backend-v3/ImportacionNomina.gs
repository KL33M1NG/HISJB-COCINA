/**
 * Importación masiva V3 para ADMIN — exclusivamente nómina Personal_V3.
 * El navegador envía filas estructuradas, nunca contraseñas ni hojas remotas.
 * Vista previa no modifica datos; confirmación valida nuevamente bajo lock.
 */
function v3NormalizarImportacion_(filas) {
  if(!Array.isArray(filas)||filas.length<1||filas.length>150)throw Error('La importación admite de 1 a 150 personas');
  var preparadas=[],claves=new Set(),errores=[];
  filas.forEach(function(f,i){
    var fila=i+1, nombre=String(f&&f.nombre||'').trim().replace(/\s+/g,' '),
      servicio=String(f&&f.servicio||'').trim().replace(/\s+/g,' '),
      dieta=v3Norm_(f&&f.dieta||'GENERAL');
    if(nombre.length<5||nombre.length>100||!/^[\p{L}\p{M} .'-]+$/u.test(nombre)||nombre.split(' ').length<2){
      errores.push('Fila '+fila+': nombre y apellido inválidos');return;
    }
    if(servicio.length<2||servicio.length>60||!/^[\p{L}\p{M}\d ._/-]+$/u.test(servicio)){
      errores.push('Fila '+fila+': servicio inválido');return;
    }
    if(!['GENERAL','HIPOSODICA','DIABETICA','CELIACA','GASTRICA','ASTRINGENTE','VEGETARIANA'].includes(dieta)){
      errores.push('Fila '+fila+': dieta inválida');return;
    }
    // Evitar caracteres iniciales que Google Sheets interpreta como fórmula.
    if(/^[=+@-]/.test(nombre)||/^[=+@-]/.test(servicio)){
      errores.push('Fila '+fila+': texto no válido');return;
    }
    var key=v3Norm_(servicio)+'|'+v3NombreClave_(nombre);
    if(claves.has(key)){errores.push('Fila '+fila+': persona repetida dentro de la importación');return;}
    claves.add(key);preparadas.push({nombre:nombre,servicio:v3Norm_(servicio),dieta:dieta,key:key});
  });
  if(errores.length)throw Error('Importación inválida: '+errores.slice(0,5).join('; '));
  return preparadas;
}
function v3ImportarNomina_(sesion,p) {
  if(sesion.rol!=='ADMIN')throw Error('Solo Administración puede importar personal');
  var filas=v3NormalizarImportacion_(p.filas),confirmar=p.confirmar===true;
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(30000))throw Error('Sistema ocupado');
  try{
    var ss=v3Planilla_(),hoja=ss.getSheetByName(V3.personal),rows=v3Rows_(hoja);
    var existentes=new Map(),ids=new Set(rows.map(function(r){return String(r[0]).trim();}));
    rows.forEach(function(r){
      var key=v3Norm_(r[2])+'|'+v3NombreClave_(r[1]);
      if(!existentes.has(key))existentes.set(key,r);
    });
    var nuevas=[],repetidas=[];
    filas.forEach(function(f){
      if(existentes.has(f.key)){repetidas.push({nombre:f.nombre,servicio:f.servicio});return;}
      nuevas.push(f);
    });
    var resultado={status:'success',recibidos:filas.length,nuevos:nuevas.length,
      existentes:repetidas.length,omitidos:repetidas.slice(0,30),confirmado:false};
    if(!confirmar)return resultado;
    if(!p.esperados||p.esperados.nuevos!==nuevas.length||
        p.esperados.existentes!==repetidas.length)throw Error('La nómina cambió: repetí la vista previa');
    // Todos los IDs se generan en servidor y nunca se reutilizan.
    var insert=[];
    nuevas.forEach(function(f){
      var id;
      do{id='V3-'+Utilities.getUuid();}while(ids.has(id));
      ids.add(id);insert.push([id,f.nombre,f.servicio,f.dieta,'SI']);
    });
    if(insert.length)hoja.getRange(hoja.getLastRow()+1,1,insert.length,5).setValues(insert);
    v3Auditar_(ss,'IMPORTAR_NOMINA',sesion.servicio,
      'Recibidos '+filas.length+', incorporados '+insert.length+', omitidos '+repetidas.length);
    resultado.confirmado=true;resultado.incorporados=insert.length;
    return resultado;
  }finally{lock.releaseLock();}
}
