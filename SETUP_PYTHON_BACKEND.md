# Python Backend Setup Guide

## Overview

This guide shows you how to set up a Python Flask backend to calculate KPIs and integrate it with your Angular frontend.

## Architecture

```
Angular Frontend (TypeScript) <--HTTP--> Python Backend (Flask)
        Port 4200                         Port 5000
```

## Setup Steps

### 1. Install Python Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Angular to Use HttpClient

The Angular app needs to import `HttpClient`. Update your `app.config.ts` or `app.module.ts`:

```typescript
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(), // Add this
    // ... other providers
  ]
};
```

### 3. Start Python Backend

```bash
cd backend
python app.py
```

Backend will run on: `http://localhost:5000`

### 4. Start Angular Frontend

```bash
cd App
npm start
```

Frontend will run on: `http://localhost:4200`

### 5. Test the Integration

Open browser to: `http://localhost:4200`

The Angular app will automatically fetch KPIs from Python backend every 30 seconds.

## API Endpoints

### Get All KPIs
- **URL**: `http://localhost:5000/api/kpi`
- **Method**: GET
- **Response**: JSON with all KPIs

```json
{
  "ERP": {
    "criticite_moyenne": 2.3,
    "cout_total": 125000.50,
    "masse_totale": 3450.75,
    "delai_moyen_fournisseur": 12.5,
    "temps_cao_total": 340.2
  },
  "MES": { ... },
  "PLM": { ... },
  "CROSS": { ... },
  "WORKFLOW": { ... }
}
```

### Health Check
- **URL**: `http://localhost:5000/api/health`
- **Method**: GET
- **Response**: `{ "status": "healthy", "timestamp": "..." }`

## Customization

### Load Your Data

Edit `backend/app.py` - `load_data()` function:

```python
def load_data():
    erp_df = pd.read_excel('../data/ERP_Equipes Airplus.xlsx')
    mes_df = pd.read_excel('../data/MES_Extraction.xlsx')
    plm_df = pd.read_excel('../data/PLM_DataSet.xlsx')

    return {
        'erp_data': erp_df,
        'mes_data': mes_df,
        'plm_data': plm_df
    }
```

### Add KPI Calculations

Edit the calculation functions in `backend/app.py`:

```python
def calculate_erp_kpis(data):
    # Add your calculation logic here
    df = data  # Your pandas DataFrame

    return {
        'criticite_moyenne': df['Criticité'].mean(),
        'cout_total': df['Coût'].sum(),
        # ... more calculations
    }
```

## Chart Recommendations

Based on your KPI types:

### ERP
- `criticite_moyenne`: **Gauge** or **Donut** (shows criticality level)
- `cout_total`: **Bar Chart** (absolute value)
- `masse_totale`: **Bar Chart**
- `delai_moyen_fournisseur`: **Bar** or **Radar** (for comparison)
- `temps_cao_total`: **Donut**

### MES
- `ecart_moyen_temps`: **Bar Chart** (deviation)
- `taux_aleas`: **Donut** (percentage)
- `temps_arret_moyen`: **Histogram** or **Boxplot** (variability)
- `productivite_poste`: **Horizontal Bar** (pieces/hour comparison)

### PLM
- `cout_mo_total`: **Bar Chart** (total cost)
- `score_competence`: **Histogram** or **Pie** (skill distribution)
- `seniority_mix`: **Pie** or **Donut** (Experts vs Juniors)

### CROSS
- `impact_aleas`: **Bar Chart** (global impact)
- `cout_retard`: **Bar Chart** (cost in €)

### WORKFLOW
- `bottleneck_index`: **Gauge** (shows congestion)
- `cycle_time_global`: **Timeline** or **Bar** (total duration)
- `disponibilite_par_poste`: **Heatmap** or **Vertical Bar** (40 workstations)

## Using in Your Components

```typescript
import { KpiHttpService } from './services/kpi-http.service';

export class YourComponent implements OnInit {
  kpis?: KPIs;

  constructor(private kpiService: KpiHttpService) {}

  ngOnInit(): void {
    this.kpiService.kpis$.subscribe(data => {
      this.kpis = data;
      console.log('KPIs:', this.kpis);
    });
  }
}
```

## Troubleshooting

### CORS Error
Make sure Flask CORS is enabled in `backend/app.py`:
```python
from flask_cors import CORS
CORS(app)
```

### Connection Refused
- Check if Python backend is running on port 5000
- Check if Angular is trying to connect to the right URL

### Module Not Found
```bash
pip install -r requirements.txt
```

## Next Steps

1. **Add Charts**: Use `ngx-charts` to visualize the KPIs
2. **Real Data**: Load actual Excel files in `load_data()`
3. **Authentication**: Add auth if needed
4. **Database**: Connect to a database instead of Excel files
5. **WebSockets**: For real-time updates instead of polling
