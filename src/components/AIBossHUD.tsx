import React from 'react';
import { Shield, Swords, Heart, Sparkles } from 'lucide-react';
import { AIBossState, AIDifficulty } from '../types/game';
import { AI_DIFFICULTIES } from '../game/aiBoss';
import { POWERS } from '../game/powers';

interface AIBossHUDProps {
  bossState: AIBossState;
  difficulty: AIDifficulty;
  playerHp: number;
  playerMaxHp: number;
  onOpenModeSelector: () => void;
}

export const AIBossHUD: React.FC<AIBossHUDProps> = ({
  bossState,
  difficulty,
  playerHp,
  playerMaxHp,
  onOpenModeSelector,
}) => {
  const diffConfig = AI_DIFFICULTIES[difficulty];
  const hpPercent = Math.max(0, Math.min(100, (bossState.hp / bossState.maxHp) * 100));
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));
  const activePowerConfig = POWERS[bossState.activePower];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-18 z-20 flex flex-col items-center px-4">
      {/* Boss Health & Status Panel */}
      <div className="pointer-events-auto flex w-full max-w-2xl flex-col items-center rounded-2xl border border-rose-500/30 bg-slate-950/80 p-4 shadow-[0_0_25px_rgba(244,63,94,0.15)] backdrop-blur-md transition-all">
        {/* Top: Boss Title, Difficulty Badge, and Power Badge */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              <Swords className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider text-rose-300">
                  NEXUS PRIME
                </span>
                <span className="text-[11px] text-slate-400">
                  • Sibernetik Yapay Zeka
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Evre {bossState.phase} / 3 • {bossState.state.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active AI Power Pill */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold shadow-inner"
              style={{
                backgroundColor: `${activePowerConfig.color}20`,
                borderColor: activePowerConfig.color,
                color: activePowerConfig.color,
              }}
            >
              <span>{activePowerConfig.icon}</span>
              <span className="hidden sm:inline text-[11px]">{activePowerConfig.turkishName}</span>
            </div>

            {/* Difficulty Badge (Clickable to change) */}
            <button
              onClick={onOpenModeSelector}
              title="Zorluk Seviyesini Değiştir"
              className={`cursor-pointer rounded-full bg-gradient-to-r ${diffConfig.badgeColor} px-2.5 py-1 text-[11px] font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95`}
            >
              {diffConfig.name}
            </button>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="mt-3 w-full">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">YAPAY ZEKA ENERJİSİ</span>
            <span className="font-bold text-rose-400">
              {bossState.hp} / {bossState.maxHp} ({Math.round(hpPercent)}%)
            </span>
          </div>
          <div className="relative mt-1 h-3 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900 shadow-inner">
            {/* Phase Dividers */}
            <div className="absolute top-0 bottom-0 left-[33%] w-0.5 bg-white/20 z-10" />
            <div className="absolute top-0 bottom-0 left-[66%] w-0.5 bg-white/20 z-10" />

            {/* Health Bar Fill */}
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] transition-all duration-150"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Shield Bar (if shield active) */}
        {bossState.isShieldActive && (
          <div className="mt-2 w-full animate-fade-in">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-cyan-300">
                <Shield className="h-3 w-3" /> ELEMENTAL KALKAN
              </span>
              <span className="font-mono text-cyan-400">
                {bossState.shieldHp} / {bossState.maxShieldHp}
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-100"
                style={{ width: `${(bossState.shieldHp / bossState.maxShieldHp) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Boss Dialogue taunt / subtitle box */}
        {bossState.currentDialogue && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-1.5 text-xs text-purple-200 backdrop-blur-xs animate-pulse">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-purple-400" />
            <span className="italic font-medium">"{bossState.currentDialogue}"</span>
          </div>
        )}
      </div>

      {/* Player Battle Status Bar (Floating near bottom or directly under boss) */}
      <div className="mt-2 flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/80 px-4 py-1.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <Heart className={`h-4 w-4 ${playerHp <= 30 ? 'text-rose-500 animate-ping' : 'text-rose-400'}`} />
          <span className="text-xs font-semibold text-slate-300">OYUNCU CANI:</span>
        </div>
        <div className="h-2.5 w-36 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              playerHp <= 30
                ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
            }`}
            style={{ width: `${playerHpPercent}%` }}
          />
        </div>
        <span className="font-mono text-xs font-bold text-white">
          {Math.round(playerHp)} / {playerMaxHp}
        </span>
      </div>
    </div>
  );
};
