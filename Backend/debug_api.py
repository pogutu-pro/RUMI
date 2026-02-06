import requests

try:
    response = requests.get('http://localhost:8000/api/v1/hostels/rooms/?hostel=1')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 500:
        print("Error content:")
        # Print the first 2000 chars to avoid overwhelming output but capture the traceback
        print(response.text[:5000])
    else:
        print("Success")
        print(response.json())
except Exception as e:
    print(e)
