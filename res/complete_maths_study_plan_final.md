# Mathematics for an ML Interpretability PhD
## Complete Week-by-Week Study Plan

*Starting: Monday 24 March 2026*
*Target completion: Late October 2026*
*Focus: Mechanistic interpretability and deep learning*

---

## Schedule & Rhythm

**You have:**
- 4 commute days per week (~2 hrs lecture/reading each)
- 3 evening sessions per week (~1.5 hrs focused problem work each)

**Each week splits into two parallel tracks:**

| Slot | Main Track (foundations) | Parallel Track (the book) |
|------|------------------------|--------------------------|
| Train 1 | Main course lecture | — |
| Train 2 | Main course lecture | — |
| Train 3 | Main course lecture | — |
| Train 4 | — | *Information Geometry for Generative Models* reading |
| Evening 1 | Problem set work (closed book, no solutions) | — |
| Evening 2 | Problem set work (continued) | — |
| Evening 3 | — | Book exercises + bridge connections to main course |

**Total: ~8 hrs lectures + ~3 hrs problems + ~3.5 hrs book = ~14.5 hrs/week**

**Session structure for problem evenings (Evenings 1–2):**
- First 15 min: skim train notes, re-derive one key result from memory.
- Next 60 min: work through assigned problems without solutions open.
- Final 15 min: check solutions, note errors, update confusion log.

**Session structure for book evenings (Evening 3):**
- First 30 min: re-read key sections from the week's book chapter, annotate.
- Next 45 min: work through the book's worked examples and exercises.
- Final 15 min: write a short paragraph connecting the book material to the main course topic.

**One rest day per week minimum.** Your brain consolidates during breaks.

---

## Why This Sequence

Interpretability research — especially mechanistic interpretability — has specific mathematical demands. After reviewing the field's key papers and prerequisites guides, here's what matters most and in what order:

1. **Linear algebra comes first.** Mechanistic interpretability is built on projections, eigendecomposition, SVD, low-rank approximations, change of basis, and reasoning about what matrix equations mean geometrically. Anthropic's *Mathematical Framework for Transformer Circuits* is almost entirely linear algebra. This is your most important course.

2. **Multivariable calculus is covered in full, but efficiently.** Unit 1 (vectors and matrices) is compressed to a single review session since you'll have just completed 18.06. Units 2–4 get their full treatment, including line integrals, Green's theorem, the divergence theorem, and Stokes' theorem. While these topics appear less directly in current interpretability work, they give you a complete mathematical vocabulary and the kind of deep geometric intuition that transfers to any quantitative research direction your PhD might take.

3. **Probability is essential.** Distributions, conditional expectation, Bayes' rule, and concentration inequalities appear everywhere — in probing classifiers, sparse autoencoders, and the statistical claims you'll make about circuits.

4. **Statistics gives you inference.** MLE, hypothesis testing, and Bayesian inference underpin how you evaluate whether an interpretability finding is real or noise.

5. **The book runs in parallel** because it provides the "why am I learning this?" motivation in real time, and because your existing deep learning intuition means you can engage with it meaningfully from day one.

---

## Phase 1: Linear Algebra (Weeks 1–7)

**Course: MIT 18.06SC — Linear Algebra (Gilbert Strang)**
https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/

The OCW Scholar version has lecture videos (~50 min each, so two per train ride), recitation videos, problem sets with solutions, and exams. Strang's geometric intuition is legendary and exactly what interpretability demands — you need to *see* what a matrix does, not just compute with it.

**Parallel book chapters: 1–2** (Information as Compression; Bayesian Predictive Inference)
These chapters require minimal maths prerequisites and provide beautiful motivation for everything you're about to learn. They'll give you the information-theoretic lens — compression, codelength, log loss — that the book builds everything else on.

---

### Week 1 (24–30 March) — Vectors, Matrices & Elimination

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 1: The geometry of linear equations. Lecture 2: Elimination with matrices |
| Train 2 | Lecture 3: Multiplication and inverse matrices. Lecture 4: Factorisation A = LU |
| Train 3 | Lecture 5: Transposes, permutations, vector spaces. Lecture 6: Column space and nullspace |
| Train 4 | **Book §1.1–1.2:** Shannon's insight, codelength = loss, cross entropy, perplexity |
| Evening 1 | Problems for Lectures 1–4 (geometry, elimination, multiplication, LU factorisation) |
| Evening 2 | Problems for Lectures 5–6 (vector spaces, column space, nullspace) |
| Evening 3 | **Book exercises Ch 1** (information as compression). Connection: how does dimensionality of a vector space relate to "capacity" for encoding information? |

