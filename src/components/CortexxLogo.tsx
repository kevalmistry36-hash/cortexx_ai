import React from 'react';

export interface CortexxLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showTagline?: boolean;
  showText?: boolean;
  inverted?: boolean; // For light background/certificate/invoice printing
  mode?: 'light' | 'dark';
  variant?: 'standard' | 'emblem' | 'mobile';
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const CortexxLogo: React.FC<CortexxLogoProps> = ({
  size = 'md',
  showTagline = true,
  showText = true,
  inverted = false,
  mode,
  variant = 'standard',
  layout = 'horizontal',
  className = '',
}) => {
  const isLight = mode === 'light' || inverted;
  const isVertical = layout === 'vertical' || variant === 'emblem';

  const sizeMap = {
    xs: { icon: 26, text: 'text-sm', tag: 'text-[8px]', gap: isVertical ? 'gap-1.5' : 'gap-2' },
    sm: { icon: 36, text: 'text-base', tag: 'text-[9.5px]', gap: isVertical ? 'gap-2' : 'gap-2.5' },
    md: { icon: 46, text: 'text-xl', tag: 'text-[10.5px]', gap: isVertical ? 'gap-2.5' : 'gap-3' },
    lg: { icon: 58, text: 'text-2xl', tag: 'text-xs', gap: isVertical ? 'gap-3' : 'gap-3.5' },
    xl: { icon: 72, text: 'text-3xl', tag: 'text-sm', gap: isVertical ? 'gap-3.5' : 'gap-4' },
    hero: { icon: 92, text: 'text-4xl', tag: 'text-base', gap: isVertical ? 'gap-4' : 'gap-5' },
  };

  const currentSize = sizeMap[size];

  return (
    <div
      className={`${
        isVertical ? 'flex flex-col items-center justify-center text-center' : 'inline-flex items-center'
      } ${currentSize.gap} select-none ${className}`}
    >
      {/* Precision Dual-Brain Circuit Icon matching the exact Cortexx AI logo */}
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
          <radialGradient id="iconBgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#251a14" />
            <stop offset="100%" stopColor="#080706" />
          </radialGradient>

          <linearGradient id="cortexxOrangeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFAA00" />
            <stop offset="50%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#DD3800" />
          </linearGradient>

          <linearGradient id="cortexxDarkCircuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? "#2a221b" : "#241d18"} />
            <stop offset="100%" stopColor={isLight ? "#15110d" : "#0e0c0a"} />
          </linearGradient>

          <linearGradient id="iconFlare" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFAA00" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFE082" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="55%" stopColor="#FFE082" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFAA00" stopOpacity="0" />
          </linearGradient>

          <filter id="cortexxGlowEffect" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Synaptic Glow */}
        <circle cx="50" cy="50" r="42" fill="url(#cortexxOrangeGlow)" opacity={isLight ? 0.22 : 0.2} filter="url(#cortexxGlowEffect)" />

        {/* Outer Radiating Circuit Traces */}
        <g stroke="#FF7700" strokeWidth="1.2" strokeLinecap="round" opacity="0.85">
          <path d="M 43 20 L 40 12 L 35 8" />
          <path d="M 57 20 L 60 12 L 65 8" />
          <path d="M 28 26 L 22 20 L 16 20" />
          <path d="M 72 26 L 78 20 L 84 20" />
          <path d="M 22 42 L 14 42" />
          <path d="M 78 42 L 86 42" />
          <path d="M 22 58 L 15 62 L 12 70" />
          <path d="M 78 58 L 85 62 L 88 70" />
          <path d="M 30 74 L 25 82 L 20 84" />
          <path d="M 70 74 L 75 82 L 80 84" />
          <path d="M 44 82 L 42 90 L 36 94" />
          <path d="M 56 82 L 58 90 L 64 94" />
        </g>

        {/* Outer Circuit Nodes */}
        <g fill="#FFAA00">
          <circle cx="35" cy="8" r="1.8" />
          <circle cx="65" cy="8" r="1.8" />
          <circle cx="16" cy="20" r="1.8" />
          <circle cx="84" cy="20" r="1.8" />
          <circle cx="14" cy="42" r="1.8" />
          <circle cx="86" cy="42" r="1.8" />
          <circle cx="12" cy="70" r="1.8" />
          <circle cx="88" cy="70" r="1.8" />
          <circle cx="20" cy="84" r="1.8" />
          <circle cx="80" cy="84" r="1.8" />
          <circle cx="36" cy="94" r="1.8" />
          <circle cx="64" cy="94" r="1.8" />
        </g>

        {/* LEFT HEMISPHERE - Vibrant Glowing Circuit (Orange) */}
        <g>
          {/* Main left lobes */}
          <path
            d="M 48 20 C 36 20 23 28 23 44 C 23 54 28 62 28 70 C 28 78 37 82 48 82 Z"
            fill="url(#cortexxOrangeGlow)"
            stroke={isLight ? "#ea580c" : "#FFAA00"}
            strokeWidth="1.2"
          />
          {/* Left Brain Circuit Traces */}
          <path d="M 47 27 L 36 27 L 31 33 L 26 33" stroke="#FFF7ED" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 47 38 L 38 38 L 33 44 L 25 44" stroke="#FFF7ED" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 47 50 L 33 50 L 29 56 L 26 64" stroke="#FFF7ED" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 47 62 L 38 62 L 33 68 L 31 75" stroke="#FFF7ED" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 47 73 L 41 73 L 39 77" stroke="#FFF7ED" strokeWidth="1.6" strokeLinecap="round" />

          {/* Glowing synaptic circuit nodes */}
          <circle cx="26" cy="33" r="1.9" fill="#FFFFFF" />
          <circle cx="25" cy="44" r="1.9" fill="#FFFFFF" />
          <circle cx="26" cy="64" r="1.9" fill="#FFFFFF" />
          <circle cx="31" cy="75" r="1.9" fill="#FFFFFF" />
          <circle cx="36" cy="50" r="1.6" fill="#FFE082" />
        </g>

        {/* RIGHT HEMISPHERE - Tech Dark Bronze/Obsidian Circuit */}
        <g>
          {/* Main right lobes */}
          <path
            d="M 52 20 C 64 20 77 28 77 44 C 77 54 72 62 72 70 C 72 78 63 82 52 82 Z"
            fill="url(#cortexxDarkCircuit)"
            stroke={isLight ? "#1c1815" : "#3d3027"}
            strokeWidth="1.2"
          />
          {/* Right Circuit Traces */}
          <path d="M 53 27 L 64 27 L 69 33 L 74 33" stroke="#8c6a4e" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 53 38 L 62 38 L 67 44 L 75 44" stroke="#8c6a4e" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 53 50 L 67 50 L 71 56 L 74 64" stroke="#8c6a4e" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 53 62 L 62 62 L 67 68 L 69 75" stroke="#8c6a4e" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 53 73 L 59 73 L 61 77" stroke="#8c6a4e" strokeWidth="1.5" strokeLinecap="round" />

          {/* Right hemisphere glowing nodes */}
          <circle cx="74" cy="33" r="1.8" fill="#FFAA00" />
          <circle cx="75" cy="44" r="1.8" fill="#FFAA00" />
          <circle cx="74" cy="64" r="1.8" fill="#FFAA00" />
          <circle cx="69" cy="75" r="1.8" fill="#FFAA00" />
        </g>

        {/* Central Fissure Division */}
        <line x1="50" y1="19" x2="50" y2="83" stroke="#0d0b09" strokeWidth="2" />

        {/* Central Radiant Starburst & Lens Flare */}
        <ellipse cx="50" cy="50" rx="36" ry="1.8" fill="url(#iconFlare)" filter="url(#cortexxGlowEffect)" />
        <ellipse cx="50" cy="50" rx="18" ry="1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="50" cy="50" r="4.2" fill="#FFAA00" filter="url(#cortexxGlowEffect)" />
        <circle cx="50" cy="50" r="1.8" fill="#FFFFFF" />
      </svg>

      {/* Brand Wordmark & Tagline */}
      {showText && (
        <div className={`flex flex-col ${isVertical ? 'items-center text-center' : 'text-left'}`}>
          <div className={`font-black tracking-tight leading-none ${currentSize.text}`}>
            <span className={isLight ? 'text-black font-black' : 'text-neutral-100 font-extrabold'}>
              Cortexx
            </span>{' '}
            <span className={isLight ? 'text-black font-black' : 'text-[#FF6A00] font-black drop-shadow-sm'}>
              AI
            </span>
          </div>
          {showTagline && (
            <span
              className={`font-bold tracking-[0.18em] uppercase mt-1 leading-none ${currentSize.tag} ${
                isLight ? 'text-neutral-900 font-extrabold' : 'text-neutral-400 font-semibold'
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
