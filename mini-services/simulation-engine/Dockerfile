FROM python:3.11-slim

WORKDIR /app

RUN pip install fastapi uvicorn

COPY . .

EXPOSE 8001

CMD ["python", "main.py"]
