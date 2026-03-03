from sqlmodel import Field, SQLModel
from entities.enum import ConfigType

class Config(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(default=None, unique=True)
    type: ConfigType = Field(default=None)
    value: str = Field(default=None)

    def __repr__(self):
        return f"Config(id={self.id}, name={self.name}, type={self.type}, value={self.value})"