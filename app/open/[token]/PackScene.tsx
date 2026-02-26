'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ── Constants ──────────────────────────────────────────────────────────────────
const PACK_W = 1.6;
const PACK_H = 2.4;
const PACK_D = 0.06;
const FLAP_RATIO = 0.17; // top 17% is the tear-away flap
const FLAP_H = PACK_H * FLAP_RATIO;
const BODY_H = PACK_H * (1 - FLAP_RATIO);

// Build a canvas texture for the pack face
function buildPackTexture(which: 'full' | 'flap' | 'body'): THREE.CanvasTexture {
  const W = 512;
  const H = 768;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Background gradient ──
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,    '#1a1a2e');
  grad.addColorStop(0.25, '#2a2a3a');
  grad.addColorStop(0.5,  '#16213e');
  grad.addColorStop(0.75, '#1a1a2e');
  grad.addColorStop(1,    '#0f0f1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Holographic rainbow band (diagonal) ──
  const rainbow = ctx.createLinearGradient(0, H * 0.25, W, H * 0.65);
  rainbow.addColorStop(0,    'rgba(255,0,128,0.18)');
  rainbow.addColorStop(0.17, 'rgba(255,80,0,0.15)');
  rainbow.addColorStop(0.33, 'rgba(255,220,0,0.18)');
  rainbow.addColorStop(0.5,  'rgba(0,220,120,0.16)');
  rainbow.addColorStop(0.67, 'rgba(0,140,255,0.18)');
  rainbow.addColorStop(0.83, 'rgba(120,0,255,0.16)');
  rainbow.addColorStop(1,    'rgba(255,0,200,0.15)');
  ctx.fillStyle = rainbow;
  ctx.fillRect(0, 0, W, H);

  // ── Silver foil sheen streak ──
  const sheen = ctx.createLinearGradient(0, 0, W * 0.6, H);
  sheen.addColorStop(0,    'rgba(255,255,255,0.0)');
  sheen.addColorStop(0.4,  'rgba(255,255,255,0.06)');
  sheen.addColorStop(0.55, 'rgba(255,255,255,0.14)');
  sheen.addColorStop(0.7,  'rgba(255,255,255,0.06)');
  sheen.addColorStop(1,    'rgba(255,255,255,0.0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  // ── Top label bar ──
  const labelY = H * 0.08;
  const labelH = H * 0.065;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(W * 0.08, labelY - labelH * 0.5, W * 0.84, labelH);

  // ── CHORECARDS wordmark ──
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.round(H * 0.078)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '-2px';
  ctx.fillText('CHORE', W * 0.5, H * 0.38);
  ctx.fillText('CARDS', W * 0.5, H * 0.48);

  // ── Thin horizontal divider ──
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.2, H * 0.55);
  ctx.lineTo(W * 0.8, H * 0.55);
  ctx.stroke();

  // ── Small "BOOSTER PACK" subtitle ──
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `${Math.round(H * 0.025)}px "Courier New", Courier, monospace`;
  ctx.letterSpacing = '2px';
  ctx.fillText('BOOSTER PACK', W * 0.5, H * 0.62);

  // ── Corner star marks ──
  const starSize = 6;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  [[W * 0.12, H * 0.1], [W * 0.88, H * 0.1], [W * 0.12, H * 0.9], [W * 0.88, H * 0.9]].forEach(([x, y]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const angle = (k * Math.PI) / 2 - Math.PI / 4;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * starSize, Math.sin(angle) * starSize);
    }
    ctx.stroke();
    ctx.restore();
  });

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// ── Jagged tear edge geometry ──────────────────────────────────────────────────
// Returns a Shape for the flap or body with a zigzag at the cut edge
function buildJaggedShape(w: number, h: number, isFlap: boolean): THREE.Shape {
  const hw = w / 2;
  const shape = new THREE.Shape();

  // Number of teeth and amplitude
  const teeth = 14;
  const amp = 0.045;

  if (isFlap) {
    // Flap: rect top, jagged bottom
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, h);
    shape.lineTo(hw, h);
    shape.lineTo(hw, 0);
    // jagged bottom edge going right to left
    for (let i = 0; i <= teeth; i++) {
      const t = i / teeth;
      const x = hw - t * w;
      const y = (i % 2 === 0) ? -amp : amp * 0.5;
      shape.lineTo(x, y);
    }
    shape.lineTo(-hw, 0);
  } else {
    // Body: jagged top, straight bottom
    shape.moveTo(-hw, -h);
    shape.lineTo(-hw, 0);
    // jagged top edge going left to right
    for (let i = 0; i <= teeth; i++) {
      const t = i / teeth;
      const x = -hw + t * w;
      const y = (i % 2 === 0) ? amp : -amp * 0.5;
      shape.lineTo(x, y);
    }
    shape.lineTo(hw, 0);
    shape.lineTo(hw, -h);
    shape.lineTo(-hw, -h);
  }

  return shape;
}

// ── Material factory ───────────────────────────────────────────────────────────
function buildMaterial(texture: THREE.CanvasTexture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    metalness: 0.88,
    roughness: 0.08,
    clearcoat: 0.95,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    side: THREE.FrontSide,
  });
}

// ── Pack meshes component ──────────────────────────────────────────────────────
type PackState = 'sealed' | 'opening' | 'opened';

interface PackMeshProps {
  packState: PackState;
  onOpenComplete: () => void;
}

