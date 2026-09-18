import * as THREE from 'three';
import { AIDifficulty, AIDifficultyConfig, AIBossState, PowerType } from '../types/game';
import { POWERS } from './powers';

export const AI_DIFFICULTIES: Record<AIDifficulty, AIDifficultyConfig> = {
  easy: {
    id: 'easy',
    name: 'Acemi',
    turkishName: 'Acemi (Kolay)',
    subtitle: 'Yapay zekanın ilk prototipi. Daha yavaş ve öngörülebilir saldırılar.',
    badgeColor: 'from-emerald-500 to-teal-600',
    bossMaxHp: 800,
    bossSpeed: 3.2,
    attackInterval: 2.8,
    dashCooldown: 6.5,
    powers: ['laser', 'fire'],
    damageMult: 0.6,
    description: 'Yeni başlayanlar için ideal. Rahatça kaçınabilir ve kombolar deneyebilirsiniz.',
  },
  medium: {
    id: 'medium',
    name: 'Savaşçı',
    turkishName: 'Savaşçı (Dengeli)',
    subtitle: 'Taktiksel kaçışlar ve elemental geçişler yapan zeki sibernetik savaşçı.',
    badgeColor: 'from-blue-500 to-cyan-600',
    bossMaxHp: 1600,
    bossSpeed: 4.8,
    attackInterval: 1.9,
    dashCooldown: 4.2,
    powers: ['laser', 'fire', 'frost'],
    damageMult: 1.0,
    description: 'Dengeli meydan okuma. AI güçlerini değiştirir ve zaman zaman hamlelerinizi savuşturur.',
  },
  hard: {
    id: 'hard',
    name: 'Usta',
    turkishName: 'Usta (Zorlu)',
    subtitle: 'Agresif hamleler, elemental kalkan ve ardışık saldırı kombinasyonları.',
    badgeColor: 'from-purple-500 to-pink-600',
    bossMaxHp: 2400,
    bossSpeed: 6.4,
    attackInterval: 1.3,
    dashCooldown: 2.8,
    powers: ['laser', 'fire', 'frost', 'lightning'],
    damageMult: 1.4,
    description: 'Reflekslerinizi sınar. Kalkan açar, arkaya sıçrar ve 4 elementi ardı ardına kullanır.',
  },
  nightmare: {
    id: 'nightmare',
    name: 'Kabus',
    turkishName: 'Kabus (Efsanevi)',
    subtitle: 'Tüm 5 elemente hükmeden, teleport olan ve kara delik açan nihai yapay zeka.',
    badgeColor: 'from-red-600 to-amber-600',
    bossMaxHp: 3600,
    bossSpeed: 8.2,
    attackInterval: 0.9,
    dashCooldown: 1.8,
    powers: ['laser', 'fire', 'frost', 'lightning', 'void'],
    damageMult: 2.0,
    description: 'Aşırı zorlu nihai dövüş. Mükemmel zamanlama ve Zen Akışı gerektirir.',
  },
};

const BOSS_DIALOGUES = {
  intro: [
    'Nihayet karşıma çıktın. Zen enerjini analiz ediyorum...',
    'Sibernetik zeka vs. İnsan refleksleri. Başlayalım!',
    'Veritabanımdaki tüm dövüş algoritmaları aktif!',
  ],
  powerSwitch: {
    laser: 'Kuantum lazer frekansı odaklandı!',
    fire: 'Termal güneş plazması... erimeye hazır ol!',
    frost: 'Sıcaklığın düştüğünü hissediyor musun? Kristal buz!',
    lightning: 'Milyon voltluk plazma arkı hazır!',
    void: 'Kozmik tekillik! Kaçış vektörün yok!',
  },
  phase2: [
    'Kritik hasar eşiği aşıldı! Aşırı hız protokolü başlatılıyor!',
    'Etkileyici... fakat asıl gücümü henüz görmedin!',
  ],
  phase3: [
    'TÜM SİSTEMLER AŞIRI YÜKLENDİ! Nihai protokol devrede!',
    'Bu son hamlemiz olacak!',
  ],
  playerHit: [
    'Algoritmik bir hamleydi!',
    'Reflekslerin yetersiz kalıyor!',
    'Taktiklerim senin hızından üstün!',
  ],
  playerDodged: [
    'Hızlısın... ama bir dahakini kaçıramazsın.',
  ],
  shieldActive: [
    'Elemental kalkan aktif! Darbelerin boşa çıkacak!',
  ],
  defeat: [
    'İmkansız... Zen frekansın... sistemlerimi çökertti...',
  ],
};

