import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ISStep } from '../types';
import { ArrowRight, HelpCircle, Check, MapPin, Calendar, Award, Sparkles } from 'lucide-react';

interface ISMilestonePathProps {
  steps: (ISStep & { startDateStr: string; endDateStr: string; duration: number })[];
  stepStatuses: Record<number, 'pending' | 'in_progress' | 'completed'>;
  onSelectNode: (stepId: number) => void;
  activePhaseFilter: string;
}

// Geometric coordinates calculation matching snake layout
// 6 steps per row, total 4 rows for 21 steps.
const STEPS_PER_ROW = 6;
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 420;
const PADDING_X = 85;
const PADDING_Y = 60;
const ROW_SPACING = 100;
const COL_SPACING = (CANVAS_WIDTH - PADDING_X * 2) / (STEPS_PER_ROW - 1); // ~166 px

const PHASE_COLORS: Record<string, { fill: string; stroke: string; bg: string; text: string; label: string }> = {
  preparation: { fill: '#3b82f6', stroke: '#1d4ed8', bg: 'bg-blue-50', text: 'text-blue-600', label: '1. เริ่มและเสนอหัวข้อ' },
  proposal: { fill: '#6366f1', stroke: '#4338ca', bg: 'bg-indigo-50', text: 'text-indigo-600', label: '2. เขียนและสอบเค้าโครง' },
  instruments: { fill: '#a855f7', stroke: '#7e22ce', bg: 'bg-purple-50', text: 'text-purple-600', label: '3. เครื่องมือ & IRB' },
  collection: { fill: '#f59e0b', stroke: '#b45309', bg: 'bg-amber-50', text: 'text-amber-600', label: '4. เก็บรวบรวมข้อมูล' },
  analysis: { fill: '#ec4899', stroke: '#be185d', bg: 'bg-pink-50', text: 'text-pink-600', label: '5. วิเคราะห์ & เล่ม 5 บท' },
  final: { fill: '#10b981', stroke: '#047857', bg: 'bg-emerald-50', text: 'text-emerald-600', label: '6. สอบปากเปล่า' },
  graduation: { fill: '#14b8a6', stroke: '#0f766e', bg: 'bg-teal-50', text: 'text-teal-600', label: '7. เผยแพร่ & สำเร็จ' }
};

