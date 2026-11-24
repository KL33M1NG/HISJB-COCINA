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
assert.equal(JSON.stringify(context.v3AdminPersonal_(admin)).includes('interno'),false);
assert.equal(context.v3AdminGuardarPersonal_(admin,{nombre:'Otra Persona',servicio:'SERVICIO PRUEBA',dieta:'GENERAL',activo:true}).status,'success');
assert.equal(rowsPeople.length,2);
assert.throws(()=>context.v3AdminGuardarPersonal_(admin,{nombre:'Otra Persona',servicio:'SERVICIO PRUEBA',dieta:'GENERAL'}),/Ya existe/);
const claveFicticia=require('node:crypto').randomBytes(24).toString('hex');
assert.equal(context.v3AdminGuardarAcceso_(admin,{servicio:'SERVICIO PRUEBA',rol:'WEB',clave:claveFicticia}).status,'success');
assert.equal(props.get('HISJB_V3_CUENTAS').includes(claveFicticia),false);
assert.throws(()=>context.v3AdminGuardarAcceso_(admin,{servicio:'SERVICIO PRUEBA',rol:'WEB',clave:claveFicticia}),/ya tiene/);
assert.throws(()=>context.v3AdminGuardarAcceso_(admin,{servicio:'ADMIN',rol:'WEB',clave:claveFicticia,rotar:true}),/ADMIN/);
assert.equal(context.v3GuardarAviso_(nutri,{version:0,avisos}).status,'success');
assert.equal(rowsAlerts.length,1);assert.deepEqual(Array.from(context.v3AvisoPublico_().avisos),['Aviso fijo','Temporal']);
assert.throws(()=>context.v3GuardarAviso_(nutri,{version:0,avisos}),/cambió/);
context.v3Hoy_=()=> '2026-11-25';assert.deepEqual(Array.from(context.v3AvisoPublico_().avisos),['Aviso fijo']);
context.v3Planilla_=plan;context.v3Hoy_=fecha;
console.log('OK: permisos de administración y tres alertas con vencimiento, sin escrituras reales.');
console.log('COMPROBACIÓN COMPLETADA: regresiones V3 con servicios simulados, sin datos ni escrituras reales.');
