'use client';
import { Section } from '@/lib/types';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Save, Trash2, Maximize2, Type, Wand2, Bold, Italic, List, Heading, Table2, Eye, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateTitleForSection } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const formatTypography = (text: string) => {
  return text
      .replace(/"([^"]*)"/g, '“$1”') // smart double quotes
      .replace(/'([^']*)'/g, '‘$1’') // smart single quotes
      .replace(/ +/g, ' ') // remove extra spaces
      .replace(/([.?!,;:])([^\s\d.?!,;:”’\)"\]\n])/g, '$1 $2') // space after punctuation
      .replace(/\s+([.?!,;:])/g, '$1'); // remove space before punctuation
};

interface EditorProps {
  section: Section | null;
  onUpdate: (data: Partial<Section>) => void;
  onDelete: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

export default function Editor({ 
  section, 
  onUpdate, 
  onDelete, 
  onAnalyze, 
  isAnalyzing,
  isFocusMode,
  onToggleFocus
}: EditorProps) {
  const [localTitle, setLocalTitle] = useState(section?.title || '');
  const [localContent, setLocalContent] = useState(section?.content || '');
  const [localNotes, setLocalNotes] = useState(section?.notes || '');
  const [isPreview, setIsPreview] = useState(false);
  
  const [fontFamily] = useLocalStorage('lumina-fontFamily', 'serif');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [lastFormattedWordCount, setLastFormattedWordCount] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpdateDebounced = (updates: Partial<Section>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
        onUpdate(updates);
    }, 800);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    handleUpdateDebounced({ content: newContent });

    const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 0 && wordCount % 100 === 0 && wordCount !== lastFormattedWordCount) {
      setLastFormattedWordCount(wordCount);
      
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const formatted = formatTypography(newContent);
      setLocalContent(formatted);
      onUpdate({ content: formatted });

      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.setSelectionRange(start, end);
        }
      }, 0);
    }
  };

  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const handleManualFormat = () => {
    const formatted = formatTypography(localContent);
    setLocalContent(formatted);
    onUpdate({ content: formatted });
  };

  const insertTextAtCursor = (text: string, wrapOffset = 0) => {
    if (!contentRef.current) return;
    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const currentContent = localContent;
    
    if (wrapOffset > 0 && start !== end) {
      const selectedText = currentContent.substring(start, end);
      const openTag = text.substring(0, wrapOffset);
      const closeTag = text.substring(wrapOffset);
      
      const newContent = currentContent.substring(0, start) + openTag + selectedText + closeTag + currentContent.substring(end);
      
      setLocalContent(newContent);
      handleUpdateDebounced({ content: newContent });
      
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          contentRef.current.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
        }
      }, 0);
    } else {
      const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
      setLocalContent(newContent);
      handleUpdateDebounced({ content: newContent });
      
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          contentRef.current.setSelectionRange(start + text.length - wrapOffset, start + text.length - wrapOffset);
        }
      }, 0);
    }
  };

  const handleGenerateTitle = async () => {
     if (!localContent || localContent.length < 30) return;
     setIsGeneratingTitle(true);
     const aiTitle = await generateTitleForSection(localContent);
     setIsGeneratingTitle(false);
     if (aiTitle) {
         setLocalTitle(aiTitle);
         onUpdate({ title: aiTitle });
     }
  };

  if (!section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F5F2] text-[#A89F91]">
        <div className="p-12 border border-[#E8E4DF] bg-[#FDFCFB] rounded-3xl flex flex-col items-center shadow-sm">
            <Maximize2 size={40} className="mb-4 opacity-30" />
            <p className="text-sm font-serif italic">Chọn một điểm nút để bắt đầu sao chép</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F5F2] overflow-hidden">
      <header className={cn(
        "px-10 py-10 flex items-end justify-between shrink-0 transition-opacity duration-500",
        isFocusMode ? "opacity-20 hover:opacity-100" : "opacity-100"
      )}>
        <div className="w-full relative group">
            <p className="text-[10px] font-bold text-[#8E8A85] uppercase tracking-[0.2em] mb-2 font-sans flex items-center justify-between">
                <span>Nút nghiên cứu / {section.title || "Chưa khám phá"}</span>
                <button 
                  onClick={handleGenerateTitle}
                  disabled={isGeneratingTitle || localContent.length < 30}
                  title="Gợi ý tiêu đề bằng AI"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#A89F91] hover:text-[#5A5A40] disabled:opacity-30 flex items-center gap-1 bg-white rounded-md border border-[#E8E4DF]"
                >
                  <Wand2 size={12} className={isGeneratingTitle ? "animate-pulse" : ""} />
                  <span className="text-[8px]">Tạo Tự Động</span>
                </button>
            </p>
            <input 
              type="text"
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value);
                handleUpdateDebounced({ title: e.target.value });
              }}
              placeholder="Tiêu đề luận điểm..."
              className={cn(
                "text-4xl text-[#33302E] bg-transparent border-none outline-none placeholder:text-[#E8E4DF] w-full",
                fontFamily === 'sans' ? 'font-sans font-bold tracking-tight' : 'font-serif'
              )}
            />
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={onToggleFocus}
                title={isFocusMode ? "Thoát chế độ tập trung" : "Chế độ tập trung"}
                className={cn(
                  "p-2.5 bg-white border border-[#E8E4DF] rounded-full transition-all",
                  isFocusMode ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#A89F91]"
                )}
            >
                <Maximize2 size={18} />
            </button>
            <button 
                onClick={onAnalyze}
                disabled={isAnalyzing || !localContent}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#5A5A40] text-white rounded-full text-xs font-semibold shadow-md shadow-[#5A5A40]/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                <Sparkles size={14} className={isAnalyzing ? "animate-pulse" : ""} />
                {isAnalyzing ? "Đang tổng hợp..." : "Hệ thống hóa nút"}
            </button>
            <button 
                onClick={onDelete}
                className="p-2.5 bg-white border border-[#E8E4DF] hover:bg-red-50 hover:text-red-500 rounded-full text-[#A89F91] transition-all"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto px-10 py-6 scrollbar-stone">
        <div className="max-w-4xl mx-auto space-y-6">
            <div className={cn("flex flex-wrap items-center gap-1.5 p-1.5 bg-[#FDFCFB] border border-[#E8E4DF] rounded-xl transition-all duration-300 shadow-sm", isFocusMode ? "opacity-20 hover:opacity-100" : "opacity-100")}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => setIsPreview(!isPreview)} className={cn("px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2", isPreview ? "bg-[#5A5A40] text-white" : "hover:bg-[#F7F5F2] hover:text-[#5A5A40] text-[#A89F91]")} title={isPreview ? "Chế độ soạn thảo" : "Chế độ xem trước"}>
                    {isPreview ? <PenLine size={16} /> : <Eye size={16} />}
                    <span className="text-xs font-semibold uppercase tracking-wider">{isPreview ? "Soạn thảo" : "Xem trước"}</span>
                </button>
                <div className="w-px h-4 bg-[#E8E4DF] mx-1"></div>

                <div className={cn("flex items-center gap-1.5 transition-opacity", isPreview ? "opacity-30 pointer-events-none" : "")}>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertTextAtCursor('****', 2)} className="p-2 hover:bg-[#F7F5F2] hover:text-[#5A5A40] text-[#A89F91] rounded-lg transition-colors flex items-center gap-2" title="In đậm">
                        <Bold size={16} />
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertTextAtCursor('**', 1)} className="p-2 hover:bg-[#F7F5F2] hover:text-[#5A5A40] text-[#A89F91] rounded-lg transition-colors flex items-center gap-2" title="In nghiêng">
                        <Italic size={16} />
                    </button>
                    <div className="w-px h-4 bg-[#E8E4DF] mx-1"></div>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertTextAtCursor('\n### ', 0)} className="p-2 hover:bg-[#F7F5F2] hover:text-[#5A5A40] text-[#A89F91] rounded-lg transition-colors flex items-center gap-2" title="Tiêu đề">
                        <Heading size={16} />
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertTextAtCursor('\n- ', 0)} className="p-2 hover:bg-[#F7F5F2] hover:text-[#5A5A40] text-[#A89F91] rounded-lg transition-colors flex items-center gap-2" title="Danh sách">
                        <List size={16} />
                    </button>
                    <div className="w-px h-4 bg-[#E8E4DF] mx-1"></div>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertTextAtCursor('\n\n| Cột 1 | Cột 2 | Cột 3 |\n|---|---|---|\n| Dữ liệu | Dữ liệu | Dữ liệu |\n| Dữ liệu | Dữ liệu | Dữ liệu |\n\n', 0)} className="px-3 py-1.5 hover:bg-[#F7F5F2] hover:text-[#5A5A40] text-[#A89F91] rounded-lg transition-colors flex items-center gap-2" title="Chèn bảng">
                        <Table2 size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Bảng</span>
                    </button>
                </div>
                
                <div className="flex-1"></div>
                
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleManualFormat}
                  disabled={isPreview}
                  title="Chuẩn hoá & Căn lề tự động (Tẩy xoá lỗi đánh máy, dấu câu)"
                  className="px-3 py-1.5 text-[#A89F91] hover:text-[#5A5A40] hover:bg-[#F7F5F2] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Type size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Chuẩn hoá</span>
                </button>
            </div>

            {isPreview ? (
              <div className={cn("min-h-[40vh] py-4", fontFamily === 'sans' ? 'font-sans' : 'font-serif')}>
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {localContent || "*Chưa có nội dung...*"}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                ref={contentRef}
                value={localContent}
                onChange={handleContentChange}
                placeholder="Bắt đầu cuộc truy vấn của bạn tại đây..."
                className={cn(
                  "w-full h-full min-h-[40vh] text-lg leading-relaxed text-[#4A4744] bg-transparent border-none outline-none resize-none placeholder:text-[#E8E4DF] py-4",
                  fontFamily === 'sans' ? 'font-sans' : 'font-serif'
                )}
              />
            )}
            
            <div className="border-t border-[#E8E4DF] pt-8 pb-12">
              <p className="text-[10px] font-bold text-[#8E8A85] uppercase tracking-[0.2em] mb-4 font-sans flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#A89F91] rounded-full"></span>
                Ghi chú cá nhân
              </p>
              <textarea
                value={localNotes}
                onChange={(e) => {
                  setLocalNotes(e.target.value);
                  handleUpdateDebounced({ notes: e.target.value });
                }}
                placeholder="Ghi lại các ý tưởng, liên kết hoặc suy nghĩ thoáng qua..."
                className="w-full text-base leading-relaxed text-[#5A5A40] bg-white border border-[#E8E4DF] rounded-2xl p-6 outline-none resize-y min-h-[25vh] placeholder:text-[#E8E4DF] font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:border-[#5A5A40] transition-colors"
              />
            </div>
        </div>
      </main>
      
      <footer className="px-10 py-6 border-t border-[#E8E4DF] bg-[#FDFCFB] flex items-center justify-between shrink-0">
        <div className="flex gap-8 items-center">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest leading-none mb-1.5">Kích thước văn bản</span>
                <span className="text-xs font-mono text-[#5A5A40]">{localContent.trim().split(/\s+/).filter(Boolean).length} từ</span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest leading-none mb-1.5">Mật độ luận điểm</span>
                <span className="text-xs font-mono text-[#5A5A40]">{Math.round(localContent.length / 10)} pts</span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest leading-none mb-1.5">Thời gian đọc</span>
                <span className="text-xs font-mono text-[#5A5A40]">~{Math.max(1, Math.ceil(localContent.trim().split(/\s+/).filter(Boolean).length / 200))} phút</span>
            </div>
        </div>
        
        <AnimatePresence>
            {section.summary && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-[#5A5A40]/5 px-3 py-1.5 rounded-full border border-[#5A5A40]/10"
                >
                    <div className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest">Logic đã mã hóa</span>
                </motion.div>
            )}
        </AnimatePresence>
      </footer>
    </div>
  );
}
