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
console.log('OK: destino fijo, comparación de inventarios y validación integral privada.');
console.log('COMPROBACIÓN COMPLETADA: regresiones V3 con servicios simulados, sin datos ni escrituras reales.');
