# Analyse des coûts OpenAI — CarrièrePilot
*Généré le 10/03/2026 — Modèle : gpt-4o-mini exclusivement*

---

## Tarifs gpt-4o-mini (OpenAI, mars 2026)
| Direction | Prix |
|-----------|------|
| **Input**  | $0,150 / 1M tokens  |
| **Output** | $0,600 / 1M tokens  |

*Règle de conversion : ~1 token ≈ 0,75 mot français / ~4 caractères.*

---

## Inventaire de tous les appels API

### 1. Import de CV (`POST /api/cv/import`)
**Fichier :** `src/app/api/cv/import/route.ts`

| Type | Estimation tokens |
|------|-------------------|
| System prompt (structure JSON + règles) | ~350 tok input |
| Texte CV utilisateur (max 8 000 chars) | ~2 000 tok input |
| **Input total** | **~2 350 tokens** |
| Réponse JSON structurée (CV parsé) | ~800 tok output |
| **Output total** | **~800 tokens** |

**Coût par appel :**
- Input : 2 350 × $0,150 / 1 000 000 = **$0,000353**
- Output : 800 × $0,600 / 1 000 000 = **$0,000480**
- **Total : ~$0,00083 / import** (~0,083 centimes)

---

### 2. Génération de résumé CV (bouton IA)  (`POST /api/cv/generate-ai`)
**Fichier :** `src/app/api/cv/generate-ai/route.ts` + `openai-service.ts#generateCVSummary`

*Deux routes distinctes appelées selon le contexte, même modèle/tokens.*

| Type | Estimation tokens |
|------|-------------------|
| Prompt + contenu CV JSON | ~600 tok input |
| **Input total** | **~600 tokens** |
| Résumé 80 mots (max_tokens: 200) | ~120 tok output |
| **Output total** | **~120 tokens** |

**Coût par appel :**
- Input : 600 × $0,150 / 1 000 000 = **$0,000090**
- Output : 120 × $0,600 / 1 000 000 = **$0,000072**
- **Total : ~$0,00016 / résumé** (~0,016 centimes)

---

### 3. Génération de lettre de motivation IA (`POST /api/letters/generate-ai`)
**Fichier :** `src/lib/openai-service.ts#generateCoverLetter`

| Type | Estimation tokens |
|------|-------------------|
| System prompt (instructions ton + règles) | ~250 tok input |
| Description poste + profil utilisateur | ~800 tok input |
| **Input total** | **~1 050 tokens** |
| Lettre 300-380 mots (max_tokens: 1200) | ~450 tok output |
| **Output total** | **~450 tokens** |

**Coût par appel :**
- Input : 1 050 × $0,150 / 1 000 000 = **$0,000158**
- Output : 450 × $0,600 / 1 000 000 = **$0,000270**
- **Total : ~$0,00043 / lettre** (~0,043 centimes)

---

### 4. Questions d'entretien (`POST /api/interviews/questions`)
**Fichier :** `src/lib/openai-service.ts#generateInterviewQuestions`

| Type | Estimation tokens |
|------|-------------------|
| System prompt + demande (secteur, niveau) | ~200 tok input |
| **Input total** | **~200 tokens** |
| 8 questions JSON (question + tip × 8) | ~600 tok output |
| **Output total** | **~600 tokens** |

**Coût par appel :**
- Input : 200 × $0,150 / 1 000 000 = **$0,000030**
- Output : 600 × $0,600 / 1 000 000 = **$0,000360**
- **Total : ~$0,00039 / session** (~0,039 centimes)

---

### 5. Feedback de réponse d'entretien (`POST /api/interviews/feedback`)
**Fichier :** `src/lib/openai-service.ts#generateInterviewFeedback`

*Appelé pour CHAQUE réponse qu'un utilisateur soumet (jusqu'à 8 par session).*

| Type | Estimation tokens |
|------|-------------------|
| System prompt + question + réponse candidat | ~250 tok input |
| **Input total** | **~250 tokens** |
| Analyse + score (max_tokens: 400) | ~220 tok output |
| **Output total** | **~220 tokens** |

**Coût par appel (1 réponse) :**
- Input : 250 × $0,150 / 1 000 000 = **$0,000038**
- Output : 220 × $0,600 / 1 000 000 = **$0,000132**
- **Total : ~$0,00017 / réponse**

