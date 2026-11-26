import {copyFile,mkdir,readFile,rm,writeFile} from 'node:fs/promises';

const output = new URL('./dist/',import.meta.url);
const publicFiles = [
  'index.html','merchant.html','privacy.html','terms.html','refund.html',
  'birth-handoff.js','free-insights.js','free-reading.js','reading-chart.js','ledger-preview-view.js',
  'v85.css','v86.css','v88.css','v90.css','v91.css','release.css',
];

await rm(output,{recursive:true,force:true});
await mkdir(output);
await Promise.all(publicFiles.map(file=>copyFile(new URL(file,import.meta.url),new URL(file,output))));

// Serve the same calculation inputs and implementation used at checkout.
await Promise.all(['saju.mjs','calendar-data.mjs','lunar-conversion.mjs','fortune-cycles.mjs','ledger-preview.mjs','reading-name.mjs'].map(file=>
  copyFile(new URL('./netlify/functions/'+file,import.meta.url),new URL(file,output))));

const artNames = ['gap','eul','byeong','jeong','mu','gi','gyeong','sin','im','gye'];
await mkdir(new URL('art/',output));
await Promise.all(artNames.map(name=>{
  const path='art/'+name+'.webp';
  return copyFile(new URL(path,import.meta.url),new URL(path,output));
}));

await Promise.all(['share.jpg','favicon.png','host.webp','hanok.webp'].map(file=>
  copyFile(new URL('./art/'+file,import.meta.url),new URL('art/'+file,output))));
