FROM python:3.9-slim

WORKDIR /app

# Install PostgreSQL client and development libraries
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        libpq-dev \
        gcc \
        python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.py

# Expose the port the app runs on
EXPOSE 5005

# Set the entrypoint script
ENTRYPOINT ["python", "/app/entrypoint.py"]

# Command to run the application
CMD ["python", "manage.py", "run", "--host=0.0.0.0", "--port=5005"]