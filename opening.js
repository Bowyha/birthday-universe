import * as THREE from './assets/three.module.js';
import { neuralProgress } from './neural-flight.js';
import { createNebula } from './nebula.js';
import { createStarMaterial } from './star-material.js';

// Three live 3D tableaux: the travelling spark, spherical waves, and spiral dust.
export function createOpening(scene, mobile, complete, camera=null) {
  const root = new THREE.Group(); scene.add(root);
  const count = mobile ? 46000 : 120000;
  const p = new Float32Array(count * 3), c = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3), sphere = new Float32Array(count * 3);
  const amber = new THREE.Color('#ffba70'), blue = new THREE.Color('#698eae');
  for (let i=0;i<count;i++) {
    const j=i*3, r=.78+Math.pow(Math.random(),.78)*6.6;
    const filament=i%17, arm=i%4;
    const a=r*.92+arm*Math.PI/2+Math.sin(r*3.2+arm)*.18+(filament-8)*.04+(Math.random()-.5)*(.25+r*.065);
    const ridge=Math.sin(r*5.5+arm*2)*Math.cos(r*2.3+filament)*.08;
    galaxy.set([Math.cos(a)*(r+ridge), (Math.random()-.5)*(.22+r*.07)+Math.sin(a*5+r*3)*.09, Math.sin(a)*(r+ridge)], j);
    const phi=Math.random()*Math.PI*2, z=Math.random()*2-1, rad=3.7+Math.random()*.15;
    sphere.set([Math.sqrt(1-z*z)*Math.cos(phi)*rad,z*rad,Math.sqrt(1-z*z)*Math.sin(phi)*rad],j);
    const color=amber.clone().lerp(blue,Math.min(1,Math.max(0,(r-3)/3.7)+(filament>12?.5:0)));
    const brightness=(.5+.5*Math.sin(r*10+arm*3+filament*.3))*.8+.3;
    color.multiplyScalar(brightness*(r<1.3?2.8:1));
    c.set([color.r,color.g,color.b],j);p.set(sphere.subarray(j,j+3),j);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('color',new THREE.BufferAttribute(c,3));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},mode:{value:0},wave:{value:0},ratio:{value:Math.min(devicePixelRatio,1.7)}},vertexShader:`
    attribute vec3 color; varying vec3 tint; varying float starLight; uniform float time,mode,wave,ratio,reveal;
    void main(){vec3 q=position;float light=0.;vec3 base=color;
    if(mode<1.5){float distanceFromSource=length(q-vec3(0.,0.,3.8));
    for(int i=0;i<3;i++){float radius=mod(wave-float(i)*1.1+12.,12.);float front=exp(-pow((distanceFromSource-radius)*7.,2.));light+=front;}
    base=color*(.7+.4*sin(q.x*12.+q.y*9.+time));}
    else{q.y+=sin(q.x*3.+time*.5)*.025;base*=1.2+.6*sin(q.x*8.+q.z*6.);base*=mix(.015,1.,smoothstep((1.-reveal)*9.-1.,(1.-reveal)*9.+1.,length(q.xz)));}
    float seed=fract(sin(dot(position,vec3(12.9898,78.233,43.113)))*43758.5453);starLight=.7+.3*sin(time*(.65+seed)+seed*63.);base*=mode>1.5?(.9+starLight*.5):1.;tint=base;vec4 view=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*view;gl_PointSize=clamp((mode>1.5?20.+seed*13.:26.)/max(1.,-view.z),1.,mode>1.5?2.6:4.)*ratio;}`,
    fragmentShader:`uniform float sceneFade; varying vec3 tint; varying float starLight;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float core=1.-smoothstep(.18,.48,d);float halo=exp(-d*d*48.)*.025;gl_FragColor=vec4(tint,(core+halo)*sceneFade);}`});
  material.uniforms.sceneFade={value:1};material.uniforms.reveal={value:1};
  const dust=new THREE.Points(geo,material);root.add(dust);
  // Keep the receding waves and the distant galaxy in separate volumes.
  const galaxyGroup=new THREE.Group();root.add(galaxyGroup);
  const nebula=createNebula(galaxyGroup);
  galaxyGroup.position.set(-1.4,.3,-3.5);galaxyGroup.rotation.set(.82,0,-.35);
  const galaxyMaterial=material.clone();galaxyMaterial.uniforms.mode.value=2;galaxyMaterial.uniforms.sceneFade.value=0;
  const galaxyGeo=new THREE.BufferGeometry();galaxyGeo.setAttribute('position',new THREE.BufferAttribute(galaxy,3));galaxyGeo.setAttribute('color',new THREE.BufferAttribute(c.slice(),3));
  const galaxyDust=new THREE.Points(galaxyGeo,galaxyMaterial);galaxyGroup.add(galaxyDust);
  const mistGeo=new THREE.BufferGeometry(),mistPositions=new Float32Array((mobile?2200:6500)*3);
  for(let i=0;i<mistPositions.length/3;i++){const a=Math.random()*Math.PI*2,r=4+Math.random()*8;mistPositions.set([Math.cos(a)*r,(Math.random()-.5)*2,Math.sin(a)*r],i*3);}
  mistGeo.setAttribute('position',new THREE.BufferAttribute(mistPositions,3));
  const mistMaterial=createStarMaterial(0x789dcd,0,.065);galaxyGroup.add(new THREE.Points(mistGeo,mistMaterial));
  const network=new THREE.Group();root.add(network);
  const nodes=[];for(let i=0;i<(mobile?320:520);i++)nodes.push(new THREE.Vector3((Math.random()-.5)*15,(Math.random()-.5)*10,(Math.random()-.5)*6));
  const mainRoute=Array.from({length:23},(_,i)=>{const u=i/22;return new THREE.Vector3(-6.7+13.4*u,Math.sin(u*Math.PI*2)*2.5+Math.sin(u*Math.PI*4)*.5,Math.sin(u*Math.PI*3)*1.6);});nodes.push(...mainRoute);
  const lines=[],lineColors=[];
  for(let i=0;i<nodes.length;i++)for(let k=i+1;k<nodes.length;k++){const d=nodes[i].distanceTo(nodes[k]);if(d<1.65){const start=nodes[i],end=nodes[k],mid=start.clone().lerp(end,.5);mid.z+=d*.16;const curve=new THREE.QuadraticBezierCurve3(start,mid,end);const b=.035+(1-d/1.65)*.12;for(let step=0;step<5;step++){lines.push(...curve.getPoint(step/5).toArray(),...curve.getPoint((step+1)/5).toArray());lineColors.push(b*.6,b,b*1.1,b*.6,b,b*1.1);}}}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(lineColors,3));network.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8,blending:THREE.AdditiveBlending})));
  const ng=new THREE.BufferGeometry().setFromPoints(nodes);network.add(new THREE.Points(ng,new THREE.PointsMaterial({color:'#8ad4d5',size:.065,transparent:true,blending:THREE.AdditiveBlending})));
  // A connected main route; its light is interpolated along the actual edges.
  const route=mainRoute;
  const path=new THREE.CatmullRomCurve3(route);
  const routeGeo=new THREE.BufferGeometry().setFromPoints(path.getPoints(300));
  network.add(new THREE.Line(routeGeo,new THREE.LineBasicMaterial({color:'#7b633e',transparent:true,opacity:.3})));
  const networkGeometry=network.children.map(child=>({child,rest:child.geometry.attributes.position.array.slice(),baseColors:child.geometry.attributes.color?.array.slice()}));
  const nodeColors=new Float32Array(nodes.length*3);ng.setAttribute('color',new THREE.BufferAttribute(nodeColors,3));network.children[1].material.vertexColors=true;network.children[1].material.color.set(0xffffff);
  const pulseOrigin=new THREE.Vector3();
  // Apply the same deformation to edges, nodes and the travelling spark.
  function breathe(x,y,z,time,out){
    const swell=1+Math.sin(time*1.35)*.018;
    return out.set(x*swell+Math.sin(y*.5+time*.65)*.065,y*swell+Math.sin(x*.45+time*.7)*.08,z+Math.sin(x*.4+y*.3+time*.6)*.12);
  }
  function routePoint(u,time,out){path.getPointAt(THREE.MathUtils.clamp(u,0,1),out);return breathe(out.x,out.y,out.z,time,out);}
  const textureCanvas=document.createElement('canvas');textureCanvas.width=64;textureCanvas.height=64;
  const tx=textureCanvas.getContext('2d'),gradient=tx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#fffbe5');gradient.addColorStop(.15,'#ffdb94');gradient.addColorStop(.4,'#f6b34a88');gradient.addColorStop(1,'#f6b34a00');tx.fillStyle=gradient;tx.fillRect(0,0,64,64);
  const sparkMaterial=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(textureCanvas),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  const head=new THREE.Sprite(sparkMaterial);head.scale.setScalar(.9);root.add(head);
  const trail=[];for(let i=0;i<90;i++){const s=new THREE.Sprite(sparkMaterial.clone());s.scale.setScalar(.24*(1-i/100));root.add(s);trail.push(s);}
  const haloPositions=new Float32Array((mobile?5000:12000)*3);for(let i=0;i<haloPositions.length;i++)haloPositions[i]=(Math.random()-.5)*(i%3===2?14:27);const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.BufferAttribute(haloPositions,3));const haloMaterial=createStarMaterial(0x91aec7,.42,.08);root.add(new THREE.Points(hg,haloMaterial));
  const goldPoint=new THREE.Vector3();
  function cometPoint(u,out){const a=u*Math.PI*5,r=7*(1-u)+.8;return out.set(Math.cos(a)*r,.1,Math.sin(a)*r).applyEuler(dust.rotation);}
  const labels=['神经传导','脉冲扩散','星云旋涡'];
  const descriptions=['青色节点连接成星际网络，金光正在沿主路前行。','一束光，唤起三层涟漪。金色先行，青色随后。','让金光沿着旋臂，飞向只属于你的星云。'];
  let started=null, phase=-1, active=true, startProgress=0,flight=null;
  const smooth=(x,a,b)=>THREE.MathUtils.smoothstep(x,a,b);
  function spiralPoint(u,out){const a=.6-u*Math.PI*2.4,r=7.4-6.5*smooth(u,0,1);return out.set(Math.cos(a)*r,.1,Math.sin(a)*r).applyEuler(galaxyGroup.rotation).add(galaxyGroup.position);}
  function starPoint(elapsed,out){
    const age=elapsed-5;
    if(age<=6)return out.copy(pulseOrigin).addScaledVector(new THREE.Vector3(1,0,0),(.8*Math.max(0,age)+2*(1-Math.exp(-2*Math.max(0,age)))));
    if(!flight){const end=spiralPoint(0,new THREE.Vector3()),tangent=spiralPoint(.002,new THREE.Vector3()).sub(end).multiplyScalar(1/.002/9);const from=pulseOrigin.clone().add(new THREE.Vector3(.8*6+2*(1-Math.exp(-12)),0,0));flight=new THREE.CubicBezierCurve3(from,from.clone().add(new THREE.Vector3(1.07,0,-.3)),end.clone().addScaledVector(tangent,-4/3),end);}
    if(elapsed<15)return flight.getPoint((elapsed-11)/4,out);
    return spiralPoint(THREE.MathUtils.clamp((elapsed-15)/9,0,1),out);
  }
  function update(t){if(!active)return;const seconds=t*.001;const rawElapsed=started===null?0:(t-started)/1000;const elapsed=rawElapsed<10?rawElapsed*.5:rawElapsed-5;const next=started===null?0:elapsed<5?0:elapsed<11?1:2;
    if(next!==phase){phase=next;document.querySelector('#eyebrow').textContent=`THREE.JS · 星光序章  0${phase+1} / 03`;document.querySelector('#title').textContent=labels[phase];document.querySelector('#description').textContent=descriptions[phase];document.querySelector('#hint').textContent=started===null?'点击开始，跟随这束光进入你的宇宙':'星光正在前行 · 请稍候';}
    const galaxyTime=Math.max(0,elapsed-11),pullback=1+.48*smooth(galaxyTime,0,4)-.62*smooth(galaxyTime,4,13);
    const framing=smooth(galaxyTime,4,13);
    root.position.set(1.4*framing,(mobile?-.7:-.35)-.3*framing,3.5*framing);root.scale.setScalar((mobile?.62:1)*pullback);
    galaxyGroup.visible=elapsed>9&&started!==null;
    const fade=1-smooth(elapsed,24.2,27);const reveal=smooth(elapsed,9.5,16)*fade;nebula.update(seconds,reveal);document.querySelector('#universe').style.opacity=String(1-smooth(elapsed,25,27));
    galaxyMaterial.uniforms.sceneFade.value=reveal;galaxyMaterial.uniforms.time.value=seconds;
    mistMaterial.uniforms.opacity.value=reveal*.22;mistMaterial.uniforms.time.value=seconds;haloMaterial.uniforms.time.value=seconds;
    // The outer spiral emerges first; its bright inner ring is revealed later.
    galaxyMaterial.uniforms.reveal.value=reveal;
    network.visible=phase<2;dust.visible=phase!==0&&elapsed<15;material.uniforms.time.value=seconds;material.uniforms.mode.value=phase;material.uniforms.wave.value=phase===1?(elapsed-5)*1.8:0;
    const age=Math.max(0,elapsed-5),handoff=THREE.MathUtils.smoothstep(age,0,2.6);
    const networkFade=phase===0?1:phase===1?(1-handoff)*.85+.15*(1-THREE.MathUtils.smoothstep(age,4.5,6)):0;
    const breathing=.8+.2*Math.sin(seconds*1.35);
    for(const {child,rest,baseColors} of networkGeometry){
      if(network.visible){const output=child.geometry.attributes.position.array;
        for(let j=0;j<rest.length;j+=3){breathe(rest[j],rest[j+1],rest[j+2],seconds,goldPoint);output[j]=goldPoint.x;output[j+1]=goldPoint.y;output[j+2]=goldPoint.z;}
        child.geometry.attributes.position.needsUpdate=true;
        const attr=child.geometry.attributes.color;if(attr){for(let j=0;j<rest.length;j+=3){const d=Math.hypot(rest[j]-head.position.x,rest[j+1]-head.position.y,rest[j+2]-head.position.z);const focus=Math.exp(-d*d/3.5),flicker=.75+.25*Math.sin(seconds*3+rest[j]*1.4+rest[j+2]);for(let k=0;k<3;k++){const base=baseColors?baseColors[j+k]:[.25,.65,.7][k];attr.array[j+k]=base*(.18+focus*2.4)*flicker+focus*[.32,.2,.06][k];}}attr.needsUpdate=true;}
      }
      child.material.opacity=networkFade*breathing*(child.isLineSegments?.8:child.isPoints?.85:.3);
      if(child.isPoints)child.material.size=.065*(.94+breathing*.12);
    }
    const endProgress=1;
    if(phase===0){const progress=started===null?(seconds*.035)%1:neuralProgress(elapsed/5);routePoint(progress,seconds,head.position);head.scale.setScalar(.9);head.material.opacity=1;for(let i=0;i<trail.length;i++){routePoint(progress-i*.0018,seconds,trail[i].position);trail[i].material.opacity=(1-i/trail.length)*.8;}}
    else{
      routePoint(endProgress,started*.001+10,pulseOrigin);dust.position.copy(pulseOrigin);material.uniforms.mode.value=1;material.uniforms.sceneFade.value=1-smooth(elapsed,10.5,15);
      for(let i=0;i<count;i++){const j=i*3,layer=i%3,localAge=age-layer*.65,radius=Math.max(.001,localAge*1.25),fade=Math.max(0,1-radius/12)*THREE.MathUtils.smoothstep(localAge,0,.32);for(let k=0;k<3;k++)p[j+k]=sphere[j+k]/3.8*radius;const tint=layer===0?[1,.7,.32]:[.32,.7,.78];for(let k=0;k<3;k++)c[j+k]=tint[k]*fade;}
      geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
      dust.rotation.set(.12,0,0);
      starPoint(elapsed,head.position);head.scale.setScalar(.9+Math.sin(Math.min(1,age/.8)*Math.PI)*.35);head.material.opacity=1-smooth(elapsed,24,26);
      for(let i=0;i<trail.length;i++){routePoint(endProgress-i*.0018,started*.001+10,trail[i].position);starPoint(Math.max(5,elapsed-i*.022),goldPoint);trail[i].position.lerp(goldPoint,handoff);trail[i].material.opacity=(1-i/trail.length)*(.8-.1*handoff)*head.material.opacity;}
      const follow=smooth(elapsed,8,12)*(1-smooth(elapsed,15,23));
      root.position.x-=head.position.x*.4*follow;root.position.y-=head.position.y*.18*follow;
    }
    if(camera){const neuralClose=smooth(rawElapsed,.2,1.8)*(1-smooth(rawElapsed,10,13)),galaxyClose=smooth(elapsed,13,16)*(1-smooth(elapsed,19,22));const close=started===null?0:Math.max(neuralClose,galaxyClose);root.updateMatrixWorld(true);const world=root.localToWorld(head.position.clone());camera.position.set(world.x*close,world.y*close,18*(1-close)+(world.z+(mobile?5.8:6.8))*close);camera.lookAt(world.x*close,world.y*close,world.z*close);camera.fov=48-6*close;camera.updateProjectionMatrix();}
    if(started!==null&&elapsed>27){active=false;root.visible=false;document.body.classList.remove('opening');complete();document.querySelector('#universe').style.opacity='1';}
  }
  return {update,start(t){if(started!==null)return;startProgress=0;started=t;document.querySelector('#action').style.display='none';document.querySelector('#hint').textContent='星光正在前行 · 请稍候';},reset(){active=true;started=null;phase=-1;flight=null;root.visible=true;dust.position.set(0,0,0);material.uniforms.sceneFade.value=1;document.body.classList.add('opening');},get active(){return active;}};
}





