import {
  formatDoubleStringEntry,
  intervalTextForDisplay,
  makeAdmissibleChain,
  makeDoubleString,
  parseIntegerSequence,
  parseLRSequence,
  parsePositiveInteger,
  summarizeDoubleString,
} from "./core.mjs?v=20260702-b-type";
import {
  createDynkinDatum,
} from "./dynkin.mjs?v=20260702-b-type";

function standardHalfTwistWord(rank, family = "B") {
  return createDynkinDatum({ family, rank }).standardHalfTwistWord.slice();
}

const form = document.querySelector("#input-form");
const rankInput = document.querySelector("#rank-input");
const rInput = document.querySelector("#r-input");
const uInput = document.querySelector("#u-input");
const rxwInput = document.querySelector("#rxw-input");
const lrInput = document.querySelector("#lr-input");
const output = document.querySelector("#output");
const errorBox = document.querySelector("#error-box");
const randomButton = document.querySelector("#random-button");

const defaultBExample = {
  family: "B",
  rank: "3",
  r: "4",
  u: "2 3 2 1",
  rxw: standardHalfTwistWord(3, "B").join(" "),
  lr: "L R R",
};

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function randomInteger(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function parseOptionalPositiveInteger(value, name, fallback) {
  const text = String(value ?? "").trim();
  return text === "" ? fallback : parsePositiveInteger(text, name);
}

function sequenceText(sequence) {
  return `(${sequence.join(", ")})`;
}

function intervalText(interval) {
  return interval === null ? "1" : intervalTextForDisplay(interval);
}

function dSymbol(interval) {
  if (interval === null) return "1";
  return `D${intervalTextForDisplay(interval)}`;
}

function dPowerSymbol(interval, exponent) {
  const base = dSymbol(interval);
  if (base === "1" || exponent === 1) return base;
  return `${base}^${exponent}`;
}

function multiplySymbols(...symbols) {
  const useful = symbols.filter((symbol) => symbol !== "1");
  return useful.length === 0 ? "1" : useful.join(" ");
}

function expressionAtom(expr) {
  return /^[A-Za-z0-9_]+(\^[0-9]+)?$/.test(String(expr));
}

function wrapExpression(expr) {
  return expressionAtom(expr) ? expr : `(${expr})`;
}

function multiplyExpressions(...factors) {
  const useful = factors.filter((factor) => factor !== "1");
  if (useful.length === 0) return "1";
  return useful.map(wrapExpression).join("*");
}

function powerExpression(expr, exponent) {
  if (exponent === 1) return expr;
  if (expr === "1") return "1";
  return `${wrapExpression(expr)}^${exponent}`;
}

function subtractExpressions(left, right) {
  if (right === "0") return left;
  if (left === "0") return `-${wrapExpression(right)}`;
  return `${wrapExpression(left)} - ${wrapExpression(right)}`;
}

function divideExpression(numerator, denominator) {
  if (denominator === "1") return numerator;
  return `${wrapExpression(numerator)}/${wrapExpression(denominator)}`;
}

function strictlyNextSameColor(u, index) {
  const color = u[index - 1];
  for (let pos = index + 1; pos <= u.length; pos += 1) {
    if (u[pos - 1] === color) return pos;
  }
  return Infinity;
}

function strictlyPreviousSameColor(u, index) {
  const color = u[index - 1];
  for (let pos = index - 1; pos >= 1; pos -= 1) {
    if (u[pos - 1] === color) return pos;
  }
  return -Infinity;
}

function nearestColorRight(u, index, color) {
  for (let pos = index; pos <= u.length; pos += 1) {
    if (u[pos - 1] === color) return pos;
  }
  return Infinity;
}

function nearestColorLeft(u, index, color) {
  for (let pos = index; pos >= 1; pos -= 1) {
    if (u[pos - 1] === color) return pos;
  }
  return -Infinity;
}

function normalizeInterval(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right) || left > right) return null;
  return [left, right];
}

function intervalKey(interval) {
  return interval === null ? "empty" : `${interval[0]},${interval[1]}`;
}

