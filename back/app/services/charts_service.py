import logging
from typing import List

from entities.sample import Sample
import random

logger = logging.getLogger('uvicorn.error')

class ChartsService:
    def __init__(self):
        pass

    def get_random_number(self): 
        return random.randint(0, 100)

    def get_viral_datasets(self, samples: List["Sample"]):
        data = []
        
        data.append({
            "dataSetTitle": "Viral",
            "data": [self.get_random_number() for _ in samples]
        })
        
        data.append({
            "dataSetTitle": "Non-viral",
            "data": [self.get_random_number() for _ in samples]
        })
        
        return data
    

    def get_family_datasets(self, samples: List["Sample"]):
        data = []

        data.append({
            "dataSetTitle": "Coronaviridae",
            "data": [self.get_random_number() for _ in samples]
        })
        
        data.append({
            "dataSetTitle": "Pneumoviridae",
            "data": [self.get_random_number() for _ in samples]
        })
        
        data.append({
            "dataSetTitle": "Ornithoviridae",
            "data": [self.get_random_number() for _ in samples]
        })
        
        data.append({
            "dataSetTitle": "Baculoviridae",
            "data": [self.get_random_number() for _ in samples]
        })
        
        data.append({
            "dataSetTitle": "Poxviridae",
            "data": [self.get_random_number() for _ in samples]
        })
        
        data.append({
            "dataSetTitle": "Retroviridae",
            "data": [self.get_random_number() for _ in samples]
        })
        
        data.append({
            "dataSetTitle": "Steitoviridae",
            "data": [self.get_random_number() for _ in samples]
        })
        
        return data
