# 02. Principal Component Analysis (PCA) & Dimensionality Reduction

Is document mein hum **PCA (Principal Component Analysis)** ko itne detail mein samjhenge ki aap mathematical formulas, scree plots, aur gene loadings ko kisi ko bhi confidentally samjha sakein.

---

## 1. PCA Kya Hai Aur Kyun Karte Hain?

- **Problem:** Normalization aur HVG selection ke baad bhi hamare paas **2,000 Genes (2,000 Dimensions)** bache hain.
- **PCA Ka Kaam:** PCA ek **Linear Dimensionality Reduction** technique hai. Yeh 2,000 correlated features ko naye uncorrelated orthogonal axes (jinhe **Principal Components - PCs** kehte hain) mein convert kar deta hai.
- **Key Property:**
  - **PC1 (First Principal Component):** Data ke andar sabse maximum variation ko capture karta hai.
  - **PC2 (Second Principal Component):** PC1 ke perpendicular (orthogonal) hota hai aur bachi hui variance mein se sabse zyada capture karta hai.
  - Har agla PC pichle se kam variance capture karta hai.

---

## 2. PCA Ke Mathematical Concepts (Simple Language Mein)

### A. Singular Value Decomposition (SVD)
PCA calculate karne ke liye hum normalized centered matrix $X$ ka SVD karte hain:
$$X = U \Sigma V^T$$
- $U$: Cell coordinates (PCA projection space).
- $\Sigma$: Singular values (Variance ka magnitude).
- $V^T$: **Eigenvectors ya Loadings** (Kaun sa gene kis PC mein kitna contribute kar raha hai).

### B. Explained Variance Ratio
- **Matlab:** Ek specific PC pure dataset ke kitne percent biological variation ko explain kar raha hai.
- Formula:
  $$\text{Explained Variance Ratio}(PC_i) = \frac{\lambda_i}{\sum_{j=1}^{K} \lambda_j}$$
- For example, agar PC1 ka ratio 0.28 hai, iska matlab PC1 akela pure dataset ka **28% variation** represent kar raha hai.

### C. Scree Plot (Elbow Curve)
- **Website par kya dikhta hai:** Ek bar-chart / line-plot jo har PC ka explained variance dikhata hai.
- **Elbow Point:** Shuru ke components (jaise PC1 se PC10 ya PC20) par line tezi se drop hoti hai, phir flat ho jati hai.
- **Rule:** Jahaan par curve "elbow" banata hai (flat hone lagta hai), hum utne top components (e.g. 10 ya 30 PCs) select kar lete hain. Baki ke components mostly **technical noise** hote hain jinhe discard kar diya jata hai.

### D. Gene Loadings (Weights)
- **Kaun sa gene PC1 ko drive kar raha hai?**
  - Agar PC1 par *CD3D* aur *CD4* ke loadings positive high hain, iska matlab PC1 cell type separation mein T-cells ko differentiate kar raha hai.
  - Loadings humein biological interpretability dete hain.

---

## 3. PCA Ki Limits: PCA Akela Kaafi Kyun Nahi Hai? (Critical Point!)

Mam zaroor poochengi: *"Agar PCA ne dimensions kam kar diye, toh UMAP ki zaroorat kyun padi? PCA se hi plot kyun nahi banaya?"*

### Real Reason:
1. **PCA is Linear:** PCA sirf straight-line linear combinations bana sakta hai. Lekin biological cellular processes (cell differentiation, developmental trajectories, complex immune states) **Non-linear manifolds** par exist karti hain.
2. **Crowding Problem in 2D:** Jab aap 2,000 dimensions ko sirf 2 linear PCs (PC1 vs PC2) par force karte hain, toh bohot saare distinct cell types ek doosre ke upar overlap (crowd) ho jaate hain.
3. **Local Neighborhoods Lose Hoti Hain:** PCA global variance ko maximize karta hai, isliye micro-clusters aur fine cell subtypes alag se visible nahi hote.

---

## 4. Viva Questions Jo Mam Poochengi (With Model Answers)

> **Mam's Question 1:** *"Aapne PCA run karne se pehle data scale kiya ya nahi? Kyun?"*  
> **Aapka Answer:** "Mam, standard workflow mein scaling (`sc.pp.scale`) zero mean aur unit variance karti hai. Iska faayda yeh hota hai ki jin genes ka absolute expression naturally bohot high hota hai, wo PCA ko unfairly dominate nahi kar paate; har gene ko equal statistical weight milta hai."

> **Mam's Question 2:** *"Scree plot se hum kitne Principal Components choose karte hain?"*  
> **Aapka Answer:** "Mam, hum cumulative explained variance aur elbow heuristic use karte hain. Aam taur par single-cell data mein top 10 se 30 components 60% se 80% biological variance capture kar lete hain, aur baki noise discard ho jati hai."

> **Mam's Question 3:** *"PC Loadings kya batate hain?"*  
> **Aapka Answer:** "Mam, PC loadings yeh represent karte hain ki original space ka kaun sa gene us Principal Component axis ke saath strongly correlated hai. Isse humein pata chalta hai ki us component ka biological driver kaun sa gene hai."
