"""
Script to analyze Excel files and show their structure
"""
import pandas as pd
import os

def analyze_excel_file(file_path, sheet_name=0):
    """Analyze an Excel file and print its structure"""
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None

    try:
        print(f"\n{'='*80}")
        print(f"📊 Analyzing: {os.path.basename(file_path)}")
        print(f"{'='*80}")

        # Read Excel file
        df = pd.read_excel(file_path, sheet_name=sheet_name)

        print(f"\n📏 Shape: {df.shape[0]} rows x {df.shape[1]} columns")

        print(f"\n📋 Column Names:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i:2d}. {col}")

        print(f"\n🔍 First 5 rows:")
        print(df.head())

        print(f"\n📊 Data Types:")
        print(df.dtypes)

        print(f"\n📈 Numeric columns summary:")
        print(df.describe())

        return df

    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return None


if __name__ == "__main__":
    print("🚀 Starting Excel Data Analysis...")

    # Define file paths
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data')

    files = {
        'ERP': os.path.join(data_path, 'ERP_Equipes Airplus.xlsx'),
        'MES': os.path.join(data_path, 'MES_Extraction.xlsx'),
        'PLM': os.path.join(data_path, 'PLM_DataSet.xlsx')
    }

    # Analyze each file
    results = {}
    for name, path in files.items():
        results[name] = analyze_excel_file(path)

    print("\n" + "="*80)
    print("✅ Analysis Complete!")
    print("="*80)

    # Print summary
    print("\n📝 Summary:")
    for name, df in results.items():
        if df is not None:
            print(f"  {name}: {df.shape[0]} rows, {df.shape[1]} columns")
        else:
            print(f"  {name}: NOT FOUND or ERROR")
