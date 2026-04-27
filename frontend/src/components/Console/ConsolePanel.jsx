import React, { useState } from "react";

export default function ConsolePanel({ lastExecution, isExecuting, onRun }) {
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const hasErrors = Boolean(lastExecution?.isError || lastExecution?.stderr);

  return (
    <div className="h-full flex flex-col console-panel font-mono">
      <div className="console-toolbar flex items-center gap-2 px-4 py-2 border-b">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.22em] text-muted">Console</span>
          {lastExecution?.provider && (
            <span className="ml-3 rounded-full px-2 py-0.5 text-[10px] font-bold console-provider">
              {lastExecution.provider} · {lastExecution.runtime}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowStdin((s) => !s)} className="console-ghost-button">
            {showStdin ? "Hide stdin" : "stdin"}
          </button>
          <button onClick={() => onRun(stdin)} disabled={isExecuting} className="console-run-button">
            {isExecuting ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                Running
              </>
            ) : (
              <>▶ Run</>
            )}
          </button>
        </div>
      </div>

      {showStdin && (
        <div className="console-stdin px-4 py-3 border-b">
          <p className="text-xs text-muted mb-1">stdin input</p>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter program input here..."
            rows={2}
            className="field-input font-mono text-xs resize-none"
          />
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {!lastExecution && !isExecuting && (
          <div className="console-empty">
            <p className="text-sm font-bold text-app">Ready to execute</p>
            <p className="mt-1 text-xs text-muted">Run code to view stdout, stderr, compile errors, and line hints.</p>
          </div>
        )}

        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            Executing in sandbox...
          </div>
        )}

        {lastExecution && !isExecuting && (
          <div className="space-y-3">
            <div className={`console-status ${hasErrors ? "error" : "success"}`}>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">
                  {hasErrors ? "Execution issue" : "Execution complete"}
                </p>
                <p className="mt-1 text-sm font-bold">{lastExecution.status}</p>
              </div>
              <span className="font-mono text-xs">
                exit {lastExecution.exitCode ?? 0}
                {lastExecution.signal ? ` · ${lastExecution.signal}` : ""}
              </span>
            </div>

            {lastExecution.errorDetails?.length > 0 && (
              <div className="console-card error-card">
                <p className="console-label text-red-300">Detected line details</p>
                <div className="space-y-2">
                  {lastExecution.errorDetails.map((item, index) => (
                    <div key={`${item.line}-${index}`} className="line-error-row">
                      <span className="line-pill">line {item.line}{item.column ? `:${item.column}` : ""}</span>
                      <span className="flex-1">{item.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastExecution.stdout && (
              <div className="console-card">
                <p className="console-label">stdout</p>
                <pre className="console-pre">{lastExecution.stdout}</pre>
              </div>
            )}

            {lastExecution.stderr && (
              <div className="console-card error-card">
                <p className="console-label text-red-300">stderr / compile output</p>
                <pre className="console-pre error">{lastExecution.stderr}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
