import * as THREE from './assets/three.module.js';

export async function loadBloomFlows(url){
 const response=await fetch(url);if(!response.ok)throw new Error('Flower motion field could not load');
 const data=new Uint8Array(await response.arrayBuffer()),length=24*24*4;
 if(data.length!==length*6)throw new Error('Invalid flower motion field');
 const textures=Array.from({length:6},(_,i)=>{const t=new THREE.DataTexture(data.slice(i*length,(i+1)*length),24,24,THREE.RGBAFormat);t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;});
 return Array.from({length:3},(_,i)=>({forward:textures[i*2],backward:textures[i*2+1]}));
}

// Match local petal patches between adjacent states. The resulting displacement
// fields let each silhouette move toward its next shape during the dissolve.
export function buildBloomFlows(image){
 const size=48,grid=24,canvas=document.createElement('canvas');canvas.width=size*2;canvas.height=size*2;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,size*2,size*2);
 const frames=Array.from({length:4},(_,i)=>ctx.getImageData((i%2)*size,Math.floor(i/2)*size,size,size).data);
 function match(a,b){const data=new Uint8Array(grid*grid*4);
  function value(frame,x,y,k){x=Math.max(0,Math.min(size-1,x));y=Math.max(0,Math.min(size-1,y));const j=(y*size+x)*4;return k===3?frame[j+3]/255:frame[j+k]/255*frame[j+3]/255;}
  for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){const sx=x*2+1,sy=y*2+1;let best=Infinity,bx=0,by=0;
   if(value(a,sx,sy,3)>.07)for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++){
    let error=(dx*dx+dy*dy)*.00006;
    for(let py=-1;py<=1;py++)for(let px=-1;px<=1;px++)for(const k of [0,1,2,3]){const delta=value(a,sx+px,sy+py,k)-value(b,sx+px+dx,sy+py+dy,k);error+=delta*delta*(k===3?2:1);}
    if(error<best){best=error;bx=dx;by=dy;}
   }
   const j=((grid-1-y)*grid+x)*4;data[j]=Math.round((.5+bx/size)*255);data[j+1]=Math.round((.5-by/size)*255);data[j+2]=128;data[j+3]=255;
  }
  const texture=new THREE.DataTexture(data,grid,grid,THREE.RGBAFormat);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
 }
 return Array.from({length:3},(_,i)=>({forward:match(frames[i],frames[i+1]),backward:match(frames[i+1],frames[i])}));
}
