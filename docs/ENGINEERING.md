# Engineering models and limits

All input fields state their expected units. Formula calculations use JavaScript
double-precision arithmetic and bounds validation. Display rounding is separate
from the samples used for plots and CSV export. There is no symbolic algebra,
automatic inference of unit dimensions in arbitrary expressions, or arbitrary eval.

| Model          | Formula                                | Scope                                                             |
| -------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Projectile     | x = v cosθ t; y = h + v sinθ t − gt²/2 | Flat ground, no drag, constant gravity                            |
| Spring         | ω = √(k/m); x = A cos(ωt)              | Linear spring, no damping, zero initial velocity                  |
| RC charge      | τ = RC; Vc = Vs(1 − exp(−t/RC))        | Ideal DC components; initially uncharged capacitor                |
| Cantilever     | δ = FL³/(3EI); σ = FLc/I               | Tip load, constant section, small deflection, linear elastic beam |
| Ohm            | I = V/R; P = V²/R                      | Ideal steady DC resistor                                          |
| Force          | F = ma                                 | Constant mass; inertial frame                                     |
| Kinetic energy | E = mv²/2                              | Nonrelativistic translation                                       |
| Sensible heat  | Q = mcΔT                               | Constant heat capacity; no phase change or loss                   |

The beam model warns when deflection exceeds 5% of length, but this threshold is
only a heuristic flag. It does not assess yield strength, buckling, fatigue,
connections, stability, codes, or safety factors. A stress result alone is not a
design approval. Young's modulus is input in Pa, not GPa, and second moment is m⁴.

Plots have 241 analytical samples. Spring plots warn when the chosen time window
contains too many oscillations for readable sampling. Playback takes six wall-clock
seconds for the whole plotted interval; the displayed simulation time is physical
time. Plots automatically scale axes and are not necessarily equal-scale geometry.

The unit converter checks compatible dimensions. Temperature conversion handles
absolute temperatures and rejects values below absolute zero; temperature
differences should use kelvin differences in the heat calculator.

Checks cover independent known values, sample endpoints, energy, time constants,
input limits, incompatible units, and absolute-temperature offsets. They establish
the implementation of these idealized formulas, not physical validity for a design.
