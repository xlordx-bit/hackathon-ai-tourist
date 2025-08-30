FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./src /app/src

EXPOSE 5000

CMD ["uvicorn", "src.ai_engine.main:app", "--host", "0.0.0.0", "--port", "5000"]
