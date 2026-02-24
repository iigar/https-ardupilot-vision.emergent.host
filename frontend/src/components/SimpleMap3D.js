import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Simple 3D Map component for testing
const SimpleMap3D = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <OrbitControls />
      
      {/* Simple cube */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4ecdc4" />
      </mesh>
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </Canvas>
  );
};

export default SimpleMap3D;