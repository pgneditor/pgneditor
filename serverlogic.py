###################################################################

from traceback import print_exc as pe
import uuid
import time
import os

###################################################################

import utils.file
from utils.logger import log
from utils.http import geturl
from utils.study import Study, DEFAULT_MAX_PLIES
from utils.cryptography import encryptalphanum, decryptalphanum

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

PRIVILEGES = [
    "admin",
    "analyze"
]

class User():
    def __init__(self, blob = {}):
        if not blob:
            blob = {}
        self.fromblob(blob)

    def canbasic(self, privilege):
        envname = "CAN" +  privilege.upper()
        if envname in os.environ:
            canstr = os.environ[envname]
            canlist = canstr.split(",")
            if self.uid in canlist:
                return True
        return False

    def can(self, privilege):
        if self.canbasic("admin"):
            return True
        return self.canbasic(privilege)

    def fromblob(self, blob):
        self.uid = blob.get("uid", "anonuser")
        self.code = encryptalphanum(self.uid)
        self.username = blob.get("username", "Anonymous")
        self.createdat = blob.get("createdat", time.time())
        self.verifiedat = blob.get("verifiedat", None)
        self.lastactiveat = blob.get("lastactiveat", time.time())
        self.verification = blob.get("verification", None)
        self.privileges = {}
        for privilege in PRIVILEGES:
            self.privileges[privilege] = self.can(privilege)

    def toblob(self):
        return {
            "uid": self.uid,
            "code": self.code,
            "username": self.username,
            "createdat": self.createdat,
            "verifiedat": self.verifiedat,
            "lastactiveat": self.lastactiveat,
            "verification": self.verification,
            "privileges": self.privileges
        }

    def dbpath(self):
        return "users/" + self.uid

    def fromdb(self):
        self.fromblob(db.getpath(self.dbpath()))

    def storedb(self):
        db.setdoc(self.dbpath(), self.toblob())

    def indb(self):
        return db.getpath(self.dbpath())

    def __repr__(self):
        return f"< user [ {self.uid} | {self.username} | admin : {self.can('admin')} ] >"

###################################################################

class Req():
    def __init__(self, reqobj):
        self.reqobj = reqobj
        self.queryparams = reqobj.get("queryparams", {})
        self.task = self.queryparams.get("task", None)
        self.kind = reqobj.get("kind", "dummy")
        self.userblob = reqobj.get("user", {})
        self.user = User(self.userblob)       
        self.verifyusername = reqobj.get("verifyusername", None)
        self.title = reqobj.get("title", None)
        self.variantkey = reqobj.get("variantkey", "standard")
        self.id = reqobj.get("id", None)
        self.nodeid = reqobj.get("nodeid", None)
        self.algeb = reqobj.get("algeb", None)
        self.pgn = reqobj.get("pgn", None)
        self.moves = reqobj.get("moves", None)
        self.drawings = reqobj.get("drawings", None)
        self.message = reqobj.get("message", None)
        self.nags = reqobj.get("nags", None)
        self.duration = reqobj.get("duration", None)
        self.weightkind = reqobj.get("weightkind", "me")
        self.weight = reqobj.get("weight", 0)
        self.maxplies = reqobj.get("maxplies", DEFAULT_MAX_PLIES)

        if SERVERLOGIC_VERBOSE:
            log(self, "warning")

        if not db.getpath("users/" + self.user.uid):    
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

    def res(self, resobj):
        if not ("user" in resobj):
            resobj["user"] = self.user.toblob()
        return resobj

    def __repr__(self):
        return f"< request [ {self.kind} | {self.queryparams} | {self.user} ] >"

###################################################################

###################################################################
# json api handlers

def dummy(req):
    return {
        "kind": "dummydone"
    }

def connected(req):        
    if req.task == "importstudy":
        importstudy(req)
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

def unselectstudies(req, selectid = None, nodeid = None):
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
                log(f"< selecting study < {id} | {nodeid} > >", "info")
            study.selected = True
            if nodeid:
                study.selectnodebyid(nodeid)
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

