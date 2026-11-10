import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, MeshReflectorMaterial, RoundedBox, Stars, Grid, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { WeatherType, SeverityType } from '../lib/types';

interface Scene3DProps {
  weather: WeatherType;
  timeOfDay: string;
  speedLimit: number;
  severity?: SeverityType;
}

/* ------------------------------------------------------------------ *
 *  Palette / atmosphere helpers
 * ------------------------------------------------------------------ */

type Atmosphere = {
  hour: number;
  isNight: boolean;
  isTwilight: boolean;
  wet: boolean;
  skyTop: string;
  skyBottom: string;
  skyGlow: string;
  glowStrength: number;
  fogColor: string;
  fogDensity: number;
  ambient: number;
  ambientColor: string;
  sunPos: [number, number, number];
  sunIntensity: number;
  sunColor: string;
};

function buildAtmosphere(timeOfDay: string, weather: WeatherType): Atmosphere {
  let hour = 12;
  try {
    const parsed = parseInt(String(timeOfDay).split(':')[0], 10);
    if (!Number.isNaN(parsed)) hour = parsed;
  } catch {
    hour = 12;
  }
  const isNight = hour >= 20 || hour < 5;
  const isTwilight = (hour >= 5 && hour < 7) || (hour >= 18 && hour < 20);
  const wet = weather === 'rain' || weather === 'storm';

  // Base sky by time of day
  let skyTop = '#1b4a72';
  let skyBottom = '#6f97bd';
  let skyGlow = '#ffd9a0';
  let glowStrength = 0.55;
  let ambient = 1.0;
  let ambientColor = '#dbeafe';
  let sunPos: [number, number, number] = [40, 60, 25];
  let sunIntensity = 1.5;
  let sunColor = '#fff7e6';

  if (isNight) {
    skyTop = '#02040c';
    skyBottom = '#0a1226';
    skyGlow = '#1d3f7a';
    glowStrength = 0.5;
    ambient = 0.44;
    ambientColor = '#8fb4e8';
    sunPos = [-35, 55, -30];
    sunIntensity = 0.35;
    sunColor = '#bcd6ff';
  } else if (isTwilight) {
    skyTop = '#141a35';
    skyBottom = '#4b3358';
    skyGlow = '#ff8f6b';
    glowStrength = 1.0;
    ambient = 0.6;
    ambientColor = '#e7c6ff';
    sunPos = [55, 16, -20];
    sunIntensity = 0.9;
    sunColor = '#ffb98a';
  }

  // Weather overrides
  let fogDensity = isNight ? 0.019 : 0.014;
  if (weather === 'fog') {
    skyTop = '#1a2130';
    skyBottom = '#39424f';
    skyGlow = '#5a6675';
    glowStrength = 0.4;
    ambient = 0.75;
    ambientColor = '#cfd8e3';
    fogDensity = 0.05;
    sunIntensity = 0.5;
    sunColor = '#dfe7f0';
  } else if (weather === 'storm') {
    skyTop = '#05070f';
    skyBottom = '#111827';
    skyGlow = '#24344f';
    glowStrength = 0.35;
    ambient = 0.38;
    ambientColor = '#93a7c4';
    fogDensity = 0.03;
    sunIntensity = 0.25;
    sunColor = '#a9bde0';
  } else if (weather === 'rain') {
    skyTop = isNight ? '#04060e' : '#1a2433';
    skyBottom = isNight ? '#0a1120' : '#334155';
    skyGlow = isNight ? '#16304f' : '#5b6b7f';
    glowStrength = 0.4;
    ambient = isNight ? 0.42 : 0.6;
    ambientColor = '#a9bdd8';
    fogDensity = 0.026;
    sunIntensity = isNight ? 0.3 : 0.6;
    sunColor = '#c3d3ea';
  } else if (weather === 'snow') {
    skyTop = isNight ? '#070b16' : '#5b6b80';
    skyBottom = isNight ? '#111a2e' : '#9aa8bb';
    skyGlow = isNight ? '#1c2f52' : '#dbe4ef';
    glowStrength = 0.5;
    ambient = isNight ? 0.42 : 0.95;
    ambientColor = '#e8eefb';
    fogDensity = 0.028;
    sunIntensity = isNight ? 0.35 : 0.8;
    sunColor = '#e6eefc';
  }

  return {
    hour,
    isNight,
    isTwilight,
    wet,
    skyTop,
    skyBottom,
    skyGlow,
    glowStrength,
    fogColor: skyBottom,
    fogDensity,
    ambient,
    ambientColor,
    sunPos,
    sunIntensity,
    sunColor,
  };
}

/* ------------------------------------------------------------------ *
 *  Gradient sky dome + celestial bodies
 * ------------------------------------------------------------------ */

