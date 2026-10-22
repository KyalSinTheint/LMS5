import React from 'react';
import {
  Shield,
  Heart,
  Award,
  Users,
  Sparkles,
  Target,
  Briefcase,
  LucideIcon,
} from 'lucide-react';
import { CompanyContentData } from '../data/companyContent';

interface CoreValuesSectionProps {
  content: CompanyContentData['coreValues'];
}

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Heart,
  Award,
  Users,
  Sparkles,
  Target,
  Briefcase,
};

export const CoreValuesSection: React.FC<CoreValuesSectionProps> = ({ content }) => {
  return (
    <section
      id="core-values"
      aria-labelledby="core-values-heading"
      className="py-16 lg:py-24 bg-light-blue-subtle border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-[#176B98] tracking-wider uppercase mb-2">
            <span>Guiding Principles</span>
          </div>
          <h2
            id="core-values-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#176B98] tracking-tight font-myanmar"
          >
            {content.heading}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            The foundation of our ethical culture, professional consultation, and relationship with customers.
          </p>
        </div>

        {/* Data-driven Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.items.map((value) => {
            const IconComponent = ICON_MAP[value.iconName] || Shield;

            return (
              <div
                key={value.id}
                className="bg-white rounded-2xl border border-slate-200 p-7 flex flex-col justify-between shadow-card-elevated hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#176B98]/10 text-[#176B98] flex items-center justify-center group-hover:bg-[#176B98] group-hover:text-white transition-colors">
                      <IconComponent className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#737373] bg-[#F3F8FB] border border-slate-200 px-2.5 py-1 rounded-md">
                      0{value.number}
                    </span>
                  </div>

                  <div className="mb-3">
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <span>({value.number}) {value.title}</span>
                      <span className="text-slate-300 font-normal">·</span>
                      <span className="text-[#176B98] font-myanmar text-base font-bold">
                        {value.burmeseSubtitle}
                      </span>
                    </h3>
                  </div>

                  <p className="text-sm font-myanmar text-slate-700 leading-relaxed">
                    {value.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#737373]">
                  <span className="font-medium text-[#737373]">Value 0{value.number}</span>
                  <span className="text-[#176B98] font-bold">
                    KBZLIFE
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
