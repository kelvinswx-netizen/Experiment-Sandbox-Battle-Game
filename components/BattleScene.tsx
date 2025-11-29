import React, { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Trail, Stars, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { UnitInstance, Team, GamePhase, TerrainType } from '../types';
import { UNIT_TEMPLATES, ARENA_SIZE, TERRAIN_CONFIG } from '../constants';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      planeGeometry: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      capsuleGeometry: any;
      boxGeometry: any;
      sphereGeometry: any;
      ringGeometry: any;
      gridHelper: any;
      ambientLight: any;
      directionalLight: any;
      cylinderGeometry: any;
      coneGeometry: any;
      dodecahedronGeometry: any;
      torusGeometry: any;
      lineBasicMaterial: any;
      fog: any;
      points: any;
      bufferGeometry: any;
      pointsMaterial: any;
      bufferAttribute: any;
      pointLight: any;
    }
  }
}

// --- Helpers ---
const getTemplate = (id: string) => UNIT_TEMPLATES.find(t => t.id === id)!;

const getDistance = (p1: [number, number, number], p2: [number, number, number]) => {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[2] - p2[2], 2));
};

// --- TERRAIN GENERATION SYSTEM ---
const getTerrainHeight = (x: number, z: number, type: TerrainType): number => {
    switch (type) {
        case TerrainType.GRASS:
            // Rolling hills
            return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 + Math.sin(x * 0.3 + z * 0.2) * 0.5;
        case TerrainType.DESERT:
             // Dunes
             return Math.sin(x * 0.05 + z * 0.1) * 3 + Math.sin(z * 0.2) * 1; 
        case TerrainType.VOLCANIC:
             // Jagged spikes and crater-like depression
             const r = Math.sqrt(x*x + z*z);
             const crater = Math.max(0, 5 - r * 0.2); 
             return Math.abs(Math.sin(x * 0.15) * Math.cos(z * 0.15)) * 4 - crater; 
        case TerrainType.SNOW:
             // Smooth mounds
             return Math.cos(x * 0.08) * 2 + Math.sin(z * 0.08) * 2 + Math.random() * 0.1;
        default:
            return 0;
    }
};

const GroundMesh = ({ terrain }: { terrain: TerrainType }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const config = TERRAIN_CONFIG[terrain];

    useLayoutEffect(() => {
        if (!meshRef.current) return;
        
        const geometry = meshRef.current.geometry;
        const posAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            // In PlaneGeometry, z is 0 initially. We rotate -PI/2 X later.
            // We apply height map logic to the Z coordinate of the geometry.
            const height = getTerrainHeight(vertex.x, -vertex.y, terrain); 
            posAttribute.setZ(i, height);
        }

        posAttribute.needsUpdate = true;
        geometry.computeVertexNormals();

    }, [terrain]);

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <planeGeometry args={[ARENA_SIZE * 2, ARENA_SIZE * 2, 64, 64]} />
            <meshStandardMaterial color={config.groundColor} roughness={0.9} metalness={0.1} />
        </mesh>
    );
};


// --- VISUAL COMPONENTS ---

// 1. UNIT MODELS
const TrooperModel = ({ color }: { color: string }) => (
    <group>
        <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.6, 0.8, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.35]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.4, 0.9, 0.4]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color="#111" />
        </mesh>
    </group>
);

const MechModel = ({ color }: { color: string }) => (
    <group>
        <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[1.2, 1, 1.2]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.4, 0.5]}>
            <boxGeometry args={[0.8, 0.4, 0.4]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-0.8, 1.5, -0.2]} castShadow>
            <boxGeometry args={[0.4, 0.6, 0.8]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.8, 1.5, -0.2]} castShadow>
            <boxGeometry args={[0.4, 0.6, 0.8]} />
            <meshStandardMaterial color="#333" />
        </mesh>
    </group>
);

const BerserkerModel = ({ color }: { color: string }) => (
    <group>
        <mesh position={[0, 0.8, 0]} castShadow>
            <coneGeometry args={[0.5, 1, 4]} />
            <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
            <dodecahedronGeometry args={[0.25]} />
            <meshStandardMaterial color="#444" />
        </mesh>
        <group position={[0.5, 0.8, 0.3]} rotation={[0.5, 0.5, 0]}>
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.1, 0.8, 0.1]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
                 <boxGeometry args={[0.4, 0.3, 0.05]} />
                 <meshStandardMaterial color="#ccc" metalness={0.8} />
            </mesh>
        </group>
    </group>
);

