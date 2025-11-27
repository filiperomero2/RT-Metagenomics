# RT-Metagenomics Backend API

This is a FastAPI-based backend for the RT-Metagenomics project, providing a clean and organized way to build metagenomics analysis web applications.

## Project Structure & Architecture

### Layers
1. **Routers**: Handle HTTP requests and responses
2. **Use Cases**: Application business logic
3. **Services**: Domain services and external integrations
4. **Entities**: Database models and domain objects
5. **Infrastructure**: Database, external services, utilities

### Key Components
- **ViralUnityService**: Background service for processing metagenomics tasks
- **Exception Handling**: Centralized error handling with custom exceptions
- **Response Models**: Type-safe response models for consistent API responses
- **Configuration Management**: Environment-based configuration system
- **Dependency Injection**: Centralized DI container using dependency-injector

```
back/
├── app/
│   ├── main.py              # Entry point of the FastAPI application
│   ├── config.py            # Configuration management
│   ├── exceptions.py        # Custom exception handling
│   ├── routers/             # API route handlers
│   │   └── v1/
│   ├── schemas/             # Request/Response models
│   ├── entities/            # Database models
│   ├── services/            # Business logic services
│   ├── usecases/            # Application use cases
│   └── infra/               # Infrastructure layer
├── environment.yaml         # Conda environment dependencies
└── README.md               # This file
```

## Setup Instructions

### 1. Clone the Repository
```bash
git clone --recurse-submodules <repository-url>
cd back
```

**Important**: Make sure to use `--recurse-submodules` flag to clone the viralunity submodule, or if you've already cloned without it, run:
```bash
git submodule update --init --recursive
```

### 2. Create Virtual Environment
```bash
conda create -n rt-meta python=3.11
conda activate rt-meta
```

### 3. Install Dependencies

#### 3.1. Install Main Dependencies
```bash
conda env update -n rt-meta --file environment.yml && conda clean -a -y
```

#### 3.2. Install ViralUnity Submodule Dependencies
```bash
conda env update -n rt-meta --file app/viralunity/environment.yml && conda clean -a -y
```

#### 3.3. Install ViralUnity Package in Editable Mode
**Important**: The viralunity submodule must be installed as an editable package for the application to work correctly:
```bash
cd app/viralunity
pip install -e .
cd ../..
```

### 4. Environment Configuration
Create a `.env` file in the root directory with your environment variables:

```env
# Database Configuration
DATABASE_URL=sqlite:///./rtmeta.db
DATABASE_ECHO=false

# Service Configuration
POLLING_INTERVAL=1
MAX_RETRIES=3
TASK_TIMEOUT=3600
DEFAULT_MINIMUM_READ_LENGTH=50

# API Configuration
API_TITLE=RT-Metagenomics API
API_VERSION=1.0.0
API_DESCRIPTION=API for RT-Metagenomics analysis

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE_PATH=logs/app.log
```

## Usage

### Running the Application

Make sure you have:
1. Activated the conda environment: `conda activate rt-meta`
2. Completed all setup steps, including installing the viralunity submodule
3. Created and configured your `.env` file (see step 4 above)

#### Development Mode
```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
```

#### Production Mode
```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Note**: The application must be run from the `app` directory as `main.py` is located there.

### API Documentation
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

## Configuration

The application uses a centralized configuration system with the following sections:

### Database Configuration
- `DATABASE_URL`: Database connection string
- `DATABASE_ECHO`: Enable SQL query logging

### Service Configuration
- `POLLING_INTERVAL`: Background service polling interval (seconds)
- `MAX_RETRIES`: Maximum retry attempts for failed tasks
- `TASK_TIMEOUT`: Task execution timeout (seconds)
- `DEFAULT_MINIMUM_READ_LENGTH`: Default minimum read length

### API Configuration
- `API_TITLE`: API title for documentation
- `API_VERSION`: API version
- `API_DESCRIPTION`: API description

### Logging Configuration
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `LOG_FILE_PATH`: Log file path (optional)


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
