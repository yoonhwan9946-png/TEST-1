
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ASSETS } from '../data/mockData';
import { Asset, AssetType, Category, PlacedAsset, LayoutAnalysisResult, ProjectContextInfo, AiInsightResult } from '../types';
import { analyzeLayoutNarrative, generateArchitecturalInsights, generateStyledCaption, classifyPagePhases } from '../services/geminiService';
import { 
  ArrowLeft, X, Download, Share2, Maximize2, 
  Grid3X3, Layers, FilePlus, Printer, Trash2, 
  LayoutTemplate, Plus, Minus, ChevronDown,
  FileImage, FileText, Home, Move, Scaling,
  MousePointer2, Upload, BookOpen, Search,
  CheckSquare, Settings, Save, Edit2, CornerDownRight, Check,
  Filter, Grid, List, Expand, Cloud, PanelLeftClose, PanelLeft,
  Play, Eye, MonitorPlay, LayoutGrid, EyeOff, FileDigit,
  Palette, FileBadge, MoreHorizontal, MousePointerClick,
  AlertTriangle, BrainCircuit, ArrowRight, RefreshCw, Wand2,
  BarChart3, PieChart, PlusSquare, Copy, Sparkles, MoreVertical,
  GripHorizontal, GripVertical, FileType, Landmark, Briefcase, Calculator,
  MessageSquareQuote, ListChecks, Type, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, FilePenLine
} from 'lucide-react';

type ViewState = 'SPLIT' | 'DIAGRAM' | 'MOCKUP' | 'BUILDER' | 'VIEWER' | 'GRID_VIEW';
type PaperSize = 'A3_LANDSCAPE' | 'A4_PORTRAIT';
type PageStatus = 'ACTIVE' | 'SKIP_COUNT' | 'HIDDEN';
type PageColorTheme = 'slate' | 'blue' | 'rose' | 'amber' | 'emerald';

// Expanded Analysis Phases to support Business/Proposals
type AnalysisPhase = 'analysis' | 'strategy' | 'plan' | 'design' | 'finance' | 'team' | 'vision' | 'excluded';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

// Metadata for each page in the builder
interface PageMetadata {
    pageIndex: number;
    description: string;
    status: PageStatus;
    colorTheme: PageColorTheme;
    size: PaperSize;
    aiPhase?: AnalysisPhase; // Added AI-determined phase
}

// Structure for Layout Alternatives
interface LayoutAlternative {
    id: string;
    name: string;
    pagesMeta: PageMetadata[];
    placedAssets: PlacedAsset[];
    pageCount: number;
    createdAt: number;
}

// Helper to determine phase from description
const getPhaseFromDescription = (desc: string, status: PageStatus): AnalysisPhase => {
    if (status === 'SKIP_COUNT' || status === 'HIDDEN') return 'excluded';
    
    const d = desc.toLowerCase().trim();
    if (!d) return 'excluded'; // Exclude empty descriptions
    
    // Check for "Ganji" (Title Sheets) or "Index"
    if (d.match(/목차|간지|표지|index|contents|cover|title/)) return 'excluded';

    // 1. Business & Finance (New)
    if (d.match(/finance|budget|cost|profit|accounting|feasibility|business|sale|calc|회계|비용|예산|사업|수지|분양|수익|타당성/)) return 'finance';

    // 2. Team & Organization (New)
    if (d.match(/team|member|org|manpower|partner|company|history|intro|팀|조직|운영|인력|소개|연혁|실적/)) return 'team';

    // 3. Vision & Goals (New)
    if (d.match(/goal|vision|target|objective|purpose|mission|philosophy|목표|비전|목적|철학|방향/)) return 'vision';

    // 4. Standard Architectural Phases
    if (d.match(/analysis|site|context|intro|legal|survey|대지|분석|개요|현황|법규/)) return 'analysis';
    if (d.match(/concept|mass|strategy|zoning|flow|diagram|process|전략|컨셉|매스|조닝|동선/)) return 'strategy';
    if (d.match(/plan|section|elevation|detail|structure|mep|drawing|평면|단면|입면|상세|도면|구조/)) return 'plan';
    if (d.match(/perspective|render|view|design|facade|cg|interior|투시도|조감도|디자인|이미지|내부/)) return 'design';
    
    return 'plan'; // Default fallback
};

