export function createNightReveal(canvas,onComplete,onProgress){
 const ctx=canvas.getContext('2d'),fx=document.createElement('canvas');fx.id='reveal-dust';document.body.append(fx);const glow=fx.getContext('2d');
 const prompt=document.createElement('div');prompt.id='reveal-prompt';prompt.textContent='轻轻划过黑夜，让温柔慢慢出现';document.body.append(prompt);
 const brush=document.createElement('canvas');brush.width=brush.height=160;const ink=brush.getContext('2d'),pixels=ink.createImageData(160,160);
 for(let y=0;y<160;y++)for(let x=0;x<160;x++){
  const px=(x-79.5)/79.5,py=(y-79.5)/79.5,angle=Math.atan2(py,px);
  const boundary=.94+.035*Math.sin(angle*5)+.025*Math.sin(angle*9+1.7);
  const d=Math.hypot(px,py)/boundary,u=Math.max(0,Math.min(1,(d-.58)/.42));
  const feather=1-u*u*(3-2*u),grain=.96+.04*Math.sin(x*.39+y*.21)*Math.sin(y*.31-x*.13);
  pixels.data[(y*160+x)*4+3]=Math.round(220*Math.exp(-3.2*d*d)*feather*grain);
 }
 ink.putImageData(pixels,0,0);
 let active=false,finishing=false,previous=null,cells=new Set(),sparks=[],loop=false,frameTime=0,timer=null;
 function tick(t){const dt=Math.min(.05,(t-frameTime)/1000||.016);frameTime=t;glow.clearRect(0,0,fx.width,fx.height);
  sparks=sparks.filter(p=>p.life>0);for(const p of sparks){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.petal?10:-3)*dt;p.angle+=p.spin*dt;
   const fade=Math.max(0,Math.sin(Math.PI*Math.max(0,p.life)/p.duration));glow.save();glow.translate(p.x,p.y);glow.rotate(p.angle);
   if(p.petal){glow.scale(.4+.6*Math.abs(Math.cos(p.angle*.7)),1);glow.globalAlpha=fade*.8;const tint=glow.createLinearGradient(-p.size,0,p.size,p.size);tint.addColorStop(0,'#ffe0ea');tint.addColorStop(.55,'#e9a2bc');tint.addColorStop(1,'#bb6e91');glow.fillStyle=tint;glow.beginPath();glow.moveTo(0,-p.size);glow.bezierCurveTo(p.size*1.2,-p.size*.5,p.size*.8,p.size*.8,0,p.size*.65);glow.bezierCurveTo(-p.size*.65,p.size*.4,-p.size*.8,-p.size*.5,0,-p.size);glow.fill();glow.strokeStyle='rgba(255,235,244,.65)';glow.lineWidth=.4;glow.beginPath();glow.moveTo(0,-p.size*.7);glow.quadraticCurveTo(p.size*.2,0,0,p.size*.5);glow.stroke();}
   else{glow.globalAlpha=fade*(.6+.4*Math.sin(t*.006+p.angle)**2);glow.strokeStyle='#f4d9a5';glow.lineWidth=.65;glow.shadowColor='#ffe4b1';glow.shadowBlur=3;glow.beginPath();glow.moveTo(-p.size,0);glow.lineTo(p.size,0);glow.moveTo(0,-p.size*1.4);glow.lineTo(0,p.size*1.4);glow.stroke();glow.fillStyle='#fff9e6';glow.fillRect(-.45,-.45,.9,.9);}
   glow.restore();}glow.globalAlpha=1;
  if(active||sparks.length)requestAnimationFrame(tick);else loop=false;
 }
 function dab(x,y,r){ctx.globalCompositeOperation='destination-out';ctx.drawImage(brush,x-r,y-r,2*r,2*r);
  for(let cy=0;cy<32;cy++)for(let cx=0;cx<32;cx++)if(Math.hypot((cx+.5)*canvas.width/32-x,(cy+.5)*canvas.height/32-y)<r*.46)cells.add(cy*32+cx);
 }
 function move(e){if(!active||finishing)return;if(e.pointerType!=='mouse'&&e.buttons===0)return;const r=Math.max(30,Math.min(58,Math.min(canvas.width,canvas.height)*.065)),x=e.clientX,y=e.clientY;
  if(previous){const distance=Math.hypot(x-previous.x,y-previous.y);if(distance<r*.28)return;const steps=Math.min(80,Math.max(1,Math.ceil(distance/(r*.32))));for(let i=1;i<=steps;i++)dab(previous.x+(x-previous.x)*i/steps,previous.y+(y-previous.y)*i/steps,r);}else dab(x,y,r);previous={x,y};
  for(let i=0;i<4;i++){const petal=i===0,duration=petal?2.2:1.1+Math.random()*.5;sparks.push({petal,x:x+(Math.random()-.5)*r*.45,y:y+(Math.random()-.5)*r*.45,vx:(Math.random()-.5)*15,vy:petal?-7:-12-Math.random()*12,life:duration,duration,size:petal?3+Math.random()*2:1+Math.random()*1.3,angle:Math.random()*6.28,spin:(Math.random()-.5)*(petal?2.2:.4)});}if(sparks.length>100)sparks.splice(0,sparks.length-100);
  onProgress(Math.min(100,Math.round(cells.size/10.24)));
  if(cells.size>=665){finishing=true;canvas.style.transition='opacity 1.8s ease';canvas.style.opacity='0';prompt.style.opacity='0';timer=setTimeout(()=>{active=false;canvas.style.display='none';canvas.style.pointerEvents='';document.body.classList.remove('revealing');onComplete();},1800);}
 }
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);move(e)});canvas.addEventListener('pointermove',move);for(const name of ['pointerleave','pointerup','pointercancel'])canvas.addEventListener(name,()=>previous=null);
 return {start(){clearTimeout(timer);active=true;finishing=false;previous=null;sparks=[];cells.clear();canvas.width=fx.width=innerWidth;canvas.height=fx.height=innerHeight;canvas.style.display='block';canvas.style.transition='';canvas.style.opacity='1';ctx.globalCompositeOperation='source-over';ctx.fillStyle='#02040a';ctx.fillRect(0,0,canvas.width,canvas.height);prompt.style.opacity='1';document.body.classList.add('revealing');if(!loop){loop=true;requestAnimationFrame(tick);}},reset(){clearTimeout(timer);active=false;previous=null;sparks=[];canvas.style.display='none';prompt.style.opacity='0';document.body.classList.remove('revealing');}};
}

