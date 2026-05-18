import {
  buildTrace,
  defaultExample,
  formatDoubleStringEntry,
  parseLRSequence,
  randomExample,
  randomHalfTwistWord,
  standardHalfTwistWord,
} from "./src/core.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message}\nexpected ${e}\nactual   ${a}`);
  }
}

const trace = buildTrace(defaultExample);

assertEqual(
  trace.chain.rows.map((row) => row.envelope),
  [[3, 3], [2, 3], [2, 4], [1, 4], [1, 5], [1, 6]],
  "envelopes follow H=(L,R,L,R,R)",
);

assertEqual(
  trace.chain.rows.map((row) => row.box),
  [[3, 3], [2, 2], [4, 4], [1, 4], [1, 5], [3, 6]],
  "associated i-boxes match the paper example",
);

assertEqual(
  trace.chain.rows.map((row) => row.color),
  [1, 3, 2, 2, 2, 1],
  "i-box colors match the paper example",
);

assertEqual(
  trace.chain.rows.map((row) => row.h),
  [1, 1, 2, 2, 2, 1],
  "h_t values use the type A star involution on L steps",
);

assertEqual(
  trace.chain.rows.map((row) => row.side),
  ["R", "L", "R", "L", "R", "R"],
  "X_t values match H_0=R and H",
);

assertEqual(
  trace.chain.rows.map((row) => row.frozen),
  [false, true, false, false, true, true],
  "maximal i-boxes are marked as frozen",
);

assertEqual(
  trace.doubleString.map(formatDoubleStringEntry),
  ["1R+", "2R+", "1R+", "3R+", "2R+", "1R+", "1R", "1L", "2R", "2L", "2R", "1R"],
  "double string matches the paper example",
);

assertEqual(
  trace.determinantialModules.rows.map((row) => row.expression),
  [
    "C_3",
    "C_2",
    "C_4",
    "C_1*C_4 - C_2*C_3",
    "C_1*C_4*C_5 - C_2*C_3*C_5 - C_1",
    "C_3*C_6 - C_4*C_5 + 1",
  ],
  "determinantial module classes match the paper example",
);

assertEqual(trace.doubleSummary.leftPart, [2, 1], "left part is read from the L entries");
assertEqual(trace.doubleSummary.rightPart, [1, 2, 2, 1], "right part is read from the R entries");
assertEqual(
  trace.doubleSummary.uiSequence,
  [2, 1, 1, 2, 1, 3, 2, 1, 1, 2, 2, 1],
  "u_rxw(C) matches the paper example",
);

