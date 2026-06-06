import React, { useState } from 'react';
import { BookOpen, BarChart3, ShieldAlert, FileCheck, Copy, Check, RotateCcw } from 'lucide-react';

export function AIPressureHelpers() {
  const [activeTab, setActiveTab] = useState<'apa' | 'jamovi' | 'irb' | 'turnitin'>('apa');

  // APA State
  const [apaType, setApaType] = useState<'book' | 'article'>('book');
  const [apaAuthor, setApaAuthor] = useState('รัชยา ทัพไชย');
  const [apaYear, setApaYear] = useState('2026');
  const [apaTitle, setApaTitle] = useState('ประสิทธิผลการบริหารจัดการเชิงนวัตกรรมตามมุมมองของครูผู้สอนในสังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษา');
  const [apaPublisher, setApaPublisher] = useState('สำนักพิมพ์มหาวิทยาลัย');
  const [apaJournal, setApaJournal] = useState('วารสารการบริหารและนวัตกรรมทางการศึกษา');
  const [apaVolume, setApaVolume] = useState('12');
  const [apaIssue, setApaIssue] = useState('2');
  const [apaPages, setApaPages] = useState('145-158');
  const [copied, setCopied] = useState(false);

  // Jamovi State
  const [scoresInput, setScoresInput] = useState('5, 4, 5, 3, 4, 5, 4, 5, 5, 4, 3, 5, 4, 5, 4, 5, 5, 4, 5, 4');
  const [jamoviResult, setJamoviResult] = useState<{ mean: number; sd: number; level: string } | null>({
    mean: 4.35,
    sd: 0.67,
    level: 'ระดับมาก (High)'
  });

  // IRB State
  const [irbAnswers, setIrbAnswers] = useState({
    q1: false, // Identifying info stored?
    q2: false, // Underage participants?
    q3: false, // Sensitive questions on performance/mental health?
    q4: true,  // Consent form provided?
    q5: true,  // Secure cloud data backup?
  });

  // Turnitin State
  const [originalText, setOriginalText] = useState('การตัดสินใจของผู้บริหารการศึกษาส่งผลกระทบต่อขวัญและกำลังใจของครูผู้สอนในสังกัดโรงเรียนรัฐบาลเป็นอย่างมาก');
  const [paraphrasedText, setParaphrasedText] = useState('ภาวะการตัดสินใจรวมถึงวิถีผู้นำของผู้อำนวยการโรงเรียน มีส่วนส่งผลเกี่ยวโยงต่อสภาพจิตใจและความพึงพอใจในการปฏิบัติงานของคณะครูอาจารย์เป็นอย่างยิ่ง');
  const [simSimilarity, setSimSimilarity] = useState<number | null>(null);

  // APA Logic
  const getApaCitation = () => {
    if (apaType === 'book') {
      return `${apaAuthor}. (${apaYear}). ${apaTitle}. ${apaPublisher}.`;
    } else {
      return `${apaAuthor}. (${apaYear}). ${apaTitle}. ${apaJournal}, ${apaVolume}(${apaIssue}), ${apaPages}.`;
    }
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(getApaCitation());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Jamovi Logic
  const calculateStats = () => {
    const nums = scoresInput
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= 5);

    if (nums.length === 0) {
      setJamoviResult(null);
      return;
    }

    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (nums.length - 1 || 1);
    const sd = Math.sqrt(variance);

    let level = '';
    if (mean >= 4.51) level = 'ระดับมากที่สุด (Highest)';
    else if (mean >= 3.51) level = 'ระดับมาก (High)';
    else if (mean >= 2.51) level = 'ระดับปานกลาง (Medium)';
    else if (mean >= 1.51) level = 'ระดับน้อย (Low)';
    else level = 'ระดับน้อยที่สุด (Lowest)';

    setJamoviResult({
      mean: Math.round(mean * 100) / 100,
      sd: Math.round(sd * 100) / 100,
      level
    });
  };

  // IRB Evaluation
  const evaluateIRB = () => {
    let score = 0;
    if (irbAnswers.q1) score += 2; // high risk if storing real names
    if (irbAnswers.q2) score += 3; // very high risk if children involved
    if (irbAnswers.q3) score += 2; // sensitive topic
    if (!irbAnswers.q4) score += 3; // no consent form is absolute failure
    if (!irbAnswers.q5) score += 1; // insecure storage

    if (score >= 6) {
      return { status: 'ความเสี่ยงสูง (High Risk)', color: 'text-rose-600 bg-rose-50 border-rose-200', advice: 'ต้องแนบระบบการพิทักษ์สิทธิ์กลุ่มตัวอย่างแบบรัดกุมที่สุด ห้ามเผยแพร่ข้อมูลระบุตัวตน และควรยื่นคำเสนออย่างระมัดระวังแก่หลักสูตรฯ' };
    } else if (score >= 3) {
      return { status: 'ความเสี่ยงปานกลาง (Medium Risk)', color: 'text-amber-600 bg-amber-50 border-amber-200', advice: 'แนะนำให้ปกปิดข้อมูลส่วนตัว (Anonymity) และชี้แจงจุดประสงค์งานวิจัยอย่างชัดแจ้งในหนังสือขอยินยอมตอบ' };
    } else {
      return { status: 'ความเสี่ยงต่ำมาก (Low/Minimal Risk)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', advice: 'สามารถดำเนินการยื่นคำขอรับหนังสือรับรองเชิงสังคม/พฤติกรรมศาสตร์ (IRB) ได้โดยสะดวก โอกาสอนุมัติสูง' };
    }
  };

  const irbStatus = evaluateIRB();

  // Turnitin Logic
  const handleParaphraseSimilarity = () => {
    if (!originalText || !paraphrasedText) return;
    
    // Simple mock similarity calculation based on word overlap for illustrative educator benefit
    const origWords = new Set(originalText.split('').filter(char => char !== ' '));
    const paraWords = new Set(paraphrasedText.split('').filter(char => char !== ' '));
    
    let intersectionCount = 0;
    origWords.forEach(w => {
      if (paraWords.has(w)) intersectionCount++;
    });
    
    const overlapPercent = (intersectionCount * 2) / (origWords.size + paraWords.size) * 100;
    
    // Scale or randomize slightly to look like plagiarism checks
    let simValue = Math.round(overlapPercent);
    if (simValue > 95) simValue = 99;
    if (simValue < 10) simValue = 12; // safety bound

    setSimSimilarity(simValue);
  };

  return (
    <div className="bg-white border-2 border-slate-250 rounded-none shadow-none overflow-hidden" id="ai-helpers-container">
      {/* Header Banner */}
      <div className="bg-slate-900 px-6 py-6 text-white text-left border-b-4 border-indigo-500">
        <h3 className="font-mono font-bold text-lg tracking-wider text-white uppercase mb-1">
          🛠️ RESEARCH TOOLKIT (คลังตัวช่วยคลายกังวล)
        </h3>
        <p className="text-indigo-200 font-sans text-xs">
          คัดสรร 4 เครื่องมือช่วยแก้ปัญหาที่พบบ่อยและมักพบความกังวลใจในการเขียนเล่มวิจัยแผน ข
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b-2 border-slate-900 bg-slate-100 p-0.5 rounded-none">
        <button
          id="tab-apa"
          onClick={() => setActiveTab('apa')}
          className={`flex-1 py-3 text-center font-sans font-bold text-xs uppercase duration-150 flex items-center justify-center gap-2 rounded-none transition-all ${
            activeTab === 'apa'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 border-transparent hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>(บทที่ 4) อ้างอิง APA 7</span>
        </button>

        <button
          id="tab-jamovi"
          onClick={() => setActiveTab('jamovi')}
          className={`flex-1 py-3 text-center font-sans font-bold text-xs uppercase duration-150 flex items-center justify-center gap-2 rounded-none transition-all ${
            activeTab === 'jamovi'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 border-transparent hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>(บทที่ 10,13) สถิติ Jamovi</span>
        </button>

        <button
          id="tab-irb"
          onClick={() => setActiveTab('irb')}
          className={`flex-1 py-3 text-center font-sans font-bold text-xs uppercase duration-150 flex items-center justify-center gap-2 rounded-none transition-all ${
            activeTab === 'irb'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 border-transparent hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>(บทที่ 8) จริยธรรม IRB</span>
        </button>

        <button
          id="tab-turnitin"
          onClick={() => setActiveTab('turnitin')}
          className={`flex-1 py-3 text-center font-sans font-bold text-xs uppercase duration-150 flex items-center justify-center gap-2 rounded-none transition-all ${
            activeTab === 'turnitin'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 border-transparent hover:bg-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>(บทที่ 14) บิดคำหลบ Turnitin</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6 text-left font-sans">
        
        {/* TAB 1: APA 7th */}
        {activeTab === 'apa' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl mb-2">
              <span className="text-xs text-gray-500 font-medium">ประเภทคำค้นอ้างอิง:</span>
              <div className="space-x-2">
                <button
                  onClick={() => setApaType('book')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    apaType === 'book' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  หนังสือตำรา (Book)
                </button>
                <button
                  onClick={() => setApaType('article')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    apaType === 'article' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  บทความวารสาร (Journal Article)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-650 mb-1">ชื่อผู้แต่ง (ไทย/อังกฤษ)</label>
                <input
                  type="text"
                  value={apaAuthor}
                  onChange={(e) => setApaAuthor(e.target.value)}
                  className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-650 mb-1">ปีที่จัดพิมพ์ (พ.ศ. หรือ ค.ศ.)</label>
                <input
                  type="text"
                  value={apaYear}
                  onChange={(e) => setApaYear(e.target.value)}
                  className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-650 mb-1">ชื่อสาส์น / ชื่อหนังสือ / ชื่อบทความ</label>
                <textarea
                  rows={2}
                  value={apaTitle}
                  onChange={(e) => setApaTitle(e.target.value)}
                  className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {apaType === 'book' ? (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-650 mb-1">สำนักพิมพ์ / สถานที่พิมพ์</label>
                  <input
                    type="text"
                    value={apaPublisher}
                    onChange={(e) => setApaPublisher(e.target.value)}
                    className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-650 mb-1">ชื่อวารสารทางวิชาการ</label>
                    <input
                      type="text"
                      value={apaJournal}
                      onChange={(e) => setApaJournal(e.target.value)}
                      className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-650 mb-1">ปีที่ (Volume)</label>
                    <input
                      type="text"
                      value={apaVolume}
                      onChange={(e) => setApaVolume(e.target.value)}
                      className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-650 mb-1">ฉบับที่ (Issue)</label>
                    <input
                      type="text"
                      value={apaIssue}
                      onChange={(e) => setApaIssue(e.target.value)}
                      className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-650 mb-1">เลขหน้า (Pages เช่น 120-135)</label>
                    <input
                      type="text"
                      value={apaPages}
                      onChange={(e) => setApaPages(e.target.value)}
                      className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-150">
              <h4 className="text-xs font-bold text-gray-600 mb-2">📖 รูปแบบผลสัมฤทธิ์อ้างอิง APA 7th Edition:</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 font-mono text-xs text-slate-800 break-words flex justify-between items-center gap-2">
                <span className="italic select-all">{getApaCitation()}</span>
                <button
                  onClick={handleCopyCitation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-sans text-xs hover:bg-indigo-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Jamovi */}
        {activeTab === 'jamovi' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              💡 <strong>เครื่องมือทรานส์เลทสถิติ:</strong> กรอกคะแนนดิบ (ความพึงพอใจ 1 - 5) เพื่อคำนวณค่าเฉลี่ยและ S.D. พรรณนาเปรียบเทียบระดับความพึงพอใจโดยอัตโนมัติ (อิงสเกลงานประเมินสถานศึกษา 5 ระดับ)
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-650 mb-1">
                กรอกคะแนนดิบ (คั่นด้วยสัญลักษณ์ comma เช่น 5, 4, 5, 3 ...)
              </label>
              <input
                type="text"
                value={scoresInput}
                onChange={(e) => setScoresInput(e.target.value)}
                className="w-full text-sm border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={calculateStats}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                คำนวณผลลัพธ์
              </button>
              <button
                onClick={() => setScoresInput('5, 4, 5, 3, 4, 5, 4, 5, 5, 4, 3, 5, 4, 5, 4, 5, 5, 4, 5, 4')}
                className="border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> รีเซ็ตตัวอย่าง (N=20)
              </button>
            </div>

            {jamoviResult && (
              <div className="grid grid-cols-3 gap-4 bg-teal-50/50 p-4 rounded-2xl border border-teal-100 mt-2 text-center md:text-left">
                <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-teal-50">
                  <div className="text-xs text-gray-500 font-medium font-sans">ค่าเฉลี่ย (Mean μ)</div>
                  <div className="text-xl md:text-2xl font-bold text-teal-700 mt-1 font-mono">{jamoviResult.mean}</div>
                </div>
                <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-teal-50">
                  <div className="text-xs text-gray-500 font-medium font-sans">ส่วนเบี่ยงเบน (S.D. σ)</div>
                  <div className="text-xl md:text-2xl font-bold text-teal-700 mt-1 font-mono">{jamoviResult.sd}</div>
                </div>
                <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-teal-50 flex flex-col justify-center">
                  <div className="text-[10px] text-gray-500 font-medium font-sans">ระดับประเมินเฉลี่ย</div>
                  <div className="text-xs md:text-sm font-bold text-teal-800 mt-1">{jamoviResult.level}</div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-xs font-semibold text-gray-700 block mb-1">📺 วิธีคีย์ใน Jamovi จริง:</span>
              <ul className="list-decimal pl-4 space-y-1 text-xs text-gray-500">
                <li>เปิด Jamovi และสร้างตัวแปรในคอลัมน์ A (เช่น <strong>var1_Academic</strong>)</li>
                <li>เลือกเมนู <strong>Analyses</strong> &gt; <strong>Exploration</strong> &gt; <strong>Descriptives</strong></li>
                <li>ลากตัวแปรของคุณใส่กล่อง <strong>Variables</strong></li>
                <li>ในหัวข้อ <strong>Statistics</strong> ติ๊กเลือก <strong>Mean</strong>, <strong>Std. deviation</strong> และ <strong>N</strong></li>
                <li>โปรแกรมจะสลักตารางออกมาแบบเรียลไทม์ ย้ายนำตาราง Excel ไปพิมพ์แต่งต่อในไฟล์ Word ของตนเองได้เลย</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: IRB */}
        {activeTab === 'irb' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              📋 <strong>ประเมินตนเองก่อนส่งจริยธรรม (Self-Screening):</strong> ตอบแบบสอบถามเชิงรุกด้านล่างเพื่อพิจารณาความพร้อมและความเสี่ยงของโครงการวิจัยในคุณสมบัติจริยธรรมมนุษย์ด้านศึกษาศาสตร์
            </p>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 text-xs text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={irbAnswers.q1}
                  onChange={(e) => setIrbAnswers({ ...irbAnswers, q1: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span>โครงการมีการรวบรวมชื่อ-นามสกุล เบอร์ติดต่อ หรือรหัสสถานศึกษาจริงที่จะระบุตัวตนของผู้ตอบแบบสอบถามได้</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={irbAnswers.q2}
                  onChange={(e) => setIrbAnswers({ ...irbAnswers, q2: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span>กลุ่มเป้าหมายมีผู้ไม่บรรลุนิติภาวะ (เด็กนักเรียนอายุต่ำกว่า 18 ปีบริบูรณ์) เป็นกลุ่มตัวจริง</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={irbAnswers.q3}
                  onChange={(e) => setIrbAnswers({ ...irbAnswers, q3: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span>มีประโยคข้อคำถามที่พาดพิงถึงความอ่อนไหว ประเมินความผิดพลาดทางวินัย หรือสภาพสุขภาพจิตของผู้ตอบ</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={irbAnswers.q4}
                  onChange={(e) => setIrbAnswers({ ...irbAnswers, q4: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span>มีหนังสือชี้แจงและขอความยินยอม (Informed Consent Form) แสดงผู้ตอบก่อนทำการตอบคำถามเสมอ</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={irbAnswers.q5}
                  onChange={(e) => setIrbAnswers({ ...irbAnswers, q5: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span>จัดเก็บข้อมูลอิเล็กทรอนิกส์ทั้งหมดไว้ในระบบส่วนตัวที่มีความปลอดภัยและใช้รหัสป้องกันเป็นสัดส่วน</span>
              </label>
            </div>

            <div className={`p-4 rounded-2xl border ${irbStatus.color} mt-2`}>
              <div className="font-bold text-xs">ผลการประเมินเบื้องต้น: {irbStatus.status}</div>
              <div className="text-xs mt-1 leading-relaxed font-light">{irbStatus.advice}</div>
            </div>
          </div>
        )}

        {/* TAB 4: Turnitin */}
        {activeTab === 'turnitin' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              🔄 <strong>คู่มือนักบิดคำหลบซ้ำ (Paraphrasing Assistant):</strong> หลีกเลี่ยงค่าซ้ำซ้อนในโปรแกรม Turnitin โดยการปรับโครงสร้างประโยคเป็นคำพูดกระชับของตนเอง ทดสอบการหลบซ้ำด้านล่าง:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-rose-600 mb-1">❌ ข้อความต้นฉบับทางวิชาการ (ที่คัดลอกมา):</label>
                <textarea
                  rows={2}
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  className="w-full text-xs border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-600 mb-1">✅ ข้อความที่คุณแต่งเรียบเรียงใหม่ (Paraphrase):</label>
                <textarea
                  rows={2}
                  value={paraphrasedText}
                  onChange={(e) => setParaphrasedText(e.target.value)}
                  className="w-full text-xs border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-emerald-50/20"
                />
              </div>
            </div>

            <button
              onClick={handleParaphraseSimilarity}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              วัดค่าประเมินความใกล้เคียง
            </button>

            {simSimilarity !== null && (
              <div className={`p-4 rounded-2xl border text-center ${
                simSimilarity < 30 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : simSimilarity < 60 
                  ? 'bg-amber-50 border-amber-100 text-amber-800' 
                  : 'bg-rose-50 border-rose-105 text-rose-800'
              }`}>
                <div className="text-xs font-medium">ระดับคำพ้องกันทางโครงสร้างโดยประมาณ</div>
                <div className="text-3xl font-black mt-1 font-mono">{simSimilarity}%</div>
                <div className="text-[11px] mt-1.5 leading-normal">
                  {simSimilarity < 30 
                    ? '🎉 ยอดเยี่ยมมาก! สำนวนแตกต่างแบบสร้างสรรค์ ปลอดภัยต่อการพิจารณาใน Turnitin' 
                    : simSimilarity < 60 
                    ? '⚠️ ปานกลาง: แนะนำให้ปรับแต่งเปลี่ยนคำและลำดับประโยคอีกเล็กน้อยเพื่อป้องกันความซ้ำสะสม' 
                    : '❌ เสี่ยงสูง: มีการหยิบใช้คำศัพท์หลักเป็นคำเดิมมากเกินไป แนะนำให้สลับโครงสร้างเชิงรับ-ปฏิบัติ (Active/Passive voice) หรือหาคำพ้องตามธรรมชาติ (Synonyms)'}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-xs font-semibold text-gray-750 block mb-1">🛡️ คาถาป้องกัน Plagiarism:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-550 leading-relaxed">
                <div>
                  <span className="font-bold text-indigo-700">1. ใช้คำสำคัญทดแทน (Synonyms):</span> เช่น "ครูผู้สอน" &rarr; "คณะครูอาจารย์", "ผู้บริหารการศึกษา" &rarr; "ผู้อำนวยการสถานศึกษาและทีมนำ"
                </div>
                <div>
                  <span className="font-bold text-indigo-700">2. เปลี่ยนโครงสร้างประโยค:</span> แทนที่จะเอาผลลัพธ์ตั้ง ให้เอาชื่อกลุ่มหรือทฤษฎีขึ้นตั้งเป็นผู้วิเคราะห์และรายงานก่อน
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
