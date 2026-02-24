import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Pure Three.js 3D Map component (no @react-three/drei to avoid compatibility issues)
const SimpleMap3D = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const droneRef = useRef(null);
  const animationRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const progressRef = useRef(0);

  // Load demo route
  useEffect(() => {
    const loadRoute = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/routes/demo/generate`);
        setRoute(response.data);
      } catch (e) {
        console.error('Failed to load route:', e);
      }
    };
    loadRoute();
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(50, 40, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Ground grid
    const gridHelper = new THREE.GridHelper(100, 20, 0x2a2a35, 0x1a1a25);
    scene.add(gridHelper);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshBasicMaterial({ 
      color: 0x0a0a0f, 
      transparent: true, 
      opacity: 0.8 
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Home marker (golden pyramid)
    const homeGeo = new THREE.ConeGeometry(0.8, 1.5, 4);
    const homeMat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, 
      emissive: 0xffd700, 
      emissiveIntensity: 0.3 
    });
    const homeMarker = new THREE.Mesh(homeGeo, homeMat);
    homeMarker.position.set(0, 0.75, 0);
    scene.add(homeMarker);

    // Drone model
    const droneGroup = new THREE.Group();
    
    // Drone body
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x4ecdc4, 
      metalness: 0.8, 
      roughness: 0.2 
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    droneGroup.add(body);

    // Drone arms and motors
    const armPositions = [[0.5, 0, 0.5], [-0.5, 0, 0.5], [0.5, 0, -0.5], [-0.5, 0, -0.5]];
    armPositions.forEach(pos => {
      const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(pos[0], pos[1], pos[2]);
      droneGroup.add(arm);

      const motorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1);
      const motorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const motor = new THREE.Mesh(motorGeo, motorMat);
      motor.position.set(pos[0], pos[1] + 0.35, pos[2]);
      droneGroup.add(motor);
    });

    // Camera indicator on drone
    const camGeo = new THREE.ConeGeometry(0.1, 0.15, 4);
    const camMat = new THREE.MeshStandardMaterial({ 
      color: 0x4ecdc4, 
      emissive: 0x4ecdc4, 
      emissiveIntensity: 0.5 
    });
    const camIndicator = new THREE.Mesh(camGeo, camMat);
    camIndicator.position.set(0.4, -0.15, 0);
    camIndicator.rotation.x = Math.PI / 4;
    droneGroup.add(camIndicator);

    droneGroup.position.set(0, 5, 0);
    scene.add(droneGroup);
    droneRef.current = droneGroup;

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = new THREE.Spherical(80, Math.PI / 4, Math.PI / 4);

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      spherical.theta -= deltaX * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.1, spherical.phi - deltaY * 0.01));
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onWheel = (e) => {
      spherical.radius = Math.max(20, Math.min(200, spherical.radius + e.deltaY * 0.1));
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Update camera position from spherical coordinates
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 5, 0);

      // Drone hover animation
      if (droneRef.current) {
        const time = Date.now() * 0.002;
        droneRef.current.position.y = droneRef.current.position.y + Math.sin(time) * 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('wheel', onWheel);
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  // Update route visualization
  useEffect(() => {
    if (!route || !sceneRef.current) return;

    const scene = sceneRef.current;

    // Remove old path
    const oldPath = scene.getObjectByName('flightPath');
    if (oldPath) scene.remove(oldPath);

    // Create new path
    if (route.points && route.points.length > 1) {
      const points = route.points.map(p => new THREE.Vector3(p.x, p.z, -p.y));
      const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
      const pathMat = new THREE.LineBasicMaterial({ 
        color: 0x4ecdc4, 
        transparent: true, 
        opacity: 0.8 
      });
      const pathLine = new THREE.Line(pathGeo, pathMat);
      pathLine.name = 'flightPath';
      scene.add(pathLine);
    }

    // Add keyframe markers
    if (route.keyframes) {
      route.keyframes.forEach((kf, i) => {
        const markerGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const markerMat = new THREE.MeshStandardMaterial({ 
          color: 0xff6b6b, 
          emissive: 0xff6b6b, 
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.8
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(kf.x, kf.z, -kf.y);
        marker.name = `keyframe_${i}`;
        scene.add(marker);
      });
    }
  }, [route]);

  // Simulation
  const startSimulation = () => {
    if (!route || !route.points || isSimulating) return;
    
    setIsSimulating(true);
    progressRef.current = 0;
    
    const simulateStep = () => {
      if (!route?.points || progressRef.current >= route.points.length - 1) {
        setIsSimulating(false);
        return;
      }
      
      const point = route.points[Math.floor(progressRef.current)];
      if (droneRef.current && point) {
        droneRef.current.position.set(point.x, point.z, -point.y);
      }
      
      progressRef.current += 0.5;
      requestAnimationFrame(simulateStep);
    };
    
    simulateStep();
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    progressRef.current = 0;
    if (droneRef.current) {
      droneRef.current.position.set(0, 5, 0);
    }
  };

  const loadNewRoute = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/routes/demo/generate`);
      setRoute(response.data);
      resetSimulation();
    } catch (e) {
      console.error('Failed to load route:', e);
    }
  };

  return (
    <div className="simple-map-container" data-testid="simple-map-3d">
      <div className="map-toolbar">
        <button 
          className="map-btn" 
          onClick={isSimulating ? resetSimulation : startSimulation}
          data-testid="sim-btn"
        >
          {isSimulating ? '⏹ Стоп' : '▶ Симуляція'}
        </button>
        <button className="map-btn" onClick={resetSimulation} data-testid="reset-btn">
          🔄 Скинути
        </button>
        <button className="map-btn" onClick={loadNewRoute} data-testid="new-route-btn">
          📍 Новий маршрут
        </button>
      </div>
      <div 
        ref={containerRef} 
        className="threejs-container"
        data-testid="threejs-canvas"
      />
      {route && (
        <div className="map-stats">
          <span>Keyframes: {route.keyframes?.length || 0}</span>
          <span>Дистанція: {route.total_distance?.toFixed(1) || 0}m</span>
        </div>
      )}
    </div>
  );
};

export default SimpleMap3D;