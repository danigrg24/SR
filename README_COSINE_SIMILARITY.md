# Cosine Similarity - Premier League Players Dataset

## Descrierea Proiectului

Am implementat algoritmul Cosine Similarity pentru a găsi jucători similari din Premier League 2024-25. Proiectul calculează similaritatea între jucători pe baza caracteristicilor lor (poziție, echipă, naționalitate) și statisticilor de performanță.

## Fișierele Proiectului

- `CosineSimilarity.js` - implementarea principală
- `OptimizedCosineSimilarity.js` - versiune îmbunătățită  
- `similarity_matrix.csv` - matricea de similaritate generată
- `fbref_PL_2024-25.csv` - dataset-ul cu jucători
- `README.txt` - documentația cu exemple

## Cum Funcționează

Dataset-ul conține 574 jucători unici din Premier League. Am eliminat duplicatele din fișierul original (1148 intrări → 574 jucători).

### Caracteristici Analizate

**Text (40% din scor):**
- Poziția jucătorului (GK, DF, MF, FW)
- Echipa curentă
- Naționalitatea

**Performance (60% din scor):**
- Goluri și assist-uri per 90 minute
- Expected Goals (xG) și Expected Assists (xAG)  
- Vârsta și experiența (minute jucate)

### Algoritmul

```javascript
// Formula Cosine Similarity
similarity = dotProduct / (normA × normB)

// Scorul final
Combined = (Text_Score × 0.4) + (Performance_Score × 0.6)
```

## Rezultate

Am testat algoritmul cu jucători cunoscuți:

**Erling Haaland** - cei mai similari:
1. Joško Gvardiol (Man City) - 0.863
2. Rúben Dias (Man City) - 0.859
3. Mateo Kovačić (Man City) - 0.848

**Mohamed Salah** - cei mai similari:
1. Virgil van Dijk (Liverpool) - 0.799
2. Alisson (Liverpool) - 0.797
3. Luis Díaz (Liverpool) - 0.793

**Bukayo Saka** - cei mai similari:
1. Declan Rice (Arsenal) - 0.963
2. Ethan Nwaneri (Arsenal) - 0.960
3. Marcus Tavernier (Bournemouth) - 0.931

## Rularea Codului

```bash
# Instalează dependințele
npm install

# Rulează algoritmul
node CosineSimilarity.js

# Versiunea optimizată
node OptimizedCosineSimilarity.js
```

## Ce Am Învățat

1. **Preprocessing important** - eliminarea duplicatelor îmbunătățește rezultatele
2. **Ponderile contează** - 60% pe performanță vs 40% pe caracteristici dă rezultate mai realiste
3. **Normalizarea datelor** - esențială pentru compararea corectă a jucătorilor
4. **Validarea rezultatelor** - scorurile trebuie să aibă sens din perspectivă fotbalistică

## Provocări Întâmpinate

- **Duplicate în dataset** - fiecare jucător apărea de 2 ori
- **Echilibrarea ponderilor** - să nu domine caracteristicile text
- **Normalizarea statisticilor** - range-uri realiste pentru Premier League
- **Interpretarea rezultatelor** - verificarea că perechile au sens

## Aplicații Practice

Sistemul poate fi folosit pentru:
- Scouting de jucători cu profile similare
- Identificarea de înlocuitori pentru transferuri
- Analiza competitivă între echipe
- Sisteme de recomandări pentru fantasy football

---

**Nota:** Implementarea este funcțională și poate fi adaptată pentru alte sporturi sau dataset-uri cu modificări minore.