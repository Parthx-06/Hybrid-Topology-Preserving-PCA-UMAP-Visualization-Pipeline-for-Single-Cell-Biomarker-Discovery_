# 06. Viva Cheat Sheet — Top 25 Most Probable Questions & Answers

Agar aapke paas time kam hai aur aapko viva mein full confidence ke saath enter karna hai, toh yeh **25 Sawal aur unke exact Answers** achhe se yaad kar lijiye. Mam inhi 25 topics ke aas-paas sawaal poochengi.

---

### Q1. Aapke project ka main objective kya hai?
**Answer:** "Mam, hamara platform single-cell RNA sequencing data ko process karke cell populations discover karta hai aur drug discovery ke liye candidate biomarkers rank karta hai. Iska main scientific innovation **Hybrid Topology-Preserving PCA + UMAP pipeline** hai jo high-dimensional cell geometry aur global distances ko preserve rakhta hai."

---

### Q2. Bulk RNA-seq aur Single-Cell RNA-seq mein kya farq hai?
**Answer:** "Bulk RNA-seq hazaron cells ka average gene expression deta hai jisse rare cell types miss ho jaate hain. Single-cell RNA-seq (scRNA-seq) har individual cell ka alag expression profile measure karta hai, jisse cellular heterogeneity aur micro-environment samajh aati hai."

---

### Q3. Single-cell data itna sparse (90%+ zeros) kyun hota hai?
**Answer:** "Iske do reasons hain:  
1. **Biological:** Har cell har gene ko express nahi karta (e.g., T-cell insulin gene ko express nahi karega).  
2. **Technical (Dropouts):** Sequencing machine ki capture efficiency 10% se 30% hoti hai, isliye low-expressed mRNA molecules capture hone se chhoot jaate hain."

---

### Q4. Dying cells ko identify karne ke liye mitochondrial percentage kyun use karte hain?
**Answer:** "Jab cell die (apoptosis) hota hai, toh uski cell membrane compromise ho jati hai aur cytoplasmic mRNA leak ho jata hai. Lekin mitochondria intact rehte hain, jisse dying cell ke total RNA pool mein mitochondrial genes ka percentage abnormally high (20% se 80%) ho jata hai."

---

### Q5. Library size normalization (1e4) kyun zaroori hai?
**Answer:** "Kyunki alag-alag cells mein sequencing depth (total read counts) alag hoti hai. Hum har cell ke total counts ko scale karke 10,000 counts per cell par normalize karte hain taaki technical variation biological variation mein na dikhe."

---

### Q6. Log1p transformation kyun karte hain?
**Answer:** "Formula $\log(1+x)$ variance ko stabilize karta hai aur highly-expressed outlier genes ke extreme effects ko compress karta hai. $+1$ isliye add karte hain taaki zero counts $\log(1)=0$ rahein aur mathematical error na aaye."

---

### Q7. Highly Variable Genes (HVG) kya hote hain aur unhe select kyun karte hain?
**Answer:** "Human genome mein 20,000+ genes hote hain, jisme se zyadatar housekeeping genes hote hain jo sabhi cells mein constant hote hain. Hum Seurat v3 method se top 2,000 HVGs select karte hain jinme cells ke beech maximum biological variation hoti hai. Isse computation fast aur noise-free ho jati hai."

---

### Q8. PCA kya karta hai?
**Answer:** "PCA ek linear dimensionality reduction technique hai jo data ke uncorrelated orthogonal axes (Principal Components) find karta hai jo variance ko maximize karte hain. PC1 sabse zyada variance capture karta hai, followed by PC2, PC3 etc."

---

### Q9. Scree plot se components kaise select karte hain?
**Answer:** "Scree plot har component ka explained variance ratio show karta hai. Jahan par curve 'elbow' banata hai aur flat ho jata hai (typically top 10 to 30 PCs), hum un components ko select karte hain aur baki components ko as noise discard kar dete hain."

---

### Q10. PCA akela kaafi kyun nahi hai? UMAP kyun use kiya?
**Answer:** "PCA ek **linear** transformation hai jo high-dimensional non-linear biological manifolds (jaise cell differentiation paths) ko capture nahi kar sakta aur 2D mein cells crowd/overlap ho jaate hain. UMAP ek **non-linear** algorithm hai jo fine local clusters ko visually alag dikhata hai."

---

### Q11. Direct UMAP ki kya problem hai aur aapka Hybrid approach kya hai?
**Answer:** "Direct UMAP local neighbors par itna zyada focus karta hai ki global distances distort ho jaate hain aur clusters arbitrarily place ho jaate hain. Hamara **Hybrid approach** pehle robust PCA chala kar global geometry anchor karta hai aur noise remove karta hai, phir uske top PCs par UMAP optimize karta hai."

---

