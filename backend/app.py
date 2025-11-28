# -*- coding: utf-8 -*-
import sys
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import json
import shutil
from dotenv import load_dotenv
from kpi_calculator import KPICalculator
from event_log_generator import EventLogGenerator
from bpmn_generator import BPMNGenerator
from groq import Groq

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Angular frontend

# File upload configuration
DATA_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'data')
UPLOAD_FOLDER = os.path.join(DATA_FOLDER, 'uploads')  # Store versions here
ACTIVE_FOLDER = DATA_FOLDER  # Active files stored in data/
FILE_REGISTRY = os.path.join(DATA_FOLDER, 'file_registry.json')  # Track all uploads
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global KPI calculator instance
kpi_calc = None

# Initialize Groq client (API key from environment variable)
groq_client = None
try:
    groq_api_key = os.environ.get('GROQ_API_KEY')
    if groq_api_key:
        groq_client = Groq(api_key=groq_api_key)
        print("✅ Groq AI client initialized")
    else:
        print("⚠️ GROQ_API_KEY not found in environment variables")
except Exception as e:
    print(f"⚠️ Could not initialize Groq client: {e}")


def sync_active_files_from_registry():
    """Sync active files from registry to data folder on startup"""
    try:
        print("🔄 Syncing active files from registry...")
        registry = load_file_registry()

        file_mapping = {
            'mes': 'MES_Extraction.xlsx',
            'erp': 'ERP_Equipes Airplus.xlsx',
            'plm': 'PLM_DataSet.xlsx'
        }

        for file_type, active_filename in file_mapping.items():
            if file_type in registry and len(registry[file_type]) > 0:
                # Find the active file
                active_file = None
                for file_info in registry[file_type]:
                    if file_info.get('active', False):
                        active_file = file_info
                        break

                if active_file:
                    # Copy active file from uploads to data folder
                    source_path = os.path.join(UPLOAD_FOLDER, active_file['stored_name'])
                    dest_path = os.path.join(ACTIVE_FOLDER, active_filename)

                    if os.path.exists(source_path):
                        shutil.copy2(source_path, dest_path)
                        print(f"✅ Synced {file_type.upper()}: {active_file['stored_name']} → {active_filename}")
                    else:
                        print(f"⚠️  Active file not found: {source_path}")

        print("✅ File sync complete")
    except Exception as e:
        print(f"⚠️  Error syncing files from registry: {e}")


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


# Sync active files from registry, then load data on startup
sync_active_files_from_registry()
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


@app.route('/api/v2/data/erp', methods=['GET'])
def get_erp_data():
    """Get raw ERP data (employee records)"""
    try:
        if erp_data is None or erp_data.empty:
            return jsonify({'employees': []}), 200

        # Convert DataFrame to list of dictionaries
        employees = erp_data.to_dict('records')

        return jsonify({
            'employees': employees,
            'total': len(employees)
        }), 200
    except Exception as e:
        print(f"Error getting ERP data: {e}")
        return jsonify({'error': str(e), 'employees': []}), 500


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


# ==================== ANALYTICS ENDPOINTS (ERP & PLM) ====================

