import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { DMSTelemetry } from '../../types/dms';

interface RightHeadPanelProps {
  data: DMSTelemetry;
}

// Clamp utility
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Convert degrees to radians
function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================================
// 0-AXIS REFERENCE (stationary, does not rotate with head)
// ============================================================
function ZeroAxisReference() {
  const verticalPoints = useMemo(() => new Float32Array([0, -1.0, 0, 0, 1.0, 0]), []);
  const horizontalPoints = useMemo(() => new Float32Array([-0.8, 0, 0, 0.8, 0, 0]), []);

  return (
    <group>
      {/* Vertical line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[verticalPoints, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" opacity={0.08} transparent depthTest={false} />
      </line>
      {/* Horizontal line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[horizontalPoints, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" opacity={0.08} transparent depthTest={false} />
      </line>
      {/* Center dot */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#ffffff" opacity={0.15} transparent />
      </mesh>
    </group>
  );
}

// ============================================================
// GAZE CONE COMPONENT
// ============================================================
interface GazeConeProps {
  gazeX: number;
  gazeY: number;
  onRoad: boolean;
  eyeMidpoint: THREE.Vector3;
}

function GazeCone({ gazeX, gazeY, onRoad, eyeMidpoint }: GazeConeProps) {
  const gazeLinePoints = useMemo(() => new Float32Array([0, 0, 0, 0, 0, -1.1]), []);

  // Compute cone direction based on gaze data
  const { position, rotationArray, color } = useMemo(() => {
    const coneColor = onRoad ? '#00e6a0' : '#ff9800';

    // Gaze offset from center (0.5 is center)
    const offsetX = (gazeX - 0.5) * 0.7; // horizontal deviation
    const offsetY = (gazeY - 0.5) * 0.5; // vertical deviation

    // Cone points forward (along -Z axis) with slight steering
    const rotX = -offsetY * 0.8; // pitch adjustment
    const rotY = -offsetX * 0.8; // yaw adjustment

    return {
      position: eyeMidpoint.clone(),
      rotationArray: [rotX, rotY, 0] as [number, number, number],
      color: coneColor,
    };
  }, [gazeX, gazeY, onRoad, eyeMidpoint]);

  return (
    <group position={position} rotation={rotationArray}>
      {/* Cone pointing forward (-Z direction) — larger and more visible */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.55]}>
        <coneGeometry args={[0.3, 1.0, 20, 1, true]} />
        <meshBasicMaterial
          color={color}
          opacity={0.35}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Center line — more visible */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[gazeLinePoints, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.75} transparent />
      </line>
      {/* Origin dot */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color={color} opacity={0.9} transparent />
      </mesh>
    </group>
  );
}

// ============================================================
// HEAD MODEL COMPONENT (loads GLB, applies materials and rotation)
// ============================================================
interface HeadModelProps {
  yaw: number;
  pitch: number;
  roll: number;
  gazeX: number;
  gazeY: number;
  gazeOnRoad: boolean;
  eyesVisible: boolean;
}

function HeadModel({ yaw, pitch, roll, gazeX, gazeY, gazeOnRoad, eyesVisible }: HeadModelProps) {
  const poseGroupRef = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, '/models/dms_head.glb');

  // Static orientation correction: the GLB model faces sideways (left profile).
  // Apply a fixed Y-axis rotation to make neutral pose = front-facing toward viewer.
  const MODEL_Y_CORRECTION = -Math.PI / 2;

  // Process the model: center, scale, apply DMS materials
  const { scene, eyeMidpoint } = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    // Apply static orientation correction BEFORE computing bounding box
    const correctionGroup = new THREE.Group();
    correctionGroup.rotation.y = MODEL_Y_CORRECTION;
    correctionGroup.add(clonedScene);

    // Force matrix update so Box3 accounts for the correction rotation
    correctionGroup.updateMatrixWorld(true);

    // Auto-center and auto-scale using Box3 on the corrected group
    const box = new THREE.Box3().setFromObject(correctionGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the corrected group
    correctionGroup.position.sub(center);

    // Scale to fit within a normalized unit (max dimension = 2.3 for larger model)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.3 / maxDim;
    correctionGroup.scale.setScalar(scale);

    // Recalculate eye midpoint after centering and scaling
    // After correction, face points along +Z (toward viewer/camera)
    const scaledSize = size.clone().multiplyScalar(scale);
    const eyeY = scaledSize.y * 0.12; // slightly above center — lowered for eye socket region
    const eyeZ = scaledSize.z * 0.35; // forward-facing (toward camera)
    const midpoint = new THREE.Vector3(0, eyeY, eyeZ);

    // Apply DMS technical face mesh materials
    correctionGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Create dark cyan/blue translucent surface material
        const surfaceMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#0c2a40'),
          transparent: true,
          opacity: 0.28,
          roughness: 0.4,
          metalness: 0.3,
          clearcoat: 0.2,
          clearcoatRoughness: 0.5,
          side: THREE.FrontSide,
          depthWrite: true,
        });

        // Cleaner wireframe overlay — higher opacity for clarity
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#00d4ff'),
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        });

        // Replace material with multi-material approach using groups
        child.material = surfaceMaterial;

        // Add wireframe overlay as a separate mesh
        const wireframeMesh = new THREE.Mesh(child.geometry.clone(), wireframeMaterial);
        wireframeMesh.position.copy(child.position);
        wireframeMesh.rotation.copy(child.rotation);
        wireframeMesh.scale.copy(child.scale);
        child.parent?.add(wireframeMesh);
      }
    });

    return { scene: correctionGroup, eyeMidpoint: midpoint };
  }, [gltf]);

  // Smooth rotation interpolation (applied to outer pose group only)
  useFrame(() => {
    if (poseGroupRef.current) {
      // Clamp visual rotation
      const targetYaw = degToRad(clamp(yaw, -45, 45));
      const targetPitch = degToRad(clamp(pitch, -30, 30));
      const targetRoll = degToRad(clamp(roll, -30, 30));

      // Smooth lerp for rotation
      const lerpFactor = 0.08;
      poseGroupRef.current.rotation.y += (targetYaw - poseGroupRef.current.rotation.y) * lerpFactor;
      poseGroupRef.current.rotation.x += (-targetPitch - poseGroupRef.current.rotation.x) * lerpFactor;
      poseGroupRef.current.rotation.z += (targetRoll - poseGroupRef.current.rotation.z) * lerpFactor;
    }
  });

  return (
    <group ref={poseGroupRef}>
      <primitive object={scene} />

      {/* Eye glow indicators — positioned at eye socket level */}
      <mesh position={[-0.18, eyeMidpoint.y - 0.02, eyeMidpoint.z + 0.08]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial
          color={eyesVisible ? '#00ffcc' : '#334455'}
          opacity={eyesVisible ? 0.85 : 0.25}
          transparent
        />
      </mesh>
      <mesh position={[0.18, eyeMidpoint.y - 0.02, eyeMidpoint.z + 0.08]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial
          color={eyesVisible ? '#00ffcc' : '#334455'}
          opacity={eyesVisible ? 0.85 : 0.25}
          transparent
        />
      </mesh>

      {/* Gaze cone from midpoint between both eyes */}
      <GazeCone
        gazeX={gazeX}
        gazeY={gazeY}
        onRoad={gazeOnRoad}
        eyeMidpoint={eyeMidpoint}
      />
    </group>
  );
}

// ============================================================
// LIGHTING SETUP - LTEPS premium rim lighting
// ============================================================
function SceneLighting() {
  return (
    <>
      {/* Soft blue ambient fill */}
      <ambientLight intensity={0.25} color="#1a2a4a" />

      {/* Primary soft cyan front key light */}
      <directionalLight position={[0, 0.5, 3]} intensity={0.6} color="#44aadd" />

      {/* Magenta/violet LTEPS rim lights (side/back) */}
      <pointLight position={[-2.5, 0.5, -1.5]} intensity={1.0} color="#8844cc" distance={7} />
      <pointLight position={[2.5, 0.5, -1.5]} intensity={1.0} color="#cc44aa" distance={7} />

      {/* Top subtle violet */}
      <pointLight position={[0, 2.5, -0.5]} intensity={0.5} color="#6644cc" distance={5} />

      {/* Bottom subtle blue fill */}
      <pointLight position={[0, -2, 1.5]} intensity={0.3} color="#004488" distance={5} />

      {/* Cyan accent from front-right */}
      <spotLight
        position={[1.2, 0.3, 2.5]}
        intensity={0.7}
        color="#00d4ff"
        angle={0.7}
        penumbra={0.9}
        distance={6}
      />
    </>
  );
}

// ============================================================
// LOADING FALLBACK
// ============================================================
function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <span className="text-[10px] text-slate-500 font-mono animate-pulse">
        Loading 3D head model...
      </span>
    </div>
  );
}

