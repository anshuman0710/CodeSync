import React, { useState, useEffect } from "react";

export default function InterviewTimer({ timerEnd, isHost, onEnd }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!timerEnd) return;
    const tick = () => {
      const diff = new Date(timerEnd) - Date.now();
      if (diff <= 0) { setRemaining(0); onEnd?.(); return; }
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerEnd, onEnd]);

  if (remaining === null) return null;

  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const isUrgent = remaining > 0 && remaining < 5 * 60 * 1000; // < 5 mins
  const isDone = remaining === 0;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold transition-all ${
      isDone ? "bg-red-500/20 border border-red-500/30 text-red-400" :
      isUrgent ? "bg-orange-500/15 border border-orange-500/30 text-orange-400 animate-pulse" :
      "bg-violet-500/10 border border-violet-500/20 text-violet-400"
    }`}>
      <span className="text-xs">{isDone ? "⏰" : "⏱"}</span>
      {isDone
        ? "Time's up!"
        : hrs > 0
        ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
        : `${pad(mins)}:${pad(secs)}`
      }
    </div>
  );
}
