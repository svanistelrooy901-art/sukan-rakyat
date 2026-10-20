import{mkdir,copyFile,rm}from'node:fs/promises';
const files=['index.html','app.js','core.js','style.css','sw.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];await rm('dist',{recursive:true,force:true});await mkdir('dist');await Promise.all(files.map(f=>copyFile(f,'dist/'+f)));console.log('Built static PWA: dist/ ('+files.length+' files)');
