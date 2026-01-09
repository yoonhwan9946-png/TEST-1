import React from 'react';
import { Asset } from '../types';
import { Download, Share2 } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={asset.imageUrl} 
          alt={asset.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
          <div className="flex gap-2">
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-blue-600 transition-colors">
              <Download size={18} />
            </button>
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
              <Share2 size={18} />
            </button>
          </div>
        </div>
        <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-semibold bg-white/90 text-blue-700 rounded shadow-sm backdrop-blur-sm">
                {asset.categoryKo}
            </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-base font-bold text-slate-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
          {asset.title}
        </h3>
        <div className="flex flex-wrap gap-2 mt-3">
          {asset.tags.map((tag) => (
            <span key={tag} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors cursor-default">
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
          <span>{asset.date}</span>
          <span>{asset.downloads.toLocaleString()} Downloads</span>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;