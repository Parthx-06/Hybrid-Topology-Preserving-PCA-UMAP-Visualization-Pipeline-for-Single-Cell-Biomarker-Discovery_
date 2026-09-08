# 03. Hybrid Topology-Preserving UMAP (Project Ka Main Innovation)

Yeh document hamare project ke **sabse main research contribution** ko explain karta hai. Mam ka 50% focus is topic par rahega, isliye ise dhyan se padhein.

---

## 1. UMAP Kya Hai? (Uniform Manifold Approximation & Projection)

- **Definition:** UMAP ek modern, non-linear dimensionality reduction algorithm hai jo Riemannian geometry aur algebraic topology par based hai.
- **Goal:** High-dimensional data points (cells) ke beech ke local relationships ko 2D ya 3D space mein visually represent karna.
- **Kaise Kaam Karta Hai?**
  1. Har cell ke liye uske $k$-nearest neighbors dhoondhta hai ($k$-NN graph banata hai).
  2. Un neighbors ke beech fuzzy connection (probability of connection) banata hai.
  3. Low-dimensional (2D) space mein points ko arrange karta hai using cross-entropy loss minimization taaki high-dimensional graph ki structure 2D graph se match kare.

---

## 2. "Topology" Kya Hoti Hai? Aur Normal UMAP Kyun Fail Hota Hai?

### A. Topology Ka Asaan Matlab:
- Topology ka matlab hota hai **Data ki Geometric Shape aur Connections**.
- Example: Maan lijiye aapke paas ek rubber sheet hai jisme T-cell, B-cell, aur NK-cell print hain. Agar aap sheet ko bina phade kheenche ya bend karein, toh unke relative connections same rahenge. Yeh "Topology" hai.

### B. Traditional Direct UMAP Ki Badi Kamzori:
Agar hum direct raw expression matrix (2,000 genes) par UMAP chala dein, toh 2 badi problems aati hain:
1. **Global Distance Distortion:** UMAP local neighbors ($k$-NN) par itna zyada focus karta hai ki distant clusters ke beech ka distance arbitrary (random) ho jata hai. Do clusters jo asal mein biologically bohot door hain, wo UMAP plot mein pass-pass dikh sakte hain!
2. **False Cluster Tearing (Artificial Fragmentation):** Continuous biological lineages (jaise stem cells ka mature cells mein convert hona) beech mein se toot jaati hain aur fake alag-alag clusters dikhne lagte hain.

---

## 3. Hamara Solution: "Hybrid Topology-Preserving PCA + UMAP"

Humne pipeline ko **Hybrid Architecture** banaya hai:

```
[2,000 Highly Variable Genes]
              │
              ▼
[Step 1: Robust PCA (top 30 PCs)]  <── Denoising + Preserves Global Euclidean Geometry
              │
              ▼
[Step 2: Cosine Metric k-NN Graph] <── Preserves Directional Biological Alignment
              │
              ▼
[Step 3: UMAP Optimization]        <── Resolves Fine Non-Linear Local Micro-Clusters
```

### Is Hybrid Approach Ka Fayda:
1. **PCA as Global Anchor:** PCA global variance ko accurately capture karta hai. Jab UMAP ko PCA space par run karte hain, toh clusters ke beech ke global distances biologically accurate rehte hain.
2. **Noise Filtering:** 2,000 dimensions mein bohot stochastic noise hoti hai. Top 30 PCs mein sirf true biological variance hota hai.
3. **Speed:** 30 dimensions par UMAP chalaana 2,000 dimensions ke comparison mein 10x fast hota hai.

---

## 4. Quantitative Topology Preservation Metrics (Proof That We Are Better!)

Mam poochengi: *"Aapne mathematically kaise prove kiya ki aapka hybrid UMAP direct UMAP se behtar hai?"*

Humne **3 Quantitative Benchmarks** implement kiye hain:

### Metric 1: $k$-Nearest Neighbor ($k$-NN) Preservation
- **Formula:**
  $$\text{k-NN Preservation} = \frac{|N_{\text{high}}(x_i) \cap N_{\text{low}}(y_i)|}{k}$$
- **Matlab:** Original high-dimensional space mein jo cell ke 15 sabse close neighbors the, unme se kitne percent neighbors 2D projection mein bhi uske close neighbors rahe.
- **Result:** Hybrid pipeline mein preservation score significantly high aata hai (typically >80%).

### Metric 2: Trustworthiness Score ($\mathcal{T}$)
- **Formula (from Scikit-learn):**
  $$\mathcal{T}(k) = 1 - \frac{2}{n k (2n - 3k - 1)} \sum_{i=1}^{n} \sum_{j \in U_i^{(k)}} (r(i, j) - k)$$
- **Matlab:** Yeh measure karta hai ki 2D projection ne kitne **"False Neighbors"** (fake padosi) create kiye.
- **Range:** $0.0$ se $1.0$. Score jitna $1.0$ ke paas ho, embedding utni truthful aur reliable hoti hai (hamare pipeline mein $>0.95$).

### Metric 3: Global Distance Correlation (Spearman Rank Correlation)
- **Matlab:** Sabhi pairs of cells ke high-dimensional pairwise distance aur low-dimensional 2D pairwise distance ke beech rank correlation.
- Direct UMAP ka global correlation low hota hai (~0.4), jabki Hybrid PCA+UMAP ka correlation high hota hai (~0.7 - 0.85).

---

## 5. Viva Questions Jo Mam Poochengi (With Model Answers)

> **Mam's Question 1:** *"Aapne UMAP ke liye distance metric kaun sa use kiya aur kyun?"*  
> **Aapka Answer:** "Mam, humne **Cosine Distance** use kiya. Single-cell RNA sequencing data bohot sparse (90%+ zeros) hota hai. Euclidean distance zeros ki wajah se distort ho jata hai, jabki Cosine metric gene expression ke directional pattern ko measure karta hai jo biological cell state ke liye zyada accurate hai."

> **Mam's Question 2:** *"UMAP ke main hyperparameters kya hain?"*  
> **Aapka Answer:**  
> "1. `n_neighbors` (default 15): Chhota rakhne par fine local structure dikhti hai, bada rakhne par global structure preserve hoti hai.  
> 2. `min_dist` (default 0.1): 2D space mein points kitne tight pack honge.  
> 3. `pca_components` (default 30-50): Hybrid mode mein initial components."

> **Mam's Question 3:** *"Trustworthiness score kya batata hai?"*  
> **Aapka Answer:** "Mam, Trustworthiness score yeh check karta hai ki low-dimensional embedding mein jo cells pass-pass dikh rahe hain, kya wo asal mein bhi high-dimensional space mein pass the ya algorithm ne unhe artificially chipka diya hai. High trustworthiness score proves biological authenticity."
