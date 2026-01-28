
import os

log_file_path = os.path.join('Backend', 'logs', 'celery.log')

if os.path.exists(log_file_path):
    with open(log_file_path, 'r') as f:
        print(f.read())
else:
    print(f"Log file not found at: {log_file_path}")
