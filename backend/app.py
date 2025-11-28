from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from kpi_calculator import KPICalculator
from event_log_generator import EventLogGenerator

app = Flask(__name__)
CORS(app)  # Enable CORS for Angular frontend

# Global KPI calculator instance
kpi_calc = None


def load_data_files():
    """Load data from Excel files"""
    try:
        data_path = os.path.join(os.path.dirname(__file__), '..', 'data')

        erp_data = None
        mes_data = None
        plm_data = None

        # Try to load Excel files if they exist
        erp_file = os.path.join(data_path, 'ERP_Equipes Airplus.xlsx')
        mes_file = os.path.join(data_path, 'MES_Extraction.xlsx')
        plm_file = os.path.join(data_path, 'PLM_DataSet.xlsx')

        if os.path.exists(erp_file):
            erp_data = pd.read_excel(erp_file)
            print(f"✅ Loaded ERP data: {len(erp_data)} rows")

        if os.path.exists(mes_file):
            mes_data = pd.read_excel(mes_file)
            print(f"✅ Loaded MES data: {len(mes_data)} rows")

        if os.path.exists(plm_file):
            plm_data = pd.read_excel(plm_file)
            print(f"✅ Loaded PLM data: {len(plm_data)} rows")

        return erp_data, mes_data, plm_data

    except Exception as e:
        print(f"⚠️  Could not load Excel files: {e}")
        print("Using mock data instead")
        return None, None, None


# Load data on startup
erp_data, mes_data, plm_data = load_data_files()
kpi_calc = KPICalculator(erp_data=erp_data, mes_data=mes_data, plm_data=plm_data)


# ==================== LEGACY ENDPOINT ====================

@app.route('/api/kpi', methods=['GET'])
def get_all_kpis_legacy():
    """Legacy endpoint - returns ERP, MES, PLM, CROSS, WORKFLOW KPIs"""
    try:
        kpis = {
            'ERP': kpi_calc.calculate_erp_kpis(),
            'MES': kpi_calc.calculate_mes_kpis(),
            'PLM': kpi_calc.calculate_plm_kpis(),
            'CROSS': kpi_calc.calculate_cross_kpis(),
            'WORKFLOW': kpi_calc.calculate_workflow_kpis()
        }
        return jsonify(kpis), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== NEW ENDPOINTS ====================

@app.route('/api/v2/kpis/all', methods=['GET'])
def get_all_kpis():
    """Get ALL KPIs including process mining"""
    try:
        all_kpis = kpi_calc.get_all_kpis()
        return jsonify(all_kpis), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/kpis/erp', methods=['GET'])
