import React from 'react';
import { FloatingText } from '../types/game';

interface FloatingNotifsProps {
  notifications: FloatingText[];
}

export const FloatingNotifs: React.FC<FloatingNotifsProps> = ({ notifications }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="absolute left-1/2 -translate-x-1/2 transform text-center font-bold tracking-wider drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] transition-all duration-300"
          style={{
            top: `${notif.y}%`,
            color: notif.color,
            opacity: notif.opacity,
            fontSize: '1.25rem',
            textShadow: `0 0 16px ${notif.color}`,
          }}
        >
          {notif.text}
        </div>
      ))}
    </div>
  );
};
