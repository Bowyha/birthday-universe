import * as THREE from './assets/three.module.js';

// Screen-size limits and a circular kernel also apply when the camera flies
// through the field: foreground points never become large square billboards.
export function createStarMaterial(color,opacity,size){
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},opacity:{value:opacity},tint:{value:new THREE.Color(color)},pixel:{value:Math.min(globalThis.devicePixelRatio||1,2)},size:{value:size}},vertexShader:`
 uniform float time,pixel,size;varying float light,visibility;
 void main(){vec4 p=modelViewMatrix*vec4(position,1.);float seed=fract(sin(dot(position,vec3(12.9898,78.233,43.113)))*43758.5453);
 light=.72+.28*sin(time*(.65+seed)+seed*63.);visibility=smoothstep(1.8,4.,-p.z);
 gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*160./max(1.,-p.z),.85,2.6)*pixel;}`,
 fragmentShader:`uniform vec3 tint;uniform float opacity;varying float light,visibility;
 void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float edge=1.-smoothstep(.25,.5,d);gl_FragColor=vec4(tint*(.8+light*.5),edge*opacity*visibility);}`});return material;
}
