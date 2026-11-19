import * as THREE from './assets/three.module.js';

export function bloomFrames(open){
  const progress=THREE.MathUtils.clamp(open,0,1)*3;
  const first=Math.min(2,Math.floor(progress));
  return {first,second:first+1,mix:progress-first};
}

// Fixed-size surface. Actual bud/early/half/full morphology comes from four
// registered photographs; no mesh scale or squeeze is used to imitate blooming.
export function makeBloomAtlas(map,type,flows){
  const width=type===0?5.9:type===1?5.7:5.9;
  const geometry=new THREE.PlaneGeometry(width,width*map.image.height/map.image.width,24,24);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{atlas:{value:map},forward:{value:flows[0].forward},backward:{value:flows[0].backward},frameA:{value:0},frameB:{value:1},blend:{value:0},opacity:{value:1}},
    vertexShader:`varying vec2 imageUV;void main(){imageUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      uniform sampler2D atlas,forward,backward;uniform float frameA,frameB,blend,opacity;
      varying vec2 imageUV;
      vec4 state(float frame,vec2 coord){
        vec2 tile=vec2(mod(frame,2.),1.-floor(frame/2.));
        vec2 local=clamp(coord,vec2(.003),vec2(.997));
        return texture2D(atlas,(tile+local)*.5);
      }
      void main(){
        float t=blend*blend*blend*(blend*(blend*6.-15.)+10.);
        vec2 motionA=texture2D(forward,imageUV).rg-vec2(128./255.);
        vec2 motionB=texture2D(backward,imageUV).rg-vec2(128./255.);
        vec4 a=state(frameA,imageUV-motionA*t);
        vec4 b=state(frameB,imageUV-motionB*(1.-t));
        float alpha=mix(a.a,b.a,t);
        if(alpha<.008)discard;
        vec3 rgb=mix(a.rgb*a.a,b.rgb*b.a,t)/max(alpha,.00001);
        gl_FragColor=vec4(rgb,alpha*opacity);
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
  return {mesh,setOpen(open){const f=bloomFrames(open);material.uniforms.frameA.value=f.first;material.uniforms.frameB.value=f.second;material.uniforms.blend.value=f.mix;material.uniforms.forward.value=flows[f.first].forward;material.uniforms.backward.value=flows[f.first].backward;material.uniforms.opacity.value=1;},setOpacity(value){material.uniforms.opacity.value=value;}};
}
