import React, { useState } from 'react';
import Head from 'next/head';
import { CommandHeader } from '../components/CommandHeader';
import { LiveHotspotMap } from '../components/LiveHotspotMap';
import { ClusterIntelligence } from '../components/ClusterIntelligence';
import { HotspotItem } from '../lib/types';
import { Compass } from 'lucide-react';

export default function TacticalMapPage() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [focusHotspot, setFocusHotspot] = useState<HotspotItem | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>SEVERA // Tactical Incident & Hotspot Map</title>
      </Head>

      <CommandHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-panel-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-neon-cyan" />
            <div>
              <h1 className="font-mono text-lg font-bold tracking-wider text-white">
                TACTICAL GEOSPATIAL COMMAND // UK ACCIDENT HEATMAP
              </h1>
              <p className="text-xs font-mono text-slate-400">
                Continuous spatial clustering over 50,000 historical STATS19 records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-blink-fast" />
            <span className="text-neon-cyan font-bold">CLUSTER SYNC ACTIVE</span>
          </div>
        </div>

        {/* Map Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
          {/* Main Hotspot Heatmap */}
          <div className="lg:col-span-8 min-h-[650px]">
            <LiveHotspotMap focusHotspot={focusHotspot} interactive={true} />
          </div>

          {/* Right: ranked cluster intelligence (replaces the old incident feed) */}
          <div className="lg:col-span-4 min-h-[650px]">
            <ClusterIntelligence onFocusHotspot={setFocusHotspot} activeHotspot={focusHotspot} />
          </div>
        </div>
      </div>
    </div>
  );
}
