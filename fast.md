cd frontend && pnpm dev


cd Backend && python3 -m venv venv && source venv/bin/activate && python manage.py runserver

python manage.py migrate
python manage.py runserver