function computeIBoxElements({ datum, u, chain }) {
  const memo = new Map();

  function correctionIntervals(a, b, color) {
    const row = datum.cartan[color - 1];
    const out = [];
    row.forEach((entry, idx) => {
      if (entry >= 0) return;
      const adjacentColor = idx + 1;
      out.push({
        color: adjacentColor,
        exponent: -entry,
        interval: normalizeInterval(
          nearestColorRight(u, a, adjacentColor),
          nearestColorLeft(u, b, adjacentColor),
        ),
      });
    });
    return out;
  }

  function compute(interval) {
    if (interval === null) {
      return {
        interval,
        expression: "1",
        tSystem: "empty interval",
        correctionItems: [],
      };
    }
    const key = intervalKey(interval);
    if (memo.has(key)) return memo.get(key);
    const [a, b] = interval;
    const color = u[a - 1];
    if (u[b - 1] !== color) {
      throw new Error(`${intervalTextForDisplay(interval)} is not an i-box.`);
    }

    let value;
    if (a === b) {
      value = {
        interval,
        color,
        expression: `F_${a}`,
        tSystem: `${dSymbol(interval)} = F_${a}`,
        correctionItems: [],
      };
    } else {
      const inner = normalizeInterval(strictlyNextSameColor(u, a), strictlyPreviousSameColor(u, b));
      const left = normalizeInterval(strictlyNextSameColor(u, a), b);
      const right = normalizeInterval(a, strictlyPreviousSameColor(u, b));
      const correctionItems = correctionIntervals(a, b, color);

      const leftValue = compute(left);
      const rightValue = compute(right);
      const innerValue = compute(inner);
      const correctionFactors = correctionItems.map((item) => (
        powerExpression(compute(item.interval).expression, item.exponent)
      ));
      const correctionExpression = multiplyExpressions(...correctionFactors);
      const correctionText = correctionItems
        .map((item) => dPowerSymbol(item.interval, item.exponent))
        .filter((symbol) => symbol !== "1")
        .join(" * ") || "1";
      const numerator = subtractExpressions(
        multiplyExpressions(leftValue.expression, rightValue.expression),
        correctionExpression,
      );
      value = {
        interval,
        color,
        inner,
        left,
        right,
        expression: divideExpression(numerator, innerValue.expression),
        tSystem: `${multiplySymbols(dSymbol(interval), dSymbol(inner))} = ${multiplySymbols(dSymbol(left), dSymbol(right))} - ${correctionText}`,
        correctionItems,
        correctionExpression,
      };
    }
    memo.set(key, value);
    return value;
  }

  return {
    rows: chain.rows.map((row) => ({
      t: row.t,
      interval: row.box.slice(),
      color: row.color,
      frozen: row.frozen,
      value: compute(row.box),
    })),
  };
}

function coxeterBraidLength(datum, i, j) {
  if (i === j) return 1;
  const product = datum.cartan[i - 1][j - 1] * datum.cartan[j - 1][i - 1];
  if (product === 0) return 2;
  if (product === 1) return 3;
  if (product === 2) return 4;
  if (product === 3) return 6;
  return "?";
}

function buildBTrace(input) {
  const rank = parsePositiveInteger(input.rank, "rank");
  const datum = createDynkinDatum({ family: "B", rank });
  const u = parseIntegerSequence(input.u, "i");
  const rxw = parseIntegerSequence(input.rxw, "Delta");
  const lr = parseLRSequence(input.lr);
  const c = lr.filter((move) => move === "L").length + 1;
  const chain = makeAdmissibleChain({ datum, u, c, lr });
  const doubleString = makeDoubleString({ datum, rxw, chain });
  return {
    family: "B",
    rank,
    dynkin: datum,
    u,
    rxw,
    lr,
    c,
    chain,
    iBoxElements: computeIBoxElements({ datum, u, chain }),
    doubleString,
    doubleSummary: summarizeDoubleString(doubleString, rxw.length),
  };
}

function renderCard(title, subtitle = "") {
  const card = el("section", "card b-card");
  card.appendChild(el("h2", "", title));
  if (subtitle) card.appendChild(el("p", "card-subtitle", subtitle));
  return card;
}

