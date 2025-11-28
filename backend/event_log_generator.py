"""
Event Log Generator for Process Mining
Converts MES data into standard event log format required by hackathon
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any


class EventLogGenerator:
    """Generate event log from MES data in process mining format"""

    def __init__(self, mes_data: pd.DataFrame):
        self.mes_data = mes_data

    def generate_event_log(self) -> pd.DataFrame:
        """
        Generate event log with required structure:
        - case_id: Unique identifier for each case
        - activity/operation: Operation name
        - timestamp_start: Start time of activity
        - timestamp_end: End time of activity
        - station_id: Station identifier
        - result: Success/Failure
        - rework_flag: Boolean indicating if rework was needed
        """

        if self.mes_data is None or len(self.mes_data) == 0:
            return self._generate_mock_event_log()

        try:
            event_log = []

            for idx, row in self.mes_data.iterrows():
                # Extract fields with flexible column mapping
                poste = row.get('Poste', row.get('poste', idx))
                nom = row.get('Nom', row.get('nom', f'Operation_{idx}'))
                date = row.get('Date', row.get('date', datetime.now().date()))
                heure_debut = row.get('Heure Début', row.get('Heure_Debut', '08:00'))
                heure_fin = row.get('Heure Fin', row.get('Heure_Fin', '09:00'))
                aleas = row.get('Aléas Industriels', row.get('aleas', None))

                # Parse timestamps
                try:
                    if isinstance(date, str):
                        date_obj = pd.to_datetime(date).date()
                    else:
                        date_obj = date

                    timestamp_start = datetime.combine(date_obj, pd.to_datetime(heure_debut).time())
                    timestamp_end = datetime.combine(date_obj, pd.to_datetime(heure_fin).time())
                except:
                    # Fallback to sequential timestamps
                    timestamp_start = datetime.now() + timedelta(hours=idx)
                    timestamp_end = timestamp_start + timedelta(hours=1)

                # Determine result and rework flag
                has_issue = pd.notna(aleas) if aleas is not None else False
                result = 'Failure' if has_issue else 'Success'
                rework_flag = has_issue

                event = {
                    'case_id': f'CASE_{idx:04d}',
                    'activity': str(nom),
                    'operation': str(nom),
                    'timestamp_start': timestamp_start,
                    'timestamp_end': timestamp_end,
                    'station_id': f'STATION_{poste:02d}' if isinstance(poste, int) else str(poste),
                    'result': result,
                    'rework_flag': rework_flag,
                    'duration_hours': (timestamp_end - timestamp_start).total_seconds() / 3600,
                    'issue_description': str(aleas) if has_issue else None
                }

                event_log.append(event)

            df_log = pd.DataFrame(event_log)
            return df_log

        except Exception as e:
            print(f"Error generating event log from MES data: {e}")
            return self._generate_mock_event_log()

    def _generate_mock_event_log(self) -> pd.DataFrame:
        """Generate mock event log for demonstration"""
        np.random.seed(42)  # Deterministic

        operations = ['Découpe', 'Perçage', 'Peinture', 'Assemblage', 'Contrôle']
        event_log = []

        base_date = datetime(2025, 11, 1, 8, 0, 0)

        # Generate 100 cases
        for case_num in range(100):
            current_time = base_date + timedelta(days=case_num // 5, hours=(case_num % 5) * 2)

            # Each case goes through all operations
            for op_idx, operation in enumerate(operations):
                # Duration varies by operation
                duration = np.random.uniform(0.5, 2.0)

                timestamp_start = current_time
                timestamp_end = timestamp_start + timedelta(hours=duration)

                # Simulate rework (higher for Peinture and Assemblage)
                rework_probability = 0.15 if operation in ['Peinture', 'Assemblage'] else 0.05
                has_rework = np.random.random() < rework_probability

                event = {
                    'case_id': f'CASE_{case_num:04d}',
                    'activity': operation,
                    'operation': operation,
                    'timestamp_start': timestamp_start,
                    'timestamp_end': timestamp_end,
                    'station_id': f'STATION_{op_idx + 1:02d}',
                    'result': 'Failure' if has_rework else 'Success',
                    'rework_flag': has_rework,
                    'duration_hours': duration,
                    'issue_description': 'Quality issue detected' if has_rework else None
                }

                event_log.append(event)

                # Move to next operation time
                current_time = timestamp_end + timedelta(hours=np.random.uniform(0.1, 0.5))

        return pd.DataFrame(event_log)

    def calculate_process_metrics(self, event_log: pd.DataFrame) -> Dict[str, Any]:
        """Calculate process mining metrics from event log"""

        # Cases per operation
        volume_by_operation = event_log.groupby('activity').size().to_dict()

        # Average duration by operation
        avg_duration = event_log.groupby('activity')['duration_hours'].mean().to_dict()

        # Rework rate by operation
        rework_rate = event_log.groupby('activity')['rework_flag'].apply(
            lambda x: (x.sum() / len(x) * 100) if len(x) > 0 else 0
        ).to_dict()

        # Total cases
        total_cases = event_log['case_id'].nunique()

        # Average lead time (case start to end)
        case_times = event_log.groupby('case_id').agg({
            'timestamp_start': 'min',
            'timestamp_end': 'max'
        })
        case_times['lead_time'] = (case_times['timestamp_end'] - case_times['timestamp_start']).dt.total_seconds() / 3600
        avg_lead_time = case_times['lead_time'].mean()

        # WIP by operation (cases currently in that operation)
        wip_by_operation = event_log.groupby('activity').size().to_dict()

        return {
            'total_cases': total_cases,
            'volume_by_operation': volume_by_operation,
            'avg_duration_by_operation': avg_duration,
            'rework_rate_by_operation': rework_rate,
            'avg_lead_time_hours': avg_lead_time,
            'wip_by_operation': wip_by_operation
        }

    def export_to_csv(self, event_log: pd.DataFrame, filepath: str = 'event_log.csv'):
        """Export event log to CSV for process mining tools"""
        event_log.to_csv(filepath, index=False)
        print(f"✅ Event log exported to {filepath}")
        return filepath
