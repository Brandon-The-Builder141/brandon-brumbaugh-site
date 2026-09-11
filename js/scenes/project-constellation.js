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
      return { mat, kind: 'solen' };
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
    case 'organic': return new THREE.SphereGeometry(0.42, 32, 32);
    case 'structural': return new THREE.BoxGeometry(0.62, 0.62, 0.62);
    case 'orbit': return new THREE.TorusGeometry(0.42, 0.05, 12, 48);
    case 'blueprint': return new THREE.BoxGeometry(0.7, 0.7, 0.7);
    case 'grid': return new THREE.IcosahedronGeometry(0.4, 1);
    case 'gem': return new THREE.IcosahedronGeometry(0.42, 0);
    default: return new THREE.IcosahedronGeometry(0.42, 1);
  }
}

// Iron Legion signature moment: a small set of orthogonal "measurement line"
// motifs that fade in around the node when it's focused — structural,
// engineered, grounded. Not decoration; it only exists while focused.
function buildMeasurementGroup(color) {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
  const size = 0.9;
  const lines = [
    [[-size, -size, 0], [size, -size, 0]],
    [[-size, -size, 0], [-size, size, 0]],
    [[-size, -size - 0.15, 0], [-size, -size - 0.05, 0]],
    [[size, -size - 0.15, 0], [size, -size - 0.05, 0]]
  ];
  lines.forEach(pts => {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)));
    group.add(new THREE.Line(g, mat));
  });
  group.userData.mat = mat;
  return group;
}

