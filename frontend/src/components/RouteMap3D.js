import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Text, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Ground grid component
const Ground = () => {
  const gridSize = 100;
  const divisions = 20;
  
  return (
    <group>
      <gridHelper args={[gridSize, divisions, '#2a2a35', '#1a1a25']} rotation={[0, 0, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0a0a0f" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

// Drone model component
const Drone = ({ position, rotation, mode }) => {
  const droneRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Animate drone rotation
  useFrame((state) => {
    if (droneRef.current) {
      // Slight hover animation
      droneRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  const modeColor = {
    'IDLE': '#888888',
    'RECORDING': '#ff4444',
    'RETURNING': '#44ff44',
    'FLYING': '#4ecdc4'
  }[mode] || '#4ecdc4';
  
  return (
    <group 
      ref={droneRef} 
      position={position} 
      rotation={[0, rotation || 0, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Drone body */}
      <mesh>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color={modeColor} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Arms */}
      {[
        [0.5, 0, 0.5],
        [-0.5, 0, 0.5],
        [0.5, 0, -0.5],
        [-0.5, 0, -0.5]
      ].map((pos, i) => (
        <group key={i} position={pos}>
          {/* Arm */}
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.6]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Motor */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.1]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          {/* Propeller */}
          <mesh position={[0, 0.42, 0]} rotation={[0, Date.now() * 0.01 + i, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.08]} />
            <meshStandardMaterial color="#666" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
      
      {/* Camera indicator */}
      <mesh position={[0.4, -0.15, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <coneGeometry args={[0.1, 0.15, 4]} />
        <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Status light */}
      <pointLight position={[0, 0.3, 0]} color={modeColor} intensity={2} distance={3} />
      
      {/* Hover info */}
      {hovered && (
        <Html position={[0, 1.5, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '8px 12px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            <div>Mode: {mode}</div>
            <div>Alt: {position[1].toFixed(1)}m</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Flight path line
const FlightPath = ({ points, color = '#4ecdc4', lineWidth = 2 }) => {
  if (!points || points.length < 2) return null;
  
  const linePoints = useMemo(() => {
    return points.map(p => new THREE.Vector3(p.x, p.z, -p.y));
  }, [points]);
  
  return (
    <Line
      points={linePoints}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={0.8}
    />
  );
};

// Keyframe markers
const KeyframeMarkers = ({ keyframes, onSelect }) => {
  return (
    <group>
      {keyframes.map((kf, i) => (
        <group 
          key={i} 
          position={[kf.x, kf.z, -kf.y]}
          onClick={() => onSelect && onSelect(kf, i)}
        >
          {/* Marker sphere */}
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial 
              color="#ff6b6b" 
              emissive="#ff6b6b" 
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Vertical line to ground */}
          <Line
            points={[[0, 0, 0], [0, -kf.z, 0]]}
            color="#ff6b6b"
            lineWidth={1}
            transparent
            opacity={0.3}
            dashed
            dashSize={0.5}
            gapSize={0.3}
          />
          
          {/* Number label */}
          <Text
            position={[0, 1, 0]}
            fontSize={0.8}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {i + 1}
          </Text>
        </group>
      ))}
    </group>
  );
};

// Home marker
const HomeMarker = ({ position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[1, 2, 4]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[0, 2.5, 0]}
        fontSize={1}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
      >
        HOME
      </Text>
    </group>
  );
};

// Camera follow controller
const CameraController = ({ target, followDrone }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    if (followDrone && target) {
      const targetPos = new THREE.Vector3(target[0], target[1] + 10, target[2] + 20);
      camera.position.lerp(targetPos, 0.02);
      camera.lookAt(target[0], target[1], target[2]);
    }
  });
  
  return null;
};

// Main 3D Map component
const RouteMap3D = ({ route, dronePosition, mode = 'IDLE', followDrone = false, onKeyframeSelect }) => {
  const position = dronePosition ? [dronePosition.x, dronePosition.z, -dronePosition.y] : [0, 5, 0];
  
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[50, 40, 50]} fov={60} />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 50, 50]} intensity={1} castShadow />
      <pointLight position={[0, 30, 0]} intensity={0.5} color="#4ecdc4" />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={10}
        maxDistance={200}
      />
      
      {/* Camera follow */}
      <CameraController target={position} followDrone={followDrone} />
      
      {/* Ground */}
      <Ground />
      
      {/* Home marker */}
      <HomeMarker position={[0, 0, 0]} />
      
      {/* Flight path */}
      {route && route.points && (
        <>
          <FlightPath points={route.points} color="#4ecdc4" lineWidth={2} />
          <FlightPath points={route.points} color="#4ecdc4" lineWidth={4} />
        </>
      )}
      
      {/* Keyframes */}
      {route && route.keyframes && (
        <KeyframeMarkers keyframes={route.keyframes} onSelect={onKeyframeSelect} />
      )}
      
      {/* Drone */}
      <Drone position={position} rotation={dronePosition?.yaw || 0} mode={mode} />
      
      {/* Sky gradient effect */}
      <mesh position={[0, 100, 0]}>
        <sphereGeometry args={[300, 32, 32]} />
        <meshBasicMaterial color="#0a0a1a" side={THREE.BackSide} />
      </mesh>
    </Canvas>
  );
};

export default RouteMap3D;
