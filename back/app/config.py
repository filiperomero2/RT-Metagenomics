import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

# Load .env file from the back directory (parent of app/)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

@dataclass
class DatabaseConfig:
    url: str = "sqlite:///./rtmeta.db"
    echo: bool = False

@dataclass
class ServiceConfig:
    # Background service settings
    polling_interval: int = 1  # seconds
    max_retries: int = 3
    task_timeout: int = 3600  # 1 hour in seconds
    iteration_interval: int = 1  # 1 minute
    
    # File processing settings
    default_minimum_read_length: int = 50
    chunk_size: int = 8192  # for file reading
    
    # Hash settings
    hash_algorithm: str = "sha256"

@dataclass
class APIConfig:
    # CORS settings
    allow_origins: list = None
    allow_credentials: bool = True
    allow_methods: list = None
    allow_headers: list = None
    
    # API settings
    title: str = "RT-Metagenomics API"
    version: str = "1.0.0"
    description: str = "API for RT-Metagenomics analysis"
    
    def __post_init__(self):
        if self.allow_origins is None:
            self.allow_origins = ["*"]
        if self.allow_methods is None:
            self.allow_methods = ["*"]
        if self.allow_headers is None:
            self.allow_headers = ["*"]

@dataclass
class LoggingConfig:
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_path: Optional[str] = None

@dataclass
class AppConfig:
    database: DatabaseConfig
    service: ServiceConfig
    api: APIConfig
    logging: LoggingConfig
    
    def __post_init__(self):
        pass

def load_config() -> AppConfig:
    """Load configuration from environment variables and defaults."""
    # Create default configs
    database_config = DatabaseConfig()
    service_config = ServiceConfig()
    api_config = APIConfig()
    logging_config = LoggingConfig()
    
    # Database configuration
    database_config.url = os.getenv("DATABASE_URL", database_config.url)
    database_config.echo = os.getenv("DATABASE_ECHO", "false").lower() == "true"
    
    # Service configuration
    service_config.polling_interval = int(os.getenv("POLLING_INTERVAL", service_config.polling_interval))
    service_config.iteration_interval = int(os.getenv("ITERATION_INTERVAL", service_config.iteration_interval))
    service_config.max_retries = int(os.getenv("MAX_RETRIES", service_config.max_retries))
    service_config.task_timeout = int(os.getenv("TASK_TIMEOUT", service_config.task_timeout))
    service_config.default_minimum_read_length = int(os.getenv("DEFAULT_MINIMUM_READ_LENGTH", service_config.default_minimum_read_length))
    
    # API configuration
    api_config.title = os.getenv("API_TITLE", api_config.title)
    api_config.version = os.getenv("API_VERSION", api_config.version)
    api_config.description = os.getenv("API_DESCRIPTION", api_config.description)
    
    # Logging configuration
    logging_config.level = os.getenv("LOG_LEVEL", logging_config.level)
    logging_config.file_path = os.getenv("LOG_FILE_PATH", logging_config.file_path)
    
    return AppConfig(
        database=database_config,
        service=service_config,
        api=api_config,
        logging=logging_config,
    )

# Global configuration instance
config = load_config() 