const PaladinModel = ({ color }: { color: string }) => (
    <group>
        <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.3, 1, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[0.3, 0.4, 0.3]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
        <mesh position={[0.4, 0.9, 0.3]} rotation={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.1, 0.8, 0.6]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
        </mesh>
    </group>
);

const MageModel = ({ color }: { color: string }) => (
    <group>
        <mesh position={[0, 0.6, 0]} castShadow>
            <coneGeometry args={[0.5, 1.2, 8, 1, true]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
             <sphereGeometry args={[0.15, 8, 8]} />
             <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1} wireframe />
        </mesh>
        <Float speed={4} rotationIntensity={2} floatIntensity={1}>
            <mesh position={[0.5, 1, 0]}>
                <dodecahedronGeometry args={[0.1]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} />
            </mesh>
        </Float>
    </group>
);

const SniperModel = ({ color }: { color: string }) => (
    <group>
        <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 1.2, 5]} />
            <meshStandardMaterial color="#3f6212" roughness={1} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshStandardMaterial color="#3f6212" roughness={1} />
        </mesh>
        <group position={[0.2, 1, 0.4]} rotation={[0, 0, -0.2]}>
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.04, 1.4, 4]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    </group>
);

const GrimReaperModel = () => {
    const group = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (group.current) {
            group.current.children.forEach((child, i) => {
                if (child.name === 'tentacle') {
                    child.rotation.z = Math.sin(state.clock.elapsedTime * 2 + i) * 0.2;
                    child.rotation.x = Math.cos(state.clock.elapsedTime * 1.5 + i) * 0.2;
                }
            });
        }
    });

    return (
        <group ref={group}>
            {/* Body - Black Robe */}
            <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.6, 2.4, 8]} />
                <meshStandardMaterial color="black" roughness={0.9} />
            </mesh>
            {/* Head - Hood */}
            <mesh position={[0, 2.3, 0.1]} rotation={[0.2, 0, 0]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 2.3, 0.3]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial color="black" />
            </mesh>
            {/* Scythe */}
            <group position={[0.6, 1.5, 0.4]} rotation={[0, 0, -0.2]}>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 2.5, 4]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
                <mesh position={[0, 1.2, 0.4]} rotation={[Math.PI/2, 0, -0.5]}>
                    <cylinderGeometry args={[0.01, 0.1, 1.2, 4]} />
                    <meshStandardMaterial color="#aaa" metalness={0.9} />
                </mesh>
            </group>
            {/* Tentacles */}
            {[...Array(6)].map((_, i) => (
                <group key={i} name="tentacle" position={[0, 1.8, -0.2]} rotation={[0, (i/6)*Math.PI*2, 0]}>
                     <mesh position={[0, 0.5, 0.5]} rotation={[-0.5, 0, 0]}>
                         <cylinderGeometry args={[0.02, 0.08, 1.5, 4]} />
                         <meshStandardMaterial color="#111" />
                     </mesh>
                </group>
            ))}
        </group>
    )
}

const KnightModel = () => (
    <group>
        {/* Horse */}
        <group position={[0, 0.8, 0]}>
             {/* Body */}
             <mesh position={[0, 0, 0]} castShadow>
                 <boxGeometry args={[0.8, 0.8, 1.6]} />
                 <meshStandardMaterial color="#5c4033" />
             </mesh>
             {/* Neck/Head */}
             <mesh position={[0, 0.8, 0.6]} rotation={[-0.5, 0, 0]} castShadow>
                 <boxGeometry args={[0.4, 0.8, 0.5]} />
                 <meshStandardMaterial color="#5c4033" />
             </mesh>
             {/* Legs */}
             <mesh position={[-0.3, -0.8, 0.6]}> <boxGeometry args={[0.2, 0.8, 0.2]} /> <meshStandardMaterial color="#3f2e3e" /> </mesh>
             <mesh position={[0.3, -0.8, 0.6]}> <boxGeometry args={[0.2, 0.8, 0.2]} /> <meshStandardMaterial color="#3f2e3e" /> </mesh>
             <mesh position={[-0.3, -0.8, -0.6]}> <boxGeometry args={[0.2, 0.8, 0.2]} /> <meshStandardMaterial color="#3f2e3e" /> </mesh>
             <mesh position={[0.3, -0.8, -0.6]}> <boxGeometry args={[0.2, 0.8, 0.2]} /> <meshStandardMaterial color="#3f2e3e" /> </mesh>
        </group>

        {/* Knight */}
        <group position={[0, 1.6, 0.2]}>
             <mesh castShadow>
                 <cylinderGeometry args={[0.3, 0.3, 0.8, 6]} />
                 <meshStandardMaterial color="silver" metalness={0.8} />
             </mesh>
             <mesh position={[0, 0.6, 0]}>
                 <boxGeometry args={[0.3, 0.35, 0.3]} />
                 <meshStandardMaterial color="silver" metalness={0.9} />
             </mesh>
             {/* Lance */}
             <mesh position={[0.4, 0, 0.5]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.05, 0.08, 2.5, 6]} />
                 <meshStandardMaterial color="#ddd" metalness={0.6} />
             </mesh>
        </group>
    </group>
)

