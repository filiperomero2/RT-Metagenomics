# FastAPI Project

This is a FastAPI project structured to provide a clean and organized way to build web applications. Below are the details regarding the project setup and usage.

## Project Structure

```
back
├── app
│   ├── main.py          # Entry point of the FastAPI application
│   ├── routers          # Contains route handlers
│   │   └── __init__.py
│   ├── models           # Contains data models
│   │   └── __init__.py
│   ├── schemas          # Contains Pydantic schemas for validation
│   │   └── __init__.py
├── requirements.txt     # Lists project dependencies
├── .env                 # Environment variables
└── README.md            # Project documentation
```

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd back
   ```

2. **Create a virtual environment**:
   ```
   conda create -n rt-meta
   ```

3. **Activate the virtual environment**:
   ```
   conda activate rt-meta
   ```

4. **Install dependencies**:
   ```
   conda  env update -n rt-meta --file environment.yaml
   ```

5. **Set up environment variables**:
   Create a `.env` file in the root directory and add your environment variables.

## Usage

To run the FastAPI application, execute the following command:

```
fastapi dev app/main.py
```
or
```
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
```

Visit `http://127.0.0.1:8000/docs` to access the interactive API documentation.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.