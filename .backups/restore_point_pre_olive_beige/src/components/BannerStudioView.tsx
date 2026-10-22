import React, { useState, useRef } from 'react';
import { Course, AdFormat, BannerAdConfig, BannerTheme } from '../types';
import { AD_FORMATS } from '../constants/initialData';
import { AdBannerCanvas } from './AdBannerCanvas';
import { Sparkles, Download, Layers, Eye, RefreshCw, Copy, Check, ExternalLink, Sliders, Monitor } from 'lucide-react';
import html2canvas from 'html2canvas';

interface BannerStudioViewProps {
  courses: Course[];
  initialCourse?: Course | null;
}

export const BannerStudioView: React.FC<BannerStudioViewProps> = ({
  courses,
  initialCourse = null,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourse?.id || courses[0]?.id || 'custom'
  );

  // Creative Configuration
  const [config, setConfig] = useState<BannerAdConfig>({
    headline: 'Master Practical AI in 30 Days',
    subheadline: 'Build real-world agents, automations & generative media without complex code.',
    courseBadge: '1-Month Practical AI',
    featureBullets: [
      '10 Practical Modules',
      'Prompt Engineering',
      'Autonomous AI Agents',
      'AI Image & Video Gen',
      'AI Business Automations',
      'Real-World Live Projects',
    ],
    ctaText: 'Enroll Now',
    targetUrl: 'https://cortexx.ai/courses/practical-ai',
    theme: 'dark-ember',
    priceTag: '₹6,000',
    durationTag: '1 Month',
    showLogo: true,
    showBadge: true,
    showPrice: true,
    showUrl: true,
  });

  const [selectedFormatId, setSelectedFormatId] = useState<string>('iab-med-rect');
  const [viewMode, setViewMode] = useState<'single' | 'all-matrix'>('single');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [customDescription, setCustomDescription] = useState(
    'A 1-month comprehensive practical AI course covering generative AI, prompt engineering, agentic workflows, and automation with live real-world projects.'
  );

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const selectedFormat = AD_FORMATS.find(f => f.id === selectedFormatId) || AD_FORMATS[0];

  // Sync course selection
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (courseId === 'custom') return;

    const course = courses.find(c => c.id === courseId);
    if (course) {
      setConfig(prev => ({
        ...prev,
        headline: `Master ${course.name}`,
        subheadline: course.description.slice(0, 110) + '...',
        courseBadge: course.duration,
        priceTag: `₹${course.fee.toLocaleString('en-IN')}`,
        durationTag: course.duration,
        featureBullets: course.modules.slice(0, 6).map(m => m.replace(/^\d+\.\s*/, '')),
        targetUrl: `https://cortexx.ai/course/${course.id}`,
      }));
      setCustomDescription(course.description);
    }
  };

  // Pre-set AI Angles Generator
  const generateCreativeAngle = (angle: 'urgency' | 'career' | 'technical') => {
    if (angle === 'urgency') {
      setConfig(prev => ({
        ...prev,
        headline: 'Batch Starting Soon: Practical AI Masterclass',
        subheadline: 'Limited seats available. Gain the unfair advantage in AI automation and generative tools.',
        ctaText: 'Claim Your Seat',
        courseBadge: 'Limited Intake',
      }));
    } else if (angle === 'career') {
      setConfig(prev => ({
        ...prev,
        headline: 'Future-Proof Your Career With AI Skills',
        subheadline: 'From prompt engineering to autonomous agents. Get certified by Cortexx AI Institute.',
        ctaText: 'Get Certified',
        courseBadge: 'Career Ready',
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        headline: 'Where Thinking Meets Technology',
        subheadline: 'Learn to build real-world AI agents, automated pipelines, and commercial media.',
        ctaText: 'Start Learning',
        courseBadge: 'Hands-On Labs',
      }));
    }
  };

  // High-Resolution PNG Download
  const handleDownloadBanner = async (format: AdFormat) => {
    setIsExporting(true);
    try {
      const bannerElement = document.getElementById(`banner-export-${format.id}`);
      if (!bannerElement) {
        throw new Error('Banner DOM element not found');
      }

      const canvas = await html2canvas(bannerElement, {
        scale: 1, // exact pixel dimensions
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cortexx_ad_${format.id}_${format.width}x${format.height}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download banner error:', err);
      alert('Error exporting banner image.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download All Formats
  const handleDownloadAll = async () => {
    setIsExporting(true);
    for (const format of AD_FORMATS) {
      try {
        const bannerElement = document.getElementById(`banner-export-${format.id}`);
        if (bannerElement) {
          const canvas = await html2canvas(bannerElement, {
            scale: 1,
            useCORS: true,
            logging: false,
            backgroundColor: null,
          });
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `cortexx_ad_${format.id}_${format.width}x${format.height}.png`;
          link.href = dataUrl;
          link.click();
          await new Promise(r => setTimeout(r, 250));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsExporting(false);
  };

  // Copy HTML Embed
  const handleCopyEmbed = () => {
    const code = `<!-- Cortexx AI Banner Ad (${selectedFormat.name} ${selectedFormat.width}x${selectedFormat.height}) -->
<a href="${config.targetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; text-decoration:none;">
  <div style="width:${selectedFormat.width}px; height:${selectedFormat.height}px; background:#0d1117; color:#fff; font-family:sans-serif; border:1px solid #ff6a00; border-radius:8px; padding:16px; box-sizing:border-box;">
    <h3 style="margin:0 0 8px; font-size:16px; color:#ff6a00;">${config.headline}</h3>
    <p style="margin:0; font-size:12px; color:#cbd5e1;">${config.subheadline}</p>
    <div style="margin-top:12px; font-weight:bold; color:#fff; background:#ff6a00; display:inline-block; padding:6px 14px; border-radius:6px; font-size:12px;">${config.ctaText} →</div>
  </div>
</a>`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Course Ad & Banner Studio</span>
            <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase">
              All Standard Sizes
            </span>
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Generate high-converting display ads in all IAB and social sizes from course outlines & URLs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'single' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Single Preview</span>
            </button>
            <button
              onClick={() => setViewMode('all-matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'all-matrix' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All 8 Sizes Matrix</span>
            </button>
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors disabled:opacity-50 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export All Sizes'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5">
          {/* Step 1: Select Product or Course */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Source Course / Product Description
            </label>
            <select
              value={selectedCourseId}
              onChange={e => handleSelectCourse(e.target.value)}
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-medium text-neutral-100 focus:outline-none focus:border-orange-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.duration} · ₹{c.fee.toLocaleString('en-IN')})
                </option>
              ))}
              <option value="custom">Custom Product / Course Input...</option>
            </select>
          </div>

          {/* Quick AI Creative Angles */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>AI Copy Presets</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => generateCreativeAngle('career')}
                className="py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-[11px] font-medium text-neutral-300 transition-colors"
              >
                Career Focus
              </button>
              <button
                type="button"
                onClick={() => generateCreativeAngle('urgency')}
                className="py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-[11px] font-medium text-neutral-300 transition-colors"
              >
                Limited Seats
              </button>
              <button
                type="button"
                onClick={() => generateCreativeAngle('technical')}
                className="py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-[11px] font-medium text-neutral-300 transition-colors"
              >
                Deep Tech
              </button>
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Color & Lighting Aesthetic
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'dark-ember', name: 'Dark Ember', swatch: 'from-black to-orange-900' },
                { id: 'pure-dark', name: 'Pure Dark', swatch: 'from-neutral-950 to-neutral-800' },
                { id: 'vibrant-orange', name: 'Vibrant', swatch: 'from-orange-600 to-amber-500' },
                { id: 'minimal-light', name: 'Light', swatch: 'from-white to-neutral-200' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setConfig(prev => ({ ...prev, theme: t.id as BannerTheme }))}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    config.theme === t.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                  }`}
                >
                  <div className={`w-full h-4 rounded bg-gradient-to-r ${t.swatch} mb-1.5`} />
                  <span className="text-[11px] font-medium text-neutral-200 block truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ad Copy Customizers */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Headline (Main Hook)
              </label>
              <input
                type="text"
                value={config.headline}
                onChange={e => setConfig(prev => ({ ...prev, headline: e.target.value }))}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Subheadline (Value Proposition)
              </label>
              <textarea
                rows={2}
                value={config.subheadline}
                onChange={e => setConfig(prev => ({ ...prev, subheadline: e.target.value }))}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={config.ctaText}
                  onChange={e => setConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Course Badge / Tag
                </label>
                <input
                  type="text"
                  value={config.courseBadge}
                  onChange={e => setConfig(prev => ({ ...prev, courseBadge: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Tuition Price Display
                </label>
                <input
                  type="text"
                  value={config.priceTag || ''}
                  onChange={e => setConfig(prev => ({ ...prev, priceTag: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={config.targetUrl}
                  onChange={e => setConfig(prev => ({ ...prev, targetUrl: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Feature Bullets (for taller banners) */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Curriculum Bullet Points (for tall & social formats)
              </label>
              <textarea
                rows={3}
                value={config.featureBullets.join('\n')}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    featureBullets: e.target.value.split('\n').filter(b => b.trim().length > 0),
                  }))
                }
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs text-neutral-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showLogo}
                onChange={e => setConfig(p => ({ ...p, showLogo: e.target.checked }))}
                className="rounded border-neutral-700 text-orange-500 focus:ring-orange-500"
              />
              <span>Show Cortexx Logo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showBadge}
                onChange={e => setConfig(p => ({ ...p, showBadge: e.target.checked }))}
                className="rounded border-neutral-700 text-orange-500 focus:ring-orange-500"
              />
              <span>Show Course Badge</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPrice}
                onChange={e => setConfig(p => ({ ...p, showPrice: e.target.checked }))}
                className="rounded border-neutral-700 text-orange-500 focus:ring-orange-500"
              />
              <span>Show Tuition Fee</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showUrl}
                onChange={e => setConfig(p => ({ ...p, showUrl: e.target.checked }))}
                className="rounded border-neutral-700 text-orange-500 focus:ring-orange-500"
              />
              <span>Show Target URL</span>
            </label>
          </div>
        </div>

        {/* Right Column: Canvas Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Format Selector Pills */}
          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Select Ad Display Format
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {AD_FORMATS.map(f => {
                const isSelected = selectedFormatId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFormatId(f.id);
                      setViewMode('single');
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    <span>{f.name}</span>{' '}
                    <span className="font-mono text-[10px] text-neutral-500">
                      ({f.width}×{f.height})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canvas Display Viewport */}
          {viewMode === 'single' ? (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[460px] overflow-hidden">
              {/* Scale-fitted view for previewing high-res ads (like 1080x1080 or 1080x1920) */}
              <div className="w-full flex items-center justify-center overflow-auto p-4 max-h-[640px]">
                {(() => {
                  // Compute scale so large formats fit nicely in desktop card
                  const maxPreviewWidth = 580;
                  const maxPreviewHeight = 440;
                  const scaleW = maxPreviewWidth / selectedFormat.width;
                  const scaleH = maxPreviewHeight / selectedFormat.height;
                  const scale = Math.min(1, scaleW, scaleH);

                  return (
                    <div
                      style={{
                        width: `${selectedFormat.width * scale}px`,
                        height: `${selectedFormat.height * scale}px`,
                      }}
                      className="relative shrink-0 shadow-2xl rounded-lg overflow-hidden border border-neutral-800"
                    >
                      <AdBannerCanvas
                        format={selectedFormat}
                        config={config}
                        scale={scale}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Format Details & Direct Actions */}
              <div className="w-full mt-4 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-neutral-400 font-mono">
                  <span className="text-neutral-200 font-bold">{selectedFormat.name}</span> ·{' '}
                  <span>{selectedFormat.width}×{selectedFormat.height}px</span> ({selectedFormat.aspectRatio})
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyEmbed}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied HTML!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadBanner(selectedFormat)}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG ({selectedFormat.width}×{selectedFormat.height})</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* All 8 Formats Matrix */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AD_FORMATS.map(f => {
                  const scale = Math.min(1, 260 / f.width, 180 / f.height);
                  return (
                    <div
                      key={f.id}
                      className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-bold text-neutral-200">{f.name}</span>
                        <span className="font-mono text-neutral-500">{f.width}×{f.height}</span>
                      </div>

                      <div
                        style={{
                          width: `${f.width * scale}px`,
                          height: `${f.height * scale}px`,
                        }}
                        className="mx-auto rounded overflow-hidden shadow"
                      >
                        <AdBannerCanvas format={f} config={config} scale={scale} />
                      </div>

                      <div className="mt-4 pt-2 border-t border-neutral-800 flex justify-end">
                        <button
                          onClick={() => handleDownloadBanner(f)}
                          className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PNG</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Offscreen Containers for Pixel-Perfect High-Res Export (Never clipped) */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }} aria-hidden="true">
        {AD_FORMATS.map(f => (
          <div key={f.id} id={`banner-export-${f.id}`}>
            <AdBannerCanvas format={f} config={config} scale={1} />
          </div>
        ))}
      </div>
    </div>
  );
};
