import * as THREE from './assets/three.module.js';
import { makeBloomAtlas } from './bloom-atlas.js';
import { loadBloomFlows } from './bloom-flow.js';
const TYPES=[['牡丹','Peony · Paeonia','#efb4c2','#c87c96'],['鸢尾','Iris · Iris germanica','#baa4dc','#80679d'],['山茶','Camellia · Camellia japonica','#f5f1e6','#bcb59f']];
const smooth=THREE.MathUtils.smoothstep;
export function createFlower(scene,mobile,onFinished){
 const root=new THREE.Group();scene.add(root);root.visible=false;
 root.add(new THREE.HemisphereLight(0xfffaf3,0xaaa0a0,2));
 const key=new THREE.DirectionalLight(0xfff6ed,2.5);key.position.set(-4,5,8);root.add(key);
 const fill=new THREE.DirectionalLight(0xf4edff,1.4);fill.position.set(3,-1,-4);root.add(fill);
 const cols=mobile?24:36,rows=mobile?32:44;
 function texture(type){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d'),g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,type===1?'#e1d6ef':type===2?'#fffdf8':'#ffe5e8');g.addColorStop(.65,TYPES[type][2]);g.addColorStop(1,type===1?'#f0df9c':type===2?'#e8dfb9':'#d98b9f');ctx.fillStyle=g;ctx.fillRect(0,0,256,512);ctx.strokeStyle=TYPES[type][3];for(let i=0;i<55;i++){const x=i*256/54;ctx.globalAlpha=.07+(i%4)*.025;ctx.lineWidth=i%5===0?1.1:.5;ctx.beginPath();ctx.moveTo(128+(x-128)*.18,512);ctx.bezierCurveTo(128+(x-128)*.6,350,x+Math.sin(i)*7,140,x,0);ctx.stroke();}if(type===1){ctx.globalAlpha=.5;ctx.strokeStyle='#a17e36';for(let i=0;i<25;i++){ctx.beginPath();ctx.moveTo(117+i,510);ctx.lineTo(115+i,380+(i%5)*6);ctx.stroke();}}ctx.globalAlpha=1;const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;}
 const maps=TYPES.map((_,i)=>texture(i)),materials=maps.map(map=>new THREE.MeshPhysicalMaterial({map,side:THREE.DoubleSide,roughness:.82,metalness:0,transmission:.11,thickness:.008,ior:1.35,clearcoat:0}));
 const green=new THREE.MeshStandardMaterial({color:'#607b42',roughness:.9,side:THREE.DoubleSide}),gold=new THREE.MeshStandardMaterial({color:'#d9ad4b',roughness:.8}),models=[];
 function surface(){const g=new THREE.BufferGeometry(),p=new Float32Array((cols+1)*(rows+1)*3),uv=new Float32Array((cols+1)*(rows+1)*2),idx=[];for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const i=y*(cols+1)+x;uv.set([x/cols,y/rows],i*2);if(x<cols&&y<rows){const b=i+cols+1;idx.push(i,b,i+1,i+1,b,b+1);}}g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);return g;}
 function stem(parent,from,to){const d=to.clone().sub(from),m=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,d.length(),9),green);m.position.copy(from).lerp(to,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(m);}
 function stamens(parent,radius,z,n){const group=new THREE.Group();parent.add(group);for(let i=0;i<n;i++){const a=i*2.399,r=Math.sqrt(i/n)*radius,m=new THREE.Mesh(new THREE.CylinderGeometry(.009,.012,.17,4),gold);m.rotation.x=Math.PI/2;m.position.set(Math.cos(a)*r,Math.sin(a)*r,z);group.add(m);const tip=new THREE.Mesh(new THREE.SphereGeometry(.025,5,4),gold);tip.position.copy(m.position);tip.position.z+=.1;group.add(tip);}return group;}
 for(let type=0;type<3;type++){const group=new THREE.Group();root.add(group);const petals=[],hearts=[];
  function petal(parent,layer,angle,length,width,kind){const mesh=new THREE.Mesh(surface(),materials[type]);mesh.frustumCulled=false;parent.add(mesh);petals.push({mesh,layer,angle,length,width,kind,seed:petals.length*1.739});}
  if(type===0){for(let l=0;l<8;l++)for(let k=0;k<9;k++)petal(group,l,k/9*Math.PI*2+l*2.399,2.5-l*.2,1.05-l*.075,0);hearts.push(stamens(group,.34,.35,70));}
  if(type===1){for(let k=0;k<3;k++){petal(group,0,Math.PI/2+(k-1)*.7,2.95,.72,1);petal(group,1,-Math.PI/2+(k-1)*1.18,2.65,1.04,2);}stem(group,new THREE.Vector3(0,-3.2,-.1),new THREE.Vector3(0,-.05,0));for(let k=0;k<3;k++){const m=new THREE.Mesh(new THREE.ConeGeometry(.16,.8,6),green);m.position.set((k-1)*.12,-.37,0);m.rotation.z=(k-1)*.45;group.add(m);}}
  if(type===2){for(let f=0;f<2;f++){const head=new THREE.Group();head.position.set(f===0?-.95:1.05,f===0?.85:-.65,f===0?.15:.45);head.rotation.set(f===0?.1:-.28,f===0?-.22:.2,f===0?.2:-.2);head.scale.setScalar(f===0?.83:.74);group.add(head);for(let l=0;l<4;l++)for(let k=0;k<7;k++)petal(head,l,k/7*Math.PI*2+l*2.399,1.8-l*.18,.89-l*.12,3);hearts.push(stamens(head,.3,.4,48));stem(group,new THREE.Vector3(0,-2.1,-.3),head.position.clone());}for(let k=0;k<3;k++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),green);leaf.scale.set(.23,.7,.018);leaf.position.set(k===0?-.6:.35,-.5-k*.35,-.4);leaf.rotation.z=k===0?-.8:.75;group.add(leaf);}}
  models.push({group,petals,hearts,type});
 }
 function deform(model,open){
  model.openness=open;
  if(model.photo){model.photo.setOpen(open);return;}
  for(const petal of model.petals){const {mesh,layer,angle,length,width,seed,kind}=petal,p=mesh.geometry.attributes.position.array,spread=THREE.MathUtils.clamp((open-layer*(kind===0?.032:.06))*1.25,0,1),tilt=.035+spread*(kind===2?1.98:kind===1?1.24:1.66-layer*.085);for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const v=y/rows,u=x/cols*2-1,j=(y*(cols+1)+x)*3,scallop=1+(.025*Math.sin(u*18+seed)+.016*Math.sin(u*31+seed*.8))*v**5,along=length*v*scallop,across=u*width*Math.pow(Math.max(0,Math.sin(Math.PI*v*.97)),kind===1?.62:.55)*(1+.07*Math.sin(v*8+seed)),radial=.08+(kind===0?(8-layer)*.038:.04)+Math.sin(tilt)*along,fold=(Math.sin(u*28+seed+v*5)*.033+Math.sin(u*51-seed)*.012)*v**4*(Math.abs(u)*.6+.4)*spread;p[j]=Math.cos(angle)*radial-Math.sin(angle)*across;p[j+1]=Math.sin(angle)*radial+Math.cos(angle)*across;p[j+2]=Math.cos(tilt)*along+layer*.045+.1*u*u*Math.sin(v*Math.PI)+.004*Math.sin(u*95+Math.sin(v*6))*Math.sin(v*Math.PI)+fold+spread*v**5*.13*Math.cos(u*9+seed);}mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();}for(const h of model.hearts)h.scale.setScalar(.2+open*.8);}
 // Reference-matched alpha cutouts on deformable surfaces, rather than radial primitives.
 const loader=new THREE.TextureLoader();
 ['peony-stages.png','iris-stages.png','camellia-stages.png'].forEach((file,type)=>loader.load(new URL(`./assets/${file}`,import.meta.url).href,async map=>{
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  let flows;try{flows=await loadBloomFlows(new URL(`./assets/${file.replace('.png','').replace('-stages','-flow')}.bin`,import.meta.url));}catch{document.querySelector('#hint').textContent='花朵动画加载失败，请刷新重试。';return;}
  const model=models[type];model.group.clear();model.photo=makeBloomAtlas(map,type,flows);model.group.add(model.photo.mesh);model.petals=[];model.hearts=[];deform(model,model.openness||0);
 },undefined,()=>{document.querySelector('#hint').textContent='花朵图片加载失败，请刷新页面重试。';}));
 models.forEach(m=>deform(m,0));
 const sg=new THREE.PlaneGeometry(.32,.48,5,7),sp=sg.attributes.position;for(let i=0;i<sp.count;i++)sp.setZ(i,.06*Math.cos(sp.getX(i)*8)+.025*Math.sin(sp.getY(i)*16));sg.computeVertexNormals();
 const sm=new THREE.MeshStandardMaterial({color:0xffffff,map:maps[0],side:THREE.DoubleSide,roughness:.85,transparent:true,opacity:1,depthWrite:false}),total=mobile?420:850,swarm=new THREE.InstancedMesh(sg,sm,total);swarm.frustumCulled=false;scene.add(swarm);swarm.visible=false;
 const dummy=new THREE.Object3D(),seeds=Array.from({length:total},(_,i)=>({a:i*2.399,r:.4+Math.random()*1.5,h:Math.random(),speed:.7+Math.random()*.6,size:.5+Math.random()*.9})),cream=new THREE.Color('#f4f1e8'),gatherAt=new THREE.Vector3(mobile?0:3.1,mobile?-1.5:-.6,0);
 let current=-1,count=0,start=-1,fallStart=0,finished=false,index=0,switched=false,lastOpen=-1,entranceAt=-Infinity;
 function info(){document.querySelector('#eyebrow').textContent=`BLOOM · 0${index+1} / 03 · ${TYPES[index][1]}`;document.querySelector('#description').textContent=`${TYPES[index][0]} · 轻触花苞，让这一朵温柔为你盛开。`;}
 function vortex(age,from,to,final=false){swarm.visible=true;const expand=smooth(age,0,1.5),gather=final?0:smooth(age,2.3,4.2),fade=final?1-smooth(age,2.8,4.8):1-smooth(age,3.7,4.3);sm.map=maps[from];sm.opacity=fade*smooth(age,0,.65);const tint=new THREE.Color(TYPES[from][2]).lerp(new THREE.Color(TYPES[to][2]),gather);for(let i=0;i<total;i++){const s=seeds[i],a=s.a+age*s.speed*2.3,radius=(s.r+expand*(5+s.h*5))*(1-gather)+.15*gather,y=(s.h-.5)*(2+expand*17)*(1-gather)+Math.sin(age+s.a)*expand*.4;dummy.position.set(Math.cos(a)*radius,y,Math.sin(a)*radius*.24+1.6*expand);dummy.position.x+=mobile?0:3.1*(1-expand);dummy.position.y+=(mobile?-1.5:-.6)*(1-expand);dummy.position.lerp(gatherAt,gather);dummy.rotation.set(a*.7+s.a,age*s.speed+s.h*6,a*.4);dummy.scale.setScalar(s.size*(.25+.75*expand)*(1-gather*.8));dummy.updateMatrix();swarm.setMatrixAt(i,dummy.matrix);swarm.setColorAt(i,tint);}swarm.instanceMatrix.needsUpdate=true;if(swarm.instanceColor)swarm.instanceColor.needsUpdate=true;}
 function detach(model,a){if(model.photo){model.photo.setOpacity(1-smooth(a,0,1));model.photo.mesh.rotation.z=a*.06;}for(const p of model.petals){p.mesh.position.set(Math.cos(p.angle)*a*1.1,Math.sin(p.angle)*a*.7,a*.25);p.mesh.rotation.set(a*.15*Math.sin(p.seed),a*.2,a*.1*Math.cos(p.seed));p.mesh.scale.setScalar(1-smooth(a,0,1));}for(const h of model.hearts)h.scale.setScalar(1-smooth(a,0,.7));}
 return {trigger(t){if(current!==2||start>=0||finished||t-entranceAt<2800)return null;count++;start=t;switched=false;lastOpen=-1;return count;},update(t,stage){
  if(stage!==current){current=stage;if(stage===2){entranceAt=t;document.body.classList.add('flower-intro');count=0;index=0;start=-1;finished=false;switched=false;lastOpen=-1;models.forEach(m=>{for(const p of m.petals){p.mesh.position.set(0,0,0);p.mesh.rotation.set(0,0,0);p.mesh.scale.setScalar(1);}m.group.scale.setScalar(1);if(m.photo)m.photo.mesh.rotation.set(0,0,0);deform(m,0);});document.body.classList.add('flower-scene');info();}if(stage===3)fallStart=t;if(stage!==2&&stage!==3){document.body.classList.remove('flower-scene');document.body.classList.remove('flower-intro');}}
  root.visible=stage===2||stage===3;scene.background=(root.visible||stage===1)?cream:null;if(!root.visible){swarm.visible=false;return;}
  root.position.copy(gatherAt);const aspect=globalThis.innerWidth/globalThis.innerHeight;const halfHeight=Math.tan(48*Math.PI/360)*18;const scale=mobile?Math.min(1.42,halfHeight*aspect*1.72/5.9):Math.min(2.35,halfHeight*aspect*.95/5.9,halfHeight*1.6/5.9);const centerX=mobile?0:halfHeight*aspect*.32;gatherAt.set(centerX,mobile?-1.45:-.15,0);root.position.copy(gatherAt);root.scale.setScalar(scale);root.rotation.set(.12,Math.sin(t*.00015)*.08,Math.sin(t*.0001)*.025);models.forEach((m,i)=>m.group.visible=i===index);swarm.visible=false;
  if(stage===2){const age=(t-entranceAt)/1000,alpha=smooth(age,1.05,2.65);root.visible=age>=1.05;document.querySelector('#action').disabled=age<2.8;if(age<2.8){for(const m of models)if(m.photo)m.photo.setOpacity(alpha);root.position.y-=(1-alpha)*.2;}else{document.body.classList.remove('flower-intro');if(start<0&&models[index].photo)models[index].photo.setOpacity(1);}}
  if(stage===2&&start>=0){const age=(t-start)/1000,open=THREE.MathUtils.clamp((age-.8)/10.8,0,1);if(age<14.4&&open!==lastOpen){deform(models[index],open);lastOpen=open;}document.querySelector('#bloom-meter').style.width=`${Math.round(open*100)}%`;
   if(count<3&&age>=14.4){const wind=age-14.4;if(!switched){detach(models[index],smooth(wind,0,1.3));models[index].group.scale.setScalar(1-smooth(wind,.7,1.5));}vortex(wind,count-1,count);if(wind>2.7&&!switched){models[index].group.visible=false;index=count;switched=true;info();deform(models[index],0);}if(switched){models[index].group.visible=true;models[index].group.scale.setScalar(smooth(wind,2.7,4.3));}document.querySelector('#hint').textContent='花瓣随风起舞，下一朵温柔正在靠近…';if(wind>4.5){start=-1;swarm.visible=false;models[index].group.scale.setScalar(1);document.querySelector('#hint').textContent=`轻触，让${TYPES[index][0]}为你盛开`;document.querySelector('#bloom-meter').style.width='0%';}}
   else if(count===3&&age>14.4&&!finished){finished=true;start=-1;onFinished();}
  }else if(stage===3){const wind=(t-fallStart)/1000;detach(models[index],smooth(wind,0,1.5));vortex(wind,2,2,true);}
 },get busy(){return start>=0;},get count(){return count;},get type(){return TYPES[index][0];},root};
}








