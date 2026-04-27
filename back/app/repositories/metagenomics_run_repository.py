from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from entities.run import Run
from entities.enum import RunState
from typing import Optional, List
from config import config
import datetime


class MetagenomicsRunRepository:
    def __init__(self, session: Session):
        self.session = session

    def _run_options(self):
        return (
            selectinload(Run.samples),
            selectinload(Run.parameters),
        )

    def get_pending_run(self) -> Optional[Run]:
        """Get the first pending run (used in ViralUnityService)"""
        stmt = (
            select(Run)
            .options(*self._run_options())
            .where(Run.state == RunState.PENDING)
            .where(Run.next_scheduled_run_at <= datetime.datetime.now())
            .order_by(Run.next_scheduled_run_at.desc())
            .limit(1)
        )
        db_result = self.session.exec(stmt).first()
        if db_result:
            return db_result
        return None

    def get_run(self, run_id: int) -> Optional[Run]:
        """Get run with its parameters (used in GetMetagenomicsResultUseCase)"""
        stmt = (
            select(Run)
            .options(*self._run_options())
            .where(Run.id == run_id)
        )
        return self.session.exec(stmt).first()

    def get_all_runs(self) -> List[Run]:
        """Get all runs with their parameters (used in ListMetagenomicsUseCase)"""
        stmt = select(Run).options(*self._run_options())
        return self.session.exec(stmt).fetchall()

    def save_run(self, run: Run) -> Run:
        """Save a run"""
        now = datetime.datetime.now()
        run.updatedAt = now
        # Ensure newly created/reset runs start immediately.
        if run.iteration == 0:
            run.next_scheduled_run_at = now
        else:
            run.next_scheduled_run_at = now + datetime.timedelta(
                seconds=config.service.iteration_interval
            )
        self.session.add(run)
        self.session.commit()
        self.session.refresh(run)
        return run
