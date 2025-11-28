from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import json
import shutil
from kpi_calculator import KPICalculator
from event_log_generator import EventLogGenerator

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


if __name__ == '__main__':
    print("🚀 Starting PLM AI Backend Server...")
    print("📊 Available endpoints:")
    print("   - http://localhost:5000/api/health")
    print("   - http://localhost:5000/api/endpoints")
    print("   - http://localhost:5000/api/v2/kpis/all")
    print("   - http://localhost:5000/api/v2/insights")
    print("")

    app.run(debug=True, host='0.0.0.0', port=5000)
