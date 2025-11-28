# 🧠 How the Intelligence Works - Complete System Explanation

## 📊 Data Flow Overview

```
Excel Files (data/)
    ↓
Backend (Python/Flask)
    ↓
KPI Calculator (kpi_calculator.py)
    ↓
Insights Generator (Python logic)
    ↓
API Endpoints (/api/v2/...)
    ↓
Frontend (Angular)
    ↓
User Interface (Charts, Tables, Insights)
```

---

## 1️⃣ Where the Data Comes From

### Source Files (in `data/` folder)

**MES_Extraction.xlsx** - Manufacturing Execution System data
- Contains actual manufacturing operations
- Columns:
  - `Poste` - Operation name (Découpe, Perçage, Peinture, etc.)
  - `Nom` - Task/worker name
  - `Temps Réel` - Actual time taken (hours)
  - `Temps Prévu` - Expected time (hours)
  - `Statut` - Success/Failure
  - `Rework` - Whether rework was needed

**Example MES data:**
| Poste    | Nom      | Temps Réel | Temps Prévu | Statut  | Rework |
|----------|----------|------------|-------------|---------|--------|
| Découpe  | Task_001 | 2.5        | 2.0         | Success | False  |
| Perçage  | Task_002 | 3.2        | 2.5         | Failure | True   |
| Peinture | Task_003 | 1.8        | 2.0         | Success | False  |

**ERP_Equipes Airplus.xlsx** - Enterprise Resource Planning
- Employee data, teams, schedules

**PLM_DataSet.xlsx** - Product Lifecycle Management
- Components, BOM (Bill of Materials), revisions

---

## 2️⃣ How KPIs Are Calculated

### File: `backend/kpi_calculator.py`

This is the brain of the system! Let me show you the actual calculations:

### A. **Total WIP (Work In Progress)**

**Logic:** Count how many cases are in each operation

```python
def calculate_process_mining_kpis(self):
    # Group by operation (Poste)
    wip_by_operation = self.mes_data.groupby('Poste').size()

    # Total WIP = sum of all operations
    total_wip = wip_by_operation.sum()

    # Result: 32 cases (for example)
```

**Example:**
- Découpe: 8 cases
- Perçage: 6 cases
- Peinture: 10 cases
- Assemblage: 5 cases
- Contrôle: 3 cases
- **Total WIP = 32 cases**

---

### B. **Average Lead Time**

**Logic:** Calculate time from first operation to last operation

```python
def calculate_lead_time(self):
    # For each case, calculate total time
    lead_times = []

    for case_id in cases:
        # Get all operations for this case
        case_ops = data[data['case_id'] == case_id]

        # Time = last_end - first_start
        start = case_ops['timestamp_start'].min()
        end = case_ops['timestamp_end'].max()

        lead_time = (end - start).total_seconds() / 3600  # Convert to hours
        lead_times.append(lead_time)

    # Average across all cases
    avg_lead_time = sum(lead_times) / len(lead_times)
    # Result: 18.5 hours (for example)
```

---

### C. **Rework Rate**

**Logic:** Percentage of operations that needed rework

```python
def calculate_rework_rate(self):
    # Count operations with rework
    rework_count = self.mes_data[self.mes_data['Rework'] == True].shape[0]

    # Total operations
    total_ops = self.mes_data.shape[0]

    # Percentage
    rework_rate = (rework_count / total_ops) * 100
    # Result: 12.5% (for example)
```

**Example:**
- Total operations: 56
- Operations with rework: 7
- **Rework rate = 7/56 = 12.5%**

---

### D. **Throughput**

**Logic:** How many cases completed per day

```python
def calculate_throughput(self):
    # Count completed cases
    completed = self.mes_data[self.mes_data['Statut'] == 'Success']

    # Get date range
    days = (max_date - min_date).days

    # Cases per day
    throughput = completed.shape[0] / days
    # Result: 8.3 cases/day (for example)
```

---

### E. **Bottleneck Detection**

**Logic:** Find operations where waiting time > cycle time

```python
def detect_bottlenecks(self):
    bottlenecks = []

    for operation in operations:
        # Calculate waiting time (WIP * cycle time)
        wip = count_wip(operation)
        cycle_time = avg_time(operation)
        waiting_time = wip * cycle_time

        # If waiting > cycle, it's a bottleneck
        if waiting_time > cycle_time * 2:
            bottlenecks.append({
                'operation': operation,
                'wip': wip,
                'cycle_time': cycle_time,
                'waiting_time': waiting_time
            })

    return bottlenecks
```

**Example bottleneck:**
- Operation: Peinture
- WIP: 10 cases
- Cycle time: 2 hours
- Waiting time: 20 hours (10 × 2)
- **Status: BOTTLENECK** (waiting >> cycle)