function renderSequencePanel(trace) {
  const card = renderCard(`Type B_${trace.rank} input data`);
  const panel = el("div", "answer-panel b-answer-panel");
  const grid = el("div", "b-summary-grid");
  [
    ["i", sequenceText(trace.u)],
    ["Delta", sequenceText(trace.rxw)],
    ["LR", sequenceText(trace.lr)],
    ["c", String(trace.c)],
    ["i*", Array.from(trace.dynkin.star.entries()).map(([i, s]) => `${i}->${s}`).join(", ")],
  ].forEach(([label, value]) => {
    const item = el("div", "b-summary-item");
    item.appendChild(el("span", "summary-label", label));
    item.appendChild(el("span", "b-summary-value", value));
    grid.appendChild(item);
  });
  panel.appendChild(grid);
  panel.appendChild(renderCartanMatrix(trace));
  card.appendChild(panel);
  return card;
}

function renderCartanMatrix(trace) {
  const wrap = el("div", "b-table-wrap");
  const title = el("div", "b-subtitle", "Cartan matrix");
  const table = el("table", "exchange-matrix-table b-cartan-table");
  const body = el("tbody");
  trace.dynkin.cartan.forEach((row) => {
    const tr = el("tr");
    row.forEach((entry) => tr.appendChild(el("td", "", String(entry))));
    body.appendChild(tr);
  });
  table.appendChild(body);
  wrap.append(title, table);
  return wrap;
}

function renderChainPanel(trace) {
  const card = renderCard("Admissible chain");
  const panel = el("div", "answer-panel b-answer-panel");
  const note = el("p", "small-note");
  note.textContent = "The LR sequence determines the envelopes, i-boxes, effective ends, and the double-string side L/R.";
  panel.appendChild(note);

  const table = el("table", "b-data-table");
  const head = el("thead");
  const headRow = el("tr");
  ["t", "H_{t-1}", "envelope", "i-box c_t", "color", "h_t", "side", "frozen"].forEach((label) => {
    headRow.appendChild(el("th", "", label));
  });
  head.appendChild(headRow);
  const body = el("tbody");
  trace.chain.rows.forEach((row) => {
    const tr = el("tr");
    [
      row.t,
      row.previousMove,
      intervalTextForDisplay(row.envelope),
      intervalTextForDisplay(row.box),
      row.color,
      row.h,
      row.side,
      row.frozen ? "yes" : "",
    ].forEach((value) => tr.appendChild(el("td", "", String(value))));
    body.appendChild(tr);
  });
  table.append(head, body);
  panel.appendChild(table);
  card.appendChild(panel);
  return card;
}

function renderIBoxElementsPanel(trace) {
  const card = renderCard("i-box elements from the T-system");
  const panel = el("div", "answer-panel b-answer-panel");
  const note = el("p", "small-note");
  note.textContent = "Singleton boxes are initialized by F_k. Non-singleton boxes use the finite type T-system with Cartan multiplicities -c_ij.";
  panel.appendChild(note);

  const list = el("div", "cluster-answer-list determinantial-list");
  trace.iBoxElements.rows.forEach((row) => {
    const item = el("div", row.frozen ? "cluster-answer-item frozen" : "cluster-answer-item");
    const label = el("span", "cluster-answer-label");
    label.textContent = `D_${row.t}`;
    item.appendChild(label);
    const content = el("div", "cluster-answer-content");
    content.appendChild(el("span", "cluster-answer-expression", `${dSymbol(row.interval)} = ${row.value.expression}`));
    content.appendChild(el("span", "cluster-answer-meta", row.value.tSystem));
    item.appendChild(content);
    list.appendChild(item);
  });
  panel.appendChild(list);
  card.appendChild(panel);
  return card;
}

function renderDoubleStringPanel(trace) {
  const card = renderCard("Double string and boundary word");
  const body = el("div", "double-string-block b-double-string-block");
  const panel = el("div", "string-construction-panel");
  const note = el("p", "double-string-rule-note");
  note.textContent = "The double string is defined exactly as in the ADE construction.";
  panel.appendChild(note);

  const expression = el("div", "double-string-expression");
  expression.appendChild(el("span", "formula", "s_Delta(C) = "));
  const chips = el("div", "double-string-chips");
  trace.doubleString.forEach((entry) => {
    const chip = el(
      "span",
      entry.source === "rxw"
        ? "double-string-chip prefix"
        : `double-string-chip chain ${entry.side === "L" ? "side-l" : "side-r"}`,
      formatDoubleStringEntry(entry),
    );
    chips.appendChild(chip);
  });
  expression.appendChild(chips);
  panel.appendChild(expression);

  const boundary = el("div", "b-boundary-word");
  boundary.appendChild(el("span", "summary-label", "i_Delta(C)"));
  boundary.appendChild(el("span", "b-summary-value", sequenceText(trace.doubleSummary.uiSequence)));
  panel.appendChild(boundary);
  body.appendChild(panel);
  card.appendChild(body);
  return card;
}

