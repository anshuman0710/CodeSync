import React, { useRef, useEffect, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";

const MONACO_LANGUAGE_MAP = {
  javascript: "javascript",
  python: "python",
  cpp: "cpp",
};

export default function CodeEditor({
  code,
  language,
  readOnly,
  theme,
  cursors,
  selections,
  userInfo,
  onCodeChange,
  onCursorMove,
  onSelection,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const suppressRef = useRef(false); // Suppress local onChange when applying remote change
  const typingTimerRef = useRef(null);

  // Apply remote cursors & selections as Monaco decorations
  const applyDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = [];

    Object.entries(cursors).forEach(([socketId, { username, color, position }]) => {
      if (!position) return;
      const { lineNumber, column } = position;

      // Cursor line
      decorations.push({
        range: new monacoRef.current.Range(lineNumber, column, lineNumber, column + 1),
        options: {
          className: `remote-cursor-${socketId}`,
          beforeContentClassName: `remote-cursor-caret`,
          glyphMarginClassName: undefined,
          stickiness: 1,
          after: {
            content: username,
            inlineClassName: `remote-cursor-label`,
            cursorStops: 0,
          },
        },
      });
    });

    Object.entries(selections).forEach(([socketId, { username, color, selection }]) => {
      if (!selection || !selection.startLineNumber) return;
      decorations.push({
        range: new monacoRef.current.Range(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        ),
        options: {
          className: `remote-selection-${socketId}`,
          inlineClassName: `remote-selection-inline`,
        },
      });
    });

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations
    );
  }, [cursors, selections]);

  useEffect(() => {
    applyDecorations();
  }, [applyDecorations]);

  // Inject dynamic CSS for per-user cursor colors
  useEffect(() => {
    const style = document.getElementById("cursor-styles") || document.createElement("style");
    style.id = "cursor-styles";

    const rules = Object.entries(cursors)
      .map(
        ([socketId, { color }]) => `
        .remote-cursor-${socketId} {
          border-left: 2px solid ${color} !important;
        }
        .remote-selection-${socketId} {
          background: ${color}33 !important;
        }
      `
      )
      .join("\n");

    style.textContent = rules;
    if (!document.getElementById("cursor-styles")) {
      document.head.appendChild(style);
    }
  }, [cursors]);

  // Listen for remote code updates (dispatched from useRoom)
  useEffect(() => {
    const handler = (e) => {
      if (!editorRef.current) return;
      const { delta } = e.detail;
      suppressRef.current = true;
      // Apply the edit operation from the delta
      editorRef.current.executeEdits("remote", [delta]);
      suppressRef.current = false;
    };
    document.addEventListener("remote-code-update", handler);
    return () => document.removeEventListener("remote-code-update", handler);
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      onCursorMove({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Track selection
    editor.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      if (sel.isEmpty()) return;
      onSelection({
        startLineNumber: sel.startLineNumber,
        startColumn: sel.startColumn,
        endLineNumber: sel.endLineNumber,
        endColumn: sel.endColumn,
      });
    });

    // Define dark theme
    monaco.editor.defineTheme("codesync-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6e7681" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "type", foreground: "ffa657" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editorLineNumber.foreground": "#6e7681",
        "editorLineNumber.activeForeground": "#e6edf3",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#58a6ff",
        "editor.inactiveSelectionBackground": "#264f7844",
      },
    });

    monaco.editor.defineTheme("codesync-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#dfe9ef",
        "editor.foreground": "#102331",
        "editor.lineHighlightBackground": "#cfdee7",
        "editorLineNumber.foreground": "#718897",
        "editorLineNumber.activeForeground": "#0d2130",
        "editor.selectionBackground": "#0b8f8633",
        "editorCursor.foreground": "#087fa4",
        "editor.inactiveSelectionBackground": "#0b8f861f",
      },
    });

    monaco.editor.setTheme(theme === "dark" ? "codesync-dark" : "codesync-light");
  };

  const handleChange = (value, ev) => {
    if (suppressRef.current) return;
    // Send the change to the server
    const changes = ev.changes[0];
    if (changes) {
      onCodeChange(
        {
          range: changes.range,
          text: changes.text,
          forceMoveMarkers: true,
        },
        value
      );
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <Editor
        height="100%"
        language={MONACO_LANGUAGE_MAP[language] || "javascript"}
        value={code}
        theme={theme === "dark" ? "codesync-dark" : "codesync-light"}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineNumbers: "on",
          minimap: { enabled: true, scale: 0.8 },
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
