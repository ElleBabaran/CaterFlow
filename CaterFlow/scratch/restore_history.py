import os
import shutil

history_dir = r"c:\Users\Aron\Desktop\caterFlow\CaterFlow\.vscode_history"

if os.path.exists(history_dir):
    try:
        shutil.rmtree(history_dir)
        print("Successfully deleted .vscode_history directory!")
    except Exception as e:
        print(f"Error deleting .vscode_history: {e}")
else:
    print(".vscode_history directory does not exist!")
