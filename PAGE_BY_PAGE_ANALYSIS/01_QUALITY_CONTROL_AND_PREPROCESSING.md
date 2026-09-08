# 01. Quality Control & Preprocessing (Page 2 In-Depth Analysis)

Jab lab se raw single-cell sequencing data aata hai, toh usme bohot saara garbage/noise data hota hai. Is document mein samjhenge ki **QC aur Preprocessing** kyun compulsory hai, kaise kaam karta hai, aur viva mein Mam kya poochengi.

---

## 1. Quality Control (QC) Kyun Zaroori Hai?

Single-cell sequencing ke experimental protocol mein har ek cell ko ek microscopic oil droplet mein pack kiya jaata hai. Is process mein 3 badi problems aati hain:
1. **Empty Droplets (Bina cell wale droplets):** Droplet ke andar koi cell nahi gaya, sirf free-floating ambient RNA capture ho gaya.
2. **Doublets / Multiplets (Do cells ek droplet mein):** Ek droplet mein 2 cells pack ho gaye. Sequencing machine unhe 1 single super-cell samajh leti hai.
3. **Dead / Dying Cells (Marte hue cells):** Stress ya preparation ke waqt cell ki outer membrane phat (rupture) jaati hai. Cytoplasm ka mRNA leak ho jata hai, lekin heavy **Mitochondria** andar hi phasa reh jata hai.

---

## 2. QC Metrics Jo Hamara Pipeline Calculate Karta Hai

### A. Total Counts (`total_counts` / UMI Count)
- **Matlab:** Ek single cell ke andar total kitne RNA transcripts detect hue.
- **Filtering Logic:**
  - Agar total count bohot kam hai (e.g. < 500) $\rightarrow$ Empty droplet ya low sequencing depth $\rightarrow$ **Remove karo**.
  - Agar total count abnormally high hai (e.g. > 20,000) $\rightarrow$ Doublet (do cells jud gaye) $\rightarrow$ **Remove karo**.

### B. Number of Genes per Cell (`n_genes_by_counts`)
- **Matlab:** Ek cell mein kitne alag-alag unique genes express ho rahe hain.
- **Filtering Logic:** Healthy cell mein aam taur par 500 se 4,000 unique genes detect hone chahiye.

### C. Mitochondrial Percentage (`pct_counts_mito` / `pct_counts_mt`)
- **Yeh Sabse Important Concept Hai Jo Mam Pakka Poochengi!**
- **Biological Reason:**
  - Normal healthy cell mein mitochondrial genes ka contribution sirf 2% se 10% hota hai.
  - Jab cell die (apoptosis) kar raha hota hai, uski outer membrane leak ho jati hai aur normal genes bahar nikal jaate hain. Lekin cell ka power-house **Mitochondria** andar rehta hai.
  - Is wajah se dying cell ke total RNA mein **mitochondrial percentage 20% se 80% tak chali jaati hai**.
- **Rule:** Agar kisi cell mein `pct_counts_mt > 15% ya 20%` hai, toh wo cell dead/low quality hai $\rightarrow$ **Usey filter out kar diya jata hai**.

---

## 3. Preprocessing Steps (Normalization, Log1p, HVG)

QC ke baad bach gaye healthy cells par 3 scientific transformations kiye jaate hain:

### Step 1: Library-Size Normalization (`sc.pp.normalize_total`)
- **Problem:** Ek cell se 2,000 counts mile aur doosre cell se 10,000 counts mile, sirf isliye kyunki second cell ko machine ne zyada deeply sequence kiya (technical variation, biological nahi).
- **Solution:** Hum har cell ke counts ko scale karke ek fixed standard target sum par le aate hain:
  $$\text{Target Sum} = 10,000 \text{ counts per cell (Counts Per Ten Thousand / CPM)}$$
- Isse sabhi cells ek equal footing par compare ho sakte hain.

### Step 2: Log Transformation (`sc.pp.log1p`)
- **Formula:** $\log(1 + X)$
- **Why $+1$?** Agar kisi gene ka count 0 hai, toh $\log(0)$ mathematically undefined ($-\infty$) hota hai. $\log(1 + 0) = \log(1) = 0$ rehta hai.
- **Why log?** Gene expression data bohot skewed hota hai — kuch genes 1-2 count dete hain aur kuch genes 5,000 count dete hain. Log lene se variance stabilize ho jata hai aur extreme outliers normal scale par aa jaate hain.

### Step 3: Highly Variable Genes (HVG) Selection (Seurat v3 Flavor)
- **Problem:** Cell ke andar 20,000 genes hote hain. Lekin inme se lagbhag 18,000 genes "Housekeeping Genes" hote hain (jaise *Actin* ya *GAPDH*) jo har cell mein constant express hote hain aur cell type alag karne mein madad nahi karte.
- **Solution:** Hum statistical dispersion aur mean expression calculate karte hain aur sirf top **2,000 Highly Variable Genes** ko chun lete hain.
- **Benefit:** Noise 90% kam ho jati hai, computation fast ho jati hai, aur biologically meaningful variation retain hoti hai.

---

## 4. Viva Questions Jo Mam Poochengi (With Model Answers)

> **Mam's Question 1:** *"Aapne mitochondrial genes ko identify kaise kiya?"*  
> **Aapka Answer:** "Mam, human mitochondrial genes ke symbols hamesha prefix **'MT-'** se shuru hote hain (jaise `MT-CO1`, `MT-ND1`). Humne scanpy ke `var_names.str.startswith('MT-')` regex se identify kiya aur total counts ke against unka ratio compute kiya."

> **Mam's Question 2:** *"Agar hum log1p transformation na karein toh kya nuksan hoga?"*  
> **Aapka Answer:** "Mam, agar log transform na karein toh jo housekeeping genes bohot zyada express hote hain (outliers), wo downstream PCA aur clustering ke distance calculation ko completely dominate kar lenge, jisse biological cell types alag nahi ho payenge."

> **Mam's Question 3:** *"HVG select karne ke liye kaun sa method use kiya gaya?"*  
> **Aapka Answer:** "Humne Seurat v3 dispersion-based selection method use kiya hai jo mean-variance relationship ko fit karke excess biological variance wale genes ko rank karta hai."
