import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, SoftShadows, ContactShadows, Text, Float, Trail, Stars, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { UnitInstance, UnitTemplate, Team, GamePhase, TerrainType, AttackType } from '../types';
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
    }
  }
}

// --- Helpers ---
const getTemplate = (id: string) => UNIT_TEMPLATES.find(t => t.id === id)!;

const getDistance = (p1: [number, number, number], p2: [number, number, number]) => {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[2] - p2[2], 2));
};

// --- Visual Components ---

// 1. UNIT MODELS - Specialized geometry for each character class
const TrooperModel = ({ color }: { color: string }) => (
    <group>
        {/* Body */}
        <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.6, 0.8, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.35]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        {/* Gun */}
        <mesh position={[0.4, 0.9, 0.4]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.1, 0.8]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.2, 0.2, 0]} castShadow>
             <boxGeometry args={[0.15, 0.4, 0.2]} />
             <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.2, 0.2, 0]} castShadow>
             <boxGeometry args={[0.15, 0.4, 0.2]} />
             <meshStandardMaterial color="#222" />
        </mesh>
    </group>
);

const MechModel = ({ color }: { color: string }) => (
    <group>
        {/* Main Hull */}
        <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[1.2, 1, 1.2]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Cockpit */}
        <mesh position={[0, 1.4, 0.5]}>
            <boxGeometry args={[0.8, 0.4, 0.4]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
        {/* Missile Pods (Shoulders) */}
        <mesh position={[-0.8, 1.5, -0.2]} castShadow>
            <boxGeometry args={[0.4, 0.6, 0.8]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.8, 1.5, -0.2]} castShadow>
            <boxGeometry args={[0.4, 0.6, 0.8]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.5, 0.3, 0]} rotation={[0, 0, -0.2]} castShadow>
             <boxGeometry args={[0.4, 0.8, 0.6]} />
             <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, 0.2]} castShadow>
             <boxGeometry args={[0.4, 0.8, 0.6]} />
             <meshStandardMaterial color="#222" />
        </mesh>
    </group>
);

const BerserkerModel = ({ color }: { color: string }) => (
    <group>
        {/* Body */}
        <mesh position={[0, 0.8, 0]} castShadow>
            <coneGeometry args={[0.5, 1, 4]} />
            <meshStandardMaterial color={color} />
        </mesh>
        {/* Head with Horns */}
        <mesh position={[0, 1.4, 0]}>
            <dodecahedronGeometry args={[0.25]} />
            <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[0.2, 1.55, 0]} rotation={[0,0,-0.5]}>
            <coneGeometry args={[0.05, 0.3]} />
            <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[-0.2, 1.55, 0]} rotation={[0,0,0.5]}>
            <coneGeometry args={[0.05, 0.3]} />
            <meshStandardMaterial color="white" />
        </mesh>
        {/* Axes */}
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
         <group position={[-0.5, 0.8, 0.3]} rotation={[0.5, -0.5, 0]}>
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
        {/* Armor */}
        <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.3, 1, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Head/Helm */}
        <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[0.3, 0.4, 0.3]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
        {/* Shield */}
        <mesh position={[0.4, 0.9, 0.3]} rotation={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.1, 0.8, 0.6]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0.4, 0.9, 0.35]}>
             <boxGeometry args={[0.12, 0.4, 0.3]} />
             <meshStandardMaterial color="#f59e0b" />
        </mesh>
    </group>
);

const MageModel = ({ color }: { color: string }) => (
    <group>
        {/* Robes */}
        <mesh position={[0, 0.6, 0]} castShadow>
            <coneGeometry args={[0.5, 1.2, 8, 1, true]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        {/* Floating Head */}
        <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
             <sphereGeometry args={[0.15]} />
             <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1} wireframe />
        </mesh>
        {/* Floating Orbs */}
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
        {/* Ghillie Suit Body */}
        <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 1.2, 5]} />
            <meshStandardMaterial color="#3f6212" roughness={1} />
        </mesh>
        {/* Hood */}
        <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.25]} />
            <meshStandardMaterial color="#3f6212" roughness={1} />
        </mesh>
        {/* Long Rifle */}
        <group position={[0.2, 1, 0.4]} rotation={[0, 0, -0.2]}>
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.04, 1.4]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    </group>
);


