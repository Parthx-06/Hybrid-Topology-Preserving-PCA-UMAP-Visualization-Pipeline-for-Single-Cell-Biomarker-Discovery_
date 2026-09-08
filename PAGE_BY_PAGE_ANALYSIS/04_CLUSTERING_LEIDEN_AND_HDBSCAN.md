# 04. Cell Clustering (Leiden & HDBSCAN In-Depth Analysis)

Jab hum cells ka 2D map bana lete hain, tab agla sawal yeh hota hai: **"In hazaron cells mein se kaun se cells T-cells hain, kaun se B-cells hain, aur kaun se Monocytes hain?"** 

Is document mein hum samjhenge ki machine learning bina kisi prior label ke cells ko clusters mein kaise divide karti hai.

---

## 1. Clustering Kyun Karte Hain? (Unsupervised Learning)

- Jab patient ka blood sample sequence hota hai, machine yeh likh kar nahi deti ki "yeh cell T-cell hai". Machine sirf gene expression counts deti hai.
- Hum **Unsupervised Clustering** use karte hain:
  - Jin cells ka gene expression profile aapas mein similar hota hai, algorithm unhe ek **Cluster** mein daal deta hai.
  - Baad mein hum un clusters ke marker genes check karke unhe biological cell type (jaise CD4+ T-cell, Memory B-cell) label karte hain.

---

## 2. Algorithm 1: Leiden Algorithm (Hamara Primary Method)

### A. Leiden Algorithm Kya Hai?
- Leiden ek **Graph-Based Community Detection Algorithm** hai.
- Yeh cell-to-cell neighborhood graph par chalta hai. Agar do cells ke beech strong connection (edges) hain, toh wo ek hi community (cluster) ka hissa banenge.

### B. Louvain vs Leiden (Mam Pakka Yeh Question Poochengi!):
> *"Aapne Louvain algorithm kyun nahi use kiya? Leiden algorithm kyun use kiya?"*

- **Louvain Algorithm Ki Problem:** Louvain algorithm mein ek bohot badi mathematical flaw hai — wo aksar **"Disconnected Communities"** bana deta hai. Yaani ek cluster ke andar do aise sub-groups hote hain jinke beech aapas mein koi connection hi nahi hota!
- **Leiden Ka Solution:** Leiden algorithm guarantees deta hai ki har ek cluster well-connected hoga. Isme 3 phases hote hain:
  1. Local movement of nodes
  2. Refinement of the partition (guarantees connectivity)
  3. Aggregation of the network based on the refined partition
- Hamare system mein `igraph` aur `leidenalg` C-based backend use hota hai jo ultra-fast execute hota hai.

### C. Leiden Ka Main Parameter: Resolution
- **Resolution Parameter ($r$):**
  - Agar $r = 0.2$ (Chhoti resolution) $\rightarrow$ Kam clusters banenge (broad cell types: Lymphocytes vs Myeloid).
  - Agar $r = 1.0$ ya $1.2$ (Badi resolution) $\rightarrow$ Zyada clusters banenge (fine sub-types: CD4 Naive T-cell vs CD4 Memory T-cell vs Regulatory T-cell).
  - Hamara default resolution: **0.5 - 0.8**.

---

## 3. Algorithm 2: HDBSCAN (Density-Based Clustering Option)

### A. HDBSCAN Kya Hai?
- **Hierarchical Density-Based Spatial Clustering of Applications with Noise**.
- Yeh graph par nahi, balki points ki spatial density par kaam karta hai jahan dense areas clusters bante hain aur sparse areas noise bante hain.

### B. HDBSCAN Ka Sabse Bada Benefit:
- HDBSCAN cells ko zabardasti kisi cluster mein daalna zaroori nahi samajhta.
- Jo cells damaged hain ya transition state mein hain aur kisi cluster mein fit nahi hote, HDBSCAN unhe **Label = -1 (Noise / Outlier)** assign kar deta hai.
- Isse clean aur high-confidence clusters milte hain.

---

## 4. Suspicious Cluster Detection (Quality Assurance Feature)

Hamara platform automatic diagnostics run karta hai jo suspicious clusters identify karta hai:
1. **Low Gene Count Cluster Warning:** Agar kisi cluster ke cells ka average gene count baaki dataset se bohot kam hai, toh warning aati hai: *"Cluster X may represent dying cells or debris"*.
2. **High Mito Cluster Warning:** Agar kisi cluster mein average mitochondrial percentage >15% hai, toh system flag kar deta hai.
3. **Small Sample Warning:** Agar kisi cluster mein <15 cells hain, toh statistical power warning trigger hoti hai.

---

## 5. Viva Questions Jo Mam Poochengi (With Model Answers)

> **Mam's Question 1:** *"Leiden clustering run karne ke liye input kya hota hai?"*  
> **Aapka Answer:** "Mam, Leiden clustering ke liye input raw matrix nahi hota, balki cells ka **Shared Nearest Neighbor (SNN) Graph** hota hai, jo humne PCA components par compute kiya hota hai."

> **Mam's Question 2:** *"Agar Mam poochein: 'Mujhe cell types ke sub-populations dekhne hain, toh aap dashboard par kya change karoge?'"*  
> **Aapka Answer:** "Mam, hum Cluster Explorer mein jaakar Leiden ka **Resolution parameter badha denge** (e.g. 0.5 se 1.2). Isse algorithm broader clusters ko further sub-clusters mein partition kar dega."

> **Mam's Question 3:** *"HDBSCAN cluster -1 kya represent karta hai?"*  
> **Aapka Answer:** "Cluster -1 noise ya unassigned cells ko represent karta hai jinki local density cluster formation ke minimum threshold ko meet nahi karti."