// ============================================================
// ERROR BOUNDARY FOR 3D CANVAS
// ============================================================
interface ErrorBoundaryState {
  hasError: boolean;
}

class Canvas3DErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] text-slate-500 font-mono">
            3D model unavailable
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// INNER CANVAS CONTENT (wrapped to catch loader errors)
// ============================================================
interface CanvasContentProps {
  data: DMSTelemetry;
}

function CanvasContent({ data }: CanvasContentProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 42, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.4;
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneLighting />
      <ZeroAxisReference />
      <Suspense fallback={null}>
        <HeadModel
          yaw={data.headPose.yaw}
          pitch={data.headPose.pitch}
          roll={data.headPose.roll}
          gazeX={data.gaze.x}
          gazeY={data.gaze.y}
          gazeOnRoad={data.gaze.onRoad}
          eyesVisible={data.confidence.eyesVisible}
        />
      </Suspense>
    </Canvas>
  );
}

// ============================================================
// MAIN PANEL COMPONENT
// ============================================================
export const RightHeadPanel: React.FC<RightHeadPanelProps> = ({ data }) => {
  const { yaw, pitch, roll } = data.headPose;
  const gazeOnRoad = data.gaze.onRoad;
  const eyesVisible = data.confidence.eyesVisible;

  // Panel border glow based on road gaze
  const borderGlow = gazeOnRoad
    ? '0 0 12px rgba(0, 212, 255, 0.3), inset 0 0 4px rgba(0, 212, 255, 0.05)'
    : '0 0 12px rgba(255, 107, 53, 0.3), inset 0 0 4px rgba(255, 107, 53, 0.05)';

  return (
    <div
      className={`bg-dms-panel rounded-lg border p-2 flex flex-col h-full overflow-visible ${
        gazeOnRoad ? 'border-dms-accent/30' : 'border-dms-warning/30'
      }`}
      style={{ boxShadow: borderGlow }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3D Head Model</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          gazeOnRoad ? 'text-dms-success bg-dms-success/10' : 'text-dms-warning bg-dms-warning/10'
        }`}>
          {gazeOnRoad ? 'Gaze: Road Center' : 'Gaze: Off Road'}
        </span>
      </div>

      {/* 3D Head Visualization - React Three Fiber Canvas */}
      <div className="flex-1 min-h-0 relative overflow-visible">
        <Canvas3DErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <CanvasContent data={data} />
          </Suspense>
        </Canvas3DErrorBoundary>
      </div>

      {/* ===== STATUS INFO PANEL ===== */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 px-1 text-[9px] font-mono">
        <span className={gazeOnRoad ? 'text-dms-success' : 'text-dms-warning'}>
          {gazeOnRoad ? 'Gaze: Road Center' : 'Gaze: Off Road'}
        </span>
        <span className="text-slate-500">0-axis calibrated</span>
        <span className="text-slate-500">Road-facing neutral</span>
        <span className={data.confidence.faceDetected ? 'text-dms-success' : 'text-dms-danger'}>
          {data.confidence.faceDetected ? 'Head Pose Valid' : 'Head Pose Lost'}
        </span>
        <span className={data.confidence.faceDetected ? 'text-dms-success' : 'text-dms-danger'}>
          {data.confidence.faceDetected ? 'Tracking Locked' : 'Tracking Lost'}
        </span>
        <span className="text-slate-400">
          Eye L: {eyesVisible ? 'OPEN' : 'CLOSED'} | R: {eyesVisible ? 'OPEN' : 'CLOSED'}
        </span>
      </div>

      {/* Yaw/Pitch/Roll Values */}
      <div className="grid grid-cols-3 gap-2 mt-1 pt-1 border-t border-slate-700/50">
        <div className="text-center">
          <span className="text-[9px] text-slate-500 block">YAW</span>
          <span className="text-xs font-mono text-dms-accent">{yaw.toFixed(1)}&deg;</span>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-slate-500 block">PITCH</span>
          <span className="text-xs font-mono text-dms-accent">{pitch.toFixed(1)}&deg;</span>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-slate-500 block">ROLL</span>
          <span className="text-xs font-mono text-dms-accent">{roll.toFixed(1)}&deg;</span>
        </div>
      </div>
    </div>
  );
};
