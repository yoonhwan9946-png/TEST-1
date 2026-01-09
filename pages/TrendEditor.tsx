
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon, Plus, X, Type, Hash, Layout, Trash2, ChevronDown } from 'lucide-react';
import { TrendItem } from '../types';

const TrendEditor: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we are editing an existing item
    const existingTrend = location.state?.trend as TrendItem | undefined;
    const isEditing = !!existingTrend;

    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Sustainability');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);

    // Initialize state if editing
    useEffect(() => {
        if (existingTrend) {
            setTitle(existingTrend.title);
            setSubtitle(existingTrend.subtitle);
            setCategory(existingTrend.category);
            setTags(existingTrend.tags);
            setCoverImage(existingTrend.image);
            
            // Convert HTML content back to plain text (simple conversion)
            if (existingTrend.content) {
                // Strip <div> and <p> wrappers and convert <br/> to newlines
                const rawContent = existingTrend.content
                    .replace(/<div[^>]*>/g, '')
                    .replace(/<\/div>/g, '')
                    .replace(/<p[^>]*>/g, '')
                    .replace(/<\/p>/g, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .trim();
                setContent(rawContent);
            } else {
                setContent(existingTrend.description || '');
            }
        }
    }, [existingTrend]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCoverImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = () => {
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }

        // Create new/updated TrendItem object
        const postData: TrendItem = {
            id: isEditing ? existingTrend.id : Date.now(), // Keep ID if editing
            category,
            title,
            subtitle,
            description: content.substring(0, 150) + (content.length > 150 ? '...' : ''), // Auto-generate excerpt
            content: `<div class="prose prose-lg max-w-none"><p>${content.replace(/\n/g, '<br/>')}</p></div>`, // Simple formatting
            image: coverImage || "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop", // Default placeholder
            gallery: [coverImage || "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop"],
            tags: tags.length > 0 ? tags : ['Insight', 'Architecture'],
            date: isEditing ? existingTrend.date : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            author: isEditing ? existingTrend.author : 'Editor' // Default author
        };

        // Save to LocalStorage
        try {
            const existingData = localStorage.getItem('ylab_trends');
            const trends: TrendItem[] = existingData ? JSON.parse(existingData) : [];
            
            let updatedTrends;
            if (isEditing) {
                // Update existing
                updatedTrends = trends.map(t => t.id === postData.id ? postData : t);
                
                // If it was a mock data item (id < 100), we might need to add it to local storage list explicitly if it wasn't there before
                // But simplified logic: If we edited a default item, we now save it to local storage as a modified version.
                // However, to avoid duplicating static data, we assume static data is not in local storage initially.
                // For a robust app, we'd copy static to local on first load. Here we just append if not found (or replace).
                const found = trends.find(t => t.id === postData.id);
                if (!found) {
                     // It was a static item being edited for the first time
                     updatedTrends = [postData, ...trends];
                }
            } else {
                // Create new
                updatedTrends = [postData, ...trends];
            }
            
            localStorage.setItem('ylab_trends', JSON.stringify(updatedTrends));
            
            alert(isEditing ? "Post Updated Successfully!" : "Post Published Successfully!");
            navigate('/trend');
        } catch (error) {
            console.error("Failed to save post:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = () => {
        if (!isEditing || !existingTrend) return;
        
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                const existingData = localStorage.getItem('ylab_trends');
                if (existingData) {
                    const trends: TrendItem[] = JSON.parse(existingData);
                    const updatedTrends = trends.filter(t => t.id !== existingTrend.id);
                    localStorage.setItem('ylab_trends', JSON.stringify(updatedTrends));
                }
                alert("Post Deleted.");
                navigate('/trend');
            } catch (error) {
                console.error("Failed to delete post:", error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/trend')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        {isEditing ? 'Editing Insight' : 'Drafting New Insight'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline-block">Auto-saved</span>
                    
                    {/* Publish / Delete Dropdown Group */}
                    <div className="relative group">
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-blue-600 transition-all shadow-lg z-20 relative"
                        >
                            <Save size={16} /> {isEditing ? 'Update' : 'Publish'}
                            {isEditing && <ChevronDown size={14} className="ml-1 opacity-70 group-hover:rotate-180 transition-transform" />}
                        </button>
                        
                        {/* Hover Dropdown for Delete (Only if editing) */}
                        {isEditing && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-10">
                                <button 
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                                >
                                    <Trash2 size={14} /> Delete Post
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 mt-12 animate-fade-in-up">
                
                {/* Cover Image Area */}
                <div className="group relative w-full aspect-[21/9] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden mb-12 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/10 transition-all">
                    {coverImage ? (
                        <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full">Change Cover</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 font-medium">Add Cover Image</p>
                        </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                </div>

                {/* Title Section */}
                <div className="space-y-4 mb-8">
                    <input 
                        type="text" 
                        placeholder="Untitled Trend" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-5xl font-black text-slate-900 placeholder:text-slate-200 outline-none bg-transparent leading-tight"
                    />
                    <input 
                        type="text" 
                        placeholder="Add a subtitle..." 
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="w-full text-2xl font-medium text-slate-500 placeholder:text-slate-200 outline-none bg-transparent font-serif italic"
                    />
                </div>

                {/* Metadata Bar */}
                <div className="flex flex-wrap items-center gap-4 mb-12 py-4 border-y border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Layout size={16} />
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="bg-transparent outline-none font-bold hover:text-blue-600 cursor-pointer appearance-none pr-4 text-slate-900"
                        >
                            <option value="Sustainability">Sustainability</option>
                            <option value="Technology">Technology</option>
                            <option value="Urbanism">Urbanism</option>
                            <option value="Materiality">Materiality</option>
                            <option value="Social">Social</option>
                        </select>
                    </div>
                    <div className="w-[1px] h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-2 flex-1">
                        <Hash size={16} className="text-slate-400" />
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <span key={tag} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => removeTag(tag)}><X size={10} /></button>
                                </span>
                            ))}
                            <input 
                                type="text" 
                                placeholder="Type tag & enter" 
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="text-sm outline-none bg-transparent placeholder:text-slate-300 min-w-[100px] text-slate-900"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Editor (Ensured White Background and High Contrast) */}
                <div className="relative min-h-[500px] bg-white rounded-lg">
                     <div className="absolute -left-12 top-0 hidden md:flex flex-col gap-2 text-slate-300">
                        <button className="p-2 hover:text-slate-600 hover:bg-slate-50 rounded" title="Add Image"><ImageIcon size={18} /></button>
                        <button className="p-2 hover:text-slate-600 hover:bg-slate-50 rounded" title="Add Heading"><Type size={18} /></button>
                        <button className="p-2 hover:text-slate-600 hover:bg-slate-50 rounded" title="Add Divider"><Plus size={18} /></button>
                     </div>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Tell your story..."
                        className="w-full h-full min-h-[500px] resize-none outline-none text-lg leading-relaxed text-slate-900 placeholder:text-slate-300 font-serif bg-white"
                        style={{ color: '#0f172a' }} // Forced dark text color
                    />
                </div>
            </main>
        </div>
    );
};

export default TrendEditor;
