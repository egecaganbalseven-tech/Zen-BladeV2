import React, { useState } from 'react';
import { X, Swords, Infinity as InfinityIcon, ShieldAlert, Zap, Skull, Award } from 'lucide-react';
import { AIDifficulty, GameMode } from '../types/game';
import { AI_DIFFICULTIES } from '../game/aiBoss';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  onSelectMode: (mode: GameMode, difficulty: AIDifficulty) => void;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  currentDifficulty,
  onSelectMode,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(currentMode);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>(currentDifficulty);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectMode(selectedMode, selectedDifficulty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950 p-6 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-extrabold tracking-wide text-cyan-400">
            OYUN MODU & ZORLUK SEÇİMİ
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Rahatlatıcı sonsuz kristal kesme veya taktiksel Yapay Zeka düellosu arasında seçim yapın.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Endless Mode Option */}
          <button
            type="button"
            onClick={() => setSelectedMode('zen_endless')}
            className={`cursor-pointer flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
              selectedMode === 'zen_endless'
                ? 'border-cyan-500 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'border-white/10 bg-slate-900/50 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <InfinityIcon className="h-5 w-5" />
              <span className="font-bold text-sm text-white">Sonsuz Zen Dalgaları</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sonsuz kristal düşmanları dilimleyin, kombo rekoru kırın ve meditatif ASMR ses atmosferinin tadını çıkarın.
            </p>
          </button>

          {/* AI Boss Fight Option */}
          <button
            type="button"
            onClick={() => setSelectedMode('ai_duel')}
            className={`cursor-pointer flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
              selectedMode === 'ai_duel'
                ? 'border-rose-500 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'border-white/10 bg-slate-900/50 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-rose-400">
              <Swords className="h-5 w-5" />
              <span className="font-bold text-sm text-white">Yapay Zeka (AI) Düellosu</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. şahıs bakış açısından özel güçler kullanan akıllı sibernetik boss <strong>NEXUS PRIME</strong>'a karşı 1v1 savaşın!
            </p>
          </button>
        </div>

        {/* Difficulty Selection (if AI Duel is selected) */}
        {selectedMode === 'ai_duel' && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              AI ZORLUK SEVİYESİ SEÇİN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(AI_DIFFICULTIES) as AIDifficulty[]).map((diffKey) => {
                const conf = AI_DIFFICULTIES[diffKey];
                const isSelected = selectedDifficulty === diffKey;

                return (
                  <button
                    key={diffKey}
                    type="button"
                    onClick={() => setSelectedDifficulty(diffKey)}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? `border-white/30 bg-slate-900 shadow-md ring-2 ring-cyan-400/80`
                        : 'border-white/10 bg-slate-900/40 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-block rounded-full bg-gradient-to-r ${conf.badgeColor} px-2.5 py-0.5 text-[11px] font-extrabold text-white`}>
                        {conf.name}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {conf.bossMaxHp} HP
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-200">
                      {conf.subtitle}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {conf.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {conf.powers.map((p) => (
                        <span key={p} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300 uppercase">
                          {p}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/5"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-102 active:scale-98"
          >
            {selectedMode === 'ai_duel' ? 'DÜELLOYU BAŞLAT' : 'ZEN MODUNA GEÇ'}
          </button>
        </div>
      </div>
    </div>
  );
};
