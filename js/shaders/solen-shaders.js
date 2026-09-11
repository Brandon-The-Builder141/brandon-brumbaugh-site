import { SIMPLEX_NOISE_GLSL, FRESNEL_GLSL } from './transition-shaders.js';

// Solen's material: organic, luminous, "intelligent-feeling" — slow noise
// wobble + a soft fresnel glow. Distinct from the hero shader (different
// noise frequency/speed, always-on glow, no morph toward "physical").

export const solenVertexShader = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;

${SIMPLEX_NOISE_GLSL}

void main(){
  vec3 pos = position;
  float n = snoise(pos * 2.2 + uTime * 0.25);
  pos += normal * n * 0.06;
  vNormal = normalMatrix * normal;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const solenFragmentShader = `
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vViewDir;

${FRESNEL_GLSL}

void main(){
  vec3 n = normalize(vNormal);
  float fres = fresnel(vViewDir, n, 1.8);
  vec3 color = uColor * (0.5 + fres * 1.3);
  gl_FragColor = vec4(color, 0.55 + fres * 0.4);
}
`;

export function makeSolenUniforms(colorVec3) {
  return {
    uTime: { value: 0 },
    uColor: { value: colorVec3 }
  };
}
