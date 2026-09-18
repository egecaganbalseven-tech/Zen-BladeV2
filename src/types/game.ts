import * as THREE from 'three';

export type PowerType = 'laser' | 'fire' | 'frost' | 'lightning' | 'void';
export type GameMode = 'zen_endless' | 'ai_duel';
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'nightmare';

export interface AIDifficultyConfig {
  id: AIDifficulty;
  name: string;
  turkishName: string;
  subtitle: string;
  badgeColor: string;
  bossMaxHp: number;
  bossSpeed: number;
  attackInterval: number;
  dashCooldown: number;
  powers: PowerType[];
  damageMult: number;
  description: string;
}

export interface AIBossState {
  hp: number;
  maxHp: number;
  phase: number; // 1, 2, 3
  activePower: PowerType;
  state: 'idle' | 'strafe' | 'chase' | 'telegraph' | 'attack' | 'dash' | 'shield' | 'ultimate' | 'defeated';
  currentDialogue: string;
  dialogueTimer: number;
  isShieldActive: boolean;
  shieldHp: number;
  maxShieldHp: number;
}

export interface PlayerBattleState {
  hp: number;
  maxHp: number;
  isInvulnerable: boolean;
}

export type BattleOutcome = 'in_progress' | 'victory' | 'defeat';

export interface PowerInfo {
  id: PowerType;
  key: string;
  name: string;
  turkishName: string;
  element: string;
  description: string;
  primaryAttackName: string;
  ultimateName: string;
  color: string;
  glowColor: string;
  hexColor: number;
  emissiveHex: number;
  lightHex: number;
  bladeColor: string;
  icon: string;
  cooldownMs: number;
  ultimateCost: number;
  damage: number;
  sliceEffect: string;
}

export interface Enemy {
  id: number;
  type: 'crystal' | 'golem' | 'wisp' | 'prism';
  mesh: THREE.Group;
  bodyMesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  isFrozen: boolean;
  freezeTimer: number;
  isSliced: boolean;
  sliceTimer: number;
  sliceHalves?: [THREE.Mesh, THREE.Mesh];
  color: number;
  emissiveColor: number;
  pulsePhase: number;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'ring' | 'ember' | 'shard' | 'lightning' | 'slash';
  rotation: number;
  rotSpeed: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  life: number;
}

export interface GameStats {
  score: number;
  slicedCount: number;
  combo: number;
  maxCombo: number;
  zenEnergy: number; // 0 to 100
  ultimateCharge: number; // 0 to 100
  isZenMode: boolean;
  level: number;
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  particleDensity: 'normal' | 'high' | 'ultra';
  screenShake: boolean;
  mouseSensitivity: number;
  fov: number;
  invertY: boolean;
}
