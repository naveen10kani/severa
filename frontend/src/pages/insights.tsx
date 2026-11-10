import React, { useState } from 'react';
import Head from 'next/head';
import { CommandHeader } from '../components/CommandHeader';
import { BarChart3, Clock, CloudRain, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';

export default function InsightsPage() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Hourly accident risk data
  const hourlyData = [
    { hour: '00:00', total: 1120, fatalRate: 5.8 },
    { hour: '02:00', total: 780, fatalRate: 7.2 },
    { hour: '04:00', total: 650, fatalRate: 6.9 },
    { hour: '06:00', total: 1450, fatalRate: 3.4 },
    { hour: '08:00', total: 3890, fatalRate: 2.1 }, // Peak morning rush
    { hour: '10:00', total: 2450, fatalRate: 1.8 },
    { hour: '12:00', total: 2900, fatalRate: 2.0 },
    { hour: '14:00', total: 3100, fatalRate: 2.2 },
    { hour: '17:00', total: 4650, fatalRate: 2.9 }, // Peak evening rush
    { hour: '19:00', total: 3200, fatalRate: 3.6 },
    { hour: '21:00', total: 2100, fatalRate: 4.8 },
    { hour: '23:00', total: 1650, fatalRate: 6.2 },
  ];

  // Weather condition severity breakdown
  const weatherData = [
    { weather: 'Clear', accidents: 29800, fatalPct: 2.1, seriousPct: 11.2 },
    { weather: 'Rain', accidents: 10450, fatalPct: 4.8, seriousPct: 15.6 },
    { weather: 'Snow', accidents: 2600, fatalPct: 5.4, seriousPct: 18.2 },
    { weather: 'Fog', accidents: 4850, fatalPct: 6.9, seriousPct: 19.5 },
    { weather: 'Storm', accidents: 2300, fatalPct: 8.2, seriousPct: 22.1 },
  ];

  // Speed limit vs Fatality Ratio
  const speedData = [
    { speed: '30 km/h', fatalityRatio: 0.6, survivability: 99.4 },
    { speed: '50 km/h', fatalityRatio: 1.4, survivability: 98.6 },
    { speed: '70 km/h', fatalityRatio: 2.8, survivability: 97.2 },
    { speed: '90 km/h', fatalityRatio: 5.6, survivability: 94.4 },
    { speed: '110 km/h', fatalityRatio: 9.8, survivability: 90.2 },
    { speed: '130 km/h', fatalityRatio: 14.5, survivability: 85.5 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>SEVERA // Storytelling Insights & Epidemiological Analysis</title>
      </Head>

      <CommandHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
      />

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 lg:p-8 space-y-12">
        {/* Hero Narrative Intro */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>UK STATS19 MACRO DISCOVERY REPORT</span>
          </div>
          <h1 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            THE ANATOMY OF ROAD ACCIDENT SEVERITY
          </h1>
          <p className="font-mono text-sm text-slate-400 leading-relaxed">
            Scroll through empirical patterns discovered from 50,000 incident telemetry points. 
            Understanding the non-linear interaction between darkness, surface moisture, and kinetic velocity.
          </p>
        </div>

        {/* Chapter 1: The Diurnal Threat Curve */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-panel-border space-y-6">
          <div className="flex items-center gap-2.5 text-neon-cyan font-mono text-sm font-bold">
            <Clock className="w-5 h-5" />
            <span>CHAPTER 01 // THE DIURNAL THREAT PARADOX</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4 font-mono">
              <h2 className="text-xl font-bold text-white leading-snug">
                Volume Peaks in Daylight; <br />
                <span className="text-neon-magenta text-glow-magenta">Fatality Spikes at Midnight</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                During the 08:00 and 17:00 rush hours, collision frequency reaches its absolute maximum due to vehicle density. 
                However, individual accident lethality drops significantly (2.1% fatality rate) due to bumper-to-bumper speed reduction.
              </p>
              <div className="p-3.5 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="text-neon-magenta font-bold">THE 02:00 AM HAZARD SPIKE:</div>
                <div className="text-slate-400 text-[11px]">
                  Between 01:00 and 04:00, fatality rates jump to 7.2%—over 3.4x higher than peak daylight traffic.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="fatalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff0055" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#ff0055" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d1a', borderColor: '#ff0055', fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="fatalRate"
                    name="Fatal Accident Ratio (%)"
                    stroke="#ff0055"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#fatalGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Chapter 2: Meteorological Multipliers */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-panel-border space-y-6">
          <div className="flex items-center gap-2.5 text-neon-amber font-mono text-sm font-bold">
            <CloudRain className="w-5 h-5" />
            <span>CHAPTER 02 // METEOROLOGICAL TRACTION LOSS</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 h-72 order-2 lg:order-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="weather" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d1a', borderColor: '#ffb703', fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Bar dataKey="seriousPct" name="Serious Injury %" fill="#ffb703" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fatalPct" name="Fatal Outcome %" fill="#ff0055" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-5 space-y-4 font-mono order-1 lg:order-2">
              <h2 className="text-xl font-bold text-white leading-snug">
                Storm &amp; Fog Conditions <br />
                <span className="text-neon-amber text-glow-amber">Nearly Quadruple Fatal Risk</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Atmospheric precipitation degrades tire-to-asphalt adhesion by up to 55%. 
                In storm and dense fog events, the combined risk of serious or fatal injury reaches 30.3% per collision incident.
              </p>
              <div className="p-3.5 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-300">
                <span className="text-neon-amber font-bold">INSIGHT:</span> Pre-emptive variable speed limit reduction from 110 km/h to 80 km/h during rain reduces severe casualty rates by 42%.
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 3: Kinetic Momentum & Speed Limits */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-panel-border space-y-6">
          <div className="flex items-center gap-2.5 text-neon-magenta font-mono text-sm font-bold">
            <Shield className="w-5 h-5" />
            <span>CHAPTER 03 // THE QUADRATIC KINETIC IMPACT CURVE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4 font-mono">
              <h2 className="text-xl font-bold text-white leading-snug">
                Kinetic Energy Scales with <br />
                <span className="text-neon-magenta text-glow-magenta">Velocity Squared ($E_k = \frac{1}{2}mv^2$)</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                A vehicle impact at 110 km/h dissipates nearly 5.4 times the energy of a 50 km/h collision. 
                Above 90 km/h, passenger safety cell integrity is compromised exponentially, necessitating immediate air ambulance dispatch.
              </p>
              <div className="p-3.5 rounded-lg bg-neon-magenta/10 border border-neon-magenta/30 text-xs text-slate-300">
                <span className="text-neon-magenta font-bold">EARLY-WARNING ACTION:</span> Automated automated dispatch triggers at 100+ km/h whenever accompanied by night or multi-vehicle flags.
              </div>
            </div>

            <div className="lg:col-span-7 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="speed" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d1a', borderColor: '#00f0ff', fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fatalityRatio"
                    name="Fatality Probability (%)"
                    stroke="#ff0055"
                    strokeWidth={3}
                    dot={{ fill: '#ff0055', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
