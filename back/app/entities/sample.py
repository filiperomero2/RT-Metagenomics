from back.app.entities.run import Run
from sqlmodel import Field, SQLModel, Relationship

class Sample(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(default=None)
    runId: int = Field(default=None, foreign_key="run.id")
    run: Run = Relationship(back_populates="samples")