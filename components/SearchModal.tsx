'use client';
import { useState, useEffect } from 'react';
import { ResearchProject } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, Book, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ResearchProject[];
  onSelectResult: (projectId: string, sectionId?: string) => void;
}

export default function SearchModal({ isOpen, onClose, projects, onSelectResult }: SearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Deep search logic
  const results: { type: string, projectId: string, sectionId?: string, title: string, subtitle: string, score: number, icon: React.ReactNode, preview?: string }[] = [];
  if (query.trim().length > 1) {
    const lowerQuery = query.toLowerCase();
    projects.forEach(project => {
      if (project.isArchived) return; // Skip archived maybe? Or include with a badge
      let matchScore = 0;
      
      // Project level match
      if (project.title.toLowerCase().includes(lowerQuery)) matchScore += 10;
      if (project.description?.toLowerCase().includes(lowerQuery)) matchScore += 5;
      if (project.author?.toLowerCase().includes(lowerQuery)) matchScore += 5;

      if (matchScore > 0) {
        results.push({
          type: 'project',
          projectId: project.id,
          title: project.title,
          subtitle: `Công trình nghiên cứu ${project.author ? `- ${project.author}` : ''}`,
          score: matchScore,
          icon: <Book size={14} className="text-[#5A5A40]" />
        });
      }

      // Section level match
      project.sections.forEach(section => {
        let secScore = 0;
        if (section.title.toLowerCase().includes(lowerQuery)) secScore += 10;
        if (section.content.toLowerCase().includes(lowerQuery)) secScore += 8;
        if (section.notes?.toLowerCase().includes(lowerQuery)) secScore += 5;
        if (section.summary?.toLowerCase().includes(lowerQuery)) secScore += 5;
        
        // Match connected concepts or AI generated concepts/questions
        const hasConceptMatch = section.connections?.some(c => c.toLowerCase().includes(lowerQuery));
        if (hasConceptMatch) secScore += 4;
        
        if (secScore > 0) {
          results.push({
            type: 'section',
            projectId: project.id,
            sectionId: section.id,
            title: section.title,
            subtitle: `Thuộc dự án: ${project.title}`,
            score: secScore,
            icon: <FileText size={14} className="text-[#A89F91]" />,
            preview: section.content.substring(0, 80) + '...'
          });
        }
      });
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#33302E]/20 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8E4DF] overflow-hidden flex flex-col max-h-[70vh]"
        >
          <div className="flex items-center px-4 py-3 border-b border-[#E8E4DF]">
            <Search size={20} className="text-[#A89F91] mr-3 shrink-0" />
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-lg text-[#33302E] placeholder:text-[#A89F91] font-serif"
              placeholder="Tìm kiếm nội dung, dự án, ghi chú, tác giả..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button onClick={onClose} className="p-1 text-[#A89F91] hover:text-[#33302E] transition-colors rounded-md hover:bg-[#F7F5F2]">
               <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {query.trim().length <= 1 ? (
              <div className="p-10 text-center text-[#A89F91]">
                <p className="text-sm font-serif italic">Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm thông minh...</p>
                <div className="mt-4 flex gap-2 justify-center">
                   <span className="text-[10px] bg-[#F7F5F2] px-2 py-1 rounded font-mono uppercase tracking-widest text-[#8E8A85]">Dự án</span>
                   <span className="text-[10px] bg-[#F7F5F2] px-2 py-1 rounded font-mono uppercase tracking-widest text-[#8E8A85]">Chương</span>
                   <span className="text-[10px] bg-[#F7F5F2] px-2 py-1 rounded font-mono uppercase tracking-widest text-[#8E8A85]">Ghi chú cá nhân</span>
                   <span className="text-[10px] bg-[#F7F5F2] px-2 py-1 rounded font-mono uppercase tracking-widest text-[#8E8A85]">AI Tóm tắt</span>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-10 text-center text-[#A89F91]">
                <p className="text-sm font-serif italic">Không tìm thấy kết quả nào phù hợp.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((r, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      onSelectResult(r.projectId, r.sectionId);
                      onClose();
                      setQuery('');
                    }}
                    className="w-full text-left p-3 hover:bg-[#F7F5F2] rounded-xl transition-colors flex items-start gap-4 group"
                  >
                    <div className="mt-1 shrink-0 p-2 bg-white rounded-lg border border-[#E8E4DF] group-hover:border-[#A89F91]/30">
                        {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[#33302E] font-medium truncate">{r.title}</p>
                        <p className="text-[10px] text-[#A89F91] uppercase tracking-widest font-bold mt-1">{r.subtitle}</p>
                        {r.preview && (
                            <p className="text-xs text-[#8E8A85] italic font-serif mt-2 line-clamp-1 opacity-80">{r.preview}</p>
                        )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-[#E8E4DF] bg-[#F7F5F2] flex items-center justify-between text-[#8E8A85]">
            <div className="flex gap-4">
                <span className="text-[10px] flex items-center gap-1"><kbd className="bg-white px-1.5 py-0.5 rounded border border-[#E8E4DF] shadow-sm font-mono">↑↓</kbd> Điều hướng</span>
                <span className="text-[10px] flex items-center gap-1"><kbd className="bg-white px-1.5 py-0.5 rounded border border-[#E8E4DF] shadow-sm font-mono">Enter</kbd> Chọn</span>
            </div>
            <span className="text-[10px] flex items-center gap-1"><kbd className="bg-white px-1.5 py-0.5 rounded border border-[#E8E4DF] shadow-sm font-mono">Esc</kbd> Đóng</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
