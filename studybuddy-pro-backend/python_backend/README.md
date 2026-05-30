Python Flask backend for StudyBuddy Pro

Run locally:

```bash
python -m venv .venv
source .venv/bin/activate   # or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
export FLASK_APP=app.py
flask run
```

Tests:

```bash
pytest -q
```
