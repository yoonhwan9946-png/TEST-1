
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  
  const navLinks = [
    { name: 'Asset Library', path: '/library', desc: 'Diagrams & Mockups' },
    { name: 'Trend Lab', path: '/trend', desc: 'AI Analysis' },
    { name: 'Projects', path: '/projects', desc: 'Saved Maps' },
    { name: 'Admin', path: '/admin', desc: 'System Control' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled || isOpen ? 'bg-white/90 backdrop-blur-md border-slate-200 py-4' : 'bg-transparent border-transparent py-6'
      }`}>
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            
            {/* Left: Logo */}
            <div className="flex items-center z-50">
              <Link to="/" className="group flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
                  Y.LAB
                </span>
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Link>
            </div>
            
            {/* Center: Desktop Navigation (Hidden when menu is open to reduce noise) */}
            <div className={`hidden md:flex items-center gap-12 transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 group ${
                    isActive(link.path)
                      ? 'text-slate-900'
                      : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-slate-900 transform origin-left transition-transform duration-300 ${isActive(link.path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </Link>
              ))}
            </div>

            {/* Right: Actions & Custom Hamburger */}
            <div className="flex items-center gap-8 z-50">
               {/* Search Icon */}
               <button className={`hidden sm:flex items-center gap-2 transition-colors duration-300 ${isOpen ? 'text-slate-400 hover:text-slate-900' : 'text-slate-900 hover:text-slate-500'}`}>
                  <Search size={18} strokeWidth={2} />
               </button>

               {/* Custom Architectural Hamburger Trigger */}
               <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="group flex flex-col items-end gap-[6px] w-8 cursor-pointer p-2 -mr-2"
                  aria-label="Toggle Menu"
               >
                  <span className={`h-[1.5px] bg-slate-900 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'w-6 -rotate-45 translate-y-[3.5px]' : 'w-8 group-hover:w-6'}`} />
                  <span className={`h-[1.5px] bg-slate-900 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'w-6 rotate-45 -translate-y-[4px]' : 'w-4 group-hover:w-8'}`} />
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Minimal Gradient Drawer (1/4 Screen) --- */}
      {/* Backdrop (Click to close) */}
      <div 
        className={`fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[45] transition-opacity duration-700 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* The Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 z-[50] w-full sm:w-[380px] md:w-[28vw] bg-gradient-to-b from-white/95 via-slate-50/95 to-slate-100/95 backdrop-blur-xl shadow-2xl border-l border-white/50 transform transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col px-10 py-32 relative">
             
             {/* Decorative Background Text */}
             <div className="absolute top-1/2 -right-12 -translate-y-1/2 rotate-90 text-[120px] font-black text-slate-900/5 pointer-events-none select-none tracking-tighter">
                MENU
             </div>

             {/* Navigation List */}
             <div className="flex flex-col gap-10 flex-1 justify-center">
                {navLinks.map((link, idx) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="group relative flex flex-col items-start"
                    style={{ transitionDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                        <span className={`text-[10px] font-mono text-blue-600 transition-transform duration-500 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                            0{idx + 1}
                        </span>
                        <span className={`text-2xl font-black text-slate-900 uppercase tracking-tight transition-all duration-300 group-hover:tracking-widest group-hover:text-blue-700 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            {link.name}
                        </span>
                    </div>
                    <span className={`text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] mt-1 pl-8 transition-opacity duration-500 delay-100 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                        {link.desc}
                    </span>
                  </Link>
                ))}
             </div>

             {/* Footer Info */}
             <div className={`mt-auto border-t border-slate-200 pt-8 transition-opacity duration-700 delay-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px]">
                        Architectural Logic &<br/>Visual Assetization Platform.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-[10px] font-bold text-slate-900 uppercase tracking-wider hover:text-blue-600">Instagram</a>
                        <a href="#" className="text-[10px] font-bold text-slate-900 uppercase tracking-wider hover:text-blue-600">Contact</a>
                    </div>
                </div>
             </div>

          </div>
      </div>
    </>
  );
};

export default Navbar;