const SupermanModel = () => (
    <group position={[0, 2, 0]}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            {/* Body */}
            <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.5, 0.8, 0.3]} />
                <meshStandardMaterial color="#2563eb" />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.15, -0.6, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                <meshStandardMaterial color="#2563eb" />
            </mesh>
            <mesh position={[0.15, -0.6, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                <meshStandardMaterial color="#2563eb" />
            </mesh>
            {/* Boots */}
            <mesh position={[-0.15, -1, 0]}>
                <boxGeometry args={[0.12, 0.3, 0.15]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
             <mesh position={[0.15, -1, 0]}>
                <boxGeometry args={[0.12, 0.3, 0.15]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
            {/* Cape */}
            <mesh position={[0, -0.2, -0.2]} rotation={[0.2, 0, 0]}>
                <planeGeometry args={[0.6, 1.2]} />
                <meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.6, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#ffedd5" />
            </mesh>
            {/* Laser Eyes Indicator */}
            <mesh position={[0.05, 0.65, 0.15]}>
                 <sphereGeometry args={[0.03]} />
                 <meshBasicMaterial color="red" />
            </mesh>
             <mesh position={[-0.05, 0.65, 0.15]}>
                 <sphereGeometry args={[0.03]} />
                 <meshBasicMaterial color="red" />
            </mesh>
        </Float>
    </group>
)


// 2. MAIN UNIT COMPONENT
const Unit3D = ({ unit, units, onClick, terrain }: { unit: UnitInstance; units: UnitInstance[]; onClick?: () => void; terrain: TerrainType }) => {
  const template = getTemplate(unit.templateId);
  const isRed = unit.team === Team.RED;
  const hpPercent = unit.currentStats.hp / unit.currentStats.maxHp;
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Lerp position (X, Z)
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, unit.position[0], 0.2);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, unit.position[2], 0.2);
    
    // UPDATE Y BASED ON TERRAIN
    if (unit.templateId !== 'superman') {
        const groundHeight = getTerrainHeight(unit.position[0], unit.position[2], terrain);
        meshRef.current.position.y = groundHeight;
    } else {
        // Superman flies above terrain
        const groundHeight = getTerrainHeight(unit.position[0], unit.position[2], terrain);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, groundHeight + 0, 0.1); 
    }
    
    // ORIENTATION LOGIC
    if (unit.targetId) {
       const target = units.find(u => u.id === unit.targetId);
       if (target) {
            const dx = target.position[0] - unit.position[0];
            const dz = target.position[2] - unit.position[2];
            meshRef.current.rotation.y = Math.atan2(dx, dz);
       }
    } else if (Math.abs(unit.velocity[0]) > 0.01 || Math.abs(unit.velocity[2]) > 0.01) {
        const angle = Math.atan2(unit.velocity[0], unit.velocity[2]);
        meshRef.current.rotation.y = angle;
    } else {
        const defaultRotation = isRed ? Math.PI / 2 : -Math.PI / 2;
        meshRef.current.rotation.y = defaultRotation;
    }

    // Walking Animation (Bounce)
    const isMoving = Math.abs(unit.velocity[0]) > 0.01 || Math.abs(unit.velocity[2]) > 0.01;
    if (isMoving && unit.templateId !== 'superman' && unit.templateId !== 'heavy_tank') {
      const bounce = Math.sin(state.clock.elapsedTime * 15) * 0.1;
      meshRef.current.position.y += bounce;
    }

    if (unit.isDead) {
      meshRef.current.scale.multiplyScalar(0.9);
      meshRef.current.rotation.x += 0.1;
    }
  });

  if (unit.isDead && unit.currentStats.hp <= 0) return null;

  const renderModel = () => {
      switch(unit.templateId) {
          case 'foot_soldier': return <TrooperModel color={template.color} />;
          case 'heavy_tank': return <MechModel color={template.color} />;
          case 'berserker': return <BerserkerModel color={template.color} />;
          case 'paladin': return <PaladinModel color={template.color} />;
          case 'dark_mage': return <MageModel color={template.color} />;
          case 'sniper': return <SniperModel color={template.color} />;
          case 'grim_reaper': return <GrimReaperModel />;
          case 'knight': return <KnightModel />;
          case 'superman': return <SupermanModel />;
          default: return <TrooperModel color={template.color} />;
      }
  };

  return (
    <group ref={meshRef} position={[unit.position[0], 0, unit.position[2]]} onClick={onClick}>
      {/* HP Bar */}
      <group position={[0, template.height + (unit.templateId === 'superman' ? 2 : 0.5), 0]} rotation={[0,0,0]}> 
        <mesh position={[-0.5 * (1 - hpPercent), 0, 0]}>
          <planeGeometry args={[1.2 * hpPercent, 0.15]} />
          <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : '#ef4444'} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.25, 0.2]} />
          <meshBasicMaterial color="black" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* The Unit Model */}
      {renderModel()}
      
      {/* Team Indicator Ring */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshBasicMaterial color={isRed ? 'red' : 'blue'} opacity={0.6} transparent />
      </mesh>
    </group>
  );
};

