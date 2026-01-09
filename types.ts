
export type AssetType = 'Diagram' | 'Proposal';

export type Category = string;

// Absolute positioning asset structure
export interface PlacedAsset {
    uid: string;
    asset: Asset;
    pageIndex: number;
    x: number; // Grid units
    y: number; // Grid units
    w: number; // Grid units
    h: number; // Grid units
    
    // Caption Properties
    caption?: string;
    captionPosition?: 'top' | 'bottom';
    captionAlign?: 'left' | 'center' | 'right';
    captionSize?: 'xs' | 'sm' | 'base';
}

export interface Asset {
  id: string;
  title: string;
  assetType: AssetType;
  category: Category;
  categoryKo: string;
  imageUrl: string;
  tags: string[];
  date: string;
  downloads: number;
  
  // New Fields for Archive
  source?: string;          // e.g. "Space Magazine 240", "Haeahn Architecture"
  facilityType?: string;    // e.g. "Cultural", "Office", "Public"
  projectType?: string;     // e.g. "General Competition", "Turnkey"
  
  // Grid Layout Properties
  gridX: number;
  gridY: number;
  cols: number;
  rows: number;
  
  // Detail Hover Info
  pageNumber?: number;
  contentDescription?: string;

  // For Saved Layouts (Mockups)
  layoutData?: PlacedAsset[];
}

export interface TrendResult {
  keyword: string;
  description: string;
  suggestedConcepts: string[];
}

// Updated TrendItem for Blog Post
export interface TrendItem {
    id: number;
    category: string;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    gallery: string[];
    tags: string[];
    date: string;
    author: string;
    content?: string; // HTML or Markdown content
}

export interface BrainstormItem {
  term: string;
  shortLabel: string;
  description: string;
  sources?: string[]; 
  isAiGenerated?: boolean; 
}

export type ExpansionType = 'ISSUE' | 'SIMILAR' | 'OPPOSITE' | 'AUTO' | 'ROOT';

export type BrainstormMode = 'DEEP' | 'BROAD';

export interface GraphNode extends BrainstormItem {
  id: string;
  x: number;
  y: number;
  parentId: string | null;
  level: number;
  nodeType: 'TERM' | 'SELECTOR'; 
  expansionType?: ExpansionType; 
  sourceMode?: BrainstormMode; 
}

export interface Bookmark {
  term: string;
  description: string;
  timestamp: number;
  folderId: string; 
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface SavedMap {
  id: string;
  name: string;
  nodes: GraphNode[];
  folderId: string;
  createdAt: number;
  updatedAt: number;
}

// AI Layout Analysis Response Structure
export interface LayoutAnalysisResult {
  current_score: number;
  evaluation: string;
  is_reorder_needed: boolean;
  better_sequence: string[];
  missing_suggestion: string;
}

// --- New Interfaces for Architectural AI Insights ---

export interface ProjectContextInfo {
    facility: string; // e.g. "도서관", "오피스"
    project_type: string; // e.g. "공공현상설계", "사업제안서"
    project_name: string;
}

export interface AiInsightRequest {
    project_info: ProjectContextInfo;
    page_context: {
        page_role: string; // e.g. "매스 프로세스"
        user_draft: string;
    };
    action_type: 'generate_caption' | 'recommend_checklist';
}

export interface AiCaptionResult {
    result_type: 'caption';
    options: {
        conceptual: string;
        functional: string;
        professional: string;
    };
}

export interface AiChecklistResult {
    result_type: 'checklist';
    advice: string;
    items: {
        name: string;
        reason: string;
        search_keyword: string;
    }[];
}

// For Asset-Specific Styled Caption
export interface StyledCaptionResult {
    analysis: {
        tone: string;
        ending_style: string;
        vocabulary_level: string;
    };
    generated_caption: string;
}

export type AiInsightResult = AiCaptionResult | AiChecklistResult;