export interface AIBossProjectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  power: PowerType;
  life: number;
  maxLife: number;
  radius: number;
  damage: number;
}

export class AIBoss {
  public group = new THREE.Group();
  public difficulty: AIDifficultyConfig;
  public state: AIBossState;
  public position = new THREE.Vector3(0, 2.5, -14);
  public velocity = new THREE.Vector3();

  // Mesh references
  public torsoMesh!: THREE.Mesh;
  public coreMesh!: THREE.Mesh;
  public headMesh!: THREE.Mesh;
  public visorMesh!: THREE.Mesh;
  public haloGroup = new THREE.Group();
  public dualBlades: THREE.Group[] = [];
  public shieldMesh!: THREE.Mesh;
  public telegraphRing!: THREE.Mesh;

  // Timers & AI logic
  private attackTimer = 0;
  private dashTimer = 0;
  private powerSwitchTimer = 0;
  private stateTimer = 0;
  private telegraphTimer = 0;
  private telegraphTarget = new THREE.Vector3();
  private pendingAttackType: 'slash_dash' | 'projectile' | 'nova' | 'barrage' = 'projectile';
  private flashWhiteTimer = 0;
  private floatBob = 0;

  // Callbacks
  public onAttackLaunch?: (proj: AIBossProjectile) => void;
  public onPlaySound?: (sound: string) => void;
  public onDialogue?: (text: string) => void;
  public onSpecialVisual?: (type: string, pos: THREE.Vector3, color: number) => void;

  constructor(difficultyId: AIDifficulty = 'medium') {
    this.difficulty = AI_DIFFICULTIES[difficultyId];
    this.state = {
      hp: this.difficulty.bossMaxHp,
      maxHp: this.difficulty.bossMaxHp,
      phase: 1,
      activePower: this.difficulty.powers[0],
      state: 'idle',
      currentDialogue: BOSS_DIALOGUES.intro[Math.floor(Math.random() * BOSS_DIALOGUES.intro.length)],
      dialogueTimer: 4.0,
      isShieldActive: false,
      shieldHp: 0,
      maxShieldHp: Math.round(this.difficulty.bossMaxHp * 0.3),
    };

    this.buildMesh();
  }

