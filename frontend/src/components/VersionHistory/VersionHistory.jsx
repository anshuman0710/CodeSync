import React, { useState } from "react";
import { format } from "date-fns";

const LANG_COLORS = { javascript: "#f7df1e", python: "#3776ab", cpp: "#00599c" };

export default function VersionHistory({ snapshots, onRestore, onClose }) {
  const [selected, setSelected] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async (snapshot) => {
    setRestoring(true);
    await onRestore(snapshot._id, snapshot.code, snapshot.language);
    setRestoring(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.25)" }}>🕐</div>
            <div>
              <h2 className="text-white font-bold text-sm">Version History</h2>
              <p className="text-slate-500 text-xs">{snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} saved</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            ✕
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🕰️</div>
            <p className="text-slate-400 font-medium mb-1">No snapshots yet</p>
            <p className="text-slate-600 text-xs">Click "Save Snapshot" in the toolbar to capture a version</p>
          </div>
        ) : (
          <div className="flex h-[420px]">
            {/* Snapshot list */}
            <div className="w-64 border-r border-white/8 overflow-y-auto">
              {snapshots.map((snap, i) => (
                <button key={snap._id || i} onClick={() => setSelected(snap)}
                  className="w-full text-left px-4 py-3 border-b border-white/5 transition-all duration-200 hover:bg-white/5"
                  style={selected?._id === snap._id ? { background: "rgba(34,211,238,0.08)", borderLeft: "2px solid #22d3ee" } : {}}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-semibold">v{snapshots.length - i}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ color: LANG_COLORS[snap.language] || "#fff", background: `${LANG_COLORS[snap.language] || "#fff"}15` }}>
                      {snap.language}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {format(new Date(snap.savedAt), "MMM d, HH:mm")}
                  </div>
                  {snap.savedBy && (
                    <div className="text-slate-600 text-[10px] mt-0.5">by {snap.savedBy}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selected ? (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                    <div>
                      <span className="text-white text-xs font-bold">
                        Snapshot — {format(new Date(selected.savedAt), "MMMM d, yyyy HH:mm")}
                      </span>
                      {selected.savedBy && (
                        <span className="text-slate-500 text-xs ml-2">by {selected.savedBy}</span>
                      )}
                    </div>
                    <button onClick={() => handleRestore(selected)} disabled={restoring}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      style={{ background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }}>
                      {restoring ? "Restoring…" : "↩ Restore"}
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-5">
                    {selected.code}
                  </pre>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="text-3xl mb-3">👆</div>
                  <p className="text-slate-400 text-sm">Select a snapshot to preview</p>
                  <p className="text-slate-600 text-xs mt-1">You can restore any version with one click</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
