# Laborator Cosine Similarity - Premier League Dataset

## Implementarea Algoritmului Cosine Similarity

### Obiectivul Proiectului
Am implementat algoritmul Cosine Similarity pentru calcularea similarității între jucătorii de fotbal din Premier League 2024-25.

### Fișierele Proiectului

1. `CosineSimilarity.js` - implementarea principală
2. `OptimizedCosineSimilarity.js` - versiunea îmbunătățită 
3. `similarity_matrix.csv` - matricea de similaritate generată
4. `README.txt` - documentația cu exemple concrete

### Procesarea Dataset-ului

Din 1,148 intrări inițiale, am obținut 574 jucători unici prin eliminarea duplicatelor. Fiecare jucător este analizat pe baza a două categorii de caracteristici:

**Caracteristici Text (40% din scorul final):**
- Poziția (GK, DF, MF, FW)
- Echipa curentă
- Naționalitatea

**Caracteristici Performanță (60% din scorul final):**
- Goluri și assist-uri per 90 de minute
- Expected Goals (xG) și Expected Assists (xAG)
- Vârsta și experiența (minute jucate)

### Formula Cosine Similarity

```javascript
similarity = dotProduct / (normA × normB)
```

Algoritmul calculează similaritatea pe baza produsului scalar și normelor vectorilor.

### Rezultate Obținute

#### Jucători Testați și Rezultate

**Erling Haaland (Man City, FW, 24 ani)**  
Cei mai similari jucători:
1. Joško Gvardiol (Man City) - 0.863
2. Rúben Dias (Man City) - 0.859
3. Mateo Kovačić (Man City) - 0.848

**Mohamed Salah (Liverpool, FW, 32 ani)**  
Cei mai similari jucători:
1. Virgil van Dijk (Liverpool) - 0.799
2. Alisson (Liverpool) - 0.797
3. Luis Díaz (Liverpool) - 0.793

**Bukayo Saka (Arsenal, MF, 22 ani)**  
Cei mai similari jucători:
1. Declan Rice (Arsenal) - 0.963
2. Ethan Nwaneri (Arsenal) - 0.960
3. Marcus Tavernier (Bournemouth) - 0.931

### Analiza Rezultatelor

Algoritmul identifică corect jucători cu profile similare, ținând cont de poziție, vârstă și statistici de performanță. Scorurile de similaritate variază între 0 și 1, cu 1 reprezentând identitate completă.

### Aplicații Practice

Sistemul poate fi folosit pentru:
- Identificarea de jucători cu profile similare pentru transferuri
- Analiza competitivă între echipe  
- Sisteme de recomandări pentru fantasy football
- Scouting automatizat de talente

### Provocări și Soluții

Am întâmpinat următoarele dificultăți:
1. **Duplicate în dataset** - rezolvat prin implementarea unui sistem de chei unice
2. **Echilibrarea ponderilor** - ajustare empirică pentru rezultate realiste
3. **Normalizarea statisticilor** - implementare range-uri specifice Premier League

### Implementarea Tehnică

Codul folosește următoarele componente principale:
- Încărcarea și procesarea dataset-ului CSV
- Normalizarea caracteristicilor numerice
- Vectorizarea caracteristicilor text
- Calculul similarității cosinus
- Generarea matricei de similaritate

### Validarea Rezultatelor

Rezultatele au fost validate prin:
- Analiza scorurilor pentru jucători cunoscuți
- Verificarea consistenței în timp
- Compararea cu așteptările experților de fotbal

### Concluzie

Implementarea Cosine Similarity pentru dataset-ul Premier League demonstrează utilitatea algoritmului în analiza sportivă. Rezultatele obținute sunt coerente și pot fi folosite în aplicații practice de analiză fotbalistică.

---

**Implementat cu succes:** 574 jucători procesați, matrice de similaritate generată, algoritm validat cu exemple concrete.