function PackMeshes({ packState, onOpenComplete }: PackMeshProps) {
  const flapRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const { gl } = useThree();

  // Mouse tracking for rotation
  const mouse = useRef({ x: 0, y: 0 });
  const targetRot = useRef({ x: 0, y: 0 });

  // Animation state
  const clock = useRef(0);
  const openProgress = useRef(0);
  const hasCalledBack = useRef(false);

  // Build textures once
  const packTexture = useMemo(() => buildPackTexture('full'), []);
  const flapMat = useMemo(() => buildMaterial(packTexture), [packTexture]);
  const bodyMat = useMemo(() => buildMaterial(packTexture), [packTexture]);

  // Side and edge materials (dark metallic)
  const sideMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1a1a2e'),
    metalness: 0.9,
    roughness: 0.12,
  }), []);

  // Geometries with jagged edges
  const flapGeo = useMemo(() => {
    const shape = buildJaggedShape(PACK_W, FLAP_H, true);
    const geo = new THREE.ShapeGeometry(shape);
    // Set UV so texture aligns: flap covers top FLAP_RATIO of texture
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = (x / PACK_W) + 0.5;
      const v = 1 - ((y) / PACK_H + (1 - FLAP_RATIO));
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
    return geo;
  }, []);

  const bodyGeo = useMemo(() => {
    const shape = buildJaggedShape(PACK_W, BODY_H, false);
    const geo = new THREE.ShapeGeometry(shape);
    // UV: body covers bottom (1-FLAP_RATIO) of texture
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = (x / PACK_W) + 0.5;
      const v = 1 - ((-y) / PACK_H);
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
    return geo;
  }, []);

  // Mouse move
  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [gl]);

  useFrame((_, delta) => {
    clock.current += delta;

    if (packState === 'sealed') {
      // Float bob
      const bob = Math.sin(clock.current * 1.4) * 0.04;
      groupRef.current.position.y = bob;

      // Mouse-tracked rotation
      targetRot.current.x = mouse.current.y * 0.25;
      targetRot.current.y = mouse.current.x * 0.35;
      groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * 0.08;
      groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * 0.08;

      // Subtle shimmer — rotate clearcoat env
      flapMat.clearcoatRoughness = 0.05 + Math.sin(clock.current * 0.8) * 0.02;
      bodyMat.clearcoatRoughness = flapMat.clearcoatRoughness;
    }

    if (packState === 'opening') {
      // Progress 0 → 1 over ~1.1s
      openProgress.current = Math.min(openProgress.current + delta * 0.9, 1);
      const p = openProgress.current;

      // Ease out cubic
      const ease = 1 - Math.pow(1 - p, 3);

      // Flap: fly up and rotate
      flapRef.current.position.y = ease * FLAP_H * 3.5;
      flapRef.current.position.x = ease * 0.3;
      flapRef.current.rotation.z = ease * -0.4;
      flapRef.current.rotation.x = ease * 0.5;
      ;(flapMat as THREE.MeshPhysicalMaterial & { opacity: number }).opacity = 1 - ease;
      flapMat.transparent = true;

      // Body: slight drop + fade
      const bodyEase = Math.max(0, (p - 0.5) / 0.5);
      const bodyFade = 1 - Math.pow(bodyEase, 2);
      bodyRef.current.position.y = -bodyEase * 0.1;
      ;(bodyMat as THREE.MeshPhysicalMaterial & { opacity: number }).opacity = bodyFade;
      bodyMat.transparent = true;

      if (p >= 1 && !hasCalledBack.current) {
        hasCalledBack.current = true;
        onOpenComplete();
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Flap — sits at top of pack */}
      <group
        ref={flapRef}
        position={[0, BODY_H * 0.5 - PACK_H * 0.5 + FLAP_H * 0.5 + PACK_H * 0.5, 0.001]}
      >
        <mesh geometry={flapGeo} material={flapMat} />
        {/* thin side strip for flap */}
        <mesh
          position={[0, FLAP_H * 0.35, -PACK_D * 0.5]}
          scale={[PACK_W, FLAP_H * 0.7, PACK_D]}
        >
          <boxGeometry />
          <primitive object={sideMat} />
        </mesh>
      </group>

      {/* Body */}
      <group
        ref={bodyRef}
        position={[0, -FLAP_H * 0.5, 0]}
      >
        <mesh geometry={bodyGeo} material={bodyMat} />
        {/* back face */}
        <mesh
          rotation={[0, Math.PI, 0]}
          position={[0, -BODY_H * 0.5 + BODY_H * 0.5, -0.001]}
        >
          <primitive object={bodyGeo} attach="geometry" />
          <primitive object={bodyMat} attach="material" />
        </mesh>
        {/* side / depth box */}
        <mesh
          position={[0, -BODY_H * 0.5, -PACK_D * 0.5]}
          scale={[PACK_W, BODY_H, PACK_D]}
        >
          <boxGeometry />
          <primitive object={sideMat} />
        </mesh>
      </group>
    </group>
  );
}

// ── Tap-to-open overlay plane ─────────────────────────────────────────────────
// (invisible clickable plane in 3D space — we use DOM click instead)

// ── Main exported scene ────────────────────────────────────────────────────────
export interface PackSceneProps {
  packState: 'sealed' | 'opening' | 'opened';
  onOpenComplete: () => void;
}

export default function PackScene({ packState, onOpenComplete }: PackSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 40 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, -2, 2]} intensity={0.5} color="#8080ff" />
      <pointLight position={[0, 0, 3]} intensity={0.8} color="#ffffff" />

      <Environment preset="studio" />

      <PackMeshes packState={packState} onOpenComplete={onOpenComplete} />
    </Canvas>
  );
}