const PHASE_COLORS = {
    analysis: { border: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-200', label: 'Analysis' },
    strategy: { border: 'border-amber-500', bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-200', label: 'Strategy' },
    plan: { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-200', label: 'Planning' },
    design: { border: 'border-rose-500', bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-200', label: 'Design' },
    
    // New Categories
    finance: { border: 'border-cyan-500', bg: 'bg-cyan-500', text: 'text-cyan-600', ring: 'ring-cyan-200', label: 'Finance' },
    team: { border: 'border-violet-500', bg: 'bg-violet-500', text: 'text-violet-600', ring: 'ring-violet-200', label: 'Team' },
    vision: { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-200', label: 'Vision' },

    excluded: { border: 'border-slate-200', bg: 'bg-slate-300', text: 'text-slate-400', ring: 'ring-slate-100', label: 'Etc' }
};

// GridPageThumbnail Component
interface GridPageThumbnailProps {
    pageIndex: number;
    meta: PageMetadata;
    placedAssets: PlacedAsset[];
    zoom: number;
    isSelected: boolean;
    onToggleSelect: (index: number, multi: boolean) => void;
    onContextMenu: (index: number, e: React.MouseEvent) => void;
    onDescriptionChange: (index: number, text: string) => void;
    themeColors: Record<PageColorTheme, string>;
    pageLabel: string;
    A3_WIDTH: number;
    A4_WIDTH: number;
    CELL_A3: number;
    CELL_A4: number;
    analysisColor: any;
}

const GridPageThumbnail: React.FC<GridPageThumbnailProps> = ({
    pageIndex, meta, placedAssets, zoom, isSelected, onToggleSelect, onContextMenu, onDescriptionChange, pageLabel, A3_WIDTH, A4_WIDTH, CELL_A3, CELL_A4, analysisColor
}) => {
    const isA3 = meta.size === 'A3_LANDSCAPE';
    const width = isA3 ? A3_WIDTH : A4_WIDTH;
    const height = isA3 ? A3_WIDTH / 1.414 : A4_WIDTH * 1.414;
    const cellSize = isA3 ? CELL_A3 : CELL_A4;
    const scale = 0.15 * zoom; 

    const pageAssets = placedAssets.filter(p => p.pageIndex === pageIndex);

    let borderClass = "border-slate-700 hover:border-slate-500";
    let ringClass = "";
    let bgClass = "bg-slate-800"; 

    const manualColors: Record<string, string> = {
        blue: 'border-blue-500',
        rose: 'border-rose-500',
        amber: 'border-amber-500',
        emerald: 'border-emerald-500',
        slate: 'border-slate-700 hover:border-slate-500'
    };

    const manualDotColors: Record<string, string> = {
        slate: 'bg-slate-600',
        blue: 'bg-blue-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500'
    };

    if (isSelected) {
        borderClass = "border-blue-500";
        ringClass = "ring-1 ring-blue-500 shadow-xl shadow-blue-500/10";
        bgClass = "bg-slate-800";
    } else if (analysisColor) {
        borderClass = analysisColor.border;
        bgClass = "bg-slate-800";
    } else if (meta.colorTheme && meta.colorTheme !== 'slate') {
        borderClass = manualColors[meta.colorTheme] || manualColors.slate;
        bgClass = "bg-slate-800";
    }

    return (
        <div 
            className={`flex flex-col gap-2 p-2 rounded-xl transition-all duration-200 border-2 ${borderClass} ${ringClass} ${bgClass}`}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(pageIndex, e.shiftKey || e.ctrlKey || e.metaKey); }}
            onContextMenu={(e) => onContextMenu(pageIndex, e)}
        >
            <div className="flex items-center justify-between px-1 h-5">
                <span className={`text-[10px] font-bold font-mono truncate max-w-[120px] ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>{pageLabel}</span>
                {analysisColor ? (
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full text-white shadow-sm ${analysisColor.bg}`}>
                        {analysisColor.label}
                    </span>
                ) : (
                    meta.colorTheme && meta.colorTheme !== 'slate' && (
                        <div className={`w-2 h-2 rounded-full shadow-sm ${manualDotColors[meta.colorTheme]}`} />
                    )
                )}
            </div>

            <div 
                className="relative bg-white shadow-sm overflow-hidden transition-all duration-300 origin-top-left border border-slate-200/10"
                style={{
                    width: width * scale,
                    height: height * scale,
                }}
            >
                {pageAssets.map(asset => (
                    <div 
                        key={asset.uid}
                        className="absolute"
                        style={{
                            left: asset.x * cellSize * scale,
                            top: asset.y * cellSize * scale,
                            width: asset.w * cellSize * scale,
                            height: asset.h * cellSize * scale,
                        }}
                    >
                        <img src={asset.asset.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 mt-1">
                <input 
                    type="text" 
                    value={meta.description || ''}
                    onChange={(e) => onDescriptionChange(pageIndex, e.target.value)}
                    placeholder="Page logic..."
                    className="flex-1 bg-transparent border-b border-slate-700 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 pb-0.5 placeholder:text-slate-600 font-medium"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

// LayoutAnalysisGraph Component
const LayoutAnalysisGraph: React.FC<{ pagesMeta: PageMetadata[] }> = ({ pagesMeta }) => {
    
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        let total = 0;
        pagesMeta.forEach(p => {
            if(p.status === 'ACTIVE') {
                const phase = p.aiPhase ? p.aiPhase : getPhaseFromDescription(p.description, p.status);
                counts[phase] = (counts[phase] || 0) + 1;
                total++;
            }
        });
        return { counts, total };
    }, [pagesMeta]);

    const PHASE_ORDER: AnalysisPhase[] = ['analysis', 'vision', 'strategy', 'team', 'plan', 'design', 'finance', 'excluded'];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[150] flex items-center px-12 animate-fade-in-up shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="w-full max-w-[1800px] mx-auto flex items-center gap-16">
                <div className="flex-shrink-0 border-r border-slate-200 pr-12 hidden md:block">
                    <h4 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Total Pages</h4>
                    <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{stats.total}</p>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-2">
                    <div className="flex justify-between text-xs font-sans font-bold uppercase tracking-widest text-slate-400 mb-1">
                        <span>Narrative Balance</span>
                        <span>{stats.total > 0 ? '100%' : '0%'}</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
                        {PHASE_ORDER.map((phaseKey) => {
                            const count = stats.counts[phaseKey] || 0;
                            if (count === 0) return null;
                            const percentage = (count / stats.total) * 100;
                            const config = PHASE_COLORS[phaseKey] || PHASE_COLORS.excluded;
                            return (
                                <div 
                                    key={phaseKey}
                                    style={{ width: `${percentage}%` }} 
                                    className={`h-full ${config.bg} transition-all duration-700 ease-out relative group`}
                                >
                                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity z-50">
                                        {config.label}: {count} ({Math.round(percentage)}%)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 overflow-x-auto pb-1">
                        <div className="flex gap-6">
                            {PHASE_ORDER.map(key => {
                                if ((stats.counts[key] || 0) === 0) return null;
                                const config = PHASE_COLORS[key] || PHASE_COLORS.excluded;
                                return (
                                    <span key={key} className="flex items-center gap-2 whitespace-nowrap">
                                        <span className={`w-2 h-2 rounded-full ${config.bg}`}></span> 
                                        {config.label}
                                    </span>
                                )
                            })}
                            {stats.total === 0 && <span className="opacity-50">Add page descriptions to analyze flow</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AssetLibrary: React.FC = () => {
    const navigate = useNavigate();
    const [viewState, setViewState] = useState<ViewState>('SPLIT');
    const [lastViewState, setLastViewState] = useState<ViewState>('MOCKUP');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [expandedSection, setExpandedSection] = useState<'LEFT' | 'RIGHT' | null>(null);
    const [assets, setAssets] = useState<Asset[]>(ASSETS);

    // --- Unsaved Changes & Edit State ---
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null); 

    // --- Edit Mode & Bulk Actions State ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkCategoryInput, setShowBulkCategoryInput] = useState(false);
    const [bulkCategoryValue, setBulkCategoryValue] = useState('');

    // --- Detail Edit State ---
    const [isDetailEditing, setIsDetailEditing] = useState(false);
    const [editingAssetData, setEditingAssetData] = useState<Asset | null>(null);

    // --- Upload Drawer State ---
    const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
    const [newAssetForm, setNewAssetForm] = useState({
        title: '',
        category: 'Logic Flow',
        projectType: 'General Competition',
        facilityType: '',
        source: '',
        description: '',
        file: null as File | null
    });

    const [pageCount, setPageCount] = useState<number>(1);
    const [currentPageInView, setCurrentPageInView] = useState<number>(1);
    const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);
    const [selectedPlacedAssetId, setSelectedPlacedAssetId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [pagesMeta, setPagesMeta] = useState<PageMetadata[]>([]);
    const [layoutAlternatives, setLayoutAlternatives] = useState<LayoutAlternative[]>([]);
    const [activeAltId, setActiveAltId] = useState<string>('default');
    const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, altId: string } | null>(null);
    const [editingAltId, setEditingAltId] = useState<string | null>(null);
    const [editAltName, setEditAltName] = useState('');
    const [pendingPageResize, setPendingPageResize] = useState<{ indices: number[], newSize: PaperSize } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, pageIndex: number } | null>(null);
    const [isAnalysisTypeModalOpen, setIsAnalysisTypeModalOpen] = useState(false); 
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<LayoutAnalysisResult | null>(null);
    const [showAnalysisGraph, setShowAnalysisGraph] = useState(false);
    const [isAnalyzingPhases, setIsAnalyzingPhases] = useState(false); 
    const [projectInfo, setProjectInfo] = useState<ProjectContextInfo>({
        facility: "복합문화시설",
        project_type: "공공현상설계",
        project_name: "서울 시립 아트센터"
    });
    const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
    const [aiInsightState, setAiInsightState] = useState<{
        isOpen: boolean;
        pageIndex: number;
        activeTab: 'caption' | 'checklist';
        loading: boolean;
        result: AiInsightResult | null;
    }>({
        isOpen: false,
        pageIndex: -1,
        activeTab: 'checklist',
        loading: false,
        result: null
    });
    const [isArchiSpeakOpen, setIsArchiSpeakOpen] = useState(false);
    const [archiSpeakDraft, setArchiSpeakDraft] = useState('');
    const [isArchiSpeakLoading, setIsArchiSpeakLoading] = useState(false);
    const [viewerAsset, setViewerAsset] = useState<Asset | null>(null);
    const [viewerSlideIndex, setViewerSlideIndex] = useState(0);
    const [isViewerDragging, setIsViewerDragging] = useState(false);
    const [viewerDragStartX, setViewerDragStartX] = useState(0);
    const [viewerDragOffset, setViewerDragOffset] = useState(0);
    const [gridZoom, setGridZoom] = useState(0.4);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
    const [selectedPageIndices, setSelectedPageIndices] = useState<Set<number>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
    const [isGridPanning, setIsGridPanning] = useState(false);
    const gridPanStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [isSaveMockupModalOpen, setIsSaveMockupModalOpen] = useState(false);
    const [mockupSaveForm, setMockupSaveForm] = useState({
        title: '',
        category: 'Public Competition',
        tags: '',
        description: ''
    });
    const [isResizingEnabled, setIsResizingEnabled] = useState(false);
    const [builderSearchTerm, setBuilderSearchTerm] = useState('');
    const [builderCategoryFilter, setBuilderCategoryFilter] = useState('All');
    const [draggedSourceAsset, setDraggedSourceAsset] = useState<Asset | null>(null);
    const [interactionState, setInteractionState] = useState<{
        type: 'MOVE' | 'RESIZE' | null;
        uid: string | null;
        direction: ResizeDirection | null;
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
        initialW: number;
        initialH: number;
    }>({
        type: null,
        uid: null,
        direction: null,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        initialW: 0,
        initialH: 0
    });
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // --- Grid Constants ---
    const A3_WIDTH_PX = 1122;
    const A4_WIDTH_PX = 794; 
    const GRID_COLS_A3 = 48;
    const GRID_ROWS_A3 = 36;
    const GRID_COLS_A4 = 36;
    const GRID_ROWS_A4 = 48;
    const CELL_SIZE_A3 = A3_WIDTH_PX / GRID_COLS_A3;
    const CELL_SIZE_A4 = A4_WIDTH_PX / GRID_COLS_A4;
    const BG_DIAGRAM = "https://i.pinimg.com/originals/a6/50/2d/a6502d6df38a72a514d232c668b5561a.jpg"; 
    const BG_MOCKUP = "https://mir-s3-cdn-cf.behance.net/project_modules/fs/77c980112423985.6014022e0394b.jpg"; 

    const themeColors: Record<PageColorTheme, string> = {
        slate: 'border-slate-200/80 bg-white',
        blue: 'border-blue-400 bg-blue-50/10',
        rose: 'border-rose-400 bg-rose-50/10',
        amber: 'border-amber-400 bg-amber-50/10',
        emerald: 'border-emerald-400 bg-emerald-50/10'
    };
    const themeDotColors: Record<PageColorTheme, string> = {
        slate: 'bg-slate-200',
        blue: 'bg-blue-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500'
    };

    // --- Initialize Page Metadata & Default Alternative ---
    useEffect(() => {
        setPagesMeta(prev => {
            const newMeta = [...prev];
            if (newMeta.length < pageCount) {
                for (let i = newMeta.length; i < pageCount; i++) {
                    newMeta.push({ 
                        pageIndex: i, 
                        description: '', 
                        status: 'ACTIVE',
                        colorTheme: 'slate',
                        size: 'A3_LANDSCAPE'
                    });
                }
            } else if (newMeta.length > pageCount) {
                newMeta.splice(pageCount);
            }
            return newMeta;
        });
        if (layoutAlternatives.length === 0) {
            setLayoutAlternatives([{
                id: 'default',
                name: 'Original',
                pagesMeta: [], 
                placedAssets: [],
                pageCount: 1,
                createdAt: Date.now()
            }]);
        }
    }, [pageCount]);

    const getFormattedPageNumber = useCallback((index: number) => {
        const meta = pagesMeta[index];
        if (!meta) return String(index + 1).padStart(2, '0');
        if (meta.status === 'SKIP_COUNT') return 'ZERO'; 
        if (meta.status === 'HIDDEN') return 'HIDDEN';
        let count = 0;
        for (let i = 0; i <= index; i++) {
            if (pagesMeta[i]?.status === 'ACTIVE') {
                count++;
            }
        }
        return String(count).padStart(2, '0');
    }, [pagesMeta]);

    useEffect(() => {
        if (viewState === 'BUILDER' || viewState === 'GRID_VIEW') {
            setLayoutAlternatives(prev => prev.map(alt => {
                if (alt.id === activeAltId) {
                    return {
                        ...alt,
                        pagesMeta: pagesMeta,
                        placedAssets: placedAssets,
                        pageCount: pageCount
                    };
                }
                return alt;
            }));
        }
    }, [placedAssets, pagesMeta, pageCount, activeAltId]);

    // ... (Handlers) ...
    useEffect(() => {
        const handleClick = () => {
            setContextMenu(null);
            setTabContextMenu(null);
            setIsArchiSpeakOpen(false); 
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleCanvasScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const pageElements = container.querySelectorAll('.page-container');
        let closestPage = 0;
        let minDistance = Number.MAX_VALUE;
        const offsetTop = 80;
        pageElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top - container.getBoundingClientRect().top - offsetTop);
            if (distance < minDistance) {
                minDistance = distance;
                closestPage = Number(el.getAttribute('data-page-index'));
            }
        });
        if (closestPage + 1 !== currentPageInView) {
            setCurrentPageInView(closestPage + 1);
        }
    };

    const handleOpenAiInsight = (pageIndex: number) => {
        setAiInsightState({
            isOpen: true,
            pageIndex,
            activeTab: 'checklist',
            loading: false,
            result: null
        });
    };

    const handleFetchAiInsight = async () => {
        let targetIndex = -1;
        if (viewState === 'BUILDER') targetIndex = currentPageInView - 1;
        else if (aiInsightState.pageIndex !== -1) targetIndex = aiInsightState.pageIndex;
        else if (viewState === 'GRID_VIEW' && selectedPageIndices.size > 0) targetIndex = Array.from(selectedPageIndices)[0];
        else targetIndex = 0; 

        if (targetIndex < 0 || targetIndex >= pagesMeta.length) {
            alert("Please select a page to generate checklist.");
            return;
        }
        setAiInsightState(prev => ({ 
            ...prev, 
            isOpen: true, 
            pageIndex: targetIndex, 
            loading: true, 
            activeTab: 'checklist' 
        }));
        const result = await generateArchitecturalInsights({
            project_info: projectInfo,
            page_context: {
                page_role: pagesMeta[targetIndex]?.description || "Untitled Page",
                user_draft: pagesMeta[targetIndex]?.description || ""
            },
            action_type: 'recommend_checklist'
        });
        setAiInsightState(prev => ({ ...prev, loading: false, result }));
    };

    const handleGenerateArchiSpeak = async () => {
        if (!selectedPlacedAssetId) return; 
        setIsArchiSpeakLoading(true);
        const targetAsset = placedAssets.find(p => p.uid === selectedPlacedAssetId);
        if (!targetAsset) {
            setIsArchiSpeakLoading(false);
            return;
        }
        const pageIdx = targetAsset.pageIndex;
        const pageDesc = pagesMeta[pageIdx]?.description || '';
        const contextInfo = {
            assetMetadata: {
                category: targetAsset.asset.category,
                categoryKo: targetAsset.asset.categoryKo,
                tags: targetAsset.asset.tags,
                description: targetAsset.asset.contentDescription
            },
            pageDescription: pageDesc
        };
        const result = await generateStyledCaption(
            {
                title: targetAsset.asset.title,
                description: targetAsset.asset.contentDescription || targetAsset.asset.title
            },
            archiSpeakDraft, 
            contextInfo 
        );
        if (result) {
            updatePlacedAssetCaption(selectedPlacedAssetId, result.generated_caption);
            setArchiSpeakDraft('');
            setIsArchiSpeakOpen(false);
        }
        setIsArchiSpeakLoading(false);
    };

    const updatePlacedAssetCaption = (uid: string, caption: string) => {
        setPlacedAssets(prev => prev.map(p => 
            p.uid === uid ? { ...p, caption, captionPosition: p.captionPosition || 'bottom', captionAlign: p.captionAlign || 'left', captionSize: p.captionSize || 'xs' } : p
        ));
        setHasUnsavedChanges(true);
    };

    const updateAssetCaptionStyle = (uid: string, updates: Partial<PlacedAsset>) => {
        setPlacedAssets(prev => prev.map(p => 
            p.uid === uid ? { ...p, ...updates } : p
        ));
        setHasUnsavedChanges(true);
    };

    const handleTabContextMenu = (e: React.MouseEvent, altId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setTabContextMenu({ x: e.clientX, y: e.clientY, altId });
    };

    const handleRenameAltStart = (altId: string) => {
        const alt = layoutAlternatives.find(a => a.id === altId);
        if (alt) {
            setEditingAltId(altId);
            setEditAltName(alt.name);
            setTabContextMenu(null);
        }
    };

    const handleRenameAltSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editAltName.trim()) {
            setLayoutAlternatives(prev => prev.map(alt => 
                alt.id === editingAltId ? { ...alt, name: editAltName.trim() } : alt
            ));
        }
        setEditingAltId(null);
    };

    const handleDeleteAlt = (altId: string) => {
        setTabContextMenu(null);
        if (layoutAlternatives.length <= 1) {
            alert("At least one layout must remain.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this layout alternative?")) {
            const deleteIndex = layoutAlternatives.findIndex(a => a.id === altId);
            const remainingAlts = layoutAlternatives.filter(a => a.id !== altId);
            if (activeAltId === altId) {
                const targetIndex = deleteIndex > 0 ? deleteIndex - 1 : 0;
                const nextAlt = remainingAlts[targetIndex];
                if (nextAlt) {
                    setLayoutAlternatives(remainingAlts);
                    setActiveAltId(nextAlt.id);
                    setPagesMeta(JSON.parse(JSON.stringify(nextAlt.pagesMeta)));
                    setPlacedAssets(JSON.parse(JSON.stringify(nextAlt.placedAssets)));
                    setPageCount(nextAlt.pageCount);
                }
            } else {
                setLayoutAlternatives(remainingAlts);
            }
        }
    };

    const handlePageDragStart = (e: React.DragEvent, index: number) => {
        setDraggedPageIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handlePageDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); 
        if (draggedPageIndex === null || draggedPageIndex === index) return;
    };

    const handlePageDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedPageIndex === null || draggedPageIndex === targetIndex) return;
        const newPagesMeta = [...pagesMeta];
        const [movedPage] = newPagesMeta.splice(draggedPageIndex, 1);
        newPagesMeta.splice(targetIndex, 0, movedPage);
        const indexMap = new Map<number, number>();
        for (let i = 0; i < pagesMeta.length; i++) {
            if (i === draggedPageIndex) {
                indexMap.set(i, targetIndex);
            } else if (draggedPageIndex < targetIndex) {
                if (i > draggedPageIndex && i <= targetIndex) {
                    indexMap.set(i, i - 1);
                } else {
                    indexMap.set(i, i);
                }
            } else {
                if (i >= targetIndex && i < draggedPageIndex) {
                    indexMap.set(i, i + 1);
                } else {
                    indexMap.set(i, i);
                }
            }
        }
        const newPlacedAssets = placedAssets.map(asset => ({
            ...asset,
            pageIndex: indexMap.has(asset.pageIndex) ? indexMap.get(asset.pageIndex)! : asset.pageIndex
        }));
        setPagesMeta(newPagesMeta.map((p, idx) => ({ ...p, pageIndex: idx }))); 
        setPlacedAssets(newPlacedAssets);
        setDraggedPageIndex(null);
        setHasUnsavedChanges(true);
    };

    const handleAnalyzeLayout = () => {
        setIsAnalysisTypeModalOpen(true);
    };

    const confirmAnalysisType = async (type: 'public' | 'business') => {
        setIsAnalysisTypeModalOpen(false);
        setIsAnalysisModalOpen(true);
        setIsAnalyzing(true);
        setAnalysisResult(null);
        const descriptions = pagesMeta.map((p, idx) => {
            const label = p.description.trim() ? p.description : 'Untitled Page';
            return `${idx + 1}. ${label}`;
        });
        const result = await analyzeLayoutNarrative(descriptions, type);
        setAnalysisResult(result);
        setIsAnalyzing(false);
    };

    const handleApplyAnalysis = () => {
        if (!analysisResult) return;
        const newDescriptions = analysisResult.better_sequence.map(item => {
            return item.replace(/^\d+\.\s*/, '');
        });
        const newAltId = `ai-${Date.now()}`;
        const newPageCount = Math.max(pageCount, newDescriptions.length);
        let newPagesMeta = [...pagesMeta];
        if (newDescriptions.length > newPagesMeta.length) {
            for (let i = newPagesMeta.length; i < newDescriptions.length; i++) {
                newPagesMeta.push({
                    pageIndex: i,
                    description: '',
                    status: 'ACTIVE',
                    colorTheme: 'slate',
                    size: 'A3_LANDSCAPE'
                });
            }
        }
        newPagesMeta = newPagesMeta.map((meta, idx) => {
            if (idx < newDescriptions.length) {
                return { ...meta, description: newDescriptions[idx] };
            }
            return meta;
        });
        const newAlternative: LayoutAlternative = {
            id: newAltId,
            name: `AI Proposal`,
            pagesMeta: newPagesMeta,
            placedAssets: [...placedAssets], 
            pageCount: newPageCount,
            createdAt: Date.now()
        };
        setLayoutAlternatives(prev => [...prev, newAlternative]);
        setActiveAltId(newAltId);
        setPagesMeta(newPagesMeta);
        setPageCount(newPageCount);
        setHasUnsavedChanges(true);
        setIsAnalysisModalOpen(false);
        alert("AI Suggestions created as a new alternative tab.");
    };

    const handleAiPhaseRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAnalyzingPhases) return;
        setIsAnalyzingPhases(true);
        const activePages = pagesMeta
            .map((p, idx) => ({ pageIndex: idx, text: p.description }))
            .filter(p => p.text.trim().length > 0 && pagesMeta[p.pageIndex].status === 'ACTIVE');
        if (activePages.length === 0) {
            alert("Please add descriptions to active pages first.");
            setIsAnalyzingPhases(false);
            return;
        }
        const classifications = await classifyPagePhases(activePages);
        if (classifications && classifications.length > 0) {
            setPagesMeta(prev => {
                const newMeta = [...prev];
                classifications.forEach(c => {
                    if (newMeta[c.pageIndex]) {
                        newMeta[c.pageIndex] = { ...newMeta[c.pageIndex], aiPhase: c.phase as AnalysisPhase };
                    }
                });
                return newMeta;
            });
            setHasUnsavedChanges(true);
        }
        setIsAnalyzingPhases(false);
    };

    const handleAddAlternative = () => {
        const newAltId = `alt-${Date.now()}`;
        const currentAltName = layoutAlternatives.find(a => a.id === activeAltId)?.name || 'Original';
        const newAlternative: LayoutAlternative = {
            id: newAltId,
            name: `${currentAltName} (Copy)`,
            pagesMeta: JSON.parse(JSON.stringify(pagesMeta)),
            placedAssets: JSON.parse(JSON.stringify(placedAssets)),
            pageCount: pageCount,
            createdAt: Date.now()
        };
        setLayoutAlternatives(prev => [...prev, newAlternative]);
        setActiveAltId(newAltId);
    };

    const handleSwitchAlternative = (altId: string) => {
        const targetAlt = layoutAlternatives.find(a => a.id === altId);
        if (targetAlt) {
            setActiveAltId(altId);
            setPagesMeta(JSON.parse(JSON.stringify(targetAlt.pagesMeta)));
            setPlacedAssets(JSON.parse(JSON.stringify(targetAlt.placedAssets)));
            setPageCount(targetAlt.pageCount);
        }
    };

    useEffect(() => {
        if (!interactionState.type) return;
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!interactionState.uid) return;
            const dx = e.clientX - interactionState.startX;
            const dy = e.clientY - interactionState.startY;
            const scaleFactor = 0.8; 
            const currentAsset = placedAssets.find(a => a.uid === interactionState.uid);
            if (!currentAsset) return; 
            const pageIndex = currentAsset.pageIndex;
            const paperSize = pagesMeta[pageIndex]?.size || 'A3_LANDSCAPE';
            const isA3 = paperSize === 'A3_LANDSCAPE';
            const cellSize = isA3 ? CELL_SIZE_A3 : CELL_SIZE_A4;
            if (interactionState.type === 'MOVE') {
                const deltaXGrid = (dx / scaleFactor) / cellSize;
                const deltaYGrid = (dy / scaleFactor) / cellSize;
                const newX = Math.round(interactionState.initialX / cellSize + deltaXGrid);
                const newY = Math.round(interactionState.initialY / cellSize + deltaYGrid);
                setPlacedAssets(prev => prev.map(item => 
                    item.uid === interactionState.uid ? { ...item, x: newX, y: newY } : item
                ));
            } else if (interactionState.type === 'RESIZE') {
                const deltaWGrid = (dx / scaleFactor) / cellSize;
                const deltaHGrid = (dy / scaleFactor) / cellSize;
                const newW = Math.max(1, Math.round(interactionState.initialW / cellSize + deltaWGrid));
                const newH = Math.max(1, Math.round(interactionState.initialH / cellSize + deltaHGrid));
                setPlacedAssets(prev => prev.map(item => 
                    item.uid === interactionState.uid ? { ...item, w: newW, h: newH } : item
                ));
            }
        };
        const handleGlobalMouseUp = () => {
            setInteractionState(prev => ({ ...prev, type: null, uid: null }));
            setHasUnsavedChanges(true);
        };
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [interactionState, placedAssets, pagesMeta]);

    useEffect(() => {
        if (viewState !== 'VIEWER') return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const visibleIndices = getVisiblePageIndices();
            const maxSlide = visibleIndices.length - 1;
            if (e.key === 'ArrowRight') {
                if (viewerSlideIndex < maxSlide) setViewerSlideIndex(prev => prev + 1);
            } else if (e.key === 'ArrowLeft') {
                if (viewerSlideIndex > 0) setViewerSlideIndex(prev => prev - 1);
            } else if (e.key === 'Escape') {
                setViewState(lastViewState);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewState, viewerSlideIndex, lastViewState]);

    const handleSafeExit = (targetViewState?: ViewState, targetPath?: string) => {
        if (hasUnsavedChanges) {
            const confirmExit = window.confirm("저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?");
            if (!confirmExit) return;
        }
        setHasUnsavedChanges(false);
        if (targetPath) {
            navigate(targetPath);
        } else if (targetViewState) {
            setViewState(targetViewState);
            if (targetViewState === 'SPLIT') {
                setExpandedSection(null);
                setIsEditMode(false);
                setSelectedIds(new Set());
                setPlacedAssets([]);
                setPageCount(1);
            }
        }
    };

    const handleSectionClick = (section: 'LEFT' | 'RIGHT') => {
        setExpandedSection(section);
        setTimeout(() => {
            setViewState(section === 'LEFT' ? 'DIAGRAM' : 'MOCKUP');
        }, 800);
    };

    const handleBackToSplit = () => {
        handleSafeExit('SPLIT');
    };

    const initiatePageResize = (indices: number[], newSize: PaperSize) => {
        setPendingPageResize({ indices, newSize });
    };

    const confirmPageResize = () => {
        if (!pendingPageResize) return;
        setPagesMeta(prev => prev.map(p => {
            if (pendingPageResize.indices.includes(p.pageIndex)) {
                return { ...p, size: pendingPageResize.newSize };
            }
            return p;
        }));
        setHasUnsavedChanges(true);
        setPendingPageResize(null);
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAsset: Asset = {
            id: `new-${Date.now()}`,
            title: newAssetForm.title,
            assetType: 'Diagram',
            category: newAssetForm.category,
            categoryKo: newAssetForm.category, 
            imageUrl: newAssetForm.file ? URL.createObjectURL(newAssetForm.file) : 'https://picsum.photos/800/600?random=' + Date.now(),
            tags: [newAssetForm.facilityType, newAssetForm.projectType],
            date: new Date().toISOString().split('T')[0],
            downloads: 0,
            gridX: 1, gridY: 1, cols: 2, rows: 2,
            pageNumber: 0,
            contentDescription: newAssetForm.description,
            source: newAssetForm.source,
            facilityType: newAssetForm.facilityType,
            projectType: newAssetForm.projectType
        };
        setAssets(prev => [newAsset, ...prev]);
        setIsUploadDrawerOpen(false);
        setNewAssetForm({
            title: '', category: 'Logic Flow', projectType: 'General Competition',
            facilityType: '', source: '', description: '', file: null
        });
        alert('New Diagram Added Successfully!');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewAssetForm({ ...newAssetForm, file: e.target.files[0] });
        }
    };

    const handleSaveMockup = () => {
        if (editingAssetId) {
            setAssets(prev => prev.map(a => {
                if (a.id === editingAssetId) {
                    return {
                        ...a,
                        pageNumber: pageCount, 
                        layoutData: placedAssets, 
                    };
                }
                return a;
            }));
            setHasUnsavedChanges(false);
            alert("Project updated successfully!");
        } else {
            setIsSaveMockupModalOpen(true);
        }
    };

    const handleSaveMockupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const thumbnail = placedAssets.length > 0 ? placedAssets[0].asset.imageUrl : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7";
        const newMockupId = `mockup-${Date.now()}`;
        
        const newMockup: Asset = {
            id: newMockupId,
            title: mockupSaveForm.title,
            assetType: 'Proposal', 
            category: mockupSaveForm.category,
            categoryKo: mockupSaveForm.category === 'Public Competition' ? '공공현상' : '일반현상', 
            imageUrl: thumbnail, 
            tags: mockupSaveForm.tags.split(',').map(t => t.trim()).filter(t => t),
            date: new Date().toISOString().split('T')[0],
            downloads: 0,
            gridX: 1, gridY: 1, cols: 2, rows: 2,
            pageNumber: pageCount,
            source: 'User Layout',
            contentDescription: mockupSaveForm.description,
            layoutData: placedAssets
        };
        setAssets(prev => [newMockup, ...prev]);
        setIsSaveMockupModalOpen(false);
        setEditingAssetId(newMockupId);
        setMockupSaveForm({ title: '', category: 'Public Competition', tags: '', description: '' });
        setHasUnsavedChanges(false);
        alert("Layout saved to Mockups library!");
        setViewState('MOCKUP');
    };

    const handleLoadLayout = (asset: Asset) => {
        if (asset.layoutData) {
            setPlacedAssets(asset.layoutData);
            setEditingAssetId(asset.id);
            const maxPage = Math.max(...asset.layoutData.map(p => p.pageIndex), 0);
            setPageCount(maxPage + 1);
            setHasUnsavedChanges(false);
            setViewState('BUILDER');
        } else {
            alert("This mockup does not have editable layout data.");
        }
    };

    const getVisiblePageIndices = useCallback(() => {
        if (!viewerAsset && viewState !== 'VIEWER') return [];
        if (!viewerAsset || viewerAsset.id === 'temp-preview') {
             const indices = [];
             for(let i=0; i<pageCount; i++) {
                 const meta = pagesMeta[i];
                 if (!meta || meta.status !== 'HIDDEN') indices.push(i);
             }
             return indices;
        }
        if (!viewerAsset.layoutData) return [];
        const maxPage = Math.max(...viewerAsset.layoutData.map(p => p.pageIndex));
        return Array.from({length: maxPage + 1}, (_, i) => i);
    }, [viewerAsset, pageCount, pagesMeta, viewState]);

    const handlePlayPresentation = () => {
        const tempAsset: Asset = {
            id: 'temp-preview',
            title: 'Preview',
            assetType: 'Proposal',
            category: 'Preview',
            categoryKo: '미리보기',
            imageUrl: '',
            tags: [],
            date: '',
            downloads: 0,
            gridX: 0, gridY: 0, cols: 0, rows: 0,
            layoutData: placedAssets
        };
        setViewerAsset(tempAsset);
        setViewerSlideIndex(0);
        setLastViewState(viewState); 
        setViewState('VIEWER');
    };

    const handleDropOnPaper = (e: React.DragEvent, pageIndex: number) => {
        e.preventDefault();
        if (!draggedSourceAsset) return;
        const paperSize = pagesMeta[pageIndex]?.size || 'A3_LANDSCAPE';
        const isA3 = paperSize === 'A3_LANDSCAPE';
        const cellSize = isA3 ? CELL_SIZE_A3 : CELL_SIZE_A4;
        const gridCols = isA3 ? GRID_COLS_A3 : GRID_COLS_A4;
        const gridRows = isA3 ? GRID_ROWS_A3 : GRID_ROWS_A4;
        const paperRect = e.currentTarget.getBoundingClientRect();
        const scaleFactor = viewState === 'GRID_VIEW' ? gridZoom : 0.8;
        const dropX = (e.clientX - paperRect.left) / scaleFactor;
        const dropY = (e.clientY - paperRect.top) / scaleFactor;
        const gridX = Math.floor(dropX / cellSize);
        const gridY = Math.floor(dropY / cellSize);
        const defaultW = 12;
        const defaultH = 10;
        const newPlacement: PlacedAsset = {
            uid: `placed-${Date.now()}`,
            asset: draggedSourceAsset,
            pageIndex,
            x: Math.min(Math.max(0, gridX - defaultW/2), gridCols - defaultW),
            y: Math.min(Math.max(0, gridY - defaultH/2), gridRows - defaultH),
            w: defaultW,
            h: defaultH
        };
        setPlacedAssets(prev => [...prev, newPlacement]);
        setSelectedPlacedAssetId(newPlacement.uid);
        setDraggedSourceAsset(null);
        setHasUnsavedChanges(true);
    };

    const handlePageContextMenu = (pageIndex: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedPageIndices.has(pageIndex)) {
            setSelectedPageIndices(new Set([pageIndex]));
        }
        setContextMenu({ x: e.clientX, y: e.clientY, pageIndex });
    };

    const updatePageStatus = (status: PageStatus) => {
        const targets = selectedPageIndices.size > 0 ? Array.from(selectedPageIndices) : (contextMenu ? [contextMenu.pageIndex] : []);
        setPagesMeta(prev => prev.map(p => targets.includes(p.pageIndex) ? { ...p, status } : p));
        setContextMenu(null);
        setHasUnsavedChanges(true);
    };

    const updatePageColor = (colorTheme: PageColorTheme) => {
        const targets = selectedPageIndices.size > 0 ? Array.from(selectedPageIndices) : (contextMenu ? [contextMenu.pageIndex] : []);
        setPagesMeta(prev => prev.map(p => targets.includes(p.pageIndex) ? { ...p, colorTheme } : p));
        setContextMenu(null);
        setHasUnsavedChanges(true);
    };

    const updatePageDescription = (pageIndex: number, text: string) => {
        setPagesMeta(prev => prev.map(p => 
            p.pageIndex === pageIndex ? { ...p, description: text } : p
        ));
        setHasUnsavedChanges(true);
    };

    const handleGridMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) { 
            e.preventDefault();
            setIsGridPanning(true);
            if (gridContainerRef.current) {
                gridPanStart.current = {
                    x: e.clientX, y: e.clientY,
                    scrollLeft: gridContainerRef.current.scrollLeft, scrollTop: gridContainerRef.current.scrollTop
                };
            }
            return;
        }
        if (e.button === 0) {
            const target = e.target as HTMLElement;
            if (target === gridContainerRef.current || target.classList.contains('grid-bg')) {
                if (!e.shiftKey) setSelectedPageIndices(new Set()); 
                setIsSelecting(true);
                const rect = gridContainerRef.current!.getBoundingClientRect();
                const startX = e.clientX - rect.left + gridContainerRef.current!.scrollLeft;
                const startY = e.clientY - rect.top + gridContainerRef.current!.scrollTop;
                setSelectionBox({ startX, startY, endX: startX, endY: startY });
            }
        }
    };

    const handleGridMouseMove = (e: React.MouseEvent) => {
        if (isGridPanning && gridContainerRef.current) {
            e.preventDefault();
            const dx = e.clientX - gridPanStart.current.x;
            const dy = e.clientY - gridPanStart.current.y;
            gridContainerRef.current.scrollLeft = gridPanStart.current.scrollLeft - dx;
            gridContainerRef.current.scrollTop = gridPanStart.current.scrollTop - dy;
        }
        if (isSelecting && selectionBox && gridContainerRef.current) {
            const rect = gridContainerRef.current.getBoundingClientRect();
            const currentX = e.clientX - rect.left + gridContainerRef.current.scrollLeft;
            const currentY = e.clientY - rect.top + gridContainerRef.current.scrollTop;
            setSelectionBox({ ...selectionBox, endX: currentX, endY: currentY });
        }
    };

    const handleGridMouseUp = () => {
        if (isGridPanning) setIsGridPanning(false);
        if (isSelecting && selectionBox) {
            const newSelection = new Set(selectedPageIndices);
            const sbLeft = Math.min(selectionBox.startX, selectionBox.endX);
            const sbTop = Math.min(selectionBox.startY, selectionBox.endY);
            const sbRight = Math.max(selectionBox.startX, selectionBox.endX);
            const sbBottom = Math.max(selectionBox.startY, selectionBox.endY);
            const pageElements = document.querySelectorAll('.grid-page-item');
            pageElements.forEach((el) => {
                const rect = (el as HTMLElement).getBoundingClientRect();
                const containerRect = gridContainerRef.current!.getBoundingClientRect();
                const pLeft = rect.left - containerRect.left + gridContainerRef.current!.scrollLeft;
                const pTop = rect.top - containerRect.top + gridContainerRef.current!.scrollTop;
                const pRight = pLeft + rect.width;
                const pBottom = pTop + rect.height;
                if (pLeft < sbRight && pRight > sbLeft && pTop < sbBottom && pBottom > sbTop) {
                    const idx = Number(el.getAttribute('data-page-index'));
                    newSelection.add(idx);
                }
            });
            setSelectedPageIndices(newSelection);
        }
        setIsSelecting(false);
        setSelectionBox(null);
    };

    const togglePageSelection = (idx: number, multi: boolean) => {
        const newSet = new Set(multi ? selectedPageIndices : []);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        setSelectedPageIndices(newSet);
    };

    const getGroupedAssets = () => {
        const type: AssetType = viewState === 'DIAGRAM' ? 'Diagram' : 'Proposal';
        const filtered = assets.filter(a => a.assetType === type);
        const categories = Array.from(new Set(filtered.map(a => a.category)));
        return categories.map(cat => ({
            category: cat,
            categoryKo: filtered.find(a => a.category === cat)?.categoryKo || cat,
            items: filtered.filter(a => a.category === cat)
        }));
    };
    const groupedAssets = (viewState === 'DIAGRAM' || viewState === 'MOCKUP') ? getGroupedAssets() : [];

    const handleGridWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setGridZoom(prev => Math.min(Math.max(prev * delta, 0.1), 1.5));
    };
    
    const handlePaperClick = (e: React.MouseEvent) => {
        setSelectedPlacedAssetId(null);
        e.stopPropagation();
    };

    const handleDragOverPaper = (e: React.DragEvent) => {
         e.preventDefault(); 
    };

    const handleAssetMouseDown = (e: React.MouseEvent, asset: PlacedAsset) => {
        e.stopPropagation();
        e.preventDefault();
        if (isResizingEnabled) return;
        setSelectedPlacedAssetId(asset.uid);
        const cellSize = (pagesMeta[asset.pageIndex]?.size === 'A3_LANDSCAPE') ? CELL_SIZE_A3 : CELL_SIZE_A4;
        setInteractionState({
            type: 'MOVE',
            uid: asset.uid,
            direction: null,
            startX: e.clientX,
            startY: e.clientY,
            initialX: asset.x * cellSize,
            initialY: asset.y * cellSize,
            initialW: asset.w * cellSize,
            initialH: asset.h * cellSize
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, asset: PlacedAsset, direction: ResizeDirection) => {
        e.stopPropagation();
        const cellSize = (pagesMeta[asset.pageIndex]?.size === 'A3_LANDSCAPE') ? CELL_SIZE_A3 : CELL_SIZE_A4;
        setInteractionState({
            type: 'RESIZE',
            uid: asset.uid,
            direction,
            startX: e.clientX,
            startY: e.clientY,
            initialX: asset.x * cellSize,
            initialY: asset.y * cellSize,
            initialW: asset.w * cellSize,
            initialH: asset.h * cellSize
        });
    };

    const handleRemoveAsset = (uid: string) => {
        setPlacedAssets(prev => prev.filter(p => p.uid !== uid));
        setHasUnsavedChanges(true);
        setSelectedPlacedAssetId(null);
    };

    // --- Detail Edit Handlers ---
    const handleDetailChange = (field: keyof Asset, value: any) => {
        if (!editingAssetData) return;
        setEditingAssetData({ ...editingAssetData, [field]: value });
    };

    const handleSaveDetail = () => {
        if (editingAssetData) {
            setAssets(prev => prev.map(a => a.id === editingAssetData.id ? editingAssetData : a));
            setSelectedAsset(editingAssetData);
            setIsDetailEditing(false);
        }
    };

    // --- RENDER: Landing (Split Screen) ---
    if (viewState === 'SPLIT') {
        return (
            <div className="fixed inset-0 w-full h-full flex bg-slate-900 overflow-hidden z-[100]">
                {/* Left: DIAGRAM */}
                <div 
                    onClick={() => handleSectionClick('LEFT')}
                    className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer group overflow-hidden border-r border-slate-800
                    ${expandedSection === 'LEFT' ? 'w-full' : expandedSection === 'RIGHT' ? 'w-0' : 'w-1/2'}`}
                >
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60" style={{ backgroundImage: `url(${BG_DIAGRAM})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-12 lg:p-20">
                        <div className="transform transition-transform duration-500 group-hover:-translate-y-4">
                            <span className="text-blue-400 font-bold tracking-widest text-xs uppercase mb-4 block opacity-0 group-hover:opacity-100 transition-opacity delay-100">01 — Logic Database</span>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">DIAGRAMS</h1>
                        </div>
                    </div>
                </div>

                {/* Right: MOCKUPS */}
                <div 
                    onClick={() => handleSectionClick('RIGHT')}
                    className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer group overflow-hidden
                    ${expandedSection === 'RIGHT' ? 'w-full' : expandedSection === 'LEFT' ? 'w-0' : 'w-1/2'}`}
                >
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60" style={{ backgroundImage: `url(${BG_MOCKUP})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-12 lg:p-20 items-end text-right">
                        <div className="transform transition-transform duration-500 group-hover:-translate-y-4">
                            <span className="text-blue-400 font-bold tracking-widest text-xs uppercase mb-4 block opacity-0 group-hover:opacity-100 transition-opacity delay-100">02 — Visualization</span>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">MOCKUPS</h1>
                        </div>
                    </div>
                </div>

                {/* Home Exit Mark */}
                <button 
                    onClick={() => handleSafeExit(undefined, '/')}
                    className="absolute top-8 left-8 z-[110] group flex items-center gap-3"
                >
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center group-hover:bg-white transition-all duration-300">
                        <ArrowLeft size={16} className="text-white group-hover:text-black transition-colors" />
                    </div>
                    <span className="text-white/70 text-[10px] font-bold tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">BACK TO HOME</span>
                </button>
            </div>
        );
    }

    // --- RENDER: Viewer Mode (Presentation) ---
    if (viewState === 'VIEWER' && viewerAsset) {
        // ... (Same as before)
        const visibleIndices = getVisiblePageIndices();
        const currentRealIndex = visibleIndices[viewerSlideIndex];
        const currentPaperSize = (pagesMeta[currentRealIndex]?.size) || 'A3_LANDSCAPE'; 

        return (
            <div className="fixed inset-0 w-full h-full bg-black z-[200] flex flex-col font-sans select-none focus:outline-none" tabIndex={0}>
                {/* Viewer Header */}
                <div className="absolute top-0 left-0 right-0 h-20 z-20 flex items-center justify-between px-8 text-white">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setViewState(lastViewState)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-all"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold tracking-wide">{viewerAsset.title}</h2>
                            <p className="text-xs opacity-50">
                                {visibleIndices.length > 0 ? `Slide ${viewerSlideIndex + 1} / ${visibleIndices.length}` : 'No Visible Slides'}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => handleLoadLayout(viewerAsset)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-blue-500 hover:text-white transition-colors"
                    >
                        <Edit2 size={14} /> Edit in Builder
                    </button>
                </div>

                {/* Viewer Canvas Area */}
                <div className="flex-1 overflow-hidden relative flex items-center justify-center">
                    {currentRealIndex !== undefined && (
                        <div 
                            className="bg-white transition-transform duration-300 ease-out shadow-2xl relative"
                            style={{
                                width: `${currentPaperSize === 'A3_LANDSCAPE' ? A3_WIDTH_PX : A4_WIDTH_PX}px`,
                                height: `${currentPaperSize === 'A3_LANDSCAPE' ? A3_WIDTH_PX / 1.414 : A4_WIDTH_PX * 1.414}px`,
                                transform: `scale(0.85)`, 
                            }}
                        >
                            {placedAssets
                                .filter(item => item.pageIndex === currentRealIndex)
                                .map(item => {
                                    const isA3 = currentPaperSize === 'A3_LANDSCAPE';
                                    const cellSize = isA3 ? CELL_SIZE_A3 : CELL_SIZE_A4;
                                    return (
                                        <div
                                            key={item.uid}
                                            className="absolute"
                                            style={{
                                                left: `${item.x * cellSize}px`,
                                                top: `${item.y * cellSize}px`,
                                                width: `${item.w * cellSize}px`,
                                                height: `${item.h * cellSize}px`,
                                            }}
                                        >
                                            <img 
                                                src={item.asset.imageUrl} 
                                                alt="" 
                                                className="w-full h-full object-cover pointer-events-none" 
                                            />
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}
                </div>

                {/* Viewer Pagination Dots */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                    {visibleIndices.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setViewerSlideIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === viewerSlideIndex ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // --- RENDER: Gallery Archive View ---
    if (viewState === 'DIAGRAM' || viewState === 'MOCKUP') {
        return (
            <div className="fixed inset-0 w-full h-full bg-white overflow-hidden flex flex-col z-[100]">
                {/* Top Toolbar */}
                <div className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-30 transition-all">
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={handleBackToSplit} 
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-600 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none font-sans">
                                {viewState === 'DIAGRAM' ? 'Diagram Archive' : 'Proposal Mockups'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase font-sans">
                                {groupedAssets.reduce((acc, curr) => acc + curr.items.length, 0)} Assets Collected
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {viewState === 'DIAGRAM' && (
                            <button 
                                onClick={() => setViewState('BUILDER')}
                                className="group flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-full hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-bold"
                            >
                                <LayoutTemplate size={16} />
                                <span>Layout Builder</span>
                            </button>
                        )}
                        <button 
                            onClick={() => setIsUploadDrawerOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all text-xs font-bold shadow-lg"
                        >
                            <Upload size={16} /> Upload
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-32">
                    <div className="max-w-[1800px] mx-auto px-8 pt-8 space-y-16">
                        {groupedAssets.map((group, groupIdx) => (
                            <div key={groupIdx} className="animate-fade-in-up" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                                <div className="sticky top-0 bg-white/95 backdrop-blur z-20 py-4 mb-4 border-b border-slate-100 flex items-baseline justify-between">
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-serif italic">
                                        {group.categoryKo} 
                                        <span className="text-slate-400 font-normal ml-2 text-lg tracking-normal not-italic font-sans">/ {group.category}</span>
                                    </h3>
                                    <span className="text-xs font-mono text-slate-400">{group.items.length} Items</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-8 gap-y-12">
                                    {group.items.map(asset => (
                                        <div 
                                            key={asset.id}
                                            onClick={() => {
                                                setSelectedAsset(asset);
                                                setEditingAssetData(asset);
                                                setIsDetailEditing(false); // Reset edit mode when opening
                                            }}
                                            className="group relative flex flex-col gap-3 cursor-pointer"
                                        >
                                            {/* ... Card Content (Updated to Detailed View) ... */}
                                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 rounded-sm">
                                                <img 
                                                    src={asset.imageUrl} 
                                                    alt={asset.title} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                                
                                                {viewState === 'MOCKUP' && asset.layoutData && (
                                                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-black/20 backdrop-blur-[2px]">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleLoadLayout(asset); }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 size={12} /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); 
                                                                setViewerAsset(asset); 
                                                                setPlacedAssets(asset.layoutData || []); 
                                                                setViewerSlideIndex(0); 
                                                                setLastViewState('MOCKUP'); 
                                                                setViewState('VIEWER'); 
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full font-bold text-xs hover:bg-slate-800 transition-colors"
                                                        >
                                                            <Play size={12} /> View
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 px-1 mt-2">
                                                <h4 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors font-serif leading-tight">
                                                    {asset.title}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    {asset.projectType && (
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{asset.projectType}</span>
                                                    )}
                                                    {asset.facilityType && (
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{asset.facilityType}</span>
                                                    )}
                                                </div>
                                                {asset.contentDescription && (
                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                        {asset.contentDescription}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                                                    <div className="flex flex-col gap-1">
                                                         <div className="flex flex-wrap gap-1">
                                                            {asset.tags.slice(0, 3).map(tag => (
                                                                <span key={tag} className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">#{tag}</span>
                                                            ))}
                                                         </div>
                                                         <span className="text-[10px] font-mono text-slate-400 mt-1">
                                                            {asset.source || "Unknown Source"} • P.{asset.pageNumber || 0}
                                                         </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upload Drawer (Same as before) */}
                <div className={`fixed inset-y-0 right-0 z-[150] w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col ${isUploadDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                     <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900">Add Asset</h3>
                        <button onClick={() => setIsUploadDrawerOpen(false)}><X size={18} /></button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        <form onSubmit={handleUploadSubmit} className="space-y-6">
                            {/* ... Upload form ... */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Image</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 cursor-pointer relative bg-slate-50">
                                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                    <FileImage className="text-slate-400 mx-auto mb-2" size={24} />
                                    <p className="text-xs text-slate-500">Click to upload</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Title</label>
                                <input required type="text" value={newAssetForm.title} onChange={e => setNewAssetForm({...newAssetForm, title: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-sm" placeholder="Title" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                                <input type="text" value={newAssetForm.category} onChange={e => setNewAssetForm({...newAssetForm, category: e.target.value})} className="w-full border border-slate-200 p-2 rounded-lg text-sm" placeholder="Category" />
                            </div>
                            <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm">Upload Asset</button>
                        </form>
                    </div>
                </div>
                {isUploadDrawerOpen && <div className="fixed inset-0 bg-black/20 z-[140]" onClick={() => setIsUploadDrawerOpen(false)} />}

                {/* --- DETAIL MODAL (Updated) --- */}
                {selectedAsset && editingAssetData && !selectedAsset.layoutData && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setSelectedAsset(null)} />
                        <div className="relative bg-white w-[90%] md:w-[75%] h-[85%] md:h-[80%] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-up">
                            
                            {/* Left: Image */}
                            <div className="w-full md:w-[55%] h-1/2 md:h-full bg-slate-100 relative border-r border-slate-100">
                                <img src={editingAssetData.imageUrl} alt={editingAssetData.title} className="w-full h-full object-contain bg-slate-900/5" />
                            </div>

                            {/* Right: Info & Edit */}
                            <div className="w-full md:w-[45%] h-1/2 md:h-full bg-white flex flex-col">
                                {/* Modal Header */}
                                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
                                    <div className="flex gap-2">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wide">{editingAssetData.categoryKo}</span>
                                        {isDetailEditing && <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg uppercase tracking-wide animate-pulse">Editing</span>}
                                    </div>
                                    <button onClick={() => setSelectedAsset(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                                    {/* Title Section */}
                                    <div>
                                        {isDetailEditing ? (
                                            <input 
                                                type="text" 
                                                value={editingAssetData.title}
                                                onChange={(e) => handleDetailChange('title', e.target.value)}
                                                className="w-full text-3xl font-bold text-slate-900 font-serif italic border-b border-blue-500 focus:outline-none pb-1 bg-transparent"
                                            />
                                        ) : (
                                            <h2 className="text-3xl font-bold text-slate-900 font-serif italic leading-tight">{editingAssetData.title}</h2>
                                        )}
                                    </div>

                                    {/* Attributes Grid */}
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Type</label>
                                            {isDetailEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={editingAssetData.projectType || ''}
                                                    onChange={(e) => handleDetailChange('projectType', e.target.value)}
                                                    className="w-full text-sm font-medium text-slate-800 border-b border-slate-300 focus:border-blue-500 focus:outline-none pb-1"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-slate-800">{editingAssetData.projectType || '-'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Facility Type</label>
                                            {isDetailEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={editingAssetData.facilityType || ''}
                                                    onChange={(e) => handleDetailChange('facilityType', e.target.value)}
                                                    className="w-full text-sm font-medium text-slate-800 border-b border-slate-300 focus:border-blue-500 focus:outline-none pb-1"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-slate-800">{editingAssetData.facilityType || '-'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Source</label>
                                            {isDetailEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={editingAssetData.source || ''}
                                                    onChange={(e) => handleDetailChange('source', e.target.value)}
                                                    className="w-full text-sm font-medium text-slate-800 border-b border-slate-300 focus:border-blue-500 focus:outline-none pb-1"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-slate-800">{editingAssetData.source || '-'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Page Number</label>
                                            {isDetailEditing ? (
                                                <input 
                                                    type="number" 
                                                    value={editingAssetData.pageNumber || 0}
                                                    onChange={(e) => handleDetailChange('pageNumber', parseInt(e.target.value) || 0)}
                                                    className="w-full text-sm font-medium text-slate-800 border-b border-slate-300 focus:border-blue-500 focus:outline-none pb-1"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-slate-800">P.{editingAssetData.pageNumber || 0}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tags</label>
                                        {isDetailEditing ? (
                                            <input 
                                                type="text" 
                                                value={editingAssetData.tags.join(', ')}
                                                onChange={(e) => handleDetailChange('tags', e.target.value.split(',').map(t => t.trim()))}
                                                className="w-full text-sm font-medium text-slate-800 border-b border-slate-300 focus:border-blue-500 focus:outline-none pb-1"
                                                placeholder="Urban, Eco, Complex..."
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {editingAssetData.tags.map(tag => (
                                                    <span key={tag} className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                        {isDetailEditing ? (
                                            <textarea 
                                                value={editingAssetData.contentDescription || ''}
                                                onChange={(e) => handleDetailChange('contentDescription', e.target.value)}
                                                className="w-full h-32 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-600 leading-relaxed font-serif">
                                                {editingAssetData.contentDescription || "No description provided."}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50">
                                    {isDetailEditing ? (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIsDetailEditing(false)}
                                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveDetail}
                                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <Save size={16} /> Save Changes
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIsDetailEditing(true)}
                                                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
                                            >
                                                <FilePenLine size={16} /> Edit Info
                                            </button>
                                            <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2">
                                                <Download size={16} /> Download Asset
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: Builder Mode (RESTORED) ---
    if (viewState === 'BUILDER' || viewState === 'GRID_VIEW') {
        const isGrid = viewState === 'GRID_VIEW';
        return (
            <div className="fixed inset-0 w-full h-full bg-[#f8fafc] overflow-hidden flex flex-col z-[100] font-sans">
                {/* Header */}
                <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-100 flex items-center justify-between px-6 z-20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleSafeExit('DIAGRAM')} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /></button>
                        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
                        {!isGrid && <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>{isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}</button>}
                        <div className="flex items-center gap-4"><h2 className="text-xl font-sans font-bold tracking-tight text-slate-900">Layout Builder</h2>{hasUnsavedChanges && <span className="w-2 h-2 bg-amber-500 rounded-full" title="Unsaved Changes"></span>}</div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
                        <div className="flex items-center bg-slate-100/50 rounded-full p-1 gap-1 border border-slate-200/50 shadow-inner">
                            <button onClick={() => setViewState('BUILDER')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider ${!isGrid ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><Edit2 size={12} /> Edit</button>
                            <div className="w-[1px] h-3 bg-slate-200/50 mx-0.5"></div>
                            <button onClick={() => setViewState('GRID_VIEW')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider ${isGrid ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><LayoutGrid size={12} /> Grid</button>
                            <div className="w-[1px] h-3 bg-slate-200/50 mx-0.5"></div>
                            <button onClick={handlePlayPresentation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 hover:bg-white/50"><Play size={12} /> Play</button>
                        </div>
                        {!isGrid && (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setPageCount(Math.max(1, pageCount - 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-colors"><Minus size={14} /></button>
                                <div className="text-xs font-bold text-slate-900 font-mono tracking-widest"><span className="text-slate-900">{String(currentPageInView).padStart(2, '0')}</span><span className="text-slate-300 mx-1">/</span><span className="text-slate-400">{String(pageCount).padStart(2, '0')}</span></div>
                                <button onClick={() => setPageCount(Math.min(60, pageCount + 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-colors"><Plus size={14} /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100/50 rounded-full p-1 border border-slate-200/50 shadow-inner">
                        {!isGrid && (<><button onClick={handleFetchAiInsight} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:bg-white hover:shadow-sm transition-all"><ListChecks size={12} /><span>Checklist AI</span></button><div className="w-[1px] h-3 bg-slate-200/50 mx-0.5"></div><button onClick={() => setIsProjectSettingsOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-white hover:text-slate-900 transition-all"><Settings size={12} /><span>Context</span></button><div className="w-[1px] h-3 bg-slate-200/50 mx-0.5"></div></>)}
                        {isGrid && (<><button onClick={handleAnalyzeLayout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all"><Sparkles size={12} /> <span>AI Analysis</span></button><div className="w-[1px] h-3 bg-slate-200/50 mx-0.5"></div><div className="relative group/balance"><button onClick={() => setShowAnalysisGraph(!showAnalysisGraph)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${showAnalysisGraph ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}><BarChart3 size={12} /><span>Balance</span></button><div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover/balance:opacity-100 group-hover/balance:visible transition-all duration-200 z-[60]"><div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[140px] flex flex-col gap-1"><button onClick={handleAiPhaseRefresh} disabled={isAnalyzingPhases} className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors w-full text-left">{isAnalyzingPhases ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}<span>AI Re-classify</span></button></div></div></div><div className="w-[1px] h-3 bg-slate-200/50 mx-0.5"></div></>)}
                        <button onClick={handleSaveMockup} className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 shadow-md transition-all"><Cloud size={12} /> <span>{editingAssetId ? 'Update' : 'Save'}</span></button>
                    </div>
                </div>

                {isGrid ? (
                    <div ref={gridContainerRef} className={`flex-1 bg-[#2b2b2b] overflow-auto p-12 custom-scrollbar grid-bg relative ${isGridPanning ? 'cursor-grabbing' : 'cursor-default'}`} onWheel={handleGridWheel} onMouseDown={handleGridMouseDown} onMouseMove={handleGridMouseMove} onMouseUp={handleGridMouseUp} onMouseLeave={handleGridMouseUp}>
                        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/50 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 border border-white/10 shadow-2xl">
                            {layoutAlternatives.map((alt) => (<div key={alt.id} className="relative group">{editingAltId === alt.id ? (<form onSubmit={handleRenameAltSubmit} className="px-2"><input type="text" value={editAltName} onChange={(e) => setEditAltName(e.target.value)} onBlur={handleRenameAltSubmit} autoFocus className="w-24 px-2 py-1 text-xs bg-white text-slate-900 rounded outline-none" /></form>) : (<button onClick={(e) => { e.stopPropagation(); handleSwitchAlternative(alt.id); }} onContextMenu={(e) => { e.stopPropagation(); if (alt.id !== 'default') handleTabContextMenu(e, alt.id); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeAltId === alt.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>{alt.id.startsWith('ai-') && <Sparkles size={10} />}{alt.name}</button>)}</div>))}
                            <div className="w-[1px] h-4 bg-white/10 mx-1"></div><button onClick={(e) => { e.stopPropagation(); handleAddAlternative(); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><PlusSquare size={14} /></button>
                        </div>
                        {tabContextMenu && (<div className="fixed z-[300] bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[120px]" style={{ top: tabContextMenu.y, left: tabContextMenu.x }}><button onClick={(e) => { e.stopPropagation(); handleRenameAltStart(tabContextMenu.altId); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left"><Edit2 size={12} /> Rename</button><button onClick={(e) => { e.stopPropagation(); handleDeleteAlt(tabContextMenu.altId); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"><Trash2 size={12} /> Delete</button></div>)}
                        {isSelecting && selectionBox && (<div className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50" style={{ left: Math.min(selectionBox.startX, selectionBox.endX), top: Math.min(selectionBox.startY, selectionBox.endY), width: Math.abs(selectionBox.endX - selectionBox.startX), height: Math.abs(selectionBox.endY - selectionBox.startY), }} />)}
                        <div className="min-h-full pb-32 relative pt-12">
                            <div className="flex flex-wrap gap-12 justify-center content-start">
                                {Array.from({ length: pageCount }).map((_, pageIdx) => {
                                    const pageNumStr = getFormattedPageNumber(pageIdx); const meta = pagesMeta[pageIdx];
                                    let displayLabel = pageNumStr; if (meta?.status === 'SKIP_COUNT') displayLabel = meta.description?.trim() ? meta.description : 'ZERO'; else if (meta?.status === 'HIDDEN') displayLabel = 'HIDDEN'; else displayLabel = `Page ${parseInt(pageNumStr, 10)}`;
                                    let phaseColor = null; if (showAnalysisGraph) { const phase = meta.aiPhase ? meta.aiPhase : getPhaseFromDescription(meta.description || '', meta.status || 'ACTIVE'); if (phase !== 'excluded') phaseColor = PHASE_COLORS[phase]; else phaseColor = PHASE_COLORS.excluded; }
                                    return (<div key={pageIdx} draggable={!isSelecting && !isGridPanning} onDragStart={(e) => handlePageDragStart(e, pageIdx)} onDragOver={(e) => handlePageDragOver(e, pageIdx)} onDrop={(e) => handlePageDrop(e, pageIdx)} className={`transition-all duration-300 ${draggedPageIndex === pageIdx ? 'opacity-20 scale-90' : 'opacity-100'}`}><GridPageThumbnail pageIndex={pageIdx} meta={pagesMeta[pageIdx]} placedAssets={placedAssets} zoom={gridZoom} isSelected={selectedPageIndices.has(pageIdx)} onToggleSelect={togglePageSelection} onContextMenu={handlePageContextMenu} onDescriptionChange={updatePageDescription} themeColors={themeColors} pageLabel={displayLabel} A3_WIDTH={A3_WIDTH_PX} A4_WIDTH={A4_WIDTH_PX} CELL_A3={CELL_SIZE_A3} CELL_A4={CELL_SIZE_A4} analysisColor={phaseColor} /></div>);
                                })}
                            </div>
                        </div>
                        {showAnalysisGraph && <LayoutAnalysisGraph pagesMeta={pagesMeta} />}
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden">
                        <div className={`bg-white border-r border-slate-100 flex flex-col z-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
                            <div className="p-5 flex-shrink-0">
                                <div className="relative mb-6"><Search className="absolute left-0 top-2 text-slate-300" size={14} /><input type="text" value={builderSearchTerm} onChange={(e) => setBuilderSearchTerm(e.target.value)} placeholder="Search assets..." className="w-full pl-6 pr-2 py-1.5 text-xs bg-transparent border-b border-slate-200 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 font-sans transition-colors" /></div>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{['All', ...Array.from(new Set(assets.filter(a => a.assetType === 'Diagram').map(a => a.category)))].map(cat => (<button key={cat} onClick={() => setBuilderCategoryFilter(cat)} className={`px-2 py-1 text-[10px] whitespace-nowrap rounded-md transition-all font-bold ${builderCategoryFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>{cat}</button>))}</div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 custom-scrollbar">
                                {assets.filter(a => a.assetType === 'Diagram' && (builderCategoryFilter === 'All' || a.category === builderCategoryFilter)).length > 0 ? (assets.filter(a => a.assetType === 'Diagram' && (builderCategoryFilter === 'All' || a.category === builderCategoryFilter)).map(asset => (<div key={asset.id} draggable onDragStart={(e) => { setDraggedSourceAsset(asset); e.dataTransfer.effectAllowed = "copy"; }} className="group cursor-grab active:cursor-grabbing"><div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden mb-2 relative border border-transparent group-hover:border-slate-200 transition-all"><img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" /></div><div className="font-sans text-xs font-bold text-slate-700 truncate leading-tight group-hover:text-blue-600 transition-colors">{asset.title}</div></div>))) : (<div className="text-center py-10 text-slate-400"><p className="text-xs font-sans">No assets found.</p></div>)}
                            </div>
                        </div>
                        <div ref={scrollContainerRef} onScroll={handleCanvasScroll} className="flex-1 bg-[#f8fafc] overflow-auto flex flex-col items-center gap-12 pt-8" onClick={handlePaperClick}>
                            <div className="sticky top-0 z-[60] w-full max-w-[800px] px-8 mb-4">
                                <div className="bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-slate-200 px-6 py-2 flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400 font-mono">Page {currentPageInView}</span><div className="h-4 w-[1px] bg-slate-200"></div><input type="text" value={pagesMeta[currentPageInView - 1]?.description || ''} onChange={(e) => updatePageDescription(currentPageInView - 1, e.target.value)} placeholder="Describe the main logic of this page (Synced with Grid)..." className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none" /><button onClick={handleFetchAiInsight} className="text-emerald-500 hover:text-emerald-700 p-1.5 hover:bg-emerald-50 rounded-full transition-colors" title="Get Checklist"><ListChecks size={16} /></button>
                                </div>
                            </div>
                            {Array.from({ length: pageCount }).map((_, pageIdx) => {
                                const paperSize = pagesMeta[pageIdx]?.size || 'A3_LANDSCAPE'; const isA3 = paperSize === 'A3_LANDSCAPE'; const widthPx = isA3 ? A3_WIDTH_PX : A4_WIDTH_PX; const heightPx = isA3 ? A3_WIDTH_PX / 1.414 : A4_WIDTH_PX * 1.414; const cellSize = isA3 ? CELL_SIZE_A3 : CELL_SIZE_A4; const pageNumStr = getFormattedPageNumber(pageIdx);
                                return (
                                <div key={pageIdx} className="relative group/page page-container" data-page-index={pageIdx} onClick={(e) => { e.stopPropagation(); setCurrentPageInView(pageIdx + 1); }}>
                                    <div className="absolute top-0 -left-12 bottom-0 flex flex-col justify-center opacity-0 group-hover/page:opacity-100 transition-opacity"><div className="bg-white border border-slate-200 rounded-lg shadow-sm p-1 flex flex-col gap-1"><button onClick={() => initiatePageResize([pageIdx], 'A3_LANDSCAPE')} className={`text-[9px] font-bold px-2 py-1 rounded ${isA3 ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>A3</button><button onClick={() => initiatePageResize([pageIdx], 'A4_PORTRAIT')} className={`text-[9px] font-bold px-2 py-1 rounded ${!isA3 ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>A4</button></div></div>
                                    <div onDragOver={handleDragOverPaper} onDrop={(e) => handleDropOnPaper(e, pageIdx)} onClick={handlePaperClick} className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative overflow-visible border border-slate-100/50" style={{ width: `${widthPx}px`, height: `${heightPx}px`, transform: 'scale(0.8)', transformOrigin: 'top center', marginBottom: isA3 ? '-160px' : '-220px', backgroundImage: `radial-gradient(#e2e8f0 1px, transparent 1px), radial-gradient(#f1f5f9 1px, transparent 1px)`, backgroundSize: `${cellSize * 6}px ${cellSize * 6}px, ${cellSize}px ${cellSize}px`, }}>
                                        {placedAssets.filter(p => p.pageIndex === pageIdx).map((item) => {
                                            const isSelected = selectedPlacedAssetId === item.uid;
                                            return (
                                                <div key={item.uid} className={`absolute group/item ${isSelected ? 'z-50' : 'z-10'}`} style={{ left: `${item.x * cellSize}px`, top: `${item.y * cellSize}px`, width: `${item.w * cellSize}px`, height: `${item.h * cellSize}px`, }} onMouseDown={(e) => handleAssetMouseDown(e, item)} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => { e.preventDefault(); handleRemoveAsset(item.uid); }}>
                                                    {isSelected && (<div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-2xl z-[60]"><button onClick={(e) => { e.stopPropagation(); setIsResizingEnabled(!isResizingEnabled); }} className={`p-2 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${isResizingEnabled ? 'bg-blue-600' : 'hover:bg-white/20'}`} title="Resize">{isResizingEnabled ? <Check size={14} /> : <Expand size={14} />}</button><div className="w-[1px] h-4 bg-white/20 mx-1"></div><div className="relative"><button onClick={(e) => { e.stopPropagation(); setIsArchiSpeakOpen(!isArchiSpeakOpen); }} className={`p-2 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${isArchiSpeakOpen ? 'bg-indigo-600' : 'hover:bg-white/20'}`} title="AI Archi-Speak"><MessageSquareQuote size={14} /></button>{isArchiSpeakOpen && (<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-slate-800 animate-fade-in origin-bottom" onClick={(e) => e.stopPropagation()}><div className="flex flex-col gap-2"><textarea value={archiSpeakDraft} onChange={(e) => setArchiSpeakDraft(e.target.value)} placeholder="Write a draft..." className="w-full text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-16" /><button onClick={handleGenerateArchiSpeak} disabled={isArchiSpeakLoading} className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">{isArchiSpeakLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}{archiSpeakDraft.trim() ? "Style Transfer" : "Auto Generate"}</button></div><div className="my-2 border-t border-slate-100"></div><div className="flex justify-between items-center"><div className="flex bg-slate-100 rounded-lg p-0.5"><button onClick={() => updateAssetCaptionStyle(item.uid, { captionPosition: 'top' })} className={`p-1 rounded ${item.captionPosition === 'top' ? 'bg-white shadow-sm' : 'text-slate-400'}`}><ArrowUp size={10} /></button><button onClick={() => updateAssetCaptionStyle(item.uid, { captionPosition: 'bottom' })} className={`p-1 rounded ${item.captionPosition !== 'top' ? 'bg-white shadow-sm' : 'text-slate-400'}`}><ArrowDown size={10} /></button></div><div className="flex bg-slate-100 rounded-lg p-0.5"><button onClick={() => updateAssetCaptionStyle(item.uid, { captionAlign: 'left' })} className={`p-1 rounded ${item.captionAlign === 'left' ? 'bg-white shadow-sm' : 'text-slate-400'}`}><AlignLeft size={10} /></button><button onClick={() => updateAssetCaptionStyle(item.uid, { captionAlign: 'center' })} className={`p-1 rounded ${item.captionAlign === 'center' ? 'bg-white shadow-sm' : 'text-slate-400'}`}><AlignCenter size={10} /></button><button onClick={() => updateAssetCaptionStyle(item.uid, { captionAlign: 'right' })} className={`p-1 rounded ${item.captionAlign === 'right' ? 'bg-white shadow-sm' : 'text-slate-400'}`}><AlignRight size={10} /></button></div><div className="flex bg-slate-100 rounded-lg p-0.5"><button onClick={() => updateAssetCaptionStyle(item.uid, { captionSize: 'xs' })} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${item.captionSize === 'xs' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>S</button><button onClick={() => updateAssetCaptionStyle(item.uid, { captionSize: 'sm' })} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${item.captionSize === 'sm' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>M</button><button onClick={() => updateAssetCaptionStyle(item.uid, { captionSize: 'base' })} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${item.captionSize === 'base' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>L</button></div></div></div>)}</div><div className="w-[1px] h-4 bg-white/20 mx-1"></div><button onClick={(e) => { e.stopPropagation(); handleRemoveAsset(item.uid); }} className="p-2 hover:bg-rose-500/80 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><Trash2 size={14} /></button></div>)}
                                                    <div className={`w-full h-full relative transition-all duration-200 flex flex-col ${isSelected ? 'ring-1 ring-blue-500 shadow-xl' : 'hover:ring-1 hover:ring-blue-200'}`}>
                                                        {item.caption && item.captionPosition === 'top' && (<div className={`mb-2 w-[120%] -ml-[10%] text-slate-900 leading-tight font-serif ${item.captionAlign === 'center' ? 'text-center' : item.captionAlign === 'right' ? 'text-right' : 'text-left'} ${item.captionSize === 'sm' ? 'text-sm' : item.captionSize === 'base' ? 'text-base' : 'text-[10px]'}`}>{item.caption}</div>)}
                                                        <img src={item.asset.imageUrl} alt="" className="w-full h-full object-cover pointer-events-none select-none block flex-1" />
                                                        {item.caption && (!item.captionPosition || item.captionPosition === 'bottom') && (<div className={`mt-2 w-[120%] -ml-[10%] text-slate-900 leading-tight font-serif ${item.captionAlign === 'center' ? 'text-center' : item.captionAlign === 'right' ? 'text-right' : 'text-left'} ${item.captionSize === 'sm' ? 'text-sm' : item.captionSize === 'base' ? 'text-base' : 'text-[10px]'}`}>{item.caption}</div>)}
                                                        {isSelected && isResizingEnabled && (<><div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 cursor-nwse-resize z-20 rounded-full shadow-sm ring-2 ring-white" onMouseDown={(e) => handleResizeMouseDown(e, item, 'se')} /></>)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="absolute bottom-6 left-6 text-[8px] font-bold text-slate-200 tracking-widest uppercase pointer-events-none font-sans">{pageNumStr}</div>
                                    </div>
                                </div>
                            )})}
                            <div className="h-24"></div>
                        </div>
                    </div>
                )}
                {isProjectSettingsOpen && (<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-6"><div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-up border border-slate-200"><h3 className="text-lg font-bold text-slate-900 mb-2">Project Context</h3><div className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Project Name</label><input type="text" value={projectInfo.project_name} onChange={e => setProjectInfo({...projectInfo, project_name: e.target.value})} className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Facility Type</label><input type="text" value={projectInfo.facility} onChange={e => setProjectInfo({...projectInfo, facility: e.target.value})} className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Project Type</label><select value={projectInfo.project_type} onChange={e => setProjectInfo({...projectInfo, project_type: e.target.value})} className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 appearance-none"><option value="공공현상설계">Public Competition (공공현상)</option><option value="사업제안서">Business Proposal (사업제안)</option><option value="턴키/실시설계">Turnkey / Detail Design</option></select></div></div><button onClick={() => setIsProjectSettingsOpen(false)} className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors">Save Settings</button></div></div>)}
                {aiInsightState.isOpen && (<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-6"><div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-up"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><div className="flex items-center gap-3"><div className="bg-emerald-600 text-white p-1.5 rounded-lg"><ListChecks size={16} /></div><div><h3 className="text-sm font-bold text-slate-900 font-sans">Checklist Assistant</h3><p className="text-[10px] text-slate-500 font-medium">Context: {projectInfo.project_type}</p></div></div><button onClick={() => setAiInsightState(prev => ({...prev, isOpen: false}))} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button></div><div className="flex-1 overflow-y-auto p-6 bg-slate-50/50"><div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Page Context</span><p className="text-sm text-slate-700 italic">"{pagesMeta[aiInsightState.pageIndex]?.description || '(No description)'}"</p></div>{aiInsightState.loading ? (<div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div><p className="text-xs font-medium animate-pulse">Analyzing...</p></div>) : !aiInsightState.result ? (<div className="text-center py-8"><button onClick={handleFetchAiInsight} className="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700">Generate Checklist</button></div>) : (<div className="space-y-4 animate-fade-in-up">{aiInsightState.result.result_type === 'checklist' && (<><div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4"><div className="flex items-start gap-2"><MessageSquareQuote size={16} className="text-emerald-600 mt-0.5" /><p className="text-xs text-emerald-800 font-medium leading-relaxed">{aiInsightState.result.advice}</p></div></div><div className="space-y-3">{aiInsightState.result.items.map((item, idx) => (<div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2"><div className="flex justify-between items-start"><h4 className="text-sm font-bold text-slate-900">{item.name}</h4><span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{item.search_keyword}</span></div><p className="text-xs text-slate-500">{item.reason}</p></div>))}</div></>)}</div>)}</div></div></div>)}
                {isAnalysisTypeModalOpen && (<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-6"><div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-up border border-slate-200"><h3 className="text-lg font-bold text-slate-900 mb-1">Select Analysis Type</h3><div className="space-y-3 mt-4"><button onClick={() => confirmAnalysisType('public')} className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"><span className="font-bold text-slate-900 text-sm">🏛️ Public Competition</span></button><button onClick={() => confirmAnalysisType('business')} className="w-full p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"><span className="font-bold text-slate-900 text-sm">💼 Business Proposal</span></button></div><button onClick={() => setIsAnalysisTypeModalOpen(false)} className="mt-6 w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button></div></div>)}
                {isAnalysisModalOpen && (<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-6"><div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-up"><div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h3 className="text-lg font-bold text-slate-900">Analysis Result</h3><button onClick={() => setIsAnalysisModalOpen(false)}><X size={24} /></button></div><div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">{isAnalyzing ? <div className="text-center py-20 text-slate-400">Analyzing...</div> : analysisResult ? <div className="space-y-8"><div className="text-center"><div className="text-6xl font-black text-slate-900 mb-2">{analysisResult.current_score}</div><p className="text-sm text-slate-500">{analysisResult.evaluation}</p></div><div className="bg-white p-4 rounded-xl border border-slate-200"><h4 className="font-bold mb-4">Recommendation</h4><ul className="space-y-2">{analysisResult.better_sequence.map((s,i)=><li key={i} className="text-sm text-slate-700 border-b border-slate-100 py-2">{s}</li>)}</ul></div></div> : null}</div><div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setIsAnalysisModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Close</button>{analysisResult && <button onClick={handleApplyAnalysis} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg">Save as New Alternative</button>}</div></div></div>)}
                {pendingPageResize && (<div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"><div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full"><h3 className="text-lg font-bold text-slate-900 mb-4">Change Paper Size?</h3><div className="flex gap-3 justify-end"><button onClick={() => setPendingPageResize(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={confirmPageResize} className="px-4 py-2 text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 rounded-lg shadow-md">Confirm</button></div></div></div>)}
                {contextMenu && (<div className="fixed z-[300] bg-white rounded-lg shadow-xl border border-slate-200 p-2 min-w-[200px]" style={{ top: contextMenu.y, left: contextMenu.x }}><button onClick={() => updatePageStatus('ACTIVE')} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded text-left">Active Page</button><button onClick={() => updatePageStatus('SKIP_COUNT')} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded text-left">Skip Counting</button><button onClick={() => updatePageStatus('HIDDEN')} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded text-left">Hidden</button><div className="my-2 border-t border-slate-100"></div><div className="px-2 py-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Color</span><div className="flex justify-between px-1">{Object.keys(themeDotColors).map((theme) => (<button key={theme} onClick={() => updatePageColor(theme as PageColorTheme)} className={`w-5 h-5 rounded-full ${themeDotColors[theme as PageColorTheme]} hover:scale-110 transition-transform ring-2 ${pagesMeta[contextMenu.pageIndex]?.colorTheme === theme ? 'ring-offset-1 ring-slate-400' : 'ring-transparent'}`} />))}</div></div></div>)}
                <button onClick={() => handleSafeExit(undefined, '/')} className="fixed bottom-6 right-6 z-[110] group flex items-center gap-3"><span className="text-slate-400 text-[10px] font-bold tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-sans">BACK TO HOME</span><div className="w-10 h-10 bg-white border border-slate-200 shadow-lg rounded-full flex items-center justify-center group-hover:bg-slate-50 transition-all duration-300"><Home size={16} className="text-slate-600" /></div></button>
                {isSaveMockupModalOpen && (<div className="fixed inset-0 z-[200] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setIsSaveMockupModalOpen(false)} /><div className="relative bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden animate-scale-up font-sans transform transition-all"><div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white"><h3 className="text-xl font-bold text-slate-900">Save Layout</h3><button onClick={() => setIsSaveMockupModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X size={18} /></button></div><form onSubmit={handleSaveMockupSubmit} className="p-8 space-y-6 bg-white"><div className="space-y-2"><label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Title</label><input required type="text" value={mockupSaveForm.title} onChange={e => setMockupSaveForm({...mockupSaveForm, title: e.target.value})} className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900" placeholder="Title" /></div><div className="pt-4"><button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl">Save</button></div></form></div></div>)}
            </div>
        );
    }

    return null; // Should not reach here if state is correct
};

export default AssetLibrary;