### Week 2 (31 March – 6 April) — Vector Spaces & the Four Subspaces

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 7: Solving Ax = 0 (pivot variables, special solutions). Lecture 8: Solving Ax = b (row reduced form) |
| Train 2 | Lecture 9: Independence, basis, dimension. Lecture 10: The four fundamental subspaces |
| Train 3 | Lecture 11: Matrix spaces, rank 1 matrices. Lecture 12: Graphs, networks, incidence matrices |
| Train 4 | **Book §1.3–1.6:** Rate-distortion theory, generative models as compression, when cross entropy is not enough |
| Evening 1 | Problems for Lectures 7–8 (solving Ax = 0, solving Ax = b) |
| Evening 2 | Problems for Lectures 9–10 (independence/basis/dimension, four fundamental subspaces) |
| Evening 3 | **Book exercises Ch 1 continued.** Connection: the four fundamental subspaces will reappear when you think about what a linear layer's weight matrix can and cannot represent |

### Week 3 (7–13 April) — Orthogonality & Projections

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 14: Orthogonal vectors and subspaces. Lecture 15: Projections onto subspaces |
| Train 2 | Lecture 16: Projection matrices and least squares. Lecture 17: Orthogonal matrices and Gram-Schmidt |
| Train 3 | Recitation videos for lectures 14–17. Work through the projection derivation again on paper |
| Train 4 | **Book §2.1–2.2:** Posterior and posterior predictive, de Finetti and exchangeability |
| Evening 1 | Problems for Lectures 15–16 (projections and least squares — critical for interpretability) |
| Evening 2 | Problems continued. **Key exercise:** derive the projection matrix P = A(AᵀA)⁻¹Aᵀ from scratch and explain geometrically why P² = P |
| Evening 3 | **Book exercises Ch 2.** Connection: linear probes in interpretability are exactly least-squares projections — you're projecting activations onto a subspace to test if a concept is linearly represented |

### Week 4 (14–20 April) — Determinants & Eigenvalues

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 18: Properties of determinants. Lecture 19: Determinant formulas and cofactors |
| Train 2 | Lecture 20: Cramer's rule, inverse, volume. Lecture 21: Eigenvalues and eigenvectors |
| Train 3 | Lecture 22: Diagonalisation. Lecture 23: Differential equations and exp(At) |
| Train 4 | **Book §2.3–2.5:** Empirical Bayes in deep nets, selective prediction, when Bayesian inference breaks |
| Evening 1 | Problems for Lectures 18–20 (determinants) |
| Evening 2 | Problems for Lectures 21–22 (eigenvalues, eigenvectors, diagonalisation — **this is critical**) |
| Evening 3 | **Book exercises Ch 2 continued.** Connection: eigenvalues of attention head matrices (W_OV, W_QK) tell you about the head's behaviour — a key idea from Anthropic's transformer circuits paper |

### Week 5 (21–27 April) — Symmetric Matrices & SVD

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 24: Markov matrices, Fourier series. Lecture 25: Symmetric matrices and positive definiteness |
| Train 2 | Lecture 26: Complex matrices, fast Fourier transform. Lecture 27: Positive definite matrices and minima |
| Train 3 | Lecture 28: Similar matrices and Jordan form. Lecture 29: Singular value decomposition |
| Train 4 | **Book §3.1–3.2:** KL divergence (forward vs reverse), Jensen-Shannon, f-divergences |
| Evening 1 | Problems for Lectures 25 and 27 (symmetric matrices and positive definiteness) |
| Evening 2 | Problems for Lecture 29 (**SVD — absolutely critical for interpretability**). Derive the SVD and explain what U, Σ, Vᵀ each represent geometrically |
| Evening 3 | **Book exercises Ch 3 (divergences section).** Connection: SVD is used everywhere in interpretability — for low-rank approximations of weight matrices, for understanding what information a layer preserves, and for PCA of activations |

### Week 6 (28 April – 4 May) — Linear Transformations & Applications

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 30: Linear transformations. Lecture 31: Change of basis, image compression |
| Train 2 | Lecture 33: Left and right inverses, pseudoinverse. Final Course Review lecture |
| Train 3 | **3Blue1Brown: Essence of Linear Algebra** playlist (chapters on eigenvalues, change of basis, and abstract vector spaces) — consolidation through visual intuition |
| Train 4 | **Book §3.3–3.4:** Fisher information and the Riemannian metric, I-projection vs M-projection |
| Evening 1 | Problems for Lectures 30–31 and 33 (linear transformations, change of basis, pseudoinverse) |
| Evening 2 | Work **Exam 1, Exam 2, and Exam 3** under timed conditions |
| Evening 3 | **Book exercises Ch 3 (Fisher information section).** Connection: Fisher information tells you about the local geometry of a statistical model — how much information a small perturbation in parameters gives you about the data |

### Week 7 (5–11 May) — Buffer & Consolidation

