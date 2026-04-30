'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Palette, Database, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [fontFamily, setFontFamily] = useLocalStorage('lumina-fontFamily', 'serif');
  const [apiKey, setApiKey] = useLocalStorage('lumina-apiKey', '');
  
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempApiKey(apiKey);
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(tempApiKey);
    if (tempApiKey !== apiKey) {
        window.location.reload(); // Reload to apply API key to the gemini instance
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#33302E]/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#FDFCFB] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DF] bg-white">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-[#5A5A40]/10 rounded-lg">
                    <Settings size={18} className="text-[#5A5A40]" />
                </div>
                <h2 className="text-sm font-bold text-[#33302E] uppercase tracking-widest leading-none">Cài đặt Hệ thống</h2>
             </div>
             <button onClick={onClose} className="p-2 text-[#A89F91] hover:text-[#33302E] transition-colors rounded-full hover:bg-[#F7F5F2]">
                <X size={18} />
             </button>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto max-h-[60vh] scrollbar-stone">
             
             {/* API Settings */}
             <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <Database size={16} className="text-[#5A5A40]" />
                    <h3 className="text-xs font-bold text-[#8E8A85] uppercase tracking-widest">Kết nối AI</h3>
                 </div>
                 
                 <div className="bg-white p-4 rounded-2xl border border-[#E8E4DF] shadow-sm">
                    <label className="block text-[11px] font-bold text-[#5A5A40] mb-2 uppercase tracking-wide">Gemini API Key (Tùy chọn)</label>
                    <input 
                        type="password"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="Để trống để sử dụng key mặc định của hệ thống..."
                        className="w-full px-4 py-2 bg-[#F7F5F2] border border-[#E8E4DF] rounded-xl text-sm outline-none focus:border-[#5A5A40] focus:bg-white transition-colors"
                    />
                    <p className="mt-3 text-[10px] text-[#A89F91] italic font-serif leading-relaxed">
                        Nhập khóa của riêng bạn nếu bạn gặp phải giới hạn tỷ lệ (rate limits) hoặc muốn sử dụng mô hình riêng biệt. Khóa này được lưu trữ cục bộ trong trình duyệt của bạn.
                    </p>
                 </div>
             </div>

             {/* Typographic Preferences */}
             <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <Type size={16} className="text-[#5A5A40]" />
                    <h3 className="text-xs font-bold text-[#8E8A85] uppercase tracking-widest">Trải nghiệm Đọc</h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setFontFamily('serif')}
                        className={cn(
                            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden",
                            fontFamily === 'serif' 
                                ? "border-[#5A5A40] bg-[#5A5A40]/5" 
                                : "border-[#E8E4DF] bg-white hover:border-[#A89F91]"
                        )}
                    >
                        {fontFamily === 'serif' && <div className="absolute top-0 right-0 w-2 h-2 bg-[#5A5A40] rounded-bl" />}
                        <span className="block font-serif text-2xl mb-2 text-[#33302E]">Aa</span>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Cổ điển (Serif)</span>
                        <span className="block text-[10px] text-[#A89F91] mt-1 font-serif italic">Tối ưu cho việc đọc chìm đắm.</span>
                    </button>
                    
                    <button 
                        onClick={() => setFontFamily('sans')}
                        className={cn(
                            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden",
                            fontFamily === 'sans' 
                                ? "border-[#5A5A40] bg-[#5A5A40]/5" 
                                : "border-[#E8E4DF] bg-white hover:border-[#A89F91]"
                        )}
                    >
                        {fontFamily === 'sans' && <div className="absolute top-0 right-0 w-2 h-2 bg-[#5A5A40] rounded-bl" />}
                        <span className="block font-sans text-2xl mb-2 text-[#33302E]">Aa</span>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Hiện đại (Sans)</span>
                        <span className="block text-[10px] text-[#A89F91] mt-1 font-serif italic">Gọn gàng, tối giản, rõ ràng.</span>
                    </button>
                 </div>
             </div>

          </div>
          
          <div className="p-4 border-t border-[#E8E4DF] bg-[#F7F5F2] flex justify-end gap-3">
             <button 
                onClick={onClose}
                className="px-5 py-2 rounded-full text-xs font-bold text-[#8E8A85] hover:text-[#33302E] transition-colors uppercase tracking-widest"
             >
                Hủy
             </button>
             <button 
                onClick={handleSave}
                className="px-6 py-2 bg-[#5A5A40] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:shadow-lg transition-all active:scale-[0.98]"
             >
                Lưu Thay Đổi
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
