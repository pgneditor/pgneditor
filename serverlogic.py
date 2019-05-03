###################################################################

from traceback import print_exc as pe
import uuid
import time

###################################################################

import utils.file
from utils.logger import log
from utils.http import geturl

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
        self.verification = blob.get("verification", None)

    def toblob(self):
        return {
            "uid": self.uid,
            "username": self.username,
            "createdat": self.createdat,
            "verifiedat": self.verifiedat,
            "lastactiveat": self.lastactiveat,
            "verification": self.verification
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
        self.verifyusername = reqobj.get("verifyusername", None)

        if SERVERLOGIC_VERBOSE:
            log(self, "warning")

        if not db.pathexists("users/" + self.user.uid):    
            self.user = User()        
            uid = uuid.uuid1().hex            
            self.user.uid = uid
            self.user.createdat = time.time()
            if SERVERLOGIC_VERBOSE:
                log(f"< anonuser in request, creating new user < {uid} > >", "error")
        if self.user.indb():
            self.user.fromdb()
            if SERVERLOGIC_VERBOSE:
                log("< user found in db >", "success")        
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

def login(req):
    req.user.verification = {
        "username": req.verifyusername,
        "code": uuid.uuid1().hex
    }
    req.user.storedb()
    return {
        "kind": "login"        
    }

def verify(req):    
    username = req.user.verification["username"]
    code = req.user.verification["code"]
    if SERVERLOGIC_VERBOSE:
        log(f"< verifying user < {username} > code < {code} > >", "info")
    try:
        content = geturl("https://lichess.org/@/" + username)
        if SERVERLOGIC_VERBOSE:
            log(f"< received content < {len(content)} characters > >", "info")
        if code in content:
            if SERVERLOGIC_VERBOSE:
                log(f"< code found in content >", "success")
            req.user.username = username
            req.user.verifiedat = time.time()
            req.user.verification = None    
            allusers = db.getpath("users")
            for id, userblob in allusers.items():
                if userblob["username"] == username:
                    newuid = userblob["uid"]
                    if SERVERLOGIC_VERBOSE:
                        log(f"< user already exists, changing uid to < {newuid} > >", "warning")
                    req.user.uid = newuid
                    break
            req.user.storedb()
            return {
                "kind": "verified"        
            }
    except:
        pe()
        if SERVERLOGIC_VERBOSE:
            log(f"< there was a problem verifying user >", "error")
    if SERVERLOGIC_VERBOSE:
        log(f"< verification failed >", "error")
    return {
        "kind": "verificationfailed",
        "alert": {
            "msg": "Verification failed !",
            "kind": "error"
        }
    }

def cancelverification(req):    
    req.user.verification = None
    req.user.storedb()
    return {
        "kind": "verificationcanceled"        
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
