import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Network, Calendar, Clock, ArrowRight, Trash2, FolderOpen } from 'lucide-react';
import { SavedMap, ProjectFolder } from '../types';

const MyProjects: React.FC = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  useEffect(() => {
    const loadedFolders = localStorage.getItem('ylab_folders');
    const loadedMaps = localStorage.getItem('ylab_saved_maps');
    
    if (loadedFolders) setFolders(JSON.parse(loadedFolders));
    if (loadedMaps) setSavedMaps(JSON.parse(loadedMaps));
  }, []);

  const filteredMaps = selectedFolderId === 'all' 
    ? savedMaps 
    : savedMaps.filter(map => map.folderId === selectedFolderId || (selectedFolderId === 'default' && !map.folderId));

  const handleDeleteMap = (e: React.MouseEvent, mapId: string) => {
    e.stopPropagation();
    if (window.confirm("정말로 이 맵을 삭제하시겠습니까?")) {
        const updatedMaps = savedMaps.filter(m => m.id !== mapId);
        setSavedMaps(updatedMaps);
        localStorage.setItem('ylab_saved_maps', JSON.stringify(updatedMaps));
    }
  };

  const getFolderName = (folderId: string) => {
      const folder = folders.find(f => f.id === folderId);
      return folder ? folder.name : 'General Project';
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <FolderOpen className="text-blue-600" /> My Projects
        </h1>
        <p className="text-slate-500">
            저장된 브레인스토밍 맵과 프로젝트를 관리하세요.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filter */}
        <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Folders</h3>
                <nav className="space-y-1">
                    <button
                        onClick={() => setSelectedFolderId('all')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            selectedFolderId === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <span className="flex items-center gap-2"><Folder size={16} /> All Projects</span>
                        <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">{savedMaps.length}</span>
                    </button>
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => setSelectedFolderId(folder.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                selectedFolderId === folder.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                             <span className="flex items-center gap-2 truncate"><Folder size={16} /> {folder.name}</span>
                             <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                                {savedMaps.filter(m => m.folderId === folder.id || (!m.folderId && folder.id === 'default')).length}
                             </span>
                        </button>
                    ))}
                </nav>
            </div>
        </aside>

        {/* Map Grid */}
        <main className="flex-1">
            {filteredMaps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMaps.map(map => (
                        <div 
                            key={map.id}
                            onClick={() => navigate(`/brainstorming?mapId=${map.id}`)}
                            className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-48"
                        >
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        <Network size={12} />
                                        <span>Mind Map</span>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDeleteMap(e, map.id)}
                                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors line-clamp-1">{map.name}</h3>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                                    <Folder size={12} /> {getFolderName(map.folderId)}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {map.nodes.length} Concepts • {map.nodes.filter(n => n.isAiGenerated).length} AI Suggestions
                                </p>
                            </div>
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(map.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(map.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                    <Network size={48} className="mb-4 opacity-50" />
                    <p className="font-medium">저장된 맵이 없습니다.</p>
                    <p className="text-sm mt-1">Brainstorming Canvas에서 'Save Map'을 눌러 저장해보세요.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default MyProjects;