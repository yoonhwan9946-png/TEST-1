
import React, { useState } from 'react';
import { Github, Instagram, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
import ContactModal from './ContactModal';

const Footer: React.FC = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <>
    <footer className="relative z-50 bg-white border-t border-slate-200 pt-20 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
          
          {/* Left Column: Brand & Description (Expanded Area) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/20">
                <span className="text-white font-bold text-base">Y</span>
              </div>
              <span className="text-slate-900 font-bold text-xl tracking-tight">Y.LAB</span>
            </div>
            
            <div className="space-y-8">
                <p className="text-slate-600 text-base leading-8 font-medium pr-0 lg:pr-12">
                Y.LAB은 건축적 사고의 시각화를 통해 디자인 프로세스를 자산화합니다.<br className="hidden lg:block"/>
                우리는 더 나은 공간을 위한 논리적 근거를 명료한 시각적 언어로 제안하며,<br className="hidden lg:block"/>
                데이터 기반의 트렌드 분석을 통해 새로운 영감을 제공합니다.
                </p>
                
                {/* Ownership Disclaimer (Styled Box) */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-xs text-slate-500 leading-relaxed max-w-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span className="font-bold text-slate-700 uppercase tracking-wider">Asset Ownership & Copyright</span>
                    </div>
                    <p>
                        본 홈페이지의 시각화 자산(Diagram/Mockup)에 대한 편집 저작권은 Y.LAB(개인)에게 있으며,<br />
                        기재된 프로젝트의 원본 설계안 및 소스에 대한 권리는 해당 설계사무소 및 원저작자에게 귀속됩니다.
                    </p>
                </div>
            </div>
          </div>
          
          {/* Right Column: Navigation & Connect (Cleaned Design) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-12 lg:gap-8 lg:pl-8 border-t lg:border-t-0 border-slate-100 pt-10 lg:pt-0">
            
            {/* Platform Section */}
            <div>
                <h4 className="text-slate-900 font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                    Platform
                </h4>
                <ul className="space-y-4">
                    {[
                        { name: 'Asset Library', href: '#/library' },
                        { name: 'Trend Lab', href: '#/trend' },
                        { name: 'Pricing Plans', href: '#' },
                        { name: 'Licensing Info', href: '#' },
                    ].map((item) => (
                        <li key={item.name}>
                            <a href={item.href} className="group flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
                                <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-blue-600 group-hover:scale-150 transition-all"></span>
                                {item.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Connect Section */}
            <div>
                <h4 className="text-slate-900 font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                    Connect
                </h4>
                <div className="grid grid-cols-4 gap-3">
                    <a href="#" className="group flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1" title="Instagram">
                        <Instagram size={18} className="transition-transform group-hover:scale-110" />
                    </a>
                    <a href="#" className="group flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1" title="LinkedIn">
                        <Linkedin size={18} className="transition-transform group-hover:scale-110" />
                    </a>
                    <a href="#" className="group flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1" title="GitHub">
                        <Github size={18} className="transition-transform group-hover:scale-110" />
                    </a>
                    <button 
                        onClick={() => setIsContactOpen(true)}
                        className="group flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1" 
                        title="Email Contact"
                    >
                        <Mail size={18} className="transition-transform group-hover:scale-110" />
                    </button>
                </div>
                <div className="mt-8">
                    <button 
                        onClick={() => setIsContactOpen(true)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors border-b border-dashed border-slate-300 hover:border-slate-900 pb-0.5"
                    >
                        Contact via Email <ArrowUpRight size={12} />
                    </button>
                </div>
            </div>

          </div>
        </div>
        
        {/* Footer Bottom (Copyright & Personal Info) */}
        <div className="pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            
            {/* Personal Info Block */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-slate-500 font-medium tracking-tight">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">COMPANY</span>
                        <span className="text-slate-800">PERSONAL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">ADDRESS</span>
                        <span>SEOUL, KOREA</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">E-MAIL</span>
                        <button onClick={() => setIsContactOpen(true)} className="hover:text-blue-600 transition-colors decoration-slate-300 underline underline-offset-2 hover:decoration-blue-600">yoonhwan9946@gmail.com</button>
                    </div>
                </div>
                <p className="text-[11px] text-slate-400">
                    Copyright © 2025 Yunhwan Seol. All rights reserved.
                </p>
            </div>

            <div className="flex gap-6 text-[11px] font-bold text-slate-400">
              <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    
    <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
};

export default Footer;
