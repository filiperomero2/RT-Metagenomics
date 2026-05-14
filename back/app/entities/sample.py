from sqlmodel import Field, SQLModel, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from entities.run import Run

class Sample(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    sampleLib: str = Field(default=None)
    name: str = Field(default=None)
    isNegativeControl: bool = Field(default=False)
    runId: int = Field(default=None, foreign_key="run.id")
    run: "Run" = Relationship(back_populates="samples")
    
    def dict(self):	
        return {
            "id": self.id,
            "name": self.name,
            "runId": self.runId,
            "isNegativeControl": self.isNegativeControl,
        }
    
    
    def __repr__(self):
        return f"Sample(id={self.id}, name={self.name}, runId={self.runId})"