const SKY_VERT = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlow;
  uniform float uGlowStrength;
  varying vec3 vWorldPosition;
  void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uBottom, uTop, pow(h, 0.8));
    float horizon = pow(1.0 - abs(dir.y), 5.0);
    col += uGlow * horizon * uGlowStrength;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function SkyDome({ atm, weather }: { atm: Atmosphere; weather: WeatherType }) {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(atm.skyTop) },
      uBottom: { value: new THREE.Color(atm.skyBottom) },
      uGlow: { value: new THREE.Color(atm.skyGlow) },
      uGlowStrength: { value: atm.glowStrength },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uTop.value.set(atm.skyTop);
    uniforms.uBottom.value.set(atm.skyBottom);
    uniforms.uGlow.value.set(atm.skyGlow);
    uniforms.uGlowStrength.value = atm.glowStrength;
  }, [atm.skyTop, atm.skyBottom, atm.skyGlow, atm.glowStrength, uniforms]);

  // Celestial body position
  const bodyPos = useMemo<[number, number, number]>(() => {
    if (atm.isNight) return [-60, 46, -120];
    const t = (atm.hour - 6) / 12; // 6am -> 0, 6pm -> 1
    const ang = Math.PI * t;
    return [Math.cos(ang) * 120, Math.max(14, Math.sin(ang) * 85) + 8, -130];
  }, [atm.isNight, atm.hour]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[420, 32, 20]} />
        <shaderMaterial
          attach="material"
          vertexShader={SKY_VERT}
          fragmentShader={SKY_FRAG}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Sun / moon disc */}
      <mesh position={bodyPos}>
        <circleGeometry args={[atm.isNight ? 5 : 10, 40]} />
        <meshBasicMaterial
          color={atm.isNight ? '#d9e6ff' : atm.isTwilight ? '#ffb37a' : '#fff5d6'}
          transparent
          opacity={0.85}
          fog={false}
        />
      </mesh>
      <mesh position={bodyPos} scale={2.4}>
        <circleGeometry args={[atm.isNight ? 5 : 10, 40]} />
        <meshBasicMaterial
          color={atm.isNight ? '#5f7fbf' : atm.isTwilight ? '#ff8f5e' : '#ffe9a8'}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {atm.isNight && weather === 'clear' && (
        <Stars radius={260} depth={70} count={1300} factor={5} saturation={0} fade speed={0.4} />
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Lighting + storm lightning
 * ------------------------------------------------------------------ */

function Lighting({ atm, weather }: { atm: Atmosphere; weather: WeatherType }) {
  const flashRef = useRef<THREE.DirectionalLight>(null);
  const nextFlash = useRef(1.5 + Math.random() * 3);
  const flashEnergy = useRef(0);

  useFrame((_, delta) => {
    const l = flashRef.current;
    if (!l) return;
    if (weather !== 'storm') {
      l.intensity = 0;
      return;
    }
    nextFlash.current -= delta;
    if (nextFlash.current <= 0) {
      flashEnergy.current = 1;
      nextFlash.current = 2.5 + Math.random() * 5;
    }
    if (flashEnergy.current > 0) {
      flashEnergy.current = Math.max(0, flashEnergy.current - delta * 2.6);
      // double-strike flicker
      const flick = Math.sin(flashEnergy.current * 46) > -0.2 ? 1 : 0.25;
      l.intensity = flashEnergy.current * flashEnergy.current * 6 * flick;
    } else {
      l.intensity = 0;
    }
  });

  return (
    <>
      <ambientLight intensity={atm.ambient} color={atm.ambientColor} />
      <hemisphereLight
        args={[atm.skyTop, '#05070c', atm.isNight ? 0.25 : 0.5]}
      />
      <directionalLight
        position={atm.sunPos}
        intensity={atm.sunIntensity}
        color={atm.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-camera-near={1}
        shadow-camera-far={190}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
      {/* Lightning strike light */}
      <directionalLight ref={flashRef} position={[-30, 80, -60]} intensity={0} color="#e8f1ff" />
      {/* Cool ambient bounce so night never reads as pure black */}
      <pointLight position={[0, 14, -30]} intensity={atm.isNight ? 6 : 0} color="#1e3a6b" distance={90} decay={2} />
    </>
  );
}

/* ------------------------------------------------------------------ *
 *  Ground plane + tactical grid
 * ------------------------------------------------------------------ */

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -30]} receiveShadow>
        <planeGeometry args={[460, 460]} />
        <meshStandardMaterial color="#05070d" roughness={1} metalness={0} />
      </mesh>
      <Grid
        position={[0, -0.05, -30]}
        args={[460, 460]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#0f2c3f"
        sectionSize={25}
        sectionThickness={0.9}
        sectionColor="#134e63"
        fadeDistance={150}
        fadeStrength={1.4}
        infiniteGrid
      />
    </>
  );
}

/* ------------------------------------------------------------------ *
 *  Road surface, markings, reflective studs
 * ------------------------------------------------------------------ */

const ROAD_LEN = 240;
const ROAD_Z = -70; // center of the road plane
const Z_NEAR = 34;
const Z_FAR = -150;

