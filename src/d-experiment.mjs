import {
  buildTrace,
  randomExample,
  standardHalfTwistWord,
} from "./core.mjs";
import { createDynkinDatum } from "./dynkin.mjs";
import { renderTrace } from "./render.mjs";

const form = document.querySelector("#input-form");
const rankInput = document.querySelector("#rank-input");
const rInput = document.querySelector("#r-input");
const uInput = document.querySelector("#u-input");
const rxwInput = document.querySelector("#rxw-input");
const lrInput = document.querySelector("#lr-input");
const output = document.querySelector("#output");
const errorBox = document.querySelector("#error-box");
const debugBox = document.querySelector("#debug-box");
const randomButton = document.querySelector("#random-button");
const datumSummary = document.querySelector("#datum-summary");
const presetButtons = document.querySelectorAll("[data-preset]");

const defaultDExample = {
  family: "D",
  rank: "4",
  r: "4",
  u: "1 2 3 4",
  rxw: standardHalfTwistWord(4, "D").join(" "),
  lr: "R R R",
};

const presetExamples = {
  default: defaultDExample,
  branching: {
    family: "D",
    rank: "4",
    r: "5",
    u: "2 1 3 4 2",
    rxw: standardHalfTwistWord(4, "D").join(" "),
    lr: "R R R R",
  },
  arm: {
    family: "D",
    rank: "4",
    r: "3",
    u: "1 2 1",
    rxw: standardHalfTwistWord(4, "D").join(" "),
    lr: "R R",
  },
};

function readRank() {
  const rank = Number.parseInt(rankInput.value, 10);
  if (rank !== 4) {
    throw new Error("This page is currently restricted to type D_4.");
  }
  return rank;
}

function readInput() {
  return {
    family: "D",
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

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function updateDatumSummary() {
  try {
    const rank = readRank();
    const datum = createDynkinDatum({ family: "D", rank });
    const edges = datum.edges.map(([from, to]) => `${from}-${to}`).join(", ");
    const star = Array.from(datum.star.entries()).map(([from, to]) => `${from}*=${to}`).join(", ");
    datumSummary.textContent = `${datum.label}: |Δ|=${datum.standardHalfTwistWord.length}; edges ${edges}; ${star}`;
  } catch (error) {
    datumSummary.textContent = error.message;
  }
}

function refreshHalfTwistWord() {
  try {
    rxwInput.value = standardHalfTwistWord(readRank(), "D").join(" ");
    updateDatumSummary();
  } catch (error) {
    setError(error.message);
  }
}

function inputFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const wantsRandom = ["1", "true", "yes"].includes(String(params.get("random") ?? "").toLowerCase());
  if (wantsRandom) {
    return randomExample({
      family: "D",
      rank: defaultDExample.rank,
      r: params.get("r") ?? defaultDExample.r,
    });
  }
  const hasDirectInput = ["rank", "n", "u", "rxw", "lr"].some((key) => params.has(key));
  if (!hasDirectInput) return defaultDExample;
  const u = params.get("u") ?? defaultDExample.u;
  return {
    family: "D",
    rank: defaultDExample.rank,
    r: params.get("r") ?? String(u.trim().split(/\s+/).filter(Boolean).length || defaultDExample.r),
    u,
    rxw: params.get("rxw") ?? defaultDExample.rxw,
    lr: params.get("lr") ?? defaultDExample.lr,
  };
}

function syncInputUrl(trace) {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("random");
  url.searchParams.delete("n");
  url.searchParams.set("rank", String(trace.rank));
  url.searchParams.set("r", String(trace.u.length));
  url.searchParams.set("u", trace.u.join(" "));
  url.searchParams.set("rxw", trace.rxw.join(" "));
  url.searchParams.set("lr", trace.lr.join(" "));
  window.history.replaceState(null, "", url);
}

function renderDebug(trace, elapsedMs) {
  const items = [
    ["type", trace.dynkin.label],
    ["|Δ|", String(trace.rxw.length)],
    ["|i|", String(trace.u.length)],
    ["initial c", String(trace.c)],
    ["trivalent vertices", String(trace.bottomWeave.clusterValues.length)],
    ["time", `${elapsedMs}ms`],
  ];
  debugBox.replaceChildren(...items.map(([label, value]) => {
    const item = document.createElement("div");
    item.className = "status-item";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    return item;
  }));
}

function runConstruction({ syncUrl = true } = {}) {
  try {
    clearError();
    const t0 = performance.now();
    const trace = buildTrace(readInput());
    const elapsedMs = Math.round(performance.now() - t0);
    rInput.value = String(trace.u.length);
    renderDebug(trace, elapsedMs);
    renderTrace(trace, output);
    if (syncUrl) syncInputUrl(trace);
  } catch (error) {
    setError(error.message);
    debugBox.textContent = "construction failed";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runConstruction();
});

randomButton.addEventListener("click", () => {
  try {
    clearError();
    writeInput(randomExample({
      family: "D",
      rank: defaultDExample.rank,
      r: rInput.value,
    }));
    updateDatumSummary();
    runConstruction();
  } catch (error) {
    setError(error.message);
  }
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const preset = presetExamples[button.dataset.preset];
    if (!preset) return;
    clearError();
    writeInput(preset);
    updateDatumSummary();
    runConstruction();
  });
});

rankInput.addEventListener("change", () => {
  clearError();
  refreshHalfTwistWord();
});

writeInput(inputFromUrl());
updateDatumSummary();
runConstruction({ syncUrl: window.location.search !== "" });
