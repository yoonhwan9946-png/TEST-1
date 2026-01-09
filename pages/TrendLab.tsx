
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sparkles, ArrowUpRight, ArrowRight, Loader2, X, Hash, Calendar, ChevronLeft, ChevronRight, GripHorizontal, PenTool, Edit3, Share2, Bookmark } from 'lucide-react';
import { fetchTrendAnalysis } from '../services/geminiService';
import { TrendResult, TrendItem } from '../types';

// ... (Mock Data & Content same as before) ...
const TREND_CATEGORIES = ['All', 'Sustainability', 'Technology', 'Materiality', 'Social', 'Urbanism'];

const DUMMY_CONTENT = `
    <div class="prose prose-lg max-w-none">
        <p class="lead text-xl text-slate-600 font-serif italic mb-8">
            현대 건축에서 자연과의 통합은 더 이상 선택이 아닌 필수 요소로 자리 잡았습니다. 
            바이오필릭 디자인(Biophilic Design)은 인간의 본능적인 자연 회귀 욕구를 공간에 구현하여, 
            심리적 안정과 창의성을 극대화하는 전략입니다.
        </p>
        
        <h3 class="text-2xl font-bold text-slate-900 mt-12 mb-6">1. 자연의 직접적 통합 (Direct Nature)</h3>
        <p class="mb-6 text-slate-700 leading-relaxed">
            건물 내부에 실제 식물, 물, 빛을 적극적으로 도입하는 방식입니다. 싱가포르의 쥬얼 창이 공항이나 
            아마존의 스피어스(The Spheres)가 대표적인 예시입니다. 이러한 공간은 단순한 조경을 넘어, 
            실내 공기질을 정화하고 온습도를 조절하는 기능적 역할까지 수행합니다.
        </p>
        
        <img src="https://images.unsplash.com/photo-1524069290683-0457abfe42c3?q=80&w=2070&auto=format&fit=crop" class="w-full h-[500px] object-cover rounded-xl my-10 shadow-xl" alt="Interior Garden" />

        <h3 class="text-2xl font-bold text-slate-900 mt-12 mb-6">2. 자연의 간접적 유추 (Natural Analogues)</h3>
        <p class="mb-6 text-slate-700 leading-relaxed">
            직접적인 식재가 어려운 경우, 유기적인 형태나 자연의 패턴(프랙탈), 천연 재료의 질감을 활용합니다. 
            목재의 나이테가 주는 따뜻함이나, 나뭇잎 사이로 비치는 햇살(Komorebi)을 모방한 조명 설계 등이 이에 해당합니다.
        </p>

        <h3 class="text-2xl font-bold text-slate-900 mt-12 mb-6">3. 공간과 장소의 본질 (Nature of the Space)</h3>
        <p class="mb-20 text-slate-700 leading-relaxed">
            인간이 진화하며 선호하게 된 공간적 특성, 예를 들어 전망(Prospect)과 피신(Refuge)의 균형을 설계에 반영합니다. 
            탁 트인 시야를 제공하면서도 등 뒤가 보호받는 느낌을 주는 공간 구성은 심리적 안정감을 줍니다.
        </p>
    </div>
`;

