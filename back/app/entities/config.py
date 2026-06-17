from entities.enum import ConfigType
from sqlmodel import Field, SQLModel

class Config(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(default=None, unique=True)
    type: ConfigType = Field(default=None)
    value: str = Field(default=None)
    is_default: bool = Field(default=False)

    def __repr__(self):
        return (
            f"Config(id={self.id}, name={self.name}, type={self.type}, "
            f"value={self.value}, is_default={self.is_default})"
        )