// 3. VFX COMPONENTS

type EffectData = {
    id: string;
    type: 'bullet' | 'missile' | 'laser' | 'magic' | 'dark' | 'explosion';
    from: [number, number, number];
    to: [number, number, number];
    color: string;
    progress: number; // 0 to 1
};

const ProjectileSystem = ({ effects, setEffects }: { effects: EffectData[], setEffects: React.Dispatch<React.SetStateAction<EffectData[]>> }) => {
    useFrame((state, delta) => {
        setEffects(prev => {
            if (prev.length === 0) return prev;
            const next: EffectData[] = [];
            
            for (const ef of prev) {
                // Determine speed
                let speed = 1.0;
                if (ef.type === 'bullet') speed = 3.0;
                else if (ef.type === 'laser') speed = 10.0;
                else if (ef.type === 'missile') speed = 0.8;
                else if (ef.type === 'magic') speed = 2.0;
                else if (ef.type === 'dark') speed = 2.0;
                
                const newProgress = ef.progress + (speed * delta);
                
                if (ef.type === 'explosion') {
                    if (newProgress < 2) {
                        next.push({ ...ef, progress: newProgress });
                    }
                } else {
                    if (newProgress < 1) {
                        next.push({ ...ef, progress: newProgress });
                    } else {
                        // Spawn explosion on hit (Missile or Dark Magic)
                        if (ef.type === 'missile' || ef.type === 'dark') {
                            // Explicitly construct the explosion object to avoid TypeScript narrowing issues with spread
                            next.push({ 
                                id: Math.random().toString(), 
                                type: 'explosion', 
                                from: ef.from, 
                                to: ef.to, 
                                color: ef.color, 
                                progress: 0 
                            });
                        }
                    }
                }
            }
            return next;
        });
    });

    return (
        <group>
            {effects.map(ef => {
                if (ef.type === 'explosion') {
                    const scale = ef.progress * 3;
                    const opacity = Math.max(0, 1 - (ef.progress / 2));
                    return (
                        <mesh key={ef.id} position={ef.to}>
                            <sphereGeometry args={[1, 8, 8]} />
                            <meshBasicMaterial color={ef.color === '#000000' || ef.color === '#7e22ce' ? "purple" : "orange"} transparent opacity={opacity} />
                        </mesh>
                    );
                }

                const x = THREE.MathUtils.lerp(ef.from[0], ef.to[0], ef.progress);
                const y = THREE.MathUtils.lerp(ef.from[1] + 1, ef.to[1] + 1, ef.progress);
                const z = THREE.MathUtils.lerp(ef.from[2], ef.to[2], ef.progress);
                
                const currentY = ef.type === 'missile' ? y + Math.sin(ef.progress * Math.PI) * 5 : y;

                return (
                    <group key={ef.id} position={[x, currentY, z]}>
                        {ef.type === 'bullet' && (
                             <mesh rotation={[0,0,Math.PI/2]}>
                                 <capsuleGeometry args={[0.05, 0.5, 4, 8]} />
                                 <meshBasicMaterial color="#fef08a" />
                             </mesh>
                        )}
                        {ef.type === 'missile' && (
                             <mesh>
                                 <boxGeometry args={[0.2, 0.2, 0.6]} />
                                 <meshStandardMaterial color="#333" />
                                 <Trail width={0.4} length={4} color="orange" attenuation={(t) => t * t}>
                                     <mesh />
                                 </Trail>
                             </mesh>
                        )}
                        {ef.type === 'laser' && (
                            <mesh rotation={[Math.PI/2, 0, 0]}>
                                <cylinderGeometry args={[0.05, 0.05, 4, 6]} />
                                <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
                            </mesh>
                        )}
                        {ef.type === 'magic' && (
                             <mesh>
                                 <dodecahedronGeometry args={[0.3]} />
                                 <meshStandardMaterial color={ef.color} emissive={ef.color} emissiveIntensity={2} />
                                 <pointLight distance={3} intensity={2} color={ef.color} />
                             </mesh>
                        )}
                         {ef.type === 'dark' && (
                             <mesh>
                                 <sphereGeometry args={[0.3, 8, 8]} />
                                 <meshStandardMaterial color="#000" />
                                 <mesh scale={1.2}>
                                     <sphereGeometry args={[0.3, 8, 8]} />
                                     <meshBasicMaterial color={ef.color} transparent opacity={0.3} />
                                 </mesh>
                             </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
};

const SnowEffect = () => {
    const count = 2000;
    const mesh = useRef<THREE.Points>(null);
    
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * ARENA_SIZE * 2;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * ARENA_SIZE * 2;
            speeds[i] = 0.5 + Math.random() * 2;
        }
        
        return { positions, speeds };
    }, []);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        
        const positions = mesh.current.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 1] -= particles.speeds[i] * delta * 4;
            positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.02;
            
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 40;
                positions[i * 3] = (Math.random() - 0.5) * ARENA_SIZE * 2;
                positions[i * 3 + 2] = (Math.random() - 0.5) * ARENA_SIZE * 2;
            }
        }
        
        mesh.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles.positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial color="white" size={0.15} transparent opacity={0.8} />
        </points>
    );
}

