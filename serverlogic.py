###################################################################

from traceback import print_exc as pe
import uuid
import time

###################################################################

import utils.file

###################################################################

SERVERLOGIC_VERBOSE = True

###################################################################

class FirestoreDb(utils.file.Db):
    def __init__(self):
        super(FirestoreDb, self).__init__()

db = FirestoreDb()

###################################################################

class User():
    def __init__(self, blob = {}):
        if not blob:
            blob = {}
        self.fromblob(blob)

    def fromblob(self, blob):
        self.uid = blob.get("uid", "anonuser")
        self.username = blob.get("username", "Anonymous")
        self.createdat = blob.get("createdat", time.time())
        self.verifiedat = blob.get("verifiedat", None)
        self.lastactiveat = blob.get("lastactiveat", time.time())

    def toblob(self):
        return {
            "uid": self.uid,
            "username": self.username,
            "createdat": self.createdat,
            "verifiedat": self.verifiedat,
            "lastactiveat": self.lastactiveat
        }

    def dbpath(self):
        return "users/" + self.uid

    def fromdb(self):
        self.fromblob(db.getpath(self.dbpath()))

    def storedb(self):
        db.setdoc(self.dbpath(), self.toblob())

    def indb(self):
        return db.pathexists(self.dbpath())

    def __repr__(self):
        return f"< user [ {self.uid} {self.username} ] >"

###################################################################

class Req():
    def __init__(self, reqobj):
        self.reqobj = reqobj
        self.kind = reqobj.get("kind", "dummy")
        self.userblob = reqobj.get("user", {})
        self.user = User(self.userblob)        

        if SERVERLOGIC_VERBOSE:
            print(self)

        if self.user.uid == "anonuser":            
            uid = uuid.uuid1().hex            
            self.user.uid = uid
            self.user.createdat = time.time()
            if SERVERLOGIC_VERBOSE:
                print("anonuser in request, creating new user", uid)
        if self.user.indb():
            self.user.fromdb()
            if SERVERLOGIC_VERBOSE:
                print("user found in db")        
        self.user.lastactiveat = time.time()
        self.user.storedb()        

    def res(self, resobj):
        if not ("user" in resobj):
            resobj["user"] = self.user.toblob()
        return resobj

    def __repr__(self):
        return f"< request [ {self.kind} {self.user} ] >"

###################################################################

###################################################################
# json api handlers

def dummy(req):
    return {
        "kind": "dummydone"
    }

def connected(req):        
    return {
        "kind": "connectedack"        
    }

###################################################################

def jsonapi(reqobj):
    req = Req(reqobj)
    try:
        resobj = eval(f"{req.kind}(req)")
    except:
        pe()
        resobj = {
            "kind": "unknownapirequest"
        }    
    return req.res(resobj)

###################################################################
