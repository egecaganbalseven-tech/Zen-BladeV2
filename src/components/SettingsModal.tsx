import React from 'react';
import { Sliders, Sparkles, Volume2, X } from 'lucide-react';
import { GameSettings } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Oyun ve Efekt Ayarları</h2>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Settings */}
        <div className="mt-4 space-y-5">
          {/* Audio Section */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Volume2 className="h-4 w-4" /> Ses ve Müzik
            </h3>

            <div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Ana Ses Düzeyi</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                id="input-master-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>ASMR Efekt Sesleri (Kesiş & Kristal)</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                id="input-sfx-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Rahatlatıcı Zen Fon Müziği (432Hz Drone)</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                id="input-music-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Visual Effects Section */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-4 w-4" /> Görsel Efektler & Performans
            </h3>

            <div>
              <label className="text-xs text-slate-300">Parçacık Yoğunluğu (Boll Efekt)</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {(['normal', 'high', 'ultra'] as const).map((density) => (
                  <button
                    id={`btn-density-${density}`}
                    key={density}
                    onClick={() => onUpdateSettings({ particleDensity: density })}
                    className={`cursor-pointer rounded-xl border py-2 text-xs font-semibold transition-all ${
                      settings.particleDensity === density
                        ? 'border-amber-400 bg-amber-950/60 text-amber-200'
                        : 'border-white/10 bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {density === 'normal' ? 'Normal' : density === 'high' ? 'Bol Efekt' : 'Ultra ASMR'}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Shake Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-200">Vurma & Kesiş Titremesi</p>
                <p className="text-[10px] text-slate-400">Kesişlerde tatmin edici hafif ekran titreşimi</p>
              </div>
              <button
                id="btn-toggle-screen-shake"
                onClick={() => onUpdateSettings({ screenShake: !settings.screenShake })}
                className={`h-6 w-11 cursor-pointer rounded-full transition-colors relative ${
                  settings.screenShake ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.screenShake ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Mouse Sensitivity */}
            <div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Fare / Kamera Hassasiyeti</span>
                <span>{Math.round(settings.mouseSensitivity * 10000) / 10}</span>
              </div>
              <input
                id="input-mouse-sensitivity"
                type="range"
                min="0.001"
                max="0.005"
                step="0.0005"
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                className="mt-1 w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <button
            id="btn-confirm-settings"
            onClick={onClose}
            className="w-full cursor-pointer rounded-xl bg-cyan-500 py-2.5 text-center text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 active:scale-98"
          >
            Tamam & Oyuna Dön
          </button>
        </div>
      </div>
    </div>
  );
};
