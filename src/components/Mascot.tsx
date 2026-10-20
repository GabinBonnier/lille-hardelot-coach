import React from 'react';

export type MascotMood = 'happy' | 'proud' | 'coaching' | 'riding' | 'warning' | 'celebrating';

interface MascotProps {
  mood?: MascotMood;
  speech?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onBubbleClick?: () => void;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'happy',
  speech,
  size = 'md',
  className = '',
  onBubbleClick
}) => {
  const sizeMap = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36'
  };

  return (
    <div className={`flex items-end gap-3 select-none ${className}`}>
      {/* Visual Mascot character */}
      <div className={`relative flex-shrink-0 ${sizeMap[size]} transition-transform duration-300 hover:scale-105`}>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-md overflow-visible animate-bounce-subtle"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#58cc02" />
              <stop offset="100%" stopColor="#439b02" />
            </linearGradient>
            <linearGradient id="bellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2f7c2" />
            </linearGradient>
            <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9600" />
              <stop offset="100%" stopColor="#e05300" />
            </linearGradient>
            <linearGradient id="glassesGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Cycling Wheels if riding */}
          {mood === 'riding' && (
            <g className="animate-spin" style={{ transformOrigin: '30px 105px', animationDuration: '0.8s' }}>
              <circle cx="30" cy="105" r="14" fill="none" stroke="#334155" strokeWidth="3" />
              <line x1="30" y1="91" x2="30" y2="119" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="16" y1="105" x2="44" y2="105" stroke="#94a3b8" strokeWidth="1.5" />
            </g>
          )}

          {/* Body (Round Duolingo-like owl/bird) */}
          <ellipse cx="60" cy="65" rx="36" ry="34" fill="url(#bodyGrad)" stroke="#3b82f6" strokeWidth="0" />

          {/* Belly */}
          <ellipse cx="60" cy="74" rx="23" ry="20" fill="url(#bellyGrad)" opacity="0.95" />

          {/* Feet */}
          <path d="M 46 98 C 42 104, 38 106, 44 108 C 49 109, 52 105, 52 98 Z" fill="#ff9600" />
          <path d="M 74 98 C 70 104, 66 106, 72 108 C 77 109, 80 105, 80 98 Z" fill="#ff9600" />

          {/* Wings */}
          {mood === 'warning' ? (
            // Hands on head or waving alert
            <>
              <path d="M 28 62 C 16 52, 22 34, 38 42" fill="#58cc02" stroke="#439b02" strokeWidth="3" />
              <path d="M 92 62 C 104 52, 98 34, 82 42" fill="#58cc02" stroke="#439b02" strokeWidth="3" />
            </>
          ) : mood === 'celebrating' ? (
            // Raised arms cheering
            <>
              <path d="M 26 64 C 10 40, 24 20, 36 28 C 30 42, 34 52, 26 64 Z" fill="#58cc02" />
              <path d="M 94 64 C 110 40, 96 20, 84 28 C 90 42, 86 52, 94 64 Z" fill="#58cc02" />
            </>
          ) : mood === 'riding' ? (
            // Hands holding handlebars
            <>
              <path d="M 26 65 Q 12 70 28 80" stroke="#439b02" strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M 90 65 Q 98 75 88 82" stroke="#439b02" strokeWidth="7" strokeLinecap="round" fill="none" />
              <circle cx="28" cy="80" r="5" fill="#1e293b" />
            </>
          ) : (
            // Friendly waving wing
            <>
              <path d="M 24 64 C 14 62, 14 78, 26 78 Z" fill="#439b02" />
              <path d="M 94 64 C 108 52, 114 68, 96 76 Z" fill="#439b02" className="animate-wiggle" style={{ transformOrigin: '94px 64px' }} />
            </>
          )}

          {/* Eyes */}
          {mood === 'proud' ? (
            // Cyclist wearing high-tech mirror sunglasses!
            <g>
              <rect x="36" y="47" width="48" height="15" rx="7" fill="url(#glassesGrad)" stroke="#0f172a" strokeWidth="2" />
              <path d="M 39 49 L 55 49" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <path d="M 64 49 L 80 49" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            </g>
          ) : mood === 'warning' ? (
            // Wide surprised eyes
            <g>
              <circle cx="48" cy="54" r="11" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              <circle cx="72" cy="54" r="11" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              <circle cx="48" cy="54" r="5" fill="#0f172a" />
              <circle cx="72" cy="54" r="5" fill="#0f172a" />
              <circle cx="46" cy="52" r="2" fill="#ffffff" />
              <circle cx="70" cy="52" r="2" fill="#ffffff" />
            </g>
          ) : (
            // Big friendly Duolingo eyes
            <g>
              <circle cx="48" cy="54" r="10" fill="#ffffff" />
              <circle cx="72" cy="54" r="10" fill="#ffffff" />
              <circle cx="50" cy="54" r="5.5" fill="#1e293b" />
              <circle cx="74" cy="54" r="5.5" fill="#1e293b" />
              <circle cx="48" cy="52" r="2.2" fill="#ffffff" />
              <circle cx="72" cy="52" r="2.2" fill="#ffffff" />
            </g>
          )}

          {/* Beak */}
          <polygon points="60,63 53,57 67,57" fill="#ff9600" />

          {/* Cheeks blush */}
          <circle cx="36" cy="62" r="5" fill="#f43f5e" opacity="0.3" />
          <circle cx="84" cy="62" r="5" fill="#f43f5e" opacity="0.3" />

          {/* Aerodynamic Cycling Helmet with ventilation slots! */}
          <g>
            <path
              d="M 33 42 C 32 20, 88 20, 87 42 C 78 40, 42 40, 33 42 Z"
              fill="url(#helmetGrad)"
              stroke="#b45309"
              strokeWidth="2"
            />
            {/* Aerovents */}
            <path d="M 44 26 Q 50 34 50 37" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M 60 23 Q 60 32 60 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M 76 26 Q 70 34 70 37" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            {/* Helmet Visor */}
            <path d="M 28 42 L 92 42 L 87 47 L 33 47 Z" fill="#1e293b" />
            {/* Lille-Hardelot mini badge on helmet */}
            <circle cx="60" cy="28" r="4.5" fill="#ffffff" />
            <text x="60" y="30" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#ea580c">LH</text>
          </g>

          {/* Celebrating confetti sparks */}
          {mood === 'celebrating' && (
            <g className="animate-pulse">
              <circle cx="20" cy="20" r="3" fill="#ffc800" />
              <polygon points="100,15 103,22 108,18" fill="#ec4899" />
              <circle cx="108" cy="40" r="3" fill="#06b6d4" />
              <polygon points="12,38 18,36 15,44" fill="#84cc16" />
            </g>
          )}
        </svg>
      </div>

      {/* Duolingo-styled speech bubble */}
      {speech && (
        <div
          onClick={onBubbleClick}
          className="relative max-w-sm md:max-w-md bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 shadow-sm text-slate-800 text-sm md:text-base font-medium transition-all hover:border-duo-green cursor-pointer"
        >
          {/* Triangular pointer tail */}
          <div className="absolute left-[-9px] bottom-3 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-slate-200 border-b-[8px] border-b-transparent">
            <div className="absolute left-[2px] -top-[7px] w-0 h-0 border-t-[7px] border-t-transparent border-r-[9px] border-r-white border-b-[7px] border-b-transparent" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-duo-green text-xs uppercase tracking-wider">Rouli le Coach</span>
          </div>
          <div className="mt-0.5 text-slate-700 leading-relaxed font-sans">{speech}</div>
        </div>
      )}
    </div>
  );
};
