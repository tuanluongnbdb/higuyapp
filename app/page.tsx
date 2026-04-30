'use client';
import { useState, useMemo, useEffect } from 'react';
import { ResearchProject, Section } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Sidebar from '@/components/Sidebar';
import TableOfContents from '@/components/TableOfContents';
import Editor from '@/components/Editor';
import AIPanel from '@/components/AIPanel';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import SearchModal from '@/components/SearchModal';
import QueryModal from '@/components/QueryModal';
import { summarizeSection, extractConcepts, generateQuestions, extractQuotes, findThemes, suggestActions } from '@/lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Network as GraphIcon, FileText, Search, Download, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import SettingsModal from '@/components/SettingsModal';

export default function Home() {
  const [projects, setProjects, isLoaded] = useLocalStorage<ResearchProject[]>('lumina-projects', []);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [view, setView] = useState<'editor' | 'graph'>('editor');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  const activeSection = useMemo(() => 
    activeProject?.sections.find(s => s.id === activeSectionId) || null
  , [activeProject, activeSectionId]);

  const handleNewProject = () => {
    const newProject: ResearchProject = {
      id: "proj-" + Math.random().toString(36).substr(2, 9),
      title: "Công trình Nghiên cứu mới",
      sections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setActiveSectionId(null);
  };

  const handleUpdateProject = (data: Partial<ResearchProject>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId ? { ...p, ...data, updatedAt: Date.now() } : p
    ));
  };

  const handleArchiveProject = (id: string, isArchived: boolean) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isArchived, updatedAt: Date.now() } : p));
    if (isArchived && activeProjectId === id) {
        setActiveProjectId(null);
        setActiveSectionId(null);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: Date.now() } : p));
    if (activeProjectId === id) {
        setActiveProjectId(null);
        setActiveSectionId(null);
    }
  };

  const handleRestoreProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: undefined, updatedAt: Date.now() } : p));
  };

  const handlePermanentDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
        setActiveProjectId(null);
        setActiveSectionId(null);
    }
  };

  const handlePinProject = (id: string, isPinned: boolean) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isPinned, updatedAt: Date.now() } : p));
  };

  useEffect(() => {
    if (isLoaded) {
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      let hasDeletions = false;
      const validProjects = projects.filter(p => {
        if (p.deletedAt && now - p.deletedAt > SEVEN_DAYS) {
          hasDeletions = true;
          return false;
        }
        return true;
      });
      if (hasDeletions) {
        setProjects(validProjects);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleAddSection = () => {
    if (!activeProjectId) return;
    const newSection: Section = {
      id: "sec-" + Math.random().toString(36).substr(2, 9),
      title: "Chương mới",
      content: "",
    };
    
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, sections: [...p.sections, newSection], updatedAt: Date.now() }
        : p
    ));
    setActiveSectionId(newSection.id);
  };

  const handleUpdateSection = (data: Partial<Section>) => {
    if (!activeProjectId || !activeSectionId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { 
            ...p, 
            sections: p.sections.map(s => s.id === activeSectionId ? { ...s, ...data } : s),
            updatedAt: Date.now() 
          }
        : p
    ));
  };

  const handleDeleteSection = () => {
    if (!activeProjectId || !activeSectionId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { 
            ...p, 
            sections: p.sections.filter(s => s.id !== activeSectionId),
            updatedAt: Date.now() 
          }
        : p
    ));
    setActiveSectionId(null);
  };

  const handleAnalyze = async () => {
    if (!activeSection || !activeSection.content) return;
    setIsAnalyzing(true);
    
    // Split into two batches to prevent overwhelming the API / potential rate limits in Preview
    const [summaryData, conceptData, questionData] = await Promise.all([
      summarizeSection(activeSection.content),
      extractConcepts(activeSection.content),
      generateQuestions(activeSection.content)
    ]);
    
    const [quotesData, themesData, actionsData] = await Promise.all([
      extractQuotes(activeSection.content),
      findThemes(activeSection.content),
      suggestActions(activeSection.content)
    ]);
    
    if (summaryData) {
      handleUpdateSection({
        summary: summaryData[0],
        keyPoints: summaryData.slice(1),
        connections: conceptData || [],
        questions: questionData || [],
        quotes: quotesData || [],
        themes: themesData || [],
        nextSteps: actionsData || []
      });
    }
    
    setIsAnalyzing(false);
  };

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F5F2] text-[#33302E] font-sans selection:bg-[#E8E4DF]">
      <div className={cn(
        "flex h-full transition-all duration-700 ease-in-out",
        isFocusMode ? "-ml-64" : "ml-0"
      )}>
        <Sidebar 
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(id) => {
            setActiveProjectId(id);
            setActiveSectionId(null);
          }}
          onNewProject={handleNewProject}
          onArchiveProject={handleArchiveProject}
          onDeleteProject={handleDeleteProject}
          onRestoreProject={handleRestoreProject}
          onPermanentDelete={handlePermanentDelete}
          onPinProject={handlePinProject}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      <main className="flex-1 flex flex-col relative h-full">
        {activeProject ? (
          <div className="flex h-full">
            <div className={cn(
              "transition-all duration-700 ease-in-out overflow-hidden flex",
              isFocusMode ? "w-0 opacity-0" : "w-80 opacity-100"
            )}>
              <TableOfContents 
                sections={activeProject.sections}
                activeSectionId={activeSectionId}
                onSelectSection={setActiveSectionId}
                onAddSection={handleAddSection}
                onReorder={(newSections) => {
                  setProjects(projects.map(p => 
                    p.id === activeProjectId ? { ...p, sections: newSections } : p
                  ));
                }}
              />
            </div>
            
            <div className="flex-1 flex flex-col h-full bg-[#F7F5F2] relative">
                <nav className={cn(
                  "absolute top-6 left-1/2 -translate-x-1/2 z-10 flex bg-white border border-[#E8E4DF] shadow-sm rounded-full p-1 self-center transition-opacity duration-500",
                  isFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>
                    <button 
                        onClick={() => setView('editor')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'editor' ? 'bg-[#5A5A40] text-white' : 'text-[#8E8A85] hover:text-[#33302E]'}`}
                    >
                        <FileText size={12} />
                        Bản thảo
                    </button>
                    <button 
                        onClick={() => setView('graph')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'graph' ? 'bg-[#5A5A40] text-white' : 'text-[#8E8A85] hover:text-[#33302E]'}`}
                    >
                        <GraphIcon size={12} />
                        Hệ thống hóa
                    </button>
                </nav>

                <div className="flex-1 h-full pt-16">
                    <AnimatePresence mode="wait">
                        {view === 'editor' ? (
                            <motion.div 
                                key="editor"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full"
                            >
                                {activeSection ? (
                                    <Editor 
                                        key={activeSection.id}
                                        section={activeSection}
                                        onUpdate={handleUpdateSection}
                                        onDelete={handleDeleteSection}
                                        onAnalyze={handleAnalyze}
                                        isAnalyzing={isAnalyzing}
                                        isFocusMode={isFocusMode}
                                        onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F7F5F2] text-[#A89F91]">
                                        <div className="p-12 border border-[#E8E4DF] bg-[#FDFCFB] rounded-3xl flex flex-col items-center shadow-sm">
                                            <FileText size={40} className="mb-4 opacity-30" />
                                            <p className="text-sm font-serif italic text-center">Chọn một nút từ cấu trúc để <br/>bắt đầu nghiên cứu</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="graph"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="h-full overflow-y-auto scrollbar-stone p-10 flex flex-col gap-8"
                            >
                                <div className="max-w-4xl mx-auto w-full">
                                    <div className="mb-12 text-center relative group">
                                        <h1 className="text-4xl font-serif text-[#33302E] tracking-tight mb-2 uppercase">{activeProject.title}</h1>
                                        <div className="flex items-center justify-center gap-4 text-[#8E8A85] text-xs font-serif italic">
                                          <span>{activeProject.author || "Tác giả vô danh"}</span>
                                          <span className="w-1 h-1 bg-[#E8E4DF] rounded-full" />
                                          <span>{activeProject.year || "Năm chưa rõ"}</span>
                                        </div>
                                        
                                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                          <button 
                                            title="Tải về Markdown"
                                            className="p-2 bg-white border border-[#E8E4DF] rounded-full text-[#A89F91] hover:text-[#5A5A40] shadow-sm transform transition hover:scale-110"
                                            onClick={() => {
                                              let content = `# ${activeProject.title}\n\n`;
                                              content += `Author: ${activeProject.author || 'N/A'}\n`;
                                              content += `Year: ${activeProject.year || 'N/A'}\n`;
                                              content += `Description: ${activeProject.description || 'N/A'}\n\n---\n\n`;
                                              
                                              content += activeProject.sections.map(s => {
                                                  let sectionMd = `## ${s.title}\n\n${s.content}\n\n`;
                                                  if (s.summary) sectionMd += `**Thấu hiểu (AI):**\n${s.summary}\n\n`;
                                                  if (s.quotes && s.quotes.length > 0) {
                                                      sectionMd += `**Trích dẫn Đắt giá:**\n`;
                                                      s.quotes.forEach(q => sectionMd += `> * ${q}\n`);
                                                      sectionMd += `\n`;
                                                  }
                                                  if (s.notes) {
                                                      sectionMd += `**Ghi chú cá nhân:**\n${s.notes}\n\n`;
                                                  }
                                                  return sectionMd;
                                              }).join('---\n\n');

                                              const blob = new Blob([content], { type: 'text/markdown' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `${activeProject.title.toLowerCase().replace(/\s+/g, '-')}.md`;
                                              a.click();
                                              URL.revokeObjectURL(url);
                                            }}
                                          >
                                            <Download size={18} />
                                          </button>
                                        </div>
                                    </div>

                                    <div className="mb-8 p-6 bg-white border border-[#E8E4DF] rounded-2xl flex flex-wrap gap-6 items-center">
                                        <div className="flex-1 space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest">Tác giả</label>
                                              <input 
                                                className="w-full bg-transparent border-b border-[#E8E4DF] py-1 text-sm outline-none focus:border-[#5A5A40]" 
                                                value={activeProject.author || ''}
                                                onChange={(e) => handleUpdateProject({ author: e.target.value })}
                                                placeholder="Tên tác giả..."
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest">Năm</label>
                                              <input 
                                                className="w-full bg-transparent border-b border-[#E8E4DF] py-1 text-sm outline-none focus:border-[#5A5A40]" 
                                                value={activeProject.year || ''}
                                                onChange={(e) => handleUpdateProject({ year: e.target.value })}
                                                placeholder="Năm xuất bản..."
                                              />
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest">Luận đề chính</label>
                                            <textarea 
                                              className="w-full bg-transparent border-b border-[#E8E4DF] py-1 text-sm outline-none focus:border-[#5A5A40] h-12 resize-none" 
                                              value={activeProject.description || ''}
                                              onChange={(e) => handleUpdateProject({ description: e.target.value })}
                                              placeholder="Tóm lược luận điểm cốt lõi của công trình này..."
                                            />
                                          </div>
                                        </div>
                                    </div>

                                    <KnowledgeGraph 
                                        sections={activeProject.sections} 
                                        activeSectionId={activeSectionId}
                                        onSelectNode={(id) => {
                                            setActiveSectionId(id);
                                            setView('editor');
                                        }}
                                    />
                                    
                                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
                                        <div className="p-6 bg-white rounded-2xl border border-[#E8E4DF] italic font-serif shadow-sm">
                                            <p className="text-[10px] text-[#A89F91] mb-2 uppercase font-sans tracking-widest not-italic font-bold">Trạng thái nghiên cứu</p>
                                            <p className="text-[#4A4744]">Dự án khởi tạo vào {new Date(activeProject.createdAt).toLocaleDateString('vi-VN')}. Cập nhật gần nhất lúc {new Date(activeProject.updatedAt).toLocaleTimeString('vi-VN')}.</p>
                                        </div>
                                        <div className="col-span-2 p-8 bg-[#5A5A40] text-white rounded-2xl shadow-xl shadow-[#5A5A40]/10">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-8">Siêu dữ liệu thấu hiểu</p>
                                            <div className="flex gap-12">
                                                <div>
                                                    <span className="block text-2xl font-mono mb-1">{activeProject.sections.length}</span>
                                                    <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Số nút</span>
                                                </div>
                                                <div>
                                                    <span className="block text-2xl font-mono mb-1">{activeProject.sections.reduce((acc, s) => acc + (s.keyPoints?.length || 0), 0)}</span>
                                                    <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Hiểu biết</span>
                                                </div>
                                                <div>
                                                    <span className="block text-2xl font-mono mb-1">{Math.round(activeProject.sections.reduce((acc, s) => acc + s.content.length, 0) / 100)}%</span>
                                                    <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Mật độ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className={cn(
              "transition-all duration-700 ease-in-out overflow-hidden flex",
              isFocusMode ? "w-0 opacity-0" : "w-80 opacity-100"
            )}>
              <AIPanel section={activeSection} onOpenQuery={() => setIsQueryOpen(true)} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-[#F7F5F2]">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-xl"
            >
                <div className="w-16 h-16 bg-[#5A5A40] rounded-3xl mx-auto mb-8 flex items-center justify-center rotate-12 shadow-xl shadow-[#5A5A40]/30">
                   <div className="w-6 h-6 border-4 border-white rounded-full opacity-80" />
                </div>
                <h1 className="text-6xl font-serif text-[#33302E] tracking-tight mb-4">Đọc. Tổng hợp.</h1>
                <p className="text-[#8E8A85] text-lg mb-12 leading-relaxed font-serif italic">
                    Lumina là bộ não thứ hai cho nghiên cứu chuyên sâu. 
                    Tổ chức kho liệu, trích xuất hiểu biết bằng AI và hình ảnh hóa các kết nối trí tuệ 
                    trong một không gian làm việc tinh xảo.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleNewProject}
                        className="py-4 px-6 bg-[#5A5A40] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                        Bắt đầu nghiên cứu mới
                    </button>
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 p-4 border border-[#E8E4DF] rounded-2xl bg-white text-[#A89F91] text-[10px] font-bold uppercase tracking-widest italic justify-center transition-colors hover:bg-stone-50"
                    >
                        <Search size={14} />
                        Command + K để Tìm kiếm
                    </button>
                </div>
            </motion.div>
            
            <div className="mt-24 pt-12 border-t border-[#E8E4DF] max-w-2xl w-full grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                   <span className="block text-[10px] font-bold uppercase tracking-widest text-[#A89F91] mb-2">Tập trung</span>
                   <p className="text-xs text-[#8E8A85]">Môi trường không xao nhãng để đọc sâu.</p>
                </div>
                <div>
                   <span className="block text-[10px] font-bold uppercase tracking-widest text-[#A89F91] mb-2">Cấu trúc</span>
                   <p className="text-xs text-[#8E8A85]">Ghi chú phân cấp với đề cương thông minh.</p>
                </div>
                <div>
                   <span className="block text-[10px] font-bold uppercase tracking-widest text-[#A89F91] mb-2">AI Hỗ trợ</span>
                   <p className="text-xs text-[#8E8A85]">Tóm tắt và khái niệm hóa bằng Gemini.</p>
                </div>
                <div>
                   <span className="block text-[10px] font-bold uppercase tracking-widest text-[#A89F91] mb-2">Mạng lưới</span>
                   <p className="text-xs text-[#8E8A85]">Trực quan hóa sự kết nối giữa các ý tưởng.</p>
                </div>
            </div>
          </div>
        )}
      </main>

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        projects={projects}
        onSelectResult={(projectId, sectionId) => {
          setActiveProjectId(projectId);
          if (sectionId) {
            setActiveSectionId(sectionId);
            setView('editor');
          }
        }}
      />
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      
      {activeProject && (
        <QueryModal 
          isOpen={isQueryOpen}
          onClose={() => setIsQueryOpen(false)}
          sections={activeProject.sections}
        />
      )}
    </div>
  );
}
