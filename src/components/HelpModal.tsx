import React from 'react';
import { POWER_LIST } from '../game/powers';
import { Flame, Info, Orbit, Snowflake, Sword, X, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getPowerIcon = (id: string) => {
    switch (id) {
      case 'laser': return <Sword className="h-4 w-4 text-cyan-400" />;
      case 'fire': return <Flame className="h-4 w-4 text-amber-500" />;
      case 'frost': return <Snowflake className="h-4 w-4 text-sky-400" />;
      case 'lightning': return <Zap className="h-4 w-4 text-purple-400" />;
      case 'void': return <Orbit className="h-4 w-4 text-indigo-400" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Nasıl Oynanır & 5 Özel Güç</h2>
          </div>
          <button
            id="btn-close-help"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-6 text-sm text-slate-300">
          {/* Controls Table */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Oyun Kontrolleri
            </h3>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900/80 p-3 text-xs">
              <div><span className="font-mono text-cyan-300">[Sol Tık]</span> veya Ekrana Bas</div>
              <div className="text-slate-400">Özel Güç Saldırısı / Kesme</div>
              <div><span className="font-mono text-cyan-300">[Sağ Tık]</span> veya <span className="font-mono text-cyan-300">[E]</span></div>
              <div className="text-slate-400">Ultimat Güç Saldırısı</div>
              <div><span className="font-mono text-cyan-300">[1, 2, 3, 4, 5]</span> Tuşları</div>
              <div className="text-slate-400">5 Farklı Güç Arasında Geçiş</div>
              <div><span className="font-mono text-cyan-300">[W, A, S, D]</span></div>
              <div className="text-slate-400">Hareket Etme / Kayma</div>
              <div><span className="font-mono text-cyan-300">[Boşluk / Space]</span></div>
              <div className="text-slate-400">Hızlı Işık Sıçraması (Dash)</div>
              <div><span className="font-mono text-cyan-300">[Q] Tuşu</span></div>
              <div className="text-slate-400">Zen Akışı (Zamanı Yavaşlatma)</div>
            </div>
          </div>

          {/* 5 Powers Details */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              5 Tür Özel Gücümüz
            </h3>
            <div className="space-y-2.5">
              {POWER_LIST.map((power) => (
                <div
                  key={power.id}
                  className="rounded-xl border border-white/5 bg-slate-900/60 p-3 transition-colors hover:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPowerIcon(power.id)}
                      <span className="font-semibold text-slate-100">{power.name}</span>
                    </div>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      [{power.key}]
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{power.description}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                    <span className="text-amber-400/90 font-medium">★ Ultimat:</span>
                    <span className="text-slate-300">{power.ultimateName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relaxing ASMR Tips */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-200">
            <p className="font-semibold text-cyan-300">💡 Rahatlatıcı Oyun Deneyimi</p>
            <p className="mt-1 text-cyan-200/80">
              Kulaklıklarınızı takın; kestiğiniz her kristal düşman, kombonuza göre armonik pentatonik zil sesleri, derin bas titreşimleri ve ışıldayan parçacık şöleni oluşturur.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <button
            id="btn-understand-help"
            onClick={onClose}
            className="w-full cursor-pointer rounded-xl bg-cyan-500 py-2.5 text-center text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 active:scale-98"
          >
            Anladım, Oyna!
          </button>
        </div>
      </div>
    </div>
  );
};
