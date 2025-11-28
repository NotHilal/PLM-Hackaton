# -*- coding: utf-8 -*-
"""
BPMN Process Flow Generator
Uses pm4py for real process mining and discovery
"""

import pandas as pd
import io
import base64
from typing import Dict, List, Any
try:
    import pm4py
    from pm4py.objects.log.obj import EventLog, Trace, Event
    from pm4py.objects.conversion.log import converter as log_converter
    from pm4py.algo.discovery.dfg import algorithm as dfg_discovery
    from pm4py.visualization.dfg import visualizer as dfg_visualization
    PM4PY_AVAILABLE = True
except ImportError:
    PM4PY_AVAILABLE = False
    print("⚠️ pm4py not available, BPMN generation will be limited")


class BPMNGenerator:
    """Generate BPMN-style process diagrams from event log"""

    def __init__(self, event_log_df: pd.DataFrame):
        """
        Initialize with event log DataFrame

        Expected columns:
        - case_id: unique identifier for each case
        - activity: operation/activity name
        - timestamp_start: start timestamp
        - timestamp_end: end timestamp
        """
        self.event_log_df = event_log_df
        self.dfg = None
        self.performance_dfg = None

    def generate_process_graph(self) -> Dict[str, Any]:
        """
        Generate process flow graph data
        Returns structured data that frontend can render
        """
        if not PM4PY_AVAILABLE:
            return self._generate_simple_graph()

        try:
            # Convert DataFrame to pm4py event log format
            event_log = self._convert_to_pm4py_log()

            # Discover DFG (Directly-Follows Graph)
            dfg = dfg_discovery.apply(event_log)

            # Get start and end activities
            start_activities = pm4py.get_start_activities(event_log)
            end_activities = pm4py.get_end_activities(event_log)

            # Get performance metrics (time between activities)
            performance_dfg = dfg_discovery.apply(event_log, variant=dfg_discovery.Variants.PERFORMANCE)

            # Convert to structured format for frontend
            graph_data = self._dfg_to_graph_structure(dfg, performance_dfg, start_activities, end_activities)

            return graph_data

        except Exception as e:
            print(f"❌ Error generating process graph: {e}")
            return self._generate_simple_graph()

    def generate_bpmn_svg(self) -> str:
        """
        Generate BPMN diagram as SVG string
        Returns base64 encoded SVG
        """
        if not PM4PY_AVAILABLE:
            return ""

        try:
            # Convert to pm4py event log
            event_log = self._convert_to_pm4py_log()

            # Discover DFG
            dfg = dfg_discovery.apply(event_log)
            start_activities = pm4py.get_start_activities(event_log)
            end_activities = pm4py.get_end_activities(event_log)

            # Visualize as DFG (similar to BPMN)
            gviz = dfg_visualization.apply(
                dfg,
                log=event_log,
                variant=dfg_visualization.Variants.FREQUENCY,
                parameters={
                    dfg_visualization.Variants.FREQUENCY.value.Parameters.START_ACTIVITIES: start_activities,
                    dfg_visualization.Variants.FREQUENCY.value.Parameters.END_ACTIVITIES: end_activities,
                    dfg_visualization.Variants.FREQUENCY.value.Parameters.FORMAT: "svg"
                }
            )

            # Convert to SVG bytes
            svg_bytes = gviz.pipe(format='svg')

            # Encode to base64 for easy transport
            svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')

            return svg_base64

        except Exception as e:
            print(f"❌ Error generating BPMN SVG: {e}")
            return ""

    def _convert_to_pm4py_log(self) -> EventLog:
        """Convert pandas DataFrame to pm4py EventLog object"""
        # Create a copy and ensure timestamp columns are datetime
        df = self.event_log_df.copy()

        if 'timestamp_start' in df.columns:
            df['timestamp_start'] = pd.to_datetime(df['timestamp_start'])

        # Rename columns to pm4py standard
        df_renamed = df.rename(columns={
            'case_id': 'case:concept:name',
            'activity': 'concept:name',
            'timestamp_start': 'time:timestamp'
        })

        # Ensure required columns exist
        if 'time:timestamp' not in df_renamed.columns and 'timestamp_start' in df.columns:
            df_renamed['time:timestamp'] = df['timestamp_start']

        # Convert to event log
        event_log = log_converter.apply(df_renamed, variant=log_converter.Variants.TO_EVENT_LOG)

        return event_log

    def _dfg_to_graph_structure(
        self,
        dfg: Dict,
        performance_dfg: Dict,
        start_activities: Dict,
        end_activities: Dict
    ) -> Dict[str, Any]:
        """
        Convert DFG to structured graph data for frontend

        Returns:
        {
            "nodes": [{"id": "activity_name", "label": "...", "type": "...", "frequency": ...}],
            "edges": [{"from": "A", "to": "B", "frequency": ..., "avgTime": ...}]
        }
        """
        nodes = []
        edges = []

        # Extract unique activities from DFG
        activities = set()
        for (src, tgt), freq in dfg.items():
            activities.add(src)
            activities.add(tgt)

        # Create nodes
        for activity in activities:
            node_type = "normal"
            if activity in start_activities:
                node_type = "start"
            elif activity in end_activities:
                node_type = "end"

            # Get frequency (how many times this activity occurred)
            frequency = start_activities.get(activity, 0) + end_activities.get(activity, 0)

            nodes.append({
                "id": activity,
                "label": activity,
                "type": node_type,
                "frequency": frequency
            })

        # Create edges
        for (src, tgt), freq in dfg.items():
            # Get average time between activities
            avg_time = performance_dfg.get((src, tgt), 0) if performance_dfg else 0

            edges.append({
                "from": src,
                "to": tgt,
                "frequency": freq,
                "avgTime": avg_time
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "startActivities": list(start_activities.keys()),
            "endActivities": list(end_activities.keys())
        }

    def _generate_simple_graph(self) -> Dict[str, Any]:
        """
        Fallback: Generate simple sequential graph without pm4py
        Based on order of operations in event log
        """
        # Get unique activities in order of first appearance
        activities = self.event_log_df.groupby('activity')['timestamp_start'].min().sort_values()
        activity_list = activities.index.tolist()

        nodes = []
        edges = []

        for i, activity in enumerate(activity_list):
            node_type = "start" if i == 0 else ("end" if i == len(activity_list) - 1 else "normal")

            # Count frequency
            frequency = len(self.event_log_df[self.event_log_df['activity'] == activity])

            nodes.append({
                "id": activity,
                "label": activity,
                "type": node_type,
                "frequency": frequency
            })

            # Create edge to next activity
            if i < len(activity_list) - 1:
                next_activity = activity_list[i + 1]
                edges.append({
                    "from": activity,
                    "to": next_activity,
                    "frequency": frequency
                })

        return {
            "nodes": nodes,
            "edges": edges,
            "startActivities": [activity_list[0]] if activity_list else [],
            "endActivities": [activity_list[-1]] if activity_list else []
        }

    def get_bottleneck_info(self, bottlenecks: List[Dict]) -> Dict[str, Any]:
        """
        Annotate graph with bottleneck information

        Args:
            bottlenecks: List of bottleneck dicts with operation name and severity

        Returns:
            Dict mapping operation names to bottleneck severity
        """
        bottleneck_map = {}
        for bn in bottlenecks:
            operation = bn.get('operation', bn.get('operation_name', ''))
            severity = bn.get('severity', 'low')
            bottleneck_map[operation] = severity

        return bottleneck_map
