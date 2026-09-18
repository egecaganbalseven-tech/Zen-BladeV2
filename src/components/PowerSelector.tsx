import React from 'react';
import { Flame, Orbit, Snowflake, Sword, Zap } from 'lucide-react';
import { POWER_LIST } from '../game/powers';
import { PowerType } from '../types/game';

interface PowerSelectorProps {
  activePower: PowerType;
  onSelectPower: (power: PowerType) => void;
  ultimateCharge: number;
  onTriggerUltimate: () => void;
}

export const PowerSelector: React.FC<PowerSelectorProps> = ({
  activePower,
  onSelectPower,
  ultimateCharge,
  onTriggerUltimate,
}) => {
  const getIcon = (id: PowerType, className = 'w-5 h-5') => {
    switch (id) {
      case 'laser':
        return <Sword className={className} />;
      case 'fire':
        return <Flame className={className} />;
      case 'frost':
        return <Snowflake className={className} />;
      case 'lightning':
        return <Zap className={className} />;
      case 'void':
        return <Orbit className={className} />;
    }
  };

  const isUltimateReady = ultimateCharge >= 100;

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-3">
      {/* Ultimate activation indicator banner if ready */}
      {isUltimateReady && (
        <button
          id="btn-ultimate-trigger"
          onClick={onTriggerUltimate}
          className="group flex cursor-pointer items-center gap-2 rounded-full border border-amber-400/80 bg-amber-950/80 px-5 py-2 text-sm font-semibold tracking-wider text-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.5)] backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-amber-300 hover:bg-amber-900/90 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
          </span>
          <span>ULTİMAT GÜÇ HAZIR!</span>
          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300">
            [E] veya [Sağ Tık]
          </span>
        </button>
      )}

      {/* 5 Powers Dock */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-2 shadow-2xl backdrop-blur-xl">
        {POWER_LIST.map((power) => {
          const isActive = activePower === power.id;

          return (
            <button
              id={`btn-power-${power.id}`}
              key={power.id}
              onClick={() => onSelectPower(power.id)}
              className={`group relative flex cursor-pointer flex-col items-center rounded-xl px-3.5 py-2 transition-all duration-200 ${
                isActive
                  ? 'scale-105 border border-white/30 shadow-lg'
                  : 'border border-transparent opacity-70 hover:scale-100 hover:border-white/10 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                boxShadow: isActive ? `0 0 20px ${power.glowColor}` : 'none',
              }}
              title={`${power.name} - [${power.key}] Tuşu`}
            >
              {/* Elemental Icon */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                style={{
                  color: power.color,
                  backgroundColor: `${power.color}18`,
                  border: `1px solid ${power.color}40`,
                }}
              >
                {getIcon(power.id)}
              </div>

              {/* Title & Hotkey */}
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-200">
                  {power.turkishName}
                </span>
                <span className="flex h-4 w-4 items-center justify-center rounded bg-white/10 text-[10px] font-mono text-slate-400">
                  {power.key}
                </span>
              </div>

              {/* Active glow indicator bar */}
              {isActive && (
                <div
                  className="absolute -bottom-1 h-0.5 w-6 rounded-full"
                  style={{
                    backgroundColor: power.color,
                    boxShadow: `0 0 8px ${power.color}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
