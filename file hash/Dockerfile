FROM python:3.11-slim

WORKDIR /app


# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY static/ static/
COPY templates/ templates/
COPY app.py .

# Expose the default Flask port (5000)
EXPOSE 8080

# Command to run the application
# We use 0.0.0.0 to bind to all interfaces, which is necessary inside a container.
# CMD ["flask", "--app", "app", "run", "--host", "0.0.0.0", "--port", "5000"]
CMD ["/bin/sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT} app:app"]