// 4. MAP & TERRAIN GENERATION MODELS

// --- SCENERY MODELS ---
const HouseModel = () => (
    <group>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="#fcd34d" />
        </mesh>
        <mesh position={[0, 2, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
             <coneGeometry args={[1.5, 1.5, 4]} />
             <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 0.5, 0.76]}>
            <planeGeometry args={[0.5, 1]} />
            <meshStandardMaterial color="#5c4033" />
        </mesh>
    </group>
);

const BoneModel = () => (
    <group rotation={[Math.PI/2, 0, 0]}>
        <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.05, 2, 6]} />
            <meshStandardMaterial color="#e5e5e5" />
        </mesh>
        {[...Array(3)].map((_, i) => (
            <mesh key={i} position={[0, -0.5 + i * 0.5, 0]} rotation={[0, 0, Math.PI/2]}>
                 <torusGeometry args={[0.4, 0.05, 4, 8, Math.PI]} />
                 <meshStandardMaterial color="#e5e5e5" />
            </mesh>
        ))}
    </group>
);

const XmasTreeModel = () => (
    <group>
        <mesh position={[0, 0.5, 0]} castShadow>
             <cylinderGeometry args={[0.2, 0.3, 1, 6]} />
             <meshStandardMaterial color="#3f2e3e" />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
             <coneGeometry args={[1.2, 1.5, 8]} />
             <meshStandardMaterial color="#064e3b" />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
             <coneGeometry args={[1, 1.5, 8]} />
             <meshStandardMaterial color="#065f46" />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow>
             <coneGeometry args={[0.7, 1.5, 8]} />
             <meshStandardMaterial color="#047857" />
        </mesh>
        <mesh position={[0, 4.3, 0]}>
             <dodecahedronGeometry args={[0.2]} />
             <meshBasicMaterial color="yellow" />
        </mesh>
        {[...Array(6)].map((_, i) => (
             <mesh key={i} position={[Math.sin(i)*0.6, 2 + (i%2)*0.8, Math.cos(i)*0.6]}>
                 <sphereGeometry args={[0.1, 6, 6]} />
                 <meshStandardMaterial color={i % 2 === 0 ? "red" : "gold"} />
             </mesh>
        ))}
    </group>
);

const GiftModel = ({ color }: { color: string }) => (
    <group>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.62, 0.1, 0.62]} />
            <meshStandardMaterial color="gold" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.1, 0.62, 0.62]} />
            <meshStandardMaterial color="gold" />
        </mesh>
    </group>
);

