import React, { useEffect, useState } from 'react';
import { FileText, Share2, Undo, Redo, Printer, SpellCheck, Lock } from 'lucide-react';

export const CloakScreen = ({ onUncloak }) => {
  const [docContent, setDocContent] = useState(
    `Literature Review: Distributed Systems & Asynchronous Consensus Protocols\n\n1. Abstract\nThis paper examines modern fault-tolerant consensus mechanisms within heterogeneous network topologies. Recent advancements in Paxos and Raft implementations indicate that reducing round-trip validation latency yields significant throughput gains without compromising state consistency.\n\n2. Background and Core Axioms\nTraditional centralized architectures suffer from single-point bottlenecks. By segmenting state machine replication across partitioned clusters, nodes achieve linear scalability while maintaining strict Byzantine fault tolerance guarantees under varying adversarial network conditions.\n\n3. Empirical Benchmark Observations\nDuring the initial evaluation cycle, latency dropped by 34.2% under sustained peak packet ingestion. Subsequent stress testing corroborated that garbage collection overhead remained bounded within acceptable sub-millisecond thresholds.\n\n4. Conclusion\nFuture optimization vectors involve hardware-accelerated serialization engines and adaptive quorum configurations.`
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === '`') {
        onUncloak();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUncloak]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] text-slate-800 flex flex-col font-sans select-text">
      {/* Google Docs App Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Docs icon */}
          <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white shadow-sm">
            <FileText className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800 text-sm hover:border hover:border-slate-300 rounded px-1.5 py-0.5 cursor-text">
                Research Project - Distributed Systems Notes
              </span>
              <span className="text-[11px] text-slate-400">Saved to Drive</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
              <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">File</span>
              <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Edit</span>
              <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">View</span>
              <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Insert</span>
              <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Format</span>
              <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Tools</span>
              <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Help</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUncloak}
            title="Return to PlayZone (or press ESC)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-md transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Uncloak (ESC)</span>
          </button>

          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-100 text-sky-800 hover:bg-sky-200 text-xs font-semibold rounded-full transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Docs Toolbar */}
      <div className="bg-[#edf2fa] border-b border-slate-300 px-4 py-1 flex items-center gap-3 text-slate-600 text-xs">
        <Undo className="w-3.5 h-3.5 cursor-pointer hover:text-black" />
        <Redo className="w-3.5 h-3.5 cursor-pointer hover:text-black" />
        <Printer className="w-3.5 h-3.5 cursor-pointer hover:text-black" />
        <SpellCheck className="w-3.5 h-3.5 cursor-pointer hover:text-black" />
        <div className="h-4 w-px bg-slate-300 mx-1" />
        <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700">100%</span>
        <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700">Normal text</span>
        <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700">Arial</span>
        <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700">11</span>
      </div>

      {/* Page Document Container */}
      <main className="flex-1 overflow-y-auto bg-[#f0f4f9] py-8 flex justify-center">
        <div className="w-[816px] min-h-[1056px] bg-white shadow-md border border-slate-300 p-16 rounded-sm">
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            className="w-full h-[900px] border-none outline-none resize-none font-serif text-slate-800 text-[14px] leading-relaxed"
          />
        </div>
      </main>
    </div>
  );
};
