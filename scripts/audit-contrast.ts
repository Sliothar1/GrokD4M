/**
 * WCAG AA contrast for the navy palette on the cool paper.
 * Normal text needs 4.5:1. Large text and UI chrome need 3:1.
 */

function lin(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const paper = "#f4f6fb";
const ink = "#1a1215";
const navy = "#1c3a8f";
const navyDeep = "#142a68";
const muted = "#3a4560";
const white = "#ffffff";
const gold = "#f6e27a";
const goldInk = "#8a6d12";

const pairs: Array<{ name: string; fg: string; bg: string; min: number }> = [
  { name: "ink on paper", fg: ink, bg: paper, min: 4.5 },
  { name: "muted on paper", fg: muted, bg: paper, min: 4.5 },
  { name: "navy on paper", fg: navy, bg: paper, min: 4.5 },
  { name: "navy deep on paper", fg: navyDeep, bg: paper, min: 4.5 },
  { name: "gold ink on paper", fg: goldInk, bg: paper, min: 4.5 },
  { name: "gold on navy", fg: gold, bg: navy, min: 4.5 },
  { name: "white on navy", fg: white, bg: navy, min: 4.5 },
  { name: "white on navy deep", fg: white, bg: navyDeep, min: 4.5 },
  { name: "paper on navy", fg: paper, bg: navy, min: 4.5 },
];

let failed = 0;
for (const pair of pairs) {
  const ratio = contrast(pair.fg, pair.bg);
  const ok = ratio + 0.01 >= pair.min;
  console.log(`${ok ? "pass" : "FAIL"} ${pair.name}: ${ratio.toFixed(2)}:1 (min ${pair.min})`);
  if (!ok) failed++;
}

if (failed > 0) process.exit(1);
console.log("audit-contrast: ok");
