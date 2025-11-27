"""
Test script to verify real data calculations work
"""
import pandas as pd
import os
from kpi_calculator import KPICalculator

data_path = os.path.join(os.path.dirname(__file__), '..', 'data')

# Load data
erp_file = os.path.join(data_path, 'ERP_Equipes Airplus.xlsx')
mes_file = os.path.join(data_path, 'MES_Extraction.xlsx')
plm_file = os.path.join(data_path, 'PLM_DataSet.xlsx')

erp_data = pd.read_excel(erp_file)
mes_data = pd.read_excel(mes_file)
plm_data = pd.read_excel(plm_file)

print("=" * 60)
print("Testing Real Data Calculations")
print("=" * 60)

# Create calculator
kpi_calc = KPICalculator(erp_data=erp_data, mes_data=mes_data, plm_data=plm_data)

# Test Process Mining KPIs
print("\n1. Process Mining KPIs:")
pm_kpis = kpi_calc.calculate_process_mining_kpis()
print(f"   Total WIP: {pm_kpis['totalWIP']}")
print(f"   Avg Lead Time: {pm_kpis['avgLeadTime']}")
print(f"   Rework Rate: {pm_kpis['reworkRate']}%")
print(f"   Throughput: {pm_kpis['throughput']}")
print(f"   Bottleneck: {pm_kpis['bottleneckOperation']}")

# Test Operation Summaries
print("\n2. Operation Summaries:")
operations = kpi_calc.calculate_operation_summaries()
for op in operations:
    print(f"   {op['operation']}:")
    print(f"      WIP: {op['currentWIP']}, Cycle: {op['avgCycleTime']}, Waiting: {op['avgWaitingTime']}")
    print(f"      Rework: {op['reworkRate']}%, Severity: {op['bottleneckSeverity']}")

# Test AI Insights
print("\n3. AI Insights:")
insights = kpi_calc.generate_insights()
print(f"   Summary: {insights['summary']}")
print(f"   Number of insights: {len(insights['insights'])}")
print(f"   Number of recommendations: {len(insights['recommendations'])}")

print("\n" + "=" * 60)
print("✅ All calculations completed successfully!")
print("=" * 60)
