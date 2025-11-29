import { AttackType, TerrainType, UnitTemplate } from './types';

export const INITIAL_BUDGET = 5000;
export const ARENA_SIZE = 80;

export const TERRAIN_CONFIG = {
  [TerrainType.GRASS]: { color: '#4ade80', groundColor: '#14532d', accent: '#166534' },
  [TerrainType.DESERT]: { color: '#fde047', groundColor: '#ca8a04', accent: '#854d0e' },
  [TerrainType.SNOW]: { color: '#e2e8f0', groundColor: '#64748b', accent: '#334155' },
  [TerrainType.VOLCANIC]: { color: '#7f1d1d', groundColor: '#450a0a', accent: '#991b1b' },
};

// Cost calculation formula
const calculateCost = (hp: number, atk: number, def: number): number => {
  const rawScore = (hp * 0.2) + (atk * 2.5) + (def * 1.5);
  return Math.floor(Math.min(3000, Math.max(50, rawScore / 10)));
};

type TemplateDefinition = Omit<UnitTemplate, 'cost'> & { fixedCost?: number };

const definitions: TemplateDefinition[] = [
  {
    id: 'foot_soldier',
    name: 'Tactical Trooper',
    stats: { maxHp: 8000, atk: 60, def: 200, range: 4, attackSpeed: 1.2, moveSpeed: 4 },
    attackType: AttackType.PHYSICAL,
    color: '#94a3b8',
    height: 1.5,
    width: 0.8,
  },
  {
    id: 'heavy_tank',
    name: 'Titan Mech',
    stats: { maxHp: 50000, atk: 150, def: 1500, range: 6, attackSpeed: 0.5, moveSpeed: 1.5 },
    attackType: AttackType.PHYSICAL,
    color: '#334155',
    height: 2.5,
    width: 2,
  },
  {
    id: 'berserker',
    name: 'Crimson Slayer',
    stats: { maxHp: 15000, atk: 400, def: 100, range: 1.5, attackSpeed: 1.8, moveSpeed: 6 },
    attackType: AttackType.PHYSICAL,
    color: '#ef4444',
    height: 1.6,
    width: 1,
  },
  {
    id: 'paladin',
    name: 'Solar Guardian',
    stats: { maxHp: 25000, atk: 150, def: 800, range: 3, attackSpeed: 1, moveSpeed: 3.5 },
    attackType: AttackType.LIGHT_MAGIC,
    color: '#facc15',
    height: 1.9,
    width: 1.2,
  },
  {
    id: 'dark_mage',
    name: 'Void Sorcerer',
    stats: { maxHp: 6000, atk: 450, def: 50, range: 10, attackSpeed: 0.7, moveSpeed: 3 },
    attackType: AttackType.DARK_MAGIC,
    color: '#7e22ce',
    height: 1.4,
    width: 0.7,
  },
  {
    id: 'sniper',
    name: 'Ghost Sniper',
    stats: { maxHp: 9000, atk: 350, def: 150, range: 18, attackSpeed: 0.6, moveSpeed: 5 },
    attackType: AttackType.PHYSICAL,
    color: '#166534',
    height: 1.6,
    width: 0.6,
  },
  // --- NEW UNITS ---
  {
    id: 'grim_reaper',
    name: 'Grim Reaper',
    stats: { maxHp: 30000, atk: 10000, def: 1500, range: 2.5, attackSpeed: 0.5, moveSpeed: 4 },
    attackType: AttackType.DARK_MAGIC,
    color: '#000000',
    height: 2.5,
    width: 1.2,
    fixedCost: 4000
  },
  {
    id: 'knight',
    name: 'Grand Knight',
    stats: { maxHp: 20000, atk: 8000, def: 2000, range: 3, attackSpeed: 0.8, moveSpeed: 7 },
    attackType: AttackType.PHYSICAL,
    color: '#9ca3af',
    height: 2.2,
    width: 1.5,
    fixedCost: 3800
  },
  {
    id: 'superman',
    name: 'Man of Steel',
    stats: { maxHp: 60000, atk: 15000, def: 1800, range: 15, attackSpeed: 2, moveSpeed: 8 },
    attackType: AttackType.LIGHT_MAGIC,
    color: '#3b82f6',
    height: 2.0,
    width: 1.0,
    fixedCost: 5000
  }
];

export const UNIT_TEMPLATES: UnitTemplate[] = definitions.map(u => ({
  ...u,
  cost: u.fixedCost !== undefined ? u.fixedCost : calculateCost(u.stats.maxHp, u.stats.atk, u.stats.def)
}));