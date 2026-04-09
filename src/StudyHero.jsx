import React, { useState, useEffect, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const DEFAULT_SUBJECTS = [
  { name: "국어", icon: "📖", color: "#FF6B6B" },
  { name: "수학", icon: "🔢", color: "#4ECDC4" },
  { name: "영어", icon: "🔤", color: "#45B7D1" },
  { name: "과학", icon: "🔬", color: "#96CEB4" },
  { name: "사회", icon: "🌍", color: "#FFEAA7" },
  { name: "음악", icon: "🎵", color: "#DDA0DD" },
  { name: "미술", icon: "🎨", color: "#FFB347" },
  { name: "체육", icon: "⚽", color: "#87CEEB" },
];
const ICON_OPTIONS = ["📘","📗","📕","📙","✏️","🧪","💻","🧮","🎹","🗺️","📐","🏃","🧠","🌟","💡","🔎"];
const COLOR_OPTIONS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#DDA0DD","#FFB347","#E87461","#A29BFE","#FD79A8","#00B894","#6C5CE7","#FDCB6E","#E17055","#74B9FF","#55E6C1","#F8A5C2"];
const REWARD_ICONS = ["🎁","🍦","🎮","📱","🎬","🏖️","🧸","🎠","🍕","🎪","🛍️","⭐","🏅","🎯","🎨","🎵"];
const DAYS = ["일","월","화","수","목","금","토"];
const MOODS = ["😊","🤩","😐","😓","😴"];
const BADGES = [
  { name: "첫 걸음", icon: "🌱", req: 1, desc: "첫 공부 완료!" },
  { name: "꾸준히", icon: "🔥", req: 7, desc: "7일 연속 학습" },
  { name: "열공왕", icon: "👑", req: 30, desc: "30일 연속 학습" },
  { name: "시간왕", icon: "⏰", req: 600, desc: "총 10시간 공부", type: "time" },
  { name: "만능박사", icon: "🎓", req: 5, desc: "5과목 이상 학습", type: "subjects" },
  { name: "일기왕", icon: "📝", req: 10, desc: "일기 10개 작성", type: "diary" },
];

const getToday = () => new Date().toISOString().slice(0, 10);
const getDayIdx = (ds) => new Date(ds + "T00:00:00").getDay();
const getYesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
const SK = "study-hero-v4";

const defaultData = {
  customSubjects: [], weeklySchedule: [], missions: [], records: [], diaries: [],
  streak: 0, lastStudyDate: "", totalStars: 0, lastGeneratedDate: "",
  parentPassword: "", parentRewards: [], claimedRewards: [],
};

// ============================================================
// localStorage 유틸 (window.storage 대신 사용)
// ============================================================
const storage = {
  get: (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

// ============================================================
// 공통 컴포넌트
// ============================================================
function Modal({ open, onClose, children, width }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: 22, width: "100%", maxWidth: width || 380, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", maxHeight: "85vh", overflowY: "auto" }}>{children}</div>
    </div>
  );
}

function PasswordPrompt({ open, onClose, onSuccess, correctPw }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  if (!open) return null;
  const check = () => { if (pw === correctPw) { onSuccess(); setPw(""); setErr(false); } else { setErr(true); } };
  return (
    <Modal open={open} onClose={() => { onClose(); setPw(""); setErr(false); }} width={320}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#333", marginBottom: 4 }}>부모님 잠금</div>
        <div style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>비밀번호를 입력해 주세요</div>
        <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && check()}
          placeholder="비밀번호" style={{ width: "100%", padding: "12px 14px", border: err ? "2px solid #FF6B6B" : "2px solid #eee", borderRadius: 14, fontSize: 18, textAlign: "center", boxSizing: "border-box", outline: "none", letterSpacing: 8 }} />
        {err && <div style={{ color: "#FF6B6B", fontSize: 13, marginTop: 6 }}>비밀번호가 틀렸어요 😅</div>}
        <button onClick={check} style={{ marginTop: 14, padding: "11px 0", width: "100%", background: "linear-gradient(135deg,#FF6B6B,#ee5a5a)", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>확인</button>
      </div>
    </Modal>
  );
}

function SubjectCreator({ open, onClose, onSave }) {
  const [name, setName] = useState(""); const [icon, setIcon] = useState(ICON_OPTIONS[0]); const [color, setColor] = useState(COLOR_OPTIONS[0]);
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#333", marginBottom: 14 }}>✨ 새 과목 만들기</div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="과목 이름 입력" maxLength={10} style={{ width: "100%", padding: "10px 14px", border: "2px solid #eee", borderRadius: 12, fontSize: 16, boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 }}>아이콘 선택</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {ICON_OPTIONS.map(ic => <button key={ic} onClick={() => setIcon(ic)} style={{ width: 38, height: 38, borderRadius: 10, border: icon === ic ? "2px solid #FF6B6B" : "2px solid #eee", background: icon === ic ? "#FFF0F0" : "#fafafa", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic}</button>)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 }}>색상 선택</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {COLOR_OPTIONS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: 10, border: color === c ? "3px solid #333" : "3px solid transparent", background: c, cursor: "pointer" }} />)}
      </div>
      {name && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: color + "18", borderRadius: 14, marginBottom: 14, border: `2px solid ${color}44` }}><span style={{ fontSize: 24 }}>{icon}</span><span style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>{name}</span><span style={{ fontSize: 12, color: "#999", marginLeft: "auto" }}>미리보기</span></div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#f0f0f0", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}>취소</button>
        <button onClick={() => { if (name.trim()) { onSave({ name: name.trim(), icon, color }); setName(""); setIcon(ICON_OPTIONS[0]); setColor(COLOR_OPTIONS[0]); } }} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#FF6B6B,#ee5a5a)", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>만들기 🎉</button>
      </div>
    </Modal>
  );
}

function SubjectPicker({ subjects, selected, onSelect, onAddNew }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
      {subjects.map(s => <button key={s.name} onClick={() => onSelect(s.name)} style={{ padding: "6px 11px", border: selected === s.name ? `2px solid ${s.color}` : "2px solid #eee", borderRadius: 12, background: selected === s.name ? s.color + "22" : "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>{s.icon} {s.name}</button>)}
      <button onClick={onAddNew} style={{ padding: "6px 12px", border: "2px dashed #ccc", borderRadius: 12, background: "#fafafa", fontSize: 13, cursor: "pointer", fontWeight: 700, color: "#999" }}>+ 새 과목</button>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================
export default function StudyHero() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSubject, setTimerSubject] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [planSubject, setPlanSubject] = useState("");
  const [planMinutes, setPlanMinutes] = useState(30);
  const [planLabel, setPlanLabel] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [diaryMood, setDiaryMood] = useState(0);
  const [celebMsg, setCelebMsg] = useState("");
  const [wsSubject, setWsSubject] = useState("");
  const [wsLabel, setWsLabel] = useState("");
  const [wsMinutes, setWsMinutes] = useState(30);
  const [wsDays, setWsDays] = useState([]);
  const [editingWs, setEditingWs] = useState(null);
  const [showSubjCreator, setShowSubjCreator] = useState(false);
  const [parentMode, setParentMode] = useState(false);
  const [showPwPrompt, setShowPwPrompt] = useState(false);
  const [showPwSetup, setShowPwSetup] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [rwName, setRwName] = useState("");
  const [rwIcon, setRwIcon] = useState("🎁");
  const [rwType, setRwType] = useState("stars");
  const [rwReq, setRwReq] = useState(10);
  const [rwDesc, setRwDesc] = useState("");
  const [editingRw, setEditingRw] = useState(null);
  const timerRef = useRef(null);

  const allSubjects = [...DEFAULT_SUBJECTS, ...(data.customSubjects || [])];
  const subjOf = (name) => allSubjects.find(s => s.name === name) || { icon: "📘", color: "#aaa" };

  // =================== localStorage로 변경된 부분 ===================
  useEffect(() => {
    const saved = storage.get(SK);
    if (saved) setData(prev => ({ ...prev, ...saved }));
    setLoading(false);
  }, []);

  const save = useCallback((d) => {
    setData(d);
    storage.set(SK, d);
  }, []);
  // ================================================================

  useEffect(() => {
    if (loading) return;
    const t = getToday();
    if (data.lastGeneratedDate === t) return;
    const dayIdx = getDayIdx(t), yd = getYesterday();
    const scheduled = data.weeklySchedule.filter(ws => ws.days.includes(dayIdx)).map(ws => ({ id: `ws-${ws.id}-${t}`, subject: ws.subject, label: ws.label, minutes: ws.minutes, completed: false, date: t, source: "schedule", wsId: ws.id }));
    const carried = data.missions.filter(m => m.date === yd && !m.completed).map(m => ({ ...m, id: `carry-${m.id}-${t}`, date: t, carried: true, originalDate: m.originalDate || m.date }));
    const todayExist = data.missions.filter(m => m.date === t);
    const exWs = todayExist.filter(m => m.wsId).map(m => m.wsId);
    const cleaned = data.missions.filter(m => !(m.date === yd && !m.completed));
    const merged = [...cleaned, ...todayExist, ...scheduled.filter(m => !exWs.includes(m.wsId)), ...carried];
    const seen = new Set(); const deduped = merged.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
    save({ ...data, missions: deduped, lastGeneratedDate: t });
  }, [loading, data.lastGeneratedDate, data.weeklySchedule, save, data]);

  useEffect(() => { if (timerActive) timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000); else clearInterval(timerRef.current); return () => clearInterval(timerRef.current); }, [timerActive]);

  const showCeleb = (msg) => { setCelebMsg(msg); setTimeout(() => setCelebMsg(""), 2500); };
  const updStreak = (d) => { const t = getToday(); let s = d.streak, ld = d.lastStudyDate; if (ld !== t) { s = ld === getYesterday() ? s + 1 : 1; ld = t; } return { streak: s, lastStudyDate: ld }; };

  const addCustomSubject = (subj) => { if (allSubjects.some(s => s.name === subj.name)) { showCeleb("⚠️ 이미 있는 과목이에요!"); return; } save({ ...data, customSubjects: [...(data.customSubjects || []), subj] }); setShowSubjCreator(false); showCeleb(`${subj.icon} ${subj.name} 추가!`); };
  const deleteCustomSubject = (name) => { if (!window.confirm(`"${name}" 삭제?`)) return; save({ ...data, customSubjects: (data.customSubjects || []).filter(s => s.name !== name) }); };

  const addMission = () => { if (!planSubject) return; save({ ...data, missions: [...data.missions, { id: `man-${Date.now()}`, subject: planSubject, label: planLabel || planSubject, minutes: planMinutes, completed: false, date: getToday(), source: "manual" }] }); setPlanSubject(""); setPlanLabel(""); };
  const completeMission = (id) => { const missions = data.missions.map(m => m.id === id ? { ...m, completed: true } : m); const { streak, lastStudyDate } = updStreak(data); showCeleb("⭐ 미션 완료! +1 스타!"); save({ ...data, missions, totalStars: data.totalStars + 1, streak, lastStudyDate }); };
  const deleteMission = (id) => save({ ...data, missions: data.missions.filter(m => m.id !== id) });

  const startTimer = (subj) => { setTimerSubject(subj); setTimerSeconds(0); setTimerActive(true); };
  const stopTimer = () => { setTimerActive(false); if (timerSeconds > 0 && timerSubject) { const earned = Math.max(1, Math.floor(timerSeconds / 60)); const { streak, lastStudyDate } = updStreak(data); showCeleb(`🎉 ${Math.floor(timerSeconds / 60)}분 완료! +${earned} 스타!`); save({ ...data, records: [...data.records, { id: Date.now(), subject: timerSubject, seconds: timerSeconds, date: getToday() }], totalStars: data.totalStars + earned, streak, lastStudyDate }); } setTimerSubject(null); setTimerSeconds(0); };

  const addWs = () => { if (!wsSubject || wsDays.length === 0) return; save({ ...data, weeklySchedule: [...data.weeklySchedule, { id: Date.now(), subject: wsSubject, label: wsLabel || wsSubject, minutes: wsMinutes, days: wsDays }], lastGeneratedDate: "" }); setWsSubject(""); setWsLabel(""); setWsMinutes(30); setWsDays([]); };
  const updateWs = () => { if (!wsSubject || wsDays.length === 0 || !editingWs) return; save({ ...data, weeklySchedule: data.weeklySchedule.map(ws => ws.id === editingWs ? { ...ws, subject: wsSubject, label: wsLabel || wsSubject, minutes: wsMinutes, days: wsDays } : ws), lastGeneratedDate: "" }); setWsSubject(""); setWsLabel(""); setWsMinutes(30); setWsDays([]); setEditingWs(null); };
  const deleteWs = (id) => save({ ...data, weeklySchedule: data.weeklySchedule.filter(ws => ws.id !== id), lastGeneratedDate: "" });
  const startEditWs = (ws) => { setEditingWs(ws.id); setWsSubject(ws.subject); setWsLabel(ws.label); setWsMinutes(ws.minutes); setWsDays(ws.days); };
  const cancelEditWs = () => { setEditingWs(null); setWsSubject(""); setWsLabel(""); setWsMinutes(30); setWsDays([]); };
  const toggleDay = (d) => setWsDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const handleParentEntry = () => { if (!data.parentPassword) setShowPwSetup(true); else setShowPwPrompt(true); };
  const setupPassword = () => { if (newPw.length < 4) { showCeleb("⚠️ 4자리 이상!"); return; } if (newPw !== newPwConfirm) { showCeleb("⚠️ 불일치!"); return; } save({ ...data, parentPassword: newPw }); setShowPwSetup(false); setParentMode(true); setNewPw(""); setNewPwConfirm(""); showCeleb("🔒 비밀번호 설정 완료!"); };
  const addReward = () => { if (!rwName.trim()) return; save({ ...data, parentRewards: [...(data.parentRewards || []), { id: Date.now(), name: rwName, icon: rwIcon, type: rwType, requirement: rwReq, desc: rwDesc }] }); setRwName(""); setRwDesc(""); setRwReq(10); setEditingRw(null); };
  const updateReward = () => { if (!rwName.trim() || !editingRw) return; save({ ...data, parentRewards: (data.parentRewards || []).map(r => r.id === editingRw ? { ...r, name: rwName, icon: rwIcon, type: rwType, requirement: rwReq, desc: rwDesc } : r) }); setRwName(""); setRwDesc(""); setRwReq(10); setEditingRw(null); };
  const deleteReward = (id) => save({ ...data, parentRewards: (data.parentRewards || []).filter(r => r.id !== id) });
  const startEditRw = (r) => { setEditingRw(r.id); setRwName(r.name); setRwIcon(r.icon); setRwType(r.type); setRwReq(r.requirement); setRwDesc(r.desc || ""); };
  const claimReward = (id) => { save({ ...data, claimedRewards: [...(data.claimedRewards || []), { rewardId: id, date: getToday(), id: Date.now() }] }); showCeleb("🎉 보상 요청!"); };
  const approveReward = (claimId) => { save({ ...data, claimedRewards: (data.claimedRewards || []).map(c => c.id === claimId ? { ...c, approved: true } : c) }); showCeleb("✅ 승인!"); };
  const rejectReward = (claimId) => { save({ ...data, claimedRewards: (data.claimedRewards || []).filter(c => c.id !== claimId) }); };

  const addDiary = () => { if (!diaryText.trim()) return; save({ ...data, diaries: [...data.diaries, { id: Date.now(), text: diaryText, mood: MOODS[diaryMood], date: getToday() }] }); setDiaryText(""); showCeleb("📝 저장!"); };
  const resetAll = () => { if (window.confirm("정말 초기화?")) save(defaultData); };
  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const t = getToday();
  const todayMissions = data.missions.filter(m => m.date === t);
  const todayRecords = data.records.filter(r => r.date === t);
  const totalMinutes = Math.floor(data.records.reduce((a, r) => a + r.seconds, 0) / 60);
  const uniqueSubjects = [...new Set(data.records.map(r => r.subject))];
  const level = Math.floor(data.totalStars / 50) + 1;
  const starsToNext = 50 - (data.totalStars % 50);
  const rewards = data.parentRewards || [];
  const claimed = data.claimedRewards || [];

  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const ds = d.toISOString().slice(0, 10); return { date: `${d.getMonth() + 1}/${d.getDate()}`, 분: Math.floor(data.records.filter(r => r.date === ds).reduce((a, r) => a + r.seconds, 0) / 60) }; });
  const subjectData = allSubjects.map(s => ({ name: s.icon + s.name, 분: Math.floor(data.records.filter(r => r.subject === s.name).reduce((a, r) => a + r.seconds, 0) / 60), color: s.color })).filter(s => s.분 > 0);
  const earnedBadges = BADGES.filter(b => { if (b.type === "time") return totalMinutes >= b.req; if (b.type === "subjects") return uniqueSubjects.length >= b.req; if (b.type === "diary") return data.diaries.length >= b.req; return data.streak >= b.req; });

  const tabs = [{ label: "📋 미션", id: 0 }, { label: "⏱️ 타이머", id: 1 }, { label: "📅 시간표", id: 2 }, { label: "📊 기록", id: 3 }, { label: "🏆 보상", id: 4 }, { label: "📝 일기", id: 5 }];

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: 28, background: "linear-gradient(135deg,#FFF5E4,#FFE3E3)" }}>📚 로딩 중...</div>;

  const canClaim = (rw) => { const already = claimed.some(c => c.rewardId === rw.id && !c.approved); if (already) return false; return rw.type === "stars" ? data.totalStars >= rw.requirement : data.streak >= rw.requirement; };
  const progressOf = (rw) => { const cur = rw.type === "stars" ? data.totalStars : data.streak; return Math.min(100, Math.round((cur / rw.requirement) * 100)); };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#FFF5E4 0%,#FFE8F0 50%,#E8F0FF 100%)", fontFamily: "'Noto Sans KR',sans-serif", maxWidth: 500, margin: "0 auto", position: "relative" }}>
      <SubjectCreator open={showSubjCreator} onClose={() => setShowSubjCreator(false)} onSave={addCustomSubject} />
      <PasswordPrompt open={showPwPrompt} onClose={() => setShowPwPrompt(false)} correctPw={data.parentPassword} onSuccess={() => { setShowPwPrompt(false); setParentMode(true); }} />

      <Modal open={showPwSetup} onClose={() => setShowPwSetup(false)} width={340}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#333", marginBottom: 4 }}>부모님 비밀번호 설정</div>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>보상 관리를 위한 비밀번호를 설정해 주세요</div>
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="비밀번호 (4자리 이상)" style={{ width: "100%", padding: "12px 14px", border: "2px solid #eee", borderRadius: 14, fontSize: 16, textAlign: "center", boxSizing: "border-box", outline: "none", letterSpacing: 6, marginBottom: 8 }} />
          <input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} placeholder="비밀번호 확인" onKeyDown={e => e.key === "Enter" && setupPassword()} style={{ width: "100%", padding: "12px 14px", border: "2px solid #eee", borderRadius: 14, fontSize: 16, textAlign: "center", boxSizing: "border-box", outline: "none", letterSpacing: 6, marginBottom: 14 }} />
          <button onClick={setupPassword} style={{ padding: "11px 0", width: "100%", background: "linear-gradient(135deg,#4ECDC4,#45B7D1)", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>설정 완료</button>
        </div>
      </Modal>

      {celebMsg && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#FFD93D,#FF6B6B)", color: "#fff", padding: "14px 28px", borderRadius: 20, fontSize: 18, fontWeight: 700, zIndex: 999, boxShadow: "0 6px 24px rgba(255,107,107,0.4)", animation: "bounce 0.5s ease" }}>{celebMsg}</div>}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#FF6B6B,#FFD93D)", padding: "24px 20px 16px", borderRadius: "0 0 28px 28px", boxShadow: "0 4px 20px rgba(255,107,107,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>📚 공부 히어로</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>Lv.{level} · ⭐ {data.totalStars} · 🔥 {data.streak}일 연속</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.3)", borderRadius: 16, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>🦸</div>
            <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Lv.{level}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, background: "rgba(255,255,255,0.3)", borderRadius: 10, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${((50 - starsToNext) / 50) * 100}%`, height: "100%", background: "#fff", borderRadius: 10, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 4, textAlign: "right" }}>다음 레벨까지 ⭐{starsToNext}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, padding: "12px 8px 0", overflowX: "auto" }}>
        {tabs.map(tb => <button key={tb.id} onClick={() => { setTab(tb.id); if (tb.id !== 4) setParentMode(false); }} style={{ flex: "1 0 auto", padding: "10px 8px", border: "none", borderRadius: "14px 14px 0 0", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: tab === tb.id ? "#fff" : "rgba(255,255,255,0.5)", color: tab === tb.id ? "#FF6B6B" : "#999", boxShadow: tab === tb.id ? "0 -2px 10px rgba(0,0,0,0.05)" : "none" }}>{tb.label}</button>)}
      </div>

      <div style={{ background: "#fff", borderRadius: "0 0 20px 20px", margin: "0 8px", padding: 18, minHeight: 420, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>

        {/* TAB 0: 미션 */}
        {tab === 0 && (<div>
          <h3 style={{ fontSize: 20, margin: "0 0 4px", color: "#333" }}>📋 오늘의 미션</h3>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14 }}>{t} ({DAYS[getDayIdx(t)]}요일)</div>
          {todayMissions.length === 0 && <div style={{ textAlign: "center", color: "#bbb", padding: 30, fontSize: 15 }}>오늘 미션이 없어요!<br/>시간표를 설정하거나 미션을 추가해 보세요 💪</div>}
          {todayMissions.map(m => { const s = subjOf(m.subject); return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", background: m.completed ? "#f0fff0" : m.carried ? "#FFF8E8" : "#fafafa", borderRadius: 16, marginBottom: 7, border: m.completed ? "2px solid #96CEB4" : m.carried ? "2px solid #FFD93D" : "2px solid #eee" }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15, color: m.completed ? "#96CEB4" : "#333" }}>{m.label || m.subject}{m.carried && <span style={{ fontSize: 11, color: "#e67e22", marginLeft: 6, fontWeight: 600 }}>🔄 미완료</span>}</div><div style={{ fontSize: 12, color: "#999" }}>{m.subject} · {m.minutes}분</div></div>
              {m.completed ? <span style={{ fontSize: 24 }}>✅</span> : <div style={{ display: "flex", gap: 5 }}><button onClick={() => completeMission(m.id)} style={{ padding: "5px 12px", background: "#96CEB4", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>완료!</button>{m.source === "manual" && <button onClick={() => deleteMission(m.id)} style={{ padding: "5px 8px", background: "#FFE0E0", color: "#FF6B6B", border: "none", borderRadius: 10, fontSize: 12, cursor: "pointer" }}>✕</button>}</div>}
            </div>); })}
          {todayMissions.length > 0 && <div style={{ textAlign: "center", marginTop: 12, padding: 10, background: "#FFF5E4", borderRadius: 14, fontSize: 14, color: "#e67e22" }}>달성률: <b>{Math.round(todayMissions.filter(m => m.completed).length / todayMissions.length * 100)}%</b></div>}
          <div style={{ marginTop: 18, padding: 14, background: "#f9f9f9", borderRadius: 16, border: "1px dashed #ddd" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#666", marginBottom: 10 }}>➕ 미션 추가하기</div>
            <SubjectPicker subjects={allSubjects} selected={planSubject} onSelect={setPlanSubject} onAddNew={() => setShowSubjCreator(true)} />
            <input value={planLabel} onChange={e => setPlanLabel(e.target.value)} placeholder="미션 이름 (예: 수학 3단원 복습)" style={{ width: "100%", padding: "8px 12px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, marginBottom: 8, boxSizing: "border-box", outline: "none" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, background: "#fff", borderRadius: 10, padding: "6px 10px", border: "2px solid #eee" }}><span style={{ fontSize: 13 }}>⏰</span><input type="number" value={planMinutes} onChange={e => setPlanMinutes(Math.max(5, +e.target.value))} style={{ width: 45, border: "none", background: "transparent", fontSize: 15, fontWeight: 700, textAlign: "center", outline: "none" }} /><span style={{ fontSize: 13, color: "#888" }}>분</span></div>
              <button onClick={addMission} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#FF6B6B,#ee5a5a)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>추가 ✏️</button>
            </div>
          </div>
          {(data.customSubjects || []).length > 0 && <div style={{ marginTop: 14 }}><div style={{ fontSize: 12, color: "#bbb", marginBottom: 6 }}>내가 만든 과목</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{data.customSubjects.map(s => <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: s.color + "18", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#555" }}>{s.icon} {s.name}<button onClick={() => deleteCustomSubject(s.name)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#ccc", padding: 0, marginLeft: 2 }}>✕</button></span>)}</div></div>}
        </div>)}

        {/* TAB 1: 타이머 */}
        {tab === 1 && (<div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: 20, margin: "0 0 16px", color: "#333" }}>⏱️ 공부 타이머</h3>
          {!timerSubject ? (<div><p style={{ color: "#888", marginBottom: 14, fontSize: 14 }}>공부할 과목을 선택하세요!</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{allSubjects.map(s => <button key={s.name} onClick={() => startTimer(s.name)} style={{ padding: "18px 8px", border: "none", borderRadius: 18, background: `linear-gradient(135deg, ${s.color}33, ${s.color}11)`, fontSize: 15, cursor: "pointer", fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}><span style={{ fontSize: 34 }}>{s.icon}</span><span style={{ color: "#555" }}>{s.name}</span></button>)}</div></div>) : (<div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#555" }}>{subjOf(timerSubject).icon} {timerSubject}</div>
            <div style={{ position: "relative", width: 190, height: 190, margin: "16px auto" }}><svg width="190" height="190" viewBox="0 0 190 190"><circle cx="95" cy="95" r="82" fill="none" stroke="#eee" strokeWidth="12" /><circle cx="95" cy="95" r="82" fill="none" stroke={subjOf(timerSubject).color} strokeWidth="12" strokeLinecap="round" strokeDasharray={515} strokeDashoffset={515 - (515 * Math.min(timerSeconds / (planMinutes * 60), 1))} transform="rotate(-90 95 95)" style={{ transition: "stroke-dashoffset 1s linear" }} /></svg><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}><div style={{ fontSize: 38, fontWeight: 800, color: "#333" }}>{fmtTime(timerSeconds)}</div><div style={{ fontSize: 12, color: "#999" }}>목표 {planMinutes}분</div></div></div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}><button onClick={() => setTimerActive(!timerActive)} style={{ padding: "11px 28px", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", background: timerActive ? "#FFD93D" : "#4ECDC4", color: "#fff" }}>{timerActive ? "⏸ 일시정지" : "▶ 시작"}</button><button onClick={stopTimer} style={{ padding: "11px 28px", background: "#FF6B6B", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>⏹ 종료</button></div>
            {timerSeconds >= planMinutes * 60 && <div style={{ marginTop: 14, padding: 10, background: "#FFF5E4", borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#e67e22" }}>🎉 목표 시간 달성!</div>}
          </div>)}
          {todayRecords.length > 0 && <div style={{ marginTop: 18, textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 }}>오늘 공부 기록</div>{todayRecords.map(r => <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 11px", background: "#f8f8f8", borderRadius: 10, marginBottom: 4, fontSize: 13 }}><span>{subjOf(r.subject).icon} {r.subject}</span><span style={{ fontWeight: 700, color: "#4ECDC4" }}>{Math.floor(r.seconds / 60)}분 {r.seconds % 60}초</span></div>)}</div>}
        </div>)}

        {/* TAB 2: 시간표 */}
        {tab === 2 && (<div>
          <h3 style={{ fontSize: 20, margin: "0 0 4px", color: "#333" }}>📅 요일별 시간표</h3>
          <p style={{ fontSize: 13, color: "#999", marginTop: 0, marginBottom: 16 }}>요일별 반복 공부를 설정하면 매일 자동으로 미션이 생성돼요!</p>
          <div style={{ padding: 14, background: "#f9f9f9", borderRadius: 16, border: "1px dashed #ddd", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#666", marginBottom: 10 }}>{editingWs ? "✏️ 수정" : "➕ 새 시간표"}</div>
            <SubjectPicker subjects={allSubjects} selected={wsSubject} onSelect={setWsSubject} onAddNew={() => setShowSubjCreator(true)} />
            <input value={wsLabel} onChange={e => setWsLabel(e.target.value)} placeholder="미션 이름 (예: 영어 단어 암기)" style={{ width: "100%", padding: "8px 12px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, marginBottom: 8, boxSizing: "border-box", outline: "none" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 }}>반복 요일</div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>{DAYS.map((d, i) => <button key={i} onClick={() => toggleDay(i)} style={{ width: 38, height: 38, borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", background: wsDays.includes(i) ? (i === 0 ? "#FF6B6B" : i === 6 ? "#45B7D1" : "#4ECDC4") : "#eee", color: wsDays.includes(i) ? "#fff" : "#999" }}>{d}</button>)}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, background: "#fff", borderRadius: 10, padding: "6px 10px", border: "2px solid #eee" }}><span style={{ fontSize: 13 }}>⏰</span><input type="number" value={wsMinutes} onChange={e => setWsMinutes(Math.max(5, +e.target.value))} style={{ width: 45, border: "none", background: "transparent", fontSize: 15, fontWeight: 700, textAlign: "center", outline: "none" }} /><span style={{ fontSize: 13, color: "#888" }}>분</span></div>
              {editingWs ? <div style={{ display: "flex", gap: 6 }}><button onClick={updateWs} style={{ padding: "9px 16px", background: "#4ECDC4", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>수정 ✓</button><button onClick={cancelEditWs} style={{ padding: "9px 12px", background: "#eee", color: "#888", border: "none", borderRadius: 12, fontSize: 13, cursor: "pointer" }}>취소</button></div> : <button onClick={addWs} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#FF6B6B,#ee5a5a)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>추가</button>}
            </div>
          </div>
          {data.weeklySchedule.length === 0 && <div style={{ textAlign: "center", color: "#bbb", padding: 20, fontSize: 14 }}>시간표를 등록해 보세요 📅</div>}
          {data.weeklySchedule.map(ws => { const s = subjOf(ws.subject); return (
            <div key={ws.id} style={{ padding: "12px 14px", background: "#fafafa", borderRadius: 16, marginBottom: 8, border: `2px solid ${s.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 26 }}>{s.icon}</span><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15, color: "#333" }}>{ws.label}</div><div style={{ fontSize: 12, color: "#999" }}>{ws.subject} · {ws.minutes}분</div></div><div style={{ display: "flex", gap: 5 }}><button onClick={() => startEditWs(ws)} style={{ padding: "4px 10px", background: "#E8F0FF", color: "#45B7D1", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>수정</button><button onClick={() => deleteWs(ws.id)} style={{ padding: "4px 10px", background: "#FFE0E0", color: "#FF6B6B", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>삭제</button></div></div>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>{DAYS.map((d, i) => <span key={i} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: ws.days.includes(i) ? s.color : "#eee", color: ws.days.includes(i) ? "#fff" : "#ccc" }}>{d}</span>)}</div>
            </div>); })}
          {data.weeklySchedule.length > 0 && <div style={{ marginTop: 16, padding: 14, background: "#F8F9FF", borderRadius: 16 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10 }}>📊 요일별 미션 수</div><div style={{ display: "flex", justifyContent: "space-between" }}>{DAYS.map((d, i) => { const cnt = data.weeklySchedule.filter(ws => ws.days.includes(i)).length; return <div key={i} style={{ textAlign: "center" }}><div style={{ fontSize: 12, color: i === 0 ? "#FF6B6B" : i === 6 ? "#45B7D1" : "#888", fontWeight: 700 }}>{d}</div><div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4, fontSize: 16, fontWeight: 800, background: cnt > 0 ? "#4ECDC422" : "#f5f5f5", color: cnt > 0 ? "#4ECDC4" : "#ddd" }}>{cnt}</div></div>; })}</div></div>}
        </div>)}

        {/* TAB 3: 기록 */}
        {tab === 3 && (<div>
          <h3 style={{ fontSize: 20, margin: "0 0 16px", color: "#333" }}>📊 공부 기록</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>{[{ label: "총 공부", value: `${totalMinutes}분`, icon: "⏰", bg: "#FFE8E8" }, { label: "과목 수", value: uniqueSubjects.length, icon: "📚", bg: "#E8FFE8" }, { label: "연속일", value: `${data.streak}일`, icon: "🔥", bg: "#FFF5E4" }].map((c, i) => <div key={i} style={{ background: c.bg, borderRadius: 16, padding: "12px 6px", textAlign: "center" }}><div style={{ fontSize: 22 }}>{c.icon}</div><div style={{ fontSize: 18, fontWeight: 800, color: "#333" }}>{c.value}</div><div style={{ fontSize: 11, color: "#888" }}>{c.label}</div></div>)}</div>
          {data.records.length > 0 ? (<><div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 6 }}>📈 최근 7일</div><div style={{ height: 170, marginBottom: 22 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={last7}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} unit="분" /><Tooltip formatter={v => `${v}분`} /><Bar dataKey="분" fill="#FF6B6B" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>{subjectData.length > 0 && <><div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 6 }}>📚 과목별 누적</div><div style={{ height: 190 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={subjectData} dataKey="분" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} ${value}분`}>{subjectData.map((s, i) => <Cell key={i} fill={s.color} />)}</Pie><Tooltip formatter={v => `${v}분`} /></PieChart></ResponsiveContainer></div></>}</>) : <div style={{ textAlign: "center", color: "#bbb", padding: 30, fontSize: 15 }}>아직 기록이 없어요 📖</div>}
        </div>)}

        {/* TAB 4: 보상 */}
        {tab === 4 && (<div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 20, margin: 0, color: "#333" }}>🏆 보상</h3>
            {parentMode ? <button onClick={() => setParentMode(false)} style={{ padding: "6px 14px", background: "#f0f0f0", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#888", cursor: "pointer" }}>🔓 잠그기</button> : <button onClick={handleParentEntry} style={{ padding: "6px 14px", background: "linear-gradient(135deg,#A29BFE,#6C5CE7)", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>🔒 부모님 설정</button>}
          </div>
          <div style={{ textAlign: "center", padding: 16, background: "linear-gradient(135deg,#FFF5E4,#FFE8F0)", borderRadius: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 48 }}>🦸</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#FF6B6B" }}>레벨 {level}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#FFD93D" }}>⭐ {data.totalStars}</div><div style={{ fontSize: 11, color: "#999" }}>모은 별</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#FF6B6B" }}>🔥 {data.streak}</div><div style={{ fontSize: 11, color: "#999" }}>연속 일</div></div>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 8 }}>🎖️ 뱃지</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {BADGES.map((b, i) => { const earned = earnedBadges.includes(b); return (
              <div key={i} style={{ padding: "8px 12px", borderRadius: 14, textAlign: "center", background: earned ? "#FFF5E4" : "#f5f5f5", border: earned ? "2px solid #FFD93D" : "2px solid #eee", opacity: earned ? 1 : 0.4, flex: "0 0 calc(33.33% - 6px)" }}>
                <div style={{ fontSize: 22 }}>{earned ? b.icon : "🔒"}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: earned ? "#333" : "#aaa" }}>{b.name}</div>
              </div>); })}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 8 }}>🎁 부모님이 준비한 보상</div>
          {rewards.length === 0 && <div style={{ textAlign: "center", color: "#bbb", padding: 20, fontSize: 14, background: "#fafafa", borderRadius: 16 }}>{parentMode ? "보상을 추가해 보세요!" : "아직 보상이 없어요 🥺"}</div>}
          {rewards.map(rw => { const prog = progressOf(rw); const achieved = canClaim(rw); const pending = claimed.find(c => c.rewardId === rw.id && !c.approved); const approved = claimed.find(c => c.rewardId === rw.id && c.approved); return (
            <div key={rw.id} style={{ padding: "14px", background: approved ? "#F0FFF0" : achieved ? "#FFFFF0" : "#fafafa", borderRadius: 18, marginBottom: 10, border: approved ? "2px solid #96CEB4" : achieved ? "2px solid #FFD93D" : "2px solid #eee" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 32 }}>{rw.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15, color: "#333" }}>{rw.name}</div><div style={{ fontSize: 12, color: "#999" }}>{rw.type === "stars" ? `⭐ ${rw.requirement}개` : `🔥 ${rw.requirement}일`}{rw.desc && ` · ${rw.desc}`}</div></div>
                {parentMode && <div style={{ display: "flex", gap: 4 }}><button onClick={() => startEditRw(rw)} style={{ padding: "4px 8px", background: "#E8F0FF", color: "#45B7D1", border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>수정</button><button onClick={() => deleteReward(rw.id)} style={{ padding: "4px 8px", background: "#FFE0E0", color: "#FF6B6B", border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>삭제</button></div>}
              </div>
              <div style={{ marginTop: 8, background: "#eee", borderRadius: 8, height: 8, overflow: "hidden" }}><div style={{ width: `${prog}%`, height: "100%", background: prog >= 100 ? "#96CEB4" : "linear-gradient(90deg,#FFD93D,#FF6B6B)", borderRadius: 8, transition: "width 0.5s" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "#999" }}>{prog}%</span>
                {approved ? <span style={{ fontSize: 12, fontWeight: 700, color: "#96CEB4" }}>✅ 완료!</span> : pending ? (parentMode ? <div style={{ display: "flex", gap: 4 }}><button onClick={() => approveReward(pending.id)} style={{ padding: "4px 12px", background: "#96CEB4", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>승인 ✓</button><button onClick={() => rejectReward(pending.id)} style={{ padding: "4px 10px", background: "#FFE0E0", color: "#FF6B6B", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>반려</button></div> : <span style={{ fontSize: 12, fontWeight: 700, color: "#e67e22" }}>⏳ 대기 중</span>) : achieved && !parentMode ? <button onClick={() => claimReward(rw.id)} style={{ padding: "5px 14px", background: "linear-gradient(135deg,#FFD93D,#FF6B6B)", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🎁 받기!</button> : null}
              </div>
            </div>); })}
          {parentMode && (
            <div style={{ marginTop: 16, padding: 14, background: "#F3F0FF", borderRadius: 16, border: "2px solid #A29BFE44" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#6C5CE7", marginBottom: 10 }}>{editingRw ? "✏️ 수정" : "➕ 새 보상"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>{REWARD_ICONS.map(ic => <button key={ic} onClick={() => setRwIcon(ic)} style={{ width: 36, height: 36, borderRadius: 10, border: rwIcon === ic ? "2px solid #6C5CE7" : "2px solid #eee", background: rwIcon === ic ? "#EDE8FF" : "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic}</button>)}</div>
              <input value={rwName} onChange={e => setRwName(e.target.value)} placeholder="보상 이름" style={{ width: "100%", padding: "8px 12px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, marginBottom: 8, boxSizing: "border-box", outline: "none" }} />
              <input value={rwDesc} onChange={e => setRwDesc(e.target.value)} placeholder="설명 (선택)" style={{ width: "100%", padding: "8px 12px", border: "2px solid #eee", borderRadius: 10, fontSize: 13, marginBottom: 10, boxSizing: "border-box", outline: "none" }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={() => setRwType("stars")} style={{ flex: 1, padding: "8px", border: rwType === "stars" ? "2px solid #FFD93D" : "2px solid #eee", borderRadius: 10, background: rwType === "stars" ? "#FFFFF0" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⭐ 별 개수</button>
                <button onClick={() => setRwType("streak")} style={{ flex: 1, padding: "8px", border: rwType === "streak" ? "2px solid #FF6B6B" : "2px solid #eee", borderRadius: 10, background: rwType === "streak" ? "#FFF5F5" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🔥 연속 일수</button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, background: "#fff", borderRadius: 10, padding: "6px 10px", border: "2px solid #eee" }}><span style={{ fontSize: 13 }}>{rwType === "stars" ? "⭐" : "🔥"}</span><input type="number" value={rwReq} onChange={e => setRwReq(Math.max(1, +e.target.value))} style={{ width: 50, border: "none", background: "transparent", fontSize: 15, fontWeight: 700, textAlign: "center", outline: "none" }} /><span style={{ fontSize: 13, color: "#888" }}>{rwType === "stars" ? "개" : "일"}</span></div>
                {editingRw ? <div style={{ display: "flex", gap: 6 }}><button onClick={updateReward} style={{ padding: "9px 14px", background: "#6C5CE7", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>수정 ✓</button><button onClick={() => { setEditingRw(null); setRwName(""); setRwDesc(""); }} style={{ padding: "9px 12px", background: "#eee", color: "#888", border: "none", borderRadius: 12, fontSize: 13, cursor: "pointer" }}>취소</button></div> : <button onClick={addReward} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#A29BFE,#6C5CE7)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>추가</button>}
              </div>
              <button onClick={() => setShowPwSetup(true)} style={{ marginTop: 12, padding: "8px 0", width: "100%", background: "transparent", border: "1px solid #A29BFE", borderRadius: 10, fontSize: 12, color: "#6C5CE7", cursor: "pointer" }}>🔐 비밀번호 변경</button>
            </div>
          )}
        </div>)}

        {/* TAB 5: 일기 */}
        {tab === 5 && (<div>
          <h3 style={{ fontSize: 20, margin: "0 0 16px", color: "#333" }}>📝 학습 일기</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 }}>오늘 기분은?</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>{MOODS.map((m, i) => <button key={i} onClick={() => setDiaryMood(i)} style={{ fontSize: 28, background: diaryMood === i ? "#FFF5E4" : "transparent", border: diaryMood === i ? "2px solid #FFD93D" : "2px solid transparent", borderRadius: 12, padding: "5px 9px", cursor: "pointer" }}>{m}</button>)}</div>
            <textarea value={diaryText} onChange={e => setDiaryText(e.target.value)} placeholder="오늘 배운 것을 적어보세요! 🌟" style={{ width: "100%", minHeight: 70, border: "2px solid #eee", borderRadius: 14, padding: 12, fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <button onClick={addDiary} style={{ marginTop: 8, padding: "9px 20px", background: "linear-gradient(135deg,#4ECDC4,#45B7D1)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>저장하기 ✨</button>
          </div>
          {data.diaries.length > 0 && <div><div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 }}>지난 일기</div>{[...data.diaries].reverse().slice(0, 20).map(d => <div key={d.id} style={{ padding: "10px 12px", background: "#fafafa", borderRadius: 14, marginBottom: 6, border: "1px solid #eee" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 20 }}>{d.mood}</span><span style={{ fontSize: 11, color: "#bbb" }}>{d.date}</span></div><div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{d.text}</div></div>)}</div>}
        </div>)}
      </div>

      <div style={{ textAlign: "center", padding: "14px 10px 22px" }}>
        <button onClick={resetAll} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #ddd", borderRadius: 10, fontSize: 11, color: "#bbb", cursor: "pointer" }}>🔄 데이터 초기화</button>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.1)}} button:hover{transform:scale(1.03)} button:active{transform:scale(0.97)}`}</style>
    </div>
  );
}

