import React from 'react';
import { POWERS } from '../game/powers';
import { PowerType } from '../types/game';

interface CrosshairProps {
  activePower: PowerType;
  isAttacking: boolean;
  hitFeedback: boolean;
  ultimateReady: boolean;
}

export const Crosshair: React.FC<CrosshairProps> = ({
  activePower,
  isAttacking,
  hitFeedback,
  ultimateReady,
}) => {
  const power = POWERS[activePower];

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Outer subtle ring */}
      <div
        className={`relative flex items-center justify-center rounded-full border transition-all duration-150 ${
          isAttacking ? 'scale-125' : hitFeedback ? 'scale-110' : 'scale-100'
        } ${ultimateReady ? 'animate-pulse' : ''}`}
        style={{
          width: '42px',
          height: '42px',
          borderColor: power.glowColor,
          boxShadow: `0 0 15px ${power.glowColor}`,
        }}
      >
        {/* Top pip */}
        <div
          className="absolute -top-2 h-1.5 w-0.5"
          style={{ backgroundColor: power.color }}
        />
        {/* Bottom pip */}
        <div
          className="absolute -bottom-2 h-1.5 w-0.5"
          style={{ backgroundColor: power.color }}
        />
        {/* Left pip */}
        <div
          className="absolute -left-2 h-0.5 w-1.5"
          style={{ backgroundColor: power.color }}
        />
        {/* Right pip */}
        <div
          className="absolute -right-2 h-0.5 w-1.5"
          style={{ backgroundColor: power.color }}
        />

        {/* Center dot */}
        <div
          className={`h-1.5 w-1.5 rounded-full transition-transform duration-100 ${
            hitFeedback ? 'scale-200 bg-white' : ''
          }`}
          style={{
            backgroundColor: hitFeedback ? '#ffffff' : power.color,
            boxShadow: `0 0 8px ${power.color}`,
          }}
        />
      </div>

      {/* Hit feedback flash ring */}
      {hitFeedback && (
        <div
          className="absolute h-16 w-16 animate-ping rounded-full border border-white opacity-70"
          style={{ borderColor: power.color }}
        />
      )}
    </div>
  );
};
