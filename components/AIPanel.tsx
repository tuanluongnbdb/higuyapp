'use client';
import { Section } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, Network, MessageSquare, ListCheck, HelpCircle, Quote, Compass, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIPanelProps {
  section: Section | null;
  onOpenQuery?: () => void;
}

export default function AIPanel({ section, onOpenQuery }: AIPanelProps) {
  if (!section) return null;

  return (
    <div className="w-80 h-full border-l border-[#E8E4DF] bg-[#FDFCFB] overflow-y-auto hidden xl:flex flex-col font-sans">
      <div className="p-6 border-b border-[#E8E4DF] bg-white">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={18} className="text-[#5A5A40]" />
          <h2 className="text-[11px] font-bold text-[#33302E] uppercase tracking-widest leading-none">Cốt lõi Tổng hợp</h2>
        </div>
        <p className="text-[10px] text-[#A89F91] font-medium italic">Công cụ Nghiên cứu Nâng cao</p>
      </div>

      <div className="p-6 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-[#A89F91]" />
            <h3 className="text-[10px] font-bold text-[#33302E] uppercase tracking-[0.2em] leading-none">Ma trận Hiểu biết</h3>
          </div>
          
          <AnimatePresence mode="wait">
            {section.summary ? (
              <motion.div 
                key={section.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                 <div className="p-4 bg-white border border-[#E8E4DF] rounded-xl shadow-sm">
                    <p className="text-xs leading-relaxed text-[#4A4744] italic font-serif">
                      &quot;{section.summary}&quot;
                    </p>
                 </div>
                 
                 <div className="space-y-3">
                    {section.keyPoints?.map((point, i) => (
                        <div key={i} className="flex gap-3 items-start group">
                            <span className="w-5 h-5 rounded-full bg-[#E8E4DF] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-[#5A5A40]">
                                {i + 1}
                            </span>
                            <p className="text-xs text-[#8E8A85] leading-normal group-hover:text-[#33302E] transition-colors">
                                {point}
                            </p>
                        </div>
                    ))}
                 </div>
              </motion.div>
            ) : (
              <div className="py-10 text-center bg-[#F7F5F2] rounded-xl border border-[#E8E4DF] border-dashed">
                <p className="text-[10px] text-[#A89F91] font-medium px-6 leading-relaxed italic font-serif">
                  Chắt lọc truy vấn của bạn để kích hoạt đồng bộ hóa thần kinh.
                </p>
              </div>
            )}
          </AnimatePresence>
        </section>

        {section.quotes && section.quotes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Quote size={14} className="text-[#A89F91]" />
                <h3 className="text-[10px] font-bold text-[#33302E] uppercase tracking-[0.2em] leading-none">Trích dẫn Đắt giá</h3>
              </div>
              <div className="space-y-4">
                {section.quotes.map((q, i) => (
                    <blockquote key={i} className="border-l-2 border-[#5A5A40] pl-3 py-1 font-serif italic text-xs text-[#4A4744] leading-relaxed">
                        {q}
                    </blockquote>
                ))}
              </div>
            </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={14} className="text-[#A89F91]" />
            <h3 className="text-[10px] font-bold text-[#33302E] uppercase tracking-[0.2em] leading-none">Tư duy Phản biện</h3>
          </div>
          
          <div className="space-y-3">
            {section.questions?.map((q, i) => (
                <div key={i} className="p-3 bg-[#5A5A40]/5 border border-[#5A5A40]/10 rounded-lg transform transition-all hover:scale-[1.02] cursor-pointer">
                    <p className="text-[11px] text-[#5A5A40] leading-relaxed font-medium">
                        {q}
                    </p>
                </div>
            )) || (
                <p className="text-[10px] text-[#A89F91] italic font-serif opacity-60">Đặt câu hỏi để kiểm chứng luận điểm</p>
            )}
          </div>
        </section>

        {(section.nextSteps && section.nextSteps.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ListTodo size={14} className="text-[#A89F91]" />
                <h3 className="text-[10px] font-bold text-[#33302E] uppercase tracking-[0.2em] leading-none">Hướng đi Tiếp theo</h3>
              </div>
              <div className="space-y-2">
                {section.nextSteps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40] mt-1.5 shrink-0" />
                        <p className="text-[11px] text-[#8E8A85] leading-relaxed">{step}</p>
                    </div>
                ))}
              </div>
            </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Network size={14} className="text-[#A89F91]" />
            <h3 className="text-[10px] font-bold text-[#33302E] uppercase tracking-[0.2em] leading-none">Điểm nút & Khái niệm</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[...(section.themes || []), ...(section.connections || [])].filter(Boolean).map((tag, i) => (
                <span 
                    key={i} 
                    className="px-2.5 py-1.5 bg-white border border-[#E8E4DF] rounded-lg text-[10px] font-mono text-[#5A5A40] hover:border-[#5A5A40] hover:bg-[#5A5A40]/5 cursor-pointer transition-all uppercase"
                >
                    {i < (section.themes?.length || 0) ? '★ ' : '#'}{tag.toLowerCase().replace(/\s+/g, '_')}
                </span>
            )) || (
                <p className="text-[10px] text-[#A89F91] italic font-serif">Chưa trích xuất được nút nào</p>
            )}
          </div>
        </section>
        
        <section className="pt-4">
           <button 
              onClick={onOpenQuery}
              className="w-full flex items-center justify-between p-4 bg-[#5A5A40] text-white rounded-2xl group hover:shadow-lg transition-all active:scale-[0.98]"
           >
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="opacity-80" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Truy vấn Intel</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white" />
           </button>
        </section>
      </div>
      
      <div className="mt-auto p-4 m-6 bg-[#A89F91]/10 rounded-2xl border border-[#A89F91]/20">
        <div className="flex items-center gap-2 mb-3">
            <ListCheck size={12} className="text-[#A89F91]" />
            <span className="text-[9px] font-bold text-[#33302E] uppercase tracking-widest">Kiểm định Logic</span>
        </div>
        <div className="space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#8E8A85]">Điểm Minh bạch</span>
                <span className="text-[9px] font-mono font-bold text-[#5A5A40]">A+</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#8E8A85]">Chỉ số Chiều sâu</span>
                <span className="text-[9px] font-mono font-bold text-[#5A5A40]">{section.content.length > 500 ? "Uyên bác" : "Trung cấp"}</span>
             </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number, className: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m9 18 6-6-6-6"/>
        </svg>
    )
}
