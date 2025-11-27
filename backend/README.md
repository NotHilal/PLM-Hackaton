# Python Backend for PLM Dashboard

## Setup

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python app.py
```

The API will be available at: `http://localhost:5000`

## Endpoints

- `GET /api/kpi` - Returns all KPIs
- `GET /api/health` - Health check

## Development

Add your data loading logic in the `load_data()` function to read from Excel files:
- `../data/ERP_Equipes Airplus.xlsx`
- `../data/MES_Extraction.xlsx`
- `../data/PLM_DataSet.xlsx`
