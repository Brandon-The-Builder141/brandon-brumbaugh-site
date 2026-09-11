import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { PROJECTS } from '../data/projects.js';
import { getQualityTier, clampDPR, pauseWhenOffscreen, REDUCED_MOTION, makeSceneReport, safeSize } from './scene-utils.js';
import { solenVertexShader, solenFragmentShader, makeSolenUniforms } from '../shaders/solen-shaders.js';
import {
  blueprintVertexShader, blueprintFragmentShader,
  scanVertexShader, scanFragmentShader
} from '../shaders/transition-shaders.js';

const POS = {
  solen: [-2.6, 1.3, 0],
  'iron-legion': [2.6, 1.1, -0.6],
  'long-way-around': [0, 2.4, 0.8],
  alphaquote: [-2.2, -1.5, 0.6],
  syntrax: [2.2, -1.6, 0.4],
  realmrisers: [0, -2.6, -0.8]
};

function colorVec3(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

function makeMaterial(project) {
  const color = new THREE.Color(project.color);
  if (project.id === 'realmrisers') {
    // low-poly faceted gem: the most stylized/game-like material in the set,
    // animated by hue-shifting the real material color (no shader needed)
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.25, metalness: 0.4 });
    return { mat, kind: 'gem' };
  }
  switch (project.shape) {
    case 'organic': {
      const mat = new THREE.ShaderMaterial({
        vertexShader: solenVertexShader,
        fragmentShader: solenFragmentShader,
        uniforms: makeSolenUniforms(colorVec3(project.color)),
        transparent: true
      });
      return { mat, kind: 'shader-time' };
    }
    case 'structural': {
      const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.6, metalness: 0.25 });
      return { mat, kind: 'static' };
    }
    case 'blueprint': {
      const mat = new THREE.ShaderMaterial({
        vertexShader: blueprintVertexShader,
        fragmentShader: blueprintFragmentShader,
        uniforms: { uTime: { value: 0 }, uColor: { value: colorVec3(project.color) } },
        transparent: true,
        side: THREE.DoubleSide
      });
      return { mat, kind: 'shader-time' };
    }
    case 'grid': {
      const mat = new THREE.ShaderMaterial({
        vertexShader: scanVertexShader,
        fragmentShader: scanFragmentShader,
        uniforms: { uTime: { value: 0 }, uColor: { value: colorVec3(project.color) } },
        transparent: true
      });
      return { mat, kind: 'shader-time' };
    }
    case 'orbit': {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 });
      return { mat, kind: 'static' };
    }
    default:
      return { mat: new THREE.MeshBasicMaterial({ color, wireframe: true }), kind: 'static' };
  }
}

function makeGeometry(shape) {
  switch (shape) {
    case 'organic': return new THREE.SphereGeometry(0.42, 24, 24);
    case 'structural': return new THREE.BoxGeometry(0.62, 0.62, 0.62);
    case 'orbit': return new THREE.TorusGeometry(0.42, 0.05, 12, 48);
    case 'blueprint': return new THREE.BoxGeometry(0.7, 0.7, 0.7);
    case 'grid': return new THREE.IcosahedronGeometry(0.4, 1);
    case 'gem': return new THREE.IcosahedronGeometry(0.42, 0);
    default: return new THREE.IcosahedronGeometry(0.42, 1);
  }
}

export function initConstellation({ onHover }) {
  const wrap = document.querySelector('.constellation-wrap');
  if (!wrap) return null;
  const canvas = document.getElementById('const-canvas');
  const tier = getQualityTier();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(clampDPR(tier));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 9.5);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(3, 4, 5);
  scene.add(key);

  const nodes = [];
  const shaderMats = [];
  PROJECTS.forEach(p => {
    const geo = makeGeometry(p.shape);
    const { mat, kind } = makeMaterial(p);
    const mesh = new THREE.Mesh(geo, mat);
    const pos = POS[p.id] || [0, 0, 0];
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.userData = p;
    scene.add(mesh);

    if (p.shape === 'structural') {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x0b0c0e, transparent: true, opacity: 0.5 }));
      mesh.add(edges);
    }
    if (kind === 'shader-time') shaderMats.push(mat);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.05 }));
    mesh.add(glow);
    nodes.push(mesh);
  });

  // gem color-shift for RealmRisers (non-shader, simple animated hue)
  const realmMesh = nodes.find(n => n.userData.id === 'realmrisers');

  const lineMat = new THREE.LineBasicMaterial({ color: 0x2a2d31, transparent: true, opacity: 0.55 });
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const g = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
      scene.add(new THREE.Line(g, lineMat));
    }
  }

  const starCount = Math.round(400 * tier.particles) || 60;
  const sGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(starCount * 3);
  for (let k = 0; k < starCount; k++) {
    sPos[k * 3] = (Math.random() - 0.5) * 16;
    sPos[k * 3 + 1] = (Math.random() - 0.5) * 10;
    sPos[k * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0x6b6e70, size: 0.015, transparent: true, opacity: 0.5 })));

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = !REDUCED_MOTION;
  controls.autoRotateSpeed = 0.35;

  function resize() {
    const { w, h } = safeSize(wrap);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);
  let hovered = null;

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -10; mouse.y = -10; });

  let visible = true;
  const disposeVisibility = pauseWhenOffscreen(wrap, v => { visible = v; });

  const clock = new THREE.Clock();
  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();

    shaderMats.forEach(m => { if (m.uniforms.uTime) m.uniforms.uTime.value = t; });

    if (!REDUCED_MOTION) {
      nodes.forEach((n, idx) => {
        n.rotation.x += 0.003;
        n.rotation.y += 0.005;
        n.position.y += Math.sin(t * 0.6 + idx) * 0.0006;
      });
      if (realmMesh) {
        realmMesh.material.color.setHSL((t * 0.05) % 1, 0.55, 0.62);
      }
      controls.update();
    }

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(nodes);
    if (hits.length) {
      const target = hits[0].object;
      if (hovered !== target) { hovered = target; onHover(target.userData); }
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'grab';
    }

    renderer.render(scene, camera);
  }
  animate();

  return {
    setQuality(newTier) {
      renderer.setPixelRatio(clampDPR(newTier));
    },
    setWireframe(on) {
      nodes.forEach(n => { if ('wireframe' in n.material) n.material.wireframe = on; });
    },
    report() {
      return makeSceneReport('Project Constellation', {
        meshes: nodes.length,
        customShaderMaterials: shaderMats.length,
        stars: starCount,
        bloom: 'none (identity carried by per-project shaders instead — see Hero for the site\'s one bloom pass)',
        controls: 'THREE.OrbitControls (damped)'
      });
    },
    dispose() {
      cancelAnimationFrame(raf);
      disposeVisibility();
      window.removeEventListener('resize', resize);
    }
  };
}
