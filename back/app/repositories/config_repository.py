from sqlmodel import Session, select
from entities.config import Config
from entities.enum import ConfigType
from typing import List

class ConfigRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def list_config(self, type: ConfigType | None) -> List[Config]:
        stmt = select(Config)
        if type:
            stmt = stmt.where(Config.type == type)
        stmt = stmt.order_by(Config.id.desc())
        return self.session.exec(stmt).fetchall()

    def get_config(self, id: int) -> Config:
        stmt = select(Config).where(Config.id == id)
        return self.session.exec(stmt).first()

    def find_and_remove(self, name: str) -> Config:
        stmt = select(Config).where(Config.name == name)
        config = self.session.exec(stmt).first()
        if config:
            self.session.delete(config)
            self.session.commit()
        return config
    
    def save_config(self, config: Config) -> Config:
        self.find_and_remove(config.name)
        self.session.add(config)
        self.session.commit()
        return config