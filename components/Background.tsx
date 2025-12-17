import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Background: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // === SCENE SETUP ===
    const scene = new THREE.Scene();
    // Azul oscuro tecnológico
    scene.background = new THREE.Color(0x020308);
    scene.fog = new THREE.FogExp2(0x020308, 0.012);

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 70);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Updated from outputEncoding to outputColorSpace for newer Three.js versions
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);

    // === GROUP ROOT ===
    const root = new THREE.Group();
    scene.add(root);

    // === PARTICLE LAYER 1 – CIAN (energía) ===
    const particleCount = 180;
    const positions1 = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions1[i] = (Math.random() - 0.5) * 260;
    }
    const geoParticles1 = new THREE.BufferGeometry();
    geoParticles1.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions1, 3)
    );

    const matParticles1 = new THREE.PointsMaterial({
      color: 0x02a7ca, // azul energía
      size: 1.2,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const particles1 = new THREE.Points(geoParticles1, matParticles1);
    root.add(particles1);

    // === PARTICLE LAYER 2 – DORADO (lujo) ===
    const particleCount2 = 90;
    const positions2 = new Float32Array(particleCount2 * 3);
    for (let i = 0; i < particleCount2 * 3; i++) {
      positions2[i] = (Math.random() - 0.5) * 220;
    }
    const geoParticles2 = new THREE.BufferGeometry();
    geoParticles2.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions2, 3)
    );

    const matParticles2 = new THREE.PointsMaterial({
      color: 0xab7b26, // dorado HITECH
      size: 1.4,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    const particles2 = new THREE.Points(geoParticles2, matParticles2);
    root.add(particles2);

    // === CORE ESFÉRICO (núcleo de datos) ===
    const coreGeo = new THREE.SphereGeometry(8, 48, 48);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x02a7ca,
      emissive: 0x02a7ca,
      emissiveIntensity: 1.4,
      metalness: 0.6,
      roughness: 0.15,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0, -10);
    root.add(core);

    // Luz suave desde el centro
    const coreLight = new THREE.PointLight(0x02a7ca, 2.2, 200);
    coreLight.position.copy(core.position);
    root.add(coreLight);

    // Luz dorada lateral
    const goldLight = new THREE.PointLight(0xab7b26, 1.4, 260);
    goldLight.position.set(40, 20, 40);
    root.add(goldLight);

    // === TOROIDE (anillo de flujo) ===
    const torusGeo = new THREE.TorusGeometry(18, 0.7, 24, 120);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xab7b26,
      emissive: 0xab7b26,
      emissiveIntensity: 0.9,
      metalness: 0.9,
      roughness: 0.25,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 2;
    torus.position.set(0, 0, -10);
    root.add(torus);

    // === ANILLOS EXTERNOS (HUD) ===
    const ringGroup = new THREE.Group();
    ringGroup.position.set(0, 0, -15);
    root.add(ringGroup);

    const createRing = (radius: number, color: number, opacity: number) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.1, radius, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ringGroup.add(ring);
      return ring;
    };

    const ring1 = createRing(24, 0x02a7ca, 0.35);
    const ring2 = createRing(30, 0xffffff, 0.18);

    // === LÍNEAS RADIALES ===
    const radialGeo = new THREE.BufferGeometry();
    const radialPoints: number[] = [];
    const radialCount = 18;
    for (let i = 0; i < radialCount; i++) {
      const angle = (i / radialCount) * Math.PI * 2;
      const rInner = 22;
      const rOuter = 32;
      const x1 = Math.cos(angle) * rInner;
      const y1 = 0;
      const z1 = Math.sin(angle) * rInner;
      const x2 = Math.cos(angle) * rOuter;
      const y2 = 0;
      const z2 = Math.sin(angle) * rOuter;
      radialPoints.push(x1, y1, z1, x2, y2, z2);
    }
    radialGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(radialPoints, 3)
    );
    const radialMat = new THREE.LineBasicMaterial({
      color: 0x02a7ca,
      transparent: true,
      opacity: 0.18,
    });
    const radialLines = new THREE.LineSegments(radialGeo, radialMat);
    radialLines.rotation.x = Math.PI / 2;
    radialLines.position.z = -15;
    root.add(radialLines);

    // === LÍNEAS DE CONSTELACIÓN (conexiones) ===
    const linesGeo = new THREE.BufferGeometry();
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x02a7ca,
      transparent: true,
      opacity: 0.12,
    });
    const lines = new THREE.LineSegments(linesGeo, linesMat);
    root.add(lines);

    // === MOUSE PARALLAX ===
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const xNorm = (e.clientX / window.innerWidth) * 2 - 1;
      const yNorm = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = xNorm * 10;
      targetY = -yNorm * 6;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // === ANIMACIÓN ===
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Movimiento suave de la cámara hacia el mouse
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -10);

      // Rotaciones sutiles del sistema
      root.rotation.y = Math.sin(t * 0.07) * 0.12;

      particles1.rotation.y += 0.0008;
      particles2.rotation.y -= 0.0005;

      core.rotation.y += 0.002;
      core.rotation.x = Math.sin(t * 0.4) * 0.15;

      torus.rotation.z += 0.0015;
      ring1.rotation.z -= 0.0007;
      ring2.rotation.z += 0.0004;

      // Reconstruir conexiones entre algunas partículas (constelación)
      const p = geoParticles1.attributes.position.array as Float32Array;
      const connectionPoints: number[] = [];
      const maxDist = 26;

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const x1 = p[i * 3];
          const y1 = p[i * 3 + 1];
          const z1 = p[i * 3 + 2];
          const x2 = p[j * 3];
          const y2 = p[j * 3 + 1];
          const z2 = p[j * 3 + 2];

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDist) {
            connectionPoints.push(x1, y1, z1, x2, y2, z2);
          }
        }
      }

      linesGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(connectionPoints, 3)
      );

      renderer.render(scene, camera);
    };

    animate();

    // === RESIZE ===
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // === CLEANUP ===
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);

      coreGeo.dispose();
      coreMat.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      geoParticles1.dispose();
      matParticles1.dispose();
      geoParticles2.dispose();
      matParticles2.dispose();
      radialGeo.dispose();
      radialMat.dispose();
      linesGeo.dispose();
      linesMat.dispose();

      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // opacity se puede subir/bajar si quieres que el fondo pese más o menos
  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full z-0 opacity-70 pointer-events-none"
    />
  );
};

export default Background;