def clonestudy(req):    
    log(f"< cloning study < {req.id} > >", "info")
    study = getstudy(req)
    if not study:
        return {
            "kind": "clonestudyfailed",
            "status": "no such study"
        }
    study.id = createuuid()
    study.createdat = time.time()
    req.id = study.id
    storestudy(req, study)
    unselectstudies(req, selectid = req.id)
    if SERVERLOGIC_VERBOSE:
        log(f"< cloned study < {req.id} > >", "success")
    return {
        "kind": "studycloned"
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

def selectstudy(req, nodeid = None):
    unselectstudies(req, selectid = req.id, nodeid = nodeid)
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

def setcurrentnode(req):
    log(f"< setting current node < {req.id} | {req.nodeid} > >", "info")
    study = getstudy(req)
    if study.selectnodebyid(req.nodeid):
        storestudy(req, study)
        return {
            "kind": "currentnodeset",
            "currentnodeid": study.currentnodeid
        }
    else:
        return {
            "kind": "setcurrentnodefailed",
            "nodeid": req.nodeid
        }

def parsepgn(req):
    log(f"< parsing pgn < {req.id} | {req.pgn} > >", "info")
    study = getstudy(req)
    study.parsepgn(req.pgn)
    storestudy(req, study)
    return {
        "kind": "pgnparsed",
        "setstudy": study.toblob(nodelist = True)
    }

def mergemoves(req):
    log(f"< merging moves < {req.id} | {req.maxplies} | {req.moves} > >", "info")
    study = getstudy(req)
    study.mergemoves(req.moves, req.maxplies)
    storestudy(req, study)
    return {
        "kind": "movesmerged",
        "setstudy": study.toblob(nodelist = True)
    }

def setdrawings(req):
    log(f"< setting drawings < {req.id} | {req.drawings} > >", "info")
    study = getstudy(req)
    study.setdrawings(req.drawings)
    storestudy(req, study)
    return {
        "kind": "drawingsset",
        "pgn": study.reportpgn()
    }

def savemessage(req):
    log(f"< save message < {req.id} | {req.nodeid} | {req.message} > >", "info")
    study = getstudy(req)
    if study.setmessage(req.nodeid, req.message):
        storestudy(req, study)
        return {
            "kind": "messagesaved",
            "message": req.message,
            "pgn": study.reportpgn()
        }
    else:
        return {
            "kind": "messagesavefailed"
        }

def savenags(req):
    log(f"< save nags < {req.id} | {req.nodeid} | {req.nags} > >", "info")
    study = getstudy(req)
    if study.setnags(req.nodeid, req.nags):
        storestudy(req, study)
        return {
            "kind": "nagssaved",
            "nags": req.nags,
            "pgn": study.reportpgn()
        }
    else:
        return {
            "kind": "nagssavefailed"
        }

def settrainweight(req):
    log(f"< set train weight < {req.id} | {req.nodeid} | {req.weightkind} | {req.weight} > >", "info")
    study = getstudy(req)
    if study.settrainweight(req.nodeid, req.weightkind, req.weight):
        storestudy(req, study)
        return {
            "kind": "trainweightset",
            "weightkind": req.weightkind,
            "weight": req.weight,
            "pgn": study.reportpgn()
        }
    else:
        return {
            "kind": "settrainweightfailed"
        }

def saveduration(req):
    log(f"< save duration < {req.id} | {req.nodeid} | {req.duration} > >", "info")
    study = getstudy(req)
    if study.setduration(req.nodeid, req.duration):
        storestudy(req, study)
        return {
            "kind": "durationsaved",
            "duration": req.duration
        }
    else:
        return {
            "kind": "durationsavefailed"
        }

def flipstudy(req):
    log(f"< flipping < {req.id} > >", "info")
    study = getstudy(req)
    study.setflip(not study.flip)
    storestudy(req, study)
    return {
        "kind": "studyflipped",
        "setstudy": study.toblob(nodelist = True)
    }

def reset(req):
    log(f"< reset < {req.id} > >", "info")
    study = getstudy(req)
    study.reset()
    storestudy(req, study)
    return {
        "kind": "resetdone",
        "setstudy": study.toblob(nodelist = True)
    }

def selectnodebyid(req):
    log(f"< selecting node by id < {req.id} | {req.nodeid} > >", "info")
    study = getstudy(req)
    study.selectnodebyid(req.nodeid)
    storestudy(req, study)
    return {
        "kind": "nodeselectedbyid",
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

def importstudy(req):
    usercode = req.queryparams["usercode"]
    studyid = req.queryparams["studyid"]
    nodeid = req.queryparams["nodeid"]
    uid = decryptalphanum(usercode)
    log(f"< importing study < {usercode} | {uid} | {studyid} | {nodeid} > >", "info")    
    userpath = "users/" + uid
    if not db.getpath(userpath):
        log(f"< import user does not exist < {uid} > >", "error")
        return
    studypath = userpath + "/studies/" + studyid
    studyblob = db.getpath(studypath)
    if not studyblob:
        log(f"< import study does not exist < {studyid} > >", "error")
        return
    if uid == req.user.uid:
        log(f"< importing own study < {uid} | {nodeid} > >", "warning")    
        req.id = studyid
        selectstudy(req, nodeid = nodeid)
        return
    log(f"< importing study < {studyid} | {nodeid} > >", "info")    
    study = Study(studyblob)
    req.id = studyid
    storestudy(req, study)
    selectstudy(req, nodeid = nodeid)

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
