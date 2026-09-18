import React from 'react';
import { HelpCircle, Settings, Swords, Volume2, VolumeX, Zap, Infinity as InfinityIcon } from 'lucide-react';
import { AIDifficulty, GameMode, GameStats } from '../types/game';
import { AI_DIFFICULTIES } from '../game/aiBoss';

interface StatsBarProps {
  stats: GameStats;
  isMuted: boolean;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onToggleZen: () => void;
  onOpenModeSelector: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  isMuted,
  gameMode,
  aiDifficulty,
  onToggleMute,
  onOpenSettings,
  onOpenHelp,
  onToggleZen,
  onOpenModeSelector,
}) => {
  const diffConfig = AI_DIFFICULTIES[aiDifficulty];

  return (
    <header className="pointer-events-auto flex w-full items-center justify-between p-4 text-white">
      {/* Left: App Logo, Mode Switcher & Combo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2 backdrop-blur-md">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-slate-100">
              ZEN BLADE
            </h1>
            <p className="text-[10px] text-cyan-400/80">1. Şahıs Özel Güç Oyunu</p>
          </div>
        </div>

        {/* Mode Selector Quick Toggle Button */}
        <button
          id="btn-open-mode-selector"
          onClick={onOpenModeSelector}
          className={`cursor-pointer flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-md transition-all hover:scale-102 active:scale-98 ${
            gameMode === 'ai_duel'
              ? 'border-rose-500/50 bg-rose-950/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              : 'border-cyan-500/40 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
          }`}
          title="Oyun Modunu ve AI Zorluk Seviyesini Değiştir"
        >
          {gameMode === 'ai_duel' ? (
            <>
              <Swords className="h-3.5 w-3.5 text-rose-400" />
              <span>AI Düello</span>
              <span className={`rounded-full bg-gradient-to-r ${diffConfig.badgeColor} px-1.5 py-0.2 text-[10px] text-white font-bold`}>
                {diffConfig.name}
              </span>
            </>
          ) : (
            <>
              <InfinityIcon className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sonsuz Zen</span>
            </>
          )}
        </button>

        {/* Combo Counter Badge */}
        {stats.combo > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/40 px-3.5 py-2 backdrop-blur-md animate-bounce">
            <span className="text-lg font-black tracking-tight text-amber-400">
              {stats.combo}x
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              KOMBO
            </span>
          </div>
        )}
      </div>

      {/* Center: Score, Sliced Count, Zen Energy & Ultimat Progress */}
      <div className="hidden items-center gap-6 rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-2.5 shadow-xl backdrop-blur-md md:flex">
        {/* Score */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">ZEN SKOR</p>
          <p className="text-base font-bold text-white font-mono">{stats.score.toLocaleString()}</p>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* Sliced Count */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">DİLİMLENEN</p>
          <p className="text-base font-bold text-cyan-300 font-mono">{stats.slicedCount}</p>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* Ultimate Bar */}
        <div className="w-36">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span className="font-semibold text-amber-400">ULTİMAT ŞARJ</span>
            <span className="font-mono">{Math.floor(stats.ultimateCharge)}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-200 ${
                stats.ultimateCharge >= 100
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${stats.ultimateCharge}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Zen Slow-Mo & Controls */}
      <div className="flex items-center gap-2">
        {/* Zen Mode Button */}
        <button
          id="btn-toggle-zen-mode"
          onClick={onToggleZen}
          className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-md transition-all ${
            stats.isZenMode
              ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'border-white/10 bg-slate-950/60 text-slate-300 hover:bg-slate-900/80'
          }`}
          title="Zamanı Yavaşlat (Zen Akışı) - [Q] Tuşu"
        >
          <span className="mr-1">☯</span>
          {stats.isZenMode ? 'Zen Akışı Aktif' : 'Zen Akışı [Q]'}
        </button>

        {/* Sound Mute Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={onToggleMute}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-slate-300 backdrop-blur-md transition-colors hover:bg-slate-900 hover:text-white"
          title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Help / Controls Guide */}
        <button
          id="btn-open-help"
          onClick={onOpenHelp}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-slate-300 backdrop-blur-md transition-colors hover:bg-slate-900 hover:text-white"
          title="Nasıl Oynanır & Kontroller"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Settings Modal */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-slate-300 backdrop-blur-md transition-colors hover:bg-slate-900 hover:text-white"
          title="Ayarlar"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
