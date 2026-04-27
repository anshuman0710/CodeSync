const axios = require("axios");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const PISTON_URL = process.env.PISTON_URL || "";
const EXECUTION_PROVIDER = process.env.EXECUTION_PROVIDER || "local";
const LANGUAGE_ALIASES = {
  javascript: ["javascript", "js", "node"],
  python: ["python", "py", "python3"],
  cpp: ["cpp", "c++", "g++"],
};

let runtimeCache = null;
let runtimeCacheAt = 0;
const RUNTIME_CACHE_MS = 10 * 60 * 1000;

function runProcess(command, args, options = {}) {
  const timeout = options.timeout || 7000;

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, code: 127, timedOut: false });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, signal, timedOut });
    });

    if (options.stdin) {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();
  });
}

async function firstWorkingCommand(candidates) {
  for (const candidate of candidates) {
    const result = await runProcess(candidate.command, candidate.args || ["--version"], { timeout: 2500 });
    if (result.code === 0) return candidate.command;
  }
  return null;
}

function fileNameFor(language) {
  if (language === "python") return "main.py";
  if (language === "cpp") return "main.cpp";
  return "main.js";
}

function extractErrorDetails(stderr = "", language) {
  const details = [];
  const patterns = [
    { type: "Python", regex: /File\s+"[^"]+",\s+line\s+(\d+)(?:[\s\S]*?\n\s*(.+))?/g },
    { type: "JavaScript", regex: /(?:main|index)\.js:(\d+):(\d+)[\s\S]*?(?=\n\s+at|\n*$)/g },
    { type: "C++", regex: /main\.cpp:(\d+):(\d+):\s*(error|warning|note):\s*(.+)/g },
  ];

  patterns.forEach(({ type, regex }) => {
    let match;
    while ((match = regex.exec(stderr)) !== null) {
      const [, line, column, severity, message] = match;
      details.push({
        language,
        source: type,
        line: Number(line),
        column: column && !Number.isNaN(Number(column)) ? Number(column) : null,
        severity: severity || "error",
        message: (message || match[0]).trim().split("\n")[0],
      });
    }
  });

  return details.slice(0, 8);
}

function normalizeLocalResult({ provider, runtime, compile, run, language }) {
  const stderr = [compile?.stderr, run?.stderr].filter(Boolean).join("\n");
  const stdout = [compile?.stdout, run?.stdout].filter(Boolean).join("\n");
  const timedOut = compile?.timedOut || run?.timedOut;
  let status = "Accepted";

  if (timedOut) status = "Time Limit Exceeded";
  else if (compile && compile.code !== 0) status = "Compilation Error";
  else if (run?.code && run.code !== 0) status = "Runtime Error";
  else if (stderr) status = "Completed with stderr";

  return {
    provider,
    runtime,
    stdout,
    stderr,
    output: stdout || stderr,
    exitCode: run?.code ?? compile?.code ?? 0,
    signal: run?.signal || compile?.signal || null,
    status,
    errorDetails: extractErrorDetails(stderr, language),
    isError: !["Accepted", "Completed with stderr"].includes(status),
  };
}