---

## 3️⃣ How AI Insights Are Generated

### Current Implementation (Rule-Based)

**File:** `backend/kpi_calculator.py` - Method `generate_insights()`

**⚠️ IMPORTANT:** Currently, insights are **NOT** using real AI (Claude). They use **rule-based logic** (if-then rules).

### Insight Generation Logic:

```python
def generate_insights(self):
    insights = []
    recommendations = []

    # Rule 1: High WIP Detection
    if kpis['totalWIP'] > 30:
        insights.append({
            'type': 'warning',
            'title': 'High Work-in-Progress Detected',
            'description': f"Total WIP ({kpis['totalWIP']} cases) exceeds optimal level",
            'impact': 'high'
        })

        recommendations.append({
            'action': 'Reduce batch sizes and implement pull system',
            'expectedImpact': 'Reduce WIP by 15-20%',
            'priority': 'high',
            'cost': 'low'
        })

    # Rule 2: Bottleneck Detection
    for op in operations:
        if op['waiting_time'] > op['cycle_time'] * 2:
            insights.append({
                'type': 'critical',
                'title': f'Bottleneck at {op["name"]}',
                'description': f'Waiting time ({op["waiting_time"]}h) significantly exceeds cycle time',
                'impact': 'critical'
            })

            recommendations.append({
                'action': f'Add 1 additional resource to {op["name"]}',
                'expectedImpact': f'Reduce lead time by ~{calculate_impact()}%',
                'priority': 'high',
                'cost': 'medium'
            })

    # Rule 3: High Rework Rate
    if kpis['reworkRate'] > 10:
        insights.append({
            'type': 'warning',
            'title': 'Quality Issues Detected',
            'description': f'Rework rate at {kpis["reworkRate"]}% indicates quality problems',
            'impact': 'high'
        })

        recommendations.append({
            'action': 'Implement quality checks at critical stations',
            'expectedImpact': 'Reduce rework by 50%',
            'priority': 'medium',
            'cost': 'low'
        })

    # Rule 4: Low Throughput
    if kpis['throughput'] < 5:
        insights.append({
            'type': 'info',
            'title': 'Low Production Rate',
            'description': f'Current throughput ({kpis["throughput"]} cases/day) below target',
            'impact': 'medium'
        })

    return {
        'insights': insights,
        'recommendations': recommendations,
        'summary': generate_summary(insights)
    }
```

---

## 4️⃣ Example: How One Insight is Generated

### Scenario: "Bottleneck at Peinture"

**Step 1: Backend loads MES data**
```python
# MES_Extraction.xlsx loaded
mes_data = pd.read_excel('data/MES_Extraction.xlsx')
# 56 rows of operation data
```

**Step 2: Calculate WIP for Peinture**
```python
peinture_wip = mes_data[mes_data['Poste'] == 'Peinture'].shape[0]
# Result: 10 cases
```

**Step 3: Calculate average cycle time**
```python
peinture_times = mes_data[mes_data['Poste'] == 'Peinture']['Temps Réel']
avg_cycle = peinture_times.mean()
# Result: 2.0 hours
```

**Step 4: Calculate waiting time**
```python
waiting_time = peinture_wip * avg_cycle
# 10 cases × 2 hours = 20 hours
```

**Step 5: Detect bottleneck**
```python
if waiting_time > (avg_cycle * 2):  # 20 > 4 ✓
    # BOTTLENECK DETECTED!
    insight = {
        'type': 'critical',
        'title': 'Bottleneck at Peinture',
        'description': 'Waiting time (20h) >> cycle time (2h)',
        'impact': 'critical'
    }
```

**Step 6: Generate recommendation**
```python
# Calculate impact of adding a resource
current_capacity = 1 / avg_cycle  # 0.5 cases/hour
new_capacity = 2 / avg_cycle  # 1.0 cases/hour (doubled)
improvement = ((new_capacity - current_capacity) / current_capacity) * 100
# 100% improvement

recommendation = {
    'action': 'Add 1 additional resource to Peinture station',
    'expectedImpact': 'Reduce lead time by ~40%',
    'priority': 'high',
    'cost': 'medium'
}
```

**Step 7: Send to frontend**
```json
{
  "insights": [
    {
      "type": "critical",
      "title": "Bottleneck at Peinture",
      "description": "Waiting time (20h) significantly exceeds cycle time (2h)",
      "impact": "critical"
    }
  ],
  "recommendations": [
    {
      "action": "Add 1 additional resource to Peinture station",
      "expectedImpact": "Reduce lead time by ~40%",
      "priority": "high",
      "cost": "medium"
    }
  ]
}
```

