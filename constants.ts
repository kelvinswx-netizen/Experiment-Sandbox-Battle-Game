import { AttackType, TerrainType, UnitTemplate } from './types';

export const INITIAL_BUDGET = 5000;
export const ARENA_SIZE = 40;

export const TERRAIN_CONFIG = {
  [TerrainType.GRASS]: { color: '#4ade80', groundColor: '#14532d', accent: '#166534' },
  [TerrainType.DESERT]: { color: '#fde047', groundColor: '#ca8a04', accent: '#854d0e' },
  [TerrainType.SNOW]: { color: '#e2e8f0', groundColor: '#64748b', accent: '#334155' },
  [TerrainType.VOLCANIC]: { color: '#7f1d1d', groundColor: '#450a0a', accent: '#991b1b' },
};

// Cost calculation formula
const calculateCost = (hp: number, atk: number, def: number): number => {
  // Stats are 10x higher now, so we divide by a larger number to keep costs in 10-3000 range
  const rawScore = (hp * 0.2) + (atk * 2.5) + (def * 1.5);
  return Math.floor(Math.min(3000, Math.max(50, rawScore / 10)));
};

export const UNIT_TEMPLATES: UnitTemplate[] = [
  {
    id: 'foot_soldier',
    name: 'Tactical Trooper',
    stats: { maxHp: 8000, atk: 60, def: 200, range: 4, attackSpeed: 1.2, moveSpeed: 4 },
    attackType: AttackType.PHYSICAL,
    color: '#94a3b8',
    height: 1.5,
    width: 0.8,
    cost: 0, 
  },
  {
    id: 'heavy_tank',
    name: 'Titan Mech',
    stats: { maxHp: 50000, atk: 150, def: 1500, range: 6, attackSpeed: 0.5, moveSpeed: 1.5 },
    attackType: AttackType.PHYSICAL,
    color: '#334155',
    height: 2.5,
    width: 2,
    cost: 0,
  },
  {
    id: 'berserker',
    name: 'Crimson Slayer',
    stats: { maxHp: 15000, atk: 400, def: 100, range: 1.5, attackSpeed: 1.8, moveSpeed: 6 },
    attackType: AttackType.PHYSICAL,
    color: '#ef4444',
    height: 1.6,
    width: 1,
    cost: 0,
  },
  {
    id: 'paladin',
    name: 'Solar Guardian',
    stats: { maxHp: 25000, atk: 150, def: 800, range: 3, attackSpeed: 1, moveSpeed: 3.5 },
    attackType: AttackType.LIGHT_MAGIC,
    color: '#facc15',
    height: 1.9,
    width: 1.2,
    cost: 0,
  },
  {
    id: 'dark_mage',
    name: 'Void Sorcerer',
    stats: { maxHp: 6000, atk: 450, def: 50, range: 10, attackSpeed: 0.7, moveSpeed: 3 },
    attackType: AttackType.DARK_MAGIC,
    color: '#7e22ce',
    height: 1.4,
    width: 0.7,
    cost: 0,
  },
  {
    id: 'sniper',
    name: 'Ghost Sniper',
    stats: { maxHp: 9000, atk: 350, def: 150, range: 18, attackSpeed: 0.6, moveSpeed: 5 },
    attackType: AttackType.PHYSICAL,
    color: '#166534',
    height: 1.6,
    width: 0.6,
    cost: 0,
  }
].map(u => ({
  ...u,
  cost: calculateCost(u.stats.maxHp, u.stats.atk, u.stats.def)
}));