  private buildMesh() {
    this.group.position.copy(this.position);

    // 1. Torso: High-tech angular crystal prism
    const torsoGeo = new THREE.OctahedronGeometry(1.0, 0);
    torsoGeo.scale(0.9, 1.4, 0.7);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0f172a,
      emissiveIntensity: 0.3,
    });
    this.torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    this.group.add(this.torsoMesh);

    // 2. Glowing Core in the chest
    const coreGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: POWERS[this.state.activePower].hexColor,
      transparent: true,
      opacity: 0.95,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.coreMesh.position.set(0, 0.1, 0.2);
    this.group.add(this.coreMesh);

    // 3. Head & Visor
    const headGeo = new THREE.DodecahedronGeometry(0.48, 0);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.set(0, 1.4, 0);
    this.group.add(this.headMesh);

    const visorGeo = new THREE.BoxGeometry(0.45, 0.12, 0.25);
    const visorMat = new THREE.MeshBasicMaterial({
      color: POWERS[this.state.activePower].hexColor,
    });
    this.visorMesh = new THREE.Mesh(visorGeo, visorMat);
    this.visorMesh.position.set(0, 1.4, 0.32);
    this.group.add(this.visorMesh);

    // 4. Floating Halo of angular energy shards
    const haloShardCount = 6;
    for (let i = 0; i < haloShardCount; i++) {
      const angle = (i * Math.PI * 2) / haloShardCount;
      const shardGeo = new THREE.ConeGeometry(0.12, 0.7, 4);
      const shardMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.3,
        emissive: POWERS[this.state.activePower].hexColor,
        emissiveIntensity: 0.4,
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, -0.3);
      shard.rotation.z = angle - Math.PI / 2;
      this.haloGroup.add(shard);
    }
    this.group.add(this.haloGroup);

    // 5. Dual Floating Energy Blades
    [-1.2, 1.2].forEach((xOffset) => {
      const bladeGroup = new THREE.Group();
      bladeGroup.position.set(xOffset, 0.4, 0.5);

      const bladeGeo = new THREE.BoxGeometry(0.08, 1.5, 0.18);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: POWERS[this.state.activePower].hexColor,
        emissiveIntensity: 1.2,
        roughness: 0.1,
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      bladeGroup.add(blade);

      this.dualBlades.push(bladeGroup);
      this.group.add(bladeGroup);
    });

    // 6. Geodesic Elemental Shield Sphere (initially invisible)
    const shieldGeo = new THREE.IcosahedronGeometry(2.3, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: POWERS[this.state.activePower].hexColor,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.group.add(this.shieldMesh);

    // 7. Telegraph Ring on ground
    const ringGeo = new THREE.RingGeometry(0.2, 2.5, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.telegraphRing = new THREE.Mesh(ringGeo, ringMat);
    this.telegraphRing.position.set(0, 0.05, 0);
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    if (this.state.state === 'defeated') {
      this.group.position.y += delta * 0.5;
      this.torsoMesh.rotation.y += delta * 2;
      return;
    }

    // Dialogue timer
    if (this.state.dialogueTimer > 0) {
      this.state.dialogueTimer -= delta;
      if (this.state.dialogueTimer <= 0) {
        this.state.currentDialogue = '';
      }
    }

    // Flash white on hit decay
    if (this.flashWhiteTimer > 0) {
      this.flashWhiteTimer -= delta;
      if (this.flashWhiteTimer <= 0) {
        this.resetMaterialColors();
      }
    }

    // Floating bobbing & halo rotation
    this.floatBob += delta * 2.5;
    this.group.position.y = this.position.y + Math.sin(this.floatBob) * 0.35;
    this.haloGroup.rotation.z += delta * 0.8;

    // Dual blade orbiting sway
    this.dualBlades.forEach((b, idx) => {
      const dir = idx === 0 ? 1 : -1;
      b.rotation.x = Math.sin(this.floatBob + idx) * 0.3;
      b.rotation.y = Math.cos(this.floatBob * 0.8) * 0.4;
      b.position.y = 0.4 + Math.sin(this.floatBob * 1.5 + idx) * 0.15;
    });

    // Face player horizontally
    const lookTarget = new THREE.Vector3(playerPos.x, this.group.position.y, playerPos.z);
    this.group.lookAt(lookTarget);

    // Shield visuals
    if (this.state.isShieldActive) {
      (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(this.floatBob * 4) * 0.15;
      this.shieldMesh.rotation.y += delta * 1.5;
    } else {
      (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.0;
    }

    // Power switching timer (Hard / Nightmare modes switch powers frequently)
    this.powerSwitchTimer += delta;
    const switchInterval = this.difficulty.id === 'nightmare' ? 5.0 : 8.0;
    if (this.powerSwitchTimer >= switchInterval && this.difficulty.powers.length > 1) {
      this.powerSwitchTimer = 0;
      this.switchRandomPower();
    }

    // Phase threshold checks
    const hpRatio = this.state.hp / this.state.maxHp;
    if (this.state.phase === 1 && hpRatio <= 0.66) {
      this.enterPhase(2);
    } else if (this.state.phase === 2 && hpRatio <= 0.33) {
      this.enterPhase(3);
    }

    // Main AI State Machine
    this.updateAIBehavior(delta, playerPos);
  }

  private updateAIBehavior(delta: number, playerPos: THREE.Vector3) {
    this.stateTimer += delta;
    this.attackTimer += delta;
    this.dashTimer += delta;

    const distToPlayer = this.position.distanceTo(playerPos);

    // 1. Telegraph state (warning ring before big strike)
    if (this.state.state === 'telegraph') {
      this.telegraphTimer -= delta;
      const progress = 1 - Math.max(0, this.telegraphTimer) / 0.8;
      (this.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.2 + progress * 0.6;
      this.telegraphRing.scale.set(1 - progress * 0.6, 1 - progress * 0.6, 1);

      if (this.telegraphTimer <= 0) {
        (this.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0;
        this.executePendingAttack(playerPos);
      }
      return;
    }

    // 2. Dash state (burst movement)
    if (this.state.state === 'dash') {
      this.position.addScaledVector(this.velocity, delta);
      this.group.position.x = this.position.x;
      this.group.position.z = this.position.z;
      if (this.stateTimer >= 0.35) {
        this.state.state = 'strafe';
        this.stateTimer = 0;
      }
      return;
    }

    // 3. Tactical Dash decision
    if (this.dashTimer >= this.difficulty.dashCooldown) {
      this.dashTimer = 0;
      this.performTacticalDash(playerPos);
      return;
    }

    // 4. Attack Decision
    const curInterval = this.difficulty.attackInterval * (this.state.phase === 3 ? 0.65 : this.state.phase === 2 ? 0.85 : 1.0);
    if (this.attackTimer >= curInterval) {
      this.attackTimer = 0;
      this.planAttack(playerPos, distToPlayer);
      return;
    }

    // 5. Default: Strafe & Orbit player within arena
    this.state.state = 'strafe';
    // Orbit around player keeping 8-14m distance
      const desiredDist = 11.0;
      const toPlayer = playerPos.clone().sub(this.position);
      toPlayer.y = 0;
      const currentDist = toPlayer.length();

      const tangent = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
      const strafeDir = tangent.multiplyScalar(Math.sin(this.stateTimer * 0.8) > 0 ? 1 : -1);

      // Radial correction to keep desired distance
      const radialDir = toPlayer.clone().normalize();
      if (currentDist < desiredDist - 2) {
        radialDir.negate(); // back off
      } else if (currentDist > desiredDist + 3) {
        // move closer
      } else {
        radialDir.set(0, 0, 0);
      }

      const moveDir = strafeDir.add(radialDir.multiplyScalar(0.7)).normalize();
      const speed = this.difficulty.bossSpeed * (this.state.phase === 3 ? 1.3 : 1.0);

      this.position.addScaledVector(moveDir, speed * delta);
      // Arena bounds clamp (-28 to 28)
      this.position.x = THREE.MathUtils.clamp(this.position.x, -26, 26);
      this.position.z = THREE.MathUtils.clamp(this.position.z, -26, 26);

      this.group.position.x = this.position.x;
      this.group.position.z = this.position.z;
  }

  private performTacticalDash(playerPos: THREE.Vector3) {
    this.state.state = 'dash';
    this.stateTimer = 0;

    // Dash either left, right, or behind player depending on difficulty
    const toPlayer = playerPos.clone().sub(this.position).normalize();
    const perp = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
    const side = Math.random() > 0.5 ? 1 : -1;

    const dashSpeed = 26;
    this.velocity = perp.multiplyScalar(side * dashSpeed);

    this.onPlaySound?.('dash');
    this.onSpecialVisual?.('afterimage', this.group.position.clone(), POWERS[this.state.activePower].hexColor);
  }

  private planAttack(playerPos: THREE.Vector3, dist: number) {
    const r = Math.random();

    // In phase 2 or 3, chance to use big telegraphed attack
    if ((this.state.phase >= 2 && r < 0.45) || (this.difficulty.id === 'nightmare' && r < 0.55)) {
      this.state.state = 'telegraph';
      this.telegraphTimer = this.difficulty.id === 'nightmare' ? 0.5 : 0.85;
      this.telegraphTarget.copy(playerPos);
      this.telegraphRing.position.set(playerPos.x, 0.05, playerPos.z);
      this.telegraphRing.scale.set(1, 1, 1);
      (this.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0.4;
      this.pendingAttackType = dist < 7 ? 'slash_dash' : r < 0.7 ? 'barrage' : 'nova';

      this.onPlaySound?.('boss_telegraph');
      return;
    }

    // Otherwise, direct elemental projectile attack
    this.launchElementalAttack(playerPos);
  }

  private executePendingAttack(playerPos: THREE.Vector3) {
    this.state.state = 'strafe';
    const targetPos = this.telegraphTarget.clone();

    if (this.pendingAttackType === 'slash_dash') {
      // Rapid dash forward to target location
      this.position.copy(targetPos);
      this.group.position.x = this.position.x;
      this.group.position.z = this.position.z;
      this.onSpecialVisual?.('shockwave', targetPos, POWERS[this.state.activePower].hexColor);
      this.onPlaySound?.('slash');
      this.sayDialogue('Aşırı hız kesişi!');
    } else if (this.pendingAttackType === 'barrage') {
      // 3 rapid spread projectiles
      [-0.2, 0, 0.2].forEach((offsetAngle) => {
        const dir = playerPos.clone().sub(this.group.position).normalize();
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetAngle);
        this.fireProjectile(dir, 20);
      });
      this.sayDialogue(BOSS_DIALOGUES.powerSwitch[this.state.activePower]);
    } else {
      // Nova burst
      this.onSpecialVisual?.('shockwave', targetPos, 0xff0055);
      this.fireProjectile(playerPos.clone().sub(this.group.position).normalize(), 24);
    }
  }

  private launchElementalAttack(playerPos: THREE.Vector3) {
    const dir = playerPos.clone().sub(this.group.position).normalize();
    this.fireProjectile(dir, 18);
  }

  private fireProjectile(dir: THREE.Vector3, speed: number) {
    const power = this.state.activePower;
    const powerInfo = POWERS[power];

    // Projectile geometry
    const geo = new THREE.SphereGeometry(0.35, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: powerInfo.hexColor,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.group.position).add(new THREE.Vector3(0, 0.2, 0));

    const proj: AIBossProjectile = {
      mesh,
      velocity: dir.multiplyScalar(speed),
      power,
      life: 0,
      maxLife: 3.5,
      radius: 0.5,
      damage: 18 * this.difficulty.damageMult,
    };

    this.onAttackLaunch?.(proj);
    this.onPlaySound?.(power);
  }

  public takeDamage(damage: number): { defeated: boolean; shieldAbsorbed: boolean } {
    if (this.state.state === 'defeated') return { defeated: true, shieldAbsorbed: false };

    this.flashWhiteTimer = 0.12;
    this.setMaterialsWhite();

    // If shield active, damage goes to shield first
    if (this.state.isShieldActive) {
      this.state.shieldHp -= damage;
      if (this.state.shieldHp <= 0) {
        this.state.isShieldActive = false;
        this.state.shieldHp = 0;
        this.onPlaySound?.('shield_break');
        this.sayDialogue('Kalkanım kırıldı!');
        this.onSpecialVisual?.('shockwave', this.group.position.clone(), 0x00f0ff);
      }
      return { defeated: false, shieldAbsorbed: true };
    }

    // Damage HP
    this.state.hp = Math.max(0, this.state.hp - damage);

    if (this.state.hp <= 0) {
      this.state.state = 'defeated';
      this.sayDialogue(BOSS_DIALOGUES.defeat[0]);
      return { defeated: true, shieldAbsorbed: false };
    }

    return { defeated: false, shieldAbsorbed: false };
  }

  private enterPhase(phase: number) {
    this.state.phase = phase;
    // Activate elemental shield on phase transition
    this.state.isShieldActive = true;
    this.state.shieldHp = this.state.maxShieldHp;

    const phaseLines = phase === 2 ? BOSS_DIALOGUES.phase2 : BOSS_DIALOGUES.phase3;
    this.sayDialogue(phaseLines[Math.floor(Math.random() * phaseLines.length)]);
    this.onPlaySound?.('boss_shield');
    this.onSpecialVisual?.('shockwave', this.group.position.clone(), POWERS[this.state.activePower].hexColor);
  }

  public switchRandomPower() {
    const available = this.difficulty.powers;
    const nextPower = available[Math.floor(Math.random() * available.length)];
    this.state.activePower = nextPower;

    const powerInfo = POWERS[nextPower];
    (this.coreMesh.material as THREE.MeshBasicMaterial).color.setHex(powerInfo.hexColor);
    (this.visorMesh.material as THREE.MeshBasicMaterial).color.setHex(powerInfo.hexColor);
    (this.shieldMesh.material as THREE.MeshBasicMaterial).color.setHex(powerInfo.hexColor);

    this.dualBlades.forEach((b) => {
      const mesh = b.children[0] as THREE.Mesh;
      (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(powerInfo.hexColor);
    });

    this.sayDialogue(BOSS_DIALOGUES.powerSwitch[nextPower]);
    this.onPlaySound?.('power_switch');
  }

  private setMaterialsWhite() {
    (this.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
    (this.torsoMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xffffff);
    (this.headMesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
  }

  private resetMaterialColors() {
    (this.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
    (this.torsoMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x0f172a);
    (this.headMesh.material as THREE.MeshStandardMaterial).color.setHex(0x0f172a);
  }

  public sayDialogue(text: string) {
    this.state.currentDialogue = text;
    this.state.dialogueTimer = 3.5;
    this.onDialogue?.(text);
  }

  public destroy() {
    this.group.clear();
  }
}
