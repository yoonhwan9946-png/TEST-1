
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import BrainstormingSearch from '../components/BrainstormingSearch';

// Default Constants (Fallback)
const DEFAULT_BG_IMAGES = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=2071&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2031&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1355157121228-568eb22961d3?q=80&w=2071&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1577772714571-555df8524d77?q=80&w=2070&auto=format&fit=crop"  
];

const DEFAULT_INTRO_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop";
const SLICE_COUNT = 5; // Number of vertical slices

const HOME_TREND_POSTS = [
    { id: 1, title: "Biophilic Integration", category: "Sustainability", date: "Mar 2024", img: "https://images.unsplash.com/photo-1518005052387-dc04886bc3a7?q=80&w=2070&auto=format&fit=crop" },
    { id: 2, title: "Digital Twin Cities", category: "Technology", date: "Feb 2024", img: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop" },
    { id: 3, title: "Adaptive Reuse", category: "Materiality", date: "Jan 2024", img: "https://images.unsplash.com/photo-1555636222-cae831e670b3?q=80&w=2077&auto=format&fit=crop" },
    { id: 4, title: "Third Places", category: "Social", date: "Dec 2023", img: "https://images.unsplash.com/photo-1517502884422-41e157d252b5?q=80&w=2069&auto=format&fit=crop" },
    { id: 5, title: "15-Minute City", category: "Urbanism", date: "Nov 2023", img: "https://images.unsplash.com/photo-1449824913929-2b3a3e35792c?q=80&w=2070&auto=format&fit=crop" },
    { id: 6, title: "Mass Timber", category: "Materiality", date: "Oct 2023", img: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=2069&auto=format&fit=crop" }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Dynamic Image State
  const [backgroundImages, setBackgroundImages] = useState<string[]>(DEFAULT_BG_IMAGES);
  const [introMainImage, setIntroMainImage] = useState<string>(DEFAULT_INTRO_IMAGE);

  // Intro Animation State - Initialize based on session storage
  const [introStep, setIntroStep] = useState(() => {
      // If user has visited in this session, skip animation (start at step 3)
      return sessionStorage.getItem('ylab_intro_shown') ? 3 : 0;
  });

  // Load Admin Settings
  useEffect(() => {
    const savedIntro = localStorage.getItem('ylab_home_intro');
    const savedBgs = localStorage.getItem('ylab_home_bgs');

    if (savedIntro) setIntroMainImage(savedIntro);
    if (savedBgs) {
        try {
            setBackgroundImages(JSON.parse(savedBgs));
        } catch(e) { console.error("Failed to parse bg images", e); }
    }
  }, []);

  // Handle Intro Sequence
  useEffect(() => {
    // If already visited (introStep initialized to 3), skip logic
    if (introStep === 3) return;

    // Mark as visited for this session
    sessionStorage.setItem('ylab_intro_shown', 'true');

    // Step 1: Start Drop Animation
    const t1 = setTimeout(() => setIntroStep(1), 100);
    
    // Step 2: Reveal Content (Fade out overlay) - Wait for drop (1500ms) + delay stagger (~500ms) + hold (800ms)
    const t2 = setTimeout(() => setIntroStep(2), 2800); 
    
    // Step 3: Remove DOM
    const t3 = setTimeout(() => setIntroStep(3), 3800);

    return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
    };
  }, []); // Run once on mount

  // Background Rotation (Independent of Intro)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [backgroundImages]);

  // --- Horizontal Scroll Logic ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if(!scrollContainerRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if(!isDown || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const navigateToTrend = (id: number) => {
      if (!isDown) { // Only navigate if not dragging
          navigate('/trend', { state: { openTrendId: id } });
      }
  };

  return (
    <div className="relative flex flex-col w-full">
      
      {/* --- INTRO OVERLAY (Split Image Assembly) --- */}
      {/* Only render if intro is not done (step < 3) */}
      {introStep < 3 && (
        <div 
            className={`fixed inset-0 z-[200] bg-white flex transition-opacity duration-1000 ease-in-out ${introStep === 2 ? 'opacity-0' : 'opacity-100'}`}
        >
            {Array.from({ length: SLICE_COUNT }).map((_, idx) => (
                <div key={idx} className="relative flex-1 h-full overflow-hidden bg-white">
                    <div 
                        className="absolute top-0 h-full bg-cover bg-center transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                            backgroundImage: `url(${introMainImage})`,
                            // Width is scaled up to cover the full viewport width from within a slice
                            width: `${SLICE_COUNT * 100}%`,
                            // Shift left to align this slice's portion of the image
                            left: `-${idx * 100}%`,
                            // Animation: Drop from top (-100%) to neutral (0)
                            transform: introStep >= 1 ? 'translateY(0)' : 'translateY(-100%)',
                            transitionDelay: `${idx * 80}ms` // Staggered drop
                        }}
                    />
                </div>
            ))}
        </div>
      )}

      {/* --- FIXED BACKGROUND LAYER (Parallax Effect) --- */}
      <div className="fixed inset-0 w-full h-full z-0">
        {backgroundImages.map((imgUrl, index) => (
            <div 
                key={index}
                className={`absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-[2500ms] ease-in-out transform scale-105 ${index === currentImageIndex ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                style={{ backgroundImage: `url(${imgUrl})` }}
            />
        ))}
        {/* Magazine-style overlay: Lighter for text contrast, mimicking the reference */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/50 to-white/95"></div>
        <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
      </div>

      {/* --- HERO SECTION (Redesigned) --- */}
      <section className="relative z-10 w-full h-screen flex flex-col px-4 sm:px-6 lg:px-12 pointer-events-none">
        
        {/* Header Spacer (since navbar is transparent/fixed) */}
        <div className="h-32"></div>

        <div className={`flex-1 flex flex-col justify-center max-w-[1800px] mx-auto w-full relative transition-all duration-1000 delay-300 ${introStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Top Label (Reference Style) */}
            <div className="absolute top-[10%] left-0 pointer-events-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block animate-fade-in">
                    Architecture & Logic
                </span>
            </div>

            {/* Slide Counter (Reference Style) */}
            <div className="absolute top-[10%] right-0 animate-fade-in">
                <span className="text-4xl font-serif font-medium text-slate-900">
                    0{currentImageIndex + 1}
                </span>
                <span className="text-sm font-mono text-slate-400 align-top ml-2">
                    / 0{backgroundImages.length}
                </span>
            </div>

            {/* Main Interactive Search (Headline Style) */}
            <div className="w-full max-w-5xl pointer-events-auto">
                <BrainstormingSearch 
                    containerClassName="w-full"
                    inputClassName="w-full bg-transparent border-none p-0 text-6xl md:text-8xl lg:text-[7rem] text-slate-900 placeholder:text-slate-900 placeholder:opacity-100 font-serif font-medium tracking-tight leading-[0.9] focus:outline-none focus:ring-0 focus:placeholder-opacity-20 transition-all duration-300"
                    placeholder="Search for Logic..."
                    hideModeToggle={true}
                />
                
                {/* Sub-label under search */}
                <div className="mt-8 ml-2 flex items-center gap-3 opacity-60">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">See Project</span>
                    <ArrowRight size={14} className="text-slate-900" />
                </div>
            </div>

        </div>

        {/* Bottom Social / Scroll (Reference Style) */}
        <div className={`pb-12 flex justify-between items-end pointer-events-auto transition-all duration-1000 delay-500 ${introStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col gap-4">
                {['f', 't', 'i'].map((social, idx) => (
                    <a key={idx} href="#" className="text-slate-400 hover:text-slate-900 text-xs font-bold uppercase transition-colors">
                        {social}
                    </a>
                ))}
            </div>
            
            <div className="hidden md:block">
               {/* Optional: Add extra info or leave clean like reference */}
            </div>
        </div>

      </section>

      {/* --- EDITORIAL CONTENT SECTION (Slides up) --- */}
      <section className="relative z-20 w-full bg-white min-h-screen rounded-t-[3rem] shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.15)] border-t border-white/60 overflow-hidden">
        
        {/* 1. Marquee Strip */}
        <div className="w-full bg-slate-900 py-4 overflow-hidden border-b border-slate-800 rounded-t-[3rem]">
            <div className="whitespace-nowrap flex gap-10 animate-marquee text-white/80 text-xs font-mono tracking-[0.3em] uppercase">
                <span>Architectural Intelligence</span>
                <span>/</span>
                <span>Visual Assetization</span>
                <span>/</span>
                <span>Logic Diagrams</span>
                <span>/</span>
                <span>Mass Process</span>
                <span>/</span>
                <span>Design Methodology</span>
                <span>/</span>
                <span>Trend Analysis</span>
                <span>/</span>
                <span>Data-Driven Design</span>
                <span>/</span>
                <span>Architectural Intelligence</span>
                <span>/</span>
                <span>Visual Assetization</span>
            </div>
        </div>

        {/* 2. Editorial Section: The Archive */}
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Text Column */}
                <div className="lg:col-span-4 sticky top-32">
                    <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-4 block">01 — The Database</span>
                    <h2 className="text-5xl lg:text-6xl font-serif text-slate-900 tracking-tight mb-8 leading-[1]">
                        Visual<br/>Archive.
                    </h2>
                    <p className="text-slate-500 text-sm leading-7 mb-10 border-l border-slate-200 pl-6">
                        Access a curated collection of over 1,200 standardized architectural diagrams. 
                        From massing studies to circulation logic, every asset is categorized and ready for your proposal.
                    </p>
                    <Link to="/library" className="group inline-flex items-center gap-3 text-sm font-bold text-slate-900 border-b border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-all">
                        EXPLORE LIBRARY <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Gallery Column */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Feature Image */}
                    <Link to="/library" className="md:col-span-2 group relative aspect-[16/9] overflow-hidden rounded-none cursor-pointer">
                        <img 
                            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" 
                            alt="Archive Feature" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-6 left-6 text-white">
                            <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-80">Featured Collection</p>
                            <h3 className="text-2xl font-serif">Public Competitions</h3>
                        </div>
                        <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ArrowUpRight className="text-white" size={20} />
                        </div>
                    </Link>

                    {/* Sub Image 1 */}
                    <Link to="/library" className="group relative aspect-[4/5] overflow-hidden rounded-none cursor-pointer">
                        <img 
                            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop" 
                            alt="Detail" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-6 left-6 text-white translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <h3 className="text-lg font-serif">Cultural Facilities</h3>
                        </div>
                    </Link>

                    {/* Sub Image 2 */}
                    <Link to="/library" className="group relative aspect-[4/5] overflow-hidden rounded-none cursor-pointer bg-slate-100 flex items-center justify-center">
                        <div className="text-center p-8">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                <span className="text-xl font-bold text-slate-900">+</span>
                            </div>
                            <h3 className="text-lg font-serif text-slate-900 mb-2">View All Assets</h3>
                            <p className="text-xs text-slate-500">Discover 1,200+ more items</p>
                        </div>
                    </Link>
                </div>

            </div>
        </div>

        {/* 3. Feature Section: Trend Lab (Draggable Horizontal Strip) */}
        <div className="relative bg-white border-t border-slate-200 py-24 lg:py-32 overflow-hidden">
            
            <div className="max-w-[1800px] mx-auto px-6 lg:px-8 mb-16">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                         <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-4 block">02 — Future Insight</span>
                         <h2 className="text-5xl lg:text-7xl font-serif text-slate-900 tracking-tight leading-[1]">
                            Trend<br/><span className="text-slate-400 italic">Laboratory.</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Drag to Explore</span>
                         <div className="w-16 h-[1px] bg-slate-300"></div>
                         <Link to="/trend" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-none text-xs font-bold hover:bg-blue-600 transition-all">
                            VIEW ALL <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Draggable Carousel */}
            <div 
                ref={scrollContainerRef}
                className={`w-full overflow-x-auto whitespace-nowrap pl-6 lg:pl-8 pb-10 scrollbar-hide ${isDown ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                <div className="inline-flex gap-8 pr-12">
                    {HOME_TREND_POSTS.map((post) => (
                        <div 
                            key={post.id}
                            onClick={() => navigateToTrend(post.id)}
                            className="relative w-[300px] md:w-[400px] aspect-[3/4] group flex-shrink-0 cursor-pointer overflow-hidden bg-slate-100 select-none"
                        >
                            <img 
                                src={post.img} 
                                alt={post.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none" 
                                draggable={false}
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
                                <div className="absolute top-0 left-0 p-6 w-full flex justify-between items-start">
                                    <span className="text-white/60 text-[10px] font-mono border border-white/30 px-2 py-1">{post.date}</span>
                                    <ArrowUpRight className="text-white opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0 duration-300" size={24} />
                                </div>
                                <div className="absolute bottom-0 left-0 p-8 w-full whitespace-normal">
                                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">{post.category}</span>
                                    <h3 className="text-3xl font-serif text-white leading-none group-hover:text-blue-50 transition-colors">{post.title}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* View All Card */}
                    <div 
                        onClick={() => navigate('/trend')}
                        className="relative w-[200px] aspect-[3/4] flex-shrink-0 cursor-pointer bg-slate-900 flex flex-col items-center justify-center text-white hover:bg-blue-600 transition-colors group"
                    >
                         <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <ArrowRight size={24} />
                         </div>
                         <span className="font-bold text-sm tracking-widest uppercase">View All</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. Footer Teaser */}
        <div className="bg-slate-50 py-24 border-t border-slate-200">
            <div className="max-w-3xl mx-auto text-center px-6">
                <h3 className="text-3xl font-serif text-slate-900 mb-6">Ready to organize your logic?</h3>
                <p className="text-slate-500 mb-8">
                    Join the platform that professional architects use to visualize their thinking process.
                </p>
                <div className="flex justify-center gap-4">
                     <Link to="/library" className="px-8 py-4 bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
                        Browse Assets
                    </Link>
                    <Link to="/trend" className="px-8 py-4 bg-white text-slate-900 border border-slate-200 font-bold text-sm hover:border-slate-400 transition-all">
                        Try Trend Lab
                    </Link>
                </div>
            </div>
        </div>

      </section>

      <style>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 30s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Home;
