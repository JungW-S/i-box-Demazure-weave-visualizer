import {
  buildDoubleInductiveWeave,
  buildTopWeave,
  computeFullClusterValues,
  expandExpressionText,
} from "./weave.mjs";
import {
  createDynkinDatum,
  normalizeDynkinFamily,
  randomHalfTwistWordForDatum,
  validateSequenceInDynkin,
} from "./dynkin.mjs";

export const defaultExample = {
  family: "A",
  rank: 3,
  r: "6",
  u: "2 3 1 2 2 1",
  rxw: "1 2 1 3 2 1",
  c: "3",
  lr: "L R L R R",
};

function randomInteger(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function parseOptionalPositiveInteger(value, name, fallback) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return parsePositiveInteger(value, name);
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export function parseIntegerSequence(text, name = "sequence") {
  const normalized = String(text ?? "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/,/g, " ")
    .trim();
  if (normalized === "") return [];
  const tokens = normalized.split(/\s+/);
  return tokens.map((token) => {
    if (!/^[1-9][0-9]*$/.test(token)) {
      throw new Error(`${name} contains an invalid entry "${token}".`);
    }
    return Number.parseInt(token, 10);
  });
}

export function parseLRSequence(text) {
  const normalized = String(text ?? "")
    .replace(/\\mathcal\{L\}|\\calL|calL/g, " L ")
    .replace(/\\mathcal\{R\}|\\calR|calR/g, " R ")
    .replace(/[()[\]{},]/g, " ")
    .trim();
  if (normalized === "") return [];
  if (/^[LRlr\s]+$/.test(normalized)) {
    return normalized.replace(/\s+/g, "").toUpperCase().split("");
  }
  const tokens = normalized.split(/\s+/);
  return tokens.map((token) => {
    const value = token.toUpperCase();
    if (value !== "L" && value !== "R") {
      throw new Error(`LR sequence contains an invalid entry "${token}".`);
    }
    return value;
  });
}

export function parsePositiveInteger(text, name) {
  const value = Number.parseInt(String(text ?? "").trim(), 10);
  assertPositiveInteger(value, name);
  return value;
}

function previousOrSameWithColor(u, position, color) {
  for (let idx = position; idx >= 1; idx -= 1) {
    if (u[idx - 1] === color) return idx;
  }
  return null;
}

function nextOrSameWithColor(u, position, color) {
  for (let idx = position; idx <= u.length; idx += 1) {
    if (u[idx - 1] === color) return idx;
  }
  return null;
}

export function starA(index, rank) {
  const datum = createDynkinDatum({ family: "A", rank });
  assertPositiveInteger(index, "index");
  if (index > rank) throw new Error(`index ${index} is outside type A_${rank}.`);
  return datum.star.get(index);
}

export function standardHalfTwistWord(rank, family = "A") {
  return createDynkinDatum({ family, rank }).standardHalfTwistWord.slice();
}

export function randomHalfTwistWord(rank, family = "A") {
  return randomHalfTwistWordForDatum(createDynkinDatum({ family, rank }));
}

export function randomExample({ family = "A", rank = null, r = null } = {}) {
  const parsedFamily = normalizeDynkinFamily(family);
  const defaultRank = parsedFamily === "A" ? randomInteger(2, 5) : parsedFamily === "D" ? 4 : 6;
  const parsedRank = parseOptionalPositiveInteger(rank, "n", defaultRank);
  const datum = createDynkinDatum({ family: parsedFamily, rank: parsedRank });
  const parsedR = parseOptionalPositiveInteger(r, "r", Math.max(2, parsedRank + 2));
  const u = Array.from({ length: parsedR }, () => randomInteger(1, parsedRank));
  const lr = Array.from({ length: parsedR - 1 }, () => (Math.random() < 0.5 ? "L" : "R"));
  const c = lr.filter((move) => move === "L").length + 1;
  return {
    family: parsedFamily,
    rank: String(parsedRank),
    r: String(parsedR),
    u: u.join(" "),
    rxw: (parsedFamily === "D" ? datum.standardHalfTwistWord : randomHalfTwistWordForDatum(datum)).join(" "),
    c: String(c),
    lr: lr.join(" "),
  };
}

function associatedBox(u, envelope, direction) {
  const [left, right] = envelope;
  if (direction === "L") {
    const color = u[left - 1];
    const boxRight = previousOrSameWithColor(u, right, color);
    if (boxRight === null || boxRight < left) {
      throw new Error(`Cannot form [${left},${right}} from the current expression sequence.`);
    }
    return [left, boxRight];
  }
  const color = u[right - 1];
  const boxLeft = nextOrSameWithColor(u, left, color);
  if (boxLeft === null || boxLeft > right) {
    throw new Error(`Cannot form {${left},${right}] from the current expression sequence.`);
  }
  return [boxLeft, right];
}

function intervalText([left, right]) {
  return `[${left},${right}]`;
}

function wrapExpressionText(expr) {
  if (expr === "1" || /^[A-Za-z0-9_]+(\^[0-9]+)?$/.test(expr)) return expr;
  return `(${expr})`;
}

function multiplyExpressionText(...factors) {
  const useful = factors.filter((factor) => factor !== "1");
  if (useful.length === 0) return "1";
  if (useful.includes("0")) return "0";
  return useful.map(wrapExpressionText).join("*");
}

function subtractExpressionText(left, right) {
  if (right === "0") return left;
  if (left === "0") return `-${wrapExpressionText(right)}`;
  return `${wrapExpressionText(left)} - ${wrapExpressionText(right)}`;
}

function divideExpressionText(numerator, denominator) {
  if (denominator === "1") return numerator;
  return `${wrapExpressionText(numerator)}/${wrapExpressionText(denominator)}`;
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

function intervalDisplayOrEmpty(interval) {
  return interval === null ? "∅" : intervalText(interval);
}

function computeDeterminantialModules({ datum, u, chain }) {
  const memo = new Map();
  const data = new Map();

  function adjacentColors(color) {
    return datum.adjacency.get(color) ?? [];
  }

  function normalizeInterval(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) return null;
    return [a, b];
  }

  function intervalKey(interval) {
    return interval === null ? "empty" : `${interval[0]},${interval[1]}`;
  }

  function compute(interval) {
    if (interval === null) return {
      interval,
      expression: "1",
      base: true,
      empty: true,
    };
    const [a, b] = interval;
    const cacheKey = intervalKey(interval);
    if (memo.has(cacheKey)) return memo.get(cacheKey);
    if (u[a - 1] !== u[b - 1]) {
      throw new Error(`Cannot compute M${intervalText(interval)} because it is not an i-box.`);
    }

    let result;
    if (a === b) {
      result = {
        interval,
        expression: `C_${a}`,
        base: true,
        empty: false,
      };
    } else {
      const inner = normalizeInterval(strictlyNextSameColor(u, a), strictlyPreviousSameColor(u, b));
      const left = normalizeInterval(strictlyNextSameColor(u, a), b);
      const right = normalizeInterval(a, strictlyPreviousSameColor(u, b));
      const correctionIntervals = adjacentColors(u[a - 1])
        .map((color) => normalizeInterval(nearestColorRight(u, a, color), nearestColorLeft(u, b, color)))
        .filter((item) => item !== null);

      const leftData = compute(left);
      const rightData = compute(right);
      const innerData = compute(inner);
      const correctionData = correctionIntervals.map((item) => compute(item));
      const correction = multiplyExpressionText(...correctionData.map((item) => item.expression));
      const numerator = subtractExpressionText(
        multiplyExpressionText(leftData.expression, rightData.expression),
        correction,
      );
      let expression;
      try {
        expression = expandExpressionText(divideExpressionText(numerator, innerData.expression));
      } catch {
        expression = divideExpressionText(numerator, innerData.expression);
      }
      result = {
        interval,
        expression,
        base: false,
        empty: false,
        left,
        right,
        inner,
        correctionIntervals,
        leftExpression: leftData.expression,
        rightExpression: rightData.expression,
        innerExpression: innerData.expression,
        correctionExpression: correction,
      };
    }
    memo.set(cacheKey, result);
    data.set(cacheKey, result);
    return result;
  }

  const rows = chain.rows.map((row) => {
    const value = compute(row.box);
    return {
      t: row.t,
      interval: row.box.slice(),
      color: row.color,
      expression: value.expression,
      calculation: value,
    };
  });

  return {
    rows,
    all: [...data.values()].filter((item) => !item.empty),
    intervalDisplay: intervalDisplayOrEmpty,
  };
}

export function makeAdmissibleChain({ datum, u, c, lr }) {
  const r = u.length;
  if (r === 0) throw new Error("u must be nonempty.");
  validateSequenceInDynkin(u, datum, "u");
  if (lr.length !== r - 1) {
    throw new Error(`LR sequence must have length ${r - 1}, but has length ${lr.length}.`);
  }

  const expectedC = lr.filter((move) => move === "L").length + 1;
  if (c !== expectedC) {
    throw new Error(`For this LR sequence, the initial envelope must be c=${expectedC}.`);
  }

  const firstByColor = new Map();
  const lastByColor = new Map();
  u.forEach((color, idx) => {
    const pos = idx + 1;
    if (!firstByColor.has(color)) firstByColor.set(color, pos);
    lastByColor.set(color, pos);
  });

  let envelope = [c, c];
  const rows = [];
  for (let t = 1; t <= r; t += 1) {
    const previousMove = t === 1 ? "R" : lr[t - 2];
    if (t > 1) {
      if (previousMove === "L") envelope = [envelope[0] - 1, envelope[1]];
      else envelope = [envelope[0], envelope[1] + 1];
    }
    if (envelope[0] < 1 || envelope[1] > r) {
      throw new Error(`Envelope ${intervalText(envelope)} is outside [1,${r}].`);
    }
    const effectiveEnd = t === 1 ? c : (previousMove === "L" ? envelope[0] : envelope[1]);
    const box = associatedBox(u, envelope, previousMove);
    const color = u[box[0] - 1];
    if (u[box[1] - 1] !== color) {
      throw new Error(`Internal error: ${intervalText(box)} is not an i-box.`);
    }
    const side = previousMove === "L" ? "L" : "R";
    const h = side === "L" ? datum.star.get(color) : color;
    rows.push({
      t,
      previousMove,
      envelope: envelope.slice(),
      effectiveEnd,
      box,
      color,
      frozen: box[0] === firstByColor.get(color) && box[1] === lastByColor.get(color),
      h,
      side,
      boxNotation: previousMove === "L"
        ? `[${envelope[0]},${envelope[1]}}`
        : `{${envelope[0]},${envelope[1]}]`,
    });
  }

  return {
    family: datum.family,
    rank: datum.rank,
    dynkin: datum,
    u: u.slice(),
    c,
    lr: lr.slice(),
    range: rows[rows.length - 1].envelope.slice(),
    rows,
  };
}

export function makeDoubleString({ datum, rxw, chain }) {
  validateSequenceInDynkin(rxw, datum, "rxw");
  const prefix = rxw.map((entry, idx) => ({
    source: "rxw",
    t: idx + 1,
    h: entry,
    side: "R",
    plus: true,
  }));
  const chainEntries = chain.rows.map((row) => ({
    source: "chain",
    t: row.t,
    h: row.h,
    side: row.side,
    plus: false,
    color: row.color,
    box: row.box.slice(),
  }));
  return [...prefix, ...chainEntries];
}

export function sequenceFromDoubleString(doubleString) {
  const out = [];
  doubleString.forEach((entry) => {
    if (entry.side === "L") out.unshift(entry.h);
    else out.push(entry.h);
  });
  return out;
}

export function summarizeDoubleString(doubleString, rxwLength) {
  const prefix = doubleString.slice(0, rxwLength);
  const chainEntries = doubleString.slice(rxwLength);
  return {
    prefix,
    chainEntries,
    leftPart: chainEntries.filter((entry) => entry.side === "L").reverse().map((entry) => entry.h),
    rightPart: chainEntries.filter((entry) => entry.side === "R").map((entry) => entry.h),
    uiSequence: sequenceFromDoubleString(doubleString),
  };
}

export function formatDoubleStringEntry(entry) {
  return `${entry.h}${entry.side}${entry.plus ? "+" : ""}`;
}

export function buildTrace(input) {
  const family = normalizeDynkinFamily(input.family ?? input.type ?? "A");
  const rank = parsePositiveInteger(input.rank, "rank");
  const datum = createDynkinDatum({ family, rank });
  const u = parseIntegerSequence(input.u, "u");
  const rxw = parseIntegerSequence(input.rxw, "rxw");
  const lr = parseLRSequence(input.lr);
  const c = input.c === "" || input.c === null || input.c === undefined
    ? lr.filter((move) => move === "L").length + 1
    : parsePositiveInteger(input.c, "c");
  const chain = makeAdmissibleChain({ datum, u, c, lr });
  const determinantialModules = computeDeterminantialModules({ datum, u, chain });
  const doubleString = makeDoubleString({ datum, rxw, chain });
  const doubleSummary = summarizeDoubleString(doubleString, rxw.length);
  if (family === "D" && datum.positiveRoots.length > 20) {
    throw new Error(`The reduced expression Δ̲ for ${datum.label} is computed, but rendering D_6 and higher currently requires an optimized braid-path algorithm. The public page supports D_4 and D_5 reliably.`);
  }
  if (family !== "A" && family !== "D") {
    throw new Error(`The reduced expression Δ̲ for ${datum.label} has been computed, but browser rendering is currently enabled only for type A and type D.`);
  }
  const topWeave = buildTopWeave({ datum, rxw, u, c });
  const bottomWeave = buildDoubleInductiveWeave(doubleString, datum);
  const shouldExpandFullClusterValues = bottomWeave.coordinateAvailable && u.length <= 12 && bottomWeave.clusterValues.length <= 12;
  const fullClusterValues = shouldExpandFullClusterValues
    ? computeFullClusterValues(bottomWeave.clusterValues, topWeave.coordinateSubstitution)
    : [];
  return {
    family,
    dynkin: datum,
    rank,
    u,
    rxw,
    c,
    expectedC: lr.filter((move) => move === "L").length + 1,
    lr,
    chain,
    determinantialModules,
    doubleString,
    doubleSummary,
    topWeave,
    bottomWeave,
    fullClusterValues,
    fullClusterValuesOmitted: !shouldExpandFullClusterValues,
    fullClusterValuesOmittedReason: bottomWeave.coordinateAvailable
      ? "The expanded expression is large."
      : "Coordinate formulas are not implemented for this type.",
  };
}

export function intervalTextForDisplay(interval) {
  return intervalText(interval);
}
