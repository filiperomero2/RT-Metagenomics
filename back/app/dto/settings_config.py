from pydantic import BaseModel, Field


class Kraken2DatabaseConfig(BaseModel):
    name: str
    value: str
    is_default: bool = False


class DatabasePaths(BaseModel):
    krona: str = ""
    taxdump: str = ""
    kraken2: list[Kraken2DatabaseConfig] = Field(default_factory=list)
    diamond: str = ""
    diamond_taxids: str = ""
    deacon: str = ""


class SettingsConfig(BaseModel):
    polling_interval: int = 5
    iteration_interval: int = 10
    databases: DatabasePaths = Field(default_factory=DatabasePaths)
