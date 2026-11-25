#!/usr/bin/env node
'use strict';
/* Prepara dos versiones PRIVADAS del mismo proyecto productivo. No conecta ni publica. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'..'),[sourceArg,outArg]=process.argv.slice(2);
if(!sourceArg||!outArg)throw Error('Indicá carpeta productiva existente y una carpeta nueva para los dos canales');
const source=path.resolve(sourceArg),out=path.resolve(outArg),testId='1EdznVOmQEuvmDQPbPqgmeLZoWAZ-g7pyXKiIjXjTLSRvla6eifgesn13';
function outsideRepo(p){const rel=path.relative(repo,p);return rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel)}
if(!outsideRepo(source)||!outsideRepo(out)||fs.existsSync(out)||out.startsWith(source+path.sep))throw Error('Usá carpetas separadas fuera del repositorio; el destino no debe existir');
const cfg=JSON.parse(fs.readFileSync(path.join(source,'.clasp.json'),'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(source,'appsscript.json'),'utf8'));
if(!/^[a-zA-Z0-9_-]{20,150}$/.test(cfg.scriptId||'')||cfg.scriptId===testId||cfg.rootDir!=='.'||manifest.webapp?.access!=='MYSELF'||manifest.webapp?.executeAs!=='USER_DEPLOYING')throw Error('Configuración productiva privada inválida');
const names=['AccesoV3.html','Code.gs','AdministracionV3.gs','AvisosV3.gs','CocinaOperaciones.gs','HistorialCierres.gs','ImportacionNomina.gs','RecuperacionCierre.gs','RespaldosV3.gs','SeguridadAccesoV3.gs'];
const base=new Map(names.map(n=>[n,fs.readFileSync(path.join(source,n),'utf8').replace(/\r\n/g,'\n')]));
if(!base.get('Code.gs').includes('HISJB_V3_PROD_SHEET_ID')||!base.get('Code.gs').includes('HISJB_V3_PROD_CUENTAS')||!base.get('RespaldosV3.gs').includes("V3_BACKUP_SCRIPT_ID_='"+cfg.scriptId+"'"))throw Error('Los archivos no pertenecen al paquete productivo generado');
function replace(s,a,b){if(!s.includes(a))throw Error('No coincide la versión de origen: '+a);return s.replace(a,b)}
const packages=[];
for(const canal of ['ADMIN','OPERATIVO']){
 const files=new Map(base),roles=canal==='ADMIN'?['ADMIN']:['WEB','SUPERVISOR','COCINA','NUTRICION'];
 let code=files.get('Code.gs');
 code=replace(code,'const V3 = Object.freeze({',`const V3_CANAL_ACCESO_=${JSON.stringify(canal)};\nfunction v3RolPermitidoCanal_(rol){return ${JSON.stringify(roles)}.includes(rol)}\nconst V3 = Object.freeze({`);
 code=replace(code,'var cuenta = coincidencias[0];','var cuenta = coincidencias[0];\n  if(!v3RolPermitidoCanal_(cuenta.rol))throw Error(\'Credenciales incorrectas\');\n  cuenta.canal=V3_CANAL_ACCESO_;');
 code=replace(code,'  return sesion;','  if(sesion.canal!==V3_CANAL_ACCESO_||!v3RolPermitidoCanal_(sesion.rol))throw Error(\'Sesión inválida\');\n  return sesion;');
 files.set('Code.gs',code.replaceAll('— PREPARACIÓN PRIVADA',canal==='ADMIN'?'— ADMIN PRIVADO':'— SERVICIOS'));
 let html=files.get('AccesoV3.html');html=html.replaceAll('Preparación privada',canal==='ADMIN'?'Administración privada':'Acceso de servicios').replaceAll('V3 · PREPARACIÓN PRIVADA',canal==='ADMIN'?'V3 · ADMIN PRIVADO':'V3 · SERVICIOS').replaceAll('PREPARACIÓN PRIVADA.</b> No habilitado para uso institucional.',canal==='ADMIN'?'ADMIN PRIVADO.</b> Acceso exclusivo del administrador.':'ACCESO DE SERVICIOS.</b> Ingresá con la contraseña de tu servicio.');files.set('AccesoV3.html',html);
 // Única entrada de negocio pública: v3UiCall, más las entradas HTTP del framework.
 const publicos=[];for(const [n,s] of files){if(n.endsWith('.gs')){new vm.Script(s,{filename:n});for(const m of s.matchAll(/^function\s+(\w+)\(/gm))if(!m[1].endsWith('_'))publicos.push(m[1]);}else for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))new vm.Script(m[1],{filename:n});}
 if(publicos.sort().join(',')!=='doGet,doPost,v3UiCall')throw Error('Hay funciones públicas no autorizadas en el paquete');
 const ctx=vm.createContext({});vm.runInContext(code,ctx);for(const rol of ['ADMIN','WEB','SUPERVISOR','COCINA','NUTRICION','OTRO'])if(ctx.v3RolPermitidoCanal_(rol)!==roles.includes(rol))throw Error('No coincide la política de acceso del canal');
 packages.push({canal,files});
}
fs.mkdirSync(out,{recursive:true,mode:0o700});
for(const {canal,files} of packages){const dir=path.join(out,canal);fs.mkdirSync(dir,{mode:0o700});for(const [name,s] of files)fs.writeFileSync(path.join(dir,name),s,{encoding:'utf8',mode:0o600});for(const [name,obj] of [['.clasp.json',{scriptId:cfg.scriptId,rootDir:'.'}],['appsscript.json',manifest]])fs.writeFileSync(path.join(dir,name),JSON.stringify(obj,null,2),{mode:0o600});}
console.log('Dos paquetes preparados: ADMIN y OPERATIVO. Ambos MYSELF, mismo proyecto productivo, sin instaladores ni credenciales. No se publicó nada.');