const TREND_ARCHIVE: TrendItem[] = [
  // ... (Same mock archive items) ...
  {
    id: 1,
    category: "Sustainability",
    title: "Biophilic Integration",
    subtitle: "Nature as Infrastructure",
    description: "단순한 녹화를 넘어, 건축물의 구조와 시스템에 자연을 통합하여 사용자 웰빙과 에너지 효율을 동시에 달성하는 접근법입니다.",
    image: "https://images.unsplash.com/photo-1518005052387-dc04886bc3a7?q=80&w=2070&auto=format&fit=crop",
    gallery: [
        "https://images.unsplash.com/photo-1518005052387-dc04886bc3a7?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1466781783310-a2ac7d6f6028?q=80&w=2071&auto=format&fit=crop"
    ],
    tags: ["Green", "Organic", "Wellness"],
    date: "Mar 2024",
    author: "Future Lab",
    content: DUMMY_CONTENT
  },
  {
    id: 2,
    category: "Technology",
    title: "Digital Twin Cities",
    subtitle: "Virtual Urbanism",
    description: "물리적 도시 환경을 가상 공간에 실시간으로 복제하여, 에너지 소비와 교통 흐름을 시뮬레이션하고 최적화하는 스마트 시티 기술입니다.",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop",
    gallery: [
        "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1535957998253-26ae1ef29506?q=80&w=2036&auto=format&fit=crop"
    ],
    tags: ["Data", "Simulation", "Smart City"],
    date: "Feb 2024",
    author: "Tech Insight",
    content: DUMMY_CONTENT
  },
  {
    id: 3,
    category: "Materiality",
    title: "Adaptive Reuse",
    subtitle: "Historical Layering",
    description: "기존 건축물의 역사적 가치를 보존하면서 현대적인 기능을 부여하는 재생 건축. 탄소 발자국을 줄이는 가장 효과적인 방법입니다.",
    image: "https://images.unsplash.com/photo-1555636222-cae831e670b3?q=80&w=2077&auto=format&fit=crop",
    gallery: [
        "https://images.unsplash.com/photo-1555636222-cae831e670b3?q=80&w=2077&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2084&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582037928769-181f2644ec27?q=80&w=2070&auto=format&fit=crop"
    ],
    tags: ["Regeneration", "Heritage", "Carbon"],
    date: "Jan 2024",
    author: "Heritage Group",
    content: DUMMY_CONTENT
  },
  {
    id: 4,
    category: "Social",
    title: "Third Places",
    subtitle: "Community Anchors",
    description: "집(제1의 장소)과 직장(제2의 장소)이 아닌, 격식 없이 교류하며 사회적 유대감을 형성할 수 있는 열린 커뮤니티 공간의 중요성이 대두됩니다.",
    image: "https://images.unsplash.com/photo-1517502884422-41e157d252b5?q=80&w=2069&auto=format&fit=crop",
    gallery: [
        "https://images.unsplash.com/photo-1517502884422-41e157d252b5?q=80&w=2069&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1577772714571-555df8524d77?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=2070&auto=format&fit=crop"
    ],
    tags: ["Community", "Public", "Interaction"],
    date: "Dec 2023",
    author: "Social Lab",
    content: DUMMY_CONTENT
  },
  {
    id: 5,
    category: "Urbanism",
    title: "15-Minute City",
    subtitle: "Hyper-Proximity",
    description: "도보나 자전거로 15분 이내에 주거, 업무, 상업, 의료, 교육 등 필수 서비스에 접근할 수 있도록 도시 구조를 재편하는 개념입니다.",
    image: "https://images.unsplash.com/photo-1449824913929-2b3a3e35792c?q=80&w=2070&auto=format&fit=crop",
    gallery: [
         "https://images.unsplash.com/photo-1449824913929-2b3a3e35792c?q=80&w=2070&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1444723121867-2291d1d5c611?q=80&w=2065&auto=format&fit=crop"
    ],
    tags: ["Mobility", "Access", "Zoning"],
    date: "Nov 2023",
    author: "Urban Thinker",
    content: DUMMY_CONTENT
  },
  {
    id: 6,
    category: "Materiality",
    title: "Mass Timber",
    subtitle: "New Structure",
    description: "철근 콘크리트를 대체할 수 있는 공학 목재의 발전. 지속 가능성과 시공 속도, 심미적 가치를 모두 충족하는 미래형 구조재입니다.",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=2069&auto=format&fit=crop",
    gallery: [
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=2069&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1621262915830-4e365027581a?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop"
    ],
    tags: ["Wood", "Structure", "Prefab"],
    date: "Oct 2023",
    author: "Material Lab",
    content: DUMMY_CONTENT
  }
];

