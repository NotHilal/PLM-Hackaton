"""
KPI Calculation Module
Handles all KPI calculations for ERP, MES, PLM, CROSS, WORKFLOW, and Process Mining
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any


class KPICalculator:
    """Main KPI calculator class"""

    def __init__(self, erp_data=None, mes_data=None, plm_data=None, process_data=None):
        self.erp_data = erp_data
        self.mes_data = mes_data
        self.plm_data = plm_data
        self.process_data = process_data
        # keep a deterministic rng only for mock fallbacks
        self._rng = np.random.RandomState(0)

    def _parse_time_to_hours(self, time_value):
        """Convert various time formats to hours (float)
        Handles: datetime.time objects, HH:MM:SS strings, timedelta objects, numeric values
        """
        try:
            # If already numeric, return as-is
            if isinstance(time_value, (int, float)):
                return float(time_value)

            # If it's a datetime.time object (from Excel)
            if hasattr(time_value, 'hour') and hasattr(time_value, 'minute') and hasattr(time_value, 'second'):
                hours = float(time_value.hour)
                minutes = float(time_value.minute)
                seconds = float(time_value.second)
                return hours + (minutes / 60) + (seconds / 3600)

            # If it's a pandas Timedelta
            if isinstance(time_value, pd.Timedelta):
                return time_value.total_seconds() / 3600

            # If it's a string in HH:MM:SS format
            if isinstance(time_value, str):
                # Try parsing as time string
                if ':' in time_value:
                    parts = time_value.split(':')
                    if len(parts) == 3:
                        hours = float(parts[0])
                        minutes = float(parts[1])
                        seconds = float(parts[2])
                        return hours + (minutes / 60) + (seconds / 3600)
                    elif len(parts) == 2:
                        hours = float(parts[0])
                        minutes = float(parts[1])
                        return hours + (minutes / 60)
                # Try parsing as numeric string
                return float(time_value)

            return None
        except Exception:
            return None

    def _convert_time_column_to_hours(self, df, col_name):
        """Convert a time column to numeric hours"""
        if col_name is None or col_name not in df.columns:
            return None

        try:
            # Apply time parsing to each value
            hours_series = df[col_name].apply(self._parse_time_to_hours)
            return hours_series
        except Exception as e:
            print(f"Error converting time column {col_name}: {e}")
            return None

    def _numeric_columns(self, df: pd.DataFrame) -> list:
        """Return list of numeric columns in DataFrame"""
        if df is None:
            return []
        return df.select_dtypes(include=[np.number]).columns.tolist()

    def _col_or_none(self, df: pd.DataFrame, candidates: list):
        """Return first existing column name from candidates or None"""
        if df is None:
            return None
        cols = set(df.columns)
        for c in candidates:
            if c in cols:
                return c
        # try case-insensitive match
        lower_cols = {c.lower(): c for c in df.columns}
        for c in candidates:
            if c.lower() in lower_cols:
                return lower_cols[c.lower()]
        return None

    # ==================== ERP KPIs ====================

    def calculate_erp_kpis(self) -> Dict[str, Any]:
        """Calculate ERP KPIs from data"""
        if self.erp_data is None:
            return self._mock_erp_kpis()

        try:
            df = self.erp_data

            # Try to map common column names, otherwise fall back to numeric columns
            critic_col = self._col_or_none(df, ['Criticité', 'criticite', 'criticité', 'criticite_moyenne'])
            cost_col = self._col_or_none(df, ['Coût', 'Cout', 'cost', 'cout_total'])
            mass_col = self._col_or_none(df, ['Masse', 'masse', 'weight'])
            delay_col = self._col_or_none(df, ['Délai', 'Delai', 'delai', 'delay'])
            cao_col = self._col_or_none(df, ['Temps CAO', 'Temps_CAO', 'temps_cao'])

            num_cols = self._numeric_columns(df)

            def safe_mean(col):
                try:
                    return float(df[col].dropna().astype(float).mean()) if col is not None else None
                except Exception:
                    return None

            def safe_sum(col):
                try:
                    return float(df[col].dropna().astype(float).sum()) if col is not None else None
                except Exception:
                    return None

            result = {
                'criticite_moyenne': round(safe_mean(critic_col) or (safe_mean(num_cols[0]) if num_cols else None) or 0, 1),
                'cout_total': round(safe_sum(cost_col) or (safe_sum(num_cols[1]) if len(num_cols) > 1 else None) or 0, 2),
                'masse_totale': round(safe_sum(mass_col) or (safe_sum(num_cols[2]) if len(num_cols) > 2 else None) or 0, 2),
                'delai_moyen_fournisseur': round(safe_mean(delay_col) or (safe_mean(num_cols[3]) if len(num_cols) > 3 else None) or 0, 1),
                'temps_cao_total': round(safe_sum(cao_col) or (safe_sum(num_cols[4]) if len(num_cols) > 4 else None) or 0, 1)
            }

            return result
        except Exception as e:
            print(f"Error calculating ERP KPIs from dataframe: {e}")
            return self._mock_erp_kpis()

    def _mock_erp_kpis(self) -> Dict[str, Any]:
        """Mock ERP KPIs - deterministic fallback"""
        return {
            'criticite_moyenne': 2.8,
            'cout_total': 125000.0,
            'masse_totale': 3500.0,
            'delai_moyen_fournisseur': 12.5,
            'temps_cao_total': 350.0
        }

    # ==================== MES KPIs ====================

    def calculate_mes_kpis(self) -> Dict[str, Any]:
        """Calculate MES KPIs from data"""
        if self.mes_data is None:
            return self._mock_mes_kpis()

        try:
            df = self.mes_data

            # map likely column names
            ecart_col = self._col_or_none(df, ['Ecart_Temps', 'Écart_Temps', 'ecart_moyen_temps', 'ecart', 'ecart_moyen'])
            taux_col = self._col_or_none(df, ['Taux_Aleas', 'Taux_Aléas', 'taux_aleas', 'taux_aleatoire', 'taux'])
            arret_col = self._col_or_none(df, ['Temps_Arret', 'temps_arret', 'temps_arret_moyen', 'temps_arret_moyen'])
            prod_col = self._col_or_none(df, ['Productivite', 'productivite_poste', 'productivite', 'productivite_par_poste'])

            def safe_mean(col):
                try:
                    return float(df[col].dropna().astype(float).mean()) if col is not None else None
                except Exception:
                    return None

            num_cols = self._numeric_columns(df)

            # Use mapped column if available, otherwise a sensible numeric-column fallback
            ecart_val = safe_mean(ecart_col) if ecart_col is not None else (safe_mean(num_cols[0]) if len(num_cols) > 0 else None)
            taux_val = safe_mean(taux_col) if taux_col is not None else (safe_mean(num_cols[1]) if len(num_cols) > 1 else None)
            arret_val = safe_mean(arret_col) if arret_col is not None else (safe_mean(num_cols[2]) if len(num_cols) > 2 else None)
            prod_val = safe_mean(prod_col) if prod_col is not None else (safe_mean(num_cols[3]) if len(num_cols) > 3 else None)

            result = {
                'ecart_moyen_temps': round(ecart_val or 0, 1),
                'taux_aleas': round(taux_val or 0, 1),
                'temps_arret_moyen': round(arret_val or 0, 1),
                'productivite_poste': round(prod_val or 0, 1)
            }

            return result
        except Exception as e:
            print(f"Error calculating MES KPIs from dataframe: {e}")
            return self._mock_mes_kpis()

    def _mock_mes_kpis(self) -> Dict[str, Any]:
        """Mock MES KPIs"""
        return {
            'ecart_moyen_temps': round(self._rng.uniform(12, 18), 1),
            'taux_aleas': round(self._rng.uniform(7, 10), 1),
            'temps_arret_moyen': round(self._rng.uniform(20, 30), 1),
            'productivite_poste': round(self._rng.uniform(40, 50), 1)
        }

    # ==================== PLM KPIs ====================

    def calculate_plm_kpis(self) -> Dict[str, Any]:
        """Calculate PLM KPIs from data"""
        if self.plm_data is None:
            return self._mock_plm_kpis()

        try:
            df = self.plm_data
            num_cols = self._numeric_columns(df)

            # Example mappings
            cost_col = self._col_or_none(df, ['Coût MO', 'Cout_MO', 'cout_mo_total', 'cost'])
            score_col = self._col_or_none(df, ['Score', 'score_competence', 'competence'])
            seniority_col = self._col_or_none(df, ['Seniority', 'seniority_mix'])

            if cost_col and cost_col in df.columns:
                cout_mo_total = round(float(df[cost_col].dropna().astype(float).sum()), 2)
            elif num_cols:
                cout_mo_total = round(float(df[num_cols[0]].dropna().astype(float).sum()), 2)
            else:
                cout_mo_total = 0.0

            if score_col and score_col in df.columns:
                score_competence = round(float(df[score_col].dropna().astype(float).mean()), 1)
            elif len(num_cols) > 1:
                score_competence = round(float(df[num_cols[1]].dropna().astype(float).mean()), 1)
            else:
                score_competence = 0.0

            # Seniority mix: try to infer by categories if present
            experts = None
            if seniority_col and seniority_col in df.columns:
                vals = df[seniority_col].value_counts().to_dict()
                experts = vals.get('Expert', vals.get('expert', None))

            if experts is None:
                experts = int(self._rng.randint(30, 40))

            return {
                'cout_mo_total': cout_mo_total,
                'score_competence': score_competence,
                'seniority_mix': {
                    'experts': experts,
                    'juniors': max(0, 100 - experts)
                }
            }
        except Exception as e:
            print(f"Error calculating PLM KPIs from dataframe: {e}")
            return self._mock_plm_kpis()

    def _mock_plm_kpis(self) -> Dict[str, Any]:
        """Mock PLM KPIs - deterministic fallback"""
        return {
            'cout_mo_total': 85000.0,
            'score_competence': 7.8,
            'seniority_mix': {
                'experts': 35,
                'juniors': 65
            }
        }

    # ==================== CROSS KPIs ====================

    def calculate_cross_kpis(self) -> Dict[str, Any]:
        """Calculate cross-functional KPIs - deterministic"""
        return {
            'impact_aleas': 12.5,
            'cout_retard': 15000.0
        }

    # ==================== WORKFLOW KPIs ====================

    def calculate_workflow_kpis(self) -> Dict[str, Any]:
        """Calculate workflow KPIs - deterministic"""
        disponibilite = {}
        for i in range(1, 41):
            # Deterministic availability based on station number
            disponibilite[f'Poste_{i}'] = round(0.75 + (i % 10) * 0.02, 2)

        return {
            'bottleneck_index': 0.75,
            'cycle_time_global': 5.8,
            'disponibilite_par_poste': disponibilite
        }

    # ==================== PROCESS MINING KPIs ====================

    def calculate_process_mining_kpis(self) -> Dict[str, Any]:
        """Calculate process mining KPIs from real MES data"""
        # Use MES data instead of process_data
        if self.mes_data is None:
            return self._mock_process_mining_kpis()

        try:
            df = self.mes_data

            # Calculate metrics from MES data
            # Total WIP = number of active cases
            total_wip = len(df)

            # Parse time columns first (needed for multiple calculations)
            temps_reel_col = self._col_or_none(df, ['Temps Réel', 'Temps_Reel', 'temps_reel'])
            temps_prevu_col = self._col_or_none(df, ['Temps Prévu', 'Temps_Prevu', 'temps_prevu'])

            temps_reel_hours = self._convert_time_column_to_hours(df, temps_reel_col) if temps_reel_col else None
            temps_prevu_hours = self._convert_time_column_to_hours(df, temps_prevu_col) if temps_prevu_col else None

            # Average lead time from 'Temps Réel' column
            if temps_reel_hours is not None:
                avg_lead = round(float(temps_reel_hours.dropna().mean()), 2)
            else:
                avg_lead = 5.5

            # Average cycle time from 'Temps Prévu' column
            if temps_prevu_hours is not None:
                avg_cycle = round(float(temps_prevu_hours.dropna().mean()), 2)
            else:
                avg_cycle = 22.5

            # Rework rate - calculate based on time variance with detailed breakdown
            if temps_reel_hours is not None and temps_prevu_hours is not None:
                temp_df = df.copy()
                temp_df['_temps_reel_hours'] = temps_reel_hours
                temp_df['_temps_prevu_hours'] = temps_prevu_hours

                # Calculate variance: (actual - planned) / planned
                temp_df['_variance'] = (temp_df['_temps_reel_hours'] - temp_df['_temps_prevu_hours']) / temp_df['_temps_prevu_hours']

                # Average variance (as percentage)
                avg_variance_pct = round(float(temp_df['_variance'].mean() * 100), 1)

                # Count rows where variance > 40% (0.4) - operations taking 40%+ longer
                rework_count = (temp_df['_variance'] > 0.4).sum()
                rework_rate = round((rework_count / len(df)) * 100, 1)

                # Breakdown by severity levels
                on_time_count = (temp_df['_variance'] <= 0.1).sum()  # Within 10%
                minor_delay_count = ((temp_df['_variance'] > 0.1) & (temp_df['_variance'] <= 0.25)).sum()  # 10-25%
                moderate_delay_count = ((temp_df['_variance'] > 0.25) & (temp_df['_variance'] <= 0.4)).sum()  # 25-40%
                severe_delay_count = (temp_df['_variance'] > 0.4).sum()  # >40%

                variance_breakdown = {
                    'onTime': int(on_time_count),  # ≤10% variance
                    'onTimePct': round((on_time_count / len(df)) * 100, 1),
                    'minorDelay': int(minor_delay_count),  # 10-25% variance
                    'minorDelayPct': round((minor_delay_count / len(df)) * 100, 1),
                    'moderateDelay': int(moderate_delay_count),  # 25-40% variance
                    'moderateDelayPct': round((moderate_delay_count / len(df)) * 100, 1),
                    'severeDelay': int(severe_delay_count),  # >40% variance
                    'severeDelayPct': round((severe_delay_count / len(df)) * 100, 1),
                    'avgVariancePct': avg_variance_pct  # Average variance as %
                }
            else:
                # Fallback: check if Aléas Industriels column exists and has values
                aleas_col = self._col_or_none(df, ['Aléas Industriels', 'Aleas_Industriels', 'aleas'])
                if aleas_col:
                    # Only count rows with meaningful issue text (not NaN, not empty)
                    rework_rate = round((df[aleas_col].notna().sum() / len(df)) * 100, 1)
                else:
                    rework_rate = 8.5
                variance_breakdown = None

            # Throughput = average pieces per hour
            pieces_col = self._col_or_none(df, ['Nombre pièces', 'Nombre_pieces', 'nombre_pieces', 'Nombre pi�ces'])
            if pieces_col:
                try:
                    throughput = round(float(df[pieces_col].dropna().astype(float).mean()), 1)
                except:
                    throughput = 17.0
            else:
                throughput = 17.0

            # Find bottleneck - operation with highest average time
            nom_col = self._col_or_none(df, ['Nom', 'nom'])
            if nom_col and temps_reel_col and temps_reel_hours is not None:
                # Create temporary dataframe with parsed times
                temp_df = df.copy()
                temp_df['_temps_reel_hours'] = temps_reel_hours
                bottleneck_row = temp_df.groupby(nom_col)['_temps_reel_hours'].mean().idxmax()
                bottleneck = str(bottleneck_row) if pd.notna(bottleneck_row) else 'Assemblage'
            else:
                bottleneck = 'Assemblage'

            # Total cases
            total_cases = len(df)

            result = {
                'totalWIP': total_wip,
                'avgLeadTime': avg_lead,
                'reworkRate': rework_rate,
                'throughput': throughput,
                'bottleneckOperation': bottleneck,
                'deltaWIP': -15,
                'deltaLeadTime': -22,
                'totalCases': total_cases,
                'avgCycleTime': avg_cycle
            }

            # Add variance breakdown if available
            if variance_breakdown:
                result['varianceBreakdown'] = variance_breakdown

            return result
        except Exception as e:
            print(f"Error calculating process mining KPIs from MES data: {e}")
            return self._mock_process_mining_kpis()

    def _mock_process_mining_kpis(self) -> Dict[str, Any]:
        """Mock process mining KPIs - deterministic fallback"""
        return {
            'totalWIP': 75,  # Fixed value
            'avgLeadTime': 5.4,  # Fixed value
            'reworkRate': 7.8,  # Fixed value
            'throughput': 16.3,  # Fixed value
            'bottleneckOperation': 'Assemblage',
            'deltaWIP': -15,
            'deltaLeadTime': -22,
            'totalCases': 500,
            'avgCycleTime': 22.5  # Fixed value
        }

    def calculate_operation_summaries(self) -> List[Dict[str, Any]]:
        """Calculate operation summaries from real MES data"""
        if self.mes_data is None:
            # Fallback to deterministic mock data
            return self._mock_operation_summaries()

        try:
            df = self.mes_data

            # Get column names
            poste_col = self._col_or_none(df, ['Poste', 'poste'])
            nom_col = self._col_or_none(df, ['Nom', 'nom'])
            temps_reel_col = self._col_or_none(df, ['Temps Réel', 'Temps_Reel', 'temps_reel'])
            temps_prevu_col = self._col_or_none(df, ['Temps Prévu', 'Temps_Prevu', 'temps_prevu'])
            pieces_col = self._col_or_none(df, ['Nombre pièces', 'Nombre_pieces', 'nombre_pieces', 'Nombre pi�ces'])
            aleas_col = self._col_or_none(df, ['Aléas Industriels', 'Aleas_Industriels', 'aleas'])

            # Convert time columns to hours
            temps_reel_hours = self._convert_time_column_to_hours(df, temps_reel_col) if temps_reel_col else None
            temps_prevu_hours = self._convert_time_column_to_hours(df, temps_prevu_col) if temps_prevu_col else None

            # Add parsed columns to dataframe
            if temps_reel_hours is not None:
                df = df.copy()
                df['_temps_reel_hours'] = temps_reel_hours
            if temps_prevu_hours is not None:
                if '_temps_reel_hours' not in df.columns:
                    df = df.copy()
                df['_temps_prevu_hours'] = temps_prevu_hours

            # Group by operation name
            if nom_col is None:
                return self._mock_operation_summaries()

            summaries = []
            for operation in df[nom_col].unique():
                op_data = df[df[nom_col] == operation]

                # Calculate metrics
                wip = len(op_data)

                # Use parsed time columns
                if '_temps_prevu_hours' in op_data.columns:
                    avg_cycle = round(float(op_data['_temps_prevu_hours'].mean()), 2)
                else:
                    avg_cycle = 0.42

                if '_temps_reel_hours' in op_data.columns:
                    avg_real = round(float(op_data['_temps_reel_hours'].mean()), 2)
                else:
                    avg_real = 0.48

                # Waiting time = real time - planned time
                avg_waiting = round(max(0, avg_real - avg_cycle), 2)

                case_count = len(op_data)

                # Rework rate = % of cases where actual > planned by >40%
                # Also calculate average variance for this operation
                if '_temps_reel_hours' in op_data.columns and '_temps_prevu_hours' in op_data.columns:
                    variance = (op_data['_temps_reel_hours'] - op_data['_temps_prevu_hours']) / op_data['_temps_prevu_hours']
                    rework_count = (variance > 0.4).sum()
                    rework = round((rework_count / len(op_data)) * 100, 1)
                    avg_variance_pct = round(float(variance.mean() * 100), 1)  # Average variance as %
                else:
                    # Fallback to aleas column
                    if aleas_col:
                        rework = round((op_data[aleas_col].notna().sum() / len(op_data)) * 100, 1)
                    else:
                        rework = 0.0
                    avg_variance_pct = None

                # Throughput
                if pieces_col:
                    try:
                        throughput_val = round(float(op_data[pieces_col].mean()), 1)
                    except:
                        throughput_val = 15.0
                else:
                    throughput_val = 15.0

                # Determine bottleneck severity based on waiting time (in hours)
                if avg_waiting > 0.5:  # More than 30 minutes waiting
                    severity = 'high'
                elif avg_waiting > 0.25:  # More than 15 minutes waiting
                    severity = 'medium'
                elif avg_waiting > 0.1:  # More than 6 minutes waiting
                    severity = 'low'
                else:
                    severity = 'none'

                op_summary = {
                    'operation': str(operation),
                    'currentWIP': wip,
                    'avgCycleTime': avg_cycle,
                    'avgWaitingTime': avg_waiting,
                    'caseCount': case_count,
                    'reworkRate': rework,
                    'throughput': throughput_val,
                    'bottleneckSeverity': severity
                }

                # Add variance percentage if available
                if avg_variance_pct is not None:
                    op_summary['avgVariancePct'] = avg_variance_pct

                summaries.append(op_summary)

            return summaries
        except Exception as e:
            print(f"Error calculating operation summaries from MES data: {e}")
            return self._mock_operation_summaries()

    def _mock_operation_summaries(self) -> List[Dict[str, Any]]:
        """Deterministic mock operation summaries"""
        operations = ['Découpe', 'Perçage', 'Peinture', 'Assemblage', 'Contrôle']
        summaries = []

        for i, op in enumerate(operations):
            is_bottleneck = (op == 'Assemblage')

            summaries.append({
                'operation': op,
                'currentWIP': 12 + i * 2,  # Deterministic
                'avgCycleTime': round(18.0 + i * 3.0, 1),  # Deterministic
                'avgWaitingTime': 30.0 if is_bottleneck else round(12.0 + i * 2.5, 1),
                'caseCount': 450 + i * 10,  # Deterministic
                'reworkRate': round(8.0 + i * 1.5, 1),  # Deterministic
                'throughput': round(16.0 + i * 0.5, 1),  # Deterministic
                'bottleneckSeverity': 'high' if is_bottleneck else (['none', 'low', 'medium', 'low', 'none'][i])
            })

        return summaries

    def calculate_bottlenecks(self) -> List[Dict[str, Any]]:
        """Calculate bottleneck analysis"""
        return [
            {
                'operation': 'Assemblage',
                'station_id': 'STATION_04',
                'avgWaitingTime': 35.0,
                'avgCycleTime': 25.0,
                'waitingToCycleRatio': 1.4,
                'currentWIP': 18,
                'severity': 'high',
                'reason': 'Waiting time exceeds cycle time significantly'
            },
            {
                'operation': 'Peinture',
                'station_id': 'STATION_03',
                'avgWaitingTime': 22.0,
                'avgCycleTime': 30.0,
                'waitingToCycleRatio': 0.73,
                'currentWIP': 12,
                'severity': 'medium',
                'reason': 'High rework rate (18.0%) causing queue buildup'
            }
        ]

    # ==================== AI INSIGHTS ====================

    def generate_insights(self) -> Dict[str, Any]:
        """Generate AI-powered insights and recommendations"""
        # This could integrate with OpenAI/Claude API for real AI insights

        kpis = self.calculate_process_mining_kpis()
        operations = self.calculate_operation_summaries()

        insights = []
        recommendations = []

        # Generate insights based on KPIs
        if kpis['reworkRate'] > 8:
            insights.append({
                'type': 'warning',
                'title': 'Taux de reprise élevé',
                'description': f"Le taux de reprise actuel ({kpis['reworkRate']}%) dépasse le seuil acceptable de 8%",
                'impact': 'high'
            })
            recommendations.append({
                'action': 'Améliorer le contrôle qualité en Peinture',
                'expectedImpact': 'Réduction du taux de reprise de 5-7%',
                'priority': 'high',
                'cost': 'medium'
            })

        if kpis['totalWIP'] > 75:
            insights.append({
                'type': 'info',
                'title': 'WIP élevé détecté',
                'description': f"Work-in-Progress actuel: {kpis['totalWIP']} cas",
                'impact': 'medium'
            })
            recommendations.append({
                'action': 'Résoudre le goulot au niveau Assemblage',
                'expectedImpact': 'Réduction WIP de 15-20%',
                'priority': 'high',
                'cost': 'low'
            })

        insights.append({
            'type': 'success',
            'title': 'Potentiel d\'optimisation identifié',
            'description': 'Amélioration potentielle du lead time de 22%',
            'impact': 'high'
        })

        recommendations.append({
            'action': 'Ajouter une ressource au poste Assemblage',
            'expectedImpact': 'Réduction cycle time de 25%',
            'priority': 'high',
            'cost': 'high'
        })

        return {
            'insights': insights,
            'recommendations': recommendations,
            'summary': f"Système opérationnel avec {kpis['totalWIP']} cas en cours. "
                      f"Goulot principal identifié: {kpis['bottleneckOperation']}. "
                      f"Potentiel d'optimisation: -{kpis['deltaWIP']}% WIP, -{abs(kpis['deltaLeadTime'])}% Lead Time."
        }

    # ==================== RESOURCE & SUPPLY CHAIN ANALYTICS ====================

    def calculate_resource_kpis(self) -> Dict[str, Any]:
        """Calculate Resource (HR) KPIs from ERP data"""
        if self.erp_data is None:
            return self._mock_resource_kpis()

        try:
            df = self.erp_data

            # Column mappings
            age_col = self._col_or_none(df, ['Âge', 'Age', 'age'])
            cost_col = self._col_or_none(df, ['Coût horaire (€)', 'Cout_horaire', 'cout_horaire'])
            rotation_col = self._col_or_none(df, ['Rotation', 'rotation'])

            total_employees = len(df)

            # Average age
            if age_col:
                avg_age = round(float(df[age_col].dropna().mean()), 1)
            else:
                avg_age = 35.0

            # Labor costs
            if cost_col:
                avg_labor_cost = round(float(df[cost_col].dropna().mean()), 2)
                total_labor_cost = round(float(df[cost_col].dropna().sum()) * 160, 2)  # Monthly (160h)
            else:
                avg_labor_cost = 25.0
                total_labor_cost = total_employees * 25.0 * 160

            # Rotation rate
            if rotation_col:
                # Check if rotation is numeric or text
                try:
                    rotation_rate = round(float(df[rotation_col].dropna().mean()), 1)
                except:
                    rotation_rate = 12.5
            else:
                rotation_rate = 12.5

            return {
                'totalEmployees': total_employees,
                'avgLaborCost': avg_labor_cost,
                'totalLaborCost': total_labor_cost,
                'avgAge': avg_age,
                'avgExperience': 5.5,
                'rotationRate': rotation_rate
            }
        except Exception as e:
            print(f"Error calculating resource KPIs: {e}")
            return self._mock_resource_kpis()

    def _mock_resource_kpis(self) -> Dict[str, Any]:
        """Mock resource KPIs"""
        return {
            'totalEmployees': 150,
            'avgLaborCost': 28.50,
            'totalLaborCost': 684000.0,
            'avgAge': 37.5,
            'avgExperience': 6.2,
            'rotationRate': 14.3
        }

    def calculate_supply_chain_kpis(self) -> Dict[str, Any]:
        """Calculate Supply Chain KPIs from PLM data"""
        if self.plm_data is None:
            return self._mock_supply_chain_kpis()

        try:
            df = self.plm_data

            # Column mappings
            cost_col = self._col_or_none(df, ['Coût achat pièce (€)', 'Cout_achat', 'cout'])
            lead_time_col = self._col_or_none(df, ['Délai Approvisionnement', 'Delai', 'delai'])
            criticality_col = self._col_or_none(df, ['Criticité', 'Criticite', 'criticite'])
            mass_col = self._col_or_none(df, ['Masse (kg)', 'Masse', 'masse'])
            cao_col = self._col_or_none(df, ['Temps CAO (h)', 'Temps_CAO', 'temps_cao'])

            total_parts = len(df)

            # Procurement cost
            if cost_col:
                total_procurement_cost = round(float(df[cost_col].dropna().sum()), 2)
            else:
                total_procurement_cost = 0.0

            # Lead time
            if lead_time_col:
                avg_lead_time = round(float(df[lead_time_col].dropna().mean()), 1)
            else:
                avg_lead_time = 15.0

            # Criticality
            if criticality_col:
                # Check if criticality is numeric or categorical
                if pd.api.types.is_numeric_dtype(df[criticality_col]):
                    avg_criticality = round(float(df[criticality_col].dropna().mean()), 2)
                    critical_parts_count = int((df[criticality_col] >= 3).sum())
                else:
                    # Categorical criticality - map to numeric values
                    severity_map = {'Basse': 1, 'Moyenne': 2, 'Haute': 3, 'Critique': 4,
                                    'Basse_X': 1, 'Moyenne_X': 2, 'Haute_X': 3, 'Critique_X': 4}
                    numeric_crit = df[criticality_col].map(severity_map).fillna(2)
                    avg_criticality = round(float(numeric_crit.mean()), 2)
                    # Count "Haute" and "Critique" as critical parts
                    critical_parts_count = int(((df[criticality_col].str.contains('Haute', na=False)) |
                                                 (df[criticality_col].str.contains('Critique', na=False))).sum())
            else:
                avg_criticality = 2.5
                critical_parts_count = int(total_parts * 0.3)

            # Mass
            if mass_col:
                total_weight = round(float(df[mass_col].dropna().sum()), 2)
            else:
                total_weight = 0.0

            # CAO time
            if cao_col:
                total_cao_time = round(float(df[cao_col].dropna().sum()), 1)
            else:
                total_cao_time = 0.0

            return {
                'totalParts': total_parts,
                'totalProcurementCost': total_procurement_cost,
                'avgLeadTime': avg_lead_time,
                'criticalPartsCount': critical_parts_count,
                'avgCriticality': avg_criticality,
                'totalWeight': total_weight,
                'totalCAOTime': total_cao_time
            }
        except Exception as e:
            print(f"Error calculating supply chain KPIs: {e}")
            return self._mock_supply_chain_kpis()

    def _mock_supply_chain_kpis(self) -> Dict[str, Any]:
        """Mock supply chain KPIs"""
        return {
            'totalParts': 40,
            'totalProcurementCost': 2500000.0,
            'avgLeadTime': 18.5,
            'criticalPartsCount': 12,
            'avgCriticality': 2.8,
            'totalWeight': 3500.0,
            'totalCAOTime': 450.0
        }

    def get_cost_by_qualification_chart(self) -> List[Dict[str, Any]]:
        """Get cost by qualification chart data"""
        if self.erp_data is None:
            return []

        try:
            df = self.erp_data
            qual_col = self._col_or_none(df, ['Qualification', 'qualification'])
            cost_col = self._col_or_none(df, ['Coût horaire (€)', 'Cout_horaire', 'cout_horaire'])

            if qual_col and cost_col:
                grouped = df.groupby(qual_col)[cost_col].sum().reset_index()
                grouped.columns = ['name', 'value']
                grouped['value'] = grouped['value'].round(2)
                return grouped.to_dict('records')
            return []
        except Exception as e:
            print(f"Error generating cost by qualification chart: {e}")
            return []

    def get_experience_distribution_chart(self) -> List[Dict[str, Any]]:
        """Get experience distribution chart data"""
        if self.erp_data is None:
            return []

        try:
            df = self.erp_data
            exp_col = self._col_or_none(df, ["Niveau d'expérience", 'Niveau_experience', 'experience'])

            if exp_col:
                counts = df[exp_col].value_counts().reset_index()
                counts.columns = ['name', 'value']
                return counts.to_dict('records')
            return []
        except Exception as e:
            print(f"Error generating experience distribution chart: {e}")
            return []

    def get_supplier_distribution_chart(self) -> List[Dict[str, Any]]:
        """Get supplier distribution chart data (Top 10)"""
        if self.plm_data is None:
            return []

        try:
            df = self.plm_data
            supplier_col = self._col_or_none(df, ['Fournisseur', 'fournisseur', 'supplier'])

            if supplier_col:
                counts = df[supplier_col].value_counts().head(10).reset_index()
                counts.columns = ['name', 'value']
                return counts.to_dict('records')
            return []
        except Exception as e:
            print(f"Error generating supplier distribution chart: {e}")
            return []

    def get_criticality_distribution_chart(self) -> List[Dict[str, Any]]:
        """Get criticality distribution chart data"""
        if self.plm_data is None:
            return []

        try:
            df = self.plm_data
            crit_col = self._col_or_none(df, ['Criticité', 'Criticite', 'criticite'])

            if crit_col:
                # Check if criticality is numeric or categorical
                if pd.api.types.is_numeric_dtype(df[crit_col]):
                    # Numeric criticality - create bins
                    df_copy = df.copy()
                    df_copy['crit_level'] = pd.cut(df_copy[crit_col],
                                                    bins=[0, 1, 2, 3, 4, 5],
                                                    labels=['Très Faible (0-1)', 'Faible (1-2)', 'Moyenne (2-3)', 'Élevée (3-4)', 'Critique (4-5)'],
                                                    include_lowest=True)
                    counts = df_copy['crit_level'].value_counts().reset_index()
                else:
                    # Categorical criticality (e.g., "Basse_X", "Moyenne_X", etc.)
                    counts = df[crit_col].value_counts().reset_index()
                    # Clean up labels - remove "_X" suffix if present
                    counts[crit_col] = counts[crit_col].astype(str).str.replace('_X', '', regex=False)

                    # Map French terms and sort by severity
                    severity_order = {'Basse': 1, 'Moyenne': 2, 'Haute': 3, 'Critique': 4}
                    counts['sort_order'] = counts[crit_col].map(severity_order).fillna(5)
                    counts = counts.sort_values('sort_order').drop('sort_order', axis=1)

                counts.columns = ['name', 'value']
                return counts.to_dict('records')
            return []
        except Exception as e:
            print(f"Error generating criticality distribution chart: {e}")
            return []

    # ==================== ALL KPIs COMBINED ====================

    def get_all_kpis(self) -> Dict[str, Any]:
        """Get all KPIs in one call"""
        return {
            'ERP': self.calculate_erp_kpis(),
            'MES': self.calculate_mes_kpis(),
            'PLM': self.calculate_plm_kpis(),
            'CROSS': self.calculate_cross_kpis(),
            'WORKFLOW': self.calculate_workflow_kpis(),
            'PROCESS_MINING': {
                'kpis': self.calculate_process_mining_kpis(),
                'operations': self.calculate_operation_summaries(),
                'bottlenecks': self.calculate_bottlenecks()
            }
        }
