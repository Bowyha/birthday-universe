import * as THREE from './assets/three.module.js';
import { createStarMaterial } from './star-material.js';
import { createWish } from './wish.js';
import { createNightReveal } from './reveal-night.js';
import { createOpening } from './opening.js';
import { createFlower } from './botanical.js';
const $=s=>document.querySelector(s),mobile=innerWidth<650,N=mobile?10500:24000;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,150);camera.position.z=18;
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('#universe'),antialias:false,alpha:true});}catch(e){$('#error').hidden=false;$('#error').textContent='当前浏览器无法开启 3D，请在支持 WebGL 的浏览器中打开。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
const positions=new Float32Array(N*3),targets=new Float32Array(N*3),colors=new Float32Array(N*3),seeds=Array.from({length:N},()=>Math.random());
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
const mat=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},pixel:{value:renderer.getPixelRatio()}},vertexShader:`attribute vec3 color; varying vec3 vColor; uniform float time; uniform float pixel; void main(){vColor=color*(.7+.3*sin(time+position.x*3.));vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(24./-p.z,1.,3.5)*pixel;}`,fragmentShader:`varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vColor,pow(1.-d*2.,1.8));}`});
const particles=new THREE.Points(geo,mat);scene.add(particles);
const bgGeo=new THREE.BufferGeometry(),bg=new Float32Array(2400*3);for(let i=0;i<bg.length;i++)bg[i]=(Math.random()-.5)*75;bgGeo.setAttribute('position',new THREE.BufferAttribute(bg,3));const backgroundStars=new THREE.Points(bgGeo,createStarMaterial(0x8ba9cc,.6,.09));scene.add(backgroundStars);
let stage=0,blooms=0,entered=performance.now(),pointer={x:0,y:0},stream,ctx,micTimer,holdTimer,transition=false;
const chapters=['星空诞生','划开黑夜','花开有时','风送花信',null,'许下心愿','生日快乐'];
const recipient=new URLSearchParams(location.search).get('to')?.trim().slice(0,40)||'亲爱的你';
const copy=[['SOMEWHERE, A STAR WAS BORN','因为你，<br>宇宙有了光。','在无数个闪烁的瞬间里，<br>这一颗星，只为你而亮。','点亮这颗星'],['LET THE LIGHT FIND YOU','献给 <span id="name"></span>','用手指或鼠标，轻轻划开这片黑夜。',''],['EVERY BLOOM IS A LITTLE MIRACLE','把温柔，<br>开成一朵花。','轻触花苞，让柔软的花瓣为你舒展。','轻触，让花开 · 0 / 3'],['LET YOUR WISHES TAKE FLIGHT','风会记得，<br>每一次盛开。','花瓣落向夏天，愿你始终自由、明亮。',''],null,['MAKE A WISH, JUST FOR YOURSELF','闭上眼睛，<br>许一个愿吧。','愿望可以很小，也可以和宇宙一样大。',''],['THE UNIVERSE IS GLAD YOU ARE HERE','Happy<br>Birthday','愿你眼里有星光，心中有旷野。<br>新的一岁，继续成为你喜欢的自己。','']];
const visibleStages=[0,1,2,3,5,6];for(const unused of visibleStages)$('nav').appendChild(document.createElement('i'));
function shape(kind){let textPoints=[];if(kind===6){const c=document.createElement('canvas');c.width=1000;c.height=320;const x=c.getContext('2d');x.fillStyle='white';x.font='bold 115px Georgia';x.textAlign='center';x.fillText('Happy',500,125);x.fillText('Birthday',500,260);const d=x.getImageData(0,0,1000,320).data;for(let y=0;y<320;y+=3)for(let x=0;x<1000;x+=3)if(d[(y*1000+x)*4+3]>100)textPoints.push([(x-500)/65,(160-y)/65,0]);}
for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2,r=Math.random(),j=i*3;let x,y,z;
if(kind<2){const radius=.35+Math.pow(r,.65)*6.2,arm=i%3,theta=a*.22+radius*.92+arm*Math.PI*2/3;x=Math.cos(theta)*radius;y=Math.sin(theta)*radius*.48;z=(Math.random()-.5)*(.5+radius*.18);const yy=y;y=yy*.8-z*.6;z=yy*.6+z*.8;}
else if(kind===2){const petal=i%11,theta=a,rad=Math.sqrt(r),spread=1.2+blooms*.28,angle=petal/11*Math.PI*2;const length=spread*(1.5+Math.sin(theta)*.5)*rad;x=Math.cos(angle)*length+Math.sin(angle)*Math.cos(theta)*rad*.7;y=Math.sin(angle)*length-Math.cos(angle)*Math.cos(theta)*rad*.7;z=Math.pow(rad,2)*1.2+Math.sin(theta)*.3;}
else if(kind===3){x=(Math.random()-.5)*14;y=(Math.random()-.5)*11;z=(Math.random()-.5)*7;}
else if(kind===5){const tier=i%3,rad=2.2-tier*.48,theta=a;x=Math.cos(theta)*rad;y=-1.8+tier*.9+Math.random()*.72;z=Math.sin(theta)*rad; if(i%12===0){x=(Math.random()-.5)*.2;y=.8+Math.random()*.8;z=0;}}
else{const p=textPoints[i%textPoints.length];[x,y,z]=p;z=(Math.random()-.5)*.18;}
targets[j]=x;targets[j+1]=y;targets[j+2]=z;const gold=kind===2||kind===5||kind===6||i%4!==0;const color=new THREE.Color(gold?(kind===2?0xffb6b0:0xeac38b):0x709cb8);color.multiplyScalar(.35+Math.random()*.8);colors[j]=color.r;colors[j+1]=color.g;colors[j+2]=color.b;}
geo.attributes.color.needsUpdate=true;}
function enter(n){if(n===4)return enter(5);stage=n;entered=performance.now();transition=false;const c=copy[n];$('#eyebrow').textContent=c[0];$('#title').innerHTML=c[1];if(n===1)$('#name').textContent=recipient;$('#description').innerHTML=c[2];$('#action').innerHTML=c[3]+' <span>↗</span>';$('#action').style.display=c[3]?'block':'none';$('#hint').textContent=n===0?'戴上耳机 · 开启属于你的小小宇宙':n===2?'每一次轻触，都是一次温柔的回应':'';$('#chapter').textContent=`0${visibleStages.indexOf(n)+1} / 06`;$('#chapterName').textContent=chapters[n];[...$('nav').children].forEach((e,i)=>e.classList.toggle('active',visibleStages[i]===n));document.body.classList.toggle('center',n===6);$('#hold').style.display=n===5?'block':'none';$('#flames').style.display=n===5?'block':'none';$('#replay').hidden=n!==6;if(n===6){$('#title').style.visibility='visible';$('#signature').textContent='本作品由 Bowyh 创作';$('#description').style.marginTop='32px';}else{$('#title').style.visibility='';$('#description').style.marginTop='';}shape(n);if(n===1){initVeil();$('#universe').style.opacity='1';}if(n===3)setTimeout(()=>{if(stage===3)enter(5)},5500);}
async function play(){try{await $('#audio').play();$('#music span').textContent='音乐开启';$('#music').setAttribute('aria-label','暂停背景音乐')}catch{$('#music span').textContent='点击播放';}}
$('#music').onclick=()=>{if($('#audio').paused)play();else{$('#audio').pause();$('#music span').textContent='音乐关闭'}};
const wish=createWish(scene,mobile);
const flower=createFlower(scene,mobile,()=>enter(3));
const opening=createOpening(scene,mobile,()=>enter(1),camera); document.body.classList.add('opening');
function act(){if(stage===5){wish.start();return;}if(stage===0){play();opening.start(performance.now())}else if(stage===2&&!transition){const count=flower.trigger(performance.now());if(count!==null){blooms=count;$('#action').innerHTML=`轻触，让花开 · ${count} / 3 <span>✧</span>`;$('#hint').textContent='花瓣正在逐层舒展，请稍候…';}}}
$('#action').onclick=act;$('#universe').onclick=()=>{if(stage===0||stage===2||stage===5)act()};
const veil=$('#veil');
const nightReveal=createNightReveal(veil,()=>enter(2),percent=>{$('#reveal-prompt').textContent=`轻轻划开黑夜 · 温柔已显现 ${percent}%`;});
function initVeil(){nightReveal.start();}
function stopMic(){clearInterval(micTimer);stream?.getTracks().forEach(t=>t.stop());stream=null;ctx?.close();ctx=null;}
function extinguish(){if(stage!==5||transition||!wish.ready)return;wish.extinguish(performance.now());transition=true;stopMic();clearTimeout(holdTimer);$('#flames').style.display='none';$('#hold').style.display='none';$('#description').textContent='愿你的每一个愿望，都被星光听见。';setTimeout(()=>enter(6),2200)}
$('#mic').onclick=async()=>{if(stream)return;$('#micStatus').textContent='REQUESTING MICROPHONE…';try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false}});if(stage!==5){stopMic();return}ctx=new AudioContext();await ctx.resume();const analyser=ctx.createAnalyser();analyser.fftSize=1024;ctx.createMediaStreamSource(stream).connect(analyser);const data=new Uint8Array(analyser.fftSize);let count=0,start=performance.now();$('#micStatus').textContent='BLOW GENTLY INTO YOUR MICROPHONE';micTimer=setInterval(()=>{analyser.getByteTimeDomainData(data);const rms=Math.sqrt(data.reduce((s,v)=>s+((v-128)/128)**2,0)/data.length);count=rms>.12?count+1:0;if(count>5)extinguish();if(performance.now()-start>24000){stopMic();$('#micStatus').textContent='NO BREATH DETECTED · HOLD TO WISH'}},80)}catch{stopMic();$('#micStatus').textContent='MICROPHONE UNAVAILABLE · HOLD FOR 1.5 SECONDS'}};
$('#press').onpointerdown=e=>{e.preventDefault();$('#press').setPointerCapture(e.pointerId);$('#micStatus').textContent='YOUR WISH IS ON ITS WAY…';holdTimer=setTimeout(extinguish,1500)};for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('#press').addEventListener(ev,()=>clearTimeout(holdTimer));
$('#replay').onclick=()=>{stopMic();nightReveal.reset();blooms=0;enter(0);opening.reset()};addEventListener('pagehide',stopMic);addEventListener('pointermove',e=>{pointer.x=(e.clientX/innerWidth-.5);pointer.y=(e.clientY/innerHeight-.5)});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(stage===1)initVeil()});
shape(0);positions.set(targets);enter(0);if(/MicroMessenger/i.test(navigator.userAgent))$('#hint').textContent='微信中如无法出声或吹气，请选择「在浏览器打开」';
function animate(t){requestAnimationFrame(animate);backgroundStars.material.uniforms.time.value=t*.001;opening.update(t);flower.update(t,stage);wish.update(t,stage);backgroundStars.visible=stage!==1&&stage!==2&&stage!==3;particles.visible=!opening.active&&stage!==1&&stage!==2&&stage!==3&&stage!==5;mat.uniforms.time.value=t*.001;const dt=(t-entered)*.001;for(let i=0;i<N;i++){let j=i*3;positions[j]+=(targets[j]-positions[j])*.035;positions[j+1]+=(targets[j+1]-positions[j+1])*.035;positions[j+2]+=(targets[j+2]-positions[j+2])*.035;if(stage===3){targets[j+1]-=.012+seeds[i]*.018;if(targets[j+1]<-4)targets[j+1]=-4+seeds[i]*.2;}}geo.attributes.position.needsUpdate=true;const center=mobile?0:3.4;particles.position.x=THREE.MathUtils.lerp(particles.position.x,stage===6?0:center,.025);particles.position.y=mobile?-2:0;particles.rotation.y=stage<2?t*.000035:Math.sin(t*.0002)*.12;particles.rotation.z=stage<2?-.2:0;if(!opening.active){camera.position.x+=(pointer.x*.45-camera.position.x)*.02;camera.position.y+=(-pointer.y*.3-camera.position.y)*.02;camera.lookAt(0,0,0);}renderer.render(scene,camera)}requestAnimationFrame(animate);













