###################################################################

from traceback import print_exc as pe
import uuid
import time

###################################################################

import utils.file
from utils.logger import log
from utils.http import geturl
from utils.study import Study

###################################################################

SERVERLOGIC_VERBOSE = True

###################################################################

def createuuid():
    return uuid.uuid1().hex

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
        self.title = reqobj.get("title", None)
        self.variantkey = reqobj.get("variantkey", "standard")
        self.id = reqobj.get("id", None)
        self.algeb = reqobj.get("algeb", None)

        if SERVERLOGIC_VERBOSE:
            log(self, "warning")

        if not db.pathexists("users/" + self.user.uid):    
            self.user = User()        
            uid = createuuid()
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

    def studiespath(self):
        return "users/" + self.user.uid + "/studies"

    def studypath(self, study):
        return self.studiespath() + "/" + study.id

###################################################################

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
        "code": createuuid()
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

def getstudies(req):
    if not db.getpath(req.studiespath()):
        log("< no studies, creating default >", "warning")
        defaultstudy = Study({
            "selected": True
        })
        db.setdoc(req.studypath(defaultstudy), defaultstudy.toblob(nodelist = True))
    studies = db.getpath(req.studiespath())
    studiesblob = {}
    for id, studyblob in studies.items():
        study = Study(studyblob)
        studiesblob[id] = study.toblob(nodelist = study.selected)
    return {
        "kind": "setstudies",
        "studies": studiesblob
    }

def unselectstudies(req, selectid = None):
    studies = db.getpath(req.studiespath())
    if not studies:
        return
    for id, studyblob in studies.items():        
        study = Study(studyblob)        
        if study.selected:
            if SERVERLOGIC_VERBOSE:
                log(f"< unselecting study < {id} > >", "info")
            study.selected = False
            storestudy(req, study)
        if selectid == id:
            if SERVERLOGIC_VERBOSE:
                log(f"< selecting study < {id} > >", "info")
            study.selected = True
            storestudy(req, study)

def createstudy(req):
    id = createuuid()
    study = Study({
        "title": req.title,
        "variantkey": req.variantkey,
        "id": id,
        "selected": True
    })
    unselectstudies(req)
    storestudy(req, study)
    if SERVERLOGIC_VERBOSE:
        log(f"< created study < {req.title} | {id} > >", "success")
    return {
        "kind": "studycreated"
    }

def deletestudy(req):
    if req.id == "default":
        return {
            "kind": "studydeletefailed",
            "status": "default study cannot be deleted",
            "alert": {
                "msg": "The default study cannot be deleted !",
                "kind": "error"
            }
        }
    unselectstudies(req, selectid = "default")
    study = Study({"id": req.id})
    db.deletedoc(req.studypath(study))
    return {
        "kind": "studydeleted"
    }

def getstudy(req):
    study = Study({"id": req.id})
    blob = db.getpath(req.studypath(study))
    if not blob:
        return None
    study = Study(blob)
    return study

def storestudy(req, study):
    db.setdoc(req.studypath(study), study.toblob(nodelist = True))

def editstudytitle(req):
    if req.id == "default":
        return {
            "kind": "editstudytitlefailed",
            "status": "default study's title cannot be edited",
            "alert": {
                "msg": "The default study's title cannot be edited !",
                "kind": "error"
            }
        }
    study = getstudy(req)
    if not study:
        return {
            "kind": "editstudytitlefailed",
            "status": "fatal no such study",
            "alert": {
                "msg": "The default study's title cannot be edited !",
                "kind": "error"
            }
        }
    study.title = req.title
    storestudy(req, study)
    return {
        "kind": "studytitleedited"
    }

def selectstudy(req):
    unselectstudies(req, selectid = req.id)
    return {
        "kind": "studyselected"
    }

def makealgebmove(req):
    log(f"< making algeb move < {req.algeb} | {req.id} > >", "info")
    study = getstudy(req)
    study.makealgebmove(req.algeb)
    storestudy(req, study)
    return {
        "kind": "algebmovemade",
        "setstudy": study.toblob(nodelist = True)
    }

def back(req):
    log(f"< back < {req.id} > >", "info")
    study = getstudy(req)
    study.back()
    storestudy(req, study)
    return {
        "kind": "backdone",
        "setstudy": study.toblob(nodelist = True)
    }

def delete(req):
    log(f"< deleted < {req.id} > >", "info")
    study = getstudy(req)
    study.delete()
    storestudy(req, study)
    return {
        "kind": "deletedone",
        "setstudy": study.toblob(nodelist = True)
    }

def tobegin(req):
    log(f"< tobegin < {req.id} > >", "info")
    study = getstudy(req)
    study.tobegin()
    storestudy(req, study)
    return {
        "kind": "tobegindone",
        "setstudy": study.toblob(nodelist = True)
    }

def forward(req):
    log(f"< forward < {req.id} > >", "info")
    study = getstudy(req)
    study.forward()
    storestudy(req, study)
    return {
        "kind": "forwarddone",
        "setstudy": study.toblob(nodelist = True)
    }

def toend(req):
    log(f"< toend < {req.id} > >", "info")
    study = getstudy(req)
    study.toend()
    storestudy(req, study)
    return {
        "kind": "toenddone",
        "setstudy": study.toblob(nodelist = True)
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
