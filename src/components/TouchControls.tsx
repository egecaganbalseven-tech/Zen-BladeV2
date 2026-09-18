import React, { useRef } from 'react';
import { FastForward, Play, Sparkles, Zap } from 'lucide-react';

interface TouchControlsProps {
  onAttack: () => void;
  onUltimate: () => void;
  onDash: () => void;
  onToggleZen: () => void;
  onDragLook: (dx: number, dy: number) => void;
  isUltimateReady: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onAttack,
  onUltimate,
  onDash,
  onToggleZen,
  onDragLook,
  isUltimateReady,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    onDragLook(dx, dy);
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-10 flex flex-col justify-between p-4 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Upper area touch look zone */}
      <div className="flex-1" />

      {/* Bottom action controls */}
      <div className="flex items-end justify-between">
        {/* Left Side: Dash & Zen Flow */}
        <div className="flex flex-col gap-3">
          <button
            id="touch-btn-zen"
            onClick={(e) => {
              e.stopPropagation();
              onToggleZen();
            }}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border border-cyan-400/40 bg-slate-950/70 text-cyan-300 shadow-lg backdrop-blur-md active:scale-90"
            title="Zen Akışı (Zamanı Yavaşlat)"
          >
            <FastForward className="h-6 w-6" />
          </button>

          <button
            id="touch-btn-dash"
            onClick={(e) => {
              e.stopPropagation();
              onDash();
            }}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-slate-950/70 text-white shadow-lg backdrop-blur-md active:scale-90"
            title="Işık Sıçraması (Dash)"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        </div>

        {/* Right Side: Attack & Ultimate */}
        <div className="flex flex-col items-end gap-3">
          {/* Ultimate button */}
          <button
            id="touch-btn-ultimate"
            onClick={(e) => {
              e.stopPropagation();
              onUltimate();
            }}
            className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md transition-all active:scale-90 ${
              isUltimateReady
                ? 'border-amber-400 bg-amber-950/90 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse'
                : 'border-white/10 bg-slate-950/70 text-slate-500'
            }`}
            title="Ultimat Güç"
          >
            <Zap className="h-6 w-6" />
          </button>

          {/* Primary Attack / Slash button */}
          <button
            id="touch-btn-attack"
            onClick={(e) => {
              e.stopPropagation();
              onAttack();
            }}
            className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-3xl border border-cyan-400/60 bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-90"
            title="Güç Kesişi / Saldırı"
          >
            <Play className="h-8 w-8 fill-current ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
