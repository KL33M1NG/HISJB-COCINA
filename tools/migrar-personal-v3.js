#!/usr/bin/env node
'use strict';
/**
 * Extrae SOLO nombre, servicio y dieta del PERSONAL del personal.html histórico.
 * No ejecuta JavaScript del HTML, no lee contraseñas ni traslada DNI.
 * Los resultados son PRIVADOS, fuera del repositorio. Node.js estándar.
 */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const input=path.resolve(__dirname,'..','personal.html');
const output=process.argv[2]?path.resolve(process.argv[2]):path.join(os.homedir(),'HISJB-V3-migracion-privada');
if(!fs.existsSync(input))throw Error('No se encuentra personal.html en el repositorio');
if(!fs.existsSync(output))fs.mkdirSync(output,{recursive:true});
const html=fs.readFileSync(input,'utf8');
const m=/\bconst\s+PERSONAL\s*=\s*\[([\s\S]*?)\]\s*;/.exec(html);
if(!m)throw Error('No se encontró el bloque PERSONAL del sistema original.');
const objects=[...m[1].matchAll(/\{[^{}]*\}/g)];
const norm=s=>String(s||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
const clean=s=>String(s||'').replace(/[,;\t]+/g,' ').replace(/\s+/g,' ').trim();
const allowed=new Set(['GENERAL','HIPOSODICA','DIABETICA','CELIACA','GASTRICA','ASTRINGENTE','VEGETARIANA']);
let valid=[],revisar=[],repeat=[],seen=new Set();
const pattern=/\b(nombre|dni|servicio|dieta)\s*:\s*"([^"]*)"/g;
objects.forEach((obj,index)=>{
  const data={};for(const field of obj[0].matchAll(pattern))data[field[1]]=field[2];
  let nombre=clean(data.nombre),servicio=clean(data.servicio),dieta=norm(data.dieta);
  // Nunca incluir DNI en resultados, reportes o mensajes.
  let causa='';
  if(!data.nombre||!data.servicio||!data.dieta)causa='Campos incompletos';
  else if(nombre.length<5||nombre.length>100||nombre.split(' ').length<2||!/^[\p{L}\p{M} .'-]+$/u.test(nombre))causa='Nombre requiere revisión';
  else if(servicio.length<2||servicio.length>60||!/^[\p{L}\p{M}\d ._/-]+$/u.test(servicio))causa='Servicio requiere revisión';
  else if(!allowed.has(dieta))causa='Dieta no reconocida: '+dieta;
  const clave=norm(servicio)+'|'+norm(nombre);
  if(!causa && seen.has(clave)){repeat.push({linea:index+1,nombre,servicio});continue}
  if(causa){revisar.push({linea:index+1,nombre,servicio,dieta,motivo:causa});continue}
  seen.add(clave);valid.push({nombre,servicio:norm(servicio),dieta});
});
const chunks=[];for(let i=0;i<valid.length;i+=150)chunks.push(valid.slice(i,i+150));
chunks.forEach((items,i)=>fs.writeFileSync(path.join(output,'LOTE-'+String(i+1).padStart(2,'0')+'.txt'),
  items.map(p=>p.nombre+'; '+p.servicio+'; '+p.dieta).join('\r\n')+'\r\n','utf8'));
const csv=(rows,keys)=>[keys.join(';'),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(';'))].join('\r\n')+'\r\n';
fs.writeFileSync(path.join(output,'REVISAR-MANUALMENTE.csv'),csv(revisar,['linea','nombre','servicio','dieta','motivo']),'utf8');
fs.writeFileSync(path.join(output,'DUPLICADOS-ORIGEN.csv'),csv(repeat,['linea','nombre','servicio']),'utf8');
const counts=Object.fromEntries([...new Set(valid.map(p=>p.servicio))].sort().map(s=>[s,valid.filter(p=>p.servicio===s).length]));
const result={registrosEncontrados:objects.length,personasImportables:valid.length,duplicados:repeat.length,
  requierenRevision:revisar.length,lotes:chunks.length,servicios:counts};
fs.writeFileSync(path.join(output,'RESUMEN.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log('Extracción terminada (sin DNI ni contraseñas).');
console.log('Registros encontrados:',objects.length,'| importables:',valid.length,'| repetidos:',repeat.length,'| para revisar:',revisar.length);
console.log('Lotes generados:',chunks.length,'| Carpeta privada:',output);
console.log('Revisá RESUMEN.json y REVISAR-MANUALMENTE.csv antes de cualquier importación.');
