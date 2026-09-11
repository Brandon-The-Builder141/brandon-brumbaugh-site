import { SIMPLEX_NOISE_GLSL, FRESNEL_GLSL } from './transition-shaders.js';

// The hero's single shared mesh: uMorph 0 = "physical" (flat-shaded, faceted,
// amber steel/blueprint read), uMorph 1 = "digital" (noise-displaced, glowing
// blue/violet fresnel read). One continuous geometry transforming between the
// two, driven by scroll — the literal "physical becomes digital" idea from
// the brand brief, instead of two separate static halves.

export const heroVertexShader = `
uniform float uMorph;
uniform float uTime;
uniform vec2 uPointer;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisplace;

${SIMPLEX_NOISE_GLSL}

void main(){
  vec3 pos = position;
  float n = snoise(pos * 1.6 + uTime * 0.12 + vec3(uPointer * 0.6, 0.0));
  float displace = n * 0.32 * uMorph;
  pos += normal * displace;
  vDisplace = displace;
  vNormal = normalMatrix * normal;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const heroFragmentShader = `
uniform float uMorph;
uniform vec3 uColorPhysical;
uniform vec3 uColorDigital;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisplace;

${FRESNEL_GLSL}

void main(){
  vec3 n = normalize(vNormal);
  float fres = fresnel(vViewDir, n, mix(2.2, 1.4, uMorph));
  vec3 base = mix(uColorPhysical, uColorDigital, uMorph);
  float glow = fres * mix(0.35, 1.1, uMorph);
  vec3 color = base * (0.55 + vDisplace * 0.5) + base * glow;
  float alpha = mix(0.92, 0.55 + fres * 0.4, uMorph);
  gl_FragColor = vec4(color, alpha);
}
`;

export function makeHeroUniforms() {
  return {
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uPointer: { value: [0, 0] },
    uColorPhysical: { value: [0.906, 0.647, 0.322] }, // amber
    uColorDigital: { value: [0.427, 0.722, 1.0] }      // blue
  };
}
