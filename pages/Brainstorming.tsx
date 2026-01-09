
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Bookmark, Plus, Folder, 
  Share2, Download, Zap, ChevronRight, ChevronDown, X, 
  Sparkles, Maximize2, Minimize2, MousePointer2,
  Loader2, FolderPlus, Trash2, CheckCircle2, Layout,
  Bot, BookOpen, ExternalLink, FileText, ToggleLeft, ToggleRight,
  Save, Network, Calendar, Clock, FilePlus
} from 'lucide-react';
import { fetchBrainstormingTerms } from '../services/geminiService';
import { 
  GraphNode, BrainstormItem, Bookmark as BookmarkType, 
  ProjectFolder, BrainstormMode, ExpansionType, SavedMap 
} from '../types';

const Brainstorming: React.FC = () => {
    // ... (Hooks and State same as before) ...
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialKeyword = searchParams.get('keyword');
    const mapIdParam = searchParams.get('mapId');

    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const nodesRef = useRef<GraphNode[]>([]);
    const draggedNodeIdRef = useRef<string | null>(null);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [hasMoved, setHasMoved] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<BrainstormMode>('BROAD');
    const [isCreativeMode, setIsCreativeMode] = useState(false); 
    
    const [folders, setFolders] = useState<ProjectFolder[]>([
        { id: 'default', name: 'General Project', createdAt: Date.now() }
    ]);
    const [activeFolderId, setActiveFolderId] = useState<string>('default');
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
    const [currentMapId, setCurrentMapId] = useState<string | null>(null); 
    
    const [isLeftSidebarHovered, setIsLeftSidebarHovered] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['default']);
    const [hoveredBookmark, setHoveredBookmark] = useState<{ bookmark: BookmarkType, y: number } | null>(null);

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [mapNameInput, setMapNameInput] = useState('');
    const [selectedSaveFolderId, setSelectedSaveFolderId] = useState('default');

    const canvasRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);

    // ... (Initial Data Loading Effects same as before) ...
    useEffect(() => {
        const savedBookmarks = localStorage.getItem('ylab_bookmarks');
        const savedFolders = localStorage.getItem('ylab_folders');
        const savedMapsData = localStorage.getItem('ylab_saved_maps');
        
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
        if (savedFolders) setFolders(JSON.parse(savedFolders));
        if (savedMapsData) setSavedMaps(JSON.parse(savedMapsData));
    }, []);

    useEffect(() => {
        if (mapIdParam && savedMaps.length > 0) {
            const mapToLoad = savedMaps.find(m => m.id === mapIdParam);
            if (mapToLoad) {
                const deepCopiedNodes = mapToLoad.nodes.map(n => ({...n}));
                nodesRef.current = deepCopiedNodes;
                setNodes(deepCopiedNodes); 
                setActiveFolderId(mapToLoad.folderId);
                setCurrentMapId(mapToLoad.id);
                setScale(1);
                setOffset({ x: 0, y: 0 });
                setSelectedNodeId(null);
                draggedNodeIdRef.current = null;
                return; 
            }
        }

        if (!mapIdParam && initialKeyword && nodesRef.current.length === 0) {
            setCurrentMapId(null);
            const rootNode: GraphNode = {
                id: 'root',
                term: initialKeyword,
                shortLabel: initialKeyword.length > 6 ? initialKeyword.substring(0, 6) + '..' : initialKeyword,
                description: 'Starting Concept',
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                parentId: null,
                level: 0,
                nodeType: 'TERM',
                expansionType: 'ROOT',
                sourceMode: undefined,
                isAiGenerated: false,
                sources: [] 
            };
            nodesRef.current = [rootNode];
            setNodes([rootNode]);
            setSelectedNodeId('root');
            handleExpand(rootNode, 'ROOT');
        }
    }, [mapIdParam, savedMaps, initialKeyword]);

    useEffect(() => {
        localStorage.setItem('ylab_bookmarks', JSON.stringify(bookmarks));
        localStorage.setItem('ylab_folders', JSON.stringify(folders));
        localStorage.setItem('ylab_saved_maps', JSON.stringify(savedMaps));
    }, [bookmarks, folders, savedMaps]);

    // ... (Physics Engine same as before) ...
    const applyPhysics = useCallback(() => {
        const currentNodes = nodesRef.current;
        if (currentNodes.length === 0) {
            requestRef.current = requestAnimationFrame(applyPhysics);
            return;
        }

        let isChanged = false;
        const repulsionRadius = 180; 
        const repulsionStrength = 0.08; 

        for (let i = 0; i < currentNodes.length; i++) {
            const nodeA = currentNodes[i];
            if (nodeA.id === draggedNodeIdRef.current) continue;

            for (let j = i + 1; j < currentNodes.length; j++) {
                const nodeB = currentNodes[j];
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < repulsionRadius && distance > 0) {
                    const force = (repulsionRadius - distance) / distance * repulsionStrength;
                    const fx = dx * force;
                    const fy = dy * force;

                    if (nodeA.id !== draggedNodeIdRef.current) {
                        nodeA.x -= fx;
                        nodeA.y -= fy;
                        isChanged = true;
                    }
                    if (nodeB.id !== draggedNodeIdRef.current) {
                        nodeB.x += fx;
                        nodeB.y += fy;
                        isChanged = true;
                    }
                }
            }
        }

        if (isChanged || draggedNodeIdRef.current) {
            setNodes([...currentNodes]);
        }
        requestRef.current = requestAnimationFrame(applyPhysics);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(applyPhysics);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [applyPhysics]);

    // --- Logic Handlers ---

    const handleExpand = async (node: GraphNode, type: ExpansionType) => {
        if (loading) return;
        setLoading(true);
        try {
            const newTerms = await fetchBrainstormingTerms(node.term, type, [], mode, isCreativeMode);
            
            // Error Handling if API fails
            if (newTerms.length === 1 && newTerms[0].term === "오류 발생") {
                alert("API connection failed. Please check your deployment settings for API_KEY.");
                setLoading(false);
                return;
            }
            
            if (newTerms.length === 0) return;

            const angleStep = (2 * Math.PI) / newTerms.length;
            const radius = 180;
            const startAngle = Math.random() * Math.PI; 

            const newNodes: GraphNode[] = newTerms.map((item, index) => {
                const angle = startAngle + index * angleStep;
                return {
                    ...item,
                    id: `${node.id}-${index}-${Date.now()}`,
                    x: node.x + Math.cos(angle) * radius,
                    y: node.y + Math.sin(angle) * radius,
                    parentId: node.id,
                    level: node.level + 1,
                    nodeType: 'TERM',
                    sourceMode: mode
                };
            });
            
            nodesRef.current = [...nodesRef.current, ...newNodes];
            setNodes(nodesRef.current);
            
        } catch (error) {
            console.error(error);
            alert("Unexpected error during expansion.");
        } finally {
            setLoading(false);
        }
    };

    // ... (Rest of component including render, handlers for folder/save, same as before) ...
    const toggleBookmark = (node: GraphNode) => {
        const isBookmarked = bookmarks.some(b => b.term === node.term);
        if (isBookmarked) {
            setBookmarks(prev => prev.filter(b => b.term !== node.term));
        } else {
            const newBookmark: BookmarkType = {
                term: node.term,
                description: node.description,
                timestamp: Date.now(),
                folderId: activeFolderId
            };
            setBookmarks(prev => [...prev, newBookmark]);
        }
    };

    const handleQuickSave = () => {
        if (currentMapId) {
            const nodesToSave = nodesRef.current.map(n => ({...n}));
            setSavedMaps(prev => prev.map(m => m.id === currentMapId ? { ...m, nodes: nodesToSave, updatedAt: Date.now() } : m));
            alert("Map saved successfully!");
        } else {
            handleOpenSaveModal();
        }
    };

    const handleSaveAs = () => handleOpenSaveModal();

    const handleOpenSaveModal = () => {
        const rootNode = nodesRef.current.find(n => n.expansionType === 'ROOT' || !n.parentId);
        const defaultName = rootNode ? `${rootNode.term} Map` : `MindMap ${new Date().toLocaleDateString()}`;
        setMapNameInput(defaultName);
        setSelectedSaveFolderId(activeFolderId);
        setShowSaveModal(true);
    };

    const handleSaveConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mapNameInput.trim()) return;
        const newMapId = `map-${Date.now()}`;
        const nodesToSave = nodesRef.current.map(n => ({...n}));
        const newMap: SavedMap = {
            id: newMapId,
            name: mapNameInput.trim(),
            nodes: nodesToSave,
            folderId: selectedSaveFolderId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setSavedMaps(prev => [...prev, newMap]);
        setCurrentMapId(newMapId);
        setShowSaveModal(false);
        setSearchParams({ mapId: newMapId });
        alert(`Map "${newMap.name}" saved to project successfully!`);
    };

    const handleLoadMap = (map: SavedMap) => {
        if (map.id === currentMapId) return;
        if (window.confirm(`Load map "${map.name}"? Current unsaved changes will be lost.`)) {
             navigate(`/brainstorming?mapId=${map.id}`);
        }
    };

    const handleDeleteMap = (mapId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this saved map?")) {
            setSavedMaps(prev => prev.filter(m => m.id !== mapId));
            if (currentMapId === mapId) {
                setCurrentMapId(null);
                setSearchParams({});
            }
        }
    };

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        const newFolder: ProjectFolder = { id: `folder-${Date.now()}`, name: newFolderName.trim(), createdAt: Date.now() };
        setFolders(prev => [...prev, newFolder]);
        setActiveFolderId(newFolder.id);
        setExpandedFolders(prev => [...prev, newFolder.id]);
        setNewFolderName('');
    };

    const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (folderId === 'default') { alert("기본 폴더는 삭제할 수 없습니다."); return; }
        if (window.confirm("폴더를 삭제하시겠습니까? 내부의 맵과 북마크도 삭제됩니다.")) {
            setFolders(prev => prev.filter(f => f.id !== folderId));
            setBookmarks(prev => prev.filter(b => b.folderId !== folderId));
            setSavedMaps(prev => prev.filter(m => m.folderId !== folderId)); 
            if (activeFolderId === folderId) setActiveFolderId('default');
        }
    };

    const handleDeleteBookmark = (term: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setBookmarks(prev => prev.filter(b => b.term !== term));
    };

    const toggleFolderExpand = (folderId: string) => {
        setExpandedFolders(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.sidebar-left') || target.closest('.sidebar-right') || target.closest('.header-controls') || target.closest('.modal-overlay')) return;
        const nodeElement = target.closest('[data-node-id]');
        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            if (nodeId) {
                draggedNodeIdRef.current = nodeId;
                setHasMoved(false);
            }
        } else {
            setIsPanning(true);
        }
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) setHasMoved(true);
        if (draggedNodeIdRef.current) {
            const node = nodesRef.current.find(n => n.id === draggedNodeIdRef.current);
            if (node) {
                node.x += dx / scale;
                node.y += dy / scale;
            }
        } else if (isPanning) {
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        }
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        draggedNodeIdRef.current = null;
    };

    const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if (!hasMoved) setSelectedNodeId(nodeId);
    };

    const handleWheel = (e: React.WheelEvent) => {
        const scaleMultiplier = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(3, scale * scaleMultiplier));
        setScale(newScale);
    };

    const selectedNodeData = nodes.find(n => n.id === selectedNodeId);
    const isBookmarked = selectedNodeData ? bookmarks.some(b => b.term === selectedNodeData.term) : false;

    const getNodeClasses = (node: GraphNode, isSelected: boolean) => {
        const baseClasses = "absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-full border-2 transition-all duration-300 shadow-lg cursor-grab active:cursor-grabbing";
        if (isSelected) {
            if (node.sourceMode === 'DEEP') {
                return `${baseClasses} w-32 h-32 bg-purple-600 border-purple-400 text-white z-20 scale-110 shadow-purple-500/30`;
            } else if (node.sourceMode === 'BROAD') {
                return `${baseClasses} w-32 h-32 bg-cyan-600 border-cyan-400 text-white z-20 scale-110 shadow-cyan-500/30`;
            } else {
                return `${baseClasses} w-32 h-32 bg-blue-600 border-blue-400 text-white z-20 scale-110 shadow-blue-500/30`;
            }
        } else {
            if (node.sourceMode === 'DEEP') {
                return `${baseClasses} w-24 h-24 bg-white border-purple-200 text-slate-800 hover:border-purple-400 hover:shadow-purple-200 z-10 hover:scale-105`;
            } else if (node.sourceMode === 'BROAD') {
                return `${baseClasses} w-24 h-24 bg-white border-cyan-200 text-slate-800 hover:border-cyan-400 hover:shadow-cyan-200 z-10 hover:scale-105`;
            } else {
                return `${baseClasses} w-24 h-24 bg-white border-slate-200 text-slate-800 hover:border-blue-300 z-10 hover:scale-105`;
            }
        }
    };

    return (
        <div className="relative w-full h-screen bg-slate-50 overflow-hidden font-sans select-none">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4 ml-12 transition-all duration-300">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-slate-800 text-sm">Brainstorming Canvas</h1>
                        <span className="text-[10px] text-slate-400">Project: {folders.find(f => f.id === activeFolderId)?.name}</span>
                    </div>
                </div>
                
                <div className="header-controls flex items-center gap-4">
                     <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setMode('BROAD')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${mode === 'BROAD' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>BROAD</button>
                        <button onClick={() => setMode('DEEP')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${mode === 'DEEP' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>DEEP</button>
                     </div>
                     <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsCreativeMode(!isCreativeMode)} title={isCreativeMode ? "Creative Mode: AI can invent terms" : "Strict Mode: Verified terms only"}>
                        <div className={`text-[10px] font-bold transition-colors ${isCreativeMode ? 'text-indigo-600' : 'text-slate-400'}`}>AI WORD GEN</div>
                        <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${isCreativeMode ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${isCreativeMode ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                     </div>
                     <div className="relative group z-50">
                        <button onClick={handleQuickSave} className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors text-xs font-bold"><Save size={14} /> SAVE MAP</button>
                        <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right"><button onClick={handleSaveAs} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors text-left"><FilePlus size={14} /> Save As...</button></div>
                     </div>
                </div>
            </header>

            {/* Left Sidebar */}
            <div className={`sidebar-left fixed top-16 left-0 bottom-0 z-30 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-2xl flex flex-col ${isLeftSidebarHovered ? 'w-72' : 'w-14'}`} onMouseEnter={() => setIsLeftSidebarHovered(true)} onMouseLeave={() => { setIsLeftSidebarHovered(false); setHoveredBookmark(null); }}>
                <div className="h-14 flex items-center border-b border-slate-100 flex-shrink-0 overflow-hidden">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 text-slate-400"><Layout size={20} /></div>
                    <div className={`whitespace-nowrap font-bold text-slate-700 text-sm transition-opacity duration-200 ${isLeftSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Project Folders</div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
                    {folders.map(folder => {
                        const folderBookmarks = bookmarks.filter(b => b.folderId === folder.id || (!b.folderId && folder.id === 'default'));
                        const folderMaps = savedMaps.filter(m => m.folderId === folder.id || (!m.folderId && folder.id === 'default'));
                        const isActive = activeFolderId === folder.id;
                        const isExpanded = expandedFolders.includes(folder.id);
                        return (
                            <div key={folder.id} className="mb-1">
                                <div onClick={() => setActiveFolderId(folder.id)} className={`relative flex items-center h-10 cursor-pointer transition-colors group ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />}
                                    <div className="w-14 h-full flex items-center justify-center flex-shrink-0"><Folder size={18} className={isActive ? 'text-blue-600 fill-blue-100' : 'text-slate-400'} /></div>
                                    <div className={`flex-1 flex items-center justify-between pr-3 overflow-hidden transition-opacity duration-200 ${isLeftSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>
                                        <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>{folder.name}</span>
                                        <div className="flex items-center gap-1">
                                            {folder.id !== 'default' && (<button onClick={(e) => handleDeleteFolder(folder.id, e)} className="p-1 text-slate-300 hover:text-rose-500 rounded"><Trash2 size={12} /></button>)}
                                            <button onClick={(e) => { e.stopPropagation(); toggleFolderExpand(folder.id); }} className="p-1 text-slate-400 hover:bg-slate-200 rounded">{isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && isLeftSidebarHovered && (
                                    <div className="bg-slate-50/50 border-y border-slate-100/50 pb-2">
                                        <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><Network size={10} /><span>Saved Maps</span></div>
                                        {folderMaps.length > 0 ? (
                                            folderMaps.map((map) => (
                                                <div key={map.id} onClick={() => handleLoadMap(map)} className={`pl-8 pr-3 py-1.5 flex items-center justify-between group/map hover:bg-white border-l-2 transition-colors cursor-pointer ${currentMapId === map.id ? 'border-indigo-400 bg-indigo-50/50' : 'border-transparent hover:border-indigo-300'}`}>
                                                    <div className="overflow-hidden"><div className={`truncate text-[11px] font-medium max-w-[140px] ${currentMapId === map.id ? 'text-indigo-700' : 'text-slate-700 group-hover/map:text-indigo-700'}`}>{map.name}</div><div className="flex items-center gap-1 text-[9px] text-slate-400"><Calendar size={8} />{new Date(map.createdAt).toLocaleDateString()}</div></div>
                                                    <button onClick={(e) => handleDeleteMap(map.id, e)} className="opacity-0 group-hover/map:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-1"><X size={10} /></button>
                                                </div>
                                            ))
                                        ) : (<div className="pl-8 py-1 text-[10px] text-slate-400/70 italic">No saved maps</div>)}
                                        <div className="px-4 py-2 mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><Bookmark size={10} /><span>Bookmarks</span></div>
                                        {folderBookmarks.length > 0 ? (
                                            folderBookmarks.map((b, idx) => (
                                                <div key={idx} className="pl-8 pr-3 py-1.5 flex items-center justify-between group/bm hover:bg-white border-l-2 border-transparent hover:border-blue-300 transition-colors cursor-help" onMouseEnter={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setHoveredBookmark({ bookmark: b, y: rect.top }); }} onMouseLeave={() => setHoveredBookmark(null)}>
                                                    <div className="truncate text-[11px] text-slate-600 group-hover/bm:text-blue-700 max-w-[140px]" title={b.term}>{b.term}</div>
                                                    <button onClick={(e) => handleDeleteBookmark(b.term, e)} className="opacity-0 group-hover/bm:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-1"><X size={10} /></button>
                                                </div>
                                            ))
                                        ) : (<div className="pl-8 py-1 text-[10px] text-slate-400/70 italic">No bookmarks</div>)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className={`p-4 border-t border-slate-200 bg-slate-50 transition-all duration-300 ${isLeftSidebarHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                    <form onSubmit={handleCreateFolder} className="relative">
                        <FolderPlus size={14} className="absolute top-2.5 left-3 text-slate-400" />
                        <input type="text" placeholder="New Folder..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        <button type="submit" disabled={!newFolderName.trim()} className="absolute top-1.5 right-1.5 p-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-300 transition-colors"><Plus size={12} /></button>
                    </form>
                </div>
            </div>

            {/* Bookmark Tooltip */}
            {hoveredBookmark && (
                <div className="fixed left-72 ml-2 z-50 w-64 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-200 animate-fade-in pointer-events-none" style={{ top: Math.min(window.innerHeight - 200, Math.max(10, hoveredBookmark.y - 20)) }}>
                    <div className="absolute top-6 -left-1.5 w-3 h-3 bg-white border-l border-b border-slate-200 transform rotate-45"></div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{hoveredBookmark.bookmark.term}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{hoveredBookmark.bookmark.description}</p>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{folders.find(f => f.id === hoveredBookmark.bookmark.folderId)?.name || 'General'}</div>
                </div>
            )}

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in modal-overlay">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-96 transform scale-100 transition-all">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Save size={18} className="text-slate-500" /> Save Mind Map</h3><button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
                        <form onSubmit={handleSaveConfirm}>
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Map Name</label><input type="text" value={mapNameInput} onChange={(e) => setMapNameInput(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Enter map name..." autoFocus /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Assign Project</label><div className="relative"><select value={selectedSaveFolderId} onChange={(e) => setSelectedSaveFolderId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">{folders.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}</select><ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" /></div></div>
                            </div>
                            <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowSaveModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button><button type="submit" disabled={!mapNameInput.trim()} className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Canvas Area */}
            <div ref={canvasRef} className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
                <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', transition: isPanning || draggedNodeIdRef.current ? 'none' : 'transform 0.1s ease-out' }} className="w-full h-full relative">
                    <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] overflow-visible pointer-events-none" style={{ transform: 'translate(-2500px, -2500px)' }}>
                        {nodes.map(node => { if (!node.parentId) return null; const parent = nodes.find(n => n.id === node.parentId); if (!parent) return null; return (<line key={`edge-${node.id}`} x1={parent.x + 2500} y1={parent.y + 2500} x2={node.x + 2500} y2={node.y + 2500} stroke="#cbd5e1" strokeWidth="2" className="opacity-50" />); })}
                    </svg>
                    {nodes.map(node => (
                        <div key={node.id} data-node-id={node.id} className={getNodeClasses(node, selectedNodeId === node.id)} style={{ left: node.x, top: node.y }} onClick={(e) => handleNodeClick(e, node.id)}>
                            <span className="text-sm md:text-xs font-bold text-center leading-tight px-2 pointer-events-none select-none tracking-tight">{node.shortLabel}</span>
                            {selectedNodeId === node.id && (
                                <div className="absolute -bottom-12 flex gap-2 pointer-events-auto">
                                   <button onClick={(e) => { e.stopPropagation(); handleExpand(node, 'AUTO'); }} className="bg-white text-blue-600 p-2 rounded-full shadow-md border border-slate-200 hover:bg-blue-50 transition-colors transform hover:scale-110" title="Auto Expand"><Sparkles size={16} /></button>
                                   <button onClick={(e) => { e.stopPropagation(); handleExpand(node, 'ROOT'); }} className="bg-white text-purple-600 p-2 rounded-full shadow-md border border-slate-200 hover:bg-purple-50 transition-colors transform hover:scale-110" title="Divergent Ideas"><Zap size={16} /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Sidebar Detail */}
            {selectedNodeData && (
                <div className="sidebar-right absolute top-20 right-6 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-6 animate-fade-in z-20 overflow-y-auto max-h-[85vh]">
                    <div className="flex justify-between items-start mb-3">
                         <div className="flex-1 pr-4"><div className="flex items-center gap-2 mb-1"><h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedNodeData.term}</h2>{selectedNodeData.isAiGenerated && (<div className="cursor-help text-violet-500 hover:text-violet-700 transition-colors" title="Generated by Gemini-3-flash-preview (Creative Mode)"><Bot size={18} /></div>)}</div></div>
                        <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X size={20} /></button>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100"><p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedNodeData.description}</p></div>
                    {selectedNodeData.sources && selectedNodeData.sources.length > 0 ? (
                        <div className="mb-6"><h3 className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2"><BookOpen size={12} /> References & Sources</h3><ul className="space-y-2">{selectedNodeData.sources.map((source, idx) => (<li key={idx} className="bg-white rounded-lg border border-slate-200 p-3 text-xs text-slate-700 shadow-sm flex items-start justify-between gap-2 hover:border-blue-300 hover:shadow-md transition-all group"><div className="flex items-start gap-2.5"><FileText size={14} className="text-slate-400 mt-0.5 flex-shrink-0" /><span className="leading-snug font-medium">{source}</span></div><button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(source)}`, '_blank')} className="text-slate-300 hover:text-blue-600 transition-colors p-1 flex-shrink-0" title="Verify Source on Google"><ExternalLink size={14} /></button></li>))}</ul></div>
                    ) : (
                        <div className="mb-6"><h3 className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2"><BookOpen size={12} /> References</h3><div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-400 italic text-center">No direct sources provided (Creative/General Term)</div></div>
                    )}
                    <div className="space-y-3 mb-8">
                        <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedNodeData.term + " architecture")}`, '_blank')} className="w-full py-3.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center justify-center gap-2 shadow-sm"><Search size={16} /> Verify Concept on Google</button>
                        <button onClick={() => toggleBookmark(selectedNodeData)} className="w-full py-3.5 rounded-xl bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all border border-slate-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                            {isBookmarked ? (<><CheckCircle2 size={16} className="text-green-500" /><span>Saved to <span className="text-blue-600">{folders.find(f => f.id === activeFolderId)?.name}</span></span></>) : (<><Bookmark size={16} /><span>Add to <span className="text-blue-600">{folders.find(f => f.id === activeFolderId)?.name}</span></span></>)}
                        </button>
                    </div>
                    <div className="pt-5 border-t border-slate-100">
                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Expand Concept</h3>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => handleExpand(selectedNodeData, 'SIMILAR')} className="p-3 text-xs bg-white hover:bg-slate-50 rounded-xl text-slate-600 border border-slate-200 shadow-sm transition-all text-left group hover:border-blue-300"><span className="block font-bold mb-1 text-slate-800 group-hover:text-blue-600 text-sm">Synonyms</span><span className="text-[10px] text-slate-400">Similar concepts</span></button>
                            <button onClick={() => handleExpand(selectedNodeData, 'OPPOSITE')} className="p-3 text-xs bg-white hover:bg-slate-50 rounded-xl text-slate-600 border border-slate-200 shadow-sm transition-all text-left group hover:border-rose-300"><span className="block font-bold mb-1 text-slate-800 group-hover:text-rose-600 text-sm">Antonyms</span><span className="text-[10px] text-slate-400">Contrasting ideas</span></button>
                            <button onClick={() => handleExpand(selectedNodeData, 'ISSUE')} className="p-3 text-xs bg-white hover:bg-slate-50 rounded-xl text-slate-600 border border-slate-200 shadow-sm transition-all text-left group hover:border-amber-300"><span className="block font-bold mb-1 text-slate-800 group-hover:text-amber-600 text-sm">Issues</span><span className="text-[10px] text-slate-400">Social context</span></button>
                             <button onClick={() => handleExpand(selectedNodeData, 'AUTO')} className="p-3 text-xs bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl text-white shadow-md transition-all text-left hover:shadow-lg hover:scale-[1.02]"><span className="block font-bold mb-1 text-sm">AI Suggest</span><span className="text-[10px] text-blue-100 opacity-90">Smart expansion</span></button>
                        </div>
                    </div>
                </div>
            )}
            
            {loading && (<div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl z-50 animate-bounce-slight"><Loader2 className="animate-spin text-blue-400" size={20} /><span className="text-sm font-medium">Generating connections...</span></div>)}
        </div>
    );
};

export default Brainstorming;
