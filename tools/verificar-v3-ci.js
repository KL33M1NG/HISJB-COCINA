#!/usr/bin/env node
'use strict';
/* Chequeo estático de Apps Script V3, sin cuentas ni conexión a Sheets. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','backend-v3');
const files=fs.readdirSync(root).filter(name=>/\.(gs|html)$/.test(name));
if(!files.length)throw Error('No se encontraron archivos V3.');
let total=0;
for(const filename of files){
 const text=fs.readFileSync(path.join(root,filename),'utf8');
 if(filename.endsWith('.gs')){
   new vm.Script(text,{filename});
 }else{
   const match=/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
   let scripts=[...text.matchAll(match)];
   if(!scripts.length)throw Error(filename+': no se encontró JavaScript interno');
   for(const [i,m] of scripts.entries())new vm.Script(m[1],{filename:filename+' #script '+(i+1)});
   const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
   const dup=ids.find((v,i)=>ids.indexOf(v)!==i);
   if(dup)throw Error(filename+': ID HTML duplicado '+dup);
   // AccesoV3 usa $('id') para buscar elementos.
   if(filename==='AccesoV3.html'){
     const used=[...text.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
     const missing=[...new Set(used.filter(id=>!ids.includes(id)))];
     if(missing.length)throw Error('AccesoV3.html: elementos no encontrados: '+missing.join(', '));
   }
 }
 ++total;
 console.log('OK: '+filename);
}
console.log('COMPROBACIÓN COMPLETADA: '+total+' archivos Apps Script V3 (sintaxis, IDs HTML).');
console.log('Nota: esto no sustituye pruebas reales en Apps Script.');