async function executeLocal({ code, language, stdin }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codesync-"));
  const sourcePath = path.join(tmpDir, fileNameFor(language));

  try {
    await fs.writeFile(sourcePath, code, "utf8");

    if (language === "javascript") {
      const run = await runProcess(process.execPath, [sourcePath], { cwd: tmpDir, stdin, timeout: 7000 });
      return normalizeLocalResult({ provider: "Local Sandbox", runtime: `Node ${process.version}`, run, language });
    }

    if (language === "python") {
      const python = await firstWorkingCommand([
        { command: "python", args: ["--version"] },
        { command: "python3", args: ["--version"] },
      ]);
      if (!python) {
        return normalizeLocalResult({
          provider: "Local Sandbox",
          runtime: "Python not installed",
          run: { code: 127, stderr: "Python runtime not found on this machine." },
          language,
        });
      }
      const run = await runProcess(python, [sourcePath], { cwd: tmpDir, stdin, timeout: 7000 });
      return normalizeLocalResult({ provider: "Local Sandbox", runtime: python, run, language });
    }

    if (language === "cpp") {
      const compiler = await firstWorkingCommand([{ command: "g++", args: ["--version"] }]);
      if (!compiler) {
        return normalizeLocalResult({
          provider: "Local Sandbox",
          runtime: "g++ not installed",
          compile: { code: 127, stderr: "C++ compiler g++ not found on this machine." },
          language,
        });
      }

      const outputPath = path.join(tmpDir, process.platform === "win32" ? "main.exe" : "main");
      const compile = await runProcess(compiler, [sourcePath, "-std=c++17", "-O2", "-o", outputPath], {
        cwd: tmpDir,
        timeout: 10000,
      });
      if (compile.code !== 0 || compile.timedOut) {
        return normalizeLocalResult({ provider: "Local Sandbox", runtime: "g++ C++17", compile, language });
      }

      const run = await runProcess(outputPath, [], { cwd: tmpDir, stdin, timeout: 7000 });
      return normalizeLocalResult({ provider: "Local Sandbox", runtime: "g++ C++17", compile, run, language });
    }

    return {
      provider: "Local Sandbox",
      runtime: "Unsupported",
      stdout: "",
      stderr: `Unsupported language: ${language}`,
      status: "Unsupported Language",
      isError: true,
      errorDetails: [],
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function getRuntimes() {
  if (runtimeCache && Date.now() - runtimeCacheAt < RUNTIME_CACHE_MS) return runtimeCache;
  const { data } = await axios.get(`${PISTON_URL}/runtimes`, { timeout: 10000 });
  runtimeCache = data;
  runtimeCacheAt = Date.now();
  return runtimeCache;
}

async function resolveRuntime(language) {
  const aliases = LANGUAGE_ALIASES[language];
  if (!aliases) return null;
  const runtimes = await getRuntimes();
  const matches = runtimes.filter((runtime) => {
    const names = [runtime.language, ...(runtime.aliases || [])].map((item) => item.toLowerCase());
    return aliases.some((alias) => names.includes(alias.toLowerCase()));
  });
  return matches.sort((a, b) => String(b.version).localeCompare(String(a.version), undefined, { numeric: true }))[0];
}

async function executePiston({ code, language, stdin }) {
  const runtime = await resolveRuntime(language);
  if (!runtime) throw new Error(`Unsupported language: ${language}`);

  const { data } = await axios.post(
    `${PISTON_URL}/execute`,
    {
      language: runtime.language,
      version: runtime.version,
      files: [{ name: fileNameFor(language), content: code }],
      stdin,
      compile_timeout: 10000,
      run_timeout: 5000,
    },
    { timeout: 20000 }
  );

  const compile = data.compile || {};
  const run = data.run || {};
  return normalizeLocalResult({
    provider: "Piston",
    runtime: `${runtime.language} ${runtime.version}`,
    compile,
    run,
    language,
  });
}

const executeCode = async (req, res) => {
  const { code, language, stdin = "" } = req.body;

  try {
    if (EXECUTION_PROVIDER === "piston" && PISTON_URL) {
      return res.json(await executePiston({ code, language, stdin }));
    }

    return res.json(await executeLocal({ code, language, stdin }));
  } catch (err) {
    console.error("Execute error:", err.response?.data || err.message);

    if (EXECUTION_PROVIDER === "piston") {
      try {
        return res.json(await executeLocal({ code, language, stdin }));
      } catch (fallbackErr) {
        console.error("Local fallback error:", fallbackErr.message);
      }
    }

    res.status(500).json({
      provider: EXECUTION_PROVIDER === "piston" ? "Piston" : "Local Sandbox",
      status: "Execution Failed",
      message: err.response?.data?.message || err.message || "Execution failed",
      stderr: err.response?.data?.message || err.message || "Execution failed",
      errorDetails: [],
      isError: true,
    });
  }
};

module.exports = { executeCode };