// 2. MAIN UNIT COMPONENT
const Unit3D = ({ unit, units, onClick }: { unit: UnitInstance; units: UnitInstance[]; onClick?: () => void }) => {
  const template = getTemplate(unit.templateId);
  const isRed = unit.team === Team.RED;
  const hpPercent = unit.currentStats.hp / unit.currentStats.maxHp;
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Lerp position
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, unit.position[0], 0.2);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, unit.position[2], 0.2);
    
    // ORIENTATION LOGIC
    let targetLookAt: THREE.Vector3 | null = null;

    if (unit.targetId) {
       // Look at Target
       const target = units.find(u => u.id === unit.targetId);
       if (target) {
            // Calculate angle to target
            const dx = target.position[0] - unit.position[0];
            const dz = target.position[2] - unit.position[2];
            meshRef.current.rotation.y = Math.atan2(dx, dz);
       }
    } else if (Math.abs(unit.velocity[0]) > 0.01 || Math.abs(unit.velocity[2]) > 0.01) {
        // Look at movement direction
        const angle = Math.atan2(unit.velocity[0], unit.velocity[2]);
        meshRef.current.rotation.y = angle;
    } else {
        // Default Orientation (Idle/Setup)
        // Red (Left) faces +X (Right, angle PI/2)
        // Blue (Right) faces -X (Left, angle -PI/2)
        const defaultRotation = isRed ? Math.PI / 2 : -Math.PI / 2;
        
        // Smoothly rotate to default if not there
        // Simple lerp for rotation is tricky due to wrapping, just setting it for now is cleaner for setup
        meshRef.current.rotation.y = defaultRotation;
    }

    // Walking Animation (Bounce)
    const isMoving = Math.abs(unit.velocity[0]) > 0.01 || Math.abs(unit.velocity[2]) > 0.01;
    if (isMoving) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.1;
    } else {
      meshRef.current.position.y = 0;
    }

    // Attack Shake
    if (unit.currentCooldown > unit.maxCooldown * 0.8) {
         meshRef.current.position.x += (Math.random() - 0.5) * 0.1;
         meshRef.current.position.z += (Math.random() - 0.5) * 0.1;
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
          default: return <TrooperModel color={template.color} />;
      }
  };

  return (
    <group ref={meshRef} position={[unit.position[0], 0, unit.position[2]]} onClick={onClick}>
      {/* HP Bar */}
      <group position={[0, template.height + 0.5, 0]} rotation={[0,0,0]}> 
        <mesh position={[-0.5 * (1 - hpPercent), 0, 0]}>
          <planeGeometry args={[1.2 * hpPercent, 0.15]} />
          <meshBasicMaterial color={hpPercent > 0.5 ? '#22c55e' : '#ef4444'} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.25, 0.2]} />
          <meshBasicMaterial color="black" side={THREE.DoubleSide} />
        </mesh>
        <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
             <Text fontSize={0.4} position={[0, 0.4, 0]} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02}>
                {unit.currentStats.hp.toFixed(0)}
             </Text>
        </Float>
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
            const next = [];
            for (const ef of prev) {
                // Different speeds for different effects
                let speed = 1.0;
                if (ef.type === 'bullet') speed = 3.0;
                if (ef.type === 'laser') speed = 10.0;
                if (ef.type === 'missile') speed = 0.8;
                
                ef.progress += speed * delta;
                
                if (ef.progress < 1 || ef.type === 'explosion') {
                    if (ef.type === 'explosion') {
                        // Explosion lives based on progress being effectively "time alive"
                        // reusing progress > 1 logic to kill it eventually
                        if (ef.progress < 2) next.push(ef);
                    } else {
                        next.push(ef);
                    }
                } else {
                    // When projectile hits, maybe spawn explosion
                    if (ef.type === 'missile') {
                        next.push({ ...ef, id: Math.random().toString(), type: 'explosion', progress: 0 });
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
                    const opacity = 1 - (ef.progress / 2);
                    return (
                        <mesh key={ef.id} position={ef.to}>
                            <sphereGeometry args={[1, 16, 16]} />
                            <meshBasicMaterial color="orange" transparent opacity={opacity} />
                        </mesh>
                    );
                }

                // Calculate current position
                const x = THREE.MathUtils.lerp(ef.from[0], ef.to[0], ef.progress);
                const y = THREE.MathUtils.lerp(ef.from[1] + 1, ef.to[1] + 1, ef.progress);
                const z = THREE.MathUtils.lerp(ef.from[2], ef.to[2], ef.progress);
                
                // Add Parabola for missile
                const currentY = ef.type === 'missile' ? y + Math.sin(ef.progress * Math.PI) * 5 : y;

                return (
                    <group key={ef.id} position={[x, currentY, z]}>
                        {ef.type === 'bullet' && (
                             <mesh rotation={[0,0,Math.PI/2]}>
                                 <capsuleGeometry args={[0.05, 0.5]} />
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
                                <cylinderGeometry args={[0.05, 0.05, 4]} />
                                <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
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
                                 <sphereGeometry args={[0.3]} />
                                 <meshStandardMaterial color="#000" />
                                 <mesh scale={1.2}>
                                     <sphereGeometry args={[0.3]} />
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

// 4. MAP & TERRAIN GENERATION
const Scenery = ({ terrain }: { terrain: TerrainType }) => {
    const config = TERRAIN_CONFIG[terrain];

    // Generate random objects based on terrain
    // FIX: Pre-calculate randomness (including rotation) to avoid jitter on re-render
    const objects = useMemo(() => {
        const items = [];
        const count = 50; // Increased density for larger map
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * ARENA_SIZE * 1.8; // Use more of the map
            const z = (Math.random() - 0.5) * ARENA_SIZE * 1.8;
            const scale = 0.5 + Math.random() * 1.5;
            
            // Avoid exact center spawn to keep battle lanes somewhat clear
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

            let type = 'rock';
            if (terrain === TerrainType.GRASS && Math.random() > 0.3) type = 'tree';
            if (terrain === TerrainType.DESERT && Math.random() > 0.6) type = 'cactus';
            if (terrain === TerrainType.VOLCANIC) type = 'spire';
            
            // Store random rotation in the object data
            const rotation: [number, number, number] = [0, Math.random() * Math.PI * 2, 0];
            if (type === 'rock') {
                rotation[0] = Math.random() * Math.PI;
                rotation[1] = Math.random() * Math.PI;
            }

            items.push({ id: i, x, z, scale, type, rotation });
        }
        return items;
    }, [terrain]);

    return (
        <group>
            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[ARENA_SIZE * 2, ARENA_SIZE * 2]} />
                <meshStandardMaterial color={config.groundColor} />
            </mesh>
            <gridHelper args={[ARENA_SIZE * 2, ARENA_SIZE, '#ffffff', '#ffffff']} position={[0, 0, 0]}>
                <lineBasicMaterial attach="material" color="#ffffff" transparent opacity={0.05} />
            </gridHelper>

            {/* Objects */}
            {objects.map(obj => (
                <group key={obj.id} position={[obj.x, 0, obj.z]} scale={obj.scale} rotation={obj.rotation as any}>
                    {obj.type === 'tree' && (
                        <group>
                             <mesh position={[0, 1, 0]} castShadow>
                                 <cylinderGeometry args={[0.2, 0.3, 2]} />
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
                    {obj.type === 'cactus' && (
                        <group>
                             <mesh position={[0, 1, 0]} castShadow>
                                 <capsuleGeometry args={[0.3, 2]} />
                                 <meshStandardMaterial color="#166534" />
                             </mesh>
                             <mesh position={[0.4, 1.2, 0]} rotation={[0,0,-0.5]} castShadow>
                                 <capsuleGeometry args={[0.2, 0.8]} />
                                 <meshStandardMaterial color="#166534" />
                             </mesh>
                        </group>
                    )}
                    {obj.type === 'spire' && (
                         <mesh position={[0, 1.5, 0]} castShadow>
                             <coneGeometry args={[0.4, 3, 4]} />
                             <meshStandardMaterial color="#7f1d1d" />
                         </mesh>
                    )}
                </group>
            ))}
        </group>
    );
};

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
                </>
            )}
            {terrain === TerrainType.VOLCANIC && (
                <>
                    <color attach="background" args={['#1a0505']} />
                    <fog attach="fog" args={['#1a0505', 5, 80]} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <ambientLight intensity={0.2} />
                    <directionalLight position={[0, 10, 0]} intensity={1} color="red" />
                </>
            )}
        </>
    )
}


// --- MAIN SCENE ---

interface BattleSceneProps {
  units: UnitInstance[];
  setUnits: React.Dispatch<React.SetStateAction<UnitInstance[]>>;
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  terrain: TerrainType;
  selectedTemplateId: string | null;
  selectedTeam: Team;
  budgets: Record<Team, number>;
  decreaseBudget: (amount: number) => void;
  setWinner: (w: Team) => void;
}

export const BattleScene: React.FC<BattleSceneProps> = ({
  units,
  setUnits,
  phase,
  setPhase,
  terrain,
  selectedTemplateId,
  selectedTeam,
  budgets,
  decreaseBudget,
  setWinner
}) => {
  const [effects, setEffects] = useState<EffectData[]>([]);

  // --- PHYSICS & LOGIC LOOP ---
  useFrame((state, delta) => {
    if (phase !== GamePhase.BATTLE) return;

    setUnits(prevUnits => {
      const nextUnits = prevUnits.map(u => ({ ...u, velocity: [0, 0, 0] as [number, number, number] }));
      let hasRed = false;
      let hasBlue = false;
      const newEffects: EffectData[] = [];

      // 1. Identify Logic & Targets
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
                // ATTACK
                if (unit.currentCooldown <= 0) {
                    unit.currentCooldown = unit.maxCooldown;
                    
                    const damage = Math.max(10, unit.currentStats.atk - (target.currentStats.def * 0.05));
                    target.currentStats.hp -= damage;
                    if (target.currentStats.hp <= 0) {
                        target.isDead = true;
                    }

                    // DETERMINE VISUAL EFFECT
                    let vfxType: EffectData['type'] = 'bullet';
                    if (unit.templateId === 'heavy_tank') vfxType = 'missile';
                    if (unit.templateId === 'sniper') vfxType = 'laser';
                    if (unit.templateId === 'paladin') vfxType = 'magic';
                    if (unit.templateId === 'dark_mage') vfxType = 'dark';
                    if (unit.templateId === 'berserker') vfxType = 'bullet'; 

                    if (unit.templateId !== 'berserker') {
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
                // MOVE
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

      // 2. Resolve Movement & Collision
      nextUnits.forEach((unit, i) => {
          if (unit.isDead) return;

          unit.position[0] += unit.velocity[0];
          unit.position[2] += unit.velocity[2];

          // FIX: Expand boundary to full arena size (ARENA_SIZE represents half-width of coordinate system if 0 is center)
          // Since ARENA_SIZE in constants is 80, the grid is 160x160.
          // Coordinates range from -80 to 80.
          const boundary = ARENA_SIZE - 2; // Leave small buffer
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

      // 3. Check Win Condition
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
    
    // FIX: Relax placement restrictions to allow full map usage, but keep sides separate
    // Center is 0. Negative X is Red, Positive X is Blue.
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
      
      {/* Dynamic Sky and Atmosphere */}
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

      {/* Render Scenery based on terrain */}
      <Scenery terrain={terrain} />

      {/* Invisible Plane for Clicking - Size must match ARENA_SIZE */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={handleGroundClick} visible={false}>
            <planeGeometry args={[ARENA_SIZE * 2, ARENA_SIZE * 2]} />
      </mesh>

      {units.map(unit => (
        <Unit3D key={unit.id} unit={unit} units={units} />
      ))}

      <ProjectileSystem effects={effects} setEffects={setEffects} />
      
      {phase === GamePhase.SETUP && (
          <group position={[0, 0.1, 0]}>
              <mesh position={[-ARENA_SIZE/2, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
                  <planeGeometry args={[ARENA_SIZE, ARENA_SIZE * 2]} />
                  <meshBasicMaterial color="red" opacity={0.05} transparent side={THREE.DoubleSide} />
              </mesh>
               <mesh position={[ARENA_SIZE/2, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
                  <planeGeometry args={[ARENA_SIZE, ARENA_SIZE * 2]} />
                  <meshBasicMaterial color="blue" opacity={0.05} transparent side={THREE.DoubleSide} />
              </mesh>
          </group>
      )}
    </>
  );
};