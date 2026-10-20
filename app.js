// Gate Board — reads the JSON files of this repository and draws the board.
// ⚠ You don't need to edit this file. Read MISSION.md: every task is a change in a JSON file.
"use strict";

const SLOTS = [1, 2, 3, 4];               // hunters/hunter-1.json … hunter-4.json
const MIN_HUNTERS = 3;                    // a squad needs at least 3 registered hunters
const RANKS = ["E", "D", "C", "B", "A", "S"];
const REFRESH_SECONDS = 15;
// Which squad repo this board shows: ?repo=owner/name (board hosted on missions.skillntell.com), or the
// GitHub Pages address itself (owner.github.io/name).
const REPO_Q = new URLSearchParams(location.search).get("repo") || "";
const ON_PAGES = location.hostname.endsWith("github.io");
const GH = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(REPO_Q) ? { owner: REPO_Q.split("/")[0], repo: REPO_Q.split("/")[1] }
  : ON_PAGES ? { owner: location.hostname.split(".")[0], repo: location.pathname.split("/").filter(Boolean)[0] } : null;
const LIVE = !!(GH && GH.repo) || window.__GATEBOARD_LIVE__ === true;   // live = reading the repo's main on GitHub

// Fragments of the Association's message. They unlock on the live board only.
const F = { 1: "Iz83IS0NKzogICQx", 2: "KiwzJTF+", 3: "J0kmITVuJg==", 4: "LydSOz1+NyA8LQ==", 5: "Jzs7IDE=" };
const K = "first-contact";
const reveal = (b64) => { const s = atob(b64); let o = ""; for (let i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ K.charCodeAt(i % K.length)); return o; };
const fnv = (s) => { let h = 0x811c9dc5; for (const b of new TextEncoder().encode(s)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
const seal = (t) => { const A = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; const v = fnv("skilltell|" + t) >>> 2; let s = ""; for (let i = 0; i < 6; i++) s += A[(v >>> (5 * (5 - i))) & 31]; return s.slice(0, 3) + "-" + s.slice(3); };

const $ = (id) => document.getElementById(id);
const html = (id, h) => { const el = $(id); if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; } }; // redraw only what changed
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Where the data comes from: `main` read straight from GitHub (latest commit → that commit's files), so a merge
// shows up within a minute — no deploy involved. If GitHub's API says "slow down" (60 calls/hour per network),
// we read main's raw files instead for 10 minutes (GitHub caches those, so it can lag a few minutes).
let apiPausedUntil = 0, BASE = "", BUST = false, SOURCE = "local files";
async function resolveMain() {
  BASE = ""; BUST = false; SOURCE = "local files";
  if (!GH || !GH.repo) return;
  const fallback = () => { if (ON_PAGES) { SOURCE = "deployed copy (GitHub busy)"; } else { BASE = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/main/`; BUST = true; SOURCE = "main (GitHub busy, may lag a few minutes)"; } };
  if (Date.now() < apiPausedUntil) return fallback();
  try {
    // conditional request (ETag): an unchanged main answers 304, which doesn't count against the rate limit
    const r = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}/commits/main`, { headers: { Accept: "application/vnd.github.sha" }, cache: "no-cache" });
    if (r.ok) { const sha = (await r.text()).trim(); if (/^[0-9a-f]{40}$/.test(sha)) { BASE = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${sha}/`; SOURCE = `main @ ${sha.slice(0, 7)}`; return; } }
    if (r.status === 403 || r.status === 429) apiPausedUntil = Date.now() + 10 * 60 * 1000;
  } catch { /* offline or blocked */ }
  fallback();
}

/** Fetch a JSON file of the repo, bypassing caches. Explains broken JSON like a teammate would. */
async function load(path) {
  let res;
  try { res = await fetch(BASE && !BUST ? BASE + path : `${BASE}${path}?t=${Date.now()}`, BASE && !BUST ? {} : { cache: "no-store" }); }
  catch { return { state: "offline" }; }
  if (res.status === 404) return { state: "missing" };
  if (!res.ok) return { state: "error", error: `HTTP ${res.status}` };
  const text = await res.text();
  try { return { state: "ok", data: JSON.parse(text) }; }
  catch (e) { return { state: "broken", error: whereBroken(e, text) }; }
}
function whereBroken(e, text) {
  const m = /line (\d+)/i.exec(e.message);
  const p = /position (\d+)/i.exec(e.message);
  const n = m ? Number(m[1]) : p ? text.slice(0, Number(p[1])).split("\n").length : 0;
  return n ? `invalid JSON near line ${n} — check the end of line ${Math.max(1, n - 1)} too` : "invalid JSON";
}

function checkHunter(slot, r) {
  if (r.state === "missing") return { slot, empty: true };
  if (r.state !== "ok") return { slot, problems: [`hunter-${slot}.json: ${r.error || r.state}`] };
  const h = r.data || {};
  const problems = [];
  const gh = String(h.github || "").trim().replace(/^@/, "");
  if (!String(h.name || "").trim() || /your name/i.test(h.name)) problems.push("write your real name in \"name\"");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(gh) || /your-github/i.test(gh)) problems.push("\"github\" must be your GitHub username");
  if (!RANKS.includes(String(h.rank || "").toUpperCase())) problems.push("\"rank\" must be one of E D C B A S");
  if (!String(h.class || "").trim()) problems.push("choose a \"class\"");
  return { slot, h: { ...h, github: gh, rank: String(h.rank || "").toUpperCase() }, problems };
}

async function tick() {
  await resolveMain();
  const [guild, gates, settings, red, ...hunterFiles] = await Promise.all([
    load("data/guild.json"), load("data/gates.json"), load("config/settings.json"), load("data/red-gate.json"),
    ...SLOTS.map((n) => load(`hunters/hunter-${n}.json`)),
  ]);

  if (guild.state === "offline") {
    $("sync").textContent = "Can't read the data files. Open this page with VS Code Live Server (or the live GitHub Pages URL), not by double-clicking it.";
    return;
  }

  // ---- hunters (Issue #1)
  const hunters = hunterFiles.map((r, i) => checkHunter(SLOTS[i], r));
  const valid = hunters.filter((x) => x.h && x.problems.length === 0);
  const handles = new Set(valid.map((x) => x.h.github.toLowerCase()));
  html("hunters", hunters.map((x) => {
    if (x.empty) return `<article class="card empty"><div class="slot">HUNTER ${x.slot}</div><p>Slot open — create <code>hunters/hunter-${x.slot}.json</code></p></article>`;
    if (!x.h) return `<article class="card bad"><div class="slot">HUNTER ${x.slot}</div><p>⚠ ${esc(x.problems[0])}</p></article>`;
    const h = x.h;
    return `<article class="card ${x.problems.length ? "bad" : ""}">
      <img class="avatar" src="https://github.com/${esc(h.github)}.png?size=120" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'avatar ph',textContent:'${esc((h.name || "?")[0] || "?")}'}))">
      <div class="who"><div class="slot">HUNTER ${x.slot}</div><strong>${esc(h.name)}</strong><span>@${esc(h.github)} · ${esc(h.class)}</span>${h.motto ? `<em>“${esc(h.motto)}”</em>` : ""}</div>
      <div class="rank r-${esc(h.rank)}">${esc(h.rank || "?")}</div>
      ${x.problems.length ? `<p class="problems">⚠ ${x.problems.map(esc).join(" · ")}</p>` : ""}
    </article>`;
  }).join(""));

  // ---- gates (Issue #2)
  const gatesOk = gates.state === "ok" && Array.isArray(gates.data) && gates.data.length > 0;
  html("gates", gatesOk
    ? gates.data.map((g) => `<div class="gate r-${esc(g.rank)} ${settings.data?.alertSystem === true && ["S", "A"].includes(g.rank) ? "pulse" : ""}">
        <span class="rank r-${esc(g.rank)}">${esc(g.rank)}</span>
        <div><strong>${esc(g.name)}</strong><span>${esc(g.location)}</span></div>
        <span class="state">${esc(g.status)}</span></div>`).join("")
    : `<div class="broken">⛔ THE BOARD IS DOWN<br><small>data/gates.json · ${esc(gates.error || gates.state)}</small></div>`);

  // ---- alert system (Issue #3)
  const alertOn = settings.state === "ok" && settings.data?.alertSystem === true;
  $("alert").className = `chip ${alertOn ? "on" : "off"}`;
  $("alert").textContent = alertOn ? "● ALERT SYSTEM ONLINE" : "○ ALERT SYSTEM OFFLINE";
  const ticker = $("ticker");
  ticker.hidden = !alertOn;
  if (alertOn && gatesOk) {
    const hot = gates.data.filter((g) => ["S", "A"].includes(g.rank));
    ticker.innerHTML = `<span>⚠ MONITORING ${gates.data.length} GATES · ${hot.length} HIGH-RANK · ${hot.map((g) => esc(g.name)).join(" · ")} · STAY ALERT, HUNTERS ·</span>`;
  }

  // ---- guild (Issue #4)
  const gname = String(guild.data?.name || "").trim();
  const motto = String(guild.data?.motto || "").trim();
  const guildOk = guild.state === "ok" && gname && gname.toUpperCase() !== "UNNAMED GUILD" && motto.length > 0;
  $("guild-name").textContent = gname || "UNNAMED GUILD";
  $("guild-name").classList.toggle("dim", !guildOk);
  $("guild-motto").textContent = guild.state === "ok" ? motto || "No motto yet." : `data/guild.json · ${guild.error || guild.state}`;
  document.title = `${gname || "Gate Board"} · Gate Board`;

  // ---- red gate (Issue #5 — appears during the mission)
  const redExists = red.state !== "missing";
  const rg = red.data || {};
  const assigned = String(rg.assignedHunter || "").trim().replace(/^@/, "").toLowerCase();
  const redOk = red.state === "ok" && rg.sealed === true && handles.has(assigned);
  const banner = $("redgate");
  banner.hidden = !redExists;
  if (redExists) {
    banner.className = `redgate ${redOk ? "sealed" : "open"}`;
    banner.innerHTML = redOk
      ? `✦ RED GATE SEALED by @${esc(assigned)} — the city is safe.`
      : red.state !== "ok" ? `🚨 RED GATE · data/red-gate.json · ${esc(red.error || red.state)}`
      : `🚨 RED GATE BREACH · ${esc(rg.location || "")} · rank ${esc(rg.rank || "S")} — assign a registered hunter and seal it (Issue #5)`;
  }

  // ---- mission control
  const rows = [
    { n: 1, title: "Register the hunters", who: "Every hunter", ok: valid.length >= MIN_HUNTERS && handles.size === valid.length, why: `${valid.length}/${MIN_HUNTERS}+ valid hunter cards` },
    { n: 2, title: "Repair the Gate Board", who: "Hunter 2", ok: gatesOk, why: gatesOk ? `${gates.data.length} gates online` : "data/gates.json is broken" },
    { n: 3, title: "Switch on the alert system", who: "Hunter 3", ok: alertOn, why: alertOn ? "alert system online" : "config/settings.json → alertSystem" },
    { n: 4, title: "Name your guild", who: "Hunter 1", ok: guildOk, why: guildOk ? `“${gname}”` : "data/guild.json → name + motto" },
  ];
  if (redExists) rows.push({ n: 5, title: "Seal the Red Gate", who: "Hunter 4 (squad of 3: Hunter 1)", ok: redOk, why: redOk ? `sealed by @${assigned}` : "data/red-gate.json → a registered hunter, sealed: true", red: true });
  html("control", rows.map((r) => `<li class="${r.ok ? "done" : ""} ${r.red ? "red" : ""}">
      <span class="tick">${r.ok ? "✔" : "·"}</span>
      <div><strong>Issue #${r.n} · ${esc(r.title)}</strong><small>${esc(r.who)} · ${esc(r.why)}</small></div>
      <code class="frag">${r.ok ? (LIVE ? esc(reveal(F[r.n])) : "LIVE ONLY") : "▒▒▒▒▒▒"}</code>
    </li>`).join("") + (redExists ? "" : `<li class="classified"><span class="tick">?</span><div><strong>Issue #5 · CLASSIFIED</strong><small>Keep your <code>main</code> up to date. Something is coming.</small></div><code class="frag">▒▒▒▒▒▒</code></li>`));

  const all = rows.length === 5 && rows.every((r) => r.ok);
  const sealBox = $("seal");
  sealBox.hidden = !all;
  if (all) {
    const msg = [1, 2, 3, 4].map((n) => reveal(F[n])).join(" ") + ". " + reveal(F[5]) + ".";
    html("seal", LIVE
      ? `<p>GATE CLEARED</p><blockquote>${esc(msg)}</blockquote><div class="code">CLEARANCE SEAL <b>${seal("J01|GATE|" + msg)}</b></div><small>Submit it on the mission platform — first squad wins.</small>`
      : `<p>ALL ISSUES DONE LOCALLY</p><small>Now ship it: merge to <b>main</b> on GitHub and open the live board.</small>`);
  }

  $("mode").className = `chip ${LIVE ? "on" : "local"}`;
  $("mode").textContent = LIVE ? `● LIVE · ${GH ? GH.repo : "main"}` : "◌ LOCAL PREVIEW";
  $("sync").textContent = `Synced ${new Date().toLocaleTimeString()} · reading ${SOURCE} · refreshes every ${REFRESH_SECONDS}s`;
}

tick();
setInterval(tick, REFRESH_SECONDS * 1000);
