import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, ArrowRight, Infinity as InfinityIcon } from 'lucide-react';
import { AIDifficulty, BattleOutcome } from '../types/game';
import { AI_DIFFICULTIES } from '../game/aiBoss';

interface BattleResultModalProps {
  outcome: BattleOutcome;
  stats: {
    timeSec: number;
    combo: number;
    score: number;
    difficulty: AIDifficulty;
  };
  onRestart: () => void;
  onNextDifficulty: (nextDiff: AIDifficulty) => void;
  onSwitchToEndless: () => void;
  onClose: () => void;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  outcome,
  stats,
  onRestart,
  onNextDifficulty,
  onSwitchToEndless,
  onClose,
}) => {
  if (outcome === 'in_progress') return null;

  const isVictory = outcome === 'victory';
  const diffConfig = AI_DIFFICULTIES[stats.difficulty];

  const difficultyOrder: AIDifficulty[] = ['easy', 'medium', 'hard', 'nightmare'];
  const currentIndex = difficultyOrder.indexOf(stats.difficulty);
  const nextDiff = currentIndex < difficultyOrder.length - 1 ? difficultyOrder[currentIndex + 1] : null;

  useEffect(() => {
    if (isVictory) {
      // Confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#38bdf8', '#fbbf24', '#a855f7', '#ec4899'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-950 p-6 text-center text-white shadow-2xl">
        {/* Outcome Header Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
          {isVictory ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Trophy className="h-8 w-8 animate-bounce" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
              <Skull className="h-8 w-8 animate-pulse" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className={`mt-4 text-2xl font-black tracking-wide ${isVictory ? 'text-emerald-400' : 'text-rose-500'}`}>
          {isVictory ? 'ZAFER!' : 'MAĞLUBİYET!'}
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          {isVictory
            ? 'Yapay zeka NEXUS PRIME sistemlerini başarıyla çökerttiniz!'
            : 'Zen frekansınız aşırı yüklendi. Algoritmalara karşı kaçınma ve Zen Akışını kullanın!'}
        </p>

        {/* Difficulty badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
          <span>Seviye:</span>
          <span className={`font-bold text-white bg-gradient-to-r ${diffConfig.badgeColor} px-2 py-0.5 rounded-full text-[10px]`}>
            {diffConfig.name}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-slate-900/60 p-3">
          <div>
            <p className="text-[10px] uppercase text-slate-400">SÜRE</p>
            <p className="font-mono text-base font-bold text-white">{stats.timeSec}s</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">EN İYİ KOMBO</p>
            <p className="font-mono text-base font-bold text-amber-400">{stats.combo}x</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">SKOR</p>
            <p className="font-mono text-base font-bold text-cyan-300">{stats.score.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRestart}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-102 active:scale-98"
          >
            <RotateCcw className="h-4 w-4" />
            TEKRAR SAVAŞ
          </button>

          {isVictory && nextDiff && (
            <button
              type="button"
              onClick={() => onNextDifficulty(nextDiff)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/50 py-2.5 text-xs font-bold text-purple-200 transition-colors hover:bg-purple-900/50"
            >
              <ArrowRight className="h-4 w-4" />
              SONRAKİ ZORLUK SEVİYESİ ({AI_DIFFICULTIES[nextDiff].name})
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchToEndless}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <InfinityIcon className="h-4 w-4 text-cyan-400" />
            SONSUZ ZEN MODUNA DÖN
          </button>
        </div>
      </div>
    </div>
  );
};
