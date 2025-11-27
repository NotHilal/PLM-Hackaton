from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for Angular frontend

# Mock data generator (replace with your actual data loading logic)
def load_data():
    """Load data from Excel files or database"""
    # This is where you'd load your ERP, MES, PLM data
    # For now, returning mock data
    return {
        'erp_data': None,  # Load from ERP_Equipes Airplus.xlsx
        'mes_data': None,  # Load from MES_Extraction.xlsx
        'plm_data': None   # Load from PLM_DataSet.xlsx
    }

def calculate_erp_kpis(data):
    """Calculate ERP KPIs"""
    # Replace with actual calculations from your data
    return {
        'criticite_moyenne': 2.3,
        'cout_total': 125000.50,
        'masse_totale': 3450.75,
        'delai_moyen_fournisseur': 12.5,
        'temps_cao_total': 340.2
    }

def calculate_mes_kpis(data):
    """Calculate MES KPIs"""
    return {
        'ecart_moyen_temps': 15.2,
        'taux_aleas': 8.5,
        'temps_arret_moyen': 25.3,
        'productivite_poste': 45.7
    }

def calculate_plm_kpis(data):
    """Calculate PLM KPIs"""
    return {
        'cout_mo_total': 85000.00,
        'score_competence': 7.8,
        'seniority_mix': {
            'experts': 35,
            'juniors': 65
        }
    }

def calculate_cross_kpis(erp_data, mes_data, plm_data):
    """Calculate cross-functional KPIs"""
    return {
        'impact_aleas': 12.3,
        'cout_retard': 15000.00
    }

def calculate_workflow_kpis(data):
    """Calculate workflow KPIs"""
    # Mock disponibilite_par_poste for 40 postes
    disponibilite = {}
    for i in range(1, 41):
        disponibilite[f'Poste_{i}'] = np.random.uniform(0.7, 1.0)

    return {
        'bottleneck_index': 0.72,
        'cycle_time_global': 5.5,
        'disponibilite_par_poste': disponibilite
    }

@app.route('/api/kpi', methods=['GET'])
def get_kpis():
    """Main endpoint to get all KPIs"""
    try:
        # Load data
        data = load_data()

        # Calculate all KPIs
        kpis = {
            'ERP': calculate_erp_kpis(data['erp_data']),
            'MES': calculate_mes_kpis(data['mes_data']),
            'PLM': calculate_plm_kpis(data['plm_data']),
            'CROSS': calculate_cross_kpis(
                data['erp_data'],
                data['mes_data'],
                data['plm_data']
            ),
            'WORKFLOW': calculate_workflow_kpis(data)
        }

        return jsonify(kpis), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
