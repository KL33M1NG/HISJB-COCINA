#!/usr/bin/env node
'use strict';
// Regresiones existentes con datos ficticios. No hay acceso a Google ni escrituras.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','backend-v3');
const noWrite=()=>{throw Error('Escritura no permitida en CI');};
const sheet={getLastRow:()=>1,getLastColumn:()=>12,getRange:()=>({getValues:()=>[],setValues:noWrite,setValue:noWrite}),appendRow:noWrite};
const planilla={getSpreadsheetTimeZone:()=> 'America/Argentina/Buenos_Aires',getSheetByName:()=>sheet};
const formatDate=(date,zone,format)=>{
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
 return format.replace(/yyyy|MM|dd|HH|mm|ss/g,x=>({yyyy:p.year,MM:p.month,dd:p.day,HH:p.hour,mm:p.minute,ss:p.second}[x]));
};
const context=vm.createContext({Logger:{log:console.log},Utilities:{formatDate,getUuid:()=> 'CI-FICTICIO'},
 PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'ID_FICTICIO_PRUEBAS',setProperty:noWrite,deleteProperty:noWrite})},
 SpreadsheetApp:{openById:()=>planilla,flush:noWrite},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})}});
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.gs'))){
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
for(const name of ['pruebasManualSoloLecturaV3','pruebasMenusSoloLecturaV3','pruebasCocinaSoloLecturaV3','pruebasHistorialSoloLecturaV3','pruebasCierreSeguroSoloLecturaV3','pruebasProteccionEntregasV3','pruebasImportacionNominaSoloLecturaV3','pruebasRespaldosSoloLecturaV3']){
 vm.runInContext(name+'()',context);
}
// Contrato de aislamiento de tareas administrativas y carpeta de copias.
// Entregas Nutrición: mismas reglas que Cocina, sin acceso al cierre.
{
 const saved=Object.fromEntries(['v3Planilla_','v3Rows_','v3Hoy_','v3ExigirAbierto_','v3Auditar_'].map(k=>[k,context[k]]));
 const hoy='2026-11-26',rows=[['A',hoy,'MAÑANA','P1','Persona Uno','ENFERMERIA','12','GENERAL','PENDIENTE'],['B',hoy,'MAÑANA','P2','Persona Dos','LABORATORIO','12','GENERAL','PENDIENTE']],audit=[];
 const hoja={getRange:(r,c)=>({setValue:v=>{rows[r-2][c-1]=v},setValues:v=>{v[0].forEach((x,i)=>rows[r-2][c-1+i]=x)}})};
 context.v3Planilla_=()=>({getSheetByName:()=>hoja,getSpreadsheetTimeZone:()=> 'America/Argentina/Buenos_Aires'});context.v3Rows_=()=>rows;context.v3Hoy_=()=>hoy;context.v3ExigirAbierto_=()=>{};context.v3Auditar_=(ss,a,s,d)=>audit.push([a,s]);
 const nutri={rol:'NUTRICION',servicio:'NUTRICION'};
 assert.equal(context.v3Entrega_(nutri,{id:'A'}).estado,'ENTREGADO');assert.equal(rows[0][8],'ENTREGADO');
 assert.throws(()=>context.v3Entrega_(nutri,{id:'A'}),/Estado incompatible/);
 assert.equal(context.v3Entrega_(nutri,{id:'A',revertir:true}).estado,'PENDIENTE');
 assert.equal(context.v3EntregaLote_(nutri,{ids:['A','B']}).entregados,2);assert.equal(rows[1][8],'ENTREGADO');
 assert.deepEqual(audit,[['ENTREGAR','NUTRICION'],['REVERTIR','NUTRICION'],['ENTREGA_LOTE','NUTRICION']]);
 assert.throws(()=>context.v3CerrarTurno_(nutri,{turno:'MAÑANA'}),/Solo Cocina puede cerrar/);
 context.v3ExigirAbierto_=()=>{throw Error('El turno ya está cerrado')};assert.throws(()=>context.v3Entrega_(nutri,{id:'A',revertir:true}),/turno ya está cerrado/);
 for(const rol of ['WEB','SUPERVISOR']){assert.throws(()=>context.v3Entrega_({rol},{id:'A'}),/Solo Cocina o Nutrición/);assert.throws(()=>context.v3EntregaLote_({rol},{ids:['B']}),/Solo Cocina o Nutrición/)}
 Object.assign(context,saved);
 console.log('OK: Nutrición entrega individual, reversión, lote, auditoría y límites de cierre (simulados).');
}
// Catálogo editable, con almacenamiento y auditoría ficticios (sin Google).
{
 const oldProps=context.PropertiesService,oldAudit=context.v3Auditar_,oldPlan=context.v3Planilla_;
 const categories=new Map(),audit=[];
 context.PropertiesService={getScriptProperties:()=>({getProperty:k=>categories.get(k)??null,setProperty:(k,v)=>categories.set(k,v)})};
 context.v3Planilla_=()=>({});context.v3Auditar_=(ss,a,s,d)=>audit.push([a,s,d]);
 const admin={rol:'ADMIN',servicio:'ADMIN'},supervisor={rol:'SUPERVISOR',servicio:'ENFERMERIA'};
 assert.equal(context.v3CategoriasManual_(supervisor).categorias.length,3);
 for(const rol of ['WEB','COCINA','NUTRICION','SUPERVISOR'])assert.throws(()=>context.v3AgregarCategoriaManual_({rol},{nombre:'Visitante'}),/Permiso insuficiente/);
 for(const rol of ['WEB','COCINA','NUTRICION'])assert.throws(()=>context.v3CategoriasManual_({rol}),/Permiso insuficiente/);
 assert.throws(()=>context.v3AgregarCategoriaManual_(admin,{nombre:'=ABC'}),/Categoría inválida/);
 assert.throws(()=>context.v3AgregarCategoriaManual_(admin,{nombre:' policía '}),/Categoría ya existente/);
 assert.equal(context.v3AgregarCategoriaManual_(admin,{nombre:'Acompañante'}).categorias.length,4);
 assert.equal(context.v3CategoriasManual_(supervisor).categorias[3].clave,'ACOMPANANTE');
 assert.throws(()=>context.v3AgregarCategoriaManual_(admin,{nombre:'ACOMPANANTE'}),/Categoría ya existente/);
 assert.throws(()=>context.v3RegistrarManual_(supervisor,{nombre:'Persona Ficticia',categoria:'NO EXISTE'}),/Categoría inválida/);
 assert.equal(audit.length,1);
 const savedFns=Object.fromEntries(['v3Hoy_','v3ExigirAbierto_','v3Rows_','v3PedidosHoy_'].map(k=>[k,context[k]]));
 let recorded=[];context.v3Planilla_=()=>({getSheetByName:()=>({getLastRow:()=>1,getRange:()=>({setValues:rows=>{recorded=rows}})})});
 context.v3Hoy_=()=> '2026-11-26';context.v3ExigirAbierto_=()=>{};context.v3Rows_=()=>[];context.v3PedidosHoy_=()=>[];
 assert.equal(context.v3RegistrarManual_(supervisor,{nombre:'Persona Ficticia',categoria:'ACOMPANANTE',guardia:'12',turno:'MAÑANA'}).creados,1);
 assert.equal(recorded[0][10],'MANUAL:ACOMPANANTE');assert.equal(recorded[0][5],'ENFERMERIA');
 Object.assign(context,savedFns);
 context.PropertiesService=oldProps;context.v3Auditar_=oldAudit;context.v3Planilla_=oldPlan;
 console.log('OK: catálogo manual configurable, permisos, duplicados y auditoría (simulados).');
}
for(const name of ['v3ConfigurarAdminSeguro','v3InstalarRespaldoDiarioV3','v3RespaldoDiarioProgramado']){
 assert.equal(typeof context[name],'undefined');
 assert.equal(typeof context[name+'_'],'function');
}
const privateFolder={isTrashed:()=>false,getSharingAccess:()=> 'PRIVATE',getOwner:()=>({}),getEditors:()=>[],getViewers:()=>[]};
context.DriveApp={Access:{PRIVATE:'PRIVATE'},getFolderById:()=>privateFolder};
assert.equal(context.v3BackupFolder_(),privateFolder);
for(const [prop,value] of [['getSharingAccess','ANYONE'],['getEditors',[{}]],['getViewers',[{}]],['getOwner',null]]){
 const original=privateFolder[prop];privateFolder[prop]=()=>value;
 assert.throws(()=>context.v3BackupFolder_(),/debe ser privada/);
 privateFolder[prop]=original;
}
console.log('OK: tareas administrativas privadas y carpeta exclusiva de propietario (simuladas).');
context.ScriptApp={getScriptId:()=> 'PROYECTO_DISTINTO'};
assert.throws(()=>context.v3ExigirProyectoRespaldoV3_(),/exclusiva/);
context.ScriptApp.getScriptId=()=>context.V3_BACKUP_SCRIPT_ID_;
context.v3ExigirProyectoRespaldoV3_();
const original={correcto:true,hojas:{Pedidos_V3:{presente:true,filas:1,encabezadosCorrectos:true}}};
const copia=JSON.parse(JSON.stringify(original));
assert.equal(context.v3BackupCompararInventarios_(original,copia),true);
copia.hojas.Pedidos_V3.filas=2;
assert.equal(context.v3BackupCompararInventarios_(original,copia),false);
copia.hojas.Pedidos_V3.filas=1;copia.hojas.Pedidos_V3.presente=false;
assert.equal(context.v3BackupCompararInventarios_(original,copia),false);
assert.equal(context.v3BackupArchivoPrivado_(privateFolder),true);
assert.equal(typeof context.v3ValidacionIntegralV3,'undefined');
assert.throws(()=>context.v3EjecutarMantenimientoV3(),/no autorizado/);
let permiso='VALIDAR',llamadas=0;
context.PropertiesService={getScriptProperties:()=>({getProperty:()=>permiso,deleteProperty:()=>{permiso=null}})};
context.v3ValidacionIntegralV3_=()=>{llamadas++;return {status:'success'}};
assert.equal(context.v3EjecutarMantenimientoV3().status,'success');
assert.throws(()=>context.v3EjecutarMantenimientoV3(),/no autorizado/);
assert.equal(llamadas,1);
console.log('OK: destino fijo, comparación de inventarios y validación integral privada.');
// Nuevas funciones: los controles deben rechazar antes de tocar Sheets.
for(const nombre of ['v3AdminPersonal_','v3AdminGuardarPersonal_','v3AdminGuardarAcceso_']){
 assert.throws(()=>context[nombre]({rol:'COCINA'},{}),/Solo Administración/);
 assert.throws(()=>context[nombre]({rol:'NUTRICION'},{}),/Solo Administración/);
}
assert.throws(()=>context.v3AvisosAdmin_({rol:'WEB'}),/Solo Nutrición/);
const hoy='2026-11-24';
const avisos=context.v3NormalizarAvisos_([{texto:' Aviso fijo ',activo:true,fijo:true},{texto:'Temporal',activo:true,hasta:hoy},{texto:'Oculto',activo:false}],hoy);
assert.equal(avisos.length,3);assert.equal(avisos[0].texto,'Aviso fijo');assert.equal(avisos[0].hasta,'');assert.equal(avisos[1].hasta,hoy);assert.equal(avisos[2].activo,false);
assert.throws(()=>context.v3NormalizarAvisos_([{}, {}, {}, {}],hoy),/hasta tres/);
assert.throws(()=>context.v3NormalizarAvisos_([{texto:'x',activo:true,hasta:'2026-11-23'}],hoy),/vencimiento/);
assert.throws(()=>context.v3NormalizarAvisos_([{texto:'x',activo:true,hasta:'2026-02-30'}],hoy),/vencimiento/);
assert.throws(()=>context.v3NormalizarAvisos_([{texto:'x'.repeat(501),activo:true,fijo:true}],hoy),/demasiado largo/);
const leer=context.v3LeerAvisos_,plan=context.v3Planilla_,fecha=context.v3Hoy_;
context.v3Planilla_=()=>({});context.v3Hoy_=()=>hoy;
context.v3LeerAvisos_=()=>({avisos:[{texto:'Fijo',activo:true,fijo:true},{texto:'Vencido',activo:true,fijo:false,hasta:'2026-11-23'},{texto:'Hoy',activo:true,fijo:false,hasta:hoy}]});
assert.deepEqual(Array.from(context.v3AvisoPublico_().avisos),['Fijo','Hoy']);
context.v3LeerAvisos_=leer;context.v3Planilla_=plan;context.v3Hoy_=fecha;
// Ejecución de cambios exclusivamente sobre objetos en memoria.
const rowsAlerts=[],rowsPeople=[['FICTICIO-1','Persona Ficticia','SERVICIO PRUEBA','GENERAL','SI']],audit=[];
const mockSheet=(rows)=>({getLastRow:()=>rows.length+1,getLastColumn:()=>5,getRange:(row,col,num)=>({getValues:()=>rows.slice(row-2,row-2+num),setValues:v=>{rows[row-2]=v[0]}}),appendRow:r=>rows.push(r)});
const sheets={Avisos_V3:mockSheet(rowsAlerts),Personal_V3:mockSheet(rowsPeople),Auditoria_V3:mockSheet(audit)};
context.v3Planilla_=()=>({getSheetByName:n=>sheets[n]||null,getSpreadsheetTimeZone:()=> 'America/Argentina/Buenos_Aires'});context.v3Hoy_=()=>hoy;
const admin={rol:'ADMIN',servicio:'ADMIN'},nutri={rol:'NUTRICION',servicio:'NUTRICION'};
const props=new Map([['HISJB_V3_CUENTAS',JSON.stringify({ADMIN:{rol:'ADMIN',salt:'interno',hash:'interno'}})]]);
context.PropertiesService={getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v)})};
context.Utilities.computeDigest=(_alg,s)=>Array.from(require('node:crypto').createHash('sha256').update(s).digest());context.Utilities.DigestAlgorithm={SHA_256:'SHA_256'};context.Utilities.Charset={UTF_8:'UTF_8'};
let seq=0;context.Utilities.getUuid=()=>('uuid-ficticio-'+(++seq));
assert.equal(context.v3AdminPersonal_(admin).personas.length,1);
for(const nombre of ['BACTERIOLOGIA','CLINICA MEDICA','LABORATORIO','QUEMADOS','TRAUMATOLOGIA','UTI II']){
 const svc=context.v3AdminPersonal_(admin).servicios.find(s=>s.nombre===nombre);assert.equal(svc.rolSugerido,'WEB');assert.equal(svc.rol,null);
}
assert.equal(JSON.stringify(context.v3AdminPersonal_(admin)).includes('interno'),false);
assert.equal(context.v3AdminGuardarPersonal_(admin,{nombre:'Otra Persona',servicio:'SERVICIO PRUEBA',dieta:'GENERAL',activo:true}).status,'success');
assert.equal(rowsPeople.length,2);
assert.throws(()=>context.v3AdminGuardarPersonal_(admin,{nombre:'Otra Persona',servicio:'SERVICIO PRUEBA',dieta:'GENERAL'}),/Ya existe/);
const claveFicticia=require('node:crypto').randomBytes(24).toString('hex');
assert.throws(()=>context.v3AdminGuardarAcceso_(admin,{servicio:'UTI II',rol:'SUPERVISOR',clave:claveFicticia}),/Rol incorrecto/);
assert.equal(context.v3AdminGuardarAcceso_(admin,{servicio:'UTI II',rol:'WEB',clave:require('node:crypto').randomBytes(24).toString('hex')}).status,'success');
assert.equal(context.v3AdminGuardarAcceso_(admin,{servicio:'SERVICIO PRUEBA',rol:'WEB',clave:claveFicticia}).status,'success');
assert.equal(props.get('HISJB_V3_CUENTAS').includes(claveFicticia),false);
assert.throws(()=>context.v3AdminGuardarAcceso_(admin,{servicio:'SERVICIO PRUEBA',rol:'WEB',clave:claveFicticia}),/ya tiene/);
assert.throws(()=>context.v3AdminGuardarAcceso_(admin,{servicio:'ADMIN',rol:'WEB',clave:claveFicticia,rotar:true}),/ADMIN/);
context.Utilities.newBlob=s=>({getBytes:()=>Buffer.from(s)});
assert.throws(()=>context.v3AdminVistaAccesos_({rol:'WEB'}),/Solo Administración/);
assert.throws(()=>context.v3AdminCrearAccesosLote_({rol:'COCINA'},{}),/Solo Administración/);
assert.equal(context.v3AdminRolLote_('ENFERMERIA'),'SUPERVISOR');
assert.equal(context.v3AdminRolLote_('CAMILLEROS'),'SUPERVISOR');
assert.equal(context.v3AdminRolLote_('MANTENIMIENTO'),'SUPERVISOR');
assert.equal(context.v3AdminVistaAccesos_(admin).servicios.some(s=>s.servicio==='ADMIN'),false);
const cuentaAnterior=props.get('HISJB_V3_CUENTAS'),nuevaClave=()=>require('node:crypto').randomBytes(24).toString('hex');
const lote=[{servicio:'BACTERIOLOGIA',rol:'WEB',clave:nuevaClave()},{servicio:'LABORATORIO',rol:'WEB',clave:nuevaClave()}];
assert.throws(()=>context.v3AdminCrearAccesosLote_(admin,{filas:[lote[0],{...lote[1],rol:'SUPERVISOR'}]}),/catálogo/);
assert.equal(props.get('HISJB_V3_CUENTAS'),cuentaAnterior);
assert.throws(()=>context.v3AdminCrearAccesosLote_(admin,{filas:[lote[0],{...lote[1],clave:lote[0].clave}]}),/contraseña/);
assert.equal(props.get('HISJB_V3_CUENTAS'),cuentaAnterior);
assert.equal(context.v3AdminCrearAccesosLote_(admin,{filas:lote}).creados,2);
assert.equal(props.get('HISJB_V3_CUENTAS').includes(lote[0].clave),false);
assert.deepEqual(JSON.parse(props.get('HISJB_V3_CUENTAS')).ADMIN,JSON.parse(cuentaAnterior).ADMIN);
assert.throws(()=>context.v3AdminCrearAccesosLote_(admin,{filas:lote}),/catálogo/);
assert.equal(context.v3GuardarAviso_(nutri,{version:0,avisos}).status,'success');
assert.equal(rowsAlerts.length,1);assert.deepEqual(Array.from(context.v3AvisoPublico_().avisos),['Aviso fijo','Temporal']);
assert.throws(()=>context.v3GuardarAviso_(nutri,{version:0,avisos}),/cambió/);
context.v3Hoy_=()=> '2026-11-25';assert.deepEqual(Array.from(context.v3AvisoPublico_().avisos),['Aviso fijo']);
context.v3Planilla_=plan;context.v3Hoy_=fecha;
console.log('OK: permisos de administración y tres alertas con vencimiento, sin escrituras reales.');
const html=fs.readFileSync(path.join(root,'AccesoV3.html'),'utf8');
const paginador=html.slice(html.indexOf('function adminRosterPage('),html.indexOf('function renderAdminRoster('));
const pagina=vm.runInNewContext(paginador+'\nadminRosterPage');
const personas=Array.from({length:57},(_,i)=>({id:String(i),nombre:'Persona '+String(i).padStart(2,'0'),servicio:'FICTICIO A'})).concat([{id:'otro',nombre:'Persona Otro',servicio:'FICTICIO B'}]);
assert.equal(pagina(personas,'','',1).items.length,0);
assert.equal(pagina(personas,'FICTICIO A','',1).items.length,25);
assert.equal(pagina(personas,'FICTICIO A','',2).items.length,25);
assert.equal(pagina(personas,'FICTICIO A','',3).items.length,7);
assert.equal(pagina(personas,'FICTICIO A','',99).page,3);
assert.equal(pagina(personas,'FICTICIO B','',1).total,1);
assert.equal(pagina(personas,'FICTICIO A','Persona 42',1).total,1);
assert.equal(pagina(personas,'SIN PERSONAL','',1).total,0);
console.log('OK: paginación por servicio, búsqueda y límite de 25 personas.');
// Protección de acceso: propiedades, contraseñas y sesiones completamente ficticias, en memoria.
const memoria=new Map();context.CacheService={getScriptCache:()=>({get:k=>memoria.get(k)||null,put:(k,v)=>memoria.set(k,v),remove:k=>memoria.delete(k)})};
context.PropertiesService={getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k),getProperties:()=>Object.fromEntries(props)})};
context.Utilities.getUuid=()=>require('node:crypto').randomUUID();
context.v3Planilla_=()=>({getSheetByName:n=>sheets[n]||null,getSpreadsheetTimeZone:()=> 'America/Argentina/Buenos_Aires'});
const dispositivo=require('node:crypto').randomBytes(24).toString('hex'),fallida=nuevaClave();
const key=context.v3LoginDeviceKey_(dispositivo);
for(let i=1;i<=4;i++){assert.throws(()=>context.v3LoginControlado_({dispositivo,clave:fallida}),/Credenciales incorrectas/);assert.equal(JSON.parse(props.get(key)).intentos,i)}
assert.throws(()=>context.v3LoginControlado_({dispositivo,clave:fallida}),/bloqueado/);
assert.equal(JSON.parse(props.get(key)).bloqueado,true);
assert.equal(props.get(key).includes(fallida),false);assert.equal(props.get(key).includes(dispositivo),false);
assert.throws(()=>context.v3LoginControlado_({dispositivo,clave:claveFicticia}),/bloqueado/);
assert.throws(()=>context.v3AdminSeguridad_({rol:'WEB'}),/Solo Administración/);
const id=context.v3AdminSeguridad_(admin).dispositivos[0].id;
assert.throws(()=>context.v3AdminDesbloquear_({rol:'COCINA'},{id}),/Solo Administración/);
assert.equal(context.v3AdminDesbloquear_(admin,{id}).status,'success');assert.equal(props.has(key),false);
const login=context.v3LoginControlado_({dispositivo,clave:claveFicticia});assert.equal(login.rol,'WEB');assert.equal(context.v3Sesion_(login.token).dispositivo,key);
console.log('OK: bloqueo al quinto fallo, metadatos sin claves y desbloqueo exclusivo ADMIN.');
const buscador=html.slice(html.indexOf('function mealPersonSuggestions('),html.indexOf('function renderPeople('));
const seleccionViandas=vm.runInNewContext(buscador+'\n({buscar:mealPersonSuggestions,agregar:mealAddSelection})');
const ficticios=[{id:'a',nombre:'Pérez Ana'},{id:'b',nombre:'Pérez Bruno'},{id:'c',nombre:'Gómez Carla'}];
const elegidos=new Set();
assert.equal(seleccionViandas.buscar(ficticios,'',elegidos).items.length,0);
assert.equal(seleccionViandas.buscar(ficticios,'p',elegidos).items.length,0);
assert.equal(seleccionViandas.buscar(ficticios,'perez',elegidos).total,2);
assert.equal(seleccionViandas.buscar(ficticios,'perez br',elegidos).items[0].id,'b');
seleccionViandas.agregar(elegidos,'a','WEB');seleccionViandas.agregar(elegidos,'b','WEB');assert.deepEqual([...elegidos],['b']);
seleccionViandas.agregar(elegidos,'c','SUPERVISOR');assert.deepEqual([...elegidos],['b','c']);
assert.equal(seleccionViandas.buscar(ficticios,'perez',elegidos).items[0].id,'a');
assert.equal(seleccionViandas.buscar(Array.from({length:40},(_,i)=>({id:String(i),nombre:'Prueba '+i})),'pr',new Set()).items.length,15);
console.log('OK: búsqueda de viandas sin listado inicial, selección WEB individual y SUPERVISOR acumulativa.');
const generador=html.slice(html.indexOf('function createServicePassword('),html.indexOf("$('generatePassword').addEventListener"));
const generarClave=vm.runInNewContext(generador+'\ncreateServicePassword',{crypto:require('node:crypto').webcrypto});
const claves=new Set();for(let i=0;i<100;i++){const clave=generarClave('Clínica Médica');assert.match(clave,/^clinica-medica\.catamarca\.[a-zA-Z2-9]{12}$/);assert.ok(!claves.has(clave));claves.add(clave)}
assert.match(generarClave('UTI II'),/^uti-ii\.catamarca\.[a-zA-Z2-9]{12}$/);
assert.throws(()=>generarClave(''),/Seleccioná/);
console.log('OK: formato legible de claves y sufijo aleatorio de doce caracteres (sin mostrar claves).');
console.log('COMPROBACIÓN COMPLETADA: regresiones V3 con servicios simulados, sin datos ni escrituras reales.');
