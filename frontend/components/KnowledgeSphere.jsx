'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function RevolvingOrb({ reduced, light }) {
  const group = useRef(null)
  const inner = useRef(null)
  const dust = useRef(null)

  const dustGeo = useMemo(() => {
    const count = 720
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const radius = 1.18 + Math.random() * 0.22
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  useFrame((_, delta) => {
    if (reduced) return
    const dt = Math.min(delta, 0.033)
    if (group.current) group.current.rotation.y += dt * 0.28
    if (inner.current) {
      inner.current.rotation.y -= dt * 0.16
      inner.current.rotation.x += dt * 0.05
    }
    if (dust.current) dust.current.rotation.z += dt * 0.07
  })

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.28, 64, 64]} />
        <meshPhysicalMaterial
          color="#c4b5fd"
          emissive={light ? '#7c3aed' : '#6d28d9'}
          emissiveIntensity={light ? 0.22 : 0.42}
          roughness={0.18}
          metalness={0.12}
          transmission={light ? 0.48 : 0.62}
          thickness={1.35}
          ior={1.35}
          transparent
          opacity={0.96}
          clearcoat={0.55}
          clearcoatRoughness={0.25}
        />
      </mesh>
      <mesh scale={1.015}>
        <sphereGeometry args={[1.28, 48, 48]} />
        <meshBasicMaterial color="#ddd6fe" wireframe transparent opacity={light ? 0.14 : 0.085} />
      </mesh>
      <mesh ref={inner} scale={0.68}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#e9d5ff" wireframe transparent opacity={light ? 0.28 : 0.38} />
      </mesh>
      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial size={0.016} color="#ede9fe" transparent opacity={light ? 0.45 : 0.62} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}

export default function KnowledgeSphere({ theme = 'dark' }) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const light = theme === 'light'

  return (
    <div className="knowledge-sphere" aria-hidden="true">
      <div className="knowledge-sphere-glow" />
      <div className="knowledge-sphere-css" />
      <Canvas
        className="knowledge-sphere-canvas"
        camera={{ position: [0, 0.12, 4.05], fov: 38 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={light ? 0.55 : 0.28} color={light ? '#a78bfa' : '#c4b5fd'} />
        <pointLight position={[2.4, 1.6, 3.2]} intensity={light ? 10 : 14} color="#c4b5fd" distance={14} />
        <pointLight position={[-2.8, -1.4, 1.8]} intensity={light ? 5 : 7} color="#6366f1" distance={12} />
        <directionalLight position={[0, 3, 2]} intensity={light ? 0.85 : 0.55} color="#f5f3ff" />
        <RevolvingOrb reduced={reduced} light={light} />
      </Canvas>
    </div>
  )
}