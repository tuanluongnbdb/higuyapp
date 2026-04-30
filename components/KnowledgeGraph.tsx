'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Section } from '@/lib/types';
import { Network, SlidersHorizontal, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface GraphProps {
  sections: Section[];
  activeSectionId: string | null;
  onSelectNode: (id: string) => void;
}

export default function KnowledgeGraph({ sections, activeSectionId, onSelectNode }: GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'insights'>('graph');
  const [timelineIndex, setTimelineIndex] = useState(0);

  useEffect(() => {
    if (viewMode !== 'graph' || !svgRef.current || sections.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = sections.map(s => ({ 
        id: s.id, 
        title: s.title,
        size: Math.log(s.content.length + 1) * 3 + 4
    }));
    
    // Connect nodes based on shared concepts (AI generated)
    const links: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const s1 = sections.find(s => s.id === nodes[i].id);
            const s2 = sections.find(s => s.id === nodes[j].id);
            const sharedConcepts = (s1?.connections || []).filter(c => (s2?.connections || []).includes(c));
            
            // Link if they share concepts
            if (sharedConcepts.length > 0) {
                links.push({ source: nodes[i].id, target: nodes[j].id, strength: sharedConcepts.length });
            }
        }
    }

    // Fallback: if graph is very sparse, add sequential links
    if (links.length < nodes.length - 1) {
        for (let i = 0; i < nodes.length - 1; i++) {
           const exists = links.some(l => (l.source === nodes[i].id && l.target === nodes[i+1].id) || (l.target === nodes[i].id && l.source === nodes[i+1].id));
           if (!exists) links.push({ source: nodes[i].id, target: nodes[i+1].id, strength: 0.5 });
        }
    }

    const simulation = d3.forceSimulation(nodes as any)
        .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance((d: any) => d.strength > 0 ? Math.max(40, 100 - d.strength * 10) : 100))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius((d: any) => d.size + 15));

    const link = svg.append('g')
        .attr('stroke', '#e5e5e5')
        .attr('stroke-width', 1)
        .selectAll('line')
        .data(links)
        .join('line');

    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('cursor', 'pointer')
        .on('click', (event, d: any) => onSelectNode(d.id))
        .call(d3.drag()
            .on('start', (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event: any, d: any) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event: any, d: any) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }) as any
        );

    node.append('circle')
        .attr('r', (d: any) => d.size)
        .attr('fill', (d: any) => d.id === activeSectionId ? '#5A5A40' : '#ffffff')
        .attr('stroke', '#5A5A40')
        .attr('stroke-width', 1.5)
        .attr('class', 'transition-all duration-300');

    node.append('text')
        .text((d: any) => d.title?.substring(0, 15) + (d.title?.length > 15 ? '...' : ''))
        .attr('x', (d: any) => d.size + 6)
        .attr('y', 4)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-weight', 'bold')
        .attr('fill', '#8E8A85');

    simulation.on('tick', () => {
        link
            .attr('x1', (d: any) => d.source.x)
            .attr('y1', (d: any) => d.source.y)
            .attr('x2', (d: any) => d.target.x)
            .attr('y2', (d: any) => d.target.y);

        // Constrain nodes within bounds
        node.attr('transform', (d: any) => {
            d.x = Math.max(20, Math.min(width - 20, d.x));
            d.y = Math.max(20, Math.min(height - 20, d.y));
            return `translate(${d.x},${d.y})`;
        });
    });

    return () => { simulation.stop(); };
  }, [sections, activeSectionId, onSelectNode, viewMode]);

  // Insights aggregation
  const allKeyPoints = sections.flatMap(s => s.keyPoints || []);
  const allThemes = sections.flatMap(s => s.themes || []);
  const uniqueThemes = Array.from(new Set(allThemes));

  return (
    <div className="w-full bg-[#FDFCFB] rounded-2xl border border-[#E8E4DF] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E8E4DF] bg-white flex items-center justify-between">
            <div className="flex gap-2">
               <button 
                  onClick={() => setViewMode('graph')}
                  className={cn("px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors", viewMode === 'graph' ? "bg-[#5A5A40] text-white" : "text-[#A89F91] hover:bg-[#F7F5F2]")}
               >
                  <Network size={12} /> Matrix
               </button>
               <button 
                  onClick={() => setViewMode('timeline')}
                  className={cn("px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors", viewMode === 'timeline' ? "bg-[#5A5A40] text-white" : "text-[#A89F91] hover:bg-[#F7F5F2]")}
               >
                  <SlidersHorizontal size={12} /> Timeline
               </button>
               <button 
                  onClick={() => setViewMode('insights')}
                  className={cn("px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors", viewMode === 'insights' ? "bg-[#5A5A40] text-white" : "text-[#A89F91] hover:bg-[#F7F5F2]")}
               >
                  <BookOpen size={12} /> Insights
               </button>
            </div>
            <span className="text-[9px] text-[#A89F91] font-mono italic">Knowledge Synthesis Hub</span>
        </div>
        
        <div className="relative h-[400px] w-full overflow-hidden">
            {viewMode === 'graph' && (
                <svg ref={svgRef} className="w-full h-full" />
            )}
            
            {viewMode === 'timeline' && sections.length > 0 && (
                <div className="absolute inset-0 flex flex-col p-8 bg-stone-50/50">
                    <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full relative">
                       <AnimatePresence mode="wait">
                          <motion.div 
                             key={Math.min(timelineIndex, sections.length - 1)}
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -20 }}
                             transition={{ duration: 0.3 }}
                             className="bg-white border border-[#E8E4DF] p-8 rounded-2xl shadow-sm relative z-10"
                          >
                             <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-[#F7F5F2] text-[#5A5A40] flex items-center justify-center font-serif text-sm border border-[#E8E4DF] shrink-0">
                                   {Math.min(timelineIndex, sections.length - 1) + 1}
                                </span>
                                <h3 className="text-xl font-serif text-[#33302E] truncate">
                                   {sections[Math.min(timelineIndex, sections.length - 1)]?.title || "Nút chưa đặt tên"}
                                </h3>
                             </div>
                             
                             <p className="text-[#5A5A40] text-sm leading-relaxed mb-6 line-clamp-4 min-h-[5.5rem]">
                                {sections[Math.min(timelineIndex, sections.length - 1)]?.content || "Chưa có nội dung..."}
                             </p>
                             
                             <div className="flex items-center justify-between">
                                 <div className="flex flex-wrap gap-2">
                                     {sections[Math.min(timelineIndex, sections.length - 1)]?.keyPoints?.slice(0,2).map((kp, i) => (
                                         <span key={i} className="px-2 py-1 bg-[#F7F5F2] text-[#8E8A85] text-[10px] uppercase font-bold tracking-widest rounded-md truncate max-w-[150px]">
                                             {kp}
                                         </span>
                                     ))}
                                 </div>
                                 <button 
                                    onClick={() => onSelectNode(sections[Math.min(timelineIndex, sections.length - 1)].id)}
                                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#33302E] transition-colors shrink-0"
                                 >
                                     Mở <ArrowRight size={14} />
                                 </button>
                             </div>
                          </motion.div>
                       </AnimatePresence>
                    </div>
                    
                    <div className="mt-8 flex items-center gap-4 max-w-2xl mx-auto w-full">
                       <span className="text-xs font-mono text-[#8E8A85]">1</span>
                       <input 
                         type="range" 
                         min="0" 
                         max={sections.length - 1} 
                         value={timelineIndex}
                         onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                         className="flex-1 h-2 bg-[#E8E4DF] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#5A5A40] [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                       />
                       <span className="text-xs font-mono text-[#8E8A85]">{sections.length}</span>
                    </div>
                </div>
            )}

            {viewMode === 'insights' && (
                <div className="absolute inset-0 p-8 overflow-y-auto scrollbar-stone bg-stone-50/50">
                    <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div>
                            <h4 className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest mb-4">Mạng lưới chủ đề</h4>
                            <div className="flex flex-wrap gap-2">
                                {uniqueThemes.length > 0 ? uniqueThemes.map((theme, i) => (
                                    <span key={i} className="px-3 py-1.5 border border-[#E8E4DF] bg-white text-[#5A5A40] text-xs rounded-full shadow-sm hover:border-[#5A5A40] transition-colors cursor-default">
                                        {theme}
                                    </span>
                                )) : <span className="text-sm text-[#A89F91] italic font-serif">Chưa có chủ đề nào được chiết xuất. Dùng AI trên các nút để tạo.</span>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-[#A89F91] uppercase tracking-widest mb-4">Các điểm chính nổi bật</h4>
                            <ul className="space-y-3">
                                {allKeyPoints.length > 0 ? allKeyPoints.slice(0, 8).map((kp, i) => (
                                    <li key={i} className="text-sm text-[#5A5A40] flex gap-2">
                                        <span className="text-[#A89F91] mt-0.5">•</span>
                                        <span className="leading-relaxed">{kp}</span>
                                    </li>
                                )) : <span className="text-sm text-[#A89F91] italic font-serif">Chưa có điểm chính nào.</span>}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            
            {(viewMode === 'timeline' || viewMode === 'insights') && sections.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[#A89F91] text-sm italic font-serif">
                    Chưa có dữ liệu để hiển thị.
                </div>
            )}
        </div>
    </div>
  );
}