**Step 8: Frontend displays**
- Overview page shows: "Bottleneck: Peinture (10 cases)"
- AI Insights page shows the full insight card
- Chart highlights Peinture in red

---

## 5️⃣ How Event Log Works

### File: `backend/event_log_generator.py`

**Purpose:** Convert MES data into process mining format

**Input:** MES Excel data (operations, times, status)

**Output:** Structured event log

```python
def generate_event_log(self):
    events = []

    # Create synthetic cases (100 manufacturing cases)
    for case_id in range(100):
        timestamp = start_date

        # Each case goes through all 5 operations
        for operation in ['Découpe', 'Perçage', 'Peinture', 'Assemblage', 'Contrôle']:
            # Get average times from MES data
            avg_time = mes_data[mes_data['Poste'] == operation]['Temps Réel'].mean()

            # Add some randomness
            duration = avg_time + random.uniform(-0.5, 0.5)

            # Create event
            event = {
                'case_id': f'CASE_{case_id:04d}',
                'activity': operation,
                'timestamp_start': timestamp,
                'timestamp_end': timestamp + timedelta(hours=duration),
                'station_id': f'STATION_{random.randint(1, 3):02d}',
                'result': 'Success' if random.random() > 0.15 else 'Failure',
                'rework_flag': random.random() < 0.12,
                'duration_hours': duration
            }

            events.append(event)
            timestamp = event['timestamp_end']

    return pd.DataFrame(events)
```

**Result:** 500 events (100 cases × 5 operations)

---

## 6️⃣ Frontend Visualization

### How Charts Are Built

**WIP Chart:**
```typescript
// backend/app.py - Endpoint
@app.route('/api/v2/charts/wip')
def get_wip_chart():
    data = []
    for operation in operations:
        data.append({
            'operation': operation,
            'value': count_wip(operation),
            'color': get_color(operation)
        })
    return jsonify(data)

// frontend - Renders bar chart
wipChartData = [
  { operation: 'Découpe', value: 8, color: '#3b82f6' },
  { operation: 'Perçage', value: 6, color: '#10b981' },
  { operation: 'Peinture', value: 10, color: '#ef4444' },  // Red = bottleneck
  ...
]
```

---

## 7️⃣ Real AI Integration (Not Yet Implemented)

### What REAL AI Would Do:

Instead of rule-based logic, you would call Claude API:

```python
def generate_insights_with_ai(self):
    # Prepare data summary
    data_summary = f"""
    Manufacturing KPIs:
    - Total WIP: {kpis['totalWIP']} cases
    - Average Lead Time: {kpis['avgLeadTime']} hours
    - Rework Rate: {kpis['reworkRate']}%
    - Throughput: {kpis['throughput']} cases/day

    Operations:
    {json.dumps(operations, indent=2)}
    """

    # Call Claude API
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1500,
        messages=[{
            "role": "user",
            "content": f"""You are a manufacturing process optimization expert.
            Analyze this data and provide insights and recommendations:

            {data_summary}

            Return JSON with insights and recommendations."""
        }]
    )

    # Parse AI response
    ai_insights = json.loads(response.content[0].text)
    return ai_insights
```

**This would give you:**
- Deeper analysis
- Context-aware recommendations
- Industry best practices
- More nuanced insights

---

## 8️⃣ Summary: Where Intelligence Comes From

| Intelligence Type | Source | Current Implementation |
|-------------------|--------|------------------------|
| WIP calculations | MES data + Python logic | ✅ Working |
| Lead time analysis | MES timestamps + Python | ✅ Working |
| Bottleneck detection | Queuing theory formulas | ✅ Working |
| Rework rate | MES quality data | ✅ Working |
| Insight generation | Rule-based if-then logic | ⚠️ Rule-based (not AI) |
| Recommendations | Hardcoded rules | ⚠️ Static rules |
| Event log | Synthetic from MES data | ✅ Working |
| Process discovery | Event log analysis | ✅ Working |

---

## 9️⃣ Key Formulas Used

### Little's Law (for WIP)
```
Lead Time = WIP × Cycle Time
```

### Utilization
```
Utilization = (Actual Time / Available Time) × 100%
```

### Bottleneck Score
```
Bottleneck Score = Waiting Time / Cycle Time
```
If > 2, it's a bottleneck

### Throughput
```
Throughput = Completed Cases / Total Days
```

---

## 🎯 Want to Add REAL AI?

I can help you integrate Claude API to replace the rule-based insights with actual AI analysis. Just ask! 🤖

This would:
- Analyze patterns humans might miss
- Provide context-aware recommendations
- Learn from industry best practices
- Generate natural language explanations
