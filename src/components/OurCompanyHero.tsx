import React from 'react';
import { ArrowDown } from 'lucide-react';
import { CompanyContentData } from '../data/companyContent';

interface OurCompanyHeroProps {
  content: CompanyContentData['hero'];
}

export const OurCompanyHero: React.FC<OurCompanyHeroProps> = ({ content }) => {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative bg-ambient-luminous pt-14 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 overflow-hidden"
    >
      {/* Soft atmospheric gradient glow effect with brand accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#25A9D2]/15 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#176B98]/10 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Eyebrow, Heading, Subheading & CTAs (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200/90 shadow-2xs text-[#176B98] text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#176B98]" />
              <span>{content.eyebrow}</span>
            </div>

            {/* Prominent High-Contrast Heading */}
            <h1
              id="hero-heading"
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#176B98] tracking-tight leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              {content.heading}
            </h1>

            {/* Slogan & concise copy */}
            <div className="space-y-2">
              <p className="text-xl sm:text-2xl font-extrabold text-[#135A80] tracking-tight">
                {content.subheading}
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                Internal learning ecosystem empowering employee excellence, ethical customer consultation, and lifelong protection across Myanmar.
              </p>
            </div>

            {/* Interactive Primary & Secondary CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <a
                href={content.anchorTarget}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#176B98] hover:bg-[#135A80] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#176B98]"
              >
                <span>{content.anchorText}</span>
                <ArrowDown className="w-4 h-4 text-white" />
              </a>

              <a
                href="#ceo-motto"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-[#176B98] text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <span>Read CEO Message</span>
              </a>
            </div>
          </div>

          {/* Right Column: Welcome to KBZLIFE Insurance Photo Frame (5 cols on lg) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-card-hover border border-slate-200/90 bg-white/95 p-2.5 sm:p-3 transition-transform hover:scale-[1.01]">
              <img
                src={content.imageUrl || '/assets/aistudio/6-2-1024x683_b78785ee.jpg'}
                alt={content.imageCaption || 'KBZ LIFE Insurance'}
                className="w-full h-auto object-cover rounded-xl shadow-xs"
              />
              <div className="mt-2.5 px-2 flex items-center justify-between text-[11px] text-[#737373] font-medium">
                <span className="flex items-center gap-1.5 text-[#176B98] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176B98]" />
                  KBZ LIFE Insurance
                </span>
                <span>The Right Insurance For You</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
