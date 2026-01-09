
import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Bookmark as BookmarkType } from '../types';

interface BrainstormingSearchProps {
    inputClassName?: string;
    containerClassName?: string;
    placeholder?: string;
    hideModeToggle?: boolean;
}

const BrainstormingSearch: React.FC<BrainstormingSearchProps> = ({ 
    inputClassName, 
    containerClassName, 
    placeholder,
    hideModeToggle = false
}) => {
  const [keyword, setKeyword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchBookmarks, setSearchBookmarks] = useState(false);
  const [bookmarkSuggestions, setBookmarkSuggestions] = useState<BookmarkType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchBookmarks) {
        const saved = localStorage.getItem('ylab_bookmarks');
        if (saved) {
            const parsed = JSON.parse(saved);
            setBookmarkSuggestions(parsed);
        }
    }
  }, [searchBookmarks]);

  const filteredBookmarks = searchBookmarks 
    ? bookmarkSuggestions.filter(b => b.term.toLowerCase().includes(keyword.toLowerCase()))
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    navigate(`/brainstorming?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleBookmarkClick = (term: string) => {
      setKeyword(term);
      navigate(`/brainstorming?keyword=${encodeURIComponent(term)}`);
  };

  return (
    <div className={`relative w-full z-30 ${containerClassName || 'max-w-lg mx-auto'}`}>
      
      {/* Search Input Container */}
      <form 
        onSubmit={handleSearch} 
        className="relative group block"
      >
        {/* The Minimal Line Input */}
        <div className={`relative flex items-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
            ${inputClassName ? '' : isFocused ? 'border-b border-slate-900 pb-4' : 'border-b border-slate-300 pb-4 hover:border-slate-500'}`}
        >
            <input
                type="text" 
                className={inputClassName || "w-full bg-transparent border-none p-0 text-lg md:text-xl text-slate-900 placeholder:text-slate-400 font-serif text-center focus:outline-none focus:ring-0 tracking-tight"}
                placeholder={placeholder || (searchBookmarks ? "Search your saved maps..." : "Ask for architectural logic...")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            />

            {/* Minimal Arrow Submit Button - Position based on style */}
            <button 
                type="submit" 
                className={`absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-300
                    ${keyword.trim() 
                        ? 'bg-slate-900 text-white opacity-100 translate-x-0' 
                        : 'bg-transparent text-slate-400 opacity-0 -translate-x-4 pointer-events-none'
                    }`}
            >
                <ArrowRight size={24} strokeWidth={2} />
            </button>
        </div>

        {/* Minimal Mode Toggles (Tiny Text Below) */}
        {!hideModeToggle && (
            <div className={`absolute top-full left-0 right-0 mt-4 flex justify-center gap-6 transition-opacity duration-500 ${isFocused || keyword ? 'opacity-100' : 'opacity-60'}`}>
                <button 
                    type="button"
                    onClick={() => setSearchBookmarks(false)}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${!searchBookmarks ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
                >
                    New Logic
                </button>
                <button 
                    type="button"
                    onClick={() => setSearchBookmarks(true)}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${searchBookmarks ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
                >
                    Saved Maps
                </button>
            </div>
        )}

      </form>

      {/* Bookmark Dropdown (Minimal List) */}
      {searchBookmarks && isFocused && filteredBookmarks.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-12 bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-none animate-fade-in-up">
            {filteredBookmarks.map((b, idx) => (
                <div 
                    key={idx}
                    onClick={() => handleBookmarkClick(b.term)}
                    className="px-6 py-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0 transition-colors group"
                >
                    <span className="text-slate-900 text-sm font-serif group-hover:text-blue-600 transition-colors">{b.term}</span>
                    <ArrowUpRight size={12} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default BrainstormingSearch;