### Q12. Aapne prove kaise kiya ki aapka hybrid pipeline better hai?
**Answer:** "Humne 3 quantitative metrics se benchmark kiya:  
1. **k-NN Preservation:** High-dimensional neighbors 2D embedding mein kitne retain hue.  
2. **Trustworthiness Score ($\mathcal{T}$):** False neighbor generation kitni kam hui (hamara score >0.95).  
3. **Spearman Rank Correlation:** Pairwise global distance accuracy."

---

### Q13. UMAP ke do sabse important hyperparameters kya hain?
**Answer:** "`n_neighbors` (jo local vs global balance control karta hai) aur `min_dist` (jo 2D space mein points ki tightness aur clustering density decide karta hai)."

---

### Q14. Leiden algorithm Louvain algorithm se behtar kyun hai?
**Answer:** "Louvain algorithm mathematically defective communities bana sakta hai jo internally disconnected hoti hain. Leiden algorithm partition refinement ke through guarantee karta hai ki har cluster internally well-connected rahe."

---

### Q15. Leiden clustering mein resolution parameter ka kya effect hota hai?
**Answer:** "Higher resolution (e.g. 1.2) zyada aur finer clusters banata hai (sub-populations identify karne ke liye), jabki lower resolution (e.g. 0.3) kam aur broader clusters banata hai."

---

### Q16. HDBSCAN clustering kya hai aur cluster -1 kya hota hai?
**Answer:** "HDBSCAN ek density-based clustering algorithm hai. Cluster -1 un cells ko represent karta hai jo kisi dense cluster mein fit nahi hote (outliers/noise/damaged cells)."

---

### Q17. Differential Expression (DE) analysis mein kya compare karte hain?
**Answer:** "Hum 'One-vs-Rest' comparison karte hain: ek specific cluster ke cells ka gene expression baaki sabhi clusters ke cells ke against statistical test se compare hota hai."

---

### Q18. Wilcoxon Rank-Sum test t-test se behtar kyun hai single-cell data ke liye?
**Answer:** "Kyunki single-cell data normally distributed nahi hota aur isme bohot saare zeros hote hain. Wilcoxon test non-parametric hai aur actual counts ki jagah unke ranks ko compare karta hai, isliye outliers se robust rehta hai."

---

### Q19. Multiple Testing Problem kya hai aur Benjamini-Hochberg correction kyun lagate hain?
**Answer:** "Jab hum hazaron genes par simultaneously hypothesis testing karte hain, toh pure chance se bohot saare false positive significant genes nikal aate hain. Benjamini-Hochberg method False Discovery Rate (FDR) ko control karke adjusted p-value generate karta hai."

---

### Q20. Volcano plot kya represent karta hai?
**Answer:** "Volcano plot ke X-axis par **$\log_2(\text{Fold Change})$** (biological effect magnitude) aur Y-axis par **$-\log_{10}(\text{adjusted } p\text{-value})$** (statistical significance) hota hai. Top-right quadrant ke genes hamare best up-regulated markers hote hain."

---

### Q21. Aapka Composite Biomarker Score kaise calculate hota hai?
**Answer:** "Yeh 5 weighted factors ka combination hai:  
1. Normalized Effect Size  
2. Statistical Significance ($-\log_{10} p$)  
3. Expression Prevalence (sensitivity)  
4. Cluster Specificity  
5. ROC-AUC classification score."

---

### Q22. ROC-AUC score kya indicate karta hai?
**Answer:** "ROC curve True Positive Rate vs False Positive Rate graph karta hai. AUC score 0.5 se 1.0 ke beech hota hai. AUC > 0.9 yeh prove karta hai ki yeh gene us specific cell type ko classify karne ke liye outstanding diagnostic marker hai."

---

### Q23. Technical Architecture: Backend aur Frontend mein kya use kiya hai?
**Answer:**  
- **Frontend:** React 19, TypeScript, Vite, custom responsive glassmorphic CSS.  
- **Backend:** FastAPI (Python 3.14 Asynchronous), Uvicorn server, SQLAlchemy 2.0 ORM.  
- **Scientific Computing:** Scanpy, AnnData, SciPy, Scikit-learn, UMAP-learn, Leidenalg, iGraph."

---

### Q24. Demo dataset mein kitne cells aur genes hain?
**Answer:** "Hamare simulated human PBMC (Peripheral Blood Mononuclear Cells) dataset mein **4,300 cells** aur **2,054 genes** hain, jisme 5 distinct cell populations hain: T-cells (1500), B-cells (1000), Monocytes (800), NK-cells (600), aur Dendritic cells (400) across 3 batches."

---

### Q25. Yeh project real-world pharmaceutical aur biotech companies mein kaise kaam aayega?
**Answer:** "Pharma companies cancer tumors ya autoimmune diseases ke single-cell data ko is platform par upload karke:  
1. Pata laga sakti hain ki kaun se cell types tumor microenvironment mein resistant hain.  
2. Un cells ke specific surface proteins aur targetable candidate biomarkers identify kar sakti hain jinhe target karne ke liye nayi **Monoclonal Antibodies ya CAR-T cell therapies** design ki ja sakein."
