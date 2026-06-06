import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  GraduationCap,
  Search,
  FileText,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Edit3,
  Printer,
  ChevronDown,
  ChevronUp,
  Download,
  BookOpen,
  Users,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_IS_STEPS, PHASES } from './data';
import { ISStep, UserSchedule } from './types';
import { AIPressureHelpers } from './components/AIPressureHelpers';
import { ISMilestonePath } from './components/ISMilestonePath';

export default function App() {
  // --- Persistent & Local State ---
  const [startDate, setStartDate] = useState<string>('2026-06-08'); // Default start date
  const [roleMode, setRoleMode] = useState<'student' | 'advisor'>('student');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom durations per step to let users build their own custom Gantt schedule
  const [customDurations, setCustomDurations] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('is_planner_durations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const initial: Record<number, number> = {};
    INITIAL_IS_STEPS.forEach(step => {
      initial[step.id] = step.defaultDurationDays;
    });
    return initial;
  });

  // Step Statuses
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'pending' | 'in_progress' | 'completed'>>(() => {
    const saved = localStorage.getItem('is_planner_statuses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const initial: Record<number, 'pending' | 'in_progress' | 'completed'> = {};
    INITIAL_IS_STEPS.forEach(step => {
      initial[step.id] = step.id === 1 ? 'in_progress' : 'pending';
    });
    return initial;
  });

  // Personal notes per step
  const [stepNotes, setStepNotes] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('is_planner_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {};
  });

  // Expanded items state
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false
  });

  // Active module tab
  const [activeTab, setActiveTab] = useState<'timeline' | 'helpers' | 'guide'>('timeline');

  // Modal for editing step duration
  const [editingDurationStepId, setEditingDurationStepId] = useState<number | null>(null);
  const [tempDuration, setTempDuration] = useState<number>(10);

  // --- Persistence Side-Effects ---
  useEffect(() => {
    localStorage.setItem('is_planner_durations', JSON.stringify(customDurations));
  }, [customDurations]);

  useEffect(() => {
    localStorage.setItem('is_planner_statuses', JSON.stringify(stepStatuses));
  }, [stepStatuses]);

  useEffect(() => {
    localStorage.setItem('is_planner_notes', JSON.stringify(stepNotes));
  }, [stepNotes]);

  // --- Calculated Schedule & Gantt Properties ---
  const calculatedSteps = useMemo(() => {
    let currentCursor = new Date(startDate);
    
    return INITIAL_IS_STEPS.map(step => {
      const duration = customDurations[step.id] || step.defaultDurationDays;
      
      const start = new Date(currentCursor);
      const end = new Date(currentCursor);
      end.setDate(end.getDate() + duration);
      
      // Update cursor for the next step (consecutive model based on user flow)
      currentCursor = new Date(end);

      return {
        ...step,
        duration,
        startDateStr: start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        endDateStr: end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        rawStart: start,
        rawEnd: end
      };
    });
  }, [startDate, customDurations]);

  // Total Duration & End Date
  const totalDurationDays = useMemo(() => {
    return (Object.values(customDurations) as number[]).reduce((sum, d) => sum + d, 0);
  }, [customDurations]);

  const projectedEndDateStr = useMemo(() => {
    if (calculatedSteps.length === 0) return '';
    return calculatedSteps[calculatedSteps.length - 1].endDateStr;
  }, [calculatedSteps]);

  // Overall Completion Progress Percent
  const progressPercent = useMemo(() => {
    const completedCount = Object.values(stepStatuses).filter(s => s === 'completed').length;
    return Math.round((completedCount / INITIAL_IS_STEPS.length) * 100);
  }, [stepStatuses]);

  // --- Handlers ---
  const handleToggleExpand = (id: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStatusChange = (id: number, status: 'pending' | 'in_progress' | 'completed') => {
    setStepStatuses(prev => ({
      ...prev,
      [id]: status
    }));
  };

  const handleNoteChange = (id: number, text: string) => {
    setStepNotes(prev => ({
      ...prev,
      [id]: text
    }));
  };

  const openDurationModal = (id: number, currentD: number) => {
    setEditingDurationStepId(id);
    setTempDuration(currentD);
  };

  const saveDuration = () => {
    if (editingDurationStepId !== null) {
      setCustomDurations(prev => ({
        ...prev,
        [editingDurationStepId]: Math.max(1, tempDuration)
      }));
      setEditingDurationStepId(null);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('คุณต้องการรีเซ็ตระยะเวลาและสถานะทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      const resetDurations: Record<number, number> = {};
      const resetStatuses: Record<number, 'pending' | 'in_progress' | 'completed'> = {};
      INITIAL_IS_STEPS.forEach(step => {
        resetDurations[step.id] = step.defaultDurationDays;
        resetStatuses[step.id] = step.id === 1 ? 'in_progress' : 'pending';
      });
      setCustomDurations(resetDurations);
      setStepStatuses(resetStatuses);
      setStepNotes({});
      setStartDate('2026-06-08');
    }
  };

  // Filtered steps
  const filteredSteps = useMemo(() => {
    return calculatedSteps.filter(step => {
      const matchPhase = selectedPhase === 'all' || step.phase === selectedPhase;
      const matchSearch = step.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.studentRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.advisorRole.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPhase && matchSearch;
    });
  }, [calculatedSteps, selectedPhase, searchQuery]);

  // Export as checklist file (.txt)
  const handleExportTxt = () => {
    let content = `========================================================\n`;
    content += `🗺️ แผนที่คลังการทำศึกษาค้นคว้าอิสระ (IS) - เฉพาะตัวคุณ\n`;
    content += `ชื่อนักศึกษา: ....................................................\n`;
    content += `เริ่มดำเนินการ: ${startDate} | สิ้นสุดเฉลี่ย: ${projectedEndDateStr} (${totalDurationDays} วัน)\n`;
    content += `บทบาทหลักที่ตั้งค่า: ${roleMode === 'student' ? 'นักศึกษา' : 'อาจารย์ที่ปรึกษา'}\n`;
    content += `ความก้าวหน้าโครงการวิจัย: ${progressPercent}%\n`;
    content += `========================================================\n\n`;

    calculatedSteps.forEach(step => {
      const statusText = stepStatuses[step.id] === 'completed' 
        ? '[✓] สำเร็จแล้ว' 
        : stepStatuses[step.id] === 'in_progress' 
        ? '[/] กำลังดำเนินการ' 
        : '[ ] ค้างคา/ยังไม่ทำ';

      content += `${step.id}. ${step.activity} (${statusText})\n`;
      content += `   - ช่วงเวลาดำเนินการ: ${step.startDateStr} ถึง ${step.endDateStr} (${step.duration} วัน)\n`;
      content += `   - หน้าที่ของท่าน: ${roleMode === 'student' ? step.studentRole : step.advisorRole}\n`;
      content += `   - ตรวจรับ/ผู้ประสานงาน: ${step.contactParty}\n`;
      if (stepNotes[step.id]) {
        content += `   - บันทึกส่วนตัว: ${stepNotes[step.id]}\n`;
      }
      content += `   - Checklist เป้าหมายย่อย:\n`;
      step.checkpoints.forEach(chk => {
        content += `     [ ] ${chk}\n`;
      });
      content += `\n--------------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IS-Blueprint-Path-Tracker-${startDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-2 sm:p-4 md:p-8" id="app-root-container">
      
      {/* Decorative Outer Framing Block */}
      <div className="max-w-7xl mx-auto bg-slate-50 flex flex-col font-sans overflow-hidden border-4 md:border-8 border-slate-200 space-y-0 shadow-lg">
        
        {/* APP HEADER - Geometric Balance Style */}
        <header className="min-h-20 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:px-8 md:py-4 border-b-4 border-indigo-500 text-left space-y-4 md:space-y-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 flex items-center justify-center font-bold text-xl text-white rounded-none shrink-0 font-mono shadow-sm">IS</div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                PROF. EDURESEARCH | BLUEPRINT v1.1
                <span className="bg-indigo-950/80 text-indigo-300 text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border border-indigo-800/80">
                  แผน ข
                </span>
              </h1>
              <p className="text-[10px] md:text-[11px] text-indigo-300 font-mono uppercase tracking-wider">
                Master of Educational Administration Roadmap & Progress Tracker (ลายแทงพิชิตมหาบัณฑิต)
              </p>
            </div>
          </div>
          <div className="text-left md:text-right flex flex-col sm:flex-row md:flex-col gap-4 sm:gap-6 md:gap-0 font-mono">
            <div>
              <span className="block text-[9px] uppercase font-bold text-indigo-400 tracking-wider">EXPECTED COMPLETION</span>
              <span className="font-bold tracking-wide text-sm text-indigo-100">{projectedEndDateStr}</span>
            </div>
            <div className="md:mt-1 pt-1 border-t border-slate-800/60 md:border-t-0 md:pt-0">
              <span className="block text-[9px] uppercase font-bold text-indigo-400 tracking-wider">TOTAL DURATION</span>
              <span className="font-bold tracking-wide text-xs text-indigo-100">{totalDurationDays} DAYS (~{Math.round(totalDurationDays / 30)} MONTHS)</span>
            </div>
          </div>
        </header>

        {/* Outer Padding Container */}
        <div className="p-4 md:p-6 space-y-6">

        {/* METRICS & QUICK CONTROL CARDS - Geometric Balance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200 rounded-none overflow-hidden text-left">
          
          {/* Progress Tracker Column */}
          <div className="p-6 flex flex-col justify-between col-span-1 md:col-span-2 min-h-[160px]">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Research Progress</span>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100">
                  {progressPercent}% Complete
                </span>
              </div>
              
              {/* Progress Bar with geometric clean lines */}
              <div className="w-full bg-slate-150 h-3 rounded-none overflow-hidden mb-3 border border-slate-200">
                <motion.div
                  className="bg-emerald-500 h-full rounded-none"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 mt-2">
                <div className="bg-slate-50 p-2 border border-slate-200 rounded-none">
                  <div className="font-bold text-slate-800 font-mono text-sm">
                    {Object.values(stepStatuses).filter(s => s === 'completed').length}
                  </div>
                  <div className="uppercase tracking-tight text-[8px] text-slate-400 font-bold">SUCCESS</div>
                </div>
                <div className="bg-amber-50/40 p-2 border border-amber-100 rounded-none">
                  <div className="font-bold text-amber-700 font-mono text-sm">
                    {Object.values(stepStatuses).filter(s => s === 'in_progress').length}
                  </div>
                  <div className="uppercase tracking-tight text-[8px] text-amber-600 font-bold">ACTIVE</div>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-200 rounded-none">
                  <div className="font-bold text-slate-400 font-mono text-sm">
                    {Object.values(stepStatuses).filter(s => s === 'pending').length}
                  </div>
                  <div className="uppercase tracking-tight text-[8px] text-slate-400 font-bold">PENDING</div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
              <span className="text-slate-400 italic">
                * แผนการทำวิจัยอย่างมีระบบระเบียบ
              </span>
              <button
                onClick={handleResetToDefault}
                className="text-rose-600 hover:text-rose-805 hover:underline font-bold uppercase tracking-wider"
              >
                Reset Progress
              </button>
            </div>
          </div>

          {/* Config Start Date Column */}
          <div className="p-6 flex flex-col justify-between bg-slate-50/50">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Registration Start</span>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">ระบุวันเริ่มต้นรายวิชา:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs border border-slate-300 px-3 py-2 rounded-none font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div className="text-[10px] text-indigo-800 leading-relaxed bg-indigo-50/30 border border-indigo-100 p-2 mt-3 font-mono">
              [CALCULATION] Sequential dates update dynamically below
            </div>
          </div>

          {/* Role selection & Controls */}
          <div className="p-6 flex flex-col justify-between bg-indigo-50/20">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-2">Perspective Focus</span>
              
              <div className="grid grid-cols-2 border border-slate-300 bg-white p-0.5 rounded-none">
                <button
                  id="role-student-btn"
                  onClick={() => setRoleMode('student')}
                  className={`py-1.5 text-center text-[10px] font-bold uppercase transition-all rounded-none ${
                    roleMode === 'student' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-555 hover:text-slate-800'
                  }`}
                >
                  Student
                </button>
                <button
                  id="role-advisor-btn"
                  onClick={() => setRoleMode('advisor')}
                  className={`py-1.5 text-center text-[10px] font-bold uppercase transition-all rounded-none ${
                    roleMode === 'advisor' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-555 hover:text-slate-800'
                  }`}
                >
                  Advisor
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 leading-normal mt-3">
              {roleMode === 'student' 
                ? '⭐ เน้นการสืบค้นข้อมูล การเขียนสถิติ Jamovi และการหลบซ้ำทางวิชาการ'
                : '⭐ เน้นบทบาทผู้ช่วยตรวจแก้ และตรวจสอบจริยธรรมระเบียบตามขั้นตอน'}
            </div>
          </div>

        </div>

        {/* PRIMARY CONTROLLING MENU / NAVIGATION TABS - Geometric Balance style */}
        <div className="flex border-b-2 border-slate-900 p-0.5 bg-slate-100 rounded-none">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-6 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            📋 ลายแทง 21 ขั้นตอนแบบพิมพ์เขียว
          </button>
          
          <button
            onClick={() => setActiveTab('helpers')}
            className={`py-3 px-6 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 ${
              activeTab === 'helpers'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            🛠️ เครื่องมือช่วยคลายกังวล (สถิติ/เขียน)
            <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase tracking-tight ml-1 animate-pulse">
              HOT
            </span>
          </button>
        </div>

        {/* CONDITIONAL SUB-PANELS */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <ISMilestonePath
              steps={calculatedSteps}
              stepStatuses={stepStatuses}
              onSelectNode={(stepId) => {
                // Ensure overall phase filter is cleared so that the step is rendered
                setSelectedPhase('all');
                // Expand the card
                setExpandedSteps(prev => ({ ...prev, [stepId]: true }));
                // Smoothly scroll to the target card
                setTimeout(() => {
                  const cardEl = document.getElementById(`step-card-${stepId}`);
                  if (cardEl) {
                    cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              activePhaseFilter={selectedPhase}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT FILTER & BULLET INDEX LIST (Span 4) - Geometric Frame */}
            <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-none p-6 shadow-none space-y-6 text-left">
              <div>
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-3 block">
                  🔍 Search & Filters (ค้นหา)
                </h3>
                
                {/* Search query */}
                <div className="relative mb-4">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์คีย์เวิร์ด หรือหน้าที่..."
                    className="pl-9 pr-4 py-2 w-full text-xs rounded-none border-2 border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
 
                {/* Phase Filters */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 block font-bold tracking-wider mb-2 font-mono uppercase">เฟสการวิจัย (PHASE FILTERS)</span>
                  <button
                    onClick={() => setSelectedPhase('all')}
                    className={`w-full text-left px-3 py-2 rounded-none text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-between border ${
                      selectedPhase === 'all' 
                        ? 'bg-slate-900 text-white border-slate-900 font-bold' 
                        : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🎯 ทั้งหมด 21 ขั้นตอน</span>
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5">
                      {calculatedSteps.length}
                    </span>
                  </button>
 
                  {PHASES.map(ph => {
                    const cnt = calculatedSteps.filter(s => s.phase === ph.id).length;
                    return (
                      <button
                        key={ph.id}
                        onClick={() => setSelectedPhase(ph.id)}
                        className={`w-full text-left px-3 py-2 rounded-none text-xs font-semibold transition-colors flex items-center justify-between border ${
                          selectedPhase === ph.id 
                            ? `${ph.color} text-white border-transparent font-bold` 
                            : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-55/70'
                        }`}
                      >
                        <span>{ph.label}</span>
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5">
                          {cnt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Utility Export Checklist */}
              <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-2.5">
                <span className="text-[10px] text-slate-400 block font-bold tracking-wider font-mono uppercase">ดาวน์โหลดข้อมูล / พิมพ์</span>
                
                <button
                  onClick={handleExportTxt}
                  className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-none transition flex items-center justify-center gap-1.5 border-b-4 border-indigo-900"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>เช็คลิสต์ไฟล์ข้อความ (.txt)</span>
                </button>
 
                <button
                  onClick={() => window.print()}
                  className="w-full border-2 border-slate-350 hover:bg-slate-100 text-slate-705 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-none transition flex items-center justify-center gap-1.5 bg-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>บันทึกส่งอาจารย์ (PDF)</span>
                </button>
              </div>
 
              {/* Mini Gantt Simulation Sidebar */}
              <div className="pt-4 border-t-2 border-dashed border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold tracking-wider mb-2 font-mono uppercase">📱 GANTT OVERVIEW (ลำดับวัน)</span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {calculatedSteps.map(step => {
                    const isCompleted = stepStatuses[step.id] === 'completed';
                    const isInProgress = stepStatuses[step.id] === 'in_progress';
                    
                    return (
                      <div key={step.id} className="flex items-center gap-2 text-[11px] border-b border-slate-100 pb-1">
                        <span className={`w-5 h-5 rounded-none text-[10px] font-bold font-mono flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500 text-white' : isInProgress ? 'bg-amber-400 text-white animate-pulse' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {step.id}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-700 truncate">{step.activity}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{step.startDateStr} ({step.duration} วัน)</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT MAIN STEPS LIST (Span 8) */}
            <div className="lg:col-span-8 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  แสดงผล <strong>{filteredSteps.length}</strong> จาก 21 ขั้นตอน
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      const allExp: Record<number, boolean> = {};
                      INITIAL_IS_STEPS.forEach(s => { allExp[s.id] = true; });
                      setExpandedSteps(allExp);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    ขยายข้อมูลทั้งหมด
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setExpandedSteps({})}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    ย่อข้อมูลทั้งหมด
                  </button>
                </div>
              </div>

              {/* Loop of Steps with beautiful visual details */}
              <div className="space-y-4">
                {filteredSteps.map((step, idx) => {
                  const isExpanded = !!expandedSteps[step.id];
                  const currentStatus = stepStatuses[step.id] || 'pending';
                  const phaseObj = PHASES.find(ph => ph.id === step.phase) || PHASES[0];

                  return (
                    <motion.div
                      layout
                      key={step.id}
                      id={`step-card-${step.id}`}
                      className={`bg-white border rounded-3xl transition-all shadow-sm ${
                        currentStatus === 'completed'
                          ? 'border-emerald-100 bg-emerald-50/10'
                          : currentStatus === 'in_progress'
                          ? 'border-indigo-100 ring-2 ring-indigo-50'
                          : 'border-slate-100'
                      }`}
                    >
                      {/* STEP HEADER COMPONENT */}
                      <div 
                        className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer"
                        onClick={() => handleToggleExpand(step.id)}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Circle step counter ID */}
                          <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                            currentStatus === 'completed'
                              ? 'bg-emerald-500 text-white'
                              : currentStatus === 'in_progress'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-150 text-slate-700 border border-slate-200'
                          }`}>
                            {step.id}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[10px]">
                              {/* Phase badge */}
                              <span className={`px-2 py-0.5 rounded-full font-bold ${phaseObj.textColor} ${phaseObj.bgLight}`}>
                                {phaseObj.label}
                              </span>
                              {/* Days badge */}
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                                📅 {step.startDateStr} ถึง {step.endDateStr} ({step.duration} วัน)
                              </span>
                            </div>
                            
                            <h2 className="font-sans font-bold text-base text-slate-900 tracking-tight flex items-center gap-1">
                              {step.activity}
                            </h2>
                          </div>
                        </div>

                        {/* Badges, control status dropdown and indicators */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0" onClick={e => e.stopPropagation()}>
                          {/* Edit estimate duration */}
                          <button
                            onClick={() => openDurationModal(step.id, step.duration)}
                            className="p-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-105 transition-colors text-xs font-medium font-sans flex items-center gap-1 text-slate-600"
                            title="แก้ไขระยะเวลาดำเนินการ"
                          >
                            <Sliders className="w-3 h-3 text-slate-400" />
                            <span>ปรับวัน</span>
                          </button>

                          {/* Status Dropdown */}
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(step.id, e.target.value as any)}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none ${
                              currentStatus === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 font-bold'
                                : currentStatus === 'in_progress'
                                ? 'bg-amber-50 text-amber-700 font-bold animate-pulse'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            <option value="pending">🟡 รอดำเนินการ</option>
                            <option value="in_progress">🔵 กำลังดำเนินการ</option>
                            <option value="completed">🟢 เสร็จสิ้น</option>
                          </select>

                          {/* Expand Icon */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleExpand(step.id); }}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* STEP EXPANDED BODY COMPONENT */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-slate-100"
                          >
                            <div className="p-6 space-y-6 text-sm bg-slate-50/50">
                              
                              {/* Description Box */}
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">คำอธิบายเเละวัตถุประสงค์</h4>
                                <p className="text-slate-650 leading-relaxed text-xs sm:text-sm font-light">
                                  {step.description}
                                </p>
                              </div>

                              {/* Highlight Role Box depending on selections */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border ${
                                  roleMode === 'student' 
                                    ? 'bg-indigo-50/40 border-indigo-100 text-indigo-900' 
                                    : 'bg-white border-slate-150 text-slate-500'
                                }`}>
                                  <h5 className="font-bold text-xs flex items-center gap-1.5 mb-1.5 text-indigo-900 leading-none">
                                    <span className="text-base">👩‍🎓</span> หน้าที่ของนักศึกษา
                                  </h5>
                                  <p className="text-[11.5px] leading-relaxed font-light font-sans">
                                    {step.studentRole}
                                  </p>
                                </div>

                                <div className={`p-4 rounded-2xl border ${
                                  roleMode === 'advisor' 
                                    ? 'bg-amber-50/40 border-amber-100 text-amber-900' 
                                    : 'bg-white border-slate-150 text-slate-505'
                                }`}>
                                  <h5 className="font-bold text-xs flex items-center gap-1.5 mb-1.5 text-amber-900 leading-none">
                                    <span className="text-base">👨‍🏫</span> หน้าที่อาจารย์ที่ปรึกษา
                                  </h5>
                                  <p className="text-[11.5px] leading-relaxed font-light font-sans">
                                    {step.advisorRole}
                                  </p>
                                </div>
                              </div>

                              {/* Contact & Location Metadata */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-150 flex flex-col justify-center">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ผู้รับผิดชอบหลัก / แฟลตฟอร์มติดต่อ</div>
                                  <div className="text-xs font-semibold text-slate-700 mt-1">📬 {step.contactParty}</div>
                                </div>
                                <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-150 flex flex-col justify-center">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">กรอบยึดระยะเวลาคำนวณ</div>
                                  <div className="text-xs font-semibold text-slate-750 mt-1">🕒 {step.duration} วันต่อเนื่อง (อิงค่าเริ่มต้น {step.defaultDurationDays} วัน)</div>
                                </div>
                              </div>

                              {/* Interactive checkable Checkpoints */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <span>📌</span> Checklist เป้าย่อยที่คุณต้องทลาย
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-4 rounded-2xl border border-slate-150">
                                  {step.checkpoints.map((chk, cIdx) => (
                                    <label key={cIdx} className="flex items-start gap-2 text-xs text-slate-600 select-none cursor-pointer p-0.5">
                                      <input 
                                        type="checkbox" 
                                        defaultChecked={currentStatus === 'completed'}
                                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 mt-0.5 shrink-0"
                                      />
                                      <span className="leading-tight">{chk}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Deep Guide and Tips Box */}
                              <div className="bg-amber-50/30 border border-amber-100 p-4 rounded-2xl space-y-3 font-sans">
                                <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 leading-none">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                  <span>คลังคำแนะนำเชิงลึก (Deep Blueprint Guide):</span>
                                </div>
                                <p className="text-slate-650 text-xs leading-relaxed font-light font-sans">
                                  {step.expandedGuide}
                                </p>
                                <div className="space-y-1.5 pt-2 border-t border-amber-100/50">
                                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">💡 ความลับที่พี่ผ่านมากบอกเล่า:</div>
                                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 leading-relaxed font-light">
                                    {step.tips.map((tip, tIdx) => (
                                      <li key={tIdx}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* User's interactive Personal Notes */}
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <Edit3 className="w-3 h-3" />
                                  บันทึกความก้าวหน้า / ความจำกันลืม (Auto-Saved)
                                </h4>
                                <textarea
                                  rows={1.5}
                                  value={stepNotes[step.id] || ''}
                                  onChange={(e) => handleNoteChange(step.id, e.target.value)}
                                  placeholder="บันทึกวันที่นัดอาจารย์ หรือปัญหาที่ต้องคุยคราวถัดไป..."
                                  className="w-full text-xs border border-slate-205 p-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {filteredSteps.length === 0 && (
                  <div className="bg-white border border-slate-100 p-12 text-center rounded-3xl text-slate-400 font-sans">
                    <HelpCircle className="w-12 h-12 text-slate-350 mx-auto mb-2" />
                    <p className="font-medium text-sm">ไม่พบค้นหาผลงานตามฟิลเตอร์หรือคีย์เวิร์ดนี้</p>
                    <p className="text-xs text-slate-400 mt-1">แนะนำให้ล้างคีย์ค้นหาเพื่อความสะดวก</p>
                    <button
                      onClick={() => { setSelectedPhase('all'); setSearchQuery(''); }}
                      className="mt-4 bg-slate-900 text-white text-xs px-4 py-2 rounded-xl"
                    >
                      แสดงทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        )}

        {activeTab === 'helpers' && (
          <AIPressureHelpers />
        )}

        {/* BOTTOM METADATA LICENSE */}
        <footer className="pt-10 pb-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-2">
          <p>
            พัฒนาอำนวยความสะดวกสำหรับนักศึกษา ศึกษาศาสตรมหาบัณฑิต สาขาวิชาการบริหารการศึกษา แผน ข
          </p>
          <p className="font-mono text-[10px]">
            © 2026 Prof. EduResearch - Blueprint Paths Builder. All rights reserved.
          </p>
        </footer>

      </div>

      {/* EDIT STEP DURATION MODAL (GANTT CHART CUSTOMIZER) */}
      <AnimatePresence>
        {editingDurationStepId !== null && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-150 p-6 max-w-sm w-full shadow-lg"
            >
              <h3 className="font-sans font-bold text-base text-slate-900 mb-2">
                ⚙️ ปรับแต่งระยะเวลา (Gantt Day Setter)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-light">
                ขั้นตอนที่ {editingDurationStepId}: {calculatedSteps.find(s => s.id === editingDurationStepId)?.activity}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ระยะเวลาที่ต้องการ (หน่วย: วัน)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={tempDuration}
                    onChange={(e) => setTempDuration(parseInt(e.target.value) || 1)}
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * ระบบจะจัดวางเป้าหมายของขั้นตอนถัดๆ ไปตามลำดับเหตุการณ์ให้สัมพันธ์กันทันที
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setEditingDurationStepId(null)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={saveDuration}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  บันทึกตั้งค่า
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}
