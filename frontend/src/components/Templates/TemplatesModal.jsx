import React, { useState } from "react";

export const TEMPLATES = [
  {
    id: "blank-js",
    name: "Blank",
    language: "javascript",
    icon: "📄",
    category: "Starter",
    code: `// Start coding here\n`,
  },
  {
    id: "hello-js",
    name: "Hello World",
    language: "javascript",
    icon: "👋",
    category: "Starter",
    code: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`,
  },
  {
    id: "two-sum",
    name: "Two Sum",
    language: "javascript",
    icon: "🎯",
    category: "Algorithms",
    code: `/**
 * Given an array of integers and a target,
 * return indices of the two numbers that add up to target.
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}

// Test
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));      // [1, 2]
`,
  },
  {
    id: "binary-search",
    name: "Binary Search",
    language: "javascript",
    icon: "🔍",
    category: "Algorithms",
    code: `/**
 * Binary search on a sorted array.
 * Returns index of target, or -1 if not found.
 */
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

const arr = [1, 3, 5, 7, 9, 11, 13];
console.log(binarySearch(arr, 7));  // 3
console.log(binarySearch(arr, 4));  // -1
`,
  },
  {
    id: "linked-list",
    name: "Linked List",
    language: "javascript",
    icon: "🔗",
    category: "Data Structures",
    code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

class LinkedList {
  constructor() { this.head = null; }

  append(val) {
    const node = new ListNode(val);
    if (!this.head) { this.head = node; return; }
    let cur = this.head;
    while (cur.next) cur = cur.next;
    cur.next = node;
  }

  toArray() {
    const res = [];
    let cur = this.head;
    while (cur) { res.push(cur.val); cur = cur.next; }
    return res;
  }

  reverse() {
    let prev = null, cur = this.head;
    while (cur) {
      const next = cur.next;
      cur.next = prev;
      prev = cur;
      cur = next;
    }
    this.head = prev;
  }
}

const list = new LinkedList();
[1, 2, 3, 4, 5].forEach(v => list.append(v));
console.log(list.toArray()); // [1,2,3,4,5]
list.reverse();
console.log(list.toArray()); // [5,4,3,2,1]
`,
  },
  {
    id: "bfs-dfs",
    name: "BFS / DFS",
    language: "javascript",
    icon: "🌲",
    category: "Graphs",
    code: `// Graph represented as adjacency list
const graph = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "F"],
  F: ["C", "E"],
};

// BFS — shortest path
function bfs(start, end) {
  const queue = [[start, [start]]];
  const visited = new Set([start]);
  while (queue.length) {
    const [node, path] = queue.shift();
    if (node === end) return path;
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }
  return null;
}

// DFS — explore all paths
function dfs(node, visited = new Set()) {
  visited.add(node);
  console.log("Visiting:", node);
  for (const neighbor of graph[node] || []) {
    if (!visited.has(neighbor)) dfs(neighbor, visited);
  }
}

console.log("BFS path A→F:", bfs("A", "F"));
dfs("A");
`,
  },
  {
    id: "dp-template",
    name: "Dynamic Programming",
    language: "javascript",
    icon: "💡",
    category: "Algorithms",
    code: `// Classic DP: Longest Common Subsequence
function lcs(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

// Fibonacci with memoization
function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  return (memo[n] = fib(n - 1, memo) + fib(n - 2, memo));
}

console.log("LCS:", lcs("ABCBDAB", "BDCABA")); // 4
console.log("Fib(30):", fib(30));               // 832040
`,
  },
  {
    id: "hello-py",
    name: "Hello World",
    language: "python",
    icon: "🐍",
    category: "Starter",
    code: `def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
`,
  },
  {
    id: "sort-py",
    name: "Sorting Algorithms",
    language: "python",
    icon: "📊",
    category: "Algorithms",
    code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]

arr = [64, 34, 25, 12, 22, 11, 90]
print("Sorted:", merge_sort(arr))
`,
  },
  {
    id: "hello-cpp",
    name: "Hello World",
    language: "cpp",
    icon: "⚙️",
    category: "Starter",
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    cout << "Hello, CodeSync!" << endl;

    vector<int> v = {5, 2, 8, 1, 9, 3};
    sort(v.begin(), v.end());

    cout << "Sorted: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    return 0;
}
`,
  },
];

const CATEGORIES = ["All", "Starter", "Algorithms", "Data Structures", "Graphs"];

export default function TemplatesModal({ onSelect, onClose }) {
  const [cat, setCat] = useState("All");
  const [lang, setLang] = useState("all");
  const [hovered, setHovered] = useState(null);

  const filtered = TEMPLATES.filter(t =>
    (cat === "All" || t.category === cat) &&
    (lang === "all" || t.language === lang)
  );

  const LANG_COLOR = { javascript: "#f7df1e", python: "#3776ab", cpp: "#00599c", all: "#64748b" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)" }}>📋</div>
            <div>
              <h2 className="text-white font-bold text-sm">Code Templates</h2>
              <p className="text-slate-500 text-xs">Pick a starter — your code will be replaced</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-white/8 flex flex-wrap gap-2">
          <div className="flex gap-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={cat === c
                  ? { background: "rgba(255,255,255,0.1)", color: "#fff" }
                  : { color: "#64748b" }}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {[["all", "All"], ["javascript", "JS"], ["python", "Py"], ["cpp", "C++"]].map(([v, l]) => (
              <button key={v} onClick={() => setLang(v)}
                className="text-xs px-2.5 py-1 rounded-lg transition-all font-mono"
                style={lang === v
                  ? { background: `${LANG_COLOR[v]}18`, color: LANG_COLOR[v], border: `1px solid ${LANG_COLOR[v]}35` }
                  : { color: "#64748b" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Templates grid */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(85vh - 160px)" }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(t => (
              <button key={t.id}
                onClick={() => onSelect(t)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                className="text-left p-4 rounded-xl transition-all duration-200 group"
                style={{
                  background: hovered === t.id ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)",
                  border: hovered === t.id ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.05)",
                }}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ color: LANG_COLOR[t.language], background: `${LANG_COLOR[t.language]}15` }}>
                    {t.language === "javascript" ? "JS" : t.language === "python" ? "PY" : "C++"}
                  </span>
                </div>
                <div className="text-white text-xs font-semibold mb-0.5">{t.name}</div>
                <div className="text-slate-600 text-[10px]">{t.category}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