const TrendLab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [archiveData, setArchiveData] = useState<TrendItem[]>(TREND_ARCHIVE);
  const [activeCategory, setActiveCategory] = useState('All');

  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrendResult | null>(null);

  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const filteredTrends = activeCategory === 'All' 
    ? archiveData 
    : archiveData.filter(item => item.category === activeCategory);

  const openViewer = (item: TrendItem) => {
      setSelectedTrend(item);
      setCurrentSlideIndex(0);
      setDragOffset(0);
      setScrollProgress(0);
  };

  useEffect(() => {
    const savedTrends = localStorage.getItem('ylab_trends');
    let currentArchive = [...TREND_ARCHIVE];
    
    if (savedTrends) {
        try {
            const parsedTrends: TrendItem[] = JSON.parse(savedTrends);
            currentArchive = [...parsedTrends, ...TREND_ARCHIVE];
            setArchiveData(currentArchive);
        } catch (e) {
            console.error("Failed to parse saved trends", e);
        }
    }

    if (location.state && (location.state as any).openTrendId) {
        const targetId = (location.state as any).openTrendId;
        const targetItem = currentArchive.find(t => t.id === targetId);
        if (targetItem) {
            openViewer(targetItem);
            window.history.replaceState({}, document.title);
        }
    }
  }, [location.state]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);
    setResult(null);
    
    const data = await fetchTrendAnalysis(keyword);
    
    if (!data || data.description.includes("일시적인 오류")) {
        alert("API connection failed or key missing. Please check your deployment settings.");
    }
    
    setResult(data);
    setIsLoading(false);
  };

  const closeViewer = () => {
      setSelectedTrend(null);
      setCurrentSlideIndex(0);
  };

  const nextSlide = () => {
      if (!selectedTrend) return;
      if (currentSlideIndex < selectedTrend.gallery.length - 1) {
          setCurrentSlideIndex(prev => prev + 1);
      }
  };

  const prevSlide = () => {
      if (!selectedTrend) return;
      if (currentSlideIndex > 0) {
          setCurrentSlideIndex(prev => prev - 1);
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const currentX = e.clientX;
      const diff = currentX - startX;
      setDragOffset(diff);
  };

  const handleMouseUp = () => {
      if (!isDragging || !selectedTrend) return;
      const threshold = 100;
      if (dragOffset < -threshold) {
          nextSlide();
      } else if (dragOffset > threshold) {
          prevSlide();
      }
      setIsDragging(false);
      setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      setDragOffset(diff);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const windowHeight = window.innerHeight;
      const progress = Math.min(1, scrollTop / windowHeight);
      setScrollProgress(progress);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ... (Render code remains exactly same as existing file, just included to complete the update) ... */}
      <section className="relative pt-32 pb-20 px-6 lg:px-12 border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-12">
                <div>
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                        Trend Archive
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6">
                        FUTURE<br/>
                        <span className="text-slate-400">INSIGHTS.</span>
                    </h1>
                    <p className="text-slate-600 max-w-xl text-lg leading-relaxed font-medium">
                        Curated collection of architectural trends and logic. <br/>
                        Bridging abstract concepts with concrete visual assets.
                    </p>
                </div>
                
                <div className="flex flex-col items-end gap-6">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/trend/editor')}
                            className="group flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-xs hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <Edit3 size={14} />
                            Write Post
                        </button>
                        <button 
                            onClick={() => setIsAnalyzerOpen(true)}
                            className="group flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                        >
                            <Sparkles size={16} />
                            <span>AI Trend Analysis</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        {TREND_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                    activeCategory === cat 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-12 bg-slate-50 min-h-screen">
         <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {filteredTrends.map((item, index) => (
                    <article 
                        key={item.id} 
                        onClick={() => openViewer(item)}
                        className="group cursor-pointer flex flex-col h-full"
                    >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-none mb-6 bg-slate-200">
                            <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <span className="text-white text-xs font-bold bg-blue-600 px-2 py-1 inline-block mb-2">READ POST</span>
                                </div>
                            </div>
                            <div className="absolute top-3 right-3 text-white/50 group-hover:text-white transition-colors">
                                <GripHorizontal size={24} />
                            </div>
                        </div>

                        <div className="flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-3 border-dashed">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{item.category}</span>
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                    <Calendar size={10} /> {item.date}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors leading-tight">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium mb-4 italic font-serif">
                                {item.subtitle}
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3">
                                {item.description}
                            </p>
                            <div className="mt-auto pt-4 flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <ArrowUpRight className="text-slate-300 group-hover:text-slate-900 transition-colors" size={20} />
                            </div>
                        </div>
                    </article>
                ))}
            </div>
         </div>
      </section>

      {selectedTrend && (
          <div className="fixed inset-0 z-[200] bg-white animate-fade-in overflow-y-auto" onScroll={handleScroll}>
              <div className="sticky top-0 left-0 right-0 h-20 flex items-center justify-between px-8 z-[220] mix-blend-difference text-white pointer-events-none">
                  <div className="flex items-center gap-4 pointer-events-auto">
                      <span className="text-lg font-black tracking-tighter">Y.LAB</span>
                      <span className="text-xs font-mono opacity-60">
                          {String(currentSlideIndex + 1).padStart(2, '0')} / {String(selectedTrend.gallery.length).padStart(2, '0')}
                      </span>
                  </div>
                  <div className="flex items-center gap-4 pointer-events-auto">
                    <button onClick={() => navigate('/trend/editor', { state: { trend: selectedTrend } })} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <Edit3 size={24} />
                    </button>
                    <button onClick={closeViewer} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"><X size={32} /></button>
                  </div>
              </div>

              <div className="sticky top-0 w-full h-screen z-[10]" style={{ transform: `translateY(${scrollProgress * -30}vh) scale(${1 - scrollProgress * 0.05})`, opacity: 1 - scrollProgress * 0.5 }}>
                  <div className="relative w-full h-full overflow-hidden bg-black select-none cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp} ref={sliderRef}>
                      <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(-${currentSlideIndex * 100}% + ${dragOffset}px))`, width: `${selectedTrend.gallery.length * 100}%` }}>
                          {selectedTrend.gallery.map((img, idx) => (
                              <div key={idx} className="w-full h-full relative flex-shrink-0">
                                    <img src={img} alt={`${selectedTrend.title} - ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                              </div>
                          ))}
                      </div>
                      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 transition-opacity duration-300 ${scrollProgress > 0.1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                          <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} disabled={currentSlideIndex === 0} className="p-4 text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-0 hidden md:block"><ChevronLeft size={48} strokeWidth={1} /></button>
                          <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} disabled={currentSlideIndex === selectedTrend.gallery.length - 1} className="p-4 text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-0 hidden md:block"><ChevronRight size={48} strokeWidth={1} /></button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white pointer-events-none">
                          <div className="max-w-7xl mx-auto flex flex-col items-start gap-4" style={{ opacity: 1 - scrollProgress * 2 }}>
                              <div className="flex items-center gap-3 mb-2">
                                  <span className="px-2 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest">{selectedTrend.category}</span>
                                  <span className="text-xs font-mono opacity-70">{selectedTrend.date}</span>
                              </div>
                              <h2 className="text-5xl md:text-8xl font-black tracking-tight leading-none">{selectedTrend.title}</h2>
                              <p className="text-xl md:text-2xl font-light opacity-90 leading-relaxed font-serif italic">{selectedTrend.subtitle}</p>
                              <div className="flex gap-2 mt-4">{selectedTrend.tags.map(tag => (<span key={tag} className="text-[10px] font-bold border border-white/30 px-3 py-1 rounded-full">{tag}</span>))}</div>
                              <div className="mt-8 animate-bounce"><span className="text-[10px] uppercase tracking-[0.2em] opacity-70">Scroll to Read</span></div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="relative z-[20] bg-white min-h-screen -mt-20 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
                  <div className="max-w-4xl mx-auto px-6 py-24">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-8 mb-12">
                           <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{selectedTrend.author.substring(0, 2).toUpperCase()}</div>
                               <div><div className="text-sm font-bold text-slate-900">{selectedTrend.author}</div><div className="text-xs text-slate-500">Published on {selectedTrend.date}</div></div>
                           </div>
                           <div className="flex gap-2"><button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Share2 size={20} /></button><button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Bookmark size={20} /></button></div>
                       </div>
                       {selectedTrend.content ? (<div dangerouslySetInnerHTML={{ __html: selectedTrend.content }} />) : (<div className="text-center py-20 text-slate-400"><p>No content available for this trend.</p></div>)}
                        <div className="mt-20 pt-10 border-t border-slate-200">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Related Trends</h4>
                            <div className="grid grid-cols-2 gap-6">
                                {archiveData.filter(t => t.id !== selectedTrend.id).slice(0, 2).map(t => (
                                    <div key={t.id} className="group cursor-pointer" onClick={() => { closeViewer(); setTimeout(() => openViewer(t), 100); }}>
                                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden mb-3"><img src={t.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                                        <h5 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t.title}</h5>
                                    </div>
                                ))}
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      )}

      <div className={`fixed inset-y-0 right-0 z-[150] w-full md:w-[480px] bg-white shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col border-l border-slate-200 ${isAnalyzerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="bg-slate-900 text-white p-8 flex items-start justify-between">
                <div><div className="flex items-center gap-2 mb-2 text-blue-400"><Sparkles size={18} /><span className="text-xs font-bold uppercase tracking-widest">AI Lab Mode</span></div><h2 className="text-2xl font-bold">Trend Analyzer</h2><p className="text-slate-400 text-sm mt-2">Enter a keyword to generate architectural concepts and visual suggestions.</p></div>
                <button onClick={() => setIsAnalyzerOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <input type="text" className="w-full pl-4 pr-12 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" placeholder="e.g. Carbon Neutrality..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                        <button type="submit" disabled={isLoading || !keyword.trim()} className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}</button>
                    </div>
                </form>
                {result ? (
                    <div className="animate-fade-in-up space-y-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><span className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 block">Analysis Report</span><h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-4">"{result.keyword}"</h3><p className="text-sm text-slate-600 leading-relaxed">{result.description}</p></div>
                        <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Hash size={12} /> Suggested Concepts</h4><div className="space-y-3">{result.suggestedConcepts.map((concept, idx) => (<div key={idx} className="group bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"><span className="font-bold text-slate-800 text-sm">{concept}</span><ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" /></div>))}</div></div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start"><div className="mt-0.5 min-w-[16px]"><Sparkles className="text-blue-600" size={16} /></div><p className="text-xs text-blue-800 leading-relaxed"><strong>Tip:</strong> Use these concepts in the 'Asset Library' to find matching diagrams or mockups.</p></div>
                    </div>
                ) : (
                    <div className="text-center py-12"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-300 mb-4"><Sparkles size={24} /></div><h4 className="text-slate-900 font-bold mb-2">Ready to Analyze</h4><p className="text-xs text-slate-500 max-w-[200px] mx-auto mb-8">Enter a keyword above to get AI-powered architectural insights.</p><div className="text-left"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Popular Keywords</span><div className="flex flex-wrap gap-2">{['Smart City', 'Biophilic', 'Modular', 'Metaverse', 'Zero Energy'].map((tag) => (<button key={tag} onClick={() => setKeyword(tag)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors">{tag}</button>))}</div></div></div>
                )}
            </div>
      </div>
      {isAnalyzerOpen && (<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140] animate-fade-in" onClick={() => setIsAnalyzerOpen(false)} />)}
    </div>
  );
};

export default TrendLab;