assertEqual(
  trace.bottomWeave.words[0],
  trace.doubleSummary.uiSequence,
  "top boundary of W^B_underlineDelta(frak C) is i_underlineDelta(frak C)",
);
assertEqual(
  trace.topWeave.sourceWord,
  [...trace.rxw, ...trace.u],
  "top boundary of W^T_underlineDelta(frak C) is underline Delta followed by underline i",
);
assertEqual(
  trace.topWeave.targetWord,
  trace.doubleSummary.uiSequence,
  "bottom boundary of W^T_underlineDelta(frak C) is i_underlineDelta(frak C)",
);
assertEqual(
  trace.topWeave.sourceCoordinates,
  ["w1", "w2", "w3", "w4", "w5", "w6", "z1", "z2", "z3", "z4", "z5", "z6"],
  "coordinates on X(rxw i) are split as (w_1,...,w_ell,z_1,...,z_r)",
);
assertEqual(
  Object.keys(trace.topWeave.coordinateSubstitution),
  ["y1", "y2", "y3", "y4", "y5", "y6", "y7", "y8", "y9", "y10", "y11", "y12"],
  "middle-boundary coordinates are named y_k before the top-weave substitution",
);
assertEqual(
  trace.bottomWeave.finalReducedWord.length,
  6,
  "bottom word of the example has length ell(w0) in type A_3",
);
assertEqual(
  trace.bottomWeave.stepInfos.filter((info) => !info.plus).length,
  6,
  "the example has one trivalent vertex for each non-additive chain entry",
);
assertEqual(
  trace.bottomWeave.lusztigCycles.map((cycle) => cycle.label),
  ["A1", "A2", "A3", "A4", "A5", "A6"],
  "Lusztig cycles are indexed by the trivalent vertices",
);
assertEqual(
  trace.bottomWeave.lusztigCycles[0].cycleRows.length,
  trace.bottomWeave.words.length,
  "each Lusztig cycle has one weight row for each horizontal boundary",
);
assertEqual(
  trace.bottomWeave.dashedRays.map((ray) => ray.label),
  ["A1", "A2", "A3", "A4", "A5", "A6"],
  "dashed rays are recorded for the trivalent vertices",
);
assertEqual(
  trace.bottomWeave.clusterValues.map((value) => value.label),
  ["A1", "A2", "A3", "A4", "A5", "A6"],
  "cluster variables are recorded for the trivalent vertices",
);
assertEqual(
  trace.bottomWeave.clusterValues.map((value) => value.expression),
  [
    "y9",
    "y3",
    "y10",
    "y3*y5*y10 - y3*y9 - y4*y10",
    "y3*y5*y10*y11 - y3*y9*y11 - y4*y10*y11 - y3*y5 + y4",
    "y9*y12 - y10*y11 + 1",
  ],
  "cluster variables of W^B_Delta(C) are expanded in the middle-boundary coordinates y_k",
);
assertEqual(
  trace.fullClusterValues.map((value) => value.expression),
  [
    "z3",
    "z2",
    "z4",
    "z1*z4 - z2*z3",
    "z1*z4*z5 - z2*z3*z5 - z1",
    "z3*z6 - z4*z5 + 1",
  ],
  "cluster variables for W_Delta(C) use the paper convention (w,z) on X(rxw i)",
);
assertEqual(
  trace.bottomWeave.quiverData.labels,
  ["A1", "A2", "A3", "A4", "A5", "A6"],
  "quiver vertices are indexed by the cluster variables",
);
assertEqual(
  trace.bottomWeave.quiverData.frozen,
  ["A2", "A5", "A6"],
  "frozen quiver vertices are detected from bottom Lusztig-cycle weights",
);
assertEqual(
  trace.bottomWeave.quiverData.exchangeable,
  ["A1", "A3", "A4"],
  "exchangeable quiver vertices are the non-frozen vertices",
);
assertEqual(
  trace.bottomWeave.quiverData.arrows.map((arrow) => `${arrow.source}->${arrow.target}:${arrow.weight}`),
  [
    "A1->A4:1",
    "A1->A6:1",
    "A2->A4:1",
    "A3->A1:1",
    "A3->A2:1",
    "A4->A3:1",
    "A4->A5:1",
    "A5->A1:1",
  ],
  "quiver arrows follow the paper convention: no frozen-frozen arrows and no fractional arrow weights",
);
assert(
  trace.bottomWeave.quiverData.arrows.every((arrow) => Number.isInteger(Number(arrow.weight))),
  "the paper quiver has integral arrow weights",
);
assertEqual(
  trace.bottomWeave.zRows.map((row) => row.length),
  trace.bottomWeave.words.map((row) => row.length),
  "z-rows have the same lengths as the weave boundary words",
);

assertEqual(parseLRSequence("\\calL, \\calR, L"), ["L", "R", "L"], "LaTeX LR parsing works");

let failed = false;
try {
  buildTrace({ ...defaultExample, c: "2" });
} catch (error) {
  failed = /c=3/.test(error.message);
}
assert(failed, "invalid initial envelope c is rejected");

const randomTrace = buildTrace(randomExample({ rank: "3", r: "8" }));
assertEqual(randomTrace.rank, 3, "random example uses the requested rank n");
assertEqual(randomTrace.u.length, 8, "random example uses the requested length r");
assertEqual(randomTrace.lr.length, 7, "random LR sequence has length r-1");
assertEqual(randomTrace.c, randomTrace.lr.filter((move) => move === "L").length + 1, "random c is determined by H");

