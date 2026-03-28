from pydantic import BaseModel, ConfigDict, Field


class DiamondDatabasePaths(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    taxdump: str = ""
    assembly_summary: str = Field(default="", alias="assembly-summary")
    taxid_to_family: str = Field(default="", alias="taxid-to-family")


class DatabasePaths(BaseModel):
    krona: str = ""
    kraken2: str = ""
    diamond: DiamondDatabasePaths = Field(default_factory=DiamondDatabasePaths)


class SettingsConfig(BaseModel):
    polling_interval: int = 5
    iteration_interval: int = 10
    databases: DatabasePaths = Field(default_factory=DatabasePaths)
