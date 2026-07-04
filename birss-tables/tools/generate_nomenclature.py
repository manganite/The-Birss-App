#!/usr/bin/env python3
"""Generate table-nomenclature.md (the 122-group nomenclature reference) from two sources:

  1. The ITC 1.5.2.3 transcription of Schoenflies + full Hermann-Mauguin notation, held in the
     `rows` list below (this script is the *source of record* for those two columns -- they are
     not tabulated anywhere else in the repo).
  2. Birss Table 6 (../table-6.md) for the Shubnikov symbol, operators, and sigma(N)/sigma'(N)
     generators; the 32 grey groups are derived by the G (x) {1,1'} rule.

Run from the repo root:  python3 birss-tables/tools/generate_nomenclature.py
(or `npm run nomenclature`, or `python3 generate_nomenclature.py` from this directory -- all
paths are resolved relative to this file, not the working directory).
Writes ../table-nomenclature.md next to the other reference tables. Deterministic: the output is
byte-for-byte reproducible, so CI can assert the committed file equals this script's output.
"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
TABLES = HERE.parent            # birss-tables/  (this script lives in birss-tables/tools/)


# ---- 1. The 90 ITC groups in ITC 1.5.2.3 order (== Birss table-6 order) ----
# (system, app_key[Birss HM-short, app convention], schoenflies, hm_full, note)
rows = [
("Triclinic","1","C1","1",""),
("Triclinic","-1","Ci","-1",""),
("Triclinic","-1'","Ci(C1)","-1'",""),
("Monoclinic","2","C2","112","ITC full (b-unique) = 121"),
("Monoclinic","2'","C2(C1)","112'","ITC full (b-unique) = 12'1"),
("Monoclinic","m","Cs","11m","ITC full (b-unique) = 1m1"),
("Monoclinic","m'","Cs(C1)","11m'","ITC full (b-unique) = 1m'1"),
("Monoclinic","2/m","C2h","11 2/m","ITC full (b-unique) = 1 2/m 1"),
("Monoclinic","2'/m'","C2h(Ci)","11 2'/m'","ITC full (b-unique) = 1 2'/m' 1"),
("Monoclinic","2/m'","C2h(C2)","11 2/m'","ITC full (b-unique) = 1 2/m' 1"),
("Monoclinic","2'/m","C2h(Cs)","11 2'/m","ITC full (b-unique) = 1 2'/m 1"),
("Orthorhombic","222","D2","222",""),
("Orthorhombic","2'2'2","D2(C2)","2'2'2",""),
("Orthorhombic","mm2","C2v","mm2",""),
("Orthorhombic","m'm'2","C2v(C2)","m'm'2",""),
("Orthorhombic","2'm'm","C2v(Cs)","2'm'm","bracketed: rotated setting (2-fold∥a); Table 6 operators are authority"),
("Orthorhombic","mmm","D2h","2/m 2/m 2/m",""),
("Orthorhombic","m'm'm","D2h(C2h)","2'/m' 2'/m' 2/m","**HM DIVERGENCE**: ITC = mm'm' (2_x), full 2/m 2'/m' 2'/m'; app/Birss = m'm'm (2_z)"),
("Orthorhombic","m'm'm'","D2h(D2)","2/m' 2/m' 2/m'",""),
("Orthorhombic","mmm'","D2h(C2v)","2'/m 2'/m 2/m'",""),
("Tetragonal","4","C4","4",""),
("Tetragonal","4'","C4(C2)","4'",""),
("Tetragonal","-4","S4","-4",""),
("Tetragonal","-4'","S4(C2)","-4'",""),
("Tetragonal","4/m","C4h","4/m",""),
("Tetragonal","4'/m","C4h(C2h)","4'/m",""),
("Tetragonal","4/m'","C4h(C4)","4/m'",""),
("Tetragonal","4'/m'","C4h(S4)","4'/m'",""),
("Tetragonal","422","D4","422",""),
("Tetragonal","4'22'","D4(D2)","4'22'",""),
("Tetragonal","42'2'","D4(C4)","42'2'",""),
("Tetragonal","4mm","C4v","4mm",""),
("Tetragonal","4'mm'","C4v(C2v)","4'mm'",""),
("Tetragonal","4m'm'","C4v(C4)","4m'm'",""),
("Tetragonal","-42m","D2d","-42m",""),
("Tetragonal","-4'2m'","D2d(D2)","-4'2m'",""),
("Tetragonal","-4'm2'","D2d(C2v)","-4'm2'","bracketed: rotated setting of D2d (Table 7)"),
("Tetragonal","-42'm'","D2d(S4)","-42'm'",""),
("Tetragonal","4/mmm","D4h","4/m 2/m 2/m",""),
("Tetragonal","4'/mmm'","D4h(D2h)","4'/m 2/m 2'/m'",""),
("Tetragonal","4/mm'm'","D4h(C4h)","4/m 2'/m' 2'/m'",""),
("Tetragonal","4/m'm'm'","D4h(D4)","4/m' 2/m' 2/m'",""),
("Tetragonal","4/m'mm","D4h(C4v)","4/m' 2'/m 2'/m",""),
("Tetragonal","4'/m'm'm","D4h(D2d)","4'/m' 2/m' 2'/m",""),
("Trigonal","3","C3","3",""),
("Trigonal","-3","C3i","-3","Schoenflies: app/Birss C3i; ITC spells it S6 (S6≡C3i)"),
("Trigonal","-3'","C3i(C3)","-3'","Schoenflies: ITC S6(C3)"),
("Trigonal","32","D3","321",""),
("Trigonal","32'","D3(C3)","32'1",""),
("Trigonal","3m","C3v","3m1",""),
("Trigonal","3m'","C3v(C3)","3m'1",""),
("Trigonal","-3m","D3d","-3 2/m 1",""),
("Trigonal","-3m'","D3d(C3i)","-3 2'/m' 1","Schoenflies: ITC D3d(S6)"),
("Trigonal","-3'm'","D3d(D3)","-3' 2/m' 1",""),
("Trigonal","-3'm","D3d(C3v)","-3' 2'/m 1",""),
("Hexagonal","6","C6","6",""),
("Hexagonal","6'","C6(C3)","6'",""),
("Hexagonal","-6","C3h","-6",""),
("Hexagonal","-6'","C3h(C3)","-6'",""),
("Hexagonal","6/m","C6h","6/m",""),
("Hexagonal","6'/m'","C6h(C3i)","6'/m'","Schoenflies: ITC C6h(S6)"),
("Hexagonal","6/m'","C6h(C6)","6/m'",""),
("Hexagonal","6'/m","C6h(C3h)","6'/m",""),
("Hexagonal","622","D6","622",""),
("Hexagonal","6'22'","D6(D3)","6'22'",""),
("Hexagonal","62'2'","D6(C6)","62'2'",""),
("Hexagonal","6mm","C6v","6mm",""),
("Hexagonal","6'mm'","C6v(C3v)","6'mm'",""),
("Hexagonal","6m'm'","C6v(C6)","6m'm'",""),
("Hexagonal","-6m2","D3h","-6m2",""),
("Hexagonal","-6'2m'","D3h(D3)","-6'2m'","bracketed: rotated setting of D3h (Table 7)"),
("Hexagonal","-6'm2'","D3h(C3v)","-6'm2'",""),
("Hexagonal","-6m'2'","D3h(C3h)","-6m'2'",""),
("Hexagonal","6/mmm","D6h","6/m 2/m 2/m",""),
("Hexagonal","6'/m'mm'","D6h(D3d)","6'/m' 2/m 2'/m'",""),
("Hexagonal","6/mm'm'","D6h(C6h)","6/m 2'/m' 2'/m'",""),
("Hexagonal","6/m'm'm'","D6h(D6)","6/m' 2/m' 2/m'",""),
("Hexagonal","6/m'mm","D6h(C6v)","6/m' 2'/m 2'/m",""),
("Hexagonal","6'/mm'm","D6h(D3h)","6'/m 2/m' 2'/m","ITC prints short `6'/mmm'`, full `6'/m 2'/m 2/m'` — same physical orientation as the app default; the strings differ only by the position-2 convention (Birss: y-family; ITC: a-axes)."),
# Cubic: app KEEPS inversion bar (-3) and prime on 3 where present (m'-3'); full-HM from hi-res image 2
("Cubic","23","T","23",""),
("Cubic","m-3","Th","2/m -3","Birss Table 6 short = m3 (barless); app keeps bar"),
("Cubic","m'-3'","Th(T)","2/m' -3'","Birss Table 6 short = m'3; app keeps bar+prime"),
("Cubic","432","O","432",""),
("Cubic","4'32'","O(T)","4'32'",""),
("Cubic","-43m","Td","-43m",""),
("Cubic","-4'3m'","Td(T)","-4'3m'",""),
("Cubic","m-3m","Oh","4/m -3 2/m","Birss Table 6 short = m3m (barless); app keeps bar"),
("Cubic","m-3m'","Oh(Th)","4'/m -3 2'/m'","Birss Table 6 short = m3m'; app keeps bar"),
("Cubic","m'-3'm'","Oh(O)","4/m' -3' 2/m'","Birss Table 6 short = m'3m'; app keeps bar+prime"),
("Cubic","m'-3'm","Oh(Td)","4'/m' -3' 2'/m","Birss Table 6 short = m'3m; app keeps bar+prime"),
]
if len(rows) != 90:
    raise ValueError(f"expected 90 ITC rows, got {len(rows)}")

# ---- 1b. Full-HM -> app-key collapse guard (catches ITC/Birss position-convention errors like ----
# the 6'/mm'm frame bug: a Full-HM string transcribed with the wrong position-2 convention still
# LOOKS plausible but collapses to a different short symbol than the app key). Session-verified
# against all 122 rows, 2026-07-04.
def _mirror(tok):
    """'2/m' -> 'm', '2\'/m' -> 'm', '2/m\'' -> 'm\'', '2\'/m\'' -> 'm\''. None if not an N/m fraction."""
    m = re.match(r"^\d+'?/m('?)$", tok)
    return ("m" + m.group(1)) if m else None

def collapse_full_hm(system, hm_full):
    if system == "Triclinic":
        return hm_full  # bare "1", "-1", "-1'" -- already the short form
    if system == "Monoclinic":
        # strip the literal "11" placeholder prefix (positions 1,2); the remaining single
        # token IS the short form (never collapsed further, e.g. "2/m" stays "2/m", not "m").
        s = hm_full
        if s.startswith("11 "):
            s = s[3:]
        elif s.startswith("11"):
            s = s[2:]
        return s
    if system == "Cubic":
        # cubic short symbols never show a position-1 fraction (m-3m, not 4/m-3m); every
        # N/m token collapses regardless of N.
        return "".join(_mirror(t) or t for t in hm_full.split(" "))
    if system == "Trigonal":
        # strip a single trailing placeholder "1" (e.g. "321" -> "32", "-3 2/m 1" -> "-3 2/m")
        s = hm_full
        if s.endswith("1"):
            s = s[:-1].rstrip()
        return "".join(_mirror(t) or t for t in (s.split(" ") if s else [""]))
    # Orthorhombic, Tetragonal, Hexagonal: position 1 keeps its fraction when N>=3 (4/m, 6'/m',
    # ...), collapses to the mirror letter when N=2 (orthorhombic 2/m 2/m 2/m -> mmm); positions
    # 2/3 always collapse.
    out = []
    for i, t in enumerate(hm_full.split(" ")):
        m = _mirror(t)
        if m is None:
            out.append(t)
        elif i == 0 and int(re.match(r"^(\d+)", t).group(1)) >= 3:
            out.append(t)
        else:
            out.append(m)
    return "".join(out)

_collapse_errors = []
for (_s, _k, _sf, _hf, _note) in rows:
    _got = collapse_full_hm(_s, _hf)
    if _got != _k:
        _collapse_errors.append(f"{_k}: Full-HM {_hf!r} collapses to {_got!r}, expected {_k!r}")
if _collapse_errors:
    raise ValueError("Full-HM -> app-key collapse mismatch(es):\n" + "\n".join(_collapse_errors))

# ---- 2. Parse Birss table-6 for Shubnikov / operators / generators (same order) ----
t6=[]
with open(TABLES / "table-6.md", encoding="utf-8") as f:
    for ln in f:
        if re.match(r"^\| (Triclinic|Monoclinic|Orthorhombic|Tetragonal|Trigonal|Hexagonal|Cubic) \|", ln):
            c=[x.strip() for x in ln.strip().strip("|").split("|")]
            # c: system, hm, shub, csubHM, csubShub, operators, sigma, sigmaprime
            t6.append({"hm":c[1],"shub":c[2],"ops":c[5],"sig":c[6],"sigp":c[7]})
if len(t6) != 90:
    raise ValueError(f"expected 90 table-6 rows, parsed {len(t6)}")

def sub_tok(tok):
    m=re.match(r"^([CDSTO])(.*)$",tok)
    return (m.group(1)+(f"<sub>{m.group(2)}</sub>" if m.group(2) else "")) if m else tok
def sf_html(s):
    m=re.match(r"^([^(]+)(?:\(([^)]+)\))?$",s)
    return sub_tok(m.group(1))+("("+sub_tok(m.group(2))+")" if m.group(2) else "")
def sf_grey(s):
    m=re.match(r"^([CDSTO])(.*)$",s); return m.group(1)+f"<sub>{m.group(2)}R</sub>"
def typ(sf): return "black-white (III / MP3)" if "(" in sf else "colourless (I / MP2)"

L=[]
L+=["# Magnetic Point-Group Nomenclature & Generator Reference (`birss-app`)","",
"A self-contained reference for all **122** magnetic point groups: the app's group key, the ITC **Schoenflies** and **full Hermann–Mauguin** notation (the two variants absent from `birss-tables`), the Birss **Shubnikov** symbol, and the Birss **symmetry operators** and **generating matrices** (from Table 6 for the 90 non-grey groups; derived by the ⊗{1,1′} rule for the 32 grey). Table A is the nomenclature; Table B lists operators/generators separately so neither table wraps badly.","",
"This table is one of the **two central convention references** for `birss-app`; its companion is **[`BIRSS-APP-CONVENTIONS-REFERENCE.md`](../docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md)** (the convention contract & verification ladder). The operator/generator notation and the σ(N) pool are explained there and in the Reading guide below.",""]

# ---- Reading guide / legend ----
L+=["## Reading guide","",
"**Operator notation (Birss).** `1` identity · `-1` inversion (1̄) · `N_a` = N-fold rotation about axis *a* (`2_z`, `4_z`) · `-N_a` = rotoinversion N̄ about *a*; note `-2_a` is the **mirror** ⊥ *a* (so `-2_z` = m_z) · `±N` = both senses (N and N⁻¹) · trailing `'` = **time reversal** (antiunitary/primed operation).","",
"**Multiplicity for high-symmetry axes.** `k(op)` = *k* symmetry-equivalent operations of that type. `⊥` = perpendicular to the principal axis. Examples: `3(2⊥)` = three 2-folds ⊥ c; `3(m⊥)` = three vertical mirrors; `4(±3)` = the four body-diagonal 3-fold axes (both senses); `9(2)` = nine 2-fold axes; `3(±4)` = three 4-fold axes (both senses).","",
"**Generators `σ(N)` / `σ'(N)`.** Indices into the catalogue of generating matrices in **Birss Table 3** (`birss-tables`): `σ` unitary, `σ'` antiunitary (time-reversing). Closing the listed generators reproduces the full operator set. `—` in the σ' column = no antiunitary generator (colourless group).","",
"**Shubnikov.** Given in the **Birss** dot/colon form with `'` for time reversal (app convention). ITC uses **underlining** for the antisymmetric element instead (e.g. ITC `4:2̲` = Birss `4:2'`); see the comparison below.",""]

# ---- Type scheme ----
L+=["## Type / colour scheme","",
"| Colour (Bradley–Cracknell) | BC type | ITC type | Construction | Count |",
"|---|---|---|---|---|",
"| colourless | I | **MP2** | 32 classical, no time reversal | 32 |",
"| grey | II | **MP1** | G ⊗ {1, 1'} (adds pure 1') | 32 |",
"| black-white | III | **MP3** | 1' only in combination (H + R·(G−H)) | 58 |",
"",
"Colour names are primary; the BC and ITC **numbers are swapped** for I/II (BC-I = ITC-MP2, BC-II = ITC-MP1), which is why numbers alone are avoided.",""]

# ---- Notation at a glance (comparisons) ----
L+=["## Notation at a glance — where App, Birss and ITC differ","",
"Join is always by the **abstract group (Schoenflies `G(H)`)**, never the HM string. The categories below cover every kind of printed-symbol divergence; each spans a **family** of groups (the monoclinic, cubic-bar and grey rows are representatives of their whole families). Everywhere else the three notations agree.","",
"| Abstract group | App key (Birss setting) | Birss Table 6 | ITC 1.5.2.3 | What differs |",
"|---|---|---|---|---|",
"| D<sub>2h</sub>(C<sub>2h</sub>) | `m'm'm` (2_z) | `m'm'm` | `mm'm'` (2_x) | **HM symbol**: which axis is the unprimed 2-fold (setting choice) |",
"| C<sub>2</sub> (all monoclinic) | full `112` (z∥c) | z∥c (first setting) | full `121` (b-unique) | **full-HM position**: unique axis c vs b |",
"| O<sub>h</sub>(O) — cubic bar family (6 groups) | `m'-3'm'` | `m'3m'` (barless) | `m'3̄'m'` | **short-form style**: app keeps the 3-bar (and its prime); Birss Table 6 drops both. Family: `m-3`, `m'-3'`, `m-3m`, `m-3m'`, `m'-3'm'`, `m'-3'm` |",
"| C<sub>2v</sub>(C<sub>s</sub>) = `(2'm'm)` | 2-fold ∥ a | 2-fold ∥ a (rotated) | standard | **axis setting** (same symbol, rotated frame) |",
"| D<sub>4R</sub> (grey, e.g. of D<sub>4</sub>) | `4221'` | `4221'` | Schoenflies `D`<sub>`4R`</sub>, HM `4221'` | grey **Schoenflies** = subscript R; HM = `…1'` |",
"| C<sub>3i</sub> ≡ S<sub>6</sub> (`-3` family) | Schoenflies **C₃ᵢ** | C₃ᵢ — table-3 `C3i(S6)`, C3i primary | S₆ | **Schoenflies name** for the same abstract group: app/Birss = C₃ᵢ, ITC = S₆ (HM `-3` identical). Sole Schoenflies-naming divergence. |",
"| D<sub>6h</sub>(D<sub>3h</sub>) | `6'/mm'm` (σ(2) = 2⊥y) | `6'/mm'm` (full `6'/m 2/m' 2'/m`) | `6'/mmm'` (full `6'/m 2'/m 2/m'`) | **Same orientation, different short string**: both name the σ(2) (y-family) setting; the strings differ only by the position-2 convention (Birss: y-family; ITC: a-axes). Distinct from the `m'm'm`/`mm'm'` row above, where the *default frames themselves* differ. |",
"",
"*(The last row before this one reproduces ITC Table 1.5.2.1: `D`<sub>`4R`</sub> = `4221'`, `D`<sub>`4`</sub> = `422`, `D`<sub>`4`</sub>`(C`<sub>`4`</sub>`)` = `42'2'`, `D`<sub>`4`</sub>`(D`<sub>`2`</sub>`)` = `4'22'`.)*",""]

# ---- Conventions (app) ----
L+=["## App notation conventions","",
"- **Time reversal = prime `'`** (not the Birss/ITC Shubnikov underline).",
"- **Inversion = leading `-`** (`-1`, `-4`, `-3`).",
"- **Cubic:** keep the inversion bar on the 3 (`-3`) and its prime where present (`-3'`) — e.g. `m-3`, `m'-3'm'`, `m'-3'm` — standard HM usage, unlike Birss Table 6's bare `m3` / `m'3m'`.",
"- **Full HM** is given in the **app (Birss) setting** (monoclinic z∥c; D<sub>2h</sub>(C<sub>2h</sub>) = `2'/m' 2'/m' 2/m`); the ITC form is noted per row.",
"- **Grey (Type II):** Schoenflies uses the ITC subscript **R** (D<sub>4R</sub>); HM uses `…1'`.",""]

# ---- Table A: nomenclature ----
L+=["## Table A — Nomenclature (90 groups of ITC Table 1.5.2.3)","",
"| System | Schoenflies | App key | HM full | Shubnikov | Type | Note |",
"|---|---|---|---|---|---|---|"]
for (r,t) in zip(rows,t6):
    s,k,sf,hf,note=r
    L.append(f"| {s} | {sf_html(sf)} | `{k}` | {hf} | `{t['shub']}` | {typ(sf)} | {note} |")

# ---- Table B: operators & generators ----
L+=["","## Table B — Symmetry operators & generators (Birss Table 6)","",
"| Schoenflies | App key | Symmetry operators | σ(N) / σ'(N) |",
"|---|---|---|---|"]
for (r,t) in zip(rows,t6):
    s,k,sf,hf,note=r
    gen=t["sig"]+"  /  "+(t["sigp"] if t["sigp"] not in ("-","") else "—")
    L.append(f"| {sf_html(sf)} | `{k}` | {t['ops']} | {gen} |")

# ---- Grey ----
classical=[(s,k,sf,hf,t) for ((s,k,sf,hf,n),t) in zip(rows,t6) if "(" not in sf]
if len(classical) != 32:
    raise ValueError(f"expected 32 grey-derived (classical) rows, got {len(classical)}")
# Grey collapse check: HM full = parent + "1'", app key = parent key + "1'" (mechanically
# guaranteed given the 90-row check above, but validated explicitly for full 122-row coverage).
_grey_collapse_errors = []
for (_s, _k, _sf, _hf, _t) in classical:
    _grey_hf = _hf + "1'"
    _expected = _k + "1'"
    _got = collapse_full_hm(_s, _hf) + "1'"
    if _got != _expected:
        _grey_collapse_errors.append(f"{_expected}: Full-HM '{_grey_hf}' collapses to '{_got}', expected '{_expected}'")
if _grey_collapse_errors:
    raise ValueError("Grey Full-HM -> app-key collapse mismatch(es):\n" + "\n".join(_grey_collapse_errors))

L+=["","## Table C — The 32 grey groups (Type II / ITC MP1), derived","",
"Not in ITC 1.5.2.3 or Birss Table 6. Each = classical parent ⊗ {1,1'}: Schoenflies = parent<sub>R</sub>, HM/Shubnikov = parent + `1'`. Operators = the parent's operators **plus their time-reversed (×1') copies**; generators = the parent's σ(N) **plus** the pure time-reversal generator `1'`.","",
"| System | Schoenflies | App key | HM full | Shubnikov | Parent |",
"|---|---|---|---|---|---|"]
for (s,k,sf,hf,t) in classical:
    L.append(f"| {s} | {sf_grey(sf)} | `{k}1'` | {hf}1' | `{t['shub']}1'` | `{k}` |")

L+=["","**Totals:** 90 (ITC 1.5.2.3: 32 colourless + 58 black-white) + 32 grey = **122**.","",
"*Sources:* Schoenflies from ITC Table 1.5.2.3 — but in the **app/Birss naming** where the two differ (the `-3` family is `C3i`, not ITC's `S6`; sole such case). Full HM — ITC Table 1.5.2.3 (`ch1o5_.pdf`; hexagonal and cubic rows read directly from the page image, including the O<sub>h</sub>/T<sub>h</sub> full-HM). Shubnikov, operators, generators — Birss Table 6. Type scheme — ITC §1.5.2 / Bradley–Cracknell.","",
"*Rendering note:* column widths are not settable in Markdown; Tables A and B are split precisely so that long full-HM strings (Table A) and long operator lists (Table B) each get the full column width and stop wrapping across many lines.","",
"## Changelog","",
"- **2026-07-01**: Initial version — 122 groups (Table A nomenclature, Table B operators/generators, Table C grey), reading guide, type scheme, App↔Birss↔ITC comparison.",
"- **2026-07-02**: Schoenflies naming of the `-3` family changed S₆ → C₃ᵢ per the app's Birss-wins rule (Birss Table 3 lists `C3i(S6)`, C3i primary); ITC's S₆ spelling noted per row; C₃ᵢ≡S₆ added to the comparison table. Sole Schoenflies-naming divergence between the two sources.",
"- **2026-07-02**: Table B regenerated after `birss-tables` table-6 pass-5 book-scan corrections — five rows updated: `-4'm2'` (operator column was transcribed in the wrong axis frame), `6'22'` (two missing time-reversal primes), `6'mm'`/`-6m'2'`/`6'/m'mm'` (σ' generator entries). See table-6.md pass-5 notes for evidence.",
"- **2026-07-04**: Full HM of `6'/mm'm` corrected to `6'/m 2/m' 2'/m` (Birss positions, frame corrected per table-6.md's σ(2) reading); ITC-divergence note added (same orientation, different short string). Table B regenerated after table-6.md's σ(4)→σ(2) correction for this row. Added a Full-HM → app-key collapse guard covering all 122 rows (this was the only genuine collapse discrepancy found); added a new comparison-table row for the same-orientation-different-string divergence class."]

(TABLES / "table-nomenclature.md").write_text("\n".join(L) + "\n", encoding="utf-8")
print(f"Wrote {TABLES/'table-nomenclature.md'}: Table A+B (90) + Table C grey ({len(classical)}) = 122")
