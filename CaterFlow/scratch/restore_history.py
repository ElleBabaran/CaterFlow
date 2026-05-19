import os
import json
from datetime import datetime

appdata_roaming = os.environ.get('APPDATA')
appdata_local = os.environ.get('LOCALAPPDATA')

history_dirs = []

# Scan for any directory named "History" inside AppData
for base_dir in [appdata_roaming, appdata_local]:
    if not base_dir:
        continue
    for root, dirs, files in os.walk(base_dir):
        # Limit depth to avoid searching node_modules inside appdata if any
        if root.count(os.sep) - base_dir.count(os.sep) > 4:
            # Skip deep directories to make search fast
            dirs.clear()
            continue
        for d in dirs:
            if d == 'History':
                history_dirs.append(os.path.join(root, d))

print(f"Found History directories in AppData: {history_dirs}")

all_entries = []
for h_dir in history_dirs:
    for root, dirs, files in os.walk(h_dir):
        if 'entries.json' in files:
            entries_path = os.path.join(root, 'entries.json')
            try:
                with open(entries_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                resource = data.get('resource', '')
                if 'caterflow' in resource.lower():
                    entries = data.get('entries', [])
                    for entry in entries:
                        entry_id = entry.get('id')
                        timestamp = entry.get('timestamp')
                        if entry_id and timestamp:
                            dt = datetime.fromtimestamp(timestamp / 1000.0)
                            # We want May 19 or May 20
                            if dt.year == 2026 and dt.month == 5 and dt.day in [19, 20]:
                                history_file_path = os.path.join(root, entry_id)
                                if os.path.exists(history_file_path):
                                    all_entries.append({
                                        'resource': resource,
                                        'history_file': history_file_path,
                                        'timestamp': timestamp,
                                        'datetime': dt,
                                        'size': os.path.getsize(history_file_path)
                                    })
            except Exception:
                pass

all_entries.sort(key=lambda x: x['timestamp'], reverse=True)
print(f"\nFound {len(all_entries)} entries on May 19/20, 2026:")
for entry in all_entries[:50]:
    dt_str = entry['datetime'].strftime('%Y-%m-%d %H:%M:%S')
    print(f"- {dt_str} | {entry['resource']} ({entry['size']} bytes) | {entry['history_file']}")
