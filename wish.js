import * as THREE from './assets/three.module.js';
import { mountReferenceCake } from './reference-cake.js';

export function chinaTime(date=new Date()){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);}
export function createWish(scene,mobile){
 const panel=document.createElement('section');panel.id='wish-clock';panel.innerHTML='<div class="clock-eyebrow">A MOMENT, JUST FOR YOU</div><div id="china-clock" role="timer"></div><div class="clock-zone">CHINA STANDARD TIME · UTC +08:00</div><button id="wish-start">MAKE A WISH <span>✧</span></button><i class="clock-orbit"></i>';document.body.append(panel);
 const root=new THREE.Group();scene.add(root);root.visible=false;const cake=new THREE.Group();root.add(cake);
 root.add(new THREE.HemisphereLight(0xd7e8ff,0x3d2946,2));const key=new THREE.DirectionalLight(0xeef7ff,3);key.position.set(-4,7,8);root.add(key);const back=new THREE.DirectionalLight(0xc1a6ed,2);back.position.set(3,2,-5);root.add(back);
 const icing=new THREE.MeshPhysicalMaterial({color:0xfff9e9,roughness:.48,clearcoat:.2}),body=new THREE.MeshPhysicalMaterial({color:0xb7cedd,roughness:.32,metalness:.12,clearcoat:.6}),silver=new THREE.MeshPhysicalMaterial({color:0xd6d2ed,metalness:.7,roughness:.22}),glass=new THREE.MeshPhysicalMaterial({color:0xe6dcf8,metalness:.25,roughness:.12,clearcoat:1}),warm=new THREE.MeshStandardMaterial({color:0xffdda6,emissive:0xffbf75,emissiveIntensity:1.7,roughness:.45});
 function mesh(geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);cake.add(m);return m;}
 mesh(new THREE.CylinderGeometry(2,2,3,96),body,0,-.35);
 mesh(new THREE.CylinderGeometry(2.17,2.17,.11,96),silver,0,-1.92);
 mesh(new THREE.CylinderGeometry(2.02,2.02,.12,96),icing,0,1.18);
 const pearlGeo=new THREE.SphereGeometry(.045,7,6);for(let i=0;i<100;i++){const a=i/100*Math.PI*2;mesh(pearlGeo,icing,Math.cos(a)*1.95,1.29+Math.sin(i*3.1)*.025,Math.sin(a)*1.95);}
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2,length=.15+.4*(.5+.5*Math.sin(i*2.41));const drip=mesh(new THREE.CapsuleGeometry(.055,length,4,7),icing,Math.cos(a)*2,1.1-length*.5,Math.sin(a)*2);drip.rotation.z=Math.sin(a)*.08;}
 function surfacePoint(angle,y,r=2.035){return new THREE.Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r);}
 for(let panelIndex=0;panelIndex<10;panelIndex++){
  const a=panelIndex/10*Math.PI*2;
  // Raised gothic lancets and warm jewel-like inlays wrap a real cylinder.
  const outlines=[[-.23,-1.65],[-.24,-.75],[-.2,.08],[0,.96],[.2,.08],[.24,-.75],[.23,-1.65],[0,-1.82],[-.23,-1.65]];
  const curve=new THREE.CatmullRomCurve3(outlines.map(([u,y])=>surfacePoint(a+u,y)));mesh(new THREE.TubeGeometry(curve,64,.035,6,false),silver);
  for(let j=0;j<5;j++){const y=-1.25+j*.38;for(const side of [-1,1]){const u=side*(.075+.025*Math.sin(j));const p=surfacePoint(a+u,y);const gem=mesh(new THREE.OctahedronGeometry(.14,1),j%2===0?warm:glass,p.x,p.y,p.z);gem.scale.set(.7,1.25,.55);gem.rotation.y=-a;}}
  const ornament=[];for(let j=0;j<=32;j++){const t=j/32;ornament.push(surfacePoint(a+Math.sin(t*Math.PI*4)*.105,-1.5+t*2.05,2.08));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ornament),64,.018,5,false),silver);
 }
 const oldBody=cake.children.slice();mountReferenceCake(cake,oldBody);
 const candle=mesh(new THREE.CylinderGeometry(.115,.13,1.45,24),icing,0,2.02);mesh(new THREE.CylinderGeometry(.014,.014,.16,8),new THREE.MeshBasicMaterial({color:0x48352a}),0,2.8);
 const flameMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},fade:{value:1}},vertexShader:`varying vec2 vUV;uniform float time;void main(){vUV=uv;vec3 p=position;p.x+=sin(time*7.+p.y*5.)*.035*(p.y+.3);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 vUV;uniform float time,fade;void main(){vec2 p=(vUV-.5)*2.;float w=.52*(1.-smoothstep(-.65,1.,p.y))+.025;float d=abs(p.x)/w;float a=(1.-smoothstep(.3,1.,d))*(1.-smoothstep(.65,1.,abs(p.y)));vec3 c=mix(vec3(1.,.28,.04),vec3(1.,.98,.7),1.-clamp(d,0.,1.));gl_FragColor=vec4(c,a*fade);}`});
 const flame=new THREE.Mesh(new THREE.PlaneGeometry(.52,.8,12,12),flameMaterial);flame.position.set(0,3.15,0);cake.add(flame);const candleLight=new THREE.PointLight(0xffc57d,4,8);candleLight.position.set(0,3.2,0);cake.add(candleLight);
 const orbitMaterial=new THREE.LineBasicMaterial({color:0xdbe3ff,transparent:true,opacity:.32});for(let k=0;k<5;k++){const points=Array.from({length:161},(_,i)=>{const a=i/160*Math.PI*2;return new THREE.Vector3(Math.cos(a)*(3.15+Math.max(0,k-1)*.13),Math.sin(a)*.42,Math.sin(a)*(2.65+Math.max(0,k-1)*.1))});const strandMaterial=k<2?orbitMaterial:orbitMaterial.clone();if(k>=2)strandMaterial.opacity=.12;const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),strandMaterial);ring.rotation.z=k===0?.25:k===1?-.28:.45+(k-2)*.16;ring.rotation.x=k<2?0:(k-2)*.12;ring.position.y=-.4;cake.add(ring);}

 const total=mobile?3300:6500,positions=new Float32Array(total*3),targets=new Float32Array(total*3),random=Float32Array.from({length:total*3},()=>Math.random());
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const material=new THREE.PointsMaterial({color:0xf4dfb7,size:.038,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});const digits=new THREE.Points(geometry,material);scene.add(digits);digits.visible=false;
 function digit(number){const canvas=document.createElement('canvas');canvas.width=420;canvas.height=480;const c=canvas.getContext('2d');c.fillStyle='white';c.font='600 370px Arial';c.textAlign='center';c.fillText(String(number),210,370);const data=c.getImageData(0,0,420,480).data,points=[];for(let y=0;y<480;y+=3)for(let x=0;x<420;x+=3)if(data[(y*420+x)*4+3]>100)points.push([(x-210)/58,(240-y)/58]);for(let i=0;i<total;i++){const p=points[i%points.length];targets[i*3]=p[0];targets[i*3+1]=p[1];targets[i*3+2]=(random[i*3]-.5)*.18;}}
 let phase='clock',current=-1,start=0,lastDigit=0,cakeStart=0,blown=false,blowAt=0,lastFrame=0;
 function beginCountdown(){if(current!==5||phase!=='clock')return;phase='countdown';start=performance.now();panel.classList.add('leaving');lastDigit=0;} document.querySelector('#wish-start').onclick=beginCountdown;
 return {start:beginCountdown,get phase(){return phase;},get ready(){return current===5&&phase==='cake'&&!blown;},extinguish(t){if(!this.ready)return;blown=true;blowAt=t;},update(t,stage){
  const dt=Math.min(.05,(t-lastFrame)/1000||.016);lastFrame=t;
  if(stage!==current){current=stage;if(stage===5){phase='clock';blown=false;panel.classList.remove('leaving');document.body.classList.add('wish-page');document.querySelector('#mic').textContent='BLOW THE CANDLE';document.querySelector('#press').textContent='HOLD TO WISH';document.querySelector('#micStatus').textContent='';}else{document.body.classList.remove('wish-page');panel.classList.remove('leaving');}}
  panel.hidden=stage!==5||phase==='cake';root.visible=stage===5&&phase==='cake';digits.visible=stage===5&&phase==='countdown';document.querySelector('#hold').style.display=this.ready?'block':'none';if(stage!==5)return;
  document.querySelector('#music span').textContent=document.querySelector('#audio').paused?'SOUND OFF':'SOUND ON';
  if(phase==='clock'){document.querySelector('#china-clock').textContent=chinaTime();return;}
  if(phase==='countdown'){const age=(t-start)/1000;if(age>=5.4){phase='cake';cakeStart=t;digits.visible=false;return;}const index=Math.floor(age/1.8),local=age-index*1.8,n=3-index;if(lastDigit!==n){digit(n);lastDigit=n;for(let i=0;i<positions.length;i++)positions[i]=targets[i]+(random[i]-.5)*6;}
   material.opacity=THREE.MathUtils.smoothstep(local,0,.35)*(1-THREE.MathUtils.smoothstep(local,1.3,1.8));const dissolve=THREE.MathUtils.smoothstep(local,1.25,1.8),speed=1-Math.exp(-dt*9);for(let i=0;i<positions.length;i++)positions[i]+=(targets[i]+(random[i]-.5)*dissolve*9-positions[i])*speed;geometry.attributes.position.needsUpdate=true;digits.scale.setScalar(mobile?.65:1);return;}
  const age=(t-cakeStart)/1000,ease=1-Math.pow(1-THREE.MathUtils.clamp(age/2.4,0,1),3);cake.scale.setScalar((mobile?.9:1.25)*(.35+.65*ease));cake.position.y=-.45-(1-ease)*4;cake.rotation.y=age*.2+(1-ease)*Math.PI*.7;root.position.set(0,-.3,0);
  flame.rotation.y=-cake.rotation.y;flameMaterial.uniforms.time.value=t*.001;flame.scale.set(1+Math.sin(t*.013)*.06,1+Math.sin(t*.009)*.08,1);const fade=blown?1-THREE.MathUtils.smoothstep((t-blowAt)/1000,0,.8):1;flameMaterial.uniforms.fade.value=fade;candleLight.intensity=(3.8+Math.sin(t*.019)*.35)*fade;
 },root,digits};
}



