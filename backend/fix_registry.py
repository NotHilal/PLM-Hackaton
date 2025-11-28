"""
Fix corrupted file_registry.json by ensuring only ONE file per category is active
Run this script to clean up the registry after the bug fix was applied
"""
import json
import os
from datetime import datetime

# Path to registry
REGISTRY_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'file_registry.json')

def fix_registry():
    """Fix registry to ensure only one active file per category"""

    if not os.path.exists(REGISTRY_PATH):
        print("❌ Registry file not found")
        return

    print("📂 Loading registry...")
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)

    print("🔧 Fixing registry...")
    fixed_count = 0

    for file_type in ['mes', 'erp', 'plm']:
        if file_type not in registry or not registry[file_type]:
            print(f"  ⏭️  {file_type.upper()}: No files")
            continue

        files = registry[file_type]

        # Count how many are marked active
        active_count = sum(1 for f in files if f.get('active', False))

        if active_count == 0:
            print(f"  ⚠️  {file_type.upper()}: No active files - marking latest as active")
            # Sort by uploaded_at and mark latest as active
            files.sort(key=lambda x: x.get('uploaded_at', ''), reverse=True)
            files[0]['active'] = True
            fixed_count += 1

        elif active_count == 1:
            print(f"  ✅ {file_type.upper()}: Already correct (1 active file)")

        else:
            print(f"  🔧 {file_type.upper()}: {active_count} active files found - fixing...")

            # Mark all as inactive first
            for f in files:
                f['active'] = False

            # Sort by uploaded_at and mark ONLY the latest as active
            files.sort(key=lambda x: x.get('uploaded_at', ''), reverse=True)
            files[0]['active'] = True

            print(f"     → Set {files[0]['id']} as active")
            fixed_count += 1

    if fixed_count > 0:
        print(f"\n💾 Saving fixed registry...")
        with open(REGISTRY_PATH, 'w') as f:
            json.dump(registry, f, indent=2)
        print(f"✅ Fixed {fixed_count} categories")
    else:
        print("\n✅ Registry was already correct - no changes needed")

    # Show summary
    print("\n📊 Final state:")
    for file_type in ['mes', 'erp', 'plm']:
        if file_type in registry and registry[file_type]:
            active_files = [f for f in registry[file_type] if f.get('active', False)]
            total_files = len(registry[file_type])
            if active_files:
                active_id = active_files[0]['id']
                print(f"  {file_type.upper()}: {total_files} total files, active: {active_id}")
            else:
                print(f"  {file_type.upper()}: {total_files} total files, active: NONE")
        else:
            print(f"  {file_type.upper()}: No files")

if __name__ == '__main__':
    print("🔧 File Registry Repair Tool")
    print("=" * 50)
    fix_registry()
    print("=" * 50)
    print("✅ Done!")
