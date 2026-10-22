import React from 'react';
import { Compass, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CompanyContentData } from '../data/companyContent';

interface AspirationsSectionProps {
  content: CompanyContentData['aspirations'];
}

export const AspirationsSection: React.FC<AspirationsSectionProps> = ({ content }) => {
  return (
    <section
      id="aspirations"
      aria-labelledby="aspirations-heading"
      className="py-16 lg:py-24 bg-light-blue-pattern border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-[#176B98] tracking-wider uppercase mb-2">
            <Compass className="w-4 h-4 text-[#176B98]" />
            <span>Strategic Trajectory</span>
          </div>

          <h2
            id="aspirations-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#176B98] tracking-tight leading-snug font-myanmar"
          >
            {content.burmeseHeading}
          </h2>

          <p className="text-sm font-bold text-[#135A80] mt-1">
            {content.englishSubtitle}
          </p>

          <p className="text-xs sm:text-sm text-[#737373] mt-2">
            {content.intro}
          </p>
        </div>

        {/* 4 Official Aspirations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.items.map((aspiration, index) => {
            return (
              <div
                key={aspiration.id}
                className="p-7 rounded-2xl bg-white border border-slate-200 shadow-card-elevated hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-9 h-9 rounded-xl bg-[#176B98] text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">
                      0{index + 1}
                    </span>
                    <span className="text-[11px] font-mono text-[#176B98] font-bold bg-[#F3F8FB] px-2.5 py-1 rounded-md border border-[#176B98]/20">
                      Commitment 0{index + 1}
                    </span>
                  </div>

                  {/* Burmese Text Paragraph */}
                  <p className="text-base sm:text-lg font-myanmar text-slate-800 leading-relaxed pt-2">
                    {aspiration.paragraph}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-[#737373]">
                  <CheckCircle2 className="w-4 h-4 text-[#176B98]" />
                  <span className="font-semibold text-slate-700">KBZLIFE Commitment</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational Guidance Callout */}
        <div className="mt-12 p-6 rounded-2xl bg-[#F3F8FB] border border-[#176B98]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600 text-left shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176B98] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">
                လူတိုင်းအတွက် လိုအပ်သော ကာကွယ်မှုများ
              </span>
              <span className="text-slate-600 font-myanmar">
                လုံခြုံပြီး စိတ်ချရသော အရိပ်အမြုံအဖြစ် အေးအတူပူအမျှ ရှိနေပေးမည် ဖြစ်ပါသည်။
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <span className="text-xs font-mono font-bold text-[#176B98] bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              The Right Insurance For You
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