@app.route('/api/v2/analytics/resource-kpis', methods=['GET'])
def get_resource_kpis():
    """Get Resource (HR) KPIs from ERP data"""
    try:
        return jsonify(kpi_calc.calculate_resource_kpis()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/analytics/supply-chain-kpis', methods=['GET'])
def get_supply_chain_kpis():
    """Get Supply Chain KPIs from PLM data"""
    try:
        return jsonify(kpi_calc.calculate_supply_chain_kpis()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/analytics/cost-by-qualification', methods=['GET'])
def get_cost_by_qualification_chart():
    """Get cost by qualification chart data"""
    try:
        return jsonify(kpi_calc.get_cost_by_qualification_chart()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/analytics/experience-distribution', methods=['GET'])
def get_experience_distribution_chart():
    """Get experience distribution chart data"""
    try:
        return jsonify(kpi_calc.get_experience_distribution_chart()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/analytics/supplier-distribution', methods=['GET'])
def get_supplier_distribution_chart():
    """Get supplier distribution chart data"""
    try:
        return jsonify(kpi_calc.get_supplier_distribution_chart()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/analytics/criticality-distribution', methods=['GET'])
def get_criticality_distribution_chart():
    """Get criticality distribution chart data"""
    try:
        return jsonify(kpi_calc.get_criticality_distribution_chart()), 200
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


# ==================== FILE UPLOAD ENDPOINTS ====================

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def load_file_registry():
    """Load file registry from JSON"""
    if os.path.exists(FILE_REGISTRY):
        try:
            with open(FILE_REGISTRY, 'r') as f:
                return json.load(f)
        except:
            return {'mes': [], 'erp': [], 'plm': []}
    return {'mes': [], 'erp': [], 'plm': []}


def save_file_registry(registry):
    """Save file registry to JSON"""
    with open(FILE_REGISTRY, 'w') as f:
        json.dump(registry, f, indent=2)


def add_file_to_registry(file_type, file_info):
    """Add a file upload to the registry"""
    registry = load_file_registry()
    if file_type not in registry:
        registry[file_type] = []
    registry[file_type].append(file_info)
    save_file_registry(registry)


def set_active_file(file_type, file_id):
    """Mark a specific file as active"""
    registry = load_file_registry()
    if file_type in registry:
        for file_info in registry[file_type]:
            file_info['active'] = (file_info['id'] == file_id)
    save_file_registry(registry)
    return registry


@app.route('/api/v2/upload/test', methods=['GET'])
def test_upload():
    """Test endpoint to verify upload route is accessible"""
    return jsonify({'status': 'ok', 'message': 'Upload endpoint is accessible'}), 200


@app.route('/api/v2/upload', methods=['POST'])
def upload_file():
    """
    Upload MES/ERP/PLM Excel files - saves with timestamp, keeps history
    Expects: multipart/form-data with 'file' field and 'type' field (mes, erp, or plm)
    """
    global kpi_calc, mes_data, erp_data, plm_data

    try:
        print(f"📤 Upload request received")

        # Check if file is present
        if 'file' not in request.files:
            print("❌ No file in request")
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        file_type = request.form.get('type', '').lower()  # mes, erp, or plm

        print(f"📝 File: {file.filename}, Type: {file_type}")

        if file.filename == '':
            print("❌ Empty filename")
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            print("❌ Invalid file type")
            return jsonify({'error': 'Invalid file type. Only .xlsx, .xls, .csv allowed'}), 400

        if file_type not in ['mes', 'erp', 'plm']:
            print("❌ Invalid data type")
            return jsonify({'error': 'Invalid file type. Must be "mes", "erp", or "plm"'}), 400

        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        original_filename = secure_filename(file.filename)
        file_ext = original_filename.rsplit('.', 1)[1] if '.' in original_filename else 'xlsx'

        # Save to uploads folder with timestamp
        versioned_filename = f"{file_type}_{timestamp}.{file_ext}"
        versioned_filepath = os.path.join(UPLOAD_FOLDER, versioned_filename)

        print(f"💾 Saving versioned file to: {versioned_filepath}")
        file.save(versioned_filepath)

        # Also copy to active folder (for backward compatibility)
        file_mapping = {
            'mes': 'MES_Extraction.xlsx',
            'erp': 'ERP_Equipes Airplus.xlsx',
            'plm': 'PLM_DataSet.xlsx'
        }
        active_filename = file_mapping[file_type]
        active_filepath = os.path.join(ACTIVE_FOLDER, active_filename)

        print(f"💾 Copying to active file: {active_filepath}")
        shutil.copy2(versioned_filepath, active_filepath)

        # Get file size
        file_size = os.path.getsize(versioned_filepath)

        # Add to registry
        file_id = f"{file_type}_{timestamp}"
        file_info = {
            'id': file_id,
            'original_name': original_filename,
            'stored_name': versioned_filename,
            'file_type': file_type,
            'uploaded_at': datetime.now().isoformat(),
            'size': file_size,
            'active': True  # Mark as active
        }

        # Mark all others as inactive, this one as active
        registry = load_file_registry()
        if file_type not in registry:
            registry[file_type] = []

        # Mark ALL existing files as inactive
        for f in registry[file_type]:
            f['active'] = False

        # Add new file as active
        registry[file_type].append(file_info)
        save_file_registry(registry)

        print(f"✅ File saved successfully (versioned + active)")

        # Reload data
        print(f"🔄 Reloading data...")
        erp_data_new, mes_data_new, plm_data_new = load_data_files()

        # Update global variables
        erp_data = erp_data_new
        mes_data = mes_data_new
        plm_data = plm_data_new

        # Reinitialize KPI calculator with new data
        print(f"🔄 Reinitializing KPI calculator...")
        kpi_calc = KPICalculator(erp_data=erp_data, mes_data=mes_data, plm_data=plm_data)

        print(f"✅ Upload complete!")

        return jsonify({
            'success': True,
            'message': f'{file_type.upper()} data uploaded and saved as version',
            'filename': versioned_filename,
            'file_id': file_id,
            'active': True
        }), 200

    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/files/list', methods=['GET'])
def list_all_file_versions():
    """Get list of all uploaded file versions"""
    try:
        registry = load_file_registry()
        return jsonify(registry), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/files/active/<file_type>', methods=['POST'])
def set_active_version(file_type):
    """Set a specific file version as active"""
    global kpi_calc, mes_data, erp_data, plm_data

    try:
        data = request.get_json()
        file_id = data.get('file_id')

        if not file_id:
            return jsonify({'error': 'file_id required'}), 400

        if file_type not in ['mes', 'erp', 'plm']:
            return jsonify({'error': 'Invalid file type'}), 400

        # Update registry
        registry = set_active_file(file_type, file_id)

        # Find the file in registry
        active_file = None
        if file_type in registry:
            for f in registry[file_type]:
                if f['id'] == file_id:
                    active_file = f
                    break

        if not active_file:
            return jsonify({'error': 'File not found'}), 404

        # Copy versioned file to active location
        versioned_filepath = os.path.join(UPLOAD_FOLDER, active_file['stored_name'])
        file_mapping = {
            'mes': 'MES_Extraction.xlsx',
            'erp': 'ERP_Equipes Airplus.xlsx',
            'plm': 'PLM_DataSet.xlsx'
        }
        active_filename = file_mapping[file_type]
        active_filepath = os.path.join(ACTIVE_FOLDER, active_filename)

        shutil.copy2(versioned_filepath, active_filepath)
        print(f"✅ Switched active file to: {active_file['stored_name']}")

        # Reload data
        erp_data_new, mes_data_new, plm_data_new = load_data_files()
        erp_data = erp_data_new
        mes_data = mes_data_new
        plm_data = plm_data_new
        kpi_calc = KPICalculator(erp_data=erp_data, mes_data=mes_data, plm_data=plm_data)

        return jsonify({
            'success': True,
            'message': f'Switched to {active_file["original_name"]}',
            'file_id': file_id
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/files/delete/<file_type>/<file_id>', methods=['DELETE'])
def delete_file_version(file_type, file_id):
    """Delete a specific file version"""
    try:
        registry = load_file_registry()

        if file_type not in registry:
            return jsonify({'error': 'File type not found'}), 404

        # Find and remove file from registry
        file_to_delete = None
        for i, f in enumerate(registry[file_type]):
            if f['id'] == file_id:
                if f.get('active'):
                    return jsonify({'error': 'Cannot delete active file'}), 400
                file_to_delete = registry[file_type].pop(i)
                break

        if not file_to_delete:
            return jsonify({'error': 'File not found'}), 404

        # Delete physical file
        versioned_filepath = os.path.join(UPLOAD_FOLDER, file_to_delete['stored_name'])
        if os.path.exists(versioned_filepath):
            os.remove(versioned_filepath)

        # Save updated registry
        save_file_registry(registry)

        return jsonify({
            'success': True,
            'message': f'Deleted {file_to_delete["original_name"]}'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/current-files', methods=['GET'])
def get_current_files():
    """Get information about currently loaded data files"""
    try:
        data_path = ACTIVE_FOLDER

        files_info = {}
        file_mapping = {
            'MES_Extraction.xlsx': 'mes',
            'ERP_Equipes Airplus.xlsx': 'erp',
            'PLM_DataSet.xlsx': 'plm'
        }

        for filename, file_type in file_mapping.items():
            filepath = os.path.join(data_path, filename)
            if os.path.exists(filepath):
                stat = os.stat(filepath)
                files_info[file_type] = {
                    'filename': filename,
                    'size': stat.st_size,
                    'last_modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    'exists': True
                }
            else:
                files_info[file_type] = {
                    'filename': filename,
                    'exists': False
                }

        return jsonify(files_info), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


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


@app.route('/api/v2/chat', methods=['POST'])
def chat_with_ai():
    """Chat endpoint using Groq AI"""
    try:
        if not groq_client:
            return jsonify({
                'error': 'AI service not configured. Please set GROQ_API_KEY environment variable.'
            }), 503

        data = request.get_json()
        user_message = data.get('message', '')
        insights_context = data.get('insights', {})

        if not user_message:
            return jsonify({'error': 'Message is required'}), 400

        # Get real data from KPI calculator
        context_parts = ["=== DONNÉES RÉELLES DE FABRICATION ===\n"]

        if kpi_calc:
            try:
                # Get Process Mining KPIs
                pm_kpis = kpi_calc.calculate_process_mining_kpis()
                context_parts.append("📊 KPIs Process Mining:")
                context_parts.append(f"- WIP (Work in Progress): {pm_kpis.get('wip', 'N/A')} unités")
                context_parts.append(f"- Lead Time: {pm_kpis.get('lead_time_days', 'N/A')} jours")
                context_parts.append(f"- Cycle Time: {pm_kpis.get('cycle_time_hours', 'N/A')} heures")
                context_parts.append(f"- Taux de rework: {pm_kpis.get('rework_rate', 'N/A')}%")
                context_parts.append(f"- Throughput: {pm_kpis.get('throughput', 'N/A')} unités/jour")

                # Get Operations data
                operations = kpi_calc.calculate_operations_summary()
                if operations:
                    context_parts.append(f"\n🏭 Opérations ({len(operations)} stations):")
                    for op in operations[:5]:  # Top 5 operations
                        context_parts.append(f"- {op.get('operation_name', 'N/A')}: WIP={op.get('wip', 'N/A')}, Temps d'attente={op.get('waiting_time_avg', 'N/A')}h")

                # Get Bottlenecks
                bottlenecks = kpi_calc.identify_bottlenecks()
                if bottlenecks:
                    context_parts.append(f"\n🔴 Goulots d'étranglement identifiés ({len(bottlenecks)}):")
                    for bn in bottlenecks[:3]:  # Top 3 bottlenecks
                        context_parts.append(f"- {bn.get('operation_name', 'N/A')}: WIP={bn.get('wip', 'N/A')}, Temps d'attente={bn.get('waiting_time', 'N/A')}h, Sévérité={bn.get('severity', 'N/A')}")

            except Exception as e:
                context_parts.append(f"⚠️ Erreur lors du chargement des données: {str(e)}")

        # Add insights context if provided
        if insights_context:
            context_parts.append("\n=== INSIGHTS AI ===")

            if 'summary' in insights_context:
                context_parts.append(f"\n📝 Résumé: {insights_context['summary']}")

            if 'insights' in insights_context and len(insights_context['insights']) > 0:
                context_parts.append("\n💡 Insights détectés:")
                for insight in insights_context['insights'][:5]:
                    context_parts.append(f"- {insight.get('title', '')}: {insight.get('description', '')} (Impact: {insight.get('impact', '')})")

            if 'recommendations' in insights_context and len(insights_context['recommendations']) > 0:
                context_parts.append("\n🎯 Recommandations:")
                for rec in insights_context['recommendations'][:5]:
                    context_parts.append(f"- {rec.get('action', '')} (Priorité: {rec.get('priority', '')}, Coût: {rec.get('cost', '')})")

        context = "\n".join(context_parts)

        # Create improved system prompt
        system_prompt = """Tu es un assistant AI expert en analyse de processus de fabrication et PLM (Product Lifecycle Management).
        Tu as accès aux données RÉELLES de production de l'usine.

        RÈGLES IMPORTANTES:
        1. Utilise UNIQUEMENT les données fournies dans le contexte - ne jamais inventer ou deviner des chiffres
        2. Si une donnée n'est pas dans le contexte, dis clairement "Je n'ai pas cette information"
        3. Cite toujours les chiffres exacts du contexte dans tes réponses
        4. Réponds en français de manière claire, professionnelle et concise
        5. Si on te demande des données que tu n'as pas, propose de consulter les tableaux de bord

        Base TOUTES tes réponses sur les données réelles fournies ci-dessous."""

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"{context}\n\n=== QUESTION DE L'UTILISATEUR ===\n{user_message}"
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,  # Lower temperature for more factual responses
            max_tokens=1000
        )

        response_text = chat_completion.choices[0].message.content

        return jsonify({
            'response': response_text,
            'model': 'llama-3.1-8b-instant'
        }), 200

    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== BPMN PROCESS DIAGRAM ENDPOINTS ====================

@app.route('/api/v2/process-graph', methods=['GET'])
def get_process_graph():
    """
    Get process flow graph data using pm4py
    Returns structured graph with nodes and edges
    """
    try:
        # Generate event log
        event_gen = EventLogGenerator(mes_data)
        event_log = event_gen.generate_event_log()

        # Create BPMN generator
        bpmn_gen = BPMNGenerator(event_log)

        # Generate process graph
        graph_data = bpmn_gen.generate_process_graph()

        # Get bottlenecks to annotate graph
        if kpi_calc:
            bottlenecks = kpi_calc.calculate_bottlenecks()
            bottleneck_map = bpmn_gen.get_bottleneck_info(bottlenecks)
            graph_data['bottlenecks'] = bottleneck_map

        return jsonify(graph_data), 200

    except Exception as e:
        print(f"❌ Error generating process graph: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/v2/process-bpmn-svg', methods=['GET'])
def get_process_bpmn_svg():
    """
    Get BPMN diagram as SVG (base64 encoded)
    Uses pm4py to generate professional BPMN visualization
    """
    try:
        # Generate event log
        event_gen = EventLogGenerator(mes_data)
        event_log = event_gen.generate_event_log()

        # Create BPMN generator
        bpmn_gen = BPMNGenerator(event_log)

        # Generate SVG
        svg_base64 = bpmn_gen.generate_bpmn_svg()

        if not svg_base64:
            return jsonify({'error': 'Failed to generate BPMN SVG. Make sure pm4py and graphviz are installed.'}), 500

        return jsonify({
            'svg': svg_base64,
            'format': 'base64'
        }), 200

    except Exception as e:
        print(f"❌ Error generating BPMN SVG: {e}")
        import traceback
        traceback.print_exc()
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
