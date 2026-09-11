// Shared GLSL snippets reused across the hero, Solen, AlphaQuote, Syntrax, and
// RealmRisers materials — one noise function and one fresnel function instead
// of copy-pasted shader math in five places.

// Classic Ashima/webgl-noise 3D simplex noise (public domain / MIT-style license,
// ubiquitous in open WebGL work) — used for all organic displacement.
export const SIMPLEX_NOISE_GLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const FRESNEL_GLSL = `
float fresnel(vec3 viewDir, vec3 normal, float power){
  return pow(1.0 - clamp(dot(viewDir, normal), 0.0, 1.0), power);
}
`;

// AlphaQuote: blueprint grid lines on a transparent fill, with a slow scan
// pulse — "construction plans transforming into software/data."
export const blueprintVertexShader = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const blueprintFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float gx = abs(fract(vUv.x * 10.0) - 0.5);
  float gy = abs(fract(vUv.y * 10.0) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.04, min(gx, gy));
  float scan = smoothstep(0.0, 0.02, abs(fract(vUv.y - uTime * 0.15) - 0.5) - 0.47);
  float alpha = clamp(line * 0.6 + scan * 0.5, 0.0, 0.85);
  gl_FragColor = vec4(uColor, alpha);
}
`;

// Syntrax: a moving emissive band sweeps the surface — network scanning /
// defensive detection.
export const scanVertexShader = `
varying vec3 vNormal;
varying vec2 vUv;
void main(){
  vUv = uv;
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const scanFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float band = smoothstep(0.0, 0.06, 0.06 - abs(fract(vUv.y * 1.0 - uTime * 0.35) - 0.5) + 0.44);
  vec3 color = uColor * (0.35 + band * 1.6);
  gl_FragColor = vec4(color, 0.5 + band * 0.5);
}
`;
