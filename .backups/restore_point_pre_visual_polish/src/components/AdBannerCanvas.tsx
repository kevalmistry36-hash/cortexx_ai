import React, { useRef } from 'react';
import { AdFormat, BannerAdConfig } from '../types';
import { CortexxLogo } from './CortexxLogo';
import { ExternalLink, Award, Sparkles, ArrowRight } from 'lucide-react';
import html2canvas from 'html2canvas';

interface AdBannerCanvasProps {
  format: AdFormat;
  config: BannerAdConfig;
  scale?: number;
  onExport?: (format: AdFormat) => void;
  className?: string;
  id?: string;
}

export const AdBannerCanvas: React.FC<AdBannerCanvasProps> = ({
  format,
  config,
  scale = 1,
  className = '',
  id,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme styling definitions
  const themeStyles = {
    'dark-ember': {
      bg: 'bg-gradient-to-br from-neutral-950 via-[#120a05] to-neutral-950',
      border: 'border-orange-500/40',
      glow: '#FF6A00',
      headlineColor: 'text-neutral-100',
      subColor: 'text-neutral-300',
      badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      ctaBg: 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-900/40 hover:from-orange-500 hover:to-amber-400',
      priceColor: 'text-orange-400',
      invertedLogo: false,
    },
    'pure-dark': {
      bg: 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-black',
      border: 'border-neutral-800',
      glow: '#3B82F6',
      headlineColor: 'text-white',
      subColor: 'text-neutral-400',
      badgeBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
      ctaBg: 'bg-neutral-100 hover:bg-white text-neutral-950 shadow-md',
      priceColor: 'text-neutral-100',
      invertedLogo: false,
    },
    'vibrant-orange': {
      bg: 'bg-gradient-to-br from-orange-600 via-[#FF6A00] to-amber-600',
      border: 'border-amber-400/50',
      glow: '#FFFFFF',
      headlineColor: 'text-white',
      subColor: 'text-orange-100',
      badgeBg: 'bg-black/25 text-white border-white/30',
      ctaBg: 'bg-neutral-950 hover:bg-black text-white shadow-xl',
      priceColor: 'text-white',
      invertedLogo: true,
    },
    'minimal-light': {
      bg: 'bg-gradient-to-br from-white via-neutral-50 to-neutral-100',
      border: 'border-neutral-300',
      glow: '#FF6A00',
      headlineColor: 'text-neutral-950',
      subColor: 'text-neutral-600',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
      ctaBg: 'bg-neutral-900 hover:bg-black text-white shadow-md',
      priceColor: 'text-orange-600',
      invertedLogo: true,
    },
  }[config.theme];

  // Aspect-ratio specific layouts (Leaderboard vs Skyscraper vs Rectangle vs Square vs Story)
  const isLeaderboard = format.width >= 700 && format.height <= 120;
  const isSkyscraper = format.height >= 500 && format.width <= 200;
  const isStory = format.height > format.width && format.height >= 1200;
  const isBillboard = format.width >= 900 && format.height === 250;
  const isSquare = format.width === 1080 && format.height === 1080;
  const isMediumRect = format.width === 300 && format.height === 250;
  const isLargeRect = format.width === 336 && format.height === 280;
  const isLandscapeSocial = format.width === 1200 && format.height === 628;

  return (
    <div
      id={id}
      ref={containerRef}
      style={{
        width: `${format.width}px`,
        height: `${format.height}px`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
      className={`relative overflow-hidden border ${themeStyles.border} ${themeStyles.bg} flex flex-col justify-between font-sans select-none shrink-0 ${className}`}
    >
      {/* Decorative Circuit Traces Background Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`circuit-${format.id}`} width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 10 10 L 40 10 L 40 40 L 70 40 M 40 40 L 40 70 M 70 40 L 80 40"
              fill="none"
              stroke={config.theme === 'minimal-light' ? '#000000' : '#FF6A00'}
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            <circle cx="40" cy="40" r="2.5" fill={config.theme === 'minimal-light' ? '#000000' : '#FFAA00'} />
            <circle cx="70" cy="40" r="2" fill={config.theme === 'minimal-light' ? '#000000' : '#FFAA00'} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#circuit-${format.id})`} />
      </svg>

      {/* -------------------- LEADERBOARD (728x90) -------------------- */}
      {isLeaderboard ? (
        <div className="relative z-10 w-full h-full flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-4 shrink-0">
            {config.showLogo && (
              <CortexxLogo size="sm" showTagline={false} inverted={themeStyles.invertedLogo} />
            )}
            {config.showBadge && (
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                {config.courseBadge}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`text-sm lg:text-base font-extrabold truncate ${themeStyles.headlineColor}`}>
              {config.headline}
            </h4>
            <p className={`text-xs truncate ${themeStyles.subColor} mt-0.5`}>
              {config.subheadline}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {config.showPrice && config.priceTag && (
              <div className="text-right">
                <span className={`text-base font-extrabold font-mono ${themeStyles.priceColor}`}>
                  {config.priceTag}
                </span>
                <span className="block text-[9px] uppercase tracking-wider opacity-70">Enrolling Now</span>
              </div>
            )}
            <button className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-1.5 ${themeStyles.ctaBg}`}>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : isSkyscraper ? (
        /* -------------------- WIDE SKYSCRAPER (160x600) -------------------- */
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            {config.showLogo && (
              <CortexxLogo size="xs" showTagline={false} inverted={themeStyles.invertedLogo} />
            )}
            {config.showBadge && (
              <span className={`mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                {config.courseBadge}
              </span>
            )}
          </div>

          <div className="my-auto space-y-3">
            <h4 className={`text-base font-black leading-tight ${themeStyles.headlineColor}`}>
              {config.headline}
            </h4>
            <p className={`text-xs leading-relaxed ${themeStyles.subColor}`}>
              {config.subheadline}
            </p>
            {config.featureBullets.length > 0 && (
              <div className="space-y-1 text-left text-[11px] text-neutral-300 font-medium pt-2">
                {config.featureBullets.slice(0, 4).map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span className="truncate">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            {config.showPrice && config.priceTag && (
              <div>
                <span className={`text-lg font-extrabold font-mono ${themeStyles.priceColor}`}>
                  {config.priceTag}
                </span>
                <span className="block text-[9px] uppercase tracking-wider opacity-70">100% Online</span>
              </div>
            )}
            <button className={`w-full py-2.5 px-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-transform active:scale-95 flex items-center justify-center gap-1 ${themeStyles.ctaBg}`}>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            {config.showUrl && (
              <span className="block text-[9px] font-mono opacity-60 truncate">
                {config.targetUrl.replace(/^https?:\/\//, '')}
              </span>
            )}
          </div>
        </div>
      ) : isStory ? (
        /* -------------------- STORY / REEL (1080x1920) -------------------- */
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-16 sm:p-20">
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between">
            {config.showLogo && (
              <CortexxLogo size="lg" showTagline={true} inverted={themeStyles.invertedLogo} />
            )}
            {config.showBadge && (
              <span className={`px-6 py-2.5 text-xl font-extrabold rounded-full uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                {config.courseBadge}
              </span>
            )}
          </div>

          {/* Hero Centerpiece */}
          <div className="space-y-8 my-auto">
            <h1 className={`text-6xl sm:text-7xl font-black tracking-tight leading-[1.08] ${themeStyles.headlineColor}`}>
              {config.headline}
            </h1>

            <p className={`text-2xl sm:text-3xl font-medium leading-relaxed max-w-2xl ${themeStyles.subColor}`}>
              {config.subheadline}
            </p>

            {/* Syllabus highlight grid */}
            <div className="grid grid-cols-2 gap-4 pt-6 max-w-2xl">
              {config.featureBullets.slice(0, 6).map((bullet, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-orange-400 shrink-0" />
                  <span className="text-xl font-semibold text-neutral-100">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Story Bottom CTA Card */}
          <div className="p-8 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md flex items-center justify-between gap-8">
            <div>
              {config.showPrice && config.priceTag && (
                <div className="flex items-baseline gap-4">
                  <span className={`text-5xl font-black font-mono ${themeStyles.priceColor}`}>
                    {config.priceTag}
                  </span>
                  <span className="text-xl text-neutral-300 font-medium">All-Inclusive Certification</span>
                </div>
              )}
              {config.showUrl && (
                <div className="text-lg text-neutral-400 font-mono mt-2">
                  Visit: {config.targetUrl.replace(/^https?:\/\//, '')}
                </div>
              )}
            </div>

            <button className={`px-10 py-5 rounded-xl font-black text-2xl uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-3 ${themeStyles.ctaBg}`}>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-7 h-7" />
            </button>
          </div>
        </div>
      ) : isBillboard ? (
        /* -------------------- BILLBOARD (970x250) -------------------- */
        <div className="relative z-10 w-full h-full flex items-center justify-between p-8 gap-8">
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center gap-3">
              {config.showLogo && (
                <CortexxLogo size="sm" showTagline={false} inverted={themeStyles.invertedLogo} />
              )}
              {config.showBadge && (
                <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                  {config.courseBadge}
                </span>
              )}
            </div>

            <h3 className={`text-2xl font-black leading-tight ${themeStyles.headlineColor}`}>
              {config.headline}
            </h3>

            <p className={`text-sm ${themeStyles.subColor} leading-relaxed`}>
              {config.subheadline}
            </p>
          </div>

          {/* Middle feature pills */}
          <div className="hidden sm:flex flex-col gap-2 border-l border-white/10 pl-6 text-xs text-neutral-300">
            {config.featureBullets.slice(0, 4).map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-orange-500 font-bold">✓</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          {/* Right CTA */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            {config.showPrice && config.priceTag && (
              <div className="text-right">
                <span className={`text-3xl font-black font-mono ${themeStyles.priceColor}`}>
                  {config.priceTag}
                </span>
                <span className="block text-xs uppercase tracking-wider opacity-70">100% Online Certification</span>
              </div>
            )}
            <button className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-2 ${themeStyles.ctaBg}`}>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {config.showUrl && (
              <span className="text-xs font-mono opacity-60">
                {config.targetUrl.replace(/^https?:\/\//, '')}
              </span>
            )}
          </div>
        </div>
      ) : isSquare ? (
        /* -------------------- SOCIAL SQUARE (1080x1080) -------------------- */
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-14">
          <div className="flex items-center justify-between">
            {config.showLogo && (
              <CortexxLogo size="lg" showTagline={true} inverted={themeStyles.invertedLogo} />
            )}
            {config.showBadge && (
              <span className={`px-5 py-2 text-lg font-bold rounded-full uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                {config.courseBadge}
              </span>
            )}
          </div>

          <div className="space-y-6 my-auto">
            <h2 className={`text-5xl font-black tracking-tight leading-[1.12] ${themeStyles.headlineColor}`}>
              {config.headline}
            </h2>

            <p className={`text-2xl font-medium leading-relaxed max-w-xl ${themeStyles.subColor}`}>
              {config.subheadline}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4">
              {config.featureBullets.slice(0, 6).map((bullet, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-orange-500 font-bold text-lg">✓</span>
                  <span className="text-base font-medium text-neutral-200">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 flex items-center justify-between">
            <div>
              {config.showPrice && config.priceTag && (
                <div className="flex items-baseline gap-3">
                  <span className={`text-4xl font-extrabold font-mono ${themeStyles.priceColor}`}>
                    {config.priceTag}
                  </span>
                  <span className="text-base text-neutral-400 font-mono">/ Complete 1-Month Program</span>
                </div>
              )}
              {config.showUrl && (
                <div className="text-sm font-mono text-neutral-400 mt-1">
                  {config.targetUrl.replace(/^https?:\/\//, '')}
                </div>
              )}
            </div>

            <button className={`px-8 py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-2.5 ${themeStyles.ctaBg}`}>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : isLandscapeSocial ? (
        /* -------------------- LANDSCAPE SOCIAL (1200x628) -------------------- */
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12">
          <div className="flex items-center justify-between">
            {config.showLogo && (
              <CortexxLogo size="md" showTagline={true} inverted={themeStyles.invertedLogo} />
            )}
            {config.showBadge && (
              <span className={`px-4 py-1.5 text-sm font-bold rounded-full uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                {config.courseBadge}
              </span>
            )}
          </div>

          <div className="grid grid-cols-12 gap-8 my-auto items-center">
            <div className="col-span-8 space-y-4">
              <h2 className={`text-4xl font-black leading-tight ${themeStyles.headlineColor}`}>
                {config.headline}
              </h2>
              <p className={`text-lg leading-relaxed ${themeStyles.subColor}`}>
                {config.subheadline}
              </p>
            </div>

            <div className="col-span-4 space-y-2 border-l border-white/10 pl-6 text-sm text-neutral-300">
              {config.featureBullets.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-orange-500 font-bold">✓</span>
                  <span className="truncate">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              {config.showPrice && config.priceTag && (
                <span className={`text-3xl font-black font-mono ${themeStyles.priceColor}`}>
                  {config.priceTag}
                </span>
              )}
              {config.showUrl && (
                <span className="text-sm font-mono text-neutral-400">
                  {config.targetUrl.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>

            <button className={`px-8 py-3.5 rounded-xl font-bold text-base uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-2 ${themeStyles.ctaBg}`}>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* -------------------- MEDIUM RECTANGLE & LARGE RECTANGLE (300x250, 336x280) -------------------- */
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            {config.showLogo && (
              <CortexxLogo size="xs" showTagline={false} inverted={themeStyles.invertedLogo} />
            )}
            {config.showBadge && (
              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                {config.courseBadge}
              </span>
            )}
          </div>

          <div className="my-auto space-y-1.5">
            <h4 className={`text-sm lg:text-base font-black leading-snug ${themeStyles.headlineColor}`}>
              {config.headline}
            </h4>
            <p className={`text-[11px] leading-relaxed line-clamp-2 ${themeStyles.subColor}`}>
              {config.subheadline}
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div>
              {config.showPrice && config.priceTag && (
                <div className={`text-sm font-extrabold font-mono ${themeStyles.priceColor}`}>
                  {config.priceTag}
                </div>
              )}
              {config.showUrl && (
                <span className="text-[8px] font-mono opacity-50 block truncate max-w-[120px]">
                  {config.targetUrl.replace(/^https?:\/\//, '')}
                </span>
              )}
            </div>

            <button className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-1 ${themeStyles.ctaBg}`}>
              <span>{config.ctaText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
