#!/usr/bin/env node
'use strict';
/* Crea un paquete operativo privado y cerrado a escrituras por defecto. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'..'),[srcArg,destArg]=process.argv.slice(2);
if(!srcArg||!destArg)throw Error('Indicá la carpeta OPERATIVO y una nueva carpeta de puesta en marcha');
const src=path.resolve(srcArg),dest=path.resolve(destArg);
function outside(p){const rel=path.relative(repo,p);return rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel)}
if(!outside(src)||!outside(dest)||fs.existsSync(dest)||dest.startsWith(src+path.sep))throw Error('Elegí una carpeta nueva fuera del repositorio y del paquete anterior');
const config=JSON.parse(fs.readFileSync(path.join(src,'.clasp.json'),'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(src,'appsscript.json'),'utf8'));
if(!/^[a-zA-Z0-9_-]{20,150}$/.test(config.scriptId||'')||config.scriptId==='1EdznVOmQEuvmDQPbPqgmeLZoWAZ-g7pyXKiIjXjTLSRvla6eifgesn13'||config.rootDir!=='.'||manifest.webapp?.access!=='MYSELF'||manifest.webapp?.executeAs!=='USER_DEPLOYING')throw Error('Paquete operativo privado inválido');
const names=['AccesoV3.html','Code.gs','AdministracionV3.gs','AvisosV3.gs','CocinaOperaciones.gs','HistorialCierres.gs','ImportacionNomina.gs','RecuperacionCierre.gs','RespaldosV3.gs','SeguridadAccesoV3.gs'];
const files=new Map(names.map(n=>[n,fs.readFileSync(path.join(src,n),'utf8').replace(/\r\n/g,'\n')]));
function replace(s,a,b){if(!s.includes(a))throw Error('No coincide la versión de origen: '+a);return s.replace(a,b)}
let code=files.get('Code.gs');if(!code.includes('const V3_CANAL_ACCESO_="OPERATIVO";')||!code.includes('HISJB_V3_PROD_SHEET_ID')||!files.get('RespaldosV3.gs').includes("V3_BACKUP_SCRIPT_ID_='"+config.scriptId+"'"))throw Error('No es el canal OPERATIVO de producción');
code=replace(code,'const V3 = Object.freeze({',`function v3OperacionesHabilitadas_(){return PropertiesService.getScriptProperties().getProperty('HISJB_V3_PROD_SERVICIOS_HABILITADOS')==='SI'}\nfunction v3ExigirOperacionesHabilitadas_(accion){\n if(!v3OperacionesHabilitadas_()&&!['personal','listado','menus','resumenCocina','estadoTurno','historialCierres','avisosAdmin'].includes(accion))throw Error('Sistema en preparación. Las operaciones todavía no están habilitadas');\n}\nconst V3 = Object.freeze({`);
code=replace(code,"    if (accion === 'avisoPublico') return v3AvisoPublico_();","    if (accion === 'avisoPublico') {var a=v3AvisoPublico_();a.operacionesHabilitadas=v3OperacionesHabilitadas_();return a;}");
code=replace(code,"    if(!sesion.dispositivo)throw Error('Sesión vencida: volver a ingresar');","    if(!sesion.dispositivo)throw Error('Sesión vencida: volver a ingresar');\n    v3ExigirOperacionesHabilitadas_(accion);");
code=replace(code,"'Credenciales incorrectas','Sesión inválida'","'Sistema en preparación. Las operaciones todavía no están habilitadas','Credenciales incorrectas','Sesión inválida'");files.set('Code.gs',code);
let html=files.get('AccesoV3.html');html=replace(html,'<div class="notice"><b>ACCESO DE SERVICIOS.</b> Ingresá con la contraseña de tu servicio.</div>','<div class="notice"><b>ACCESO DE SERVICIOS.</b> Ingresá con la contraseña de tu servicio.</div><div id="launchNotice" class="notice" role="status" style="margin-top:10px"><b>Preparación del sistema.</b> Las operaciones se habilitarán cuando se confirme el inicio oficial.</div>');
html=replace(html,"box=$('dailyAlert');","box=$('dailyAlert');\n  show('launchNotice',a.operacionesHabilitadas!==true);");
files.set('AccesoV3.html',html);
const ctx=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})}});vm.runInContext(code,ctx);
if(ctx.v3OperacionesHabilitadas_()!==false)throw Error('El cierre inicial no funciona');
for(const a of ['registrar','registrarManual','entrega','entregaLote','cerrarTurno','guardarMenu','guardarAviso']){let blocked=false;try{ctx.v3ExigirOperacionesHabilitadas_(a)}catch(e){blocked=true}if(!blocked)throw Error('Operación de escritura habilitada por defecto');}
// Mantener superficie pública mínima y funciones de mantenimiento privadas.
const publicos=[];for(const [n,s] of files){if(n.endsWith('.gs')){new vm.Script(s,{filename:n});for(const m of s.matchAll(/^function\s+(\w+)\(/gm))if(!m[1].endsWith('_'))publicos.push(m[1]);}else for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(m[1],{filename:n});}
if(publicos.sort().join(',')!=='doGet,doPost,v3UiCall')throw Error('Funciones públicas inesperadas');
fs.mkdirSync(dest,{recursive:true,mode:0o700});for(const [name,s] of files)fs.writeFileSync(path.join(dest,name),s,{encoding:'utf8',mode:0o600});for(const [name,obj] of [['.clasp.json',{scriptId:config.scriptId,rootDir:'.'}],['appsscript.json',manifest]])fs.writeFileSync(path.join(dest,name),JSON.stringify(obj,null,2),{mode:0o600});
console.log('Paquete de puesta en marcha preparado. Acceso MYSELF. Operaciones cerradas por defecto. No se modificó Google ni se publicó nada.');
