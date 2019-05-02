###################################################################

from traceback import print_exc as pe
import uuid

###################################################################

import utils.file

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

    def toblob(self):
        return {
            "uid": self.uid,
            "username": self.username
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
    if req.user.uid == "anonuser":
        uid = uuid.uuid1().hex
        print("creating user", uid)
        req.user.uid = uid
    if req.user.indb():
        req.user.fromdb()
        print("user in db")
    else:
        req.user.storedb()
        print("store user in db")
    return {
        "kind": "connectedack",
        "user": req.user.toblob()
    }

###################################################################

def jsonapi(reqobj):
    req = Req(reqobj)
    print(f"jsonapi < {req} >")
    try:
        resobj = eval(f"{req.kind}(req)")
    except:
        pe()
        resobj = {
            "kind": "unknownapirequest"
        }    
    return req.res(resobj)

###################################################################
