'use client';
import { useState } from 'react';
import { Plus, Book, Settings, Archive, Trash2, ArchiveRestore, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResearchProject } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  projects: ResearchProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onNewProject: () => void;
  onArchiveProject: (id: string, isArchived: boolean) => void;
  onDeleteProject: (id: string) => void;
  onRestoreProject?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onPinProject?: (id: string, isPinned: boolean) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ projects, activeProjectId, onSelectProject, onNewProject, onArchiveProject, onDeleteProject, onRestoreProject, onPermanentDelete, onPinProject, onOpenSettings }: SidebarProps) {
  const [viewMode, setViewMode] = useState<'library' | 'archived' | 'trash'>('library');
  
  const filteredProjects = projects.filter(p => {
    if (viewMode === 'trash') return !!p.deletedAt;
    if (viewMode === 'archived') return !!p.isArchived && !p.deletedAt;
    return !p.isArchived && !p.deletedAt;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const dateB = b.updatedAt || b.createdAt || 0;
    const dateA = a.updatedAt || a.createdAt || 0;
    return dateB - dateA;
  });

  return (
    <div className="w-64 h-full border-r border-[#E8E4DF] bg-[#FDFCFB] flex flex-col font-sans">
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <button 
          onClick={() => onSelectProject(null)} 
          className="flex items-center gap-3 mb-8 shrink-0 hover:opacity-80 transition-opacity text-left"
        >
          <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm" />
          </div>
          <span className="text-xl font-serif italic font-medium tracking-tight text-[#33302E]">Lumina</span>
        </button>

        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#E8E4DF] rounded-full text-sm font-medium text-[#33302E] hover:shadow-sm transition-all active:scale-[0.98] mb-8 shrink-0"
        >
          <Plus size={16} />
          Nghiên cứu mới
        </button>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 scrollbar-stone">
          <div>
            <h3 className="text-[11px] font-bold text-[#8E8A85] uppercase tracking-widest mb-4 px-2">
               {viewMode === 'trash' ? "Thùng rác" : viewMode === 'archived' ? "Dự án đã lưu trữ" : "Thư viện tri thức"}
            </h3>
            <div className="space-y-1">
              <AnimatePresence>
                {filteredProjects.map((project) => (
                  <motion.div 
                    key={project.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "group w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left relative",
                      activeProjectId === project.id 
                        ? "bg-[#F7F5F2] text-[#5A5A40] font-semibold" 
                        : "text-[#8E8A85] hover:text-[#33302E] hover:bg-[#F7F5F2]/50"
                    )}
                  >
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="absolute inset-0 z-0"
                    />
                    <Book size={16} className={cn("relative z-10 shrink-0 pointer-events-none", activeProjectId === project.id ? "text-[#5A5A40]" : "text-[#A89F91] opacity-50")} />
                    <span className="truncate relative z-10 pointer-events-none flex-1 pr-20">{project.title}</span>
                    {project.isPinned && <Pin size={12} className="absolute right-12 z-10 text-[#5A5A40] pointer-events-none opacity-50" />}
                    
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 z-20">
                      {viewMode === 'trash' ? (
                        <>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               onRestoreProject?.(project.id);
                             }}
                             className="p-1.5 text-[#A89F91] hover:text-[#5A5A40] hover:bg-white rounded-md transition-colors"
                             title="Khôi phục"
                           >
                             <ArchiveRestore size={14} />
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               onPermanentDelete?.(project.id);
                             }}
                             className="p-1.5 text-[#A89F91] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                             title="Xoá vĩnh viễn"
                           >
                             <Trash2 size={14} />
                           </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onPinProject?.(project.id, !project.isPinned);
                            }}
                            className="p-1.5 text-[#A89F91] hover:text-[#5A5A40] hover:bg-white rounded-md transition-colors"
                            title={project.isPinned ? "Bỏ ghim" : "Ghim dự án"}
                          >
                            <Pin size={14} className={project.isPinned ? "fill-current" : ""} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveProject(project.id, viewMode !== 'archived');
                            }}
                            className="p-1.5 text-[#A89F91] hover:text-[#5A5A40] hover:bg-white rounded-md transition-colors"
                            title={viewMode === 'archived' ? "Khôi phục" : "Lưu trữ"}
                          >
                            {viewMode === 'archived' ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project.id);
                            }}
                            className="p-1.5 text-[#A89F91] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Xoá (Thùng rác)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredProjects.length === 0 && (
                <p className="px-3 py-4 text-xs text-[#8E8A85] italic">Chưa có dự án nào</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-[#E8E4DF] mt-6 shrink-0 space-y-1">
            <button 
                onClick={() => setViewMode('library')}
                className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", viewMode === 'library' ? "text-[#5A5A40] bg-[#F7F5F2] font-semibold" : "text-[#8E8A85] hover:text-[#33302E] hover:bg-[#F7F5F2]/50")}
            >
              <Book size={16} /> Thư viện chính 
            </button>
            <button 
                onClick={() => setViewMode('archived')}
                className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", viewMode === 'archived' ? "text-[#5A5A40] bg-[#F7F5F2] font-semibold" : "text-[#8E8A85] hover:text-[#33302E] hover:bg-[#F7F5F2]/50")}
            >
              <Archive size={16} /> Đã lưu trữ
            </button>
            <button 
                onClick={() => setViewMode('trash')}
                className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", viewMode === 'trash' ? "text-red-500 bg-red-50 font-semibold" : "text-[#8E8A85] hover:text-red-500 hover:bg-red-50")}
            >
              <Trash2 size={16} /> Thùng rác
            </button>
            <div className="pt-2 mt-2 border-t border-[#E8E4DF]">
                <button 
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#8E8A85] hover:text-[#33302E] hover:bg-[#F7F5F2]/50 transition-colors"
                >
                  <Settings size={16} />
                  Cài đặt
                </button>
            </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 shrink-0">
        <div className="bg-[#5A5A40]/5 border border-[#5A5A40]/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-[#5A5A40] mb-1">Cốt lõi tri thức</p>
          <p className="text-[10px] text-[#A89F91] italic leading-relaxed">&quot;Lịch sử là thứ mà rất ít người làm trong khi những người khác đang cày ruộng.&quot;</p>
        </div>
      </div>
    </div>
  );
}
