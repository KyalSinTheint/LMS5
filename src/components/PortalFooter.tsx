import React from 'react';
import { Shield, ExternalLink, ArrowUp, Mail, Phone, MapPin, Globe, Share2 } from 'lucide-react';
import { NavTabId, NAV_ITEMS } from './PortalHeader';

interface PortalFooterProps {
  onSelectTab: (tabId: NavTabId) => void;
  activeTab: NavTabId;
}

export const PortalFooter: React.FC<PortalFooterProps> = ({ onSelectTab, activeTab }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#176B98] text-white border-t border-[#135A80] mt-20" role="contentinfo">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Column 1: Brand & Overview (4 cols) */}
          <div className="md:col-span-4 space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-2 shadow-xs shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/KBZ_Logo_28e9d8fb.png"
                  alt="KBZ LIFE Insurance"
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col border-l border-white/20 pl-3">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                  KBZ LIFE Insurance
                </span>
                <span className="text-[10px] sm:text-[11px] text-white/80 tracking-wider uppercase font-semibold mt-0.5">
                  Employee Learning Portal
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="inline-block px-3 py-1 rounded-md bg-white/10 text-xs font-mono text-white/90 border border-white/15">
                The Right Insurance For You
              </span>
            </div>

            {/* Social Links */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/90 mb-2 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Links</span>
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Facebook', 'Linkedin', 'Tiktok', 'Youtube'].map((network) => (
                  <span
                    key={network}
                    className="px-2.5 py-1 rounded-md bg-white/10 text-white/90 border border-white/15 hover:bg-white/20 transition-colors"
                  >
                    {network}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links (Mandated strictly in footer only) (3 cols) */}
          <div className="md:col-span-3 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90 pb-1 border-b border-white/15">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm" aria-label="Portal Quick Links">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onSelectTab(item.id);
                        scrollToTop();
                      }}
                      className={`group flex items-center gap-2 transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'text-white font-bold underline underline-offset-4 decoration-white'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span>{item.label}</span>
                      {!item.isReady && (
                        <span className="text-[10px] bg-white/15 text-white/80 px-1.5 py-0.2 rounded font-normal">
                          Coming soon
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="pt-4">
              <a
                href="https://kbzlife.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website : kbzlife.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Column 3: Contact Information (5 cols) */}
          <div className="md:col-span-5 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90 pb-1 border-b border-white/15">
              Contact Information
            </h3>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 bg-white/10 p-3 rounded-lg border border-white/15">
                <Mail className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Email</span>
                  <a href="mailto:info@kbzlife.com" className="text-white/80 hover:text-white">
                    info@kbzlife.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/10 p-3 rounded-lg border border-white/15">
                <Phone className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Call Us</span>
                  <a href="tel:+959954477788" className="text-white/80 hover:text-white">
                    (+95) 9954477788
                  </a>
                </div>
              </div>
            </div>

            {/* Branch Addresses */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Yangon Head Office:</span>
                  <p className="text-white/80 leading-relaxed mt-0.5">
                    No.C520/A-5, Pyae Wa Condominium, Kabar Aye Pagoda Road, Bahan Township, Yangon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Mandalay Branch:</span>
                  <p className="text-white/80 leading-relaxed mt-0.5">
                    No.A(5+6), 33 Street , Between (77*78) Street, Chanayethazan Township, Mandalay.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Taunggyi Branch:</span>
                  <p className="text-white/80 leading-relaxed mt-0.5">
                    Room A - 10, Shop House Unit A, Small Highway Station, Taunggyi-Hopong Road, Taunggyi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright and Standards */}
        <div className="mt-14 pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div>
            © {new Date().getFullYear()} KBZ LIFE Insurance. All rights reserved. The Right Insurance For You.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
