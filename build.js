import{mkdir,copyFile,rm,writeFile}from'node:fs/promises';
const files=['index.html','app.js','bootstrap.js','config.js','live.js','admin-view.js','core.js','pitch.js','style.css','sw.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];await rm('dist',{recursive:true,force:true});await mkdir('dist');await Promise.all(files.map(f=>copyFile(f,'dist/'+f)));console.log('Built static PWA: dist/ ('+files.length+' files)');

if(process.env.SUKAN_API_URL){const u=new URL(process.env.SUKAN_API_URL);if(u.protocol!=='https:')throw new Error('API must use HTTPS');await writeFile('dist/config.js','export const API_BASE = '+JSON.stringify(u.origin)+';\n')}
