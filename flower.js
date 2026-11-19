import * as THREE from './assets/three.module.js';

export function createFlower(scene,mobile,onFinished){
  const root=new THREE.Group();scene.add(root);root.visible=false;
  const ambient=new THREE.HemisphereLight(0xfffaf0,0x95717a,2.5);root.add(ambient);
  const key=new THREE.DirectionalLight(0xfff8eb,3.4);key.position.set(-4,6,8);root.add(key);
  const fill=new THREE.DirectionalLight(0xffd7dc,1.5);fill.position.set(4,-2,-2);root.add(fill);
  const petals=[],layers=6,cols=mobile?18:26,rows=mobile?22:30;
  for(let layer=0;layer<layers;layer++){
    const number=layer<2?9:8;
    for(let index=0;index<number;index++){
      const geometry=new THREE.BufferGeometry(),positions=new Float32Array((cols+1)*(rows+1)*3),colors=new Float32Array(positions.length),indices=[];
      for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
        const v=y/rows,u=x/cols,j=(y*(cols+1)+x)*3;
        const color=new THREE.Color().setRGB(1,.48+.38*v,.58+.28*v);
        color.multiplyScalar(.86+.14*Math.sin(u*Math.PI)+.035*Math.sin(u*90));colors.set([color.r,color.g,color.b],j);
        if(x<cols&&y<rows){const a=y*(cols+1)+x,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
      }
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setIndex(indices);
      const material=new THREE.MeshPhysicalMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.65,metalness:0,transmission:.08,thickness:.16,clearcoat:.12});
      const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;root.add(mesh);
      petals.push({mesh,positions,layer,angle:index/number*Math.PI*2+layer*2.399,seed:index*.8+layer*1.7});
    }
  }
  const heart=new THREE.Group();root.add(heart);
  const stamenMaterial=new THREE.MeshStandardMaterial({color:0xe8b64f,roughness:.7});
  for(let i=0;i<65;i++){const angle=i*2.399,r=Math.sqrt(i/65)*.46;const stamen=new THREE.Mesh(new THREE.SphereGeometry(.035,5,4),stamenMaterial);stamen.position.set(Math.cos(angle)*r,Math.sin(angle)*r,.25+Math.random()*.2);heart.add(stamen);}
  let current=-1,count=0,start=-1,openness=0,fallStart=0,finished=false;
  function deform(open){
    for(const petal of petals){const {positions,layer,angle,seed}=petal;
      const layerOpen=THREE.MathUtils.clamp((open-layer*.045)*1.3,0,1);
      const length=2.6-layer*.26,width=1.05-layer*.085,base=.12+(.1*(layers-layer));
      const tilt=.05+layerOpen*(1.65-layer*.09);
      for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
        const v=y/rows,u=x/cols*2-1,j=(y*(cols+1)+x)*3;
        const scallop=1+.045*Math.sin(u*15+seed)*Math.pow(v,5);
        const along=length*v*scallop;
        const across=u*width*Math.pow(Math.sin(Math.PI*v*.88),.7);
        const radial=base+Math.sin(tilt)*along-(u*u)*.18*v;
        const cup=.32*u*u*Math.sin(v*Math.PI);
        const fold=(Math.sin(u*36+seed+v*8)*.027+Math.sin(u*17-v*7)*.025)*v*v;
        positions[j]=Math.cos(angle)*radial-Math.sin(angle)*across;
        positions[j+1]=Math.sin(angle)*radial+Math.cos(angle)*across;
        positions[j+2]=Math.cos(tilt)*along+.11*layer+cup+fold+Math.pow(v,5)*layerOpen*.24*Math.cos(u*8);
      }
      petal.mesh.geometry.attributes.position.needsUpdate=true;petal.mesh.geometry.computeVertexNormals();
    }
    heart.scale.setScalar(.35+open*.65);
  }
  deform(0);
  return {trigger(t){if(current!==2||start>=0||finished)return null;count++;start=t;return count;},update(t,stage){
    if(stage!==current){current=stage;if(stage===2){count=0;start=-1;openness=0;finished=false;deform(0);for(const p of petals){p.mesh.position.set(0,0,0);p.mesh.rotation.set(0,0,0);}document.body.classList.add('flower-scene');}if(stage===3)fallStart=t;if(stage!==2&&stage!==3)document.body.classList.remove('flower-scene');}
    root.visible=stage===2||stage===3;scene.background=root.visible?new THREE.Color('#f4f1e8'):null;if(!root.visible)return;
    root.position.set(mobile?0:3.1,mobile?-1.5:-.6,0);root.scale.setScalar(mobile?.79:1.12);root.rotation.set(.15,Math.sin(t*.00015)*.12,t*.000025);
    if(stage===2){if(start>=0){const age=(t-start)/1000;const target=age<2.6?THREE.MathUtils.smoothstep(age,0,2.2):count===3?1:1-THREE.MathUtils.smoothstep(age,2.8,4.5);openness+=(target-openness)*.12;deform(openness);document.querySelector('#bloom-meter').style.width=`${Math.round(openness*100)}%`;if(age>4.7){start=-1;if(count===3){finished=true;onFinished();}else document.querySelector('#hint').textContent='花苞重新合拢了 · 再轻触一次，让她盛开';}}}
    else{const age=(t-fallStart)/1000;heart.scale.multiplyScalar(.98);for(const p of petals){const delay=p.layer*.16,fall=Math.max(0,age-delay);p.mesh.position.set(Math.cos(p.angle)*fall*.5,-fall*fall*.4,Math.sin(p.angle)*fall*.35);p.mesh.rotation.set(fall*.2,fall*.13*Math.sin(p.seed),fall*.12*Math.cos(p.seed));}}
  },get busy(){return start>=0;},get count(){return count;},root};
}

