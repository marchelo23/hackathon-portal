import { useState, useEffect } from 'react';
import { PortalProvider, useChannel } from '@portalsdk/react';
import { Portal } from '@portalsdk/core';
import { ShieldAlert, Activity, Skull, Terminal, AlertTriangle, MessageSquareWarning, Power, Database, DollarSign, Users, Check, X, MousePointer2 } from 'lucide-react';

let PORTAL_API_KEY = import.meta.env.VITE_PORTAL_API_KEY || 'pk_dummy_key';
PORTAL_API_KEY = PORTAL_API_KEY.replace(/["']/g, '');
const portal = new Portal({ apiKey: PORTAL_API_KEY });

// -- TYPES --
interface TerminalData {
  host_user: string;
  executed_command: string;
  console_output: string;
}

interface StrixxEvent {
  attack_phase: string;
  exfiltration_progress: number;
  attacker_terminal: TerminalData;
  server_status: string;
  emergency_funds?: number;
  impact_metrics: {
    stolen_records: number;
    compromised_systems: number;
  };
}

interface AdvisoryMessage {
  id: string;
  timestamp: string;
  message: string;
  sender: string;
}

interface ActiveVote {
  action: string;
  approvals: number;
  timer: number;
  hasVoted: boolean;
}

interface CursorData {
  id: string;
  x: number;
  y: number;
  name: string;
  role: string;
}

type Role = 'Negotiator' | 'IT Architect' | 'CFO' | 'God Mode' | null;

// -- UTILS --
const Typewriter = ({ text, delay = 15 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    let i = 0;
    setCurrentText('');
    const interval = setInterval(() => {
      setCurrentText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, delay);
    return () => clearInterval(interval);
  }, [text, delay]);

  return <span>{currentText}</span>;
};

// -- COMPONENTS --

function LoginLobby({ onJoin }: { onJoin: (name: string, role: Role) => void }) {
  const [name, setName] = useState('');
  
  return (
    <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center p-4 font-['Inter',sans-serif] text-slate-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000ff08_1px,transparent_1px),linear-gradient(to_bottom,#0000ff08_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <div className="relative z-10 bg-black/60 backdrop-blur-xl border border-blue-900/40 p-8 rounded-3xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <ShieldAlert className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-['Orbitron',sans-serif]">
            Crisis Room Lobby
          </h1>
          <p className="text-sm text-slate-400 mt-2">Identification required to enter the war room.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agent Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
              placeholder="E.g. Agent Smith"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Role</label>
            <div className="flex flex-col gap-3">
              <button 
                disabled={!name}
                onClick={() => onJoin(name, 'Negotiator')}
                className="bg-slate-800 hover:bg-blue-900/50 border border-slate-700 hover:border-blue-500 p-3 rounded-lg text-left transition-all disabled:opacity-50"
              >
                <span className="font-bold text-blue-400">Negotiator</span>
                <p className="text-xs text-slate-400">Communication with Hostile Intelligence and Advisors.</p>
              </button>
              <button 
                disabled={!name}
                onClick={() => onJoin(name, 'IT Architect')}
                className="bg-slate-800 hover:bg-orange-900/50 border border-slate-700 hover:border-orange-500 p-3 rounded-lg text-left transition-all disabled:opacity-50"
              >
                <span className="font-bold text-orange-400">IT Architect</span>
                <p className="text-xs text-slate-400">Infrastructure control and network countermeasures.</p>
              </button>
              <button 
                disabled={!name}
                onClick={() => onJoin(name, 'CFO')}
                className="bg-slate-800 hover:bg-emerald-900/50 border border-slate-700 hover:border-emerald-500 p-3 rounded-lg text-left transition-all disabled:opacity-50"
              >
                <span className="font-bold text-emerald-400">CFO (Finance)</span>
                <p className="text-xs text-slate-400">Management of funds and Bitcoin ransom payments.</p>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={() => onJoin(name || 'Solo Player', 'God Mode')}
              className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-500/50 p-3 rounded-lg text-center transition-all"
            >
              <span className="font-bold text-red-400 tracking-wider uppercase text-sm">God Mode (Solo Player)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ userName, userRole }: { userName: string, userRole: Role }) {
  const { messages: telemetryMessages } = useChannel<{ content: StrixxEvent }>({ channelId: 'hospital-telemetry' });
  const { messages: advisoryMessages } = useChannel<{ content: AdvisoryMessage }>({ channelId: 'internal-advisory' });
  
  // Actions & Votes Channel
  const { messages: actionMessages, send: sendAction } = useChannel<any>({ channelId: 'crisis-room-actions' });
  
  // Cursors Channel
  const { messages: cursorMessages, send: sendCursor } = useChannel<any>({ channelId: 'crisis-room-cursors' });

  const [events, setEvents] = useState<StrixxEvent[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryMessage[]>([]);
  const [isRequestingSOS, setIsRequestingSOS] = useState(false);
  const [activeVote, setActiveVote] = useState<ActiveVote | null>(null);
  const [otherCursors, setOtherCursors] = useState<Record<string, CursorData>>({});
  
  const isGodMode = userRole === 'God Mode';
  const canInteractIT = isGodMode || userRole === 'IT Architect';
  const canInteractFin = isGodMode || userRole === 'CFO';
  const canInteractNeg = isGodMode || userRole === 'Negotiator';

  // Mouse tracking for cursors
  // Mouse tracking for cursors (Throttled to avoid 429 Too Many Requests)
  useEffect(() => {
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < 250) return; // Throttle to 4 FPS to be safe with Portal's rate limit
      lastTime = now;
      
      sendCursor({
        content: {
          id: userName,
          name: userName,
          role: userRole,
          x: e.clientX,
          y: e.clientY
        }
      }).catch(() => { /* ignore rate limit errors silently */ });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [userName, userRole, sendCursor]);

  useEffect(() => {
    if (cursorMessages.length > 0) {
      const latestMsg = cursorMessages[cursorMessages.length - 1];
      const payload = latestMsg.content as any;
      const data = payload.content || payload;
      
      if (data && data.id && data.id !== userName) {
        setOtherCursors(prev => ({
          ...prev,
          [data.id]: data
        }));
      }
    }
  }, [cursorMessages, userName]);

  // Telemetry Sync
  useEffect(() => {
    if (telemetryMessages.length > 0) {
      const latestMsg = telemetryMessages[telemetryMessages.length - 1];
      const payload = latestMsg.content as any;
      const data = payload.content || payload;
      if (data && data.attack_phase) {
        setEvents(prev => [data, ...prev].slice(0, 10));
      }
    }
  }, [telemetryMessages]);

  useEffect(() => {
    if (advisoryMessages.length > 0) {
      const latestMsg = advisoryMessages[advisoryMessages.length - 1];
      const payload = latestMsg.content as any;
      const data = payload.content || payload;
      if (data && data.message) {
        setAdvisories(prev => {
          if (prev.find(a => a.id === data.id)) return prev;
          return [data, ...prev].slice(0, 5);
        });
        setIsRequestingSOS(false);
      }
    }
  }, [advisoryMessages]);

  // Vote Sync
  useEffect(() => {
    if (actionMessages.length > 0) {
      const latestMsg = actionMessages[actionMessages.length - 1];
      const payload = latestMsg.content as any;
      const data = payload.content || payload;
      
      if (data.type === 'vote_started') {
        setActiveVote({ action: data.action, approvals: 1, timer: 10, hasVoted: data.sender === userName });
      } else if (data.type === 'vote_cast' && activeVote && data.action === activeVote.action) {
        setActiveVote(prev => prev ? { ...prev, approvals: prev.approvals + 1 } : null);
      } else if (data.type === 'vote_result') {
        setActiveVote(null);
      }
    }
  }, [actionMessages]);

  // Local Vote Timer
  useEffect(() => {
    let interval: any;
    if (activeVote && activeVote.timer > 0) {
      interval = setInterval(() => {
        setActiveVote(prev => prev ? { ...prev, timer: prev.timer - 1 } : null);
      }, 1000);
    } else if (activeVote && activeVote.timer <= 0) {
      setActiveVote(null);
    }
    return () => clearInterval(interval);
  }, [activeVote]);

  const latestEvent = events[0] || null;

  const handleSOSRequest = () => {
    if (isRequestingSOS || !latestEvent || !canInteractNeg) return;
    setIsRequestingSOS(true);
    
    portal.channel('sos-requests').send({
      content: {
        timestamp: new Date().toISOString(),
        current_state: {
          phase: latestEvent.attack_phase,
          progress: latestEvent.exfiltration_progress,
          compromised_systems: latestEvent.impact_metrics?.compromised_systems
        }
      }
    });
  };

  const initiateAction = (actionName: string) => {
    if (activeVote) return;
    sendAction({
      content: { type: 'vote_started', action: actionName, sender: userName, isSoloPlayer: isGodMode }
    });
  };

  const castVote = (approve: boolean) => {
    if (!activeVote || activeVote.hasVoted) return;
    setActiveVote(prev => prev ? { ...prev, hasVoted: true } : null);
    if (approve) {
      sendAction({
        content: { type: 'vote_cast', action: activeVote.action, vote: 'approve', sender: userName }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0505] text-red-50 overflow-hidden relative font-['Inter',sans-serif]">
      {/* Cursors Overlay */}
      {Object.values(otherCursors).map((cursor) => (
        <div 
          key={cursor.id} 
          className="absolute z-50 pointer-events-none transition-all duration-75"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <MousePointer2 className={`w-6 h-6 ${cursor.role === 'IT Architect' ? 'text-orange-400' : cursor.role === 'CFO' ? 'text-emerald-400' : 'text-blue-400'}`} fill="currentColor" />
          <div className="bg-black/80 px-2 py-1 rounded text-[10px] font-bold mt-1 shadow-lg">
            {cursor.name} <span className="opacity-50">({cursor.role})</span>
          </div>
        </div>
      ))}

      {/* Vote Modal */}
      {activeVote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-blue-500 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] text-center animate-fade-in">
            <AlertTriangle className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-white mb-2">Critical Decision Required</h2>
            <p className="text-lg text-red-400 font-black tracking-widest uppercase font-['Orbitron',sans-serif] mb-6">
              {activeVote.action}
            </p>
            
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${(activeVote.timer / 10) * 100}%` }}></div>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Current approvals: <span className="text-white font-bold">{activeVote.approvals} / 2</span> required.
            </p>

            <div className="flex gap-4">
              <button 
                disabled={activeVote.hasVoted}
                onClick={() => castVote(false)}
                className="flex-1 p-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> Reject
              </button>
              <button 
                disabled={activeVote.hasVoted}
                onClick={() => castVote(true)}
                className="flex-1 p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ff00000a_1px,transparent_1px),linear-gradient(to_bottom,#ff00000a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6 min-h-screen">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-red-500/20 pb-4 gap-4 shrink-0">
          <div className="flex items-center gap-4 group">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-8 h-8 text-red-500 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-['Orbitron',sans-serif] uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                Central Hospital - Management System
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <p className="text-red-400/80 text-sm font-bold tracking-[0.1em] uppercase">CRITICAL ALERT: "NOCTURNAL STRIXX" RANSOMWARE INFECTION</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-full flex items-center gap-3">
            <Users className="w-4 h-4 text-blue-400" />
            <div className="text-xs">
              <span className="text-slate-400">Agent:</span> <span className="font-bold text-white">{userName}</span>
            </div>
            <div className="w-px h-4 bg-slate-700"></div>
            <div className="text-xs">
              <span className="text-slate-400">Role:</span> <span className="font-bold text-blue-400">{userRole}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Left Column - Metrics & Countermeasures */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-black/60 backdrop-blur-3xl border border-red-500/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-['Orbitron',sans-serif]">
                <Activity className="w-4 h-4" /> Critical Damages
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-red-950/20 rounded-xl p-4 border border-red-500/10 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  <p className="text-xs font-medium text-red-300/70 uppercase tracking-widest mb-1 font-['Orbitron',sans-serif]">Data Exfiltration</p>
                  <p className="text-4xl font-black text-white font-['Orbitron',sans-serif] mb-2">{latestEvent?.exfiltration_progress || 0}%</p>
                  <div className="w-full bg-black rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${latestEvent?.exfiltration_progress || 0}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-950/20 rounded-xl p-4 border border-orange-500/10">
                    <p className="text-[10px] font-medium text-orange-300/70 uppercase tracking-widest mb-1">Stolen Records</p>
                    <p className="text-2xl font-light text-white font-['Fira_Code',monospace]">{latestEvent?.impact_metrics?.stolen_records?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-red-950/20 rounded-xl p-4 border border-red-500/10">
                    <p className="text-[10px] font-medium text-red-300/70 uppercase tracking-widest mb-1">Compromised Systems</p>
                    <p className="text-2xl font-light text-white font-['Fira_Code',monospace]">{latestEvent?.impact_metrics?.compromised_systems || 0}</p>
                  </div>
                </div>

                <div className="bg-emerald-950/20 rounded-xl p-4 border border-emerald-500/10 relative overflow-hidden mt-1">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                  <p className="text-[10px] font-medium text-emerald-300/70 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Emergency Funds
                  </p>
                  <p className="text-3xl font-black text-emerald-400 font-['Fira_Code',monospace]">
                    ${latestEvent?.emergency_funds?.toLocaleString() || '250,000'}<span className="text-sm font-medium text-emerald-500/50">.00</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Countermeasures Panel */}
            <div className={`bg-black/60 backdrop-blur-3xl border rounded-2xl p-5 shadow-2xl relative transition-all ${canInteractIT ? 'border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-slate-800 opacity-70'}`}>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 font-['Orbitron',sans-serif]">
                <ShieldAlert className={`w-4 h-4 ${canInteractIT ? 'text-orange-400' : 'text-slate-500'}`} /> Infrastructure Panel
              </h2>
              {!canInteractIT && <p className="text-xs text-orange-400/80 mb-3 font-bold">Locked: Requires IT Architect role</p>}
              
              <div className="flex flex-col gap-3">
                <button 
                  disabled={!canInteractIT}
                  onClick={() => initiateAction('Disconnect Database')}
                  className="group relative w-full text-left bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 p-4 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  <div className="relative z-10 flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-500/20 group-hover:text-blue-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Disconnect DB</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Stops data leak NOW, operational cost is HIGH.</p>
                    </div>
                  </div>
                </button>

                <button 
                  disabled={!canInteractIT}
                  onClick={() => initiateAction('Shutdown ICU Network')}
                  className="group relative w-full text-left bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 p-4 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  <div className="relative z-10 flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-orange-500/20 group-hover:text-orange-400">
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Shutdown ICU Network</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Slows attack, puts critical patients at risk.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Finanzas Panel */}
            <div className={`bg-black/60 backdrop-blur-3xl border rounded-2xl p-5 shadow-2xl relative transition-all ${canInteractFin ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-slate-800 opacity-70'}`}>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 font-['Orbitron',sans-serif]">
                <DollarSign className={`w-4 h-4 ${canInteractFin ? 'text-emerald-400' : 'text-slate-500'}`} /> Financial Management
              </h2>
              {!canInteractFin && <p className="text-xs text-emerald-400/80 mb-3 font-bold">Locked: Requires CFO role</p>}

              <button 
                  disabled={!canInteractFin}
                  onClick={() => initiateAction('Pay Ransom')}
                  className="group relative w-full text-left bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  <div className="relative z-10 flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Pay Partial Ransom</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Consumes funds (-$50k), buys time (-10% exfiltration).</p>
                    </div>
                  </div>
                </button>
            </div>

          </div>

          {/* Right Column - SOS & Telemetry */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <div className={`bg-slate-900/80 border rounded-2xl p-1 flex flex-col overflow-hidden relative transition-all ${canInteractNeg ? 'border-blue-900/50 shadow-2xl' : 'border-slate-800 opacity-90'}`}>
              <div className="px-5 py-3 border-b border-slate-800 bg-black/40 flex items-center justify-between">
                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 font-['Orbitron',sans-serif]">
                  <MessageSquareWarning className="w-4 h-4" /> AI Crisis Advisor
                </h2>
                {!canInteractNeg && <span className="text-xs text-blue-400/80 font-bold">Locked: Requires Negotiator role</span>}
                <button 
                  onClick={handleSOSRequest}
                  disabled={isRequestingSOS || !latestEvent || !canInteractNeg}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                    (isRequestingSOS || !canInteractNeg)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  {isRequestingSOS ? 'Consulting...' : 'SOS: Request Help'}
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-3 min-h-[120px] max-h-[200px] overflow-y-auto custom-scrollbar bg-[#050b14]">
                {advisories.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <p className="text-sm italic">No urgent messages. The Negotiator must request SOS advice.</p>
                  </div>
                ) : (
                  advisories.map((adv, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${idx === 0 ? 'bg-blue-950/40 border-blue-500/30 text-blue-100' : 'bg-slate-900/50 border-slate-800 text-slate-400'} flex gap-3 items-start`}>
                      <div className="p-2 bg-blue-900/50 rounded-full shrink-0">
                        <ShieldAlert className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase">{adv.sender}</span>
                          <span className="text-[10px] text-slate-500">{new Date(adv.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{idx === 0 ? <Typewriter text={adv.message} delay={20} /> : adv.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#050505] border border-red-900/30 rounded-2xl p-1 shadow-2xl flex flex-col overflow-hidden relative flex-1 min-h-[300px]">
              <div className="px-5 py-3 border-b border-red-900/30 bg-black/40 flex items-center justify-between">
                <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 font-['Orbitron',sans-serif]">
                  <Skull className="w-4 h-4" /> Interception: Attacker C2 Server
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar bg-[#0a0505]">
                {events.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-700 font-['Fira_Code',monospace]">
                     <Terminal className="w-12 h-12 mb-3 opacity-20" />
                     <p className="italic text-sm">Waiting for enemy telemetry interception...</p>
                   </div>
                )}
                
                {events.map((evt, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div key={idx} className={`flex flex-col gap-3 opacity-${isLatest ? '100' : '40'} transition-opacity duration-300`}>
                      <div className="flex items-center gap-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${isLatest ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-900 text-slate-500'}`}>
                          [ EVENT: {evt.attack_phase} ]
                        </span>
                        {isLatest && <div className="h-[1px] flex-1 bg-gradient-to-r from-red-500/50 to-transparent ml-2"></div>}
                      </div>
                      <div className="bg-black border border-red-900/20 rounded-lg overflow-hidden font-['Fira_Code',monospace] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <div className="p-4 text-[13px] leading-relaxed text-[#ff3333]">
                           <div className="flex gap-2 mb-3">
                             <span className="opacity-70 whitespace-nowrap">{evt.attacker_terminal?.host_user || 'strixx@c2:~#'} $</span>
                             <span className="text-orange-400">
                               {isLatest ? <Typewriter text={evt.attacker_terminal?.executed_command || 'recon'} delay={10} /> : evt.attacker_terminal?.executed_command}
                             </span>
                           </div>
                           <div className="whitespace-pre-line opacity-80 pl-3 border-l-2 border-red-500/30 text-red-400">
                             {isLatest ? <Typewriter text={evt.attacker_terminal?.console_output || 'Executing...'} delay={5} /> : evt.attacker_terminal?.console_output}
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(239, 68, 68, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.4); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<{name: string, role: Role} | null>(null);

  if (!user) {
    return <LoginLobby onJoin={(name, role) => setUser({ name, role })} />;
  }

  return (
    <PortalProvider client={portal}>
      <Dashboard userName={user.name} userRole={user.role} />
    </PortalProvider>
  );
}
