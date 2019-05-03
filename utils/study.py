###################################################################

import time

###################################################################

class Study:
    def __init__(self, blob = {}):
        self.fromblob(blob)

    def fromblob(self, blob):
        self.id = blob.get("id", "default")
        self.title = blob.get("title", "Default study")
        self.createdat = blob.get("createdat", time.time())
        self.selected = blob.get("selected", False)
    
    def toblob(self):
        return {
            "id": self.id,
            "title": self.title,
            "createdat": self.createdat,
            "selected": self.selected
        }

###################################################################