const d4Trace = buildTrace({
  family: "D",
  rank: "4",
  u: "1 2 3 4",
  rxw: standardHalfTwistWord(4, "D").join(" "),
  lr: "R R R",
});
assertEqual(d4Trace.dynkin.label, "D_4", "type D_4 input is accepted");
assertEqual(standardHalfTwistWord(4, "D").length, 12, "type D_4 underline Delta has length |Phi^+|=12");
assertEqual(d4Trace.bottomWeave.coordinateAvailable, true, "coordinate formulas are available for the local D_4 pinning check");
assertEqual(d4Trace.bottomWeave.pinningInfo.group, "SO_8(C)", "type D_4 uses the standard SO_8 Chevalley pinning");
assertEqual(d4Trace.fullClusterValues.map((value) => value.expression), ["z1", "z2", "z3", "z4"], "D_4 default all-R variables pull back to the z-coordinates");

const d4BranchingTrace = buildTrace({
  family: "D",
  rank: "4",
  u: "2 1 3 4 2",
  rxw: standardHalfTwistWord(4, "D").join(" "),
  lr: "R R R R",
});
assertEqual(
  d4BranchingTrace.fullClusterValues.map((value) => value.expression),
  ["z1", "z2", "z3", "z4", "-z2*z3*z4 + z1*z5"],
  "D_4 branching T-system variable uses the three adjacent arms",
);

[
  "L L L",
  "L R L",
  "R L R",
  "L R R",
  "R L L",
].forEach((lr) => {
  const mixedTrace = buildTrace({
    family: "D",
    rank: "4",
    u: "1 2 3 4",
    rxw: standardHalfTwistWord(4, "D").join(" "),
    lr,
  });
  assertEqual(mixedTrace.dynkin.label, "D_4", `type D_4 mixed LR input ${lr} is accepted`);
  assertEqual(mixedTrace.bottomWeave.clusterValues.length, 4, `type D_4 mixed LR input ${lr} has one trivalent vertex for each chain entry`);
});

const d5Delta = standardHalfTwistWord(5, "D");
assertEqual(d5Delta.length, 20, "type D_5 underline Delta has length |Phi^+|=20");
let d5Failed = false;
try {
  buildTrace({
    family: "D",
    rank: "5",
    u: "1 2 3 4 5",
    rxw: d5Delta.join(" "),
    lr: "R R R R",
  });
} catch (error) {
  d5Failed = /optimized braid-path/.test(error.message);
}
assert(d5Failed, "type D_5 computes underline Delta but does not start full browser rendering yet");

assertEqual(standardHalfTwistWord(6, "E").length, 36, "type E_6 underline Delta has length |Phi^+|=36");
assertEqual(standardHalfTwistWord(7, "E").length, 63, "type E_7 underline Delta has length |Phi^+|=63");
assertEqual(standardHalfTwistWord(8, "E").length, 120, "type E_8 underline Delta has length |Phi^+|=120");

let eFailed = false;
try {
  buildTrace({
    family: "E",
    rank: "6",
    u: "1 2",
    rxw: standardHalfTwistWord(6, "E").join(" "),
    lr: "R",
  });
} catch (error) {
  eFailed = /optimized braid-path/.test(error.message);
}
assert(eFailed, "large non-A types fail quickly instead of starting an exponential braid-path search");

function applyTypeAWord(rank, word) {
  const permutation = Array.from({ length: rank + 1 }, (_, idx) => idx + 1);
  word.forEach((entry) => {
    const idx = entry - 1;
    [permutation[idx], permutation[idx + 1]] = [permutation[idx + 1], permutation[idx]];
  });
  return permutation;
}

const randomDelta = randomHalfTwistWord(4);
assertEqual(randomDelta.length, 10, "random underline Delta has the correct length");
assertEqual(applyTypeAWord(4, randomDelta), [5, 4, 3, 2, 1], "random underline Delta represents w0");

print("ibox core tests passed");
