import {copyFile,mkdir,rm} from 'node:fs/promises';

const output = new URL('./dist/',import.meta.url);
const publicFiles = [
  'index.html','checkout.html','payment-result.html','report.html',
  'privacy.html','refund.html','terms.html','recovery.html',
  'checkout.js','payment-result.js','recovery.js','purchase.js','report-v86.js',
  'v85.css','v86.css',
];

await rm(output,{recursive:true,force:true});
await mkdir(output);
await Promise.all(publicFiles.map(file=>copyFile(new URL(file,import.meta.url),new URL(file,output))));