| Slot | What to do |
|------|-----------|
| Train 1 | Re-watch any flagged lectures (especially SVD and eigenvalue lectures) |
| Train 2 | Watch Neel Nanda's walkthrough of *A Mathematical Framework for Transformer Circuits* (YouTube) |
| Train 3 | Continue Nanda walkthrough / read the actual paper (transformer-circuits.pub) |
| Train 4 | **Book §3.5–3.6:** Maximum entropy, exponential families, natural gradient descent |
| Evening 1 | Re-attempt all exam problems you got wrong |
| Evening 2 | **Interpretability exercise:** Read §2 of Anthropic's transformer circuits paper. Identify every place linear algebra appears (projections, low-rank decompositions, eigenvalues). Write a one-page summary of the linear algebra you now understand |
| Evening 3 | **Checkpoint.** From memory, write out: the SVD and what each component means, the projection matrix formula, the eigendecomposition, and what it means for a matrix to be positive definite. If you can't, revisit those lectures |

**✅ Phase 1 complete. You can now reason fluently about what matrix equations mean geometrically — the single most important skill for mechanistic interpretability.**

---

## Phase 2: Multivariable & Vector Calculus (Weeks 8–14)

**Course: MIT 18.02SC — Multivariable Calculus (Denis Auroux)**
https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/

**Full coverage over 7 weeks.** Unit 1 (vectors and matrices) is compressed to a single train ride since you just covered this material in 18.06. Units 2–4 are covered in full, including line integrals, Green's theorem, triple integrals, the divergence theorem, and Stokes' theorem.

**Parallel book chapters: 3 continued + 4** (geometry of probability, natural gradient, high-dimensional representations).

---

### Week 8 (12–18 May) — Vectors Review + Partial Derivatives

| Slot | What to do |
|------|-----------|
| Train 1 | Unit 1 (Vectors and Matrices): skim Parts A–C as review — you covered this thoroughly in 18.06 |
| Train 2 | Unit 2, Part A: Functions of two variables, tangent approximation, max-min problems |
| Train 3 | Unit 2, Part A continued: Second derivative test, least squares, boundaries and infinity |
| Train 4 | **Re-read Book §3.6:** Natural gradient descent, mirror descent. Now that you know partial derivatives, this section will click differently |
| Evening 1 | Unit 1 Exam 1 (take it cold as a diagnostic — it should feel easy after 18.06) |
| Evening 2 | Unit 2 Part A problems (partial derivatives, tangent planes, max-min) |
| Evening 3 | **Book connection:** Work through the natural gradient derivation in §3.6 with pen and paper. Show why the Fisher information matrix rescales the gradient. Connect to the Hessian from the second derivative test |

### Week 9 (19–25 May) — Gradient, Chain Rule & Lagrange Multipliers

| Slot | What to do |
|------|-----------|
| Train 1 | Unit 2, Part B: Chain rule, gradient, directional derivatives |
| Train 2 | Unit 2, Part C: Lagrange multipliers and constrained differentials |
| Train 3 | Recitation videos for Unit 2 Parts B–C. Re-derive the multivariable chain rule on paper |
| Train 4 | **Book §4.1:** Concentration of measure — curse of dimensionality, volume near the surface, random vectors nearly orthogonal |
| Evening 1 | Unit 2 Part B problems (gradient, chain rule, directional derivatives) |
| Evening 2 | Unit 2 Part C problems (Lagrange multipliers) |
| Evening 3 | **Book connection:** Concentration of measure explains why high-dimensional embeddings work — random vectors in high dimensions are nearly orthogonal, so you can pack many nearly-independent features. This is the geometric foundation of superposition |

### Week 10 (26 May – 1 June) — Double Integrals & the Jacobian

| Slot | What to do |
|------|-----------|
| Train 1 | Unit 3, Part A: Double integrals, iterated integrals, polar coordinates |
| Train 2 | Unit 3, Part A continued: Change of variables (Jacobian), applications of double integrals |
| Train 3 | Recitation videos for Unit 3 Part A. **Key focus:** derive *why* the Jacobian determinant appears in a change of variables |
| Train 4 | **Book §4.2–4.3:** Johnson-Lindenstrauss lemma, tokenisation and embedding geometry, anisotropy |
| Evening 1 | Unit 3 Part A problems (double integrals, switching order of integration) |
| Evening 2 | Unit 3 Part A problems continued — focus on change of variables |
| Evening 3 | **Book exercises Ch 4.** Connection: the Jacobian appears when you transform probability distributions — essential for normalising flows and for understanding how representations change between layers |

### Week 11 (2–8 June) — Vector Fields, Line Integrals & Green's Theorem

