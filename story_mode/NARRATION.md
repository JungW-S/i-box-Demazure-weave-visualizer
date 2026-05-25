# Narration Draft

## Opening

```text
We construct the Demazure weave associated with an admissible chain C.

First, fix an element b of the positive braid monoid, and choose an expression sequence i of b.

Then choose an LR sequence H. These data determine an admissible chain C of i-boxes.

We also fix Delta, a reduced expression of the longest element in the Weyl group.
```

## Screen Cues

- Opening hold: show the target phrase and the expression sequence `i`.
- Introduce the LR sequence `H`, then group `i` and `H` as the data determining `C`.
- Introduce the expression sequence of `Delta` as the second fixed datum.
- Focus on `i`: move the expression sequence `i` to the construction baseline.
- Focus on the LR sequence: move the LR sequence below `i`.
- Then count the `L` entries to locate the initial position `c`.

## Playback Cues

The current implementation uses generated audio files in
`audio/narration/cue-01.wav`, ..., matching the cues below.
The active files were generated with the macOS voice `Samantha (English, US)` at rate `125`.
The Moira version is backed up in `audio/narration_moira_125`, the Shelley version is backed up in `audio/narration_shelley_125`, and the earlier Daniel version is backed up in `audio/narration_daniel_125_before_shelley`.

For higher quality narration, generate OpenAI TTS mp3 files with:

```bash
OPENAI_API_KEY=... ./tools/generate_openai_narration.py --voice coral --overwrite
```

The story player uses the wav files in `audio/narration` first. OpenAI TTS
mp3 files can be kept in `audio/narration_openai` as a fallback.

```text
We construct the Demazure weave associated with an admissible chain C.

First, fix an element b of the positive braid monoid, and choose an expression sequence i of b.

Then choose an LR sequence H. These data determine an admissible chain C of i-boxes.

We also fix Delta, a reduced expression of the longest element in the Weyl group.

The number of L entries determines the initial position c.

Starting from c, we read the LR sequence from left to right.

Before reading the LR sequence, start with the one-point envelope at c.

At c, the one-point interval is the first i-box, and we record its color.

For the first entry, L, add one new endpoint on the left side of the envelope.

For a left move, close at the rightmost occurrence of the new endpoint's color inside the envelope. This interval is the next i-box, and we record its color.

For the second entry, R, add one new endpoint on the right side of the envelope.

For a right move, close at the leftmost occurrence of the new endpoint's color inside the envelope. This interval is the next i-box, and we record its color.

The remaining entries are treated in the same way: grow the envelope, then record the corresponding i-box.

This gives the admissible chain C.

Next, we form the double string from the colors of these i-boxes.

The word for Delta contributes the initial R plus entries of the double string.

Now read the rows of the admissible chain one by one.

For the first row, start from color 1 and side R.

Append 1R to the double string.

For the second row, start from color 3 and side L.

Since the side is L, replace the color by its star, giving 1.

Append 1L to the double string.

For the third row, start from color 2 and side R.

Append 2R to the double string.

Continue by the same rule for the remaining rows.

This completes the double string.

To form the word i Delta of C, keep the central Delta, and insert each later entry on the left or on the right according to its L or R label.

This gives the word i Delta of C.

Now we construct the double inductive weave.

Place i Delta of C on the top boundary of this weave.

Now read the non-additive entries in order; each one creates one trivalent vertex.

For the first trivalent vertex, focus on the strand that will be attached. If needed, use commutation or braid moves to bring it into position.

Then attach it to create the first trivalent vertex.

For the second trivalent vertex, focus on the strand that will be attached. If needed, use commutation or braid moves to bring it into position.

Then attach it to create the second trivalent vertex.

For the third trivalent vertex, focus on the strand that will be attached. If needed, use commutation or braid moves to bring it into position.

Then attach it to create the third trivalent vertex.

The remaining trivalent vertices are constructed in the same way.

We keep this double inductive weave as the lower part of the final construction.

The top weave connects the top boundary Delta i to the bottom boundary i Delta of C.

The top weave uses only commutation and braid moves, so no trivalent vertex appears.

Finally, vertically concatenate the top weave with the double inductive weave below. This gives W Delta of C.
```