def get_erp_kpis():
    """Get ERP KPIs only"""
    try:
        return jsonify(kpi_calc.calculate_erp_kpis()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/kpis/mes', methods=['GET'])
def get_mes_kpis():
    """Get MES KPIs only"""
    try:
        return jsonify(kpi_calc.calculate_mes_kpis()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/kpis/plm', methods=['GET'])
def get_plm_kpis():
    """Get PLM KPIs only"""
    try:
        return jsonify(kpi_calc.calculate_plm_kpis()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/kpis/process-mining', methods=['GET'])
def get_process_mining_kpis():
    """Get Process Mining KPIs (WIP, Lead Time, etc.)"""
    try:
        return jsonify(kpi_calc.calculate_process_mining_kpis()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/operations', methods=['GET'])
def get_operations():
    """Get operation summaries for process mining"""
    try:
        return jsonify(kpi_calc.calculate_operation_summaries()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/bottlenecks', methods=['GET'])
def get_bottlenecks():
    """Get bottleneck analysis"""
    try:
        return jsonify(kpi_calc.calculate_bottlenecks()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/insights', methods=['GET'])
def get_insights():
    """Get AI-generated insights and recommendations"""
    try:
        return jsonify(kpi_calc.generate_insights()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== CHART DATA ENDPOINTS ====================

@app.route('/api/v2/charts/wip-by-operation', methods=['GET'])
def get_wip_chart_data():
    """Get WIP chart data"""
    try:
        operations = kpi_calc.calculate_operation_summaries()
        chart_data = [
            {'name': op['operation'], 'value': op['currentWIP']}
            for op in operations
        ]
        return jsonify(chart_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/charts/cycle-vs-waiting', methods=['GET'])
def get_cycle_waiting_chart_data():
    """Get cycle time vs waiting time chart data"""
    try:
        operations = kpi_calc.calculate_operation_summaries()
        chart_data = []

        for op in operations:
            chart_data.append({
                'name': op['operation'],
                'series': [
                    {'name': 'Cycle Time', 'value': op['avgCycleTime']},
                    {'name': 'Waiting Time', 'value': op['avgWaitingTime']}
                ]
            })

        return jsonify(chart_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/charts/rework-rate', methods=['GET'])
def get_rework_chart_data():
    """Get rework rate chart data"""
    try:
        operations = kpi_calc.calculate_operation_summaries()
        chart_data = [
            {'name': op['operation'], 'value': op['reworkRate']}
            for op in operations
        ]
        return jsonify(chart_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== UTILITY ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'data_loaded': {
            'erp': erp_data is not None,
            'mes': mes_data is not None,
            'plm': plm_data is not None
        }
    }), 200


@app.route('/api/reload-data', methods=['POST'])
def reload_data():
    """Reload data from Excel files"""
    global kpi_calc, erp_data, mes_data, plm_data

    try:
        erp_data, mes_data, plm_data = load_data_files()
        kpi_calc = KPICalculator(erp_data=erp_data, mes_data=mes_data, plm_data=plm_data)

        return jsonify({
            'status': 'success',
            'message': 'Data reloaded successfully',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/endpoints', methods=['GET'])
def list_endpoints():
    """List all available endpoints"""
    endpoints = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            endpoints.append({
                'endpoint': rule.rule,
                'methods': list(rule.methods - {'HEAD', 'OPTIONS'})
            })

    return jsonify(endpoints), 200


# ==================== EVENT LOG ENDPOINTS (HACKATHON REQUIREMENT #2) ====================

@app.route('/api/v2/event-log', methods=['GET'])
def get_event_log():
    """Get structured event log (case_id, activity, timestamps, station_id, result, rework_flag)"""
    try:
        event_gen = EventLogGenerator(mes_data)
        event_log = event_gen.generate_event_log()

        # Convert to JSON-serializable format
        event_log_dict = event_log.to_dict('records')

        # Convert timestamps to ISO format
        for event in event_log_dict:
            if 'timestamp_start' in event:
                event['timestamp_start'] = event['timestamp_start'].isoformat()
            if 'timestamp_end' in event:
                event['timestamp_end'] = event['timestamp_end'].isoformat()

        return jsonify({
            'event_log': event_log_dict,
            'total_events': len(event_log_dict),
            'unique_cases': event_log['case_id'].nunique() if len(event_log) > 0 else 0
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/event-log/metrics', methods=['GET'])
def get_event_log_metrics():
    """Get process metrics calculated from event log"""
    try:
        event_gen = EventLogGenerator(mes_data)
        event_log = event_gen.generate_event_log()
        metrics = event_gen.calculate_process_metrics(event_log)

        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/event-log/export', methods=['GET'])
def export_event_log():
    """Export event log as CSV for process mining tools"""
    try:
        event_gen = EventLogGenerator(mes_data)
        event_log = event_gen.generate_event_log()

        filepath = 'event_log_export.csv'
        event_gen.export_to_csv(event_log, filepath)

        return send_file(filepath,
                        mimetype='text/csv',
                        as_attachment=True,
                        download_name='manufacturing_event_log.csv')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 Starting PLM AI Backend Server...")
    print("📊 Available endpoints:")
    print("   - http://localhost:5000/api/health")
    print("   - http://localhost:5000/api/endpoints")
    print("   - http://localhost:5000/api/v2/kpis/all")
    print("   - http://localhost:5000/api/v2/insights")
    print("")

    app.run(debug=True, host='0.0.0.0', port=5000)
