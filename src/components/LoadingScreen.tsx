import React, { useEffect, useState } from 'react';

const BOOT_LINES = [
  'INITIALIZING VCOMM ERP v2.5.0...',
  'LOADING FIREBASE MODULES............. OK',
  'AUTHENTICATING SESSION............... OK',
  'FETCHING STORE CONFIGURATION......... OK',
  'BOOTSTRAPPING UI LAYER............... OK',
  'READY.',
];

export function LoadingScreen() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setLines(prev => [...prev, BOOT_LINES[i]]);
      i++;
      if (i >= BOOT_LINES.length) clearInterval(interval);
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#070A10]"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="w-full max-w-md px-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 border-2 border-blue-500 rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rotate-[-45deg]" />
          </div>
          <div>
            <p className="font-mono text-white font-bold tracking-widest text-base">VCOMM ERP</p>
            <p className="font-mono text-blue-500 text-[10px] tracking-[0.3em] uppercase">Enterprise Resource Planning</p>
          </div>
        </div>

        {/* Boot terminal */}
        <div
          className="border border-[#1E293B] bg-black/60 p-5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1E293B]">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="font-mono text-[10px] text-slate-600 ml-2">boot — vcomm-erp</span>
          </div>

          <div className="space-y-1 min-h-[120px]">
            {lines.map((line, i) => (
              <p
                key={i}
                className="font-mono text-[11px] leading-relaxed"
                style={{
                  color: line === 'READY.' ? '#34D399' : i % 2 === 0 ? '#94A3B8' : '#64748B',
                  animation: 'fade-in 200ms ease both',
                }}
              >
                {line !== 'READY.' && <span className="text-blue-500 mr-2">$</span>}
                {line}
                {i === lines.length - 1 && line !== 'READY.' && (
                  <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-1 animate-pulse align-middle" />
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 border border-[#1E293B] bg-[#0D1117] h-1.5">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, (lines.length / BOOT_LINES.length) * 100)}%`,
              borderRadius: 1,
            }}
          />
        </div>
        <p className="font-mono text-[9px] text-slate-600 mt-2 tracking-widest text-right">
          {Math.min(100, Math.round((lines.length / BOOT_LINES.length) * 100))}%
        </p>
      </div>
    </div>
  );
}