function renderWeaveConstructionPanel(trace) {
  const card = renderCard("B-type weave construction");
  const panel = el("div", "answer-panel b-answer-panel");
  const braidRows = [];
  for (let i = 1; i <= trace.rank; i += 1) {
    for (let j = i + 1; j <= trace.rank; j += 1) {
      const m = coxeterBraidLength(trace.dynkin, i, j);
      if (m === 2 && Math.abs(i - j) > 1) continue;
      braidRows.push([`${i}, ${j}`, String(m), `${2 * m}-valent`]);
    }
  }

  const steps = el("div", "b-construction-steps");
  [
    ["Top weave", "W^T_Delta(C): Delta i -> i_Delta(C) is a braid-move-only weave. In type B it may use the 8-valent vertex for the double edge."],
    ["Bottom weave", "W^B_Delta(C) is the double inductive weave attached to s_Delta(C). Non-additive double-string steps create trivalent vertices."],
    ["Full weave", "W_Delta(C) = W^B_Delta(C) circ W^T_Delta(C). The construction exists formally for finite type B."],
  ].forEach(([title, text]) => {
    const item = el("div", "b-construction-step");
    item.appendChild(el("span", "summary-label", title));
    item.appendChild(el("p", "", text));
    steps.appendChild(item);
  });
  panel.appendChild(steps);

  const table = el("table", "b-data-table b-braid-table");
  const head = el("thead");
  const trh = el("tr");
  ["colors", "m(i,j)", "local braid vertex"].forEach((label) => trh.appendChild(el("th", "", label)));
  head.appendChild(trh);
  const body = el("tbody");
  braidRows.forEach((row) => {
    const tr = el("tr");
    row.forEach((value) => tr.appendChild(el("td", "", value)));
    body.appendChild(tr);
  });
  table.append(head, body);
  panel.appendChild(table);
  card.appendChild(panel);
  return card;
}

function renderPendingPanel() {
  const card = renderCard("Pinning-dependent data");
  const panel = el("div", "answer-panel b-answer-panel pending-panel");
  const note = el("p", "small-note");
  note.textContent = "These entries are intentionally blank until a type B pinning convention is fixed.";
  panel.appendChild(note);
  const list = el("div", "cluster-answer-list");
  [
    ["Pinning", "pending"],
    ["Weave coordinate variables", "not computed"],
    ["Cluster variable formulas from the weave", "not computed"],
    ["Coordinate substitution", "not computed"],
  ].forEach(([label, status]) => {
    const item = el("div", "cluster-answer-item");
    item.appendChild(el("span", "cluster-answer-label", label));
    const content = el("div", "cluster-answer-content");
    content.appendChild(el("span", "cluster-answer-meta", status));
    item.appendChild(content);
    list.appendChild(item);
  });
  panel.appendChild(list);
  card.appendChild(panel);
  return card;
}

function markStepSection(node, steps) {
  node.classList.add("step-section");
  steps.forEach((step) => node.classList.add(`step-${step}`));
  return node;
}

function renderStepSection(...cards) {
  const section = el("div");
  section.append(...cards);
  return section;
}

function renderConstructionStepper(root) {
  const controls = el("div", "construction-stepper");
  const sequence = el("div", "step-sequence");
  const tools = el("div", "step-view-tools");
  const buttons = new Map();
  const modes = [
    ["chain", "ℭ"],
    ["string", "s_Delta(ℭ)"],
    ["whole", "𝒲_Delta(ℭ)"],
    ["pending", "Pinning pending"],
  ];

  function setMode(mode) {
    root.classList.remove(
      "step-active-chain",
      "step-active-string",
      "step-active-whole",
      "step-active-compare",
      "step-active-pending",
    );
    root.classList.add(`step-active-${mode}`);
    buttons.forEach((button, key) => button.classList.toggle("active", key === mode));
  }

  modes.forEach(([mode, label], idx) => {
    const button = el("button", "step-button", label);
    button.type = "button";
    button.addEventListener("click", () => setMode(mode));
    buttons.set(mode, button);
    sequence.appendChild(button);
    if (idx < modes.length - 1) sequence.appendChild(el("span", "step-arrow", "->"));
  });
  controls.append(sequence, tools);
  controls.setMode = setMode;
  setMode("chain");
  return controls;
}

