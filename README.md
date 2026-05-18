# Chains of i-boxes and Demazure Weaves

Static prototype for visualizing the construction in the i-box and weaves
paper.

The page is a static JavaScript app. It does not call Sage or any server-side
code after the files are served.

The public visualizer currently has a type `A_n` page. It implements:

- compute a reduced expression `\underline{\Delta}` for the longest element
  `w_0` in type `A_n`,
- parse an expression sequence `\underline{i}`,
- parse an LR sequence,
- compute the initial envelope `c = #{L entries} + 1`,
- construct the admissible chain of i-boxes `\mathfrak C`,
- form the double string `s_{\underline{\Delta}}(\mathfrak C)`,
- build the bottom double inductive weave
  `\mathcal W^B_{\underline{\Delta}}(\mathfrak C)`,
- build the top braid-move weave
  `\mathcal W^T_{\underline{\Delta}}(\mathfrak C)`,
- display the construction in the order
  `\mathfrak C -> s_{\underline{\Delta}}(\mathfrak C)
  -> \mathcal W_{\underline{\Delta}}(\mathfrak C)`,
- keep the `\mathcal W_{\underline{\Delta}}(\mathfrak C)` page focused on the
  final interactive weave, quiver, Lusztig-cycle overlay, and cluster variables
  `A_t(\mathcal W_{\underline{\Delta}}(\mathfrak C))`,
- make the final weave directly selectable: click a solid edge to read
  `ζ(e)=(z̃_e,u_e)`, a dashed edge to read its matrix label, or a trivalent
  vertex to read the corresponding cluster variable,
- compute and display the quiver
  `Q(\mathcal W_{\underline{\Delta}}(\mathfrak C))
  = Q(\mathcal W^B_{\underline{\Delta}}(\mathfrak C))` on the final page,
- keep the current input and selected view in the URL after running the
  construction, so the resulting page can be shared directly.

The Random button uses only the Dynkin type rank `n` and the length `r`; it
randomizes the expression sequence `\underline{i}`, the expression sequence
`\underline{\Delta}`, and the LR sequence.

The Sage prototype and the calculation note in this folder remain references
for the double inductive weave calculation rules.

## Run Locally

From this folder:

```sh
python3 -m http.server 8766
```

Then open:

```text
http://127.0.0.1:8766/
```

Useful URL parameters:

```text
?rank=3&r=6&u=2+3+1+2+2+1&rxw=1+2+1+3+2+1&lr=L+R+L+R+R
?view=whole&cluster=A4
?random=1&rank=4&r=8
```

## Test

From this folder:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc test_core.mjs
```
