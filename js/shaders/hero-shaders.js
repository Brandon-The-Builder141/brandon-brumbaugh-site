import { SIMPLEX_NOISE_GLSL, FRESNEL_GLSL } from './transition-shaders.js';

// The hero's single shared mesh moves through four deliberate states as the
// visitor scrolls, instead of one continuous blend between two colors:
//   0.00 — BLUEPRINT   thin cyan grid lines over a near-dark faceted form
//   0.33 — STRUCTURAL  solid faceted amber steel, minimal displacement
//   0.66 — DATA        sparse speckled violet, breaking apart into points
//   1.00 — ORGANIC     glowing blue digital form, full noise displacement
// Physical builder becomes digital builder, in four readable steps rather
// than a single noise/intensity slider.

export const heroVertexShader = `
uniform float uMorph;
uniform float uTime;
uniform vec2 uPointer;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisplace;
varying vec2 vUv;
varying vec3 vPos;

${SIMPLEX_NOISE_GLSL}

void main(){
  vec3 pos = position;
  float n = snoise(pos * 1.6 + uTime * 0.12 + vec3(uPointer * 0.6, 0.0));
  float displace = n * 0.32 * uMorph;
  pos += normal * displace;
  vDisplace = displace;
  vUv = uv;
  vPos = pos;
  vNormal = normalMatrix * normal;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const heroFragmentShader = `
uniform float uMorph;
uniform float uTime;
uniform vec3 uColorPhysical;
uniform vec3 uColorDigital;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisplace;
varying vec2 vUv;
varying vec3 vPos;

${FRESNEL_GLSL}
${SIMPLEX_NOISE_GLSL}

float bump(float x, float c, float w){ return clamp(1.0 - abs(x - c) / w, 0.0, 1.0); }

void main(){
  vec3 n = normalize(vNormal);
  float fres = fresnel(vViewDir, n, mix(2.4, 1.3, uMorph));

  float w0 = bump(uMorph, 0.0, 0.3);   // blueprint
  float w1 = bump(uMorph, 0.33, 0.28); // structural
  float w2 = bump(uMorph, 0.66, 0.28); // data
  float w3 = bump(uMorph, 1.0, 0.32);  // organic
  float wsum = max(w0 + w1 + w2 + w3, 0.0001);

  vec3 cyan = vec3(0.42, 0.85, 0.95);
  vec3 violet = vec3(0.63, 0.55, 0.98);

  vec3 blueprintCol = mix(vec3(0.03, 0.04, 0.05), cyan, 0.25 + fres * 0.5);
  vec3 structuralCol = uColorPhysical * (0.55 + vDisplace * 0.6 + fres * 0.35);
  vec3 dataCol = mix(uColorPhysical, violet, 0.6) * (0.5 + fres * 0.8);
  vec3 organicCol = uColorDigital * (0.5 + vDisplace * 0.5) + uColorDigital * fres * 1.1;

  vec3 color = (blueprintCol * w0 + structuralCol * w1 + dataCol * w2 + organicCol * w3) / wsum;

  // blueprint grid lines, only visible in the blueprint band
  float gx = abs(fract(vUv.x * 14.0) - 0.5);
  float gy = abs(fract(vUv.y * 14.0) - 0.5);
  float grid = 1.0 - smoothstep(0.0, 0.035, min(gx, gy));
  color += cyan * grid * w0 * 1.4;

  // data band: break the surface into sparse speckles rather than a solid fill
  float speck = snoise(vPos * 9.0 + uTime * 0.2);
  float speckMask = smoothstep(0.15, 0.75, speck);

  float alpha = mix(0.92, 0.5 + fres * 0.45, uMorph);
  alpha = mix(alpha, alpha * mix(1.0, speckMask, 0.85), w2 / wsum);
  alpha = mix(alpha, alpha * (0.4 + grid * 0.9), w0 / wsum * 0.6);

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
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