| Slot | What to do |
|------|-----------|
| Train 1 | Unit 3, Part B: Vector fields and line integrals, work, conservative fields, path independence |
| Train 2 | Unit 3, Part B continued: Gradient fields, exact differentials |
| Train 3 | Unit 3, Part C: Green's theorem and its applications |
| Train 4 | **Book §4.4–4.5:** Similarity search, angular distances, approximate nearest neighbours |
| Evening 1 | Unit 3 Part B problems (line integrals, conservative fields) |
| Evening 2 | Unit 3 Part C problems (Green's theorem) |
| Evening 3 | **Book connection + Exam 3 practice:** Work through Unit 3 Exam 3 under timed conditions. Connection: line integrals and conservative fields relate to path-independence in optimisation — gradient descent on a convex loss follows a path where the integral depends only on start and end points |

### Week 12 (9–15 June) — Triple Integrals

| Slot | What to do |
|------|-----------|
| Train 1 | Unit 4, Part A: Triple integrals in rectangular coordinates |
| Train 2 | Unit 4, Part A continued: Cylindrical and spherical coordinates, change of variables in 3D |
| Train 3 | Recitation videos for Unit 4 Part A. Practice setting up triple integrals in all three coordinate systems |
| Train 4 | **Book §3.3 revisited:** Fisher information and the Riemannian metric — with your growing calculus fluency, the local geometry of statistical manifolds will make more sense now |
| Evening 1 | Unit 4 Part A problems (triple integrals, coordinate transformations) |
| Evening 2 | Unit 4 Part A problems continued |
| Evening 3 | **Book connection:** The change-of-variables formula in 3D generalises directly to n dimensions. In probability, this is how you compute the distribution of a transformed random vector — the Jacobian scales the density |

### Week 13 (16–22 June) — Flux, Divergence Theorem & Stokes' Theorem

| Slot | What to do |
|------|-----------|
| Train 1 | Unit 4, Part B: Flux, surface integrals, divergence theorem |
| Train 2 | Unit 4, Part B continued: Applications of the divergence theorem |
| Train 3 | Unit 4, Part C: Line integrals in 3D, Stokes' theorem |
| Train 4 | **Book §3.4–3.5:** I-projection vs M-projection, maximum entropy, exponential families |
| Evening 1 | Unit 4 Part B problems (flux, divergence theorem) |
| Evening 2 | Unit 4 Part C problems (Stokes' theorem) |
| Evening 3 | **Book exercises on projections.** Connection: the divergence theorem relates a volume integral to a surface integral — this is a higher-dimensional generalisation of the fundamental theorem of calculus. The same "boundary ↔ interior" duality appears in information geometry when relating local properties (Fisher metric) to global properties (KL divergence) |

### Week 14 (23–29 June) — Buffer & Consolidation

| Slot | What to do |
|------|-----------|
| Train 1 | Re-watch any flagged calculus lectures |
| Train 2 | **3Blue1Brown:** gradient and directional derivative videos, plus the "What is backpropagation really doing?" video |
| Train 3 | Read MML book §5.1–5.4 (vector calculus chapter — backpropagation connection) |
| Train 4 | Work through Unit 4 Exam 4 under timed conditions |
| Evening 1 | Re-attempt any problems you got wrong across Units 2–4 |
| Evening 2 | **Derivation exercise:** Write out the full gradient computation for a 2-layer neural network from scratch using the multivariable chain rule. Then explain what each term means |
| Evening 3 | **Checkpoint.** From memory: the multivariable chain rule, the change-of-variables formula with Jacobian, the statement of Green's theorem, the divergence theorem, and Stokes' theorem. Also: the gradient as the direction of steepest ascent, and why the Fisher information matrix transforms the gradient |

**✅ Phase 2 complete. You now have full command of multivariable and vector calculus — gradients, Jacobians, line and surface integrals, and all three fundamental theorems.**

---

## Phase 3: Probability (Weeks 15–21)

**Course: Harvard Stat 110 — Probability (Joe Blitzstein)**
Lectures: https://www.youtube.com/playlist?list=PL2SOU6wwxB0uwwH80KTQ6ht66KWxbzTIo
Course website: https://stat110.hsites.harvard.edu/
Textbook: Blitzstein & Hwang, *Introduction to Probability*

Each lecture is ~50 min, so two fit per train ride. The book chapters for this phase connect directly to probability — you'll see the same concepts from two different angles.

**Parallel book chapters: Chapter 3 deep dive (revisiting with probability maturity) + Chapter 4 (high-dimensional geometry of representations)**

---

### Week 15 (30 June – 6 July) — Counting, Conditioning & Bayes

| Slot | What to do |
|------|-----------|
| Train 1 | Lectures 1–2: Probability, counting, story proofs |
| Train 2 | Lectures 3–4: Birthday problem, properties of probability |
| Train 3 | Lectures 5–6: Conditioning, Bayes' rule |
| Train 4 | **Re-read Book §3.1** (KL divergence) with fresh eyes — now that you've started probability, the forward vs reverse KL distinction should click |
| Evening 1 | Strategic Practice 1 (counting) |
| Evening 2 | Homework 1 + Strategic Practice 2 (conditioning) |
| Evening 3 | **Book connection:** Work through the KL divergence examples in §3.1. Compute KL(p‖q) and KL(q‖p) for two simple distributions by hand. See the asymmetry |

### Week 16 (7–13 July) — Random Variables, Expectation & Linearity

| Slot | What to do |
|------|-----------|
| Train 1 | Lectures 7–8: Gambler's ruin, random variables |
| Train 2 | Lectures 9–10: Independence, expected value, indicator r.v.s, linearity |
| Train 3 | Lectures 11–12: Poisson distribution, discrete vs continuous |
| Train 4 | **Book §3.2:** Bregman divergences, f-divergences — these generalise the divergences you've seen |
| Evening 1 | Strategic Practice 3 (random variables) |
| Evening 2 | Homework 3 — indicator r.v.s and linearity of expectation problems (these are gold) |
| Evening 3 | **Book exercises on divergences.** Connection: f-divergences unify KL, JS, chi-squared, and total variation distance. GAN training objectives are f-divergences |

### Week 17 (14–20 July) — Continuous Distributions & the Normal

| Slot | What to do |
|------|-----------|
| Train 1 | Lectures 13–14: Normal distribution, standardisation |
| Train 2 | Lectures 15–16: Midterm review, exponential distribution |
| Train 3 | Lectures 17–18: MGFs, Bayes' rule (hybrid), sums of Poissons |
| Train 4 | **Book §3.3 revisited:** Fisher information and the Riemannian metric — now that you understand distributions, this section will be much richer |
| Evening 1 | Strategic Practice 4 (continuous distributions) |
| Evening 2 | Homework 4 |
| Evening 3 | **Key exercise:** Compute the Fisher information for a Gaussian (with respect to the mean, and with respect to the variance). Show that it defines a metric on the space of Gaussians. This connects linear algebra (the metric is a matrix) to probability |

### Week 18 (21–27 July) — Joint Distributions, Covariance & Transformations

| Slot | What to do |
|------|-----------|
| Train 1 | Lectures 19–20: Joint distributions, 2D LOTUS, Multinomial |
| Train 2 | Lectures 21–22: Covariance, correlation, transformations |
| Train 3 | Lectures 23–24: Beta distribution, Bayes' billiards, Gamma |
| Train 4 | **Book §3.4–3.5:** I-projection vs M-projection, maximum entropy, exponential families |
| Evening 1 | Strategic Practice 5 (joint distributions) |
| Evening 2 | Homework 5 + **Key exercise:** Derive the PDF of Y = g(X) using the CDF method. Do it for Y = X² where X ~ N(0,1) |
| Evening 3 | **Book exercises on projections.** Connection: variational inference is I-projection (minimise KL(q‖p)); moment matching is M-projection (minimise KL(p‖q)). This is why VAEs and GANs produce different kinds of errors |

### Week 19 (28 July – 3 August) — Conditional Expectation & Inequalities

| Slot | What to do |
|------|-----------|
| Train 1 | Lectures 25–26: Order statistics, conditional expectation |
| Train 2 | Lectures 27–28: Adam's law, Eve's law, inequalities (Markov, Chebyshev, Jensen) |
| Train 3 | Re-watch lectures 25–27 — conditional expectation is worth seeing twice |
| Train 4 | **Book §6.4:** Superposition, polysemanticity, and capacity constraints — preview this; you now have the probability background to understand the geometry of superposition |
| Evening 1 | Strategic Practice 6 (conditional expectation) |
| Evening 2 | Homework 7 — Adam's law and Eve's law problems |
| Evening 3 | **Book connection:** Adam's law E[E[X|Y]] = E[X] is the mathematical backbone of the EM algorithm. Also: Jensen's inequality explains why the ELBO is a lower bound on the log evidence. Write both connections out |

### Week 20 (4–10 August) — LLN, CLT & Markov Chains

| Slot | What to do |
|------|-----------|
| Train 1 | Lectures 29–30: LLN, CLT, Chi-Square, Student-t |
| Train 2 | Lectures 31–32: Markov chains, transition matrices, stationary distributions |
| Train 3 | Lectures 33–34: Markov chains continued, course wrap-up |
| Train 4 | **Book §6.1–6.3:** The bottleneck principle, layer-by-layer information flow, attention heads as specialised feature detectors — the core interpretability chapter |
| Evening 1 | Strategic Practice 7 (limit theorems) |
| Evening 2 | Homework 9 — Markov chain problems |
| Evening 3 | **Book exercises Ch 6 (first half).** Connection: Markov chains connect to the residual stream as an iterative process — each layer reads from and writes to the stream. Stationary distributions relate to how representations stabilise in deeper layers |

### Week 21 (11–17 August) — Buffer & Consolidation

| Slot | What to do |
|------|-----------|
| Train 1 | Re-watch flagged Stat 110 lectures |
| Train 2 | Preview MIT 18.650 Lectures 1–2 |
| Train 3 | **Book §6.5–6.8:** Probing, measuring representations, implications for transfer and fine-tuning |
| Train 4 | **Book exercises Ch 6 (second half)** |
| Evening 1 | Work Stat 110 **practice final exam** under timed conditions |
| Evening 2 | Re-do all exam problems you got wrong. Pick 5 hard textbook problems from weakest chapters |
| Evening 3 | **Checkpoint.** From memory: Bayes' theorem with continuous priors, the law of total expectation, the CLT statement, KL divergence definition and its asymmetry, and what superposition means geometrically |

**✅ Phase 3 complete. You now think in distributions, reason about conditional expectations fluently, and understand how information-theoretic ideas connect to neural network representations.**

---

## Phase 4: Mathematical Statistics (Weeks 22–27)

**Course: MIT 18.650 — Statistics for Applications (Philippe Rigollet)**
https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/

Each lecture is ~80 min (one per train ride). 24 lectures total (videos for lectures 10 and 16 missing — use slides). This course teaches you to *use* probability to do inference — the skills you need to make rigorous claims about what circuits do.

**Important note:** Unlike the other courses, 18.650's 11 problem sets do **not** have published solutions on OCW. You'll need to verify your answers using the lecture notes, by discussing with peers, or by checking your reasoning against a companion text (Wasserman's *All of Statistics* pairs well). Working without an answer key is harder but closer to how research actually works.

**Parallel book chapters: Chapter 6 deep dive (continued) + Chapter 9 (PAC-Bayes and generalisation)**

---

### Week 22 (18–24 August) — Statistical Models & MLE

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 1: Introduction to statistics |
| Train 2 | Lecture 2: Statistical models |
| Train 3 | Lecture 3: Parametric inference |
| Train 4 | **Book §9.1–9.2:** Why generalisation matters, PAC learning basics |
| Evening 1 | Problem Set 1 |
| Evening 2 | PS1 continued — derive MLE for Gaussian, Bernoulli, Poisson from scratch |
| Evening 3 | **Book connection:** MLE minimises empirical cross entropy. The book's Chapter 1 showed that cross entropy = codelength. So MLE finds the model that compresses the training data best. Write this connection out formally |

### Week 23 (25–31 August) — MLE Properties, Fisher Information & Method of Moments

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 4: Maximum likelihood estimation |
| Train 2 | Lecture 5: Consistency of MLE |
| Train 3 | Lecture 6: MLE continued, method of moments |
| Train 4 | **Book §9.3–9.4:** Two-part codes, Occam's razor, PAC-Bayes bounds |
| Evening 1 | Problem Set 2 + Problem Set 3 (MLE derivations) |
| Evening 2 | PS3 continued — **Key exercise:** Derive the MLE for several distributions from scratch, then verify consistency |
| Evening 3 | **Book exercises Ch 9.** Connection: PAC-Bayes bounds tell you that generalisation depends on the "complexity" of the learned hypothesis, measured in bits. This is the MDL principle made rigorous |

### Week 24 (1–7 September) — Hypothesis Testing & Confidence Intervals

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 7: Parametric hypothesis testing |
| Train 2 | Lecture 8: Testing continued |
| Train 3 | Lecture 9: Testing and confidence intervals |
| Train 4 | **Book §10 (Evaluation Fundamentals):** skim the sections on evaluation methodology — this connects to making rigorous claims about interpretability findings |
| Evening 1 | Problem Set 4 + Problem Set 5 (Fisher information, confidence intervals, testing) |
| Evening 2 | Problem Set 6 (hypothesis testing, chi-squared) |
| Evening 3 | **Book connection:** When you claim "this attention head implements induction," you're implicitly making a statistical claim. What's your null hypothesis? What's the test? How do you control for multiple comparisons across hundreds of heads? |

### Week 25 (8–14 September) — Bayesian Statistics & Regression

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 10 (slides) + Lecture 11: Goodness of fit |
| Train 2 | Lecture 12: Testing continued. Lecture 13: Bayesian statistics |
| Train 3 | Lecture 14: Bayesian statistics continued |
| Train 4 | **Book §11 (selected sections):** Designing information-sound systems — skim for high-level principles |
| Evening 1 | Problem Set 7 + Problem Set 8 (Bayesian inference, regression) |
| Evening 2 | **Key exercise:** Derive the posterior for Gaussian prior + Gaussian likelihood. Show the posterior mean is a weighted average of prior mean and MLE. Connect to the book's discussion of empirical Bayes in deep nets (§2.3) |
| Evening 3 | **Book connection:** Bayesian linear regression is the foundation of linear probing with uncertainty. If you train a probe on activations, the posterior gives you not just a point estimate but confidence about whether a feature is represented |

### Week 26 (15–21 September) — Regression, PCA & GLMs

| Slot | What to do |
|------|-----------|
| Train 1 | Lecture 15: Regression. Lecture 16 (slides): Regression continued |
| Train 2 | Lectures 17–19: Linear regression continued, generalised linear models |
| Train 3 | Lectures 20–22: GLMs continued, PCA |
| Train 4 | **Book §12 (Scaling Laws):** skim for the information-theoretic perspective on why scaling works |
| Evening 1 | Problem Set 9 + Problem Set 10 + Problem Set 11 (regression, GLMs, PCA) |
| Evening 2 | Work the **final exam** under timed conditions |
| Evening 3 | Review all problem sets — re-do any problems marked wrong |

### Week 27 (22–28 September) — Buffer & Consolidation

| Slot | What to do |
|------|-----------|
| Train 1 | Lectures 23–24: PCA continued, course wrap-up |
| Train 2 | Re-watch any flagged 18.650 lectures |
| Train 3 | Read the Anthropic *Toy Models of Superposition* paper introduction and §1–2 |
| Train 4 | **Book §13 (Production Systems and Synthesis):** the capstone chapter tying everything together |
| Evening 1 | Re-do the hardest problem from each 18.650 problem set |
| Evening 2 | **Checkpoint.** From memory: derive MLE for a Gaussian, state the asymptotic distribution of the MLE, explain the Delta method, write the posterior for conjugate Bayesian inference, and state a PAC-Bayes bound |
| Evening 3 | Write a one-page document: "The mathematical tools I now have for interpretability research." List every concept and note where it appears in the field |

**✅ Phase 4 complete. You now have the statistical inference toolkit to make rigorous claims about what neural networks compute internally.**

---

## Phase 5: ML Capstone + Interpretability Onramp (Weeks 28–31)

**Resources:**
- Deisenroth, Faisal & Ong, *Mathematics for Machine Learning* (free PDF: https://mml-book.github.io/book/mml-book.pdf)
- ARENA Chapter 1: Mechanistic Interpretability (https://www.arena.education/chapter1)

Train time splits between MML reading and ARENA exercises. Evenings are for derivations and coding.

---

### Week 28 (29 September – 5 October) — Vector Calculus, Optimisation & Backprop

| Slot | What to do |
|------|-----------|
| Train 1 | MML Ch 5: Vector calculus — skim familiar parts, focus on §5.6 (backpropagation connection) |
| Train 2 | MML Ch 7: Continuous optimisation — gradient descent, convexity |
| Train 3 | ARENA Ch 1.1: Transformer from scratch — reading and setup |
| Train 4 | MML Ch 5 & 7 exercises |
| Evening 1 | MML Ch 7 exercises — especially convexity proofs |
| Evening 2 | **Derivation:** Full gradient computation for a 2-layer neural network using the chain rule |
| Evening 3 | Start ARENA exercises: implement a transformer from scratch in PyTorch |

### Week 29 (6–12 October) — Probability Recap & ML Derivations

| Slot | What to do |
|------|-----------|
| Train 1 | MML Ch 6: Probability and distributions — mostly review, focus on §6.6 (conjugate priors) and §6.7 (change of variables) |
| Train 2 | MML Ch 8: When models meet data — Bayesian linear regression |
| Train 3 | MML Ch 9: PCA from maximum variance and minimum reconstruction error |
| Train 4 | ARENA Ch 1.2: TransformerLens and mechanistic interpretability basics |
| Evening 1 | **Derivation:** KL divergence between two Gaussians from scratch. Show MLE for linear regression = OLS |
| Evening 2 | MML Ch 8–9 exercises — derive the predictive distribution and both PCA derivation paths |
| Evening 3 | ARENA exercises: use TransformerLens to inspect attention patterns in a small model |

### Week 30 (13–19 October) — GMMs, SVMs & Interpretability Tools

| Slot | What to do |
|------|-----------|
| Train 1 | MML Ch 10: Gaussian mixture models, EM algorithm |
| Train 2 | MML Ch 11: SVMs — primal, dual, kernel trick |
| Train 3 | ARENA Ch 1.3–1.4: Induction heads, probing and representations |
| Train 4 | Read: Anthropic's *A Mathematical Framework for Transformer Circuits* (full paper) |
| Evening 1 | **Capstone derivation:** Derive the full EM algorithm for a 2-component GMM from scratch. Every E-step expectation, every M-step update. This uses probability, calculus, and linear algebra simultaneously |
| Evening 2 | ARENA exercises: reverse-engineer induction heads in a 2-layer model |
| Evening 3 | ARENA exercises: train a linear probe on model activations |

### Week 31 (20–26 October) — Superposition & Sparse Autoencoders

| Slot | What to do |
|------|-----------|
| Train 1 | Read: Anthropic's *Toy Models of Superposition* paper |
| Train 2 | Read: Anthropic's *Towards Monosemanticity* (SAE paper) |
| Train 3 | ARENA Ch 1.5+: Superposition, toy models, SAE exercises |
| Train 4 | **Book §6.4 re-read:** Superposition, polysemanticity, capacity constraints — now with full mathematical and empirical context |
| Evening 1 | ARENA exercises: implement a toy model of superposition |
| Evening 2 | ARENA exercises: train a sparse autoencoder on model activations |
| Evening 3 | **Final checkpoint.** Write a 2-page document connecting everything: how linear algebra (SVD, projections, change of basis), probability (Bayes, conditional expectation, KL divergence), statistics (MLE, hypothesis testing, probing), and information geometry (Fisher metric, compression, superposition) all come together in mechanistic interpretability |

**✅ Phase 5 complete. You're ready to start doing original interpretability research.**

---

## Calendar Overview

| Weeks | Dates | Phase | Main Course | Book Chapters |
|-------|-------|-------|-------------|---------------|
| 1–7 | 24 Mar – 11 May | Phase 1 | MIT 18.06SC — Linear Algebra | Ch 1–2 (info theory, Bayes) + Ch 3 start |
| 8–14 | 12 May – 29 Jun | Phase 2 | MIT 18.02SC — Multivariable Calculus (full) | Ch 3 continued + Ch 4 (high-dim geometry) |
| 15–21 | 30 Jun – 17 Aug | Phase 3 | Harvard Stat 110 — Probability | Ch 3 deep dive + Ch 6 (representations) |
| 22–27 | 18 Aug – 28 Sep | Phase 4 | MIT 18.650 — Statistics | Ch 9 (PAC-Bayes) + Ch 10–12 (selected) |
| 28–31 | 29 Sep – 26 Oct | Phase 5 | MML Book + ARENA | Key papers + remaining book chapters |

**Finish date: Last week of October 2026.**

---

## What to Do When Life Gets in the Way

**Missed a train day:** Shift by one day. Don't cram two lectures into one evening.

**Missed an evening session:** The first evening (fresh problem work) is most important. If you can only do two sessions, drop the book evening — but note what you skipped and catch up on the next train ride.

**Falling a week or more behind:** Each phase has a buffer week built in. Use it. If you've already used the buffer, cut the book reading for that phase (not the problems) and catch up on book chapters during the next phase's buffer.

**A topic won't click:** Spend one train ride on the 3Blue1Brown video for that topic, or re-watch the lecture at 1.5x. If it still doesn't click after two attempts, write it in your confusion log and move on.

**The book feels too hard:** This is expected in the early weeks. You're reading ahead of your formal preparation. Skim the proofs, focus on the worked examples and the intuitions. The same sections will feel much more accessible when you revisit them later in the plan.

---

## All Links (Free)

| Resource | URL |
|----------|-----|
| MIT 18.06SC Linear Algebra | https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/ |
| MIT 18.02SC Multivariable Calculus | https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/ |
| MIT 18.02 Recitation Notes (2024) | https://ocw.mit.edu/courses/res-18-016-multivariable-calculus-recitation-notes-fall-2024/ |
| Harvard Stat 110 YouTube | https://www.youtube.com/playlist?list=PL2SOU6wwxB0uwwH80KTQ6ht66KWxbzTIo |
| Stat 110 Course Website | https://stat110.hsites.harvard.edu/ |
| MIT 18.650 Statistics | https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/ |
| MML Book (PDF) | https://mml-book.github.io/book/mml-book.pdf |
| ARENA Chapter 1 | https://www.arena.education/chapter1 |
| 3Blue1Brown Essence of Linear Algebra | https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab |
| 3Blue1Brown Essence of Calculus | https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr |
| CS229 Probability Review | https://cs229.stanford.edu/section/cs229-prob.pdf |
| Anthropic: Transformer Circuits | https://transformer-circuits.pub/2021/framework/index.html |
| Anthropic: Toy Models of Superposition | https://transformer-circuits.pub/2022/toy_model/index.html |
| Nanda: Mech Interp Prerequisites | https://www.neelnanda.io/mechanistic-interpretability/prereqs |
| Nanda: Transformer Circuits Walkthrough | https://www.neelnanda.io/mechanistic-interpretability/a-walkthrough-of-a-mathematical-framework-for-transformer-circuits |

---

## The Confusion Log

Keep a notebook (physical or digital) with three columns:

| Date | What confused me | Resolution |
|------|-----------------|------------|
| e.g. Week 3 | Why does P² = P for a projection matrix? | Projecting twice onto the same subspace does nothing new — you're already there. Proved it algebraically from P = A(AᵀA)⁻¹Aᵀ |

Review this weekly. Many entries will resolve themselves as you progress. The ones that persist after two weeks are your highest-value learning targets — bring them to your supervisor or a study group.

---

## How You'll Know It Worked

By the end of this plan, you should be able to:

1. Read Anthropic's *Mathematical Framework for Transformer Circuits* and follow every equation.
2. Derive the MLE, compute Fisher information, and construct a confidence interval from scratch.
3. Explain what SVD reveals about a weight matrix and why low-rank approximations matter.
4. Implement a linear probe, train a sparse autoencoder, and reverse-engineer a simple circuit.
5. Hold your own in a reading group where someone presents a new interpretability paper with substantial mathematical content.
6. Look at a matrix equation in a paper and *see* what it means geometrically, not just algebraically.

That last one is what "great intuition" means. It's not about speed or memorisation — it's about the maths feeling like a language you think in rather than a language you translate from.
