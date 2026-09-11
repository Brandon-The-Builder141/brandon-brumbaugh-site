import { SIMPLEX_NOISE_GLSL, FRESNEL_GLSL } from './transition-shaders.js';

// Solen's material — "a digital organism thinking," not a glowing AI orb.
// Two layered noise octaves at different frequencies/speeds give the surface
// a sense of internal structure shifting rather than one uniform wobble;
// fresnel blends a cool base into a warm amber rim (calm + intelligent, not
// robotic); a faked "internal light" brightens surface facing the viewer
// (inverse fresnel) so it reads as lit from within; uPointer lets it lean
// toward the visitor's cursor; uFocus (0→1, driven by the constellation's
// focus system) is what makes it "become more active" when selected.

export const solenVertexShader = `
uniform float uTime;
uniform float uFocus;
uniform vec2 uPointer;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vFilament;

${SIMPLEX_NOISE_GLSL}

void main(){
  vec3 pos = position;

  float slow = snoise(pos * 1.4 + uTime * 0.15);
  float fast = snoise(pos * 3.4 - uTime * 0.35 + vec3(uPointer * 0.8, 0.0));
  float filament = snoise(pos * 6.0 + uTime * 0.6);

  float amp = mix(0.045, 0.11, uFocus);
  float displace = slow * amp + fast * amp * 0.35 * (0.4 + uFocus * 0.6);
  pos += normal * displace;

  vFilament = smoothstep(0.55, 0.95, filament) * (0.5 + uFocus * 0.8);
  vNormal = normalMatrix * normal;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const solenFragmentShader = `
uniform vec3 uColor;
uniform float uTime;
uniform float uFocus;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vFilament;

${FRESNEL_GLSL}

void main(){
  vec3 n = normalize(vNormal);
  float fres = fresnel(vViewDir, n, mix(2.0, 1.3, uFocus));
  float inner = 1.0 - fres; // faces the viewer -> reads as internally lit

  vec3 warm = vec3(0.98, 0.75, 0.48);
  vec3 base = mix(uColor, warm, fres * (0.45 + uFocus * 0.25));

  vec3 color = base * (0.4 + inner * 0.5) + base * fres * (0.9 + uFocus * 0.7);
  color += warm * vFilament * 0.6;

  float alpha = 0.55 + fres * 0.4 + uFocus * 0.15;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

export function makeSolenUniforms(colorVec3) {
  return {
    uTime: { value: 0 },
    uColor: { value: colorVec3 },
    uFocus: { value: 0 },
    uPointer: { value: [0, 0] }
  };
}
