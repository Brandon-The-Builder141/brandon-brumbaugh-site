import * as THREE from 'three';
import { PROFILE } from '../data/profile.js';
import { getQualityTier, clampDPR, REDUCED_MOTION, makeSceneReport, safeSize } from './scene-utils.js';

// A small, non-full-bleed canvas that sits behind the real DOM timeline
// (.journey-path keeps every word of the story as readable text — this is
// atmosphere and wayfinding only). GSAP ScrollTrigger scrubs a camera along a
// Catmull-Rom spline as the visitor scrolls past each milestone, lighting the
// matching waypoint marker.

export function initJourney(gsapRef, ScrollTriggerRef) {
  const tier = getQualityTier();
  if (!tier.journeyScene || REDUCED_MOTION) return null;

  const section = document.getElementById('journey');
  const pathEl = document.querySelector('.journey-path');
  if (!section || !pathEl) return null;

  const canvas = document.createElement('canvas');
  canvas.id = 'journey-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  pathEl.style.position = 'relative';
  pathEl.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(clampDPR(tier));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 50);

  const milestones = PROFILE.journey;
  const points = milestones.map((m, i) => {
    const angle = i * 0.9;
    return new THREE.Vector3(Math.sin(angle) * 1.4, -i * 1.8, Math.cos(angle) * 1.4 - 3);
  });
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);

  const tubeGeo = new THREE.TubeGeometry(curve, 200, 0.015, 6, false);
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0x2a2d31, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Mesh(tubeGeo, tubeMat));

  const markers = points.map(p => {
    const geo = new THREE.SphereGeometry(0.09, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xe7a552, transparent: true, opacity: 0.35 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(p);
    scene.add(mesh);
    return mesh;
  });

  function resize() {
    const { w, h } = safeSize(pathEl, { w: 900, h: 600 });
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = true;
  const io = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 });
  io.observe(section);

  let raf;
  let currentT = 0;
  function render() {
    raf = requestAnimationFrame(render);
    if (!visible) return;
    const pos = curve.getPointAt(Math.min(Math.max(currentT, 0), 0.999));
    const lookAhead = curve.getPointAt(Math.min(Math.max(currentT + 0.02, 0), 0.999));
    camera.position.set(pos.x, pos.y, pos.z + 2.4);
    camera.lookAt(lookAhead.x, lookAhead.y, lookAhead.z);

    const activeIdx = Math.round(currentT * (markers.length - 1));
    markers.forEach((m, i) => {
      const active = i === activeIdx;
      m.material.opacity = active ? 0.95 : 0.3;
      const s = active ? 1.6 : 1;
      m.scale.set(s, s, s);
    });

    renderer.render(scene, camera);
  }
  render();

  let scrollTriggerInstance = null;
  if (gsapRef && ScrollTriggerRef) {
    gsapRef.registerPlugin(ScrollTriggerRef);
    scrollTriggerInstance = ScrollTriggerRef.create({
      trigger: pathEl,
      start: 'top center',
      end: 'bottom center',
      scrub: 0.6,
      onUpdate: self => { currentT = self.progress; }
    });
  }

  return {
    report() {
      return makeSceneReport('Journey Scene', {
        waypoints: points.length,
        curve: 'THREE.CatmullRomCurve3',
        scroll: scrollTriggerInstance ? 'GSAP ScrollTrigger (scrubbed)' : 'none'
      });
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      if (scrollTriggerInstance) scrollTriggerInstance.kill();
      canvas.remove();
    }
  };
}
