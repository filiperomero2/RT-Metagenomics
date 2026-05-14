from pydantic import BaseModel, ConfigDict, Field


class ViralDatabasePaths(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    genomes: str = ""
    taxids: str = ""


class Kraken2DatabaseConfig(BaseModel):
    name: str
    value: str
    is_default: bool = False


class DatabasePaths(BaseModel):
    krona: str = ""
    taxdump: str = ""
    kraken2: list[Kraken2DatabaseConfig] = Field(default_factory=list)
    diamond: str = ""
    viral: ViralDatabasePaths = Field(default_factory=ViralDatabasePaths)
    deacon: str = ""


class SettingsConfig(BaseModel):
    polling_interval: int = 5
    iteration_interval: int = 10
    databases: DatabasePaths = Field(default_factory=DatabasePaths)
