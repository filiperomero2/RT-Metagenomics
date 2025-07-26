from sqlmodel import Session, select
from entities.sample import Sample
from entities.run import Run
from entities.run_parameters import RunParameters
from entities.enum import RunState
from typing import Optional, List, Tuple

class MetagenomicsRunRepository:
    def __init__(self, session: Session):
        self.session = session
        
    
    def get_pending_run(self) -> Optional[Run]:
        """Get the first pending run (used in ViralUnityService)"""
        stmt = select(Run).where(Run.state == RunState.PENDING).limit(1)
        dbResult = self.session.exec(stmt).first()
        if dbResult:
            return dbResult
        return None
    
    def get_run(self, run_id: int) -> Optional[Run]:
        """Get run with its parameters (used in GetMetagenomicsResultUseCase)"""
        stmt = select(Run).where(Run.id == run_id)
        return self.session.exec(stmt).first()
    
    def get_all_runs(self) -> List[Run]:
        """Get all runs with their parameters (used in ListMetagenomicsUseCase)"""
        stmt = select(Run)
        return self.session.exec(stmt).fetchall()
       
    def save_run(self, run: Run) -> Run:
        """Save a run"""
        self.session.add(run)
        self.session.commit()
        self.session.refresh(run)
        return run
