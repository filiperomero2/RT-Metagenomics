from sqlmodel import Session, select
from entities.run import Run
from entities.run_parameters import RunParameters
from entities.enum import RunState
from typing import Optional, List, Tuple

class MetagenomicsRepository:
    def __init__(self, session: Session):
        self.session = session
    
    def get_pending_run(self) -> Optional[Run]:
        """Get the first pending run (used in ViralUnityService)"""
        stmt = select(Run).where(Run.state == RunState.PENDING).limit(1)
        return self.session.exec(stmt).first()
    
    def get_run_parameters_by_id(self, parameters_id: int) -> Optional[RunParameters]:
        """Get run parameters by ID (used in ViralUnityService)"""
        stmt = select(RunParameters).where(RunParameters.id == parameters_id).limit(1)
        return self.session.exec(stmt).first()
    
    def get_run_with_parameters(self, run_id: int) -> Optional[Tuple[Run, RunParameters]]:
        """Get run with its parameters (used in GetMetagenomicsResultUseCase)"""
        stmt = select(Run, RunParameters).join(RunParameters).where(Run.id == run_id)
        return self.session.exec(stmt).first()
    
    def get_all_runs_with_parameters(self) -> List[Tuple[Run, RunParameters]]:
        """Get all runs with their parameters (used in ListMetagenomicsUseCase)"""
        stmt = select(Run, RunParameters).where(Run.parametersId == RunParameters.id)
        return list(self.session.exec(stmt))
    
    def save_run(self, run: Run) -> Run:
        """Save a run (used in ViralUnityService)"""
        self.session.add(run)
        self.session.commit()
        self.session.refresh(run)
        return run
    
    def save_run_parameters(self, parameters: RunParameters) -> RunParameters:
        """Save run parameters (used in ViralUnityService)"""
        self.session.add(parameters)
        self.session.commit()
        self.session.refresh(parameters)
        return parameters 