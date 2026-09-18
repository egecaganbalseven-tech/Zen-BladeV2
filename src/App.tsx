/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AIBossHUD } from './components/AIBossHUD';
import { BattleResultModal } from './components/BattleResultModal';
import { Crosshair } from './components/Crosshair';
import { FloatingNotifs } from './components/FloatingNotifs';
import { HelpModal } from './components/HelpModal';
import { ModeSelectorModal } from './components/ModeSelectorModal';
import { PowerSelector } from './components/PowerSelector';
import { SettingsModal } from './components/SettingsModal';
import { StatsBar } from './components/StatsBar';
import { TouchControls } from './components/TouchControls';
import { soundManager } from './game/audio';
import { GameEngine } from './game/engine';
import {
  AIBossState,
  AIDifficulty,
  BattleOutcome,
  FloatingText,
  GameMode,
  GameSettings,
  GameStats,
  PowerType,
} from './types/game';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [activePower, setActivePower] = useState<PowerType>('laser');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    slicedCount: 0,
    combo: 0,
    maxCombo: 0,
    zenEnergy: 50,
    ultimateCharge: 30,
    isZenMode: false,
    level: 1,
  });

  // Game Mode & AI Duel States
  const [gameMode, setGameMode] = useState<GameMode>('zen_endless');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [aiBossState, setAiBossState] = useState<AIBossState | null>(null);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [battleOutcome, setBattleOutcome] = useState<BattleOutcome>('in_progress');
  const [battleStats, setBattleStats] = useState({
    timeSec: 0,
    combo: 0,
    score: 0,
    difficulty: 'medium' as AIDifficulty,
  });
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isDamagedFlash, setIsDamagedFlash] = useState(false);

  const [notifications, setNotifications] = useState<FloatingText[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [hitFeedback, setHitFeedback] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.35,
    particleDensity: 'high',
    screenShake: true,
    mouseSensitivity: 0.0022,
    fov: 75,
    invertY: false,
  });

  useEffect(() => {
    // Detect touch
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }

    if (!containerRef.current) return;

    // Instantiate game engine
    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    // Callbacks
    engine.onStatsUpdate = (newStats) => {
      setStats({ ...newStats });
    };

    engine.onPowerChange = (power) => {
      setActivePower(power);
    };

    engine.onFloatingText = (text, color) => {
      const id = Date.now() + Math.random();
      const notif: FloatingText = {
        id,
        text,
        x: 50,
        y: 35 + Math.random() * 8,
        color,
        opacity: 1,
        life: 0,
      };

      setNotifications((prev) => [...prev.slice(-4), notif]);

      // Animate out
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 1500);
    };

    engine.onHitFeedback = () => {
      setHitFeedback(true);
      setTimeout(() => setHitFeedback(false), 120);
    };

    // AI Battle callbacks
    engine.onAIBossUpdate = (bState) => {
      setAiBossState({ ...bState });
    };

    engine.onPlayerHpUpdate = (hp, maxHp) => {
      setPlayerHp(hp);
      setPlayerMaxHp(maxHp);
    };

    engine.onBattleOutcome = (outcome, bStats) => {
      setBattleOutcome(outcome);
      setBattleStats(bStats);
    };

    engine.onPlayerDamagedVisual = () => {
      setIsDamagedFlash(true);
      setTimeout(() => setIsDamagedFlash(false), 220);
    };

    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleSelectPower = (power: PowerType) => {
    soundManager.init();
    engineRef.current?.setPower(power);
    setActivePower(power);
    setHasStarted(true);
  };

  const handleTriggerUltimate = () => {
    soundManager.init();
    engineRef.current?.triggerUltimate();
    setHasStarted(true);
  };

  const handleAttack = () => {
    soundManager.init();
    setIsAttacking(true);
    engineRef.current?.attack();
    setTimeout(() => setIsAttacking(false), 200);
    setHasStarted(true);
  };

  const handleDash = () => {
    soundManager.init();
    engineRef.current?.dash();
    setHasStarted(true);
  };

  const handleToggleZen = () => {
    soundManager.init();
    engineRef.current?.toggleZenMode();
  };

  const handleSelectMode = (mode: GameMode, difficulty: AIDifficulty) => {
    soundManager.init();
    setGameMode(mode);
    setAiDifficulty(difficulty);
    setBattleOutcome('in_progress');
    setHasStarted(true);
    engineRef.current?.setGameMode(mode, difficulty);
  };

  const handleRestartBattle = () => {
    soundManager.init();
    setBattleOutcome('in_progress');
    engineRef.current?.resetAIDuel(aiDifficulty);
  };

  const handleNextDifficulty = (nextDiff: AIDifficulty) => {
    soundManager.init();
    setAiDifficulty(nextDiff);
    setBattleOutcome('in_progress');
    engineRef.current?.resetAIDuel(nextDiff);
  };

  const handleSwitchToEndless = () => {
    soundManager.init();
    handleSelectMode('zen_endless', aiDifficulty);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      soundManager.setVolumes(0, 0, 0);
    } else {
      soundManager.setVolumes(settings.masterVolume, settings.sfxVolume, settings.musicVolume);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (engineRef.current) {
      engineRef.current.settings = updated;
    }
    if (!isMuted) {
      soundManager.setVolumes(updated.masterVolume, updated.sfxVolume, updated.musicVolume);
    }
  };

  const handleDragLook = (dx: number, dy: number) => {
    engineRef.current?.handleDragLook(dx, dy);
  };

  return (
    <main
      id="zen-blade-app"
      className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans select-none"
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        id="game-viewport"
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair"
      />

      {/* Hit damage red flash vignette */}
      {isDamagedFlash && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-rose-600/30 transition-opacity duration-150" />
      )}

      {/* Low HP constant warning vignette */}
      {gameMode === 'ai_duel' && playerHp <= 30 && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-pulse border-8 border-rose-600/50 shadow-[inset_0_0_80px_rgba(244,63,94,0.4)]" />
      )}

      {/* Crosshair (Reticle) */}
      <Crosshair
        activePower={activePower}
        isAttacking={isAttacking}
        hitFeedback={hitFeedback}
        ultimateReady={stats.ultimateCharge >= 100}
      />

      {/* Floating notifications / combo praise */}
      <FloatingNotifs notifications={notifications} />

      {/* Top HUD Stats Bar */}
      <div className="absolute top-0 right-0 left-0 z-20">
        <StatsBar
          stats={stats}
          isMuted={isMuted}
          gameMode={gameMode}
          aiDifficulty={aiDifficulty}
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onToggleZen={handleToggleZen}
          onOpenModeSelector={() => setIsModeSelectorOpen(true)}
        />
      </div>

      {/* AI Boss Fight HUD (when in AI Duel mode and Boss exists) */}
      {gameMode === 'ai_duel' && aiBossState && (
        <AIBossHUD
          bossState={aiBossState}
          difficulty={aiDifficulty}
          playerHp={playerHp}
          playerMaxHp={playerMaxHp}
          onOpenModeSelector={() => setIsModeSelectorOpen(true)}
        />
      )}

      {/* Bottom HUD: 5 Powers Selector */}
      <div className="absolute right-0 bottom-6 left-0 z-20 flex justify-center">
        <PowerSelector
          activePower={activePower}
          onSelectPower={handleSelectPower}
          ultimateCharge={stats.ultimateCharge}
          onTriggerUltimate={handleTriggerUltimate}
        />
      </div>

      {/* First-time overlay guidance hint */}
      {!hasStarted && (
        <div
          id="welcome-guide-overlay"
          onClick={() => {
            soundManager.init();
            setHasStarted(true);
          }}
          className="absolute inset-0 z-30 flex cursor-pointer items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-500"
        >
          <div className="max-w-lg rounded-2xl border border-white/20 bg-slate-950/95 p-6 text-center text-white shadow-2xl">
            <h2 className="text-2xl font-black tracking-wide text-cyan-400">
              ZEN BLADE: SİBERNETİK SAVAŞ
            </h2>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              1. Şahıs bakış açısından 5 elementel güçle kristal düşmanları dilimleyin veya <strong>Yapay Zeka (AI) Boss</strong>'a karşı 1v1 düello yapın!
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2.5">
                <span className="font-bold text-cyan-300">🎮 Temel Kontroller:</span>
                <p className="text-[11px] text-slate-300 mt-1">Sol Tık: Kesme / Saldırı</p>
                <p className="text-[11px] text-slate-300">Space: Hızlı Sıçrama (Dash)</p>
                <p className="text-[11px] text-slate-300">1-5: Güç Seçimi</p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5">
                <span className="font-bold text-rose-300">⚔️ Özel Taktikler:</span>
                <p className="text-[11px] text-slate-300 mt-1">Q: Zen Akışı (Ağır Çekim)</p>
                <p className="text-[11px] text-slate-300">E / Sağ Tık: Ultimat</p>
                <p className="text-[11px] text-slate-300">Üst Bar: AI Düello Modu</p>
              </div>
            </div>

            <button
              id="btn-start-game"
              className="mt-6 w-full cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-102 active:scale-98"
            >
              OYUNA BAŞLA (TIKLAYIN)
            </button>
          </div>
        </div>
      )}

      {/* Touch controls for mobile / tablet or touchscreens */}
      {isTouchDevice && (
        <TouchControls
          onAttack={handleAttack}
          onUltimate={handleTriggerUltimate}
          onDash={handleDash}
          onToggleZen={handleToggleZen}
          onDragLook={handleDragLook}
          isUltimateReady={stats.ultimateCharge >= 100}
        />
      )}

      {/* Game Mode & AI Difficulty Selector Modal */}
      <ModeSelectorModal
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
        currentMode={gameMode}
        currentDifficulty={aiDifficulty}
        onSelectMode={handleSelectMode}
      />

      {/* Battle Victory / Defeat Outcome Modal */}
      <BattleResultModal
        outcome={battleOutcome}
        stats={battleStats}
        onRestart={handleRestartBattle}
        onNextDifficulty={handleNextDifficulty}
        onSwitchToEndless={handleSwitchToEndless}
        onClose={() => setBattleOutcome('in_progress')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Help / Guide Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </main>
  );
}

