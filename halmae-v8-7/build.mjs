import {copyFile,mkdir,readFile,rm,writeFile} from 'node:fs/promises';

const output = new URL('./dist/',import.meta.url);
const publicFiles = [
  'admin.html','admin.js','admin.css','merchant.html','merchant.js','index.html','checkout.html','payment-result.html','report.html',
  'privacy.html','refund.html','terms.html','recovery.html',
  'checkout.js','payment-result.js','recovery.js','purchase.js','report-v86.js','birth-handoff.js','free-insights.js','free-reading.js','reading-chart.js','ledger-preview-view.js',
  'v85.css','v86.css','v88.css','v90.css','v91.css','premium-report.css','release.css',
];

await rm(output,{recursive:true,force:true});
await mkdir(output);
await Promise.all(publicFiles.map(file=>copyFile(new URL(file,import.meta.url),new URL(file,output))));

// Serve the same calculation inputs and implementation used at checkout.
await Promise.all(['saju.mjs','calendar-data.mjs','lunar-conversion.mjs','fortune-cycles.mjs','ledger-preview.mjs','reading-name.mjs','immersion.mjs','story-scenes.mjs'].map(file=>
  copyFile(new URL('./netlify/functions/'+file,import.meta.url),new URL(file,output))));

const artNames = ['gap','eul','byeong','jeong','mu','gi','gyeong','sin','im','gye',...Array.from({length:10},(_,index)=>'episode-'+(index+1))];
await mkdir(new URL('art/',output));
await Promise.all(artNames.map(name=>{
  const path='art/'+name+'.webp';
  return copyFile(new URL(path,import.meta.url),new URL(path,output));
}));

await Promise.all(['share.jpg','favicon.png','host.webp','hanok.webp'].map(file=>
  copyFile(new URL('./art/'+file,import.meta.url),new URL('art/'+file,output))));
const configuredOrigin=process.env.SITE_PUBLIC_ORIGIN;
if(configuredOrigin){
  const site=new URL(configuredOrigin);
  if(site.protocol!=='https:' || site.href!==site.origin+'/'){
    throw new Error('SITE_PUBLIC_ORIGIN must be an HTTPS origin without a path.');
  }
  const index=new URL('index.html',output);
  const html=await readFile(index,'utf8');
  await writeFile(index,html.replace('content="/art/share.jpg"',`content="${site.origin}/art/share.jpg"`)
    .replace('</head>',`<link rel="canonical" href="${site.origin}/"><meta property="og:url" content="${site.origin}/"></head>`));
}

const supportPhone=process.env.LIVE_SUPPORT_PHONE;
if(supportPhone){
 if(!/^0\d{1,2}-\d{3,4}-\d{4}$/.test(supportPhone)) throw Error('Invalid LIVE_SUPPORT_PHONE');
 const phoneLink=` · 전화 <a href="tel:${supportPhone}">${supportPhone}</a>`;
 await Promise.all(['index.html','merchant.html','terms.html','privacy.html','refund.html'].map(async file=>{
  const path=new URL(file,output);
  const html=await readFile(path,'utf8');
  await writeFile(path,html.replace('<!-- support-phone -->',phoneLink));
 }));
}
