#!/usr/bin/env node
'use strict';
// Cotejo de código HEAD, sin imprimir contenidos ni credenciales.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [local,remote]=process.argv.slice(2);
if(!local||!remote)throw Error('Se necesitan dos directorios de código');
const names=dir=>fs.readdirSync(dir).filter(n=>/\.(gs|html)$/.test(n)||n==='appsscript.json').sort();
const expected=names(local),actual=names(remote);
if(expected.length<2||!expected.includes('appsscript.json'))throw Error('Inventario de origen incompleto');
if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('Inventario de código V3 distinto');
const normal=s=>s.replace(/\r\n/g,'\n').replace(/\n$/,'');
const stable=o=>Array.isArray(o)?o.map(stable):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,stable(o[k])])):o;
for(const name of expected){
 const a=fs.readFileSync(path.join(local,name),'utf8'),b=fs.readFileSync(path.join(remote,name),'utf8');
 const equal=name==='appsscript.json'?JSON.stringify(stable(JSON.parse(a)))===JSON.stringify(stable(JSON.parse(b))):normal(a)===normal(b);
 if(!equal)throw Error('Contenido distinto en '+name);
}
console.log('Cotejo correcto: '+expected.length+' archivos de Apps Script V3.');
