import * as THREE from 'three';
import { AIBoss, AIBossProjectile, AI_DIFFICULTIES } from './aiBoss';
import {
  AIDifficulty,
  AIBossState,
  BattleOutcome,
  Enemy,
  GameMode,
  GameSettings,
  GameStats,
  Particle,
  PowerType,
} from '../types/game';
import { soundManager } from './audio';
import { POWERS } from './powers';

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Player & Controls
  public playerPosition = new THREE.Vector3(0, 1.7, 0);
  public playerVelocity = new THREE.Vector3();
  public pitch = 0;
  public yaw = 0;
  public isLocked = false;
  public keys: Record<string, boolean> = {};

  // Weapon / Hands
  public weaponGroup = new THREE.Group();
  public bladeMesh!: THREE.Mesh;
  public bladeGlowMesh!: THREE.Mesh;
  public bladeLight!: THREE.PointLight;
  public floatingOrbs: THREE.Mesh[] = [];
  public isAttacking = false;
  public attackTime = 0;
  public attackType = 0; // Alternating slash directions
  public slashTrailGroup = new THREE.Group();
  public slashTrailMeshes: THREE.Mesh[] = [];

  // Entities
  public enemies: Enemy[] = [];
  public particles: Particle[] = [];
  public projectiles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    power: PowerType;
    life: number;
    maxLife: number;
    radius: number;
  }[] = [];
  public blackHoles: {
    group: THREE.Group;
    life: number;
    maxLife: number;
    radius: number;
    pullStrength: number;
  }[] = [];

  // Environment
  public starsParticles!: THREE.Points;
  public ambientDustParticles!: THREE.Points;

  // State
  public activePower: PowerType = 'laser';
  public stats: GameStats = {
    score: 0,
    slicedCount: 0,
    combo: 0,
    maxCombo: 0,
    zenEnergy: 50,
    ultimateCharge: 35,
    isZenMode: false,
    level: 1,
  };
  public settings: GameSettings = {
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.35,
    particleDensity: 'high',
    screenShake: true,
    mouseSensitivity: 0.0022,
    fov: 75,
    invertY: false,
  };

  public onStatsUpdate?: (stats: GameStats) => void;
  public onPowerChange?: (power: PowerType) => void;
  public onFloatingText?: (text: string, color: string) => void;
  public onHitFeedback?: () => void;

  // AI Boss Fight Mode
  public gameMode: GameMode = 'zen_endless';
  public aiDifficulty: AIDifficulty = 'medium';
  public aiBoss: AIBoss | null = null;
  public aiBossProjectiles: AIBossProjectile[] = [];
  public playerHp = 100;
  public playerMaxHp = 100;
  public playerInvulnerableTimer = 0;
  public battleOutcome: BattleOutcome = 'in_progress';
  public battleStartTime = 0;

  public onAIBossUpdate?: (state: AIBossState) => void;
  public onPlayerHpUpdate?: (hp: number, maxHp: number) => void;
  public onBattleOutcome?: (
    outcome: BattleOutcome,
    stats: { timeSec: number; combo: number; score: number; difficulty: AIDifficulty }
  ) => void;
  public onPlayerDamagedVisual?: () => void;

  private enemyIdCounter = 0;
  private spawnTimer = 0;
  private spawnInterval = 1.6;
  private comboResetTimer = 0;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private lastTime = performance.now();
  private hitStopTimer = 0;
  private screenShakeAmount = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060714);
    this.scene.fog = new THREE.FogExp2(0x060714, 0.015);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, aspect, 0.1, 1000);
    this.camera.position.copy(this.playerPosition);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupEnvironment();
    this.setupWeapon();
    this.setupEventListeners();

    this.updateWeaponAppearance();
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x1a1c38, 1.2);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.8);
    this.scene.add(hemisphereLight);

    const dirLight = new THREE.DirectionalLight(0xa855f7, 1.5);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);
  }

  private setupEnvironment() {
    // Cyber-Zen Arena Floor
    const floorGeo = new THREE.PlaneGeometry(120, 120, 40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c1e,
      roughness: 0.25,
      metalness: 0.8,
      wireframe: false,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    // Glowing Neon Hex Grid Floor Overlay
    const gridHelper = new THREE.GridHelper(120, 60, 0x00f0ff, 0x3b82f6);
    gridHelper.position.y = 0.02;
    if (!Array.isArray(gridHelper.material)) {
      gridHelper.material.opacity = 0.25;
      gridHelper.material.transparent = true;
    }
    this.scene.add(gridHelper);

    // Outer Sanctuary Floating Monoliths / Obelisks
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 45;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 14 + Math.sin(i * 1.5) * 6;

      const obeliskGeo = new THREE.CylinderGeometry(0.8, 1.8, height, 6);
      const obeliskMat = new THREE.MeshStandardMaterial({
        color: 0x111633,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0x1e1b4b,
        emissiveIntensity: 0.5,
      });
      const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
      obelisk.position.set(x, height / 2, z);
      this.scene.add(obelisk);

      // Glowing crystal crown atop obelisk
      const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
      const crystalMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xa855f7,
        wireframe: true,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(x, height + 2, z);
      this.scene.add(crystal);
    }

    // Starfield particles in the sky
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 80 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45; // upper hemisphere
      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.cos(phi) + 5;
      starPos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const col = new THREE.Color().setHSL(0.55 + Math.random() * 0.3, 0.8, 0.7);
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    this.starsParticles = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsParticles);

    // Ambient floating Zen Stardust / Cherry blossom motes
    const dustCount = 400;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 70;
      dustPos[i * 3 + 1] = Math.random() * 20;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.3,
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.ambientDustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.ambientDustParticles);
  }

  private setupWeapon() {
    // The weapon group is a direct child of the camera for 1st-person view
    this.weaponGroup.position.set(0.38, -0.32, -0.65);
    this.weaponGroup.rotation.set(0.15, -0.35, 0.1);
    this.camera.add(this.weaponGroup);
    this.scene.add(this.camera);

    // Katana / Energy Blade Hilt
    const hiltGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.32, 12);
    const hiltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.9,
    });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.y = -0.16;
    hilt.rotation.x = Math.PI / 2;
    this.weaponGroup.add(hilt);

    // Guard / Tsuba
    const guardGeo = new THREE.BoxGeometry(0.1, 0.02, 0.08);
    const guardMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.95,
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.set(0, 0, -0.01);
    this.weaponGroup.add(guard);

    // Blade core (solid sleek geometric edge)
    const bladeGeo = new THREE.BoxGeometry(0.018, 0.05, 0.95);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
    });
    this.bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    this.bladeMesh.position.set(0, 0.02, -0.48);
    this.weaponGroup.add(this.bladeMesh);

    // Blade Energy Sheath / Outer Glow
    const glowGeo = new THREE.BoxGeometry(0.032, 0.075, 1.02);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      wireframe: true,
    });
    this.bladeGlowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.bladeGlowMesh.position.copy(this.bladeMesh.position);
    this.weaponGroup.add(this.bladeGlowMesh);

    // Point light radiating from weapon
    this.bladeLight = new THREE.PointLight(0x00f0ff, 2.5, 4);
    this.bladeLight.position.set(0, 0, -0.5);
    this.weaponGroup.add(this.bladeLight);

    // Floating orbital power runes / catalyst crystals
    for (let i = 0; i < 3; i++) {
      const orbGeo = new THREE.OctahedronGeometry(0.035, 0);
      const orbMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      this.floatingOrbs.push(orb);
      this.weaponGroup.add(orb);
    }

    // Slash Trail container
    this.scene.add(this.slashTrailGroup);
  }

  public updateWeaponAppearance() {
    const power = POWERS[this.activePower];
    if (!power) return;

    const bladeMat = this.bladeMesh.material as THREE.MeshStandardMaterial;
    bladeMat.emissive.setHex(power.emissiveHex);
    bladeMat.emissiveIntensity = 1.0;

    const glowMat = this.bladeGlowMesh.material as THREE.MeshBasicMaterial;
    glowMat.color.setHex(power.hexColor);

    this.bladeLight.color.setHex(power.lightHex);

    this.floatingOrbs.forEach((orb) => {
      const mat = orb.material as THREE.MeshBasicMaterial;
      mat.color.setHex(power.hexColor);
    });
  }

  public setPower(power: PowerType) {
    if (this.activePower === power) return;
    this.activePower = power;
    this.updateWeaponAppearance();
    soundManager.playSwitchSound(power);
    this.onPowerChange?.(power);

    // Small particle burst around weapon
    this.createWeaponSparks(15);
  }

  public toggleZenMode() {
    this.stats.isZenMode = !this.stats.isZenMode;
    if (this.stats.isZenMode) {
      this.onFloatingText?.('ZEN AKIŞI AKTİF (YAVAŞ ÇEKİM)', '#38bdf8');
    } else {
      this.onFloatingText?.('NORMAL AKIŞ', '#ffffff');
    }
    this.onStatsUpdate?.(this.stats);
  }

  private setupEventListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Power hotkeys 1-5
      if (e.key === '1') this.setPower('laser');
      if (e.key === '2') this.setPower('fire');
      if (e.key === '3') this.setPower('frost');
      if (e.key === '4') this.setPower('lightning');
      if (e.key === '5') this.setPower('void');

      // Zen Slow-Mo Toggle
      if (e.code === 'KeyQ') this.toggleZenMode();

      // Ultimate trigger
      if (e.code === 'KeyE') this.triggerUltimate();

      // Space jump / dash
      if (e.code === 'Space') {
        this.dash();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse Look & Attack
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', () => {
      soundManager.init();
      if (!this.isLocked) {
        canvas.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === canvas;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      if (this.isLocked) {
        this.yaw -= e.movementX * this.settings.mouseSensitivity;
        const pitchDelta = e.movementY * this.settings.mouseSensitivity * (this.settings.invertY ? -1 : 1);
        this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch - pitchDelta));
      }
    });

    // Mouse Click Attack
    canvas.addEventListener('mousedown', (e) => {
      soundManager.init();
      if (e.button === 0) {
        // Left click: Primary Power Attack / Slice
        this.attack();
      } else if (e.button === 2) {
        // Right click: Ultimate
        e.preventDefault();
        this.triggerUltimate();
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  public onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Fallback touch / drag rotation for iframe or mobile
  public handleDragLook(deltaX: number, deltaY: number) {
    this.yaw -= deltaX * this.settings.mouseSensitivity * 1.5;
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch - deltaY * this.settings.mouseSensitivity * 1.5));
  }

  public setGameMode(mode: GameMode, difficulty: AIDifficulty = this.aiDifficulty) {
    this.gameMode = mode;
    this.aiDifficulty = difficulty;

    if (mode === 'ai_duel') {
      this.resetAIDuel(difficulty);
    } else {
      this.clearAIDuel();
      this.onFloatingText?.('SONSUZ ZEN DALGALARI MODU AKTİF', '#00f0ff');
    }
  }

  public resetAIDuel(difficulty: AIDifficulty = this.aiDifficulty) {
    this.gameMode = 'ai_duel';
    this.aiDifficulty = difficulty;
    this.battleOutcome = 'in_progress';
    this.battleStartTime = performance.now();
    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.playerInvulnerableTimer = 0;
    this.stats.combo = 0;
    this.onPlayerHpUpdate?.(this.playerHp, this.playerMaxHp);
    this.onStatsUpdate?.(this.stats);

    // Clear standard enemies
    this.enemies.forEach((e) => {
      this.scene.remove(e.mesh);
    });
    this.enemies = [];

    // Clear previous boss if exists
    this.clearAIDuel();

    // Spawn new AI Boss
    this.aiBoss = new AIBoss(difficulty);
    this.scene.add(this.aiBoss.group);
    this.scene.add(this.aiBoss.telegraphRing);

    this.aiBoss.onAttackLaunch = (proj) => {
      this.scene.add(proj.mesh);
      this.aiBossProjectiles.push(proj);
    };

    this.aiBoss.onPlaySound = (sound) => {
      if (sound === 'boss_telegraph') {
        soundManager.playBossTelegraphSound();
      } else if (sound === 'boss_shield') {
        soundManager.playBossShieldSound();
      } else if (sound === 'dash') {
        soundManager.playDashSound();
      } else if (sound === 'shield_break') {
        soundManager.playHitSound('lightning', 8);
      } else {
        soundManager.playShootSound(sound as PowerType);
      }
    };

    this.aiBoss.onDialogue = (dialogue) => {
      this.onFloatingText?.(`NEXUS: "${dialogue}"`, '#c084fc');
    };

    this.aiBoss.onSpecialVisual = (type, pos, color) => {
      if (type === 'shockwave') {
        this.createShockwave(pos, color, 14);
      } else if (type === 'afterimage') {
        this.createBurstParticles(pos, color, 14, 'spark');
      }
    };

    this.onAIBossUpdate?.(this.aiBoss.state);
    const diffConfig = AI_DIFFICULTIES[difficulty];
    this.onFloatingText?.(`⚔️ DÜELLO BAŞLADI: NEXUS PRIME [${diffConfig.name.toUpperCase()}]`, '#f43f5e');
  }

  public clearAIDuel() {
    if (this.aiBoss) {
      this.scene.remove(this.aiBoss.group);
      this.scene.remove(this.aiBoss.telegraphRing);
      this.aiBoss.destroy();
      this.aiBoss = null;
    }
    this.aiBossProjectiles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      if (Array.isArray(p.mesh.material)) {
        p.mesh.material.forEach((m) => m.dispose());
      } else {
        p.mesh.material.dispose();
      }
    });
    this.aiBossProjectiles = [];
  }

  public damageAIBoss(baseDamage: number, power: PowerType) {
    if (!this.aiBoss || this.aiBoss.state.state === 'defeated' || this.battleOutcome !== 'in_progress') return;

    // Calculate combo multiplier
    const comboMult = 1.0 + Math.min(2.0, this.stats.combo * 0.08);
    const finalDamage = Math.round(baseDamage * comboMult);

    const result = this.aiBoss.takeDamage(finalDamage);

    if (result.shieldAbsorbed) {
      this.onFloatingText?.('🛡️ KALKAN YUTTU', '#38bdf8');
      this.screenShakeAmount = Math.min(0.2, this.screenShakeAmount + 0.05);
      this.createBurstParticles(this.aiBoss.group.position, 0x38bdf8, 12, 'spark');
      soundManager.playHitSound('lightning', 5);
      this.onAIBossUpdate?.(this.aiBoss.state);
      return;
    }

    // Direct boss hit
    this.stats.combo++;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
    this.stats.score += 250 * Math.max(1, this.stats.combo);
    this.stats.ultimateCharge = Math.min(100, this.stats.ultimateCharge + 10);
    this.comboResetTimer = 4.0;
    this.onStatsUpdate?.(this.stats);

    this.triggerHitFeedback();
    this.screenShakeAmount = Math.min(0.3, this.screenShakeAmount + 0.1);
    this.createBurstParticles(this.aiBoss.group.position, POWERS[power].hexColor, 20, 'spark');
    soundManager.playHitSound(power, this.stats.combo);

    this.onFloatingText?.(`-${finalDamage}`, POWERS[power].color);
    this.onAIBossUpdate?.(this.aiBoss.state);

    if (result.defeated) {
      this.battleOutcome = 'victory';
      soundManager.playVictoryFanfare();
      this.createShockwave(this.aiBoss.group.position, 0x00f0ff, 35);
      this.createBurstParticles(this.aiBoss.group.position, 0xffd700, 60, 'shard');
      this.createBurstParticles(this.aiBoss.group.position, 0x00f0ff, 60, 'spark');

      const elapsedSec = Math.round((performance.now() - this.battleStartTime) / 1000);
      this.onBattleOutcome?.('victory', {
        timeSec: elapsedSec,
        combo: this.stats.maxCombo,
        score: this.stats.score,
        difficulty: this.aiDifficulty,
      });
      this.onFloatingText?.('🏆 ZAFER! YAPAY ZEKA MAĞLUP EDİLDİ!', '#22c55e');
    }
  }

  private updateAIBossBattle(delta: number) {
    if (this.gameMode !== 'ai_duel' || !this.aiBoss) return;

    // Update Boss state
    this.aiBoss.update(delta, this.playerPosition);
    this.onAIBossUpdate?.(this.aiBoss.state);

    if (this.playerInvulnerableTimer > 0) {
      this.playerInvulnerableTimer -= delta;
    }

    // Update Boss Projectiles
    for (let i = this.aiBossProjectiles.length - 1; i >= 0; i--) {
      const p = this.aiBossProjectiles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Check collision with player
      const distToPlayer = p.mesh.position.distanceTo(this.playerPosition);
      let hitPlayer = false;

      if (distToPlayer <= p.radius + 0.9) {
        hitPlayer = true;
        if (this.playerInvulnerableTimer <= 0 && this.battleOutcome === 'in_progress') {
          this.playerHp = Math.max(0, this.playerHp - p.damage);
          this.playerInvulnerableTimer = 0.65;
          this.screenShakeAmount = Math.min(0.4, this.screenShakeAmount + 0.25);
          soundManager.playPlayerHurtSound();
          this.onPlayerDamagedVisual?.();
          this.onPlayerHpUpdate?.(this.playerHp, this.playerMaxHp);

          this.onFloatingText?.(`-${Math.round(p.damage)} HP`, '#ef4444');

          if (this.playerHp <= 0) {
            this.battleOutcome = 'defeat';
            soundManager.playDefeatSound();
            const elapsedSec = Math.round((performance.now() - this.battleStartTime) / 1000);
            this.onBattleOutcome?.('defeat', {
              timeSec: elapsedSec,
              combo: this.stats.maxCombo,
              score: this.stats.score,
              difficulty: this.aiDifficulty,
            });
            this.onFloatingText?.('MAĞLUBİYET! SİBERNETİK ZEKA KAZANDI', '#ef4444');
          }
        }
      }

      if (hitPlayer || p.life >= p.maxLife) {
        this.createBurstParticles(p.mesh.position, POWERS[p.power].hexColor, 12, 'spark');
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        this.aiBossProjectiles.splice(i, 1);
      }
    }
  }

  public dash() {
    soundManager.playDashSound();
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    forward.y = 0;
    forward.normalize();

    this.playerVelocity.addScaledVector(forward, 16);

    // Dash particle ring
    this.createShockwave(this.playerPosition, 0x38bdf8, 4);
    this.onFloatingText?.('HIZLI SIÇRAMA!', '#38bdf8');
  }

  public attack() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackTime = 0;
    this.attackType = (this.attackType + 1) % 3;

    soundManager.playSlashSound(this.activePower);

    // Create visual slash arc in 3D world in front of camera
    this.createSlashWaveEffect();

    // Process hit logic depending on active power
    this.executePowerMechanic();
  }

  private executePowerMechanic() {
    const power = POWERS[this.activePower];

    if (this.activePower === 'laser') {
      // Direct Laser Cleave: Slices everything in a forward arc immediately
      this.checkSliceHit(4.2, 0.75, power.damage);
    } else if (this.activePower === 'fire') {
      // Fireball / Solar flare projectile shot forward
      this.launchProjectile('fire', 28, 180, 2.5);
      this.checkSliceHit(3.0, 0.8, power.damage * 0.7);
    } else if (this.activePower === 'frost') {
      // Frost Shards / Freeze burst
      this.launchProjectile('frost', 32, 120, 2.0);
      this.checkSliceHit(3.5, 0.8, power.damage);
    } else if (this.activePower === 'lightning') {
      // Chain Lightning: Instantly arcs between multiple nearby targets
      this.executeChainLightning();
    } else if (this.activePower === 'void') {
      // Micro Gravity Singularity
      this.createBlackHole(this.playerPosition.clone().add(this.getCameraForward().multiplyScalar(7)), 8, 2.8);
      this.checkSliceHit(3.5, 0.8, power.damage);
    }
  }

  private getCameraForward(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    return forward;
  }

  private launchProjectile(power: PowerType, speed: number, damage: number, radius: number) {
    const geo = new THREE.SphereGeometry(radius * 0.25, 12, 12);
    const color = POWERS[power].hexColor;
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: power === 'frost',
    });
    const mesh = new THREE.Mesh(geo, mat);

    const spawnPos = this.camera.position.clone().add(this.getCameraForward().multiplyScalar(1.0));
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    const forward = this.getCameraForward();
    this.projectiles.push({
      mesh,
      velocity: forward.multiplyScalar(speed),
      power,
      life: 0,
      maxLife: 2.2,
      radius,
    });
  }

  private createBlackHole(position: THREE.Vector3, radius: number, duration: number) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Dark core sphere
    const coreGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x050510 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Glowing accretion disk
    const diskGeo = new THREE.RingGeometry(0.8, radius * 0.35, 24);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);

    this.scene.add(group);
    this.blackHoles.push({
      group,
      life: 0,
      maxLife: duration,
      radius,
      pullStrength: 12,
    });

    this.onFloatingText?.('KARA DELİK OLUŞTU!', '#818cf8');
  }

  private executeChainLightning() {
    // If in AI Boss Duel mode, zap the boss directly
    if (this.gameMode === 'ai_duel' && this.aiBoss && this.aiBoss.state.state !== 'defeated') {
      const bossPos = this.aiBoss.group.position.clone();
      const prevPos = this.playerPosition.clone().add(new THREE.Vector3(0, -0.2, 0));
      this.createLightningBolt(prevPos, bossPos, 0xc084fc);
      this.damageAIBoss(180, 'lightning');
      this.onFloatingText?.('⚡ ZİNCİRLEME YILDIRIM DARBESİ!', '#c084fc');
      return;
    }

    const forward = this.getCameraForward();
    const range = 18;

    // Find enemies in front of player
    const candidates = this.enemies.filter((e) => {
      if (e.isSliced) return false;
      const toEnemy = e.position.clone().sub(this.playerPosition);
      const dist = toEnemy.length();
      if (dist > range) return false;
      const angle = forward.angleTo(toEnemy);
      return angle < 1.1;
    });

    if (candidates.length === 0) {
      // Just a spark in front
      this.createSlashWaveEffect();
      return;
    }

    // Sort by distance and chain up to 5 enemies
    candidates.sort((a, b) => a.position.distanceTo(this.playerPosition) - b.position.distanceTo(this.playerPosition));
    const targets = candidates.slice(0, 5);

    let prevPos = this.playerPosition.clone().add(new THREE.Vector3(0, -0.2, 0));
    targets.forEach((target, idx) => {
      this.createLightningBolt(prevPos, target.position, 0xc084fc);
      prevPos = target.position.clone();
      this.damageEnemy(target, 140, 'lightning');

      // Delayed chain chime
      setTimeout(() => {
        soundManager.playHitSound('lightning', this.stats.combo + idx);
      }, idx * 60);
    });

    this.onFloatingText?.(`⚡ ${targets.length}x ZİNCİRLEME YILDIRIM!`, '#c084fc');
  }

  private createLightningBolt(start: THREE.Vector3, end: THREE.Vector3, colorHex: number) {
    const points: THREE.Vector3[] = [];
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const alpha = i / segments;
      const pt = new THREE.Vector3().lerpVectors(start, end, alpha);
      if (i > 0 && i < segments) {
        pt.x += (Math.random() - 0.5) * 0.9;
        pt.y += (Math.random() - 0.5) * 0.9;
        pt.z += (Math.random() - 0.5) * 0.9;
      }
      points.push(pt);
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: colorHex,
      linewidth: 2,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    // Fade and remove line after 120ms
    setTimeout(() => {
      this.scene.remove(line);
      geo.dispose();
      mat.dispose();
    }, 140);
  }

  private checkSliceHit(range: number, spreadAngle: number, damage: number) {
    const forward = this.getCameraForward();
    let hitAny = false;

    // Check AI Boss in AI Duel mode
    if (this.gameMode === 'ai_duel' && this.aiBoss && this.aiBoss.state.state !== 'defeated') {
      const toBoss = this.aiBoss.group.position.clone().sub(this.playerPosition);
      const dist = toBoss.length();
      if (dist <= range + 1.8) {
        const angle = forward.angleTo(toBoss);
        if (angle <= spreadAngle + 0.35) {
          hitAny = true;
          this.damageAIBoss(damage, this.activePower);
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isSliced) continue;

      const toEnemy = enemy.position.clone().sub(this.playerPosition);
      const dist = toEnemy.length();

      if (dist <= range) {
        const angle = forward.angleTo(toEnemy);
        if (angle <= spreadAngle) {
          hitAny = true;
          this.damageEnemy(enemy, damage, this.activePower);
        }
      }
    }

    if (hitAny) {
      this.triggerHitFeedback();
    }
  }

  private damageEnemy(enemy: Enemy, damage: number, power: PowerType) {
    enemy.hp -= damage;

    if (power === 'frost') {
      enemy.isFrozen = true;
      enemy.freezeTimer = 2.5;
      const mat = enemy.bodyMesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(0x7dd3fc);
      mat.emissive.setHex(0x0284c7);
    }

    if (enemy.hp <= 0 && !enemy.isSliced) {
      this.sliceEnemy(enemy, power);
    } else {
      // Hit reaction sparks
      this.createBurstParticles(enemy.position, POWERS[power].hexColor, 12, 'spark');
      soundManager.playHitSound(power, this.stats.combo);
    }
  }

  public sliceEnemy(enemy: Enemy, power: PowerType) {
    enemy.isSliced = true;
    enemy.sliceTimer = 0;

    // Increment stats
    this.stats.slicedCount++;
    this.stats.combo++;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
    this.stats.score += 100 * Math.max(1, Math.floor(this.stats.combo / 5));
    this.stats.zenEnergy = Math.min(100, this.stats.zenEnergy + 5);
    this.stats.ultimateCharge = Math.min(100, this.stats.ultimateCharge + 8);
    this.comboResetTimer = 3.5;

    this.onStatsUpdate?.(this.stats);

    // Audio chime with rising pitch
    soundManager.playHitSound(power, this.stats.combo);

    // Screen chromatic ripple / shake
    this.screenShakeAmount = Math.min(0.25, this.screenShakeAmount + 0.08);
    this.hitStopTimer = 0.04; // 40ms micro-pause for visceral impact

    // Floating text praise on combo
    if (this.stats.combo > 1 && this.stats.combo % 5 === 0) {
      const compliments = ['MÜKEMMEL!', 'KESKİN!', 'HARİKA!', 'ZEN AKIŞI!', 'KRİSTAL ŞÖLENİ!', 'BOYUT USTASI!'];
      const compliment = compliments[Math.floor(Math.random() * compliments.length)];
      this.onFloatingText?.(`${this.stats.combo}x ${compliment}`, POWERS[power].color);
    }

    // Visual Slicing: Split enemy into two halves that fly apart smoothly!
    this.createBisectedHalves(enemy, power);

    // Abundant Power-Specific Particle Burst
    this.createAbundantShatterEffects(enemy.position, power);

    // Remove main body mesh
    this.scene.remove(enemy.mesh);
  }

  private createBisectedHalves(enemy: Enemy, power: PowerType) {
    const powerConfig = POWERS[power];
    const colorHex = powerConfig.hexColor;

    // Half 1: Upper / Left slice
    const halfGeo1 = new THREE.ConeGeometry(enemy.radius, enemy.radius * 1.5, 5);
    const halfMat1 = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: colorHex,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85,
    });
    const half1 = new THREE.Mesh(halfGeo1, halfMat1);
    half1.position.copy(enemy.position);

    // Half 2: Lower / Right slice
    const halfGeo2 = new THREE.ConeGeometry(enemy.radius, enemy.radius * 1.5, 5);
    const halfMat2 = halfMat1.clone();
    const half2 = new THREE.Mesh(halfGeo2, halfMat2);
    half2.position.copy(enemy.position);
    half2.rotation.z = Math.PI;

    this.scene.add(half1);
    this.scene.add(half2);

    enemy.sliceHalves = [half1, half2];

    // Give impulses in opposite directions
    const cutNormal = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 0.8 + 0.5,
      (Math.random() - 0.5) * 2
    ).normalize();

    const speed = 4.5;
    const vel1 = cutNormal.clone().multiplyScalar(speed);
    const vel2 = cutNormal.clone().multiplyScalar(-speed);

    // Animate the halves dissolving into stardust over 1.2s
    let t = 0;
    const interval = setInterval(() => {
      t += 0.03;
      half1.position.addScaledVector(vel1, 0.03);
      half2.position.addScaledVector(vel2, 0.03);
      half1.rotation.x += 0.08;
      half2.rotation.y += 0.08;

      const scale = Math.max(0, 1 - t / 1.0);
      half1.scale.setScalar(scale);
      half2.scale.setScalar(scale);

      if (t >= 1.0) {
        clearInterval(interval);
        this.scene.remove(half1);
        this.scene.remove(half2);
        halfGeo1.dispose();
        halfGeo2.dispose();
        halfMat1.dispose();
        halfMat2.dispose();
      }
    }, 30);
  }

  private createAbundantShatterEffects(position: THREE.Vector3, power: PowerType) {
    const config = POWERS[power];
    const color = config.hexColor;

    // Density multiplier from settings
    const densityMap = { normal: 1, high: 2, ultra: 3.5 };
    const countMult = densityMap[this.settings.particleDensity] || 2;

    // 1. Expanding Shockwave Ring
    this.createShockwave(position, color, 6);

    // 2. Crystal / Diamond Shards
    this.createBurstParticles(position, color, Math.floor(25 * countMult), 'shard');

    // 3. Sparks and Embers
    this.createBurstParticles(position, config.lightHex, Math.floor(35 * countMult), 'spark');

    // 4. Power special:
    if (power === 'fire') {
      this.createBurstParticles(position, 0xff3b00, 25 * countMult, 'ember');
    } else if (power === 'frost') {
      this.createBurstParticles(position, 0xffffff, 30 * countMult, 'shard');
    } else if (power === 'lightning') {
      this.createBurstParticles(position, 0xe879f9, 20 * countMult, 'lightning');
    } else if (power === 'void') {
      this.createShockwave(position, 0x4f46e5, 9);
    }
  }

  public triggerUltimate() {
    if (this.stats.ultimateCharge < 100) {
      this.onFloatingText?.('ULTİMAT HENÜZ HAZIR DEĞİL (%' + Math.floor(this.stats.ultimateCharge) + ')', '#94a3b8');
      return;
    }

    this.stats.ultimateCharge = 0;
    this.onStatsUpdate?.(this.stats);

    const power = POWERS[this.activePower];
    soundManager.playUltimateSound(this.activePower);

    this.onFloatingText?.(`★ ${power.ultimateName.toUpperCase()}! ★`, power.color);
    this.screenShakeAmount = 0.45;

    // Massive damage to AI Boss if in AI Duel mode
    if (this.gameMode === 'ai_duel' && this.aiBoss && this.aiBoss.state.state !== 'defeated') {
      const bossPos = this.aiBoss.group.position.clone();
      this.createShockwave(bossPos, POWERS[this.activePower].hexColor, 26);
      const ultDamage = this.activePower === 'void' ? 520 : this.activePower === 'fire' ? 480 : 420;
      this.damageAIBoss(ultDamage, this.activePower);
    }

    // Massive cinematic visual execution per power
    if (this.activePower === 'laser') {
      // Omni-Slash / Dimensional Rift: Bisects all visible enemies
      this.enemies.forEach((enemy) => {
        if (!enemy.isSliced) {
          setTimeout(() => {
            this.sliceEnemy(enemy, 'laser');
          }, Math.random() * 300);
        }
      });
      this.createShockwave(this.playerPosition, 0x00f0ff, 25);
    } else if (this.activePower === 'fire') {
      // Supernova: Giant golden dome explosion
      this.createShockwave(this.playerPosition, 0xff6b00, 30);
      this.enemies.forEach((enemy) => {
        if (!enemy.isSliced) {
          this.sliceEnemy(enemy, 'fire');
        }
      });
    } else if (this.activePower === 'frost') {
      // Absolute Zero: Freezes everything and then shatters
      this.enemies.forEach((enemy) => {
        if (!enemy.isSliced) {
          enemy.isFrozen = true;
          setTimeout(() => {
            this.sliceEnemy(enemy, 'frost');
          }, 350 + Math.random() * 200);
        }
      });
      this.createShockwave(this.playerPosition, 0x38bdf8, 25);
    } else if (this.activePower === 'lightning') {
      // Plasma Apocalypse: 8 vertical sky pillars of lightning
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rad = 8 + Math.random() * 10;
        const pos = this.playerPosition.clone().add(new THREE.Vector3(Math.cos(angle) * rad, 0, Math.sin(angle) * rad));
        this.createLightningBolt(pos.clone().setY(35), pos.clone().setY(0), 0xc084fc);
        this.createShockwave(pos, 0xc084fc, 8);
      }
      this.enemies.forEach((enemy) => {
        if (!enemy.isSliced) {
          this.sliceEnemy(enemy, 'lightning');
        }
      });
    } else if (this.activePower === 'void') {
      // Chrono Singularity: Giant center vortex
      const center = this.playerPosition.clone().add(this.getCameraForward().multiplyScalar(10));
      this.createBlackHole(center, 22, 5.0);
      this.enemies.forEach((enemy) => {
        if (!enemy.isSliced) {
          setTimeout(() => {
            this.sliceEnemy(enemy, 'void');
          }, 600 + Math.random() * 400);
        }
      });
    }
  }

  private triggerHitFeedback() {
    this.onHitFeedback?.();
  }

  private createSlashWaveEffect() {
    const power = POWERS[this.activePower];
    const arcGeo = new THREE.RingGeometry(0.9, 1.35, 16, 1, 0, Math.PI * 0.85);
    const arcMat = new THREE.MeshBasicMaterial({
      color: power.hexColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const arc = new THREE.Mesh(arcGeo, arcMat);

    // Place arc directly in front of camera
    arc.position.copy(this.camera.position).add(this.getCameraForward().multiplyScalar(1.2));
    arc.rotation.copy(this.camera.rotation);

    // Tilt based on attack variation
    if (this.attackType === 0) {
      arc.rotation.z += 0.45;
    } else if (this.attackType === 1) {
      arc.rotation.z -= 0.65;
    } else {
      arc.rotation.x += 0.3;
    }

    this.slashTrailGroup.add(arc);

    // Fade out and remove
    let t = 0;
    const interval = setInterval(() => {
      t += 0.06;
      arcMat.opacity = Math.max(0, 0.85 - t);
      arc.scale.multiplyScalar(1.04);
      if (t >= 0.85) {
        clearInterval(interval);
        this.slashTrailGroup.remove(arc);
        arcGeo.dispose();
        arcMat.dispose();
      }
    }, 20);
  }

  public createShockwave(position: THREE.Vector3, colorHex: number, maxRadius = 6) {
    const ringGeo = new THREE.RingGeometry(0.2, 0.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position).setY(position.y + 0.1);
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);

    let radius = 0.5;
    const interval = setInterval(() => {
      radius += (maxRadius - radius) * 0.18 + 0.2;
      ring.scale.setScalar(radius);
      ringMat.opacity *= 0.86;

      if (ringMat.opacity <= 0.04) {
        clearInterval(interval);
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    }, 25);
  }

  private createWeaponSparks(count: number) {
    const power = POWERS[this.activePower];
    const weaponWorldPos = new THREE.Vector3();
    this.bladeMesh.getWorldPosition(weaponWorldPos);
    this.createBurstParticles(weaponWorldPos, power.hexColor, count, 'spark');
  }

  private createBurstParticles(origin: THREE.Vector3, colorHex: number, count: number, type: Particle['type']) {
    const col = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      const speed = type === 'shard' ? 6 + Math.random() * 8 : 4 + Math.random() * 6;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(speed);

      this.particles.push({
        position: origin.clone(),
        velocity,
        color: col,
        size: type === 'shard' ? 0.35 : 0.2,
        alpha: 1.0,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.6,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
      });
    }
  }

  // Spawning Enemies
  private spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 25 + Math.random() * 15;
    const x = this.playerPosition.x + Math.cos(angle) * distance;
    const z = this.playerPosition.z + Math.sin(angle) * distance;
    const y = 1.6 + Math.sin(this.enemyIdCounter) * 0.6;

    const types: Enemy['type'][] = ['crystal', 'golem', 'wisp', 'prism'];
    const type = types[Math.floor(Math.random() * types.length)];

    const group = new THREE.Group();
    group.position.set(x, y, z);

    let bodyGeo: THREE.BufferGeometry;
    let radius = 1.0;
    let color = 0x38bdf8;
    let emissive = 0x0284c7;

    if (type === 'crystal') {
      bodyGeo = new THREE.OctahedronGeometry(1.1, 0);
      radius = 1.1;
      color = 0xa855f7;
      emissive = 0x7e22ce;
    } else if (type === 'golem') {
      bodyGeo = new THREE.IcosahedronGeometry(1.3, 0);
      radius = 1.3;
      color = 0x00f0ff;
      emissive = 0x0369a1;
    } else if (type === 'wisp') {
      bodyGeo = new THREE.DodecahedronGeometry(0.85, 0);
      radius = 0.85;
      color = 0xf59e0b;
      emissive = 0xd97706;
    } else {
      bodyGeo = new THREE.TetrahedronGeometry(1.2, 0);
      radius = 1.2;
      color = 0xec4899;
      emissive = 0xbe185d;
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: emissive,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.9,
      wireframe: false,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(bodyMesh);

    // Glowing Wireframe Cage for high-tech aesthetic
    const cageGeo = bodyGeo.clone();
    const cageMat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    cageMesh.scale.setScalar(1.12);
    group.add(cageMesh);

    this.scene.add(group);

    this.enemies.push({
      id: ++this.enemyIdCounter,
      type,
      mesh: group,
      bodyMesh,
      position: group.position,
      velocity: new THREE.Vector3(),
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 1.5
      ),
      hp: 100,
      maxHp: 100,
      speed: 2.2 + Math.random() * 1.5,
      radius,
      isFrozen: false,
      freezeTimer: 0,
      isSliced: false,
      sliceTimer: 0,
      color,
      emissiveColor: emissive,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    const now = performance.now();
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Hit-stop micro-pause
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= delta;
      delta = 0;
    }

    // Zen Mode slow-motion
    if (this.stats.isZenMode) {
      delta *= 0.35;
    }

    delta = Math.min(delta, 0.1); // clamp

    this.update(delta);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    if (delta <= 0) return;

    // Movement & Inputs
    this.updatePlayer(delta);
    this.updateWeaponAnimation(delta);
    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.updateBlackHoles(delta);
    this.updateParticles(delta);

    // Mode specific update: AI Boss battle or endless crystals
    if (this.gameMode === 'ai_duel') {
      this.updateAIBossBattle(delta);
    } else {
      // Spawning logic
      this.spawnTimer += delta;
      if (this.spawnTimer >= this.spawnInterval && this.enemies.length < 24) {
        this.spawnTimer = 0;
        this.spawnEnemy();
      }
    }

    // Combo timer decay
    if (this.stats.combo > 0) {
      this.comboResetTimer -= delta;
      if (this.comboResetTimer <= 0) {
        this.stats.combo = 0;
        this.onStatsUpdate?.(this.stats);
      }
    }

    // Slowly regenerate Zen energy
    this.stats.zenEnergy = Math.min(100, this.stats.zenEnergy + delta * 2);

    // Screen shake decay
    if (this.screenShakeAmount > 0) {
      this.screenShakeAmount = Math.max(0, this.screenShakeAmount - delta * 0.9);
    }
  }

  private updatePlayer(delta: number) {
    // Movement direction from WASD
    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const walkSpeed = 9.0;
      this.playerVelocity.x = moveDir.x * walkSpeed;
      this.playerVelocity.z = moveDir.z * walkSpeed;
    } else {
      this.playerVelocity.x *= 0.82;
      this.playerVelocity.z *= 0.82;
    }

    // Apply velocity
    this.playerPosition.x += this.playerVelocity.x * delta;
    this.playerPosition.z += this.playerVelocity.z * delta;

    // Keep within arena radius 50
    const distFromCenter = Math.hypot(this.playerPosition.x, this.playerPosition.z);
    if (distFromCenter > 50) {
      const angle = Math.atan2(this.playerPosition.z, this.playerPosition.x);
      this.playerPosition.x = Math.cos(angle) * 50;
      this.playerPosition.z = Math.sin(angle) * 50;
    }

    // Update camera orientation
    this.camera.position.copy(this.playerPosition);

    // Apply Screen Shake if enabled
    if (this.settings.screenShake && this.screenShakeAmount > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShakeAmount;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShakeAmount;
      this.camera.position.z += (Math.random() - 0.5) * this.screenShakeAmount;
    }

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  private updateWeaponAnimation(delta: number) {
    // Floating catalytic orbs rotation around weapon
    const time = performance.now() * 0.003;
    this.floatingOrbs.forEach((orb, idx) => {
      const angle = time + (idx * Math.PI * 2) / 3;
      orb.position.set(Math.cos(angle) * 0.12, 0.04 + Math.sin(angle) * 0.12, -0.45);
      orb.rotation.x += 0.05;
      orb.rotation.y += 0.05;
    });

    if (this.isAttacking) {
      this.attackTime += delta * 4.5;
      if (this.attackTime >= 1.0) {
        this.isAttacking = false;
        this.attackTime = 0;
        this.weaponGroup.position.set(0.38, -0.32, -0.65);
        this.weaponGroup.rotation.set(0.15, -0.35, 0.1);
      } else {
        // Slashing arc interpolation
        const progress = Math.sin(this.attackTime * Math.PI);
        if (this.attackType === 0) {
          // Horizontal sweep cut
          this.weaponGroup.position.set(0.38 - progress * 0.8, -0.32 + progress * 0.1, -0.65);
          this.weaponGroup.rotation.set(0.15, -0.35 + progress * 1.6, 0.1 - progress * 0.9);
        } else if (this.attackType === 1) {
          // Diagonal downward cleave
          this.weaponGroup.position.set(0.38 - progress * 0.6, -0.32 - progress * 0.35, -0.65);
          this.weaponGroup.rotation.set(0.15 + progress * 1.4, -0.35 + progress * 0.8, -progress * 1.2);
        } else {
          // Upward thrust / upper cut
          this.weaponGroup.position.set(0.38 - progress * 0.4, -0.32 + progress * 0.5, -0.65);
          this.weaponGroup.rotation.set(0.15 - progress * 1.2, -0.35, progress * 0.8);
        }
      }
    } else {
      // Idle gentle breathing sway
      const breath = Math.sin(performance.now() * 0.002) * 0.015;
      this.weaponGroup.position.y = -0.32 + breath;
      this.weaponGroup.position.x = 0.38 + Math.cos(performance.now() * 0.0015) * 0.01;
    }
  }

  private updateEnemies(delta: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isSliced) {
        // Handled in interval or removed
        this.enemies.splice(i, 1);
        continue;
      }

      // Freeze status
      if (enemy.isFrozen) {
        enemy.freezeTimer -= delta;
        if (enemy.freezeTimer <= 0) {
          enemy.isFrozen = false;
          const mat = enemy.bodyMesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0xffffff);
          mat.emissive.setHex(enemy.emissiveColor);
        }
        continue; // frozen enemies don't move
      }

      // Move smoothly towards player
      const toPlayer = this.playerPosition.clone().sub(enemy.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist > 1.8) {
        toPlayer.normalize();
        enemy.position.addScaledVector(toPlayer, enemy.speed * delta);
      }

      // Bobbing floating height
      enemy.pulsePhase += delta * 2;
      enemy.position.y = 1.6 + Math.sin(enemy.pulsePhase) * 0.45;

      // Rotation
      enemy.mesh.rotation.x += enemy.rotationSpeed.x * delta;
      enemy.mesh.rotation.y += enemy.rotationSpeed.y * delta;
      enemy.mesh.rotation.z += enemy.rotationSpeed.z * delta;
    }
  }

  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Check collision with AI Boss
      let collided = false;
      if (this.gameMode === 'ai_duel' && this.aiBoss && this.aiBoss.state.state !== 'defeated') {
        if (p.mesh.position.distanceTo(this.aiBoss.group.position) <= p.radius + 1.8) {
          collided = true;
          this.damageAIBoss(POWERS[p.power].damage, p.power);
        }
      }

      // Check collision with enemies
      if (!collided) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (enemy.isSliced) continue;

          if (enemy.position.distanceTo(p.mesh.position) <= p.radius + enemy.radius) {
            collided = true;
            this.damageEnemy(enemy, POWERS[p.power].damage, p.power);
            break;
          }
        }
      }

      if (collided || p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateBlackHoles(delta: number) {
    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      bh.life += delta;
      bh.group.rotation.y += delta * 5;

      // Pull nearby enemies into the vortex
      const bhPos = bh.group.position;
      this.enemies.forEach((enemy) => {
        if (enemy.isSliced) return;
        const dist = enemy.position.distanceTo(bhPos);
        if (dist <= bh.radius) {
          const pullDir = bhPos.clone().sub(enemy.position).normalize();
          const force = (1 - dist / bh.radius) * bh.pullStrength * delta;
          enemy.position.addScaledVector(pullDir, force);
        }
      });

      // Also pull AI Boss if close
      if (this.gameMode === 'ai_duel' && this.aiBoss && this.aiBoss.state.state !== 'defeated') {
        const bossDist = this.aiBoss.group.position.distanceTo(bhPos);
        if (bossDist <= bh.radius) {
          const pullDir = bhPos.clone().sub(this.aiBoss.group.position).normalize();
          const force = (1 - bossDist / bh.radius) * (bh.pullStrength * 0.4) * delta;
          this.aiBoss.position.addScaledVector(pullDir, force);
          this.damageAIBoss(15 * delta, 'void');
        }
      }

      if (bh.life >= bh.maxLife) {
        // Final implosive burst
        this.createShockwave(bhPos, 0x818cf8, 12);
        this.scene.remove(bh.group);
        this.blackHoles.splice(i, 1);
      }
    }
  }

  private updateParticles(delta: number) {
    // Ambient dust slow drift
    if (this.ambientDustParticles) {
      this.ambientDustParticles.rotation.y += delta * 0.04;
    }

    // Custom particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += delta;
      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      pt.position.addScaledVector(pt.velocity, delta);
      pt.velocity.y -= delta * 9.8 * 0.6; // gravity
      pt.alpha = 1.0 - pt.life / pt.maxLife;
      pt.rotation += pt.rotSpeed * delta;
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.stop();
    this.clearAIDuel();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
