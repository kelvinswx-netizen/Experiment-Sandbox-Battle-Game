export enum Team {
  RED = 'RED',
  BLUE = 'BLUE'
}

export enum AttackType {
  PHYSICAL = 'PHYSICAL',
  LIGHT_MAGIC = 'LIGHT_MAGIC',
  DARK_MAGIC = 'DARK_MAGIC'
}

export enum GamePhase {
  SETUP = 'SETUP',
  BATTLE = 'BATTLE',
  GAME_OVER = 'GAME_OVER'
}

export enum TerrainType {
  GRASS = 'GRASS',
  DESERT = 'DESERT',
  SNOW = 'SNOW',
  VOLCANIC = 'VOLCANIC'
}

export interface UnitStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  range: number;
  attackSpeed: number; // Attacks per second
  moveSpeed: number;
}

export interface UnitTemplate {
  id: string;
  name: string;
  stats: Omit<UnitStats, 'hp'>; // Base stats without current hp
  cost: number;
  attackType: AttackType;
  color: string;
  height: number;
  width: number;
}

export interface UnitInstance {
  id: string;
  templateId: string;
  team: Team;
  position: [number, number, number];
  velocity: [number, number, number];
  currentStats: UnitStats;
  targetId: string | null;
  lastAttackTime: number;
  isDead: boolean;
  maxCooldown: number;
  currentCooldown: number;
}

export interface Particle {
  id: string;
  position: [number, number, number];
  color: string;
  createdAt: number;
  lifeTime: number;
}