function renderTrace(trace) {
  const root = el("div", "trace-view step-active-chain b-trace-view");
  const controls = renderConstructionStepper(root);
  root.append(
    controls,
    markStepSection(renderStepSection(
      renderSequencePanel(trace),
      renderChainPanel(trace),
      renderIBoxElementsPanel(trace),
    ), ["chain"]),
    markStepSection(renderDoubleStringPanel(trace), ["string"]),
    markStepSection(renderWeaveConstructionPanel(trace), ["whole"]),
    markStepSection(renderPendingPanel(), ["pending"]),
  );
  output.replaceChildren(root);
}

function readInput() {
  return {
    family: "B",
    rank: rankInput.value,
    u: uInput.value,
    rxw: rxwInput.value,
    lr: lrInput.value,
  };
}

function writeInput(values) {
  rankInput.value = values.rank;
  rInput.value = values.r;
  uInput.value = values.u;
  rxwInput.value = values.rxw;
  lrInput.value = values.lr;
}

function randomBExample() {
  const rank = parseOptionalPositiveInteger(rankInput.value, "rank", 3);
  const r = parseOptionalPositiveInteger(rInput.value, "r", Math.max(4, rank + 2));
  const u = Array.from({ length: r }, () => randomInteger(1, rank));
  const lr = Array.from({ length: r - 1 }, () => (Math.random() < 0.5 ? "L" : "R"));
  return {
    family: "B",
    rank: String(rank),
    r: String(r),
    u: u.join(" "),
    rxw: standardHalfTwistWord(rank, "B").join(" "),
    lr: lr.join(" "),
  };
}

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function refreshHalfTwistWord() {
  const rank = Number.parseInt(rankInput.value, 10);
  if (!Number.isInteger(rank) || rank < 2) return;
  rxwInput.value = standardHalfTwistWord(rank, "B").join(" ");
}

function inputFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const wantsRandom = ["1", "true", "yes"].includes(String(params.get("random") ?? "").toLowerCase());
  if (wantsRandom) return randomBExample();
  const hasDirectInput = ["rank", "n", "u", "rxw", "lr"].some((key) => params.has(key));
  if (!hasDirectInput) return defaultBExample;
  const u = params.get("u") ?? defaultBExample.u;
  return {
    family: "B",
    rank: params.get("rank") ?? params.get("n") ?? defaultBExample.rank,
    r: params.get("r") ?? String(u.trim().split(/\s+/).filter(Boolean).length || defaultBExample.r),
    u,
    rxw: params.get("rxw") ?? standardHalfTwistWord(
      Number.parseInt(params.get("rank") ?? params.get("n") ?? defaultBExample.rank, 10),
      "B",
    ).join(" "),
    lr: params.get("lr") ?? defaultBExample.lr,
  };
}

function syncInputUrl(trace) {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("random");
  url.searchParams.delete("n");
  url.searchParams.delete("family");
  url.searchParams.delete("type");
  url.searchParams.set("rank", String(trace.rank));
  url.searchParams.set("r", String(trace.u.length));
  url.searchParams.set("u", trace.u.join(" "));
  url.searchParams.set("rxw", trace.rxw.join(" "));
  url.searchParams.set("lr", trace.lr.join(" "));
  window.history.replaceState(null, "", url);
}

function runConstruction({ syncUrl = true } = {}) {
  try {
    clearError();
    const trace = buildBTrace(readInput());
    rInput.value = String(trace.u.length);
    renderTrace(trace);
    if (syncUrl) syncInputUrl(trace);
  } catch (error) {
    setError(error.message);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runConstruction();
});

randomButton.addEventListener("click", () => {
  try {
    clearError();
    writeInput(randomBExample());
    runConstruction();
  } catch (error) {
    setError(error.message);
  }
});

rankInput.addEventListener("change", () => {
  clearError();
  refreshHalfTwistWord();
});

writeInput(inputFromUrl());
runConstruction({ syncUrl: window.location.search !== "" });
