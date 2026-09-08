# 00. Project Overview & Biology Basics (Beginner's Guide)

Yeh document aapko project ki **Biology**, **Core Concept**, aur **Problem Statement** itne aasan tareeqe se samjhayega ki agar Viva/Exam mein Mam aapse basic se basic ya deep sawal poochein, toh aap confidently answer kar sakein.

---

## 1. Project Ka Title Kya Hai?
**"Hybrid Topology-Preserving PCA + UMAP Visualization Pipeline for Single-Cell Biomarker Discovery"**

### Is Title Ka Asaan Matlab (Breakdown):
- **Single-Cell:** Hum ek-ek cell ko individual level par analyze kar rahe hain.
- **Biomarker Discovery:** Har cell type (jaise cancer cell, T-cell, B-cell) ke khaas pehchaan wale genes (biomarkers) dhoondh rahe hain jo bimari diagnose karne ya medicine banane mein kaam aate hain.
- **PCA (Principal Component Analysis):** Ek mathematical technique jo noise ko saaf karti hai aur main biological variation ko retain karti hai.
- **UMAP:** Ek modern Machine Learning algorithm jo high-dimensional data ko sundar 2D map mein convert karta hai.
- **Hybrid Topology-Preserving:** Normal UMAP cells ki actual biological shape/dooriyan (topology) ko distort kar deta hai. Humne **PCA + UMAP ko combine (hybrid)** kiya hai taaki cells ki asli shape aur distances maintain rahein.

---

## 2. Biology Ke Basics (Jo Mam Pakka Poochengi!)

### Q1: Bulk RNA-seq aur Single-Cell RNA-seq (scRNA-seq) mein kya farq hai?
- **Bulk RNA-seq (Purana Tareeqa):**
  - *Analogy (Fruit Smoothie):* Maan lijiye aapne Apple, Banana, Strawberry ko mixer mein pees kar smoothie bana li. Ab aap taste karke yeh nahi bata sakte ki smoothie mein specific kitna sugar sirf strawberry se aaya.
  - *Reality:* Bulk RNA-seq mein hazaron cells ko ek saath crush karke average gene expression nikaala jata hai. Rare cells (jaise shuruati cancer cell ya rare immune cell) chup jaate hain.
- **Single-Cell RNA-seq (Naya Tareeqa - Jo Hamara Project Karta Hai):**
  - *Analogy (Fruit Salad):* Har fruit alag bowl mein rakha hai. Aap har ek cell ka alag-alag gene expression measure kar sakte hain.
  - *Benefit:* Humein pata chalta hai ki blood sample mein kitne T-cells hain, kitne Monocytes hain, aur kaun sa specific cell bimaari faila raha hai.

### Q2: Gene Expression Kya Hota Hai?
- Hamari body ke har cell mein DNA same hota hai. Par ek Heart cell aur ek Brain cell alag kyun kaam karte hain?
- Kyunki unke **Genes ka Expression alag hota hai**.
- DNA se banta hai **mRNA** (Transcription). Jis cell mein jis gene ka mRNA jitna zyada banta hai, us gene ka "Expression Level" utna high hota hai.
- scRNA-seq machine count karti hai: **Cell A mein Gene X ke kitne mRNA molecules mile.**

### Q3: `.h5ad` file kya hoti hai? AnnData Structure kya hai?
Mam zaroor poochengi: *"Aapne dataset kis format mein store kiya hai?"*
- **Answer:** Humne Python ki standard bioinformatics library **AnnData (`.h5ad` file)** use ki hai (HDF5 format).
- Isme 5 main hisse hote hain:
  1. `X`: Expression Matrix (Rows = Cells, Columns = Genes).
  2. `obs` (Observations): Cells ki metadata (e.g., cell barcode, batch, patient condition: healthy/disease).
  3. `var` (Variables): Genes ki metadata (e.g., gene symbol, mitochondrial status).
  4. `obsm`: Multi-dimensional embeddings (jaise PCA coordinates `X_pca`, UMAP coordinates `X_umap`).
  5. `uns` (Unstructured): Analysis parameters aur plots ka data.

---

## 3. High-Dimensional Data Ki Problem Kya Hai? (The Curse of Dimensionality)

- Hamare demo dataset mein:
  - **4,300 Cells** hain.
  - **2,054 Genes** hain (real human data mein 20,000+ genes hote hain).
- Mathematically, har cell **2,054-dimensional space** mein ek point hai!
- Human eye sirf 2D ya 3D dekh sakti hai. 2,054 dimensions ko plot karna impossible hai.
- Isliye humein **Dimensionality Reduction** (PCA aur UMAP) ki zaroorat padti hai taaki 2,054 dimensions se 2 dimensions (X, Y axis) par cells ko map kiya ja sake bina unka relation khoe.

---

## 4. End-to-End Pipeline Summary (Ek Nazar Mein Flow)

```
[1. Raw Counts Matrix (4300 cells x 2054 genes)]
                       │
                       ▼
[2. Quality Control (QC)]
   - Filter dead cells (high mitochondrial genes)
   - Filter empty droplets (low total counts)
                       │
                       ▼
[3. Normalization & Preprocessing]
   - Library size normalization (10,000 counts/cell)
   - Log1p transformation (log(1 + x))
   - HVG selection (Top highly variable genes)
                       │
                       ▼
[4. Principal Component Analysis (PCA)]
   - Denoise data, compress into top 10-50 components
   - Scree plot & gene loadings
                       │
                       ▼
[5. Hybrid Topology-Preserving UMAP]
   - PCA-initialized graph + cosine metric
   - Preserve global distance + local clusters
                       │
                       ▼
[6. Cell Clustering (Leiden / HDBSCAN)]
   - Unsupervised grouping of cells into cell types
                       │
                       ▼
[7. Differential Expression (Wilcoxon / t-test)]
   - Compare each cluster vs remaining cells
   - Calculate Log Fold Change & adjusted p-value
                       │
                       ▼
[8. Biomarker Discovery & Ranking]
   - Composite score formula (Effect Size + Significance + Prevalence + Specificity + AUC)
   - ROC curve generation & validation warnings
                       │
                       ▼
[9. Interactive Web Dashboard]
   - Real-time visualization, filtering, and reporting
```
