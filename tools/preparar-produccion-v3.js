#!/usr/bin/env node
'use strict';
/* Genera una preparación PRIVADA fuera del repositorio. No conecta a Google ni despliega. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'..'),src=path.join(repo,'backend-v3');
const TEST_ID='1EdznVOmQEuvmDQPbPqgmeLZoWAZ-g7pyXKiIjXjTLSRvla6eifgesn13';
const [outputArg,scriptId]=process.argv.slice(2);
if(!outputArg||!scriptId||!/^[a-zA-Z0-9_-]{20,150}$/.test(scriptId)||scriptId===TEST_ID)throw Error('Indicá una carpeta nueva fuera del repositorio y el ID del NUEVO proyecto productivo, distinto de pruebas.');
const output=path.resolve(outputArg),relative=path.relative(repo,output);
if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('La carpeta debe quedar fuera del repositorio.');
if(fs.existsSync(output))throw Error('La carpeta de destino ya existe: usá una carpeta nueva para no sobrescribir archivos.');
const names=['AccesoV3.html','Code.gs','AdministracionV3.gs','AdminBootstrap.gs','AvisosV3.gs','CocinaOperaciones.gs','HistorialCierres.gs','ImportacionNomina.gs','RecuperacionCierre.gs','RespaldosV3.gs','SeguridadAccesoV3.gs'];
function replaceOnce(s,old,replacement){if(!s.includes(old))throw Error('La versión de origen cambió: revisar el preparador.');return s.replace(old,replacement)}
const transformed=new Map();
for(const name of names){
 let s=fs.readFileSync(path.join(src,name),'utf8');
 s=s.replaceAll('HISJB_V3_TEST_SHEET_ID','HISJB_V3_PROD_SHEET_ID').replaceAll('HISJB_V3_CUENTAS','HISJB_V3_PROD_CUENTAS').replaceAll('HISJB_V3_PEPPER','HISJB_V3_PROD_PEPPER').replaceAll('HISJB_V3_BACKUP_FOLDER_ID','HISJB_V3_PROD_BACKUP_FOLDER_ID').replaceAll('HISJB_V3_ADMIN_BOOTSTRAP','HISJB_V3_PROD_ADMIN_BOOTSTRAP').replaceAll('HISJB_V3_LOGIN_DEVICE_','HISJB_V3_PROD_LOGIN_DEVICE_');
 if(name==='Code.gs'){
  s=replaceOnce(s,'function v3Planilla_() {','function v3Planilla_() {\n  v3ExigirProyectoRespaldoV3_();');
  s=replaceOnce(s,'function doGet(e) {','function doGet(e) {\n  v3ExigirProyectoRespaldoV3_();');
  s=replaceOnce(s,'function v3UiCall(p) {\n  try {','function v3UiCall(p) {\n  try {\n    v3ExigirProyectoRespaldoV3_();');
  s=s.replaceAll('— PRUEBAS','— PREPARACIÓN PRIVADA').replaceAll('hoja de PRUEBAS','hoja de PRODUCCIÓN');
 }
 if(name==='RespaldosV3.gs'){
  s=replaceOnce(s,TEST_ID,scriptId).replaceAll('HISJB-V3-PRUEBAS-','HISJB-V3-PRODUCCION-');
  s=replaceOnce(s,'Operación exclusiva de Apps Script V3 de pruebas','Operación exclusiva del nuevo Apps Script V3 productivo');
  const pos=s.indexOf('/** Ejecutar una vez desde el editor privado, después de comprobar la planilla ficticia');if(pos<0)throw Error('No se encontró la sección de mantenimiento de pruebas');
  s=s.slice(0,pos); // excluir entrada ejecutable de mantenimiento y suites de prueba
 }
 if(name==='AccesoV3.html')s=s.replaceAll('Cocina V3 · Pruebas','Cocina V3 · Preparación privada').replaceAll('V3 PRUEBAS','V3 · PREPARACIÓN PRIVADA').replaceAll('ENTORNO DE PRUEBAS.</b> Acceso restringido. Solo personal ficticio y planilla V3.','PREPARACIÓN PRIVADA.</b> No habilitado para uso institucional.').replaceAll('planilla de pruebas','planilla productiva');
 if(name.endsWith('.gs'))new vm.Script(s,{filename:name});
 transformed.set(name,s);
}
const setup=`/** Sólo instalación privada; retirar este archivo antes del despliegue público. */
function v3InicializarProduccion(){
 v3ExigirProyectoRespaldoV3_();
 var props=PropertiesService.getScriptProperties();
 if(props.getProperty('HISJB_V3_PROD_INIT')!=='PREPARAR')throw Error('Preparación no autorizada');
 var lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw Error('Sistema ocupado');
 try{
  props.deleteProperty('HISJB_V3_PROD_INIT');
  var clave=props.getProperty('HISJB_V3_PROD_ADMIN_BOOTSTRAP');if(!clave||clave.length<16||clave.length>128)throw Error('Falta clave ADMIN privada de 16 a 128 caracteres');
  if(props.getProperty(V3.cuentasProp))throw Error('Este proyecto ya tiene cuentas; no reinicializar');
  var ss=v3Planilla_(),folder=v3BackupFolder_(),source=DriveApp.getFileById(ss.getId());
  if(!v3BackupArchivoPrivado_(source))throw Error('La planilla debe ser privada y sin colaboradores');
  if(ss.getName()!=='HISJB Cocina V3 - PRODUCCIÓN'||folder.getName()!=='HISJB Cocina V3 - RESPALDOS PRODUCCIÓN')throw Error('Verificá los nombres exactos de los recursos productivos');
  if(ss.getSheets().some(function(hoja){return hoja.getLastRow()>0}))throw Error('La planilla no está vacía; no se modificará');
  ss.setSpreadsheetTimeZone('America/Argentina/Buenos_Aires');
  v3HojasIniciales_();v3CierreHoja_(ss); // encabezados propios, sin copiar pedidos ni personas
  if(!v3BackupInventario_(ss).correcto)throw Error('No se verificó la estructura');
  v3ConfigurarAdminSeguro_();
  Logger.log('Preparación privada completada: seis hojas verificadas y cuenta ADMIN configurada. No se publicó ninguna aplicación.');
  return 'Preparación privada completada';
 }finally{props.deleteProperty('HISJB_V3_PROD_ADMIN_BOOTSTRAP');lock.releaseLock()}
}`;
new vm.Script(setup,{filename:'InstalacionProduccion.gs'});transformed.set('InstalacionProduccion.gs',setup);
fs.mkdirSync(output,{recursive:true,mode:0o700});
for(const [name,s] of transformed)fs.writeFileSync(path.join(output,name),s,{encoding:'utf8',mode:0o600});
fs.writeFileSync(path.join(output,'appsscript.json'),JSON.stringify({timeZone:'America/Argentina/Buenos_Aires',dependencies:{},exceptionLogging:'STACKDRIVER',runtimeVersion:'V8',webapp:{executeAs:'USER_DEPLOYING',access:'MYSELF'}},null,2),{mode:0o600});
fs.writeFileSync(path.join(output,'.clasp.json'),JSON.stringify({scriptId,rootDir:'.'},null,2),{mode:0o600});
console.log('Preparación privada generada: '+transformed.size+' archivos de código y manifiesto MYSELF. No se realizó ninguna conexión ni despliegue.');
