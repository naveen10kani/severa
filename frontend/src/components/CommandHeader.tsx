import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, ShieldAlert, Cpu, BarChart2, Volume2, VolumeX, MapPin, ExternalLink } from 'lucide-react';

interface CommandHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeFatalAlert?: boolean;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  soundEnabled,
  onToggleSound,
  activeFatalAlert = false,
}) => {
  const router = useRouter();
  const [timeStr, setTimeStr] = useState<string>('');
  const audioRef = useRef<AudioContext | null>(null);
  const wasFatal = useRef<boolean>(false);

  // Web Audio siren — fired once whenever the system enters CODE RED
  const playSiren = () => {
    if (typeof window === 'undefined') return;
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      if (!audioRef.current) audioRef.current = new Ctor();
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.42;
        osc.frequency.setValueAtTime(740, t);
        osc.frequency.linearRampToValueAtTime(988, t + 0.2);
        osc.frequency.linearRampToValueAtTime(740, t + 0.4);
      }
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      osc.start(now);
      osc.stop(now + 1.35);
    } catch (e) {
      /* autoplay policy blocks until a user gesture — silently ignore */
    }
  };

  const playConfirmBlip = () => {
    if (typeof window === 'undefined') return;
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      if (!audioRef.current) audioRef.current = new Ctor();
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    } catch (e) {
      /* ignore */
    }
  };

  useEffect(() => {
    if (activeFatalAlert && soundEnabled && !wasFatal.current) playSiren();
    wasFatal.current = activeFatalAlert;
  }, [activeFatalAlert, soundEnabled]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' GMT');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: '/', label: 'Simulator & Triage', icon: ShieldAlert },
    { href: '/map', label: 'Tactical Map', icon: MapPin },
    { href: '/lab', label: 'Model Benchmarks', icon: Cpu },
    { href: '/insights', label: 'Safety Insights', icon: BarChart2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080a10]/85 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm tracking-wider transition-all duration-300 ${
              activeFatalAlert
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                : 'bg-white/10 text-white border border-white/15 group-hover:bg-white/15'
            }`}>
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-white group-hover:text-slate-100">
                  SEVERA
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                Road Incident Early-Warning System
              </p>
            </div>
          </Link>
        </div>

        {/* Clean, Human-Designed Navigation Pills */}
        <nav className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Status Dock */}
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${
              activeFatalAlert ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
            }`} />
            <span className={activeFatalAlert ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
              {activeFatalAlert ? 'CODE RED DISPATCH' : 'SYSTEM READY'}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400">{timeStr || 'LIVE'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              if (!soundEnabled) playConfirmBlip();
              onToggleSound();
            }}
            aria-label={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-white/[0.06] text-slate-200 border-white/10 hover:bg-white/[0.1]'
                : 'bg-white/[0.02] text-slate-500 border-white/[0.06] hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default CommandHeader;
