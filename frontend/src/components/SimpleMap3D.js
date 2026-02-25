import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Pure Three.js 3D Map with improved visuals
const SimpleMap3D = ({ route: externalRoute, isSimulating }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const droneRef = useRef(null);
  const animationRef = useRef(null);
  const [route, setRoute] = useState(null);
  const progressRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());

  // Use external route if provided
  useEffect(() => {
    if (externalRoute) {
      setRoute(externalRoute);
    }
  }, [externalRoute]);

  // Load demo route if no external route
  useEffect(() => {
    if (!externalRoute) {
      const loadRoute = async () => {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/routes/demo/generate`);
          setRoute(response.data);
        } catch (e) {
          console.error('Failed to load route:', e);
        }
      };
      loadRoute();
    }
  }, [externalRoute]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene with fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(60, 50, 60);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer with better settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.3);
    scene.add(ambientLight);

    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Cyan point light for atmosphere
    const pointLight = new THREE.PointLight(0x06b6d4, 1, 150);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);

    // Ground grid with glow effect
    const gridHelper = new THREE.GridHelper(150, 30, 0x06b6d4, 0x1a1a2e);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Dark ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x08080c, 
      transparent: true, 
      opacity: 0.9,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // Home marker - glowing pyramid
    const homeGroup = new THREE.Group();
    
    const homeGeo = new THREE.ConeGeometry(1, 2, 4);
    const homeMat = new THREE.MeshStandardMaterial({ 
      color: 0xfbbf24, 
      emissive: 0xfbbf24, 
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const homeMarker = new THREE.Mesh(homeGeo, homeMat);
    homeMarker.position.y = 1;
    homeGroup.add(homeMarker);

    // Home base ring
    const ringGeo = new THREE.RingGeometry(1.5, 2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0xfbbf24, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    homeGroup.add(ring);

    scene.add(homeGroup);

    // Drone model - more detailed
    const droneGroup = new THREE.Group();
    
    // Central body - sleek design
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.3, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x18181b, 
      metalness: 0.9, 
      roughness: 0.2 
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    droneGroup.add(body);

    // Arms and motors
    const armPositions = [[0.8, 0, 0.8], [-0.8, 0, 0.8], [0.8, 0, -0.8], [-0.8, 0, -0.8]];
    armPositions.forEach((pos, i) => {
      // Arm
      const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8);
      const armMat = new THREE.MeshStandardMaterial({ 
        color: 0x27272a,
        metalness: 0.8,
        roughness: 0.3
      });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(pos[0] * 0.6, 0, pos[2] * 0.6);
      arm.rotation.z = Math.PI / 4 * (pos[0] > 0 ? 1 : -1) * (pos[2] > 0 ? 1 : -1);
      droneGroup.add(arm);

      // Motor housing
      const motorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15);
      const motorMat = new THREE.MeshStandardMaterial({ 
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.1
      });
      const motor = new THREE.Mesh(motorGeo, motorMat);
      motor.position.set(pos[0], 0.2, pos[2]);
      droneGroup.add(motor);

      // Propeller disc (glowing)
      const propGeo = new THREE.CircleGeometry(0.4, 32);
      const propMat = new THREE.MeshBasicMaterial({ 
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(pos[0], 0.3, pos[2]);
      prop.rotation.x = -Math.PI / 2;
      prop.name = `prop_${i}`;
      droneGroup.add(prop);
    });
    
    // Camera gimbal
    const camGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const camMat = new THREE.MeshStandardMaterial({ 
      color: 0x06b6d4, 
      emissive: 0x06b6d4, 
      emissiveIntensity: 0.5 
    });
    const camIndicator = new THREE.Mesh(camGeo, camMat);
    camIndicator.position.set(0.5, -0.2, 0);
    droneGroup.add(camIndicator);

    // Drone light
    const droneLight = new THREE.PointLight(0x06b6d4, 2, 10);
    droneLight.position.set(0, -0.5, 0);
    droneGroup.add(droneLight);

    droneGroup.position.set(0, 8, 0);
    scene.add(droneGroup);
    droneRef.current = droneGroup;

    // Stars/particles background
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 500; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 300,
        Math.random() * 150 + 20,
        (Math.random() - 0.5) * 300
      );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0x06b6d4, 
      size: 0.5,
      transparent: true,
      opacity: 0.5
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = new THREE.Spherical(100, Math.PI / 3, Math.PI / 4);

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
      
      spherical.theta -= deltaX * 0.005;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2.2, spherical.phi - deltaY * 0.005));
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onWheel = (e) => {
      spherical.radius = Math.max(30, Math.min(200, spherical.radius + e.deltaY * 0.05));
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel, { passive: true });

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Update camera position from spherical coordinates
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 5, 0);

      // Drone hover animation
      if (droneRef.current) {
        droneRef.current.position.y += Math.sin(elapsed * 2) * 0.01;
        
        // Rotate propellers
        droneRef.current.children.forEach(child => {
          if (child.name && child.name.startsWith('prop_')) {
            child.rotation.z += delta * 20;
          }
        });
      }

      // Animate stars
      stars.rotation.y += delta * 0.02;

      // Animate home ring
      ring.rotation.z += delta * 0.5;

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
      container.removeEventListener('mouseleave', onMouseUp);
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

    // Remove old path and markers
    const oldPath = scene.getObjectByName('flightPath');
    if (oldPath) scene.remove(oldPath);
    
    scene.children = scene.children.filter(child => !child.name?.startsWith('keyframe_'));

    // Create neon path tube
    if (route.points && route.points.length > 1) {
      const pathPoints = route.points.map(p => new THREE.Vector3(p.x, p.z, -p.y));
      const curve = new THREE.CatmullRomCurve3(pathPoints);
      
      // Main path tube
      const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.3, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({ 
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        metalness: 0.5,
        roughness: 0.3
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.name = 'flightPath';
      scene.add(tube);

      // Glow effect - outer tube
      const glowGeo = new THREE.TubeGeometry(curve, 100, 0.5, 8, false);
      const glowMat = new THREE.MeshBasicMaterial({ 
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.1
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.name = 'flightPath';
      scene.add(glow);
    }

    // Add keyframe markers
    if (route.keyframes) {
      route.keyframes.forEach((kf, i) => {
        const markerGroup = new THREE.Group();
        markerGroup.name = `keyframe_${i}`;

        // Glowing sphere
        const markerGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const markerMat = new THREE.MeshStandardMaterial({ 
          color: 0xf43f5e, 
          emissive: 0xf43f5e, 
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        markerGroup.add(marker);

        // Vertical beam to ground
        const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, kf.z, 8);
        const beamMat = new THREE.MeshBasicMaterial({ 
          color: 0xf43f5e, 
          transparent: true, 
          opacity: 0.2 
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = -kf.z / 2;
        markerGroup.add(beam);

        // Ground ring
        const groundRingGeo = new THREE.RingGeometry(0.5, 0.8, 32);
        const groundRingMat = new THREE.MeshBasicMaterial({ 
          color: 0xf43f5e, 
          transparent: true, 
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
        groundRing.rotation.x = -Math.PI / 2;
        groundRing.position.y = -kf.z + 0.1;
        markerGroup.add(groundRing);

        markerGroup.position.set(kf.x, kf.z, -kf.y);
        scene.add(markerGroup);
      });
    }
  }, [route]);

  // Handle simulation
  useEffect(() => {
    if (!isSimulating || !route || !route.points) {
      progressRef.current = 0;
      if (droneRef.current) {
        droneRef.current.position.set(0, 8, 0);
      }
      return;
    }

    let frameId;
    const simulateStep = () => {
      if (progressRef.current >= route.points.length - 1) {
        progressRef.current = 0;
      }
      
      const point = route.points[Math.floor(progressRef.current)];
      if (droneRef.current && point) {
        droneRef.current.position.set(point.x, point.z, -point.y);
        droneRef.current.rotation.y = point.yaw || 0;
      }
      
      progressRef.current += 0.3;
      frameId = requestAnimationFrame(simulateStep);
    };
    
    simulateStep();
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isSimulating, route]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-grab active:cursor-grabbing"
      data-testid="threejs-canvas"
    />
  );
};

export default SimpleMap3D;
