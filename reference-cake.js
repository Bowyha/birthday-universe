import * as THREE from './assets/three.module.js';

// Preserve the reference's luminous windows in the texture instead of rebuilding
// its tracery out of low-detail primitives. A cylinder keeps the existing spin.
export function mountReferenceCake(parent,oldBody){
 const loader=new THREE.TextureLoader();
 Promise.all([
  loader.loadAsync(new URL('./assets/cake-reference.png',import.meta.url).href),
  loader.loadAsync(new URL('./assets/cake-side-wrap.png',import.meta.url).href)
 ]).then(([map,sideMap])=>{
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  function opaqueSurface(frosting){
   const material=new THREE.MeshBasicMaterial({map,transparent:false,alphaTest:0,side:THREE.FrontSide,depthWrite:true,toneMapped:false});
   const color=new THREE.Color(frosting);
   material.onBeforeCompile=shader=>{
    shader.uniforms.frostingFill={value:color};
    shader.fragmentShader='uniform vec3 frostingFill;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      // A cutout's empty background is frosting here, never a hole in the wall.
      diffuseColor.rgb=mix(frostingFill,diffuseColor.rgb,texture2D(map,vMapUv).a);
      diffuseColor.a=1.;`);
   };
   material.customProgramCacheKey=()=>`solid-reference-cake-${frosting}`;
   return material;
  }
  sideMap.colorSpace=THREE.SRGBColorSpace;sideMap.anisotropy=8;
  sideMap.wrapS=THREE.RepeatWrapping;
  const material=new THREE.MeshBasicMaterial({map:sideMap,transparent:false,side:THREE.FrontSide,depthWrite:true,toneMapped:false});
  const topMaterial=opaqueSurface('#fff9e9');
  // Standard cylindrical UVs advance uniformly once around the circumference.
  // Never project the cutout photo by x: that folds/reverses at both flanks.
  const side=new THREE.CylinderGeometry(2,2,3.08,128,24,true);
  const shell=new THREE.Mesh(side,material);shell.name='reference-cake-body';shell.position.y=-.35;
  const top=new THREE.CircleGeometry(2,96),topUV=top.attributes.uv;
  for(let i=0;i<topUV.count;i++)topUV.setXY(i,.5+(topUV.getX(i)-.5)*.73,.875+(topUV.getY(i)-.5)*.09);
  const cap=new THREE.Mesh(top,topMaterial);cap.name='reference-cake-icing';cap.rotation.x=-Math.PI/2;cap.position.y=1.19;
  const bottom=new THREE.Mesh(new THREE.CircleGeometry(2,96),new THREE.MeshBasicMaterial({color:0xc9c0da}));bottom.name='reference-cake-bottom';bottom.rotation.x=Math.PI/2;bottom.position.y=-1.89;
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.025,2.025,.045,128),new THREE.MeshStandardMaterial({color:0xc9c0da,metalness:.35,roughness:.3}));base.name='reference-cake-base-rim';base.position.y=-1.89;
  parent.add(shell,cap,bottom,base);for(const child of oldBody)child.visible=false;
 }).catch(()=>{document.querySelector('#micStatus').textContent='CAKE DETAIL COULD NOT LOAD · PLEASE REFRESH';});
}
