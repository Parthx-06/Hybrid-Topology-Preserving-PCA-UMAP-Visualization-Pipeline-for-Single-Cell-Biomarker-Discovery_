# CellMap BioAnalytics — Student & Beginner Viva Preparation Kit

Yeh folder **complete beginners** ke liye banaya gaya hai jinhe biological ya machine learning algorithms ka pehle se knowledge nahi hai. Isme har ek page, algorithm, aur concept ko step-by-step simple **Hindi-English (Hinglish)** mein explain kiya gaya hai taaki agar examiner/Mam koi bhi question poochein, toh aap confidently jawab de sakein.

---

## 📑 Index & Reading Order (Padhne Ka Tareeqa):

| Document | Topic | Description |
|---|---|---|
| 📘 **[00. Project Overview & Biology Basics](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/00_PROJECT_OVERVIEW_AND_BIOLOGY_BASICS.md)** | Core Biology & Pipeline | scRNA-seq kya hai, Bulk RNA-seq se difference, AnnData `.h5ad` structure, aur end-to-end pipeline summary. |
| 🧪 **[01. Quality Control & Preprocessing](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/01_QUALITY_CONTROL_AND_PREPROCESSING.md)** | QC & Normalization | Dying cells, mitochondrial gene leakage (`pct_counts_mito`), empty droplets, library size normalization, log1p, aur Highly Variable Genes (HVG). |
| 📊 **[02. PCA & Dimensionality Reduction](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/02_PCA_AND_DIMENSIONALITY_REDUCTION.md)** | Linear Reduction | PCA kaise kaam karta hai, SVD, scree plot (elbow curve), PC loadings, aur PCA akela kaafi kyun nahi hai. |
| 🗺️ **[03. Hybrid Topology-Preserving UMAP](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/03_HYBRID_TOPOLOGY_PRESERVING_UMAP.md)** | Main Innovation | Direct UMAP vs Hybrid PCA+UMAP, topology preservation, k-NN retention, trustworthiness score ($\mathcal{T}$), aur distance rank correlation. |
| 🔬 **[04. Cell Clustering (Leiden & HDBSCAN)](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/04_CLUSTERING_LEIDEN_AND_HDBSCAN.md)** | Unsupervised Grouping | Graph-based Leiden vs Louvain, density-based HDBSCAN, resolution parameter, aur suspicious cluster detection. |
| 🎯 **[05. Differential Expression & Biomarkers](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/05_DIFFERENTIAL_EXPRESSION_AND_BIOMARKERS.md)** | Target Identification | Wilcoxon rank-sum test, Benjamini-Hochberg FDR, volcano plots, multi-factor composite biomarker scoring, aur ROC-AUC curves. |
| ⚡ **[06. Viva Cheat Sheet — Top 25 Questions](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/06_VIVA_CHEAT_SHEET_TOP_25_QUESTIONS.md)** | Quick Revision | **Sabse Important!** Top 25 expected viva questions aur unke exact, confident answers. |
| 📁 **[07. Data Files Explanation & Readable CSVs](file:///c:/Users/parth/OneDrive/Documents/MLDS/cellmap-bioanalytics/PAGE_BY_PAGE_ANALYSIS/07_WHY_H5AD_IS_BINARY_AND_READABLE_DATA.md)** | Dataset Format | `.h5ad` binary kyun dikhta hai, readable CSVs kahan hain (`data/readable_csv/`), aur Excel mein inspect kaise karein. |

---

## 🎯 Quick 30-Second Elevator Pitch (Agar Mam kahein: "Apna project 30 seconds mein samjhao")

> *"Mam, hamara project single-cell RNA sequencing data ke liye ek computational biology platform hai. Single-cell data bohot high-dimensional aur noisy hota hai. Humne ek **Hybrid Topology-Preserving PCA + UMAP pipeline** develop kiya hai jo pehle PCA se noise filter karta hai aur global geometry anchor karta hai, phir UMAP ke zariye accurate non-linear 2D cellular map banata hai. Iske baad Leiden community detection se cell populations cluster hoti hain, aur Wilcoxon rank-sum test plus multi-factor composite scoring se drug targets aur diagnostic biomarkers mathematically rank hote hain."*
