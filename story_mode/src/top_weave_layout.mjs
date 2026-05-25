function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function sameWord(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((entry, idx) => Number(entry) === Number(right[idx]));
}

export function topWeaveTargetCheck(topWeave, bottomSourceWord) {
  const targetWord = topWeave?.targetWord ?? topWeave?.words?.[topWeave.words.length - 1] ?? [];
  return {
    ok: sameWord(targetWord, bottomSourceWord),
    targetWord: targetWord.slice(),
    bottomSourceWord: bottomSourceWord.slice(),
  };
}

export function buildTopWeaveLayout({
  topWeave,
  sourceXs,
  targetXs,
  topY,
  targetY,
}) {
  const words = topWeave?.words ?? [];
  const moves = topWeave?.moves ?? [];
  if (words.length === 0) return { rows: [], strips: [] };

  const wordLength = words[0].length;
  if (sourceXs.length !== wordLength || targetXs.length !== wordLength) {
    throw new Error("Top weave boundary anchors must match the top weave word length.");
  }

  const rowDenominator = Math.max(words.length - 1, 1);
  const rows = words.map((word, rowIdx) => {
    const position = rowIdx / rowDenominator;
    const xAmount = smoothstep(position);
    return {
      word: word.slice(),
      y: lerp(topY, targetY, position),
      xs: word.map((_, idx) => lerp(sourceXs[idx], targetXs[idx], xAmount)),
    };
  });

  const strips = moves.map((move, idx) => ({
    move,
    before: rows[idx],
    after: rows[idx + 1],
  }));

  return { rows, strips };
}