**Coût session complète (8 réponses) : ~$0,00136** (~0,136 centimes)

---

### 6. Scoring d'offre recommandée (`GET /api/offers/recommended`)
**Fichier :** `src/lib/openai-service.ts#scoreOfferMatch`

*Appelé pour chaque offre scorée — jusqu'à 10 offres par requête.*

| Type | Estimation tokens |
|------|-------------------|
| System prompt + profil JSON + offre JSON | ~500 tok input |
| **Input total** | **~500 tokens** |
| JSON score + strengths + gaps (max_tokens: 300) | ~130 tok output |
| **Output total** | **~130 tokens** |

**Coût par offre scorée :**
- Input : 500 × $0,150 / 1 000 000 = **$0,000075**
- Output : 130 × $0,600 / 1 000 000 = **$0,000078**
- **Total : ~$0,00015 / offre**

**Coût appel complet (10 offres) : ~$0,0015** (~0,15 centimes)

---

### 7. Recherche email recruteur IA (`POST /api/applications/auto-fill`)
**Fichier :** `src/lib/form-automation.ts#findEmailWithAI`

*Appelé uniquement si aucun email trouvé par scraping HTML (fallback IA).*

| Type | Estimation tokens |
|------|-------------------|
| System prompt + contexte offre (500 chars page) | ~300 tok input |
| **Input total** | **~300 tokens** |
| Email ou "INCONNU" (max_tokens: 60) | ~10 tok output |
| **Output total** | **~10 tokens** |

**Coût par appel :**
- Input : 300 × $0,150 / 1 000 000 = **$0,000045**
- Output : 10 × $0,600 / 1 000 000 = **$0,000006**
- **Total : ~$0,000051 / candidature** (~0,005 centimes)

---

## Classement par coût décroissant

| Rang | Fonctionnalité | Coût / appel | Fréquence typique | Coût / mois (100 users actifs) |
|------|---------------|--------------|-------------------|-------------------------------|
| 🥇 1 | **Import CV** | ~$0,00083 | 3×/user | ~$0,25 |
| 🥈 2 | **Génération lettre de motivation** | ~$0,00043 | 5×/user | ~$0,22 |
| 🥉 3 | **Questions d'entretien** (session) | ~$0,00039 | 2×/user | ~$0,078 |
| 4 | **Scoring offres recommandées** (×10) | ~$0,0015 | 10 requêtes/user | ~$1,50 |
| 5 | **Feedback entretien** (session ×8) | ~$0,00136 | 2 sessions/user | ~$0,27 |
| 6 | **Résumé CV IA** | ~$0,00016 | 3×/user | ~$0,048 |
| 7 | **Email recruteur IA** (fallback) | ~$0,000051 | 5×/user | ~$0,026 |

> **Note :** Le scoring d'offres recommandées est en réalité le plus coûteux à l'échelle car c'est la seule fonctionnalité appelée automatiquement (sans action explicite de l'utilisateur), potentiellement à chaque visite de la page Offres.

---

## Estimation coût mensuel total

### Scénario : 100 utilisateurs actifs / mois
| Fonctionnalité | Appels/mois | Coût estimé |
|---------------|-------------|-------------|
| Scoring offres recommandées | 1 000 requêtes × 10 offres | **$1,50** |
| Feedback entretien | 200 sessions × 8 | **$0,27** |
| Import CV | 300 imports | **$0,25** |
| Génération lettres | 500 lettres | **$0,22** |
| Questions d'entretien | 200 sessions | **$0,078** |
| Résumé CV IA | 300 appels | **$0,048** |
| Email recruteur IA | 500 appels | **$0,026** |
| **TOTAL** | | **~$2,39 / mois** |

### Scénario : 1 000 utilisateurs actifs / mois
**~$23,90 / mois** — très rentable pour un SaaS PRO à 10€/mois.

---

## Optimisations recommandées

1. **🚨 Scoring offres (plus gros coût)** — Mettre en cache le score profil/offre en DB pendant 24h. Éviter de re-scorer les mêmes offres.
2. **Import CV** — Le prompt est déjà optimisé (`max_chars: 8000`). OK.  
3. **Lettres de motivation** — Output élevé (1200 tokens max). Réduire à 900 max (-25%).
4. **Feedback entretien** — Limiter à 5 feedbacks/jour par utilisateur FREE.
5. **Email recruteur** — Coût négligeable, rien à faire.
