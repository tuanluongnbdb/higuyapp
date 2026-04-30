import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Brain, X, Send, Network, FileText, Loader2, Minimize2 } from 'lucide-react';
import { Section } from '@/lib/types';
import { queryIntel } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
}

export default function QueryModal({ isOpen, onClose, sections }: QueryModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        const timer = setTimeout(() => {
            setMessages([
              {
                id: 'intro',
                role: 'ai',
                content: '*Xin chào! Tớ là Lumina Intel.* Hệ thống đã lập chỉ mục ' + sections.length + ' điểm nút tri thức từ dự án hiện tại. Bạn muốn truy vấn điều gì?'
              }
            ]);
        }, 10);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, sections.length, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleQuery = async () => {
    if (!input.trim() || isLoading) return;
    
    const queryStr = input.trim();
    setInput('');
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryStr
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Compile context from sections
    const contextStr = sections.map(s => {
      let chunk = `## Nút: ${s.title}\n${s.content}\n`;
      if (s.keyPoints?.length) chunk += `Hiểu biết AI: ${s.keyPoints.join("; ")}\n`;
      return chunk;
    }).join('\n\n');

    try {
      const response = await queryIntel(contextStr, queryStr);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response || 'Lỗi truy xuất hệ thống thần kinh. Vui lòng thử lại.'
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const aiErrMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Hệ thống AI không phản hồi kịp thời. Xin kiểm tra lại API key ở phần Cài đặt.'
      };
      setMessages(prev => [...prev, aiErrMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#33302E]/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#FDFCFB] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] font-sans border border-[#E8E4DF]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DF] bg-white shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5A5A40] flex items-center justify-center text-white shadow-sm">
                    <Brain size={18} />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-[#33302E] uppercase tracking-widest leading-none mb-1">Lumina Intel</h2>
                   <p className="text-[10px] text-[#A89F91] font-mono italic">Đã lập chỉ mục {sections.length} nút</p>
                </div>
             </div>
             
             <button onClick={onClose} className="p-2 text-[#A89F91] hover:text-[#33302E] transition-colors rounded-full hover:bg-[#F7F5F2]">
               <Minimize2 size={18} />
             </button>
          </div>

          {/* Chat Space */}
          <div 
             ref={scrollRef}
             className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-stone"
          >
             {messages.map((msg) => (
                <div 
                   key={msg.id} 
                   className={cn(
                       "max-w-[85%] flex", 
                       msg.role === 'user' ? "ml-auto justify-end" : "mr-auto justify-start"
                   )}
                >
                   <div 
                      className={cn(
                          "rounded-2xl p-5 text-sm leading-relaxed",
                          msg.role === 'user' 
                             ? "bg-[#5A5A40] text-white rounded-br-none shadow-md shadow-[#5A5A40]/10" 
                             : "bg-white border border-[#E8E4DF] text-[#4A4744] rounded-tl-none shadow-sm markdown-body"
                      )}
                   >
                      {msg.role === 'ai' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                          </ReactMarkdown>
                      ) : (
                          msg.content
                      )}
                   </div>
                </div>
             ))}
             
             {isLoading && (
                 <div className="mr-auto max-w-[85%]">
                     <div className="bg-white border border-[#E8E4DF] p-5 rounded-2xl rounded-tl-none shadow-sm flex items-center justify-center gap-3">
                         <Loader2 size={16} className="text-[#A89F91] animate-spin" />
                         <span className="text-xs text-[#A89F91] font-serif italic">Đang phân tích cấu trúc hạt tri thức...</span>
                     </div>
                 </div>
             )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#E8E4DF] bg-white shrink-0">
             <div className="flex items-center gap-3 bg-[#F7F5F2] border border-[#E8E4DF] rounded-xl p-2 focus-within:border-[#5A5A40] focus-within:ring-1 focus-within:ring-[#5A5A40] transition-all">
                <input 
                   ref={inputRef}
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   onKeyDown={e => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleQuery();
                       }
                   }}
                   placeholder="Truy vấn thông tin chéo giữa các điểm nút..."
                   className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-[#33302E] placeholder:text-[#A89F91]"
                />
                
                <button 
                   onClick={handleQuery}
                   disabled={!input.trim() || isLoading}
                   className="p-2 bg-[#5A5A40] text-white rounded-lg hover:shadow-md disabled:opacity-50 transition-all active:scale-95"
                >
                   <Send size={16} />
                </button>
             </div>
             
             <div className="mt-3 flex justify-between items-center px-2">
                 <span className="text-[10px] text-[#A89F91] font-serif italic">
                     Hỗ trợ bởi Google Gemini 2.5 Flash
                 </span>
                 <span className="text-[10px] flex items-center gap-1 text-[#A89F91]">
                     <kbd className="bg-[#F7F5F2] px-1.5 py-0.5 rounded border border-[#E8E4DF] font-mono">Enter</kbd> để gửi
                 </span>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
