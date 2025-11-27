# Guide d'Implémentation des Vrais Calculs

## Étape 1 : Analyser les fichiers Excel

Exécute :
```bash
cd backend
venv\Scripts\activate
python analyze_data.py
```

Cela va te montrer :
- Les colonnes de chaque fichier
- Les 5 premières lignes
- Les types de données
- Les statistiques

## Étape 2 : Mapper les colonnes

Une fois que tu as la structure, remplis ce mapping :

### ERP_Equipes Airplus.xlsx
```
Colonnes trouvées : [à remplir après analyse]

Mapping pour les KPIs :
- criticite_moyenne → moyenne de la colonne [NOM_COLONNE]
- cout_total → somme de la colonne [NOM_COLONNE]
- masse_totale → somme de la colonne [NOM_COLONNE]
- delai_moyen_fournisseur → moyenne de la colonne [NOM_COLONNE]
- temps_cao_total → somme de la colonne [NOM_COLONNE]
```

### MES_Extraction.xlsx
```
Colonnes trouvées : [à remplir après analyse]

Mapping pour les KPIs :
- ecart_moyen_temps → [calcul à définir]
- taux_aleas → [calcul à définir]
- temps_arret_moyen → [calcul à définir]
- productivite_poste → [calcul à définir]
```

### PLM_DataSet.xlsx
```
Colonnes trouvées : [à remplir après analyse]

Mapping pour les KPIs :
- cout_mo_total → [calcul à définir]
- score_competence → [calcul à définir]
- seniority_mix (experts/juniors) → [calcul à définir]
```

## Étape 3 : Exemples de Calculs

### Exemple 1 : Moyenne simple
```python
criticite_moyenne = float(df['Criticité'].mean())
```

### Exemple 2 : Somme
```python
cout_total = float(df['Coût'].sum())
```

### Exemple 3 : Pourcentage
```python
taux_aleas = (df['Aléas'].sum() / len(df)) * 100
```

### Exemple 4 : Comptage avec condition
```python
experts = len(df[df['Niveau'] == 'Expert'])
juniors = len(df[df['Niveau'] == 'Junior'])
seniority_mix = {
    'experts': (experts / len(df)) * 100,
    'juniors': (juniors / len(df)) * 100
}
```

### Exemple 5 : Groupby
```python
productivite_par_poste = df.groupby('Poste')['Production'].sum()
productivite_moyenne = productivite_par_poste.mean()
```

## Étape 4 : Implémenter dans kpi_calculator.py

Une fois le mapping défini, on remplacera les fonctions `_mock_*` par les vrais calculs.

---

**ATTENDS LE RÉSULTAT DE `python analyze_data.py` AVANT DE CONTINUER !**