export function initConstellation({ onHover, onSelect }) {
  const wrap = document.querySelector('.constellation-wrap');
  if (!wrap) return null;
  const canvas = document.getElementById('const-canvas');
  const tier = getQualityTier();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(clampDPR(tier));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  const homeCameraPos = new THREE.Vector3(0, 0, 9.5);
  camera.position.copy(homeCameraPos);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(3, 4, 5);
  scene.add(key);

  const nodes = [];
  const shaderMats = [];
  let solenMesh = null, ironMesh = null, journeyMesh = null, journeyMarker = null, measureGroup = null;

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
      ironMesh = mesh;
      measureGroup = buildMeasurementGroup(p.color);
      mesh.add(measureGroup);
    }
    if (kind === 'shader-time' || kind === 'solen') shaderMats.push(mat);
    if (kind === 'solen') solenMesh = mesh;
    if (p.id === 'long-way-around') {
      journeyMesh = mesh;
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xfff2df, transparent: true, opacity: 0 });
      journeyMarker = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), markerMat);
      mesh.add(journeyMarker);
    }

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.05 }));
    mesh.add(glow);
    mesh.userData._glow = glow;
    mesh.userData._baseOpacityTarget = { value: 1 };
    nodes.push(mesh);
  });

  const realmMesh = nodes.find(n => n.userData.id === 'realmrisers');

  const lineMat = new THREE.LineBasicMaterial({ color: 0x2a2d31, transparent: true, opacity: 0.55 });
  const connectorLines = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const g = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
      const line = new THREE.Line(g, lineMat.clone());
      scene.add(line);
      connectorLines.push(line);
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
  const starsMat = new THREE.PointsMaterial({ color: 0x6b6e70, size: 0.015, transparent: true, opacity: 0.5 });
  const stars = new THREE.Points(sGeo, starsMat);
  scene.add(stars);

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

  function updateMouseFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  canvas.addEventListener('mousemove', updateMouseFromEvent);
  canvas.addEventListener('mouseleave', () => { mouse.x = -10; mouse.y = -10; });
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Project constellation — hover or click a node to explore. A keyboard-accessible list of the same projects is available below.');
  canvas.addEventListener('click', e => {
    updateMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(nodes);
    if (hits.length && onSelect) onSelect(hits[0].object.userData.id);
  });

  let visible = true;
  const disposeVisibility = pauseWhenOffscreen(wrap, v => { visible = v; });

  // ---------- Focus system (drives the Solen / Iron Legion signature
  // moments and the shared dim-and-dolly baseline for every other node) ----
  let focusedId = null;
  let focusT = 0; // 0 = unfocused, 1 = fully focused, tweened each frame
  let focusTarget = 0;
  let focusCamPos = null;

  function focusProject(id, { reducedMotion } = {}) {
    focusedId = id;
    focusTarget = 1;
    const mesh = nodes.find(n => n.userData.id === id);
    if (mesh) {
      const dir = mesh.position.clone().normalize();
      focusCamPos = mesh.position.clone().add(dir.multiplyScalar(2.4)).add(new THREE.Vector3(0, 0, 1.2));
    }
    controls.autoRotate = false;
    if (reducedMotion) focusT = 1; // cut straight to the focused state, no camera flight
  }

  function clearFocus({ reducedMotion } = {}) {
    focusedId = null;
    focusTarget = 0;
    focusCamPos = null;
    controls.autoRotate = !REDUCED_MOTION;
    if (reducedMotion) focusT = 0;
  }

  const clock = new THREE.Clock();
  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    shaderMats.forEach(m => { if (m.uniforms.uTime) m.uniforms.uTime.value = t; });
    if (solenMesh && solenMesh.material.uniforms.uPointer) {
      solenMesh.material.uniforms.uPointer.value = [mouse.x || 0, mouse.y || 0];
    }

    // ease focusT toward focusTarget
    focusT += (focusTarget - focusT) * Math.min(1, dt * 3.2);

    if (!REDUCED_MOTION) {
      nodes.forEach((n, idx) => {
        n.rotation.x += 0.003;
        n.rotation.y += 0.005;
        n.position.y += Math.sin(t * 0.6 + idx) * 0.0006;
      });
      if (realmMesh) realmMesh.material.color.setHSL((t * 0.05) % 1, 0.55, 0.62);
      if (!focusedId) controls.update();
    }

    // Dim everything except the focused node, brighten + enlarge that one.
    // Materials with a real `opacity` channel (MeshStandardMaterial /
    // MeshBasicMaterial) fade directly; the custom ShaderMaterials (Solen,
    // AlphaQuote, Syntrax) don't expose one, so those de-emphasize through
    // scale + glow + a slight pull-back instead — still a clear cue, no
    // shader changes required just to dim a neighbor.
    if (focusT > 0.001) {
      nodes.forEach(n => {
        const isFocused = n.userData.id === focusedId;
        n.userData._glow.material.opacity = isFocused ? 0.16 : 0.05 * (1 - focusT * 0.7);
        n.scale.setScalar(isFocused ? 1 + focusT * 0.35 : 1 - focusT * 0.35);
        if ('opacity' in n.material && n.material.type !== 'ShaderMaterial') {
          n.material.transparent = true;
          n.material.opacity = isFocused ? 1 : 1 - focusT * 0.75;
        }
      });
      connectorLines.forEach(l => { l.material.opacity = 0.55 * (1 - focusT * 0.9); });
      starsMat.opacity = 0.5 * (1 - focusT * 0.5);

      if (focusCamPos && !REDUCED_MOTION) {
        camera.position.lerp(focusCamPos, Math.min(1, dt * 2.4));
        const focusedMesh = nodes.find(n => n.userData.id === focusedId);
        if (focusedMesh) camera.lookAt(focusedMesh.position);
      }

      // Solen signature: richer, more active shader while focused
      if (solenMesh && solenMesh.userData.id === focusedId && solenMesh.material.uniforms.uFocus) {
        solenMesh.material.uniforms.uFocus.value = focusT;
      }
      // Iron Legion signature: measurement lines fade in
      if (measureGroup) measureGroup.userData.mat.opacity = (focusedId === 'iron-legion') ? focusT * 0.8 : 0;
      // Long Way Around signature: marker travels an indirect route to its
      // "destination" point on the torus while focused
      if (journeyMarker && journeyMesh) {
        journeyMarker.material.opacity = (focusedId === 'long-way-around') ? focusT : 0;
        if (focusedId === 'long-way-around') {
          const angle = easeOvershoot(Math.min(focusT * 1.4, 1)) * Math.PI * 2.4; // indirect: overshoots then settles
          journeyMarker.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0);
        }
      }
    } else if (solenMesh && solenMesh.material.uniforms && solenMesh.material.uniforms.uFocus) {
      solenMesh.material.uniforms.uFocus.value = 0;
    }

    if (!focusedId || focusT < 0.5) {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodes);
      if (hits.length) {
        const target = hits[0].object;
        if (hovered !== target) { hovered = target; onHover(target.userData); }
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'grab';
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  function easeOvershoot(x) {
    // a simple overshoot-and-settle curve: past the target, then back —
    // "you don't always arrive by moving in a straight line"
    const c1 = 1.7;
    return 1 + c1 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  return {
    focusProject,
    clearFocus,
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
        drawCalls: renderer.info.render.calls,
        geometries: renderer.info.memory.geometries,
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
