import * as THREE from './assets/three.module.js';

export function createNebula(parent){
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},opacity:{value:0}},vertexShader:`varying vec2 uvCloud;void main(){uvCloud=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 varying vec2 uvCloud;uniform float time,opacity;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float n=0.,amp=.5;for(int i=0;i<5;i++){n+=amp*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+3.1;amp*=.5;}return n;}
 void main(){vec2 p=(uvCloud-.5)*16.;float r=length(p),a=atan(p.y,p.x);
 float distortion=fbm(p*1.7+time*.025);float spiral=.5+.5*cos(a*4.-r*2.55+distortion*3.2);
 float cloud=fbm(p*3.6+vec2(distortion*2.,time*.012));
 float fine=fbm(p*13.+distortion*2.);
 float lanes=smoothstep(.3,.7,fine);
 float strands=pow(spiral,3.7)*smoothstep(.32,.7,cloud)*(.35+lanes*.65);
 float disk=(1.-smoothstep(5.8,7.6,r))*smoothstep(.6,1.02,r);
 float ring=exp(-pow((r-1.1)*7.5,2.));
 float density=(strands*.85+cloud*.018)*disk+ring*(.35+fine*.6)*.55;
 vec3 amber=vec3(1.,.42,.12),blue=vec3(.15,.37,.85);
 float cool=smoothstep(2.3,7.,r)*smoothstep(.42,.68,distortion);
 vec3 color=mix(amber,blue,cool);color=mix(color,vec3(1.,.89,.6),ring*.85);
 color*=.65+fine*.9;float alpha=clamp(density*opacity,0.,.24);
 gl_FragColor=vec4(color,alpha);
 }`});
 const planes=[];for(let i=0;i<3;i++){const m=i===0?material:material.clone(),mesh=new THREE.Mesh(new THREE.PlaneGeometry(16,16),m);mesh.rotation.x=-Math.PI/2;mesh.position.y=(i-1)*.17;parent.add(mesh);planes.push(mesh);}
 return {update(t,opacity){for(let i=0;i<planes.length;i++){planes[i].material.uniforms.time.value=t+i*6.2;planes[i].material.uniforms.opacity.value=opacity*(i===1?.24:.1);}}};
}