function Road({ atm, speedLimit }: { atm: Atmosphere; speedLimit: number }) {
  const dashCount = 46;
  const studCount = 60;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const dashRef = useRef<THREE.InstancedMesh>(null);
  const laneRef = useRef<THREE.InstancedMesh>(null);
  const studRef = useRef<THREE.InstancedMesh>(null);

  const dashZ = useRef<number[]>(Array.from({ length: dashCount }, (_, i) => -150 + i * 4));
  const laneZ = useRef<number[]>(Array.from({ length: dashCount }, (_, i) => -150 + i * 4));
  const studZ = useRef<number[]>(Array.from({ length: studCount }, (_, i) => -150 + i * 3));

  const wet = atm.wet;
  const night = atm.isNight;

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const rate = (speedLimit / 3.6) * 0.55 * d; // metres per second, scaled

    // Centre dashes
    for (let i = 0; i < dashCount; i++) {
      dashZ.current[i] += rate;
      if (dashZ.current[i] > Z_NEAR) dashZ.current[i] -= ROAD_LEN;
      dummy.position.set(0, 0.015, dashZ.current[i]);
      dummy.scale.set(0.2, 0.03, 2.4);
      dummy.updateMatrix();
      dashRef.current?.setMatrixAt(i, dummy.matrix);
    }
    if (dashRef.current) dashRef.current.instanceMatrix.needsUpdate = true;

    // Lane dividers
    for (let i = 0; i < dashCount; i++) {
      laneZ.current[i] += rate;
      if (laneZ.current[i] > Z_NEAR) laneZ.current[i] -= ROAD_LEN;
      const side = i % 2 === 0 ? -4.4 : 4.4;
      dummy.position.set(side, 0.015, laneZ.current[i]);
      dummy.scale.set(0.16, 0.03, 2.0);
      dummy.updateMatrix();
      laneRef.current?.setMatrixAt(i, dummy.matrix);
    }
    if (laneRef.current) laneRef.current.instanceMatrix.needsUpdate = true;

    // Reflective road studs
    for (let i = 0; i < studCount; i++) {
      studZ.current[i] += rate;
      if (studZ.current[i] > Z_NEAR) studZ.current[i] -= ROAD_LEN;
      const col = i % 5;
      const x = col === 0 ? -7.2 : col === 1 ? -4.4 : col === 2 ? 0 : col === 3 ? 4.4 : 7.2;
      dummy.position.set(x, 0.03, studZ.current[i]);
      dummy.scale.set(0.16, 0.05, 0.3);
      dummy.updateMatrix();
      studRef.current?.setMatrixAt(i, dummy.matrix);
    }
    if (studRef.current) studRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ROAD_Z]} receiveShadow>
        <planeGeometry args={[16, ROAD_LEN]} />
        {wet ? (
          <MeshReflectorMaterial
            mirror={0.55}
            resolution={512}
            blur={[260, 90]}
            mixBlur={9}
            mixStrength={2.4}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.35}
            depthToBlurRatioBias={0.28}
            color="#080c14"
            metalness={0.72}
            roughness={0.28}
          />
        ) : (
          <meshStandardMaterial
            color={night ? '#0d1119' : '#1a2130'}
            roughness={0.92}
            metalness={0.08}
          />
        )}
      </mesh>

      {/* Solid edge lines */}
      {[-7.2, 7.2].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, ROAD_Z]}>
          <planeGeometry args={[0.22, ROAD_LEN]} />
          <meshStandardMaterial
            color="#e6edf7"
            emissive="#cfe0ff"
            emissiveIntensity={night ? 0.5 : 0.08}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Double centre line */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, ROAD_Z]}>
          <planeGeometry args={[0.14, ROAD_LEN]} />
          <meshStandardMaterial color="#e8eef8" emissive="#9fb6d8" emissiveIntensity={night ? 0.35 : 0.05} />
        </mesh>
      ))}

      {/* Animated dashes */}
      <instancedMesh ref={dashRef} args={[undefined, undefined, dashCount]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" emissive="#eaf4ff" emissiveIntensity={night ? 0.7 : 0.12} />
      </instancedMesh>
      <instancedMesh ref={laneRef} args={[undefined, undefined, dashCount]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#b9d4ff" emissiveIntensity={night ? 0.55 : 0.08} />
      </instancedMesh>

      {/* Reflective studs */}
      <instancedMesh ref={studRef} args={[undefined, undefined, studCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={night ? '#7dd3fc' : '#cbd5e1'}
          emissive={night ? '#38bdf8' : '#64748b'}
          emissiveIntensity={night ? 2.4 : 0.4}
        />
      </instancedMesh>

      {/* Kerbs */}
      {[-8.15, 8.15].map((x) => (
        <mesh key={x} position={[x, 0.1, ROAD_Z]} castShadow receiveShadow>
          <boxGeometry args={[0.32, 0.2, ROAD_LEN]} />
          <meshStandardMaterial color="#26303f" roughness={0.85} />
        </mesh>
      ))}

      {/* Verge strips (grass / gravel shoulders) */}
      {[-12.5, 12.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.02, ROAD_Z]} receiveShadow>
          <planeGeometry args={[8.5, ROAD_LEN]} />
          <meshStandardMaterial color={atm.isNight ? '#060a0a' : '#0c1410'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Guardrails with reflector posts
 * ------------------------------------------------------------------ */

function Guardrails() {
  const railCount = 34;
  const railRef = useRef<THREE.InstancedMesh>(null);
  const postRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    let i = 0;
    for (let s = -1; s <= 1; s += 2) {
      for (let n = 0; n < railCount / 2; n++) {
        const z = Z_FAR + n * (ROAD_LEN / (railCount / 2)) + 3;
        // rail beam
        dummy.position.set(s * 9.1, 0.62, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, ROAD_LEN / (railCount / 2) + 0.35);
        dummy.updateMatrix();
        railRef.current?.setMatrixAt(i, dummy.matrix);
        // post
        dummy.position.set(s * 9.1, 0.32, z - 1.6);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postRef.current?.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    if (railRef.current) railRef.current.instanceMatrix.needsUpdate = true;
    if (postRef.current) postRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <group>
      {/* W-beam rails */}
      <instancedMesh ref={railRef} args={[undefined, undefined, railCount]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.34, 1]} />
        <meshStandardMaterial color="#7d8899" metalness={0.85} roughness={0.42} />
      </instancedMesh>
      {/* Posts */}
      <instancedMesh ref={postRef} args={[undefined, undefined, railCount]} castShadow>
        <boxGeometry args={[0.14, 0.66, 0.14]} />
        <meshStandardMaterial color="#39424f" metalness={0.6} roughness={0.6} />
      </instancedMesh>
      {/* Amber reflectors on posts */}
      {[-9.0, 9.0].map((x) =>
        Array.from({ length: 9 }).map((_, i) => (
          <mesh key={`${x}-${i}`} position={[x, 0.66, -140 + i * 22]}>
            <boxGeometry args={[0.16, 0.12, 0.05]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.6} />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Street lamps with volumetric cones
 * ------------------------------------------------------------------ */

function StreetLamps({ atm }: { atm: Atmosphere }) {
  const night = atm.isNight || atm.isTwilight;
  const lamps = useMemo(() => {
    const arr: { x: number; z: number }[] = [];
    for (let i = 0; i < 8; i++) {
      arr.push({ x: i % 2 === 0 ? 10.6 : -10.6, z: -150 + i * 20 });
    }
    return arr;
  }, []);

  return (
    <group>
      {lamps.map((l, idx) => (
        <group key={idx} position={[l.x, 0, l.z]}>
          {/* Pole */}
          <mesh position={[0, 4.4, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.13, 8.8, 8]} />
            <meshStandardMaterial color="#2b3442" metalness={0.75} roughness={0.5} />
          </mesh>
          {/* Curved arm (two segments for a cheap bend) */}
          <mesh position={[l.x > 0 ? -1.1 : 1.1, 8.6, 0]} rotation={[0, 0, l.x > 0 ? Math.PI / 2.6 : -Math.PI / 2.6]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 2.6, 6]} />
            <meshStandardMaterial color="#2b3442" metalness={0.75} roughness={0.5} />
          </mesh>
          {/* Lamp head */}
          <mesh position={[l.x > 0 ? -2.3 : 2.3, 8.1, 0]} rotation={[0, 0, l.x > 0 ? 0.35 : -0.35]}>
            <boxGeometry args={[1.5, 0.24, 0.6]} />
            <meshStandardMaterial
              color={night ? '#ffe9b0' : '#39424f'}
              emissive={night ? '#ffd982' : '#000000'}
              emissiveIntensity={night ? 3.2 : 0}
            />
          </mesh>

          {/* Volumetric light cone */}
          {night && (
            <mesh position={[l.x > 0 ? -2.3 : 2.3, 4.4, 0]}>
              <coneGeometry args={[2.6, 7.4, 22, 1, true]} />
              <meshBasicMaterial
                color="#ffdd9a"
                transparent
                opacity={0.045}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                fog={false}
              />
            </mesh>
          )}

          {/* Real light source for the 4 nearest lamps (perf budget) */}
          {night && idx % 3 === 0 && (
            <pointLight
              position={[l.x > 0 ? -2.3 : 2.3, 7.9, 0]}
              color="#ffd9a0"
              intensity={55}
              distance={38}
              decay={2}
            />
          )}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Vehicles — detailed car model + lane traffic
 * ------------------------------------------------------------------ */

const CAR_COLORS = ['#1f2a3d', '#3b1f2b', '#12313a', '#2b2b31', '#4a3720', '#16233c', '#3a2140', '#1d3126', '#2f2f36', '#41202a', '#14263f', '#3d2a1c'];

function CarModel({ color, night }: { color: string; night: boolean }) {
  return (
    <group>
      {/* Body */}
      <RoundedBox args={[1.9, 0.62, 4.3]} radius={0.16} smoothness={4} position={[0, 0.66, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </RoundedBox>
      {/* Cabin */}
      <RoundedBox args={[1.62, 0.54, 2.2]} radius={0.14} smoothness={4} position={[0, 1.16, 0.18]} castShadow>
        <meshStandardMaterial color="#0a0f18" metalness={0.92} roughness={0.12} />
      </RoundedBox>
      {/* Wheels */}
      {[
        [-0.94, 1.42],
        [0.94, 1.42],
        [-0.94, -1.42],
        [0.94, -1.42],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 14]} />
          <meshStandardMaterial color="#05070c" roughness={0.95} />
        </mesh>
      ))}
      {/* Head lamps */}
      {[-0.62, 0.62].map((x, i) => (
        <mesh key={i} position={[x, 0.72, -2.12]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#fff6dd" emissive="#ffe9b8" emissiveIntensity={night ? 4.5 : 1.4} />
        </mesh>
      ))}
      {/* Tail lamps */}
      {[-0.66, 0.66].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 2.15]}>
          <boxGeometry args={[0.42, 0.14, 0.06]} />
          <meshStandardMaterial color="#ff3355" emissive="#ff1f45" emissiveIntensity={night ? 4 : 1.8} />
        </mesh>
      ))}
      {/* Headlight beams at night */}
      {night &&
        [-0.62, 0.62].map((x, i) => (
          <mesh key={i} position={[x, 0.6, -7.2]} rotation={[Math.PI / 2 + 0.06, 0, 0]}>
            <coneGeometry args={[0.95, 10, 16, 1, true]} />
            <meshBasicMaterial
              color="#ffe4ad"
              transparent
              opacity={0.055}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              fog={false}
            />
          </mesh>
        ))}
      {/* Brake glow when slow traffic */}
      {night && (
        <mesh position={[0, 0.5, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 2.2]} />
          <meshBasicMaterial
            color="#ff2d55"
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      )}
    </group>
  );
}

type CarSpec = { x: number; dir: 1 | -1; z: number; speed: number; color: string };

function Traffic({ atm, speedLimit }: { atm: Atmosphere; speedLimit: number }) {
  const night = atm.isNight;
  const specs = useMemo<CarSpec[]>(() => {
    const lanes = [-5.6, -2.4, 2.4, 5.6];
    return Array.from({ length: 12 }, (_, i) => {
      const x = lanes[i % 4];
      return {
        x,
        dir: x < 0 ? 1 : -1,
        z: -145 + ((i * 31) % 175),
        speed: 0.72 + ((i * 17) % 40) / 100,
        color: CAR_COLORS[i % CAR_COLORS.length],
      };
    });
  }, []);

  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const base = (speedLimit / 3.6) * 0.9; // metres / second in scene scale
    specs.forEach((s, i) => {
      const g = groups.current[i];
      if (!g) return;
      s.z += s.dir * base * s.speed * d;
      if (s.dir < 0 && s.z < Z_FAR) s.z = Z_NEAR;
      if (s.dir > 0 && s.z > Z_NEAR) s.z = Z_FAR;
      g.position.z = s.z;
    });
  });

  return (
    <group>
      {specs.map((s, i) => (
        <group
          key={i}
          position={[s.x, 0, s.z]}
          rotation={[0, s.dir < 0 ? 0 : Math.PI, 0]}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <CarModel color={s.color} night={night} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Emergency response scene (shown for Serious / Fatal predictions)
 * ------------------------------------------------------------------ */

function EmergencyScene({ severity }: { severity: SeverityType }) {
  const fatal = severity === 'Fatal';
  const redLight = useRef<THREE.PointLight>(null);
  const blueLight = useRef<THREE.PointLight>(null);
  const barRef = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const phase = Math.sin(t * 7) > 0; // alternate red / blue
    if (redLight.current) redLight.current.intensity = phase ? (fatal ? 70 : 42) : 0;
    if (blueLight.current) blueLight.current.intensity = phase ? 0 : fatal ? 70 : 42;

    // Expanding ground pings
    [ringA, ringB].forEach((r, idx) => {
      const mesh = r.current;
      if (!mesh) return;
      const p = ((t * 0.55 + idx * 0.5) % 1);
      const s = 2 + p * 16;
      mesh.scale.set(s, s, s);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - p) * 0.42;
    });

    if (barRef.current) {
      barRef.current.visible = Math.floor(t * 6) % 2 === 0;
    }
  });

  return (
    <group position={[-3.2, 0, -26]} rotation={[0, 0.12, 0]}>
      {/* Police / response vehicle */}
      <group>
        <RoundedBox args={[2.0, 0.7, 4.6]} radius={0.18} smoothness={4} position={[0, 0.72, 0]} castShadow>
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[1.7, 0.56, 2.3]} radius={0.14} smoothness={4} position={[0, 1.24, -0.2]} castShadow>
          <meshStandardMaterial color="#05070c" metalness={0.9} roughness={0.15} />
        </RoundedBox>
        {/* Light bar */}
        <mesh ref={barRef} position={[0, 1.6, -0.2]}>
          <boxGeometry args={[1.5, 0.16, 0.42]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#ffffff" emissiveIntensity={1.6} />
        </mesh>
        <pointLight ref={redLight} position={[-0.6, 1.75, -0.2]} color="#ff2d55" intensity={40} distance={40} decay={2} />
        <pointLight ref={blueLight} position={[0.6, 1.75, -0.2]} color="#2d6bff" intensity={40} distance={40} decay={2} />
        {/* Wheels */}
        {[
          [-0.98, 1.5],
          [0.98, 1.5],
          [-0.98, -1.5],
          [0.98, -1.5],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.4, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.3, 14]} />
            <meshStandardMaterial color="#05070c" roughness={0.95} />
          </mesh>
        ))}
        {/* Headlights */}
        {[-0.66, 0.66].map((x, i) => (
          <mesh key={i} position={[x, 0.74, -2.3]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#fff6dd" emissive="#ffe9b8" emissiveIntensity={4} />
          </mesh>
        ))}
      </group>

      {/* Ground ping rings */}
      {[ringA, ringB].map((r, i) => (
        <mesh key={i} ref={r} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 1, 48]} />
          <meshBasicMaterial
            color={i === 0 ? '#ff2d55' : '#2d6bff'}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      ))}

      {/* Traffic cones tapering behind the vehicle */}
      {[
        [3.4, 6],
        [4.6, 11],
        [5.8, 16],
      ].map(([dx, dz], i) => (
        <group key={i} position={[dx, 0, dz]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <coneGeometry args={[0.32, 0.62, 12]} />
            <meshStandardMaterial color="#ff7a1a" emissive="#ff6a00" emissiveIntensity={0.5} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.7, 0.1, 0.7]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Fatal: extrication / HEMS glow */}
      {fatal && (
        <>
          <pointLight position={[0, 3.4, 4]} color="#ff2d55" intensity={34} distance={44} decay={2} />
          <mesh position={[0, 2.6, 3]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[7, 40]} />
            <meshBasicMaterial
              color="#ff2d55"
              transparent
              opacity={0.14}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              fog={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Weather particles (rain streaks / snow / haze)
 * ------------------------------------------------------------------ */

function WeatherLayer({ weather, atm }: { weather: WeatherType; atm: Atmosphere }) {
  const isRain = weather === 'rain' || weather === 'storm';
  const isSnow = weather === 'snow';
  const isFog = weather === 'fog';
  const storm = weather === 'storm';

  const rainCount = 1600;
  const snowCount = 800;

  // --- Rain as line segments (streaks) ---
  const rainGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(rainCount * 6);
    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = Math.random() * 32;
      const z = (Math.random() - 0.5) * 110 - 30;
      const len = 0.7 + Math.random() * 1.4;
      arr[i * 6] = x;
      arr[i * 6 + 1] = y;
      arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x + (storm ? 0.5 : 0.12);
      arr[i * 6 + 4] = y - len;
      arr[i * 6 + 5] = z;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [storm]);

  const rainRef = useRef<THREE.LineSegments>(null);
  useFrame((_, delta) => {
    if (!isRain || !rainRef.current) return;
    const d = Math.min(delta, 0.05);
    const pos = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const fall = (storm ? 46 : 32) * d;
    const wind = (storm ? 14 : 4) * d;
    for (let i = 0; i < rainCount; i++) {
      const o = i * 6;
      arr[o + 1] -= fall;
      arr[o + 4] -= fall;
      arr[o] += wind;
      arr[o + 3] += wind;
      if (arr[o + 1] < 0) {
        const x = (Math.random() - 0.5) * 70;
        const y = 30 + Math.random() * 4;
        const z = (Math.random() - 0.5) * 110 - 30;
        const len = 0.7 + Math.random() * 1.4;
        arr[o] = x;
        arr[o + 1] = y;
        arr[o + 2] = z;
        arr[o + 3] = x + (storm ? 0.5 : 0.12);
        arr[o + 4] = y - len;
        arr[o + 5] = z;
      }
    }
    pos.needsUpdate = true;
  });

  // --- Snow points ---
  const snowPos = useMemo(() => {
    const arr = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 70;
      arr[i * 3 + 1] = Math.random() * 30;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 110 - 30;
    }
    return arr;
  }, []);
  const snowRef = useRef<THREE.Points>(null);
  useFrame(({ clock }, delta) => {
    if (!isSnow || !snowRef.current) return;
    const d = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const pos = snowRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < snowCount; i++) {
      const o = i * 3;
      arr[o + 1] -= (2.4 + (i % 7) * 0.28) * d;
      arr[o] += Math.sin(t * 0.8 + i) * 0.4 * d;
      if (arr[o + 1] < 0) arr[o + 1] = 28 + Math.random() * 4;
    }
    pos.needsUpdate = true;
  });

  if (isRain) {
    return (
      <lineSegments ref={rainRef} geometry={rainGeo}>
        <lineBasicMaterial
          color={storm ? '#9fb8ff' : '#bfe0ff'}
          transparent
          opacity={storm ? 0.5 : 0.4}
          depthWrite={false}
          fog={false}
        />
      </lineSegments>
    );
  }

  if (isSnow) {
    return (
      <points ref={snowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[snowPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.19} color="#ffffff" transparent opacity={0.85} depthWrite={false} sizeAttenuation />
      </points>
    );
  }

  if (isFog || atm.isNight) {
    return (
      <Sparkles
        count={60}
        scale={[44, 12, 70]}
        size={2.2}
        speed={0.25}
        opacity={0.35}
        color={atm.isNight ? '#7dd3fc' : '#cbd5e1'}
        position={[0, 4, -30]}
      />
    );
  }

  return null;
}

/* ------------------------------------------------------------------ *
 *  Distant city skyline with lit windows
 * ------------------------------------------------------------------ */

function Skyline({ atm }: { atm: Atmosphere }) {
  const night = atm.isNight || atm.isTwilight;

  const data = useMemo(() => {
    const blds: { x: number; z: number; w: number; h: number; d: number }[] = [];
    const wins: { x: number; y: number; z: number; c: string }[] = [];
    const rows = [
      { z: -165, n: 26, spread: 340, hMin: 14, hMax: 62 },
      { z: -135, n: 18, spread: 320, hMin: 10, hMax: 40 },
    ];
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    rows.forEach((row) => {
      for (let i = 0; i < row.n; i++) {
        const w = 7 + rnd() * 12;
        const h = row.hMin + rnd() * (row.hMax - row.hMin);
        const d = 7 + rnd() * 10;
        const x = -row.spread / 2 + (i + 0.5) * (row.spread / row.n) + (rnd() - 0.5) * 8;
        blds.push({ x, z: row.z + (rnd() - 0.5) * 12, w, h, d });
      }
    });
    // Windows on the near row
    blds.forEach((b) => {
      if (b.z > -150) return;
      const cols = Math.max(2, Math.floor(b.w / 2.6));
      const floors = Math.max(3, Math.floor(b.h / 3.4));
      for (let c = 0; c < cols; c++) {
        for (let f = 0; f < floors; f++) {
          if (rnd() > 0.42) continue;
          const warm = rnd();
          wins.push({
            x: b.x - b.w / 2 + (c + 0.5) * (b.w / cols),
            y: 2.2 + (f + 0.5) * (b.h / floors),
            z: b.z + b.d / 2 + 0.06,
            c: warm > 0.72 ? '#7dd3fc' : warm > 0.35 ? '#ffd9a0' : '#ffe9c7',
          });
        }
      }
    });
    return { blds, wins };
  }, []);

  const bldRef = useRef<THREE.InstancedMesh>(null);
  const winRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    data.blds.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      bldRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (bldRef.current) bldRef.current.instanceMatrix.needsUpdate = true;

    const color = new THREE.Color();
    data.wins.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      winRef.current?.setMatrixAt(i, dummy.matrix);
      color.set(w.c);
      winRef.current?.setColorAt(i, color);
    });
    if (winRef.current) {
      winRef.current.instanceMatrix.needsUpdate = true;
      if (winRef.current.instanceColor) winRef.current.instanceColor.needsUpdate = true;
    }
  }, [data, dummy]);

  return (
    <group>
      <instancedMesh ref={bldRef} args={[undefined, undefined, data.blds.length]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={atm.isNight ? '#070b14' : '#141c2b'} roughness={0.95} metalness={0.1} />
      </instancedMesh>
      {night && data.wins.length > 0 && (
        <instancedMesh ref={winRef} args={[undefined, undefined, data.wins.length]}>
          <planeGeometry args={[1.1, 1.5]} />
          <meshBasicMaterial toneMapped={false} transparent opacity={0.92} />
        </instancedMesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 *  Camera rig: cinematic intro dolly + orbit + pointer parallax
 * ------------------------------------------------------------------ */

function CameraRig({ ready }: { ready: boolean }) {
  const camera = useThree((s) => s.camera);
  const pointer = useThree((s) => s.pointer);
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3 } | null;
  const progress = useRef(0);
  const started = useRef(false);

  const from = useMemo(() => new THREE.Vector3(2.5, 11, 46), []);
  const to = useMemo(() => new THREE.Vector3(0, 3.7, 15.5), []);

  useFrame((_, delta) => {
    if (!ready) {
      if (!started.current) {
        started.current = true;
        camera.position.copy(from);
      }
      progress.current = Math.min(1, progress.current + delta / 2.4);
      const k = 1 - Math.pow(1 - progress.current, 3); // ease-out cubic
      camera.position.lerpVectors(from, to, k);
      camera.lookAt(0, 1.4, -26);
      return;
    }
    if (controls) {
      controls.target.x += (pointer.x * 3.2 - controls.target.x) * 0.035;
      controls.target.y += (1.4 + pointer.y * 1.1 - controls.target.y) * 0.035;
    }
  });

  return null;
}

/* ------------------------------------------------------------------ *
 *  Main exported scene
 * ------------------------------------------------------------------ */

export const Scene3D: React.FC<Scene3DProps> = ({ weather, timeOfDay, speedLimit, severity }) => {
  const atm = useMemo(() => buildAtmosphere(timeOfDay, weather), [timeOfDay, weather]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const sevColor = severity === 'Fatal' ? '#ff2d78' : severity === 'Serious' ? '#ffb703' : '#22e6f2';

  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-xl border border-white/[0.09] bg-[#05070e] ${
        severity === 'Fatal' ? 'animate-fatal-shake' : ''
      }`}
      style={{
        boxShadow: severity === 'Fatal' ? '0 0 45px rgba(255,45,120,0.35), inset 0 0 60px rgba(255,45,120,0.12)' : 'inset 0 0 80px rgba(0,0,0,0.55)',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [2.5, 11, 46], fov: 52, near: 0.4, far: 700 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.14;
        }}
      >
        <fogExp2 attach="fog" args={[atm.fogColor, atm.fogDensity]} />
        <Lighting atm={atm} weather={weather} />
        <SkyDome atm={atm} weather={weather} />
        <Ground />
        <Road atm={atm} speedLimit={speedLimit} />
        <Guardrails />
        <StreetLamps atm={atm} />
        <Skyline atm={atm} />
        <Traffic atm={atm} speedLimit={speedLimit} />
        {(severity === 'Fatal' || severity === 'Serious') && <EmergencyScene severity={severity} />}
        <WeatherLayer weather={weather} atm={atm} />
        <CameraRig ready={ready} />
        {ready && (
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.5}
            zoomSpeed={0.7}
            minDistance={9}
            maxDistance={44}
            minPolarAngle={0.85}
            maxPolarAngle={1.5}
            target={[0, 1.4, -26]}
          />
        )}
      </Canvas>

      {/* ---------------- DOM HUD overlay ---------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(2,4,10,0.72)_100%)]" />

        {/* slow scan sheen */}
        <div className="absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent scene-sweep" />
        <div className="absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-cyan-300/[0.05] to-transparent scene-scan" />

        {/* fatal frame */}
        {severity === 'Fatal' && (
          <div className="absolute inset-0 border-2 border-neon-magenta/50 animate-pulse-fatal rounded-xl" />
        )}

        {/* corner brackets */}
        <div className="absolute top-2.5 left-2.5 w-5 h-5 border-l border-t" style={{ borderColor: sevColor }} />
        <div className="absolute top-2.5 right-2.5 w-5 h-5 border-r border-t" style={{ borderColor: sevColor }} />
        <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-l border-b" style={{ borderColor: sevColor }} />
        <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-r border-b" style={{ borderColor: sevColor }} />

        {/* top-left status */}
        <div className="absolute top-4 left-6 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/55 backdrop-blur-sm border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full animate-blink-fast" style={{ backgroundColor: sevColor }} />
          <span className="font-mono text-[10px] tracking-[0.18em] text-slate-200">
            3D DIGITAL TWIN // {weather.toUpperCase()}
          </span>
        </div>

        {/* top-right telemetry chips */}
        <div className="absolute top-4 right-6 flex items-center gap-1.5 font-mono text-[10px]">
          {[
            { k: 'LOCAL', v: timeOfDay },
            { k: 'LIMIT', v: `${speedLimit} KM/H` },
            { k: 'STATE', v: (severity || 'SLIGHT').toUpperCase() },
          ].map((c) => (
            <span
              key={c.k}
              className="px-2 py-1 rounded bg-black/55 backdrop-blur-sm border border-white/10 text-slate-300 flex flex-col items-center leading-tight"
            >
              <span className="text-[8px] tracking-[0.2em] text-white/35">{c.k}</span>
              <span style={{ color: c.k === 'STATE' ? sevColor : undefined }}>{c.v}</span>
            </span>
          ))}
        </div>

        {/* bottom-left severity readout */}
        <div className="absolute bottom-4 left-6 flex items-center gap-2 font-mono text-[10px]">
          <span
            className="px-2 py-1 rounded font-bold tracking-widest"
            style={{ backgroundColor: `${sevColor}22`, color: sevColor, border: `1px solid ${sevColor}66` }}
          >
            {(severity || 'Slight').toUpperCase()}
          </span>
          <span className="text-white/45 tracking-wider">
            {severity === 'Fatal' ? 'HEMS + AIR AMBULANCE PRE-ALERT' : severity === 'Serious' ? 'RAPID RESPONSE ADVISED' : 'STANDARD TRAFFIC POLICING'}
          </span>
        </div>

        {/* bottom-right interaction hint */}
        <div className="absolute bottom-4 right-6 font-mono text-[10px] text-white/35 tracking-widest">
          DRAG TO ORBIT · SCROLL TO ZOOM
        </div>
      </div>
    </div>
  );
};

export default Scene3D;
