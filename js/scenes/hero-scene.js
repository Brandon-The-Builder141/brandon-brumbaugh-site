import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { heroVertexShader, heroFragmentShader, makeHeroUniforms } from '../shaders/hero-shaders.js';
import { getQualityTier, clampDPR, pauseWhenOffscreen, REDUCED_MOTION, makeSceneReport, safeSize } from './scene-utils.js';

export function initHero() {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('hero-canvas');
  if (!hero || !canvas) return null;
  const tier = getQualityTier();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(clampDPR(tier));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, hero.clientWidth / hero.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  const group = new THREE.Group();
  scene.add(group);

  const detail = { HIGH: 4, MEDIUM: 3, LOW: 2, FALLBACK: 1 }[tier.name] || 2;
  const geo = new THREE.IcosahedronGeometry(1.9, detail);
  const uniforms = makeHeroUniforms();
  const mat = new THREE.ShaderMaterial({
    vertexShader: heroVertexShader,
    fragmentShader: heroFragmentShader,
    uniforms,
    transparent: true
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const bgCount = Math.round(500 * tier.particles) || 80;
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(bgCount * 3);
  for (let j = 0; j < bgCount; j++) {
    bgPos[j * 3] = (Math.random() - 0.5) * 20;
    bgPos[j * 3 + 1] = (Math.random() - 0.5) * 12;
    bgPos[j * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  const bgMat = new THREE.PointsMaterial({ color: 0x9a9d9f, size: 0.02, transparent: true, opacity: 0.4 });
  scene.add(new THREE.Points(bgGeo, bgMat));

  let mouseX = 0, mouseY = 0, targetRotY = 0, targetRotX = 0;
  function onMove(e) {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  }
  window.addEventListener('mousemove', onMove);

  const MIN_BLOOM_SURFACE = 200; // UnrealBloomPass's internal mip chain can
  // legitimately hit a zero-size render target on a very small surface —
  // below this it's skipped rather than guarded frame-by-frame.
  let composer = null;
  function buildComposer() {
    const { w, h } = safeSize(hero);
    if (w < MIN_BLOOM_SURFACE || h < MIN_BLOOM_SURFACE) return;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.4, 0.3);
    composer.addPass(bloom);
  }

  function resize() {
    const { w, h } = safeSize(hero);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (composer) {
      if (w < MIN_BLOOM_SURFACE || h < MIN_BLOOM_SURFACE) composer = null;
      else composer.setSize(w, h);
    }
  }
  resize();
  if (tier.bloom) buildComposer();
  window.addEventListener('resize', resize);

  let visible = true;
  const disposeVisibility = pauseWhenOffscreen(hero, v => { visible = v; });

  const clock = new THREE.Clock();
  let raf;
  let wireframeOn = false;

  function animate() {
    raf = requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    if (!REDUCED_MOTION) {
      group.rotation.y += 0.0018;
      targetRotY += (mouseX * 0.5 - targetRotY) * 0.03;
      targetRotX += (mouseY * 0.3 - targetRotX) * 0.03;
      group.rotation.y += targetRotY * 0.01;
      group.position.y = Math.sin(t * 0.4) * 0.08;
      uniforms.uPointer.value = [mouseX, mouseY];

      const sc = window.scrollY / (window.innerHeight * 1.6);
      const morph = Math.min(Math.max(sc, 0), 1);
      uniforms.uMorph.value = morph;
      camera.position.z = 7 + morph * 1.5;
    }

    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  animate();

  return {
    setQuality(newTier) {
      renderer.setPixelRatio(clampDPR(newTier));
      if (newTier.bloom && !composer) buildComposer();
      if (!newTier.bloom && composer) composer = null;
    },
    setWireframe(on) {
      wireframeOn = on;
      mat.wireframe = on;
    },
    report() {
      return makeSceneReport('Hero World', {
        geometry: 'IcosahedronGeometry (subdivision ' + detail + ')',
        vertices: geo.attributes.position.count,
        shader: 'custom GLSL: hero-shaders.js (4-stage scroll morph: blueprint → structural → data → organic)',
        drawCalls: renderer.info.render.calls,
        geometries: renderer.info.memory.geometries,
        bloom: !!composer,
        wireframe: wireframeOn
      });
    },
    dispose() {
      cancelAnimationFrame(raf);
      disposeVisibility();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    }
  };
}
