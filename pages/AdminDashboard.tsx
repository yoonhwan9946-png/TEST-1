
import React, { useState, useEffect } from 'react';
import { Plus, Settings, Image as ImageIcon, FileText, Save, Layout, Trash2, Upload } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'settings' | 'home'>('upload');

  // --- Home Settings State ---
  const [introImage, setIntroImage] = useState<string>('');
  const [bgImages, setBgImages] = useState<string[]>([]);
  
  // Default Images (Fallback)
  const DEFAULT_INTRO = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop";
  const DEFAULT_BGS = [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=2071&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2031&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1355157121228-568eb22961d3?q=80&w=2071&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1577772714571-555df8524d77?q=80&w=2070&auto=format&fit=crop"  
  ];

  // Load Settings from LocalStorage
  useEffect(() => {
    const savedIntro = localStorage.getItem('ylab_home_intro');
    const savedBgs = localStorage.getItem('ylab_home_bgs');

    setIntroImage(savedIntro || DEFAULT_INTRO);
    try {
        setBgImages(savedBgs ? JSON.parse(savedBgs) : DEFAULT_BGS);
    } catch (e) {
        console.error("Failed to parse background images setting", e);
        setBgImages(DEFAULT_BGS);
    }
  }, []);

  // Helper: File to Base64
  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.result) callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHomeSettings = () => {
      try {
        localStorage.setItem('ylab_home_intro', introImage);
        localStorage.setItem('ylab_home_bgs', JSON.stringify(bgImages));
        alert("홈 화면 설정이 저장되었습니다.");
      } catch (e) {
          alert("저장 용량을 초과하여 이미지를 저장할 수 없습니다. (데모 환경 제한)");
      }
  };

  const handleAddBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          handleImageUpload(e.target.files[0], (base64) => {
              setBgImages(prev => [...prev, base64]);
          });
      }
  };

  const handleRemoveBgImage = (index: number) => {
      setBgImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleIntroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          handleImageUpload(e.target.files[0], (base64) => {
              setIntroImage(base64);
          });
      }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24 shadow-sm">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <h3 className="text-slate-900 font-medium">Admin</h3>
                <p className="text-xs text-slate-500">Manager Dashboard</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('upload')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'upload' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Plus size={18} />
                새 자산 업로드
              </button>
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'home' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Layout size={18} />
                홈 화면 설정
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Settings size={18} />
                환경 설정
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          {activeTab === 'upload' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">새 자산 등록</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">제목</label>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="예: 도심형 오피스 매스 프로세스" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">카테고리</label>
                    <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                      <option>Logic Flow (논리 전개)</option>
                      <option>Mass Process (매스 생성)</option>
                      <option>Eco-friendly (친환경)</option>
                      <option>Circulation (동선)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">태그 (쉼표로 구분)</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="Urban, Green, Smart..." />
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer bg-slate-50">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600">클릭하여 이미지 업로드 또는 드래그 앤 드롭</p>
                  <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG (Max 10MB)</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">취소</button>
                  <button type="submit" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm">
                    <Save size={16} /> 저장하기
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'home' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-bold text-slate-900">홈 화면 설정</h2>
                      <button 
                        onClick={handleSaveHomeSettings}
                        className="px-5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-bold flex items-center gap-2 shadow-sm"
                      >
                          <Save size={16} /> 변경사항 저장
                      </button>
                  </div>

                  <div className="space-y-10">
                      {/* 1. Intro Image Section */}
                      <section>
                          <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">인트로 애니메이션 이미지</h3>
                                <p className="text-xs text-slate-500">홈페이지 최초 입장 시, 분할되어 내려오는 메인 이미지입니다.</p>
                            </div>
                            <div className="relative">
                                <input type="file" id="intro-upload" onChange={handleIntroChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                <label htmlFor="intro-upload" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
                                    <Upload size={14} /> 이미지 변경
                                </label>
                            </div>
                          </div>
                          
                          <div className="w-full aspect-[21/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                              {introImage && <img src={introImage} alt="Intro" className="w-full h-full object-cover" />}
                              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <span className="text-white font-bold">Current Intro Image</span>
                              </div>
                          </div>
                      </section>

                      {/* 2. Background Slideshow Section */}
                      <section>
                          <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">메인 배경 이미지 (슬라이드쇼)</h3>
                                <p className="text-xs text-slate-500">검색창 뒤에서 순환되는 배경 이미지 목록입니다.</p>
                            </div>
                            <div className="relative">
                                <input type="file" id="bg-upload" onChange={handleAddBgImage} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                <label htmlFor="bg-upload" className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors">
                                    <Plus size={14} /> 추가하기
                                </label>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {bgImages.map((img, idx) => (
                                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                                      <img src={img} alt={`BG ${idx}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <button 
                                            onClick={() => handleRemoveBgImage(idx)}
                                            className="p-2 bg-white/20 hover:bg-red-500 rounded-full text-white transition-colors backdrop-blur-sm"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                      <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 rounded font-mono">0{idx + 1}</span>
                                  </div>
                              ))}
                              {bgImages.length === 0 && (
                                  <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                                      등록된 배경 이미지가 없습니다.
                                  </div>
                              )}
                          </div>
                      </section>
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">시스템 설정</h2>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <h4 className="text-slate-900 font-medium">유지보수 모드</h4>
                        <p className="text-sm text-slate-500">일반 사용자의 접근을 차단합니다.</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-300 rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <h4 className="text-slate-900 font-medium">다크 모드 강제</h4>
                        <p className="text-sm text-slate-500">모든 사용자에게 다크 테마를 적용합니다.</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-300 rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
