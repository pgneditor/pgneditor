###################################################################

import utils.config as config
import utils.ansi as ansi
from uuid import uuid1
import time
from queue import Queue
from threading import Thread
from tornadose.stores import QueueStore
import json
import asyncio

###################################################################

def log(msg, kind = "normal", prompt = "-->"):
    msg = str(msg)
    if config.IS_DEV():
        if kind == "error":
            msg = ansi.brightred(msg)
        elif kind == "info":
            msg = ansi.brightwhite(msg)
        elif kind == "warning":
            msg = ansi.brightyellow(msg)
        elif kind == "success":
            msg = ansi.brightgreen(msg)
        prompt = ansi.brightmagenta(prompt)
    print(prompt, msg)    

###################################################################

class SystemLogItem:
    def __init__(self, blob = {}):
        self.fromblob(blob)

    def fromblob(self, blob = {}):
        self.id = uuid1().hex
        self.time = time.time()
        self.dir = blob.get("dir", "out")
        self.kind = blob.get("kind", "normal")
        self.owner = blob.get("owner", None)
        self.msg = blob.get("msg", None)
        self.blob = blob.get("blob", None)

    def toblob(self):
        return {
            "id": self.id,
            "time": self.time,
            "dir": self.dir,
            "kind": self.kind,
            "owner": self.owner,
            "msg": self.msg,
            "blob": self.blob
        }

    def __repr__(self):
        return f"< logitem < {self.owner} | {self.time} | {self.id} | {self.msg} > >"

class SystemLog:
    def __init__(self, maxsize = 1000):
        self.maxsize = maxsize
        self.buffer = []
        self.q = Queue()
        self.datastore = QueueStore()
        Thread(target = self.readqueuetarget).start()

    def readqueuetarget(self):
        #https://stackoverflow.com/questions/51038793/error-happen-python3-6-while-using-tornado-in-multi-threading
        asyncio.set_event_loop(asyncio.new_event_loop())
        while True:
            li = self.q.get()
            self.buffer.append(li)
            message = json.dumps(li.toblob())
            self.datastore.submit(message)                                    
            while len(self.buffer) > self.maxsize:
                self.buffer = self.buffer[1:]

    def log(self, li):        
        self.q.put(li)

    def __repr__(self):
        return f"< systemlog < {len(self.buffer)} | {self.buffer[-50:]} > >"

###################################################################