export function ISMilestonePath({
  steps,
  stepStatuses,
  onSelectNode,
  activePhaseFilter
}: ISMilestonePathProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Helper to obtain center coords for step index (0 to 20)
  const getNodeCoords = (index: number) => {
    const row = Math.floor(index / STEPS_PER_ROW);
    const colInRow = index % STEPS_PER_ROW;
    const col = row % 2 === 0 ? colInRow : (STEPS_PER_ROW - 1) - colInRow;

    const x = PADDING_X + col * COL_SPACING;
    const y = PADDING_Y + row * ROW_SPACING;
    return { x, y };
  };

  // Build connection path string dynamically
  let backgroundPathD = '';
  for (let i = 0; i < steps.length; i++) {
    const current = getNodeCoords(i);
    if (i === 0) {
      backgroundPathD += `M ${current.x},${current.y}`;
    } else {
      const prev = getNodeCoords(i - 1);
      const prevRow = Math.floor((i - 1) / STEPS_PER_ROW);
      const currRow = Math.floor(i / STEPS_PER_ROW);

      if (prevRow !== currRow) {
        // We moved down a row, draw a smooth curve turn at the edge
        const lastCol = (prevRow % 2 === 0) ? STEPS_PER_ROW - 1 : 0;
        const isRightTurn = (prevRow % 2 === 0);
        const curveOffset = isRightTurn ? 70 : -70;
        const controlX = prev.x + curveOffset;
        backgroundPathD += ` C ${controlX},${prev.y} ${controlX},${current.y} ${current.x},${current.y}`;
      } else {
        // Simple straight horizontal line
        backgroundPathD += ` L ${current.x},${current.y}`;
      }
    }
  }

  // Count milestones completion for user overview
  const totalCount = steps.length;
  const completedCount = steps.filter(s => stepStatuses[s.id] === 'completed').length;
  const inProgressCount = steps.filter(s => stepStatuses[s.id] === 'in_progress').length;

  return (
    <div className="bg-white border-2 border-slate-205 rounded-none p-5 sm:p-6 space-y-6 text-left" id="milestone-path-feature">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-600 block animate-pulse"></span>
            🧭 INTERACTIVE GEOMETRIC TIMELINE ROADMAP
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            ลายเส้นเดินทางผ่าน 21 ขั้นตอนพิมพ์เขียวเพื่อความง่ายในการตรวจสอบเป้าหมายใหญ่และช่วงเวลาต่อกัน
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] shrink-0">
          <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <strong>{completedCount}</strong>/{totalCount} FINISHED
          </div>
          <div className="bg-amber-50 text-amber-700 px-2.5 py-1 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <strong>{inProgressCount}</strong> ACTIVE
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto select-none py-1 scrollbar-thin bg-slate-50/50 border border-slate-200 p-2 sm:p-4">
        <div className="min-w-[850px] mx-auto overflow-hidden">
          <svg
            width="100%"
            height={CANVAS_HEIGHT}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            className="overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Legend / Guide grids internally */}
            <g opacity="0.3">
              {[0, 1, 2, 3].map((rowIdx) => (
                <rect
                  key={rowIdx}
                  x={20}
                  y={rowIdx * ROW_SPACING + PADDING_Y - 30}
                  width={CANVAS_WIDTH - 40}
                  height={60}
                  fill={rowIdx % 2 === 0 ? "rgba(226, 232, 240, 0.4)" : "transparent"}
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeDasharray="4,4"
                  strokeWidth="1.5"
                />
              ))}
            </g>

            {/* Row Phase labels on backgrounds */}
            <g className="font-sans text-[9px] font-bold fill-slate-400 select-none">
              <text x={30} y={PADDING_Y - 22} textAnchor="start" className="uppercase font-mono tracking-widest fill-indigo-700 font-extrabold">PHASE I: PREPARATION (เริ่มต้นเสนอหัวข้อ 1-3)</text>
              <text x={CANVAS_WIDTH - 30} y={PADDING_Y + ROW_SPACING - 22} textAnchor="end" className="uppercase font-mono tracking-widest fill-indigo-700 font-extrabold">PHASE II: PROPOSAL & INSTRUMENTS (เขียนเค้าโครง พัฒนาเครื่องมือ & IRB 4-10)</text>
              <text x={30} y={PADDING_Y + ROW_SPACING * 2 - 22} textAnchor="start" className="uppercase font-mono tracking-widest fill-indigo-700 font-extrabold">PHASE III: COLLECTION & ANALYSIS (ลงพื้นที่วิเคราะห์ข้อมูล 5 บท 11-16)</text>
              <text x={CANVAS_WIDTH - 30} y={PADDING_Y + ROW_SPACING * 3 - 22} textAnchor="end" className="uppercase font-mono tracking-widest fill-indigo-700 font-extrabold">PHASE IV: DEFENSE & GRADUATION (สอบปากเปล่าส่งรูปเล่มจบ 17-21)</text>
            </g>

            {/* Background Path line */}
            <path
              d={backgroundPathD}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dynamic Active Progress Path overlays */}
            {steps.map((_step, idx) => {
              if (idx === 0) return null;
              const prev = getNodeCoords(idx - 1);
              const current = getNodeCoords(idx);
              const prevStep = steps[idx - 1];
              const prevStatus = stepStatuses[prevStep.id];
              const curStatus = stepStatuses[steps[idx].id];

              // Path segment is active if previous is completed and current is either completed or in_progress
              const isActive = prevStatus === 'completed' && (curStatus === 'completed' || curStatus === 'in_progress');
              const isAllCompleted = prevStatus === 'completed' && curStatus === 'completed';

              const row = Math.floor(idx / STEPS_PER_ROW);
              const prevRow = Math.floor((idx - 1) / STEPS_PER_ROW);

              let strokeColor = '#e2e8f0';
              if (isAllCompleted) {
                strokeColor = '#10b981'; // emerald green
              } else if (isActive) {
                strokeColor = '#6366f1'; // indigo active
              } else {
                return null;
              }

              let segmentD = '';
              if (prevRow !== row) {
                const isRightTurn = (prevRow % 2 === 0);
                const curveOffset = isRightTurn ? 70 : -70;
                const controlX = prev.x + curveOffset;
                segmentD = `M ${prev.x},${prev.y} C ${controlX},${prev.y} ${controlX},${current.y} ${current.x},${current.y}`;
              } else {
                segmentD = `M ${prev.x},${prev.y} L ${current.x},${current.y}`;
              }

              return (
                <path
                  key={`act-segment-${idx}`}
                  d={segmentD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Milestone Step Nodes */}
            {steps.map((step, idx) => {
              const { x, y } = getNodeCoords(idx);
              const status = stepStatuses[step.id] || 'pending';
              const phaseInfo = PHASE_COLORS[step.phase] || PHASE_COLORS.preparation;

              const isHovered = hoveredNode === step.id;
              const isFilterMatched = activePhaseFilter === 'all' || step.phase === activePhaseFilter;

              // Node radius styling based on status and interaction
              let nodeFill = '#ffffff';
              let nodeStroke = '#cbd5e1';
              let nodeStrokeWidth = 3;
              let textColor = '#475569';
              let sizeRadius = 14;

              if (status === 'completed') {
                nodeFill = '#e6f4ea';
                nodeStroke = '#10b981';
                nodeStrokeWidth = 4;
                textColor = '#0f5132';
                sizeRadius = 16;
              } else if (status === 'in_progress') {
                nodeFill = '#fef3c7';
                nodeStroke = '#f59e0b';
                nodeStrokeWidth = 4;
                textColor = '#78350f';
                sizeRadius = 18;
              } else {
                // Pending
                nodeFill = '#ffffff';
                nodeStroke = phaseInfo.fill;
                nodeStrokeWidth = 2;
                textColor = '#1e293b';
                sizeRadius = 13;
              }

              return (
                <g
                  key={`node-${step.id}`}
                  className="cursor-pointer"
                  onClick={() => onSelectNode(step.id)}
                  onMouseEnter={() => setHoveredNode(step.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Subtle pulsing background ring for In-Progress elements */}
                  {status === 'in_progress' && (
                    <circle
                      cx={x}
                      cy={y}
                      r={sizeRadius + 6}
                      fill="rgba(245, 158, 11, 0.2)"
                      className="animate-ping"
                      style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '3s' }}
                    />
                  )}

                  {/* Nodes highlight on filter match */}
                  {!isFilterMatched && (
                    <circle
                      cx={x}
                      cy={y}
                      r={sizeRadius + 4}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="2"
                    />
                  )}

                  {/* Main Circle Node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={sizeRadius}
                    fill={nodeFill}
                    stroke={nodeStroke}
                    strokeWidth={isHovered ? nodeStrokeWidth + 1.5 : nodeStrokeWidth}
                    className="transition-all duration-150"
                  />

                  {/* Glowing hover outer ring */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={sizeRadius + 5}
                      fill="none"
                      stroke={phaseInfo.fill}
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                    />
                  )}

                  {/* Step ID Inside Circle Node */}
                  <text
                    x={x}
                    y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-mono font-bold select-none transition-all duration-150"
                    style={{
                      fontSize: sizeRadius > 14 ? '11px' : '9px',
                      fill: textColor
                    }}
                  >
                    {step.id}
                  </text>
                  
                  {/* Step Activity Text Label Bubble (only key words for visual ease!) */}
                  <text
                    x={x}
                    y={y + sizeRadius + 14}
                    textAnchor="middle"
                    className="font-sans text-[10px] font-bold fill-slate-800 tracking-tight"
                  >
                    {step.activity.length > 18 ? step.activity.substring(0, 16) + '..' : step.activity}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Floating Detailed Step Preview Box based on interactive hovering or selection */}
      <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-none min-h-[96px] flex flex-col justify-between relative overflow-hidden">
        <AnimatePresence mode="wait">
          {hoveredNode !== null ? (
            <motion.div
              key={`preview-hover-${hoveredNode}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div className="md:col-span-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 shrink-0">
                    ขั้นตอนที่ {hoveredNode}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 ${PHASE_COLORS[steps[hoveredNode - 1].phase]?.bg} ${PHASE_COLORS[steps[hoveredNode - 1].phase]?.text} border border-slate-205`}>
                    {PHASE_COLORS[steps[hoveredNode - 1].phase]?.label}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    ⏱️ {steps[hoveredNode - 1].duration} วัน
                  </span>
                </div>
                <h4 className="font-sans font-bold text-sm text-slate-900 leading-tight">
                  {steps[hoveredNode - 1].activity}
                </h4>
                <p className="text-slate-500 text-xs font-light line-clamp-1 mt-1">
                  {steps[hoveredNode - 1].description}
                </p>
              </div>

              <div className="flex items-center sm:justify-end gap-2 shrink-0">
                <span className="text-[10px] font-mono font-black text-slate-400 block uppercase sm:text-right">
                  {stepStatuses[hoveredNode] === 'completed' && '🟢 COMPLETED'}
                  {stepStatuses[hoveredNode] === 'in_progress' && '🔵 IN-PROGRESS'}
                  {stepStatuses[hoveredNode] === 'pending' && '🟡 PENDING'}
                </span>
                <button
                  onClick={() => onSelectNode(hoveredNode)}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white p-1.5 rounded-none font-bold text-[10px] flex items-center justify-center gap-1 shrink-0 uppercase tracking-wider"
                >
                  <span>วิเคราะห์ / ดูคู่มือ</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview-no-hover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between h-full py-2"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-indigo-400 animate-bounce" />
                <span className="text-xs text-slate-600 font-medium">
                  ชี้เมาส์ (Hover) เหนือโหนดหรือคลิกเพื่อข้ามไปยังขั้นตอนเล่มร่างทันทีเพื่อปรับจำนวนวันหรือพิมพ์เช็คลิสต์ย่อย
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-indigo-800 uppercase font-black tracking-wider bg-indigo-50 border border-indigo-200 px-2 py-0.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Interactive Map v1.1</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
