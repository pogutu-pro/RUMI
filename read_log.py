import os

log_file_path = os.path.join(os.path.dirname(__file__), 'Backend', 'logs', 'django.log')

try:
    with open(log_file_path, 'r') as f:
        print(f.read())
except FileNotFoundError:
    print(f"Log file not found at: {log_file_path}")
except Exception as e:
    print(f"An error occurred: {e}")
