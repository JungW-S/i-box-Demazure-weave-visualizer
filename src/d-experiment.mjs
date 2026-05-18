import {
  buildTrace,
  randomExample,
  standardHalfTwistWord,
} from "./core.mjs";
import { renderTrace } from "./render.mjs?v=20260518-pinning";

const form = document.querySelector("#input-form");
const rankInput = document.querySelector("#rank-input");
const rInput = document.querySelector("#r-input");
const uInput = document.querySelector("#u-input");
const rxwInput = document.querySelector("#rxw-input");
const lrInput = document.querySelector("#lr-input");
const output = document.querySelector("#output");
const errorBox = document.querySelector("#error-box");
const randomButton = document.querySelector("#random-button");

const defaultDExample = {
  family: "D",
  rank: "4",
  r: "4",
  u: "1 2 3 4",
  rxw: standardHalfTwistWord(4, "D").join(" "),
  lr: "R R R",
};

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

function refreshHalfTwistWord() {
  try {
    const rank = Number.parseInt(rankInput.value, 10);
    if (!Number.isInteger(rank) || rank < 4) return;
    rxwInput.value = standardHalfTwistWord(rank, "D").join(" ");
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
      rank: params.get("rank") ?? params.get("n") ?? defaultDExample.rank,
      r: params.get("r") ?? defaultDExample.r,
    });
  }
  const hasDirectInput = ["rank", "n", "u", "rxw", "lr"].some((key) => params.has(key));
  if (!hasDirectInput) return defaultDExample;
  const u = params.get("u") ?? defaultDExample.u;
  return {
    family: "D",
    rank: params.get("rank") ?? params.get("n") ?? defaultDExample.rank,
    r: params.get("r") ?? String(u.trim().split(/\s+/).filter(Boolean).length || defaultDExample.r),
    u,
    rxw: params.get("rxw") ?? defaultDExample.rxw,
    lr: params.get("lr") ?? defaultDExample.lr,
  };
}

function syncInputUrl(trace, { preserveDetail = false } = {}) {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("random");
  url.searchParams.delete("n");
  url.searchParams.delete("c");
  url.searchParams.delete("family");
  url.searchParams.delete("type");
  url.searchParams.set("rank", String(trace.rank));
  url.searchParams.set("r", String(trace.u.length));
  url.searchParams.set("u", trace.u.join(" "));
  url.searchParams.set("rxw", trace.rxw.join(" "));
  url.searchParams.set("lr", trace.lr.join(" "));
  if (!preserveDetail) {
    url.searchParams.delete("cluster");
    url.searchParams.delete("detail");
  }
  window.history.replaceState(null, "", url);
}

function clearDetailUrl() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("cluster");
  url.searchParams.delete("detail");
  window.history.replaceState(null, "", url);
}

function runConstruction(options = {}) {
  try {
    clearError();
    const trace = buildTrace(readInput());
    rInput.value = String(trace.u.length);
    if (!options.preserveDetail) clearDetailUrl();
    renderTrace(trace, output);
    if (options.syncUrl !== false) syncInputUrl(trace, options);
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
    writeInput(randomExample({
      family: "D",
      rank: rankInput.value,
      r: rInput.value,
    }));
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
runConstruction({
  preserveDetail: true,
  syncUrl: window.location.search !== "",
});
