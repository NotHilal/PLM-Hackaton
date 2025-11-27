"""
Test script to check if Excel files are being loaded correctly
"""
import pandas as pd
import os

data_path = os.path.join(os.path.dirname(__file__), '..', 'data')

print("=" * 60)
print("Testing Excel File Loading")
print("=" * 60)

# Check ERP file
erp_file = os.path.join(data_path, 'ERP_Equipes Airplus.xlsx')
print(f"\n1. ERP File: {erp_file}")
print(f"   Exists: {os.path.exists(erp_file)}")
if os.path.exists(erp_file):
    try:
        erp_data = pd.read_excel(erp_file)
        print(f"   ✅ Loaded successfully!")
        print(f"   Rows: {len(erp_data)}")
        print(f"   Columns: {list(erp_data.columns)}")
        print(f"   First few rows:")
        print(erp_data.head())
    except Exception as e:
        print(f"   ❌ Error loading: {e}")

# Check MES file
mes_file = os.path.join(data_path, 'MES_Extraction.xlsx')
print(f"\n2. MES File: {mes_file}")
print(f"   Exists: {os.path.exists(mes_file)}")
if os.path.exists(mes_file):
    try:
        mes_data = pd.read_excel(mes_file)
        print(f"   ✅ Loaded successfully!")
        print(f"   Rows: {len(mes_data)}")
        print(f"   Columns: {list(mes_data.columns)}")
        print(f"   First few rows:")
        print(mes_data.head())
    except Exception as e:
        print(f"   ❌ Error loading: {e}")

# Check PLM file
plm_file = os.path.join(data_path, 'PLM_DataSet.xlsx')
print(f"\n3. PLM File: {plm_file}")
print(f"   Exists: {os.path.exists(plm_file)}")
if os.path.exists(plm_file):
    try:
        plm_data = pd.read_excel(plm_file)
        print(f"   ✅ Loaded successfully!")
        print(f"   Rows: {len(plm_data)}")
        print(f"   Columns: {list(plm_data.columns)}")
        print(f"   First few rows:")
        print(plm_data.head())
    except Exception as e:
        print(f"   ❌ Error loading: {e}")

print("\n" + "=" * 60)
