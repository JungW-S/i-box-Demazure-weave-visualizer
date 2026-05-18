import {
  buildTrace,
  defaultExample,
  randomExample,
  standardHalfTwistWord,
} from "./core.mjs";
import { renderTrace } from "./render.mjs";

const form = document.querySelector("#input-form");
const rankInput = document.querySelector("#rank-input");
const rInput = document.querySelector("#r-input");
const uInput = document.querySelector("#u-input");
const rxwInput = document.querySelector("#rxw-input");
const lrInput = document.querySelector("#lr-input");
const output = document.querySelector("#output");
const errorBox = document.querySelector("#error-box");
const randomButton = document.querySelector("#random-button");

function readInput() {
  return {
    family: "A",
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

function refreshHalfTwistWord() {
  try {
    const rank = Number.parseInt(rankInput.value, 10);
    if (!Number.isInteger(rank) || rank < 1) return;
    rxwInput.value = standardHalfTwistWord(rank).join(" ");
  } catch (error) {
    setError(error.message);
  }
}

function inputFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const wantsRandom = ["1", "true", "yes"].includes(String(params.get("random") ?? "").toLowerCase());
  if (wantsRandom) {
    return randomExample({
      rank: params.get("rank") ?? params.get("n"),
      r: params.get("r"),
    });
  }

  const hasDirectInput = ["rank", "n", "u", "rxw", "lr"].some((key) => params.has(key));
  if (!hasDirectInput) return defaultExample;
  const u = params.get("u") ?? defaultExample.u;
  return {
    family: "A",
    rank: params.get("rank") ?? params.get("n") ?? defaultExample.rank,
    r: params.get("r") ?? String(u.trim().split(/\s+/).filter(Boolean).length || defaultExample.r),
    u,
    rxw: params.get("rxw") ?? defaultExample.rxw,
    lr: params.get("lr") ?? defaultExample.lr,
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

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
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
