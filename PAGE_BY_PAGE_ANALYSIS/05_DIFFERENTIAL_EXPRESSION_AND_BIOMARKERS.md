# 05. Differential Expression & Biomarker Discovery (Clinical Heart of the Project)

Is document mein hum samjhenge ki kaise hamara platform har ek cluster ke **Specific Biomarkers (Drug Targets aur Diagnostic Genes)** discover aur rank karta hai.

---

## 1. Differential Expression (DE) Kya Hota Hai?

- **Simple Analogy:** Maan lijiye aapke paas 2 classrooms hain — ek Class 10 (Cluster 0) aur doosri Class 12 (Cluster 1). Aap dono classes ke students ki height compare karte hain aur test karte hain ki kya Class 12 ke students ki height statistically significantly badi hai ya nahi.
- **In Biology (One-vs-Rest Comparison):**
  - Hum Cluster 0 ke cells ko lete hain aur baaki sabhi clusters ke cells ke against compare karte hain.
  - Har ek gene ke liye dekhte hain: **Kya yeh gene Cluster 0 mein baaki cells ke comparison mein statistically zyada express ho raha hai?**

---

## 2. Statistical Tests: Wilcoxon vs t-test

### A. Wilcoxon Rank-Sum Test (Hamara Default - Sabse Reliable)
- **Why Wilcoxon?** Single-cell gene expression data **Non-Gaussian (skewed) aur Zero-inflated** hota hai (Normal distribution follow nahi karta).
- Student's t-test normal distribution assume karta hai, isliye single-cell mein fail ho sakta hai.
- Wilcoxon test **non-parametric** hota hai — yeh actual values ki jagah unke ranks ko compare karta hai, jo extreme outliers se affect nahi hota.

### B. Multiple Testing Problem & Benjamini-Hochberg (FDR) Correction
- Agar aap 2,000 genes test kar rahe hain at $p < 0.05$ threshold, toh statistically $2000 \times 0.05 = 100$ genes **tukke (pure chance)** se significant nikal aayenge (False Positives)!
- Is problem ko solve karne ke liye hum **Benjamini-Hochberg False Discovery Rate (FDR)** method use karte hain jo $p$-values ko adjust karke `adjusted_pvalue` (ya $q$-value) banata hai.
- **Rule:** Sirf vahi genes select hote hain jinka `adjusted_pvalue < 0.05`.

---

## 3. Volcano Plot (Sabse Famous Bioinformatics Visualization)

Website ke Biomarker page par Volcano Plot dikhta hai:

```
    -log10(p-value)  ▲
                     │        * Significant Up-regulated (Markers)
                     │       ***
                     │      *****
                     │
         Threshold ──┼────────────────────── (p = 0.05)
                     │     *  *  * (Non-significant)
                     └──────────────────────► Log2 Fold Change
                            0
```

- **X-axis: $\log_2(\text{Fold Change})$:** Gene kitne guna zyada express hua.
  - $\log_2(\text{FC}) > 0 \rightarrow$ Up-regulated (Cluster mein zyada express).
  - $\log_2(\text{FC}) < 0 \rightarrow$ Down-regulated (Cluster mein kam express).
- **Y-axis: $-\log_{10}(\text{adjusted } p\text{-value})$:** Statistical significance kitni strong hai.
  - Point jitna upar hoga, gene utna zyada confidentally significant hai ($p = 10^{-10} \rightarrow -\log_{10} = 10$).
- **Top-Right Quadrant:** Jo genes top-right mein aate hain, wo hamare **Best Marker Candidates** hote hain!

---

## 4. Multi-Factor Composite Biomarker Scoring (Industry-Grade Algorithm)

Zyadatar basic academic projects sirf $p$-value ke basis par genes rank kar dete hain jo galat hota hai. Hamare platform ne ek **Composite Ranking Formula** banaya hai:

$$\text{Biomarker Score} = w_1 \cdot \text{EffectSize} + w_2 \cdot (-\log_{10} p) + w_3 \cdot \text{Prevalence} + w_4 \cdot \text{Specificity} + w_5 \cdot \text{ROC\_AUC}$$

### In 5 Components Ka Matlab:
1. **Normalized Effect Size ($w_1$):** Gene ka expression magnitude kitna strong hai.
2. **Statistical Significance ($w_2$):** Benjamini-Hochberg adjusted p-value.
3. **Expression Prevalence ($w_3$):** Cluster ke kitne percent cells mein yeh gene on hai (Sensitivity). Agar gene sirf 2% cells mein on hai toh wo achha marker nahi ho sakta.
4. **Cluster Specificity ($w_4$):** Kya yeh gene sirf isi cluster mein express ho raha hai ya doosre clusters mein bhi leak ho raha hai?
5. **ROC-AUC ($w_5$):** Classification performance as a diagnostic test.

---

## 5. ROC-AUC Curves (Diagnostic Validation)

- **ROC:** Receiver Operating Characteristic curve.
- **AUC (Area Under the Curve):**
  - $\text{AUC} = 0.5 \rightarrow$ Random Guess (Coin toss - bilkul bekaar marker).
  - $\text{AUC} = 0.8 - 0.9 \rightarrow$ Good Diagnostic Marker.
  - $\text{AUC} > 0.95 \rightarrow$ Outstanding Diagnostic Marker (jaise T-cell ke liye *CD3D*, B-cell ke liye *CD19*).
- Hamare platform par har gene par click karne par uska **Live Interactive ROC Curve** dikhta hai jo True Positive Rate vs False Positive Rate graph karta hai.

---

## 6. Viva Questions Jo Mam Poochengi (With Model Answers)

> **Mam's Question 1:** *"Aapne multiple testing correction kyun lagayi?"*  
> **Aapka Answer:** "Mam, single-cell analysis mein hum hazaron genes ko simultaneously test karte hain. Bina correction ke False Discovery Rate bohot high ho jata hai. Benjamini-Hochberg adjustment se false positives control hote hain."

> **Mam's Question 2:** *"Fold Change aur p-value mein kya farq hai?"*  
> **Aapka Answer:** "Mam, Fold Change biological effect size batata hai (gene kitne guna zyada bana), jabki p-value statistical confidence batata hai ki kya yeh difference chance se to nahi aaya."

> **Mam's Question 3:** *"Website par validation warning kyun aati hai?"*  
> **Aapka Answer:** "Mam, computational analysis kitna bhi robust ho, clinical use se pehle wet-lab experimental validation (jaise qPCR, Flow Cytometry, ya Western Blot) compulsory hota hai. Hamara platform ethical compliance aur industry standards ke tehat yeh disclaimer show karta hai."
