from pydantic import BaseModel, ConfigDict, Field


class DiamondDatabasePaths(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    taxdump: str = ""
    taxids: str = ""


class ViralDatabasePaths(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    genomes: str = ""
    taxids: str = ""


class DeaconDatabasePaths(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    host_reference: str = ""
    index: str = ""


class Kraken2DatabaseConfig(BaseModel):
    name: str
    value: str
    is_default: bool = False


class DatabasePaths(BaseModel):
    krona: str = ""
    kraken2: list[Kraken2DatabaseConfig] = Field(default_factory=list)
    diamond: DiamondDatabasePaths = Field(default_factory=DiamondDatabasePaths)
    viral: ViralDatabasePaths = Field(default_factory=ViralDatabasePaths)
    deacon: DeaconDatabasePaths = Field(default_factory=DeaconDatabasePaths)


class SettingsConfig(BaseModel):
    polling_interval: int = 5
    iteration_interval: int = 10
    databases: DatabasePaths = Field(default_factory=DatabasePaths)
