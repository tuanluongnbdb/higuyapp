'use client';
import { Section } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Plus, GripVertical, ChevronRight } from 'lucide-react';
import { motion, Reorder } from 'motion/react';

interface ToCProps {
  sections: Section[];
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
  onAddSection: () => void;
  onReorder: (sections: Section[]) => void;
}

export default function TableOfContents({ 
  sections, 
  activeSectionId, 
  onSelectSection, 
  onAddSection,
  onReorder
}: ToCProps) {
  return (
    <div className="w-80 h-full border-r border-[#E8E4DF] flex flex-col bg-[#FDFCFB]">
      <div className="p-6 border-b border-[#E8E4DF] flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-[#8E8A85] uppercase tracking-widest">Đội ngũ</h2>
        <button 
          onClick={onAddSection}
          className="p-1 hover:bg-[#F7F5F2] rounded-md transition-colors"
        >
          <Plus size={16} className="text-[#A89F91]" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <Reorder.Group axis="y" values={sections} onReorder={onReorder} className="space-y-1">
          {sections.map((section) => (
            <Reorder.Item 
              key={section.id} 
              value={section}
              className="group"
            >
              <button
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all",
                  activeSectionId === section.id 
                    ? "bg-[#F7F5F2] text-[#5A5A40] font-semibold" 
                    : "text-[#8E8A85] hover:text-[#33302E] hover:bg-[#F7F5F2]/50"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-sm rotate-45",
                  activeSectionId === section.id ? "bg-[#5A5A40]" : "bg-[#E8E4DF] group-hover:bg-[#A89F91]"
                )} />
                <span className="truncate">{section.title || "Chương chưa đặt tên"}</span>
                {activeSectionId === section.id && (
                  <span className="ml-auto text-[10px] bg-[#E8E4DF] px-1.5 py-0.5 rounded text-[#8E8A85]">Đang mở</span>
                )}
              </button>
            </Reorder.Item>
          ))}
          
          {sections.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-[#8E8A85] italic font-serif">Chưa có mục lục</p>
            </div>
          )}
        </Reorder.Group>
      </div>
      
      <div className="p-6 bg-[#F7F5F2]/30 border-t border-[#E8E4DF]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-[#8E8A85] uppercase tracking-widest">Tiến độ</span>
          <span className="text-[10px] font-mono text-[#A89F91]">
            {sections.filter(s => s.content.length > 0).length}/{sections.length}
          </span>
        </div>
        <div className="w-full h-1 bg-[#E8E4DF] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(sections.filter(s => s.content.length > 0).length / Math.max(sections.length, 1)) * 100}%` }}
            className="h-full bg-[#5A5A40]" 
          />
        </div>
      </div>
    </div>
  );
}
