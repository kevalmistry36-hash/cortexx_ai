import React from 'react';

interface CortexxLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showTagline?: boolean;
  showText?: boolean;
  inverted?: boolean; // For light invoice printing
  className?: string;
}

export const CortexxLogo: React.FC<CortexxLogoProps> = ({
  size = 'md',
  showTagline = true,
  showText = true,
  inverted = false,
  className = '',
}) => {
  const sizeMap = {
    xs: { icon: 24, text: 'text-sm', tag: 'text-[8px]', gap: 'gap-2' },
    sm: { icon: 32, text: 'text-base', tag: 'text-[9px]', gap: 'gap-2.5' },
    md: { icon: 42, text: 'text-xl', tag: 'text-[10px]', gap: 'gap-3' },
    lg: { icon: 54, text: 'text-2xl', tag: 'text-xs', gap: 'gap-3.5' },
    xl: { icon: 68, text: 'text-3xl', tag: 'text-sm', gap: 'gap-4' },
    hero: { icon: 84, text: 'text-4xl', tag: 'text-base', gap: 'gap-5' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${currentSize.gap} select-none ${className}`}>
      {/* Precision Dual-Brain Circuit Icon */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cortexxOrangeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFAA00" />
            <stop offset="50%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#DD3B00" />
          </linearGradient>

          <linearGradient id="cortexxDarkCircuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={inverted ? "#374151" : "#2E3440"} />
            <stop offset="100%" stopColor={inverted ? "#111827" : "#12141A"} />
          </linearGradient>

          <filter id="cortexxGlowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Synaptic Glow */}
        <circle cx="50" cy="50" r="38" fill="url(#cortexxOrangeGlow)" opacity="0.15" filter="url(#cortexxGlowEffect)" />

        {/* LEFT HEMISPHERE - Vibrant Glowing Circuit (Orange) */}
        <g>
          {/* Main left lobes */}
          <path
            d="M 48 18 C 36 18 20 28 20 44 C 20 54 26 62 26 70 C 26 78 36 84 48 84 Z"
            fill="url(#cortexxOrangeGlow)"
            stroke="#FFE082"
            strokeWidth="0.8"
          />
          {/* Left Brain Circuit Traces */}
          <path d="M 48 26 L 36 26 L 30 32 L 25 32" stroke="#FFF7ED" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 48 38 L 38 38 L 32 44 L 23 44" stroke="#FFF7ED" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 48 50 L 32 50 L 28 56 L 24 64" stroke="#FFF7ED" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 48 62 L 38 62 L 32 68 L 30 76" stroke="#FFF7ED" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 48 74 L 40 74 L 38 78" stroke="#FFF7ED" strokeWidth="1.8" strokeLinecap="round" />

          {/* Glowing synaptic circuit nodes */}
          <circle cx="25" cy="32" r="2.4" fill="#FFFFFF" />
          <circle cx="23" cy="44" r="2.4" fill="#FFFFFF" />
          <circle cx="24" cy="64" r="2.4" fill="#FFFFFF" />
          <circle cx="30" cy="76" r="2.4" fill="#FFFFFF" />
          <circle cx="35" cy="50" r="2" fill="#FFE082" />
        </g>

        {/* RIGHT HEMISPHERE - Tech Dark Obsidian Circuit */}
        <g>
          {/* Main right lobes */}
          <path
            d="M 52 18 C 64 18 80 28 80 44 C 80 54 74 62 74 70 C 74 78 64 84 52 84 Z"
            fill="url(#cortexxDarkCircuit)"
            stroke={inverted ? "#6B7280" : "#4B5563"}
            strokeWidth="0.8"
          />
          {/* Right Circuit Traces */}
          <path d="M 52 26 L 64 26 L 70 32 L 75 32" stroke={inverted ? "#9CA3AF" : "#60A5FA"} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <path d="M 52 38 L 62 38 L 68 44 L 77 44" stroke={inverted ? "#9CA3AF" : "#FF6A00"} strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
          <path d="M 52 50 L 68 50 L 72 56 L 76 64" stroke={inverted ? "#9CA3AF" : "#60A5FA"} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <path d="M 52 62 L 62 62 L 68 68 L 70 76" stroke={inverted ? "#9CA3AF" : "#FF6A00"} strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
          <path d="M 52 74 L 60 74 L 62 78" stroke={inverted ? "#9CA3AF" : "#60A5FA"} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />

          {/* Right hemisphere nodes */}
          <circle cx="75" cy="32" r="2.2" fill={inverted ? "#4B5563" : "#93C5FD"} />
          <circle cx="77" cy="44" r="2.5" fill="#FF8800" />
          <circle cx="76" cy="64" r="2.2" fill={inverted ? "#4B5563" : "#93C5FD"} />
          <circle cx="70" cy="76" r="2.2" fill="#FF8800" />
        </g>

        {/* Central Vertical Synaptic Fissure Burst */}
        <line x1="50" y1="18" x2="50" y2="84" stroke="#FFAA00" strokeWidth="2.5" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="5" fill="#FFFFFF" filter="url(#cortexxGlowEffect)" />
        <circle cx="50" cy="50" r="2.8" fill="#FF6A00" />
      </svg>

      {/* Brand Wordmark & Tagline */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight leading-none ${currentSize.text} cortexx-ai-heading`}>
            <span className={inverted ? 'text-black' : 'text-neutral-100'}>Cortexx</span>{' '}
            <span className={inverted ? 'text-black' : 'text-[#FF6A00] drop-shadow-sm'}>AI</span>
          </div>
          {showTagline && (
            <span
              className={`font-semibold tracking-[0.16em] uppercase mt-1 leading-none ${currentSize.tag} ${
                inverted ? 'text-neutral-700' : 'text-neutral-400'
              }`}
            >
              Where Thinking Meets Technology
            </span>
          )}
        </div>
      )}
    </div>
  );
};