const SkullModel = () => (
    <group>
        <mesh position={[0, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshStandardMaterial color="#d4d4d4" />
        </mesh>
        <mesh position={[0, 0.2, 0.1]} castShadow>
             <boxGeometry args={[0.3, 0.2, 0.3]} />
             <meshStandardMaterial color="#a3a3a3" />
        </mesh>
        <mesh position={[0.15, 0.55, 0.35]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshBasicMaterial color="#4ade80" />
            <pointLight distance={1} intensity={2} color="#4ade80" decay={2} />
        </mesh>
        <mesh position={[-0.15, 0.55, 0.35]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshBasicMaterial color="#4ade80" />
            <pointLight distance={1} intensity={2} color="#4ade80" decay={2} />
        </mesh>
    </group>
);

const Scenery = React.memo(({ terrain }: { terrain: TerrainType }) => {
    const objects = useMemo(() => {
        const items = [];
        const count = 50; 
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * ARENA_SIZE * 1.8; 
            const z = (Math.random() - 0.5) * ARENA_SIZE * 1.8;
            const scale = 0.5 + Math.random() * 1.5;
            const y = getTerrainHeight(x, z, terrain);

            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

            let type = 'rock';
            let color = '';

            if (terrain === TerrainType.GRASS) {
                 const rand = Math.random();
                 if (rand > 0.8) type = 'house';
                 else if (rand > 0.4) type = 'tree';
            }
            if (terrain === TerrainType.DESERT) {
                const rand = Math.random();
                if (rand > 0.85) type = 'bones';
                else if (rand > 0.5) type = 'cactus';
            }
            if (terrain === TerrainType.SNOW) {
                const rand = Math.random();
                if (rand > 0.85) {
                    type = 'gift';
                    color = Math.random() > 0.5 ? "#ef4444" : "#3b82f6";
                }
                else if (rand > 0.4) type = 'xmas_tree';
                else type = 'rock';
            }
            if (terrain === TerrainType.VOLCANIC) {
                const rand = Math.random();
                if (rand > 0.7) type = 'skull';
                else type = 'spire';
            }
            
            const rotation: [number, number, number] = [0, Math.random() * Math.PI * 2, 0];
            
            if (type === 'bones') {
                rotation[0] = 0; 
                rotation[1] = Math.random() * Math.PI * 2;
                rotation[2] = 0;
            } else if (type === 'rock') {
                rotation[0] = Math.random() * Math.PI;
                rotation[1] = Math.random() * Math.PI;
            }
            
            items.push({ id: i, x, y, z, scale, type, rotation, color });
        }
        return items;
    }, [terrain]);

    return (
        <group>
            <GroundMesh terrain={terrain} />
            {objects.map(obj => (
                <group key={obj.id} position={[obj.x, obj.y, obj.z]} scale={obj.scale} rotation={new THREE.Euler(...obj.rotation)}>
                    {obj.type === 'tree' && (
                        <group>
                             <mesh position={[0, 1, 0]} castShadow>
                                 <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
                                 <meshStandardMaterial color="#5c4033" />
                             </mesh>
                             <mesh position={[0, 2.5, 0]} castShadow>
                                 <coneGeometry args={[1.5, 3, 8]} />
                                 <meshStandardMaterial color="#15803d" />
                             </mesh>
                        </group>
                    )}
                    {obj.type === 'rock' && (
                         <mesh position={[0, 0.5, 0]} castShadow>
                             <dodecahedronGeometry args={[0.8]} />
                             <meshStandardMaterial color="#57534e" />
                         </mesh>
                    )}
                    {obj.type === 'house' && <HouseModel />}
                    {obj.type === 'cactus' && (
                        <group>
                             <mesh position={[0, 1, 0]} castShadow>
                                 <capsuleGeometry args={[0.3, 2, 4, 8]} />
                                 <meshStandardMaterial color="#166534" />
                             </mesh>
                             <mesh position={[0.4, 1.2, 0]} rotation={[0,0,-0.5]} castShadow>
                                 <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
                                 <meshStandardMaterial color="#166534" />
                             </mesh>
                        </group>
                    )}
                    {obj.type === 'bones' && <BoneModel />}
                    {obj.type === 'xmas_tree' && <XmasTreeModel />}
                    {obj.type === 'gift' && <GiftModel color={obj.color} />}
                    {obj.type === 'spire' && (
                         <mesh position={[0, 1.5, 0]} castShadow>
                             <coneGeometry args={[0.4, 3, 4]} />
                             <meshStandardMaterial color="#7f1d1d" />
                         </mesh>
                    )}
                    {obj.type === 'skull' && <SkullModel />}
                </group>
            ))}
        </group>
    );
});

const Atmosphere = ({ terrain }: { terrain: TerrainType }) => {
    return (
        <>
            {terrain === TerrainType.GRASS && (
                <>
                    <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={0.6} />
                    <Environment preset="park" background={false} />
                    <ambientLight intensity={0.5} />
                </>
            )}
            {terrain === TerrainType.DESERT && (
                <>
                    <Sky sunPosition={[100, 10, 0]} turbidity={15} rayleigh={0.2} mieCoefficient={0.005} mieDirectionalG={0.8} />
                    <Environment preset="sunset" background={false} />
                    <ambientLight intensity={0.6} />
                </>
            )}
            {terrain === TerrainType.SNOW && (
                <>
                    <Sky sunPosition={[0, 5, -100]} turbidity={20} rayleigh={0.2} />
                    <Environment preset="dawn" background={false} />
                    <ambientLight intensity={0.7} />
                    <fog attach="fog" args={['#e2e8f0', 10, 90]} />
                    <SnowEffect />
                </>
            )}
            {terrain === TerrainType.VOLCANIC && (
                <>
                    <color attach="background" args={['#1a0505']} />
                    <fog attach="fog" args={['#1a0505', 5, 80]} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <ambientLight intensity={0.5} color="#7f1d1d" />
                    <directionalLight position={[0, 20, 0]} intensity={1} color="#f97316" />
                </>
            )}
        </>
    )
}


// --- MAIN SCENE ---

interface BattleSceneProps {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  terrain: TerrainType;
  selectedTemplateId: string | null;
  selectedTeam: Team;
  budgets: Record<Team, number>;
  decreaseBudget: (amount: number) => void;
  setWinner: (w: Team) => void;
  onTeamStatusChange: (hasRed: boolean, hasBlue: boolean) => void;
}

export const BattleScene: React.FC<BattleSceneProps> = ({
  phase,
  setPhase,
  terrain,
  selectedTemplateId,
  selectedTeam,
  budgets,
  decreaseBudget,
  setWinner,
  onTeamStatusChange
}) => {
  const [units, setUnits] = useState<UnitInstance[]>([]);
  const [effects, setEffects] = useState<EffectData[]>([]);

  useEffect(() => {
    const hasRed = units.some(u => u.team === Team.RED);
    const hasBlue = units.some(u => u.team === Team.BLUE);
    onTeamStatusChange(hasRed, hasBlue);
  }, [units, onTeamStatusChange]);

  useFrame((state, delta) => {
    if (phase !== GamePhase.BATTLE) return;

    setUnits(prevUnits => {
      const nextUnits = prevUnits.map(u => ({ ...u, velocity: [0, 0, 0] as [number, number, number] }));
      let hasRed = false;
      let hasBlue = false;
      const newEffects: EffectData[] = [];

      nextUnits.forEach(unit => {
        if (unit.isDead) return;
        if (unit.team === Team.RED) hasRed = true;
        if (unit.team === Team.BLUE) hasBlue = true;

        if (unit.currentCooldown > 0) unit.currentCooldown -= delta;

        let target = nextUnits.find(u => u.id === unit.targetId);
        
        if (!target || target.isDead) {
          let minDist = Infinity;
          let newTargetId: string | null = null;
          
          nextUnits.forEach(enemy => {
             if (enemy.team !== unit.team && !enemy.isDead) {
                 const d = getDistance(unit.position, enemy.position);
                 if (d < minDist) {
                     minDist = d;
                     newTargetId = enemy.id;
                 }
             }
          });
          
          unit.targetId = newTargetId;
          target = nextUnits.find(u => u.id === newTargetId);
        }

        if (target) {
            const dist = getDistance(unit.position, target.position);
            const template = getTemplate(unit.templateId);
            const range = unit.currentStats.range;

            if (dist <= range) {
                if (unit.currentCooldown <= 0) {
                    unit.currentCooldown = unit.maxCooldown;
                    
                    const damage = Math.max(10, unit.currentStats.atk - (target.currentStats.def * 0.05));
                    target.currentStats.hp -= damage;
                    if (target.currentStats.hp <= 0) {
                        target.isDead = true;
                    }

                    let vfxType: EffectData['type'] = 'bullet';
                    if (unit.templateId === 'heavy_tank') vfxType = 'missile';
                    if (unit.templateId === 'sniper' || unit.templateId === 'superman') vfxType = 'laser';
                    if (unit.templateId === 'paladin') vfxType = 'magic';
                    if (unit.templateId === 'dark_mage' || unit.templateId === 'grim_reaper') vfxType = 'dark';
                    if (unit.templateId === 'berserker' || unit.templateId === 'knight') vfxType = 'bullet'; 

                    if (unit.templateId !== 'berserker' && unit.templateId !== 'knight' && unit.templateId !== 'grim_reaper') {
                         newEffects.push({
                            id: Math.random().toString(),
                            type: vfxType,
                            from: [...unit.position] as [number, number, number],
                            to: [...target.position] as [number, number, number],
                            color: template.color,
                            progress: 0
                        });
                    }
                }
            } else {
                const dx = target.position[0] - unit.position[0];
                const dz = target.position[2] - unit.position[2];
                const length = Math.sqrt(dx * dx + dz * dz);
                
                if (length > 0) {
                    unit.velocity[0] = (dx / length) * unit.currentStats.moveSpeed * delta;
                    unit.velocity[2] = (dz / length) * unit.currentStats.moveSpeed * delta;
                }
            }
        }
      });

      nextUnits.forEach((unit, i) => {
          if (unit.isDead) return;

          unit.position[0] += unit.velocity[0];
          unit.position[2] += unit.velocity[2];

          const boundary = ARENA_SIZE - 2; 
          unit.position[0] = Math.max(-boundary, Math.min(boundary, unit.position[0]));
          unit.position[2] = Math.max(-boundary, Math.min(boundary, unit.position[2]));

          const radius = getTemplate(unit.templateId).width / 2;
          
          nextUnits.forEach((other, j) => {
              if (i === j || other.isDead) return;
              const dx = unit.position[0] - other.position[0];
              const dz = unit.position[2] - other.position[2];
              const dist = Math.sqrt(dx*dx + dz*dz);
              const minGap = radius + getTemplate(other.templateId).width / 2;

              if (dist < minGap && dist > 0.0001) {
                  const push = (minGap - dist) / 2;
                  unit.position[0] += (dx / dist) * push;
                  unit.position[2] += (dz / dist) * push;
              }
          });
      });

      if (!hasRed && hasBlue) {
          setPhase(GamePhase.GAME_OVER);
          setWinner(Team.BLUE);
      } else if (!hasBlue && hasRed) {
          setPhase(GamePhase.GAME_OVER);
          setWinner(Team.RED);
      }

      if (newEffects.length > 0) {
          setEffects(prev => [...prev, ...newEffects].slice(-50));
      }

      return [...nextUnits];
    });
  });

  const handleGroundClick = (e: ThreeEvent<MouseEvent>) => {
    if (phase !== GamePhase.SETUP || !selectedTemplateId) return;
    e.stopPropagation();

    const template = getTemplate(selectedTemplateId);
    if (budgets[selectedTeam] < template.cost) return;

    const point = e.point;
    
    if (selectedTeam === Team.RED && point.x > 0) {
        alert("Red team must place on the Left side!");
        return;
    }
    if (selectedTeam === Team.BLUE && point.x < 0) {
        alert("Blue team must place on the Right side!");
        return;
    }

    const newUnit: UnitInstance = {
      id: Math.random().toString(36).substr(2, 9),
      templateId: template.id,
      team: selectedTeam,
      position: [point.x, 0, point.z],
      velocity: [0, 0, 0],
      currentStats: { ...template.stats, hp: template.stats.maxHp },
      targetId: null,
      lastAttackTime: 0,
      isDead: false,
      maxCooldown: 1 / template.stats.attackSpeed,
      currentCooldown: 0
    };

    setUnits(prev => [...prev, newUnit]);
    decreaseBudget(template.cost);
  };

  return (
    <>
      <OrbitControls makeDefault minDistance={20} maxDistance={120} maxPolarAngle={Math.PI / 2.2} />
      <Atmosphere terrain={terrain} />

      <directionalLight 
        position={[40, 60, 20]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      <Scenery terrain={terrain} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 5, 0]} onClick={handleGroundClick} visible={false}>
            <planeGeometry args={[ARENA_SIZE * 2, ARENA_SIZE * 2]} />
      </mesh>

      {units.map(unit => (
        <Unit3D key={unit.id} unit={unit} units={units} terrain={terrain} />
      ))}

      <ProjectileSystem effects={effects} setEffects={setEffects} />
      
      {phase === GamePhase.SETUP && (
          <group position={[0, 0.1, 0]}>
              <mesh position={[-ARENA_SIZE/2, 5, 0]} rotation={[-Math.PI/2, 0, 0]}>
                  <planeGeometry args={[ARENA_SIZE, ARENA_SIZE * 2]} />
                  <meshBasicMaterial color="red" opacity={0.05} transparent side={THREE.DoubleSide} />
              </mesh>
               <mesh position={[ARENA_SIZE/2, 5, 0]} rotation={[-Math.PI/2, 0, 0]}>
                  <planeGeometry args={[ARENA_SIZE, ARENA_SIZE * 2]} />
                  <meshBasicMaterial color="blue" opacity={0.05} transparent side={THREE.DoubleSide} />
              </mesh>
          </group>
      )}
    </>
  );
};