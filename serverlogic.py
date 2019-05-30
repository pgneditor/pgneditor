###################################################################

from traceback import print_exc as pe
import uuid
import time
import os
from threading import Thread
import requests
import json
import chess

###################################################################

import utils.file
from utils.logger import log
from utils.http import geturl
from utils.study import Study, DEFAULT_MAX_PLIES, Book, BookMove, BookPosition, LichessGame, getvariantboard, get_zobrist_key_hex
from utils.cryptography import encryptalphanum, decryptalphanum
from utils.file import read_json_from_fdb, write_json_to_fdb, delfdb
from config import SERVER_URL, KEEP_ALIVE, IS_PROD

###################################################################

SERVERLOGIC_VERBOSE = True

SCAN_PLAYER_LIST = os.environ.get("SCANPLAYERS", "jwaceking,Wolfram_EP,letzplaykrazy,HigherBrainPattern,Natso,sutcunuri,kreedz,Xeransis,Illion")
SCAN_PLAYER_LIST += os.environ.get("EXTRAPLAYERS", "")

MAX_BOOK_GAMES = int(os.environ.get("MAXBOOKGAMES", 500))

PRE_MIN_PLIES = int(os.environ.get("PREMINPLIES", 10))
MAX_BOOK_PLIES = int(os.environ.get("MAXBOOKPLIES", 30))

PRE_FILTER_VERSION = int(os.environ.get("PREFILTERVERION", 1))
BOOK_FILTER_VERSION = int(os.environ.get("BOOKFILTERVERION", 2))

MAX_DOWNLOAD_GAMES = int(os.environ.get("MAXDOWNLOADGAMES", 100))

PRE_MIN_RATING = int(os.environ.get("PREMINRATING", 2200))
BOOK_MIN_RATING = int(os.environ.get("BOOKMINRATING", 2200))

MAX_NDJSON_SIZE = int(os.environ.get("MAXNDJSONSIZE", 1000))

BUILD_BOOK_DELAY = int(os.environ.get("BUILDBOOKDELAY", 6 * 3600))

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
        self.ignorecomments = reqobj.get("ignorecomments", False)
        self.ignoredrawings = reqobj.get("ignoredrawings", False)
        self.ignoretrainweights = reqobj.get("ignoretrainweights", False)
        self.success = reqobj.get("success", 0)
        self.player = reqobj.get("player", None)

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
        "kind": "connectedack",
        "players": SCAN_PLAYER_LIST.split(",")
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
    log(f"< merging moves < {req.id} | max plies {req.maxplies} | ignore comments {req.ignorecomments} | ignore drawings {req.ignoredrawings} | ignore trainweights {req.ignoretrainweights} | moves {req.moves} > >", "info")
    study = getstudy(req)
    study.mergemoves(req.moves, req.maxplies, ignorecomments = req.ignorecomments, ignoredrawings = req.ignoredrawings, ignoretrainweights = req.ignoretrainweights)
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

def setsuccess(req):
    log(f"< setting success < {req.id} | {req.nodeid} | {req.success} > >", "info")
    study = getstudy(req)
    if study.setsuccess(req.nodeid, req.success):
        storestudy(req, study)
        return {
            "kind": "successset",
            "success": req.success
        }
    else:
        return {
            "kind": "setsuccessfailed"
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

TOKEN = "L8GHblP1Wc57Oegi"

def ndjsonpath(player):
    return f"{player}_ndjson"

def nowms():
    return int(time.time() * 1000)

def gameexporturl(player, since = 0, until = None, max = MAX_DOWNLOAD_GAMES):
    if not until:
        until = nowms()
    return f"https://lichess.org//api/games/user/{player}?variant=atomic&max={max}&since={since}&until={until}"

def prefilterok(g):        
    if not g.perf == "atomic":
        return False
    if ( g.white.rating < PRE_MIN_RATING ) or ( g.black.rating < PRE_MIN_RATING ):
        return False
    if g.playeropp.ailevel or ( g.playeropp.title == "BOT" ):
        return False
    if len(g.moves) < PRE_MIN_PLIES:
        return False
    if not g.rated:
        return False
    return True

def rationalizeplayerdata(ndjson):
    print("rationalizing player data", len(ndjson))
    ids = {}
    filtered = []
    for obj in ndjson:
        if ( "id" in obj ) and ( "lastMoveAt" in obj ) and ( "createdAt" in obj ):
            id = obj["id"]
            if not id in ids:
                ids[id] = True
                filtered.append(obj)
            else:
                print("duplicate id", id)
    filtered.sort(key = lambda x: x["lastMoveAt"], reverse = True)
    if len(filtered) > MAX_NDJSON_SIZE:
        filtered = filtered[:MAX_NDJSON_SIZE]
    print("rationalized player data", len(filtered))
    return filtered

def exportgames(kind, playerndjson):
    print("export", kind, playerndjson)
    if ( kind == "old" ) and ( len(playerndjson.ndjson) >= MAX_NDJSON_SIZE ):
        print("cache full, not exporting")
        return
    since = playerndjson.since
    until = playerndjson.until
    max = MAX_DOWNLOAD_GAMES
    if kind == "new":
        until = nowms()
        if playerndjson.since > 0:
            max = 10 * max
    if kind == "old":
        since = 0
        until = playerndjson.until
    print("exporting", since, until, max)
    r = requests.get(gameexporturl(playerndjson.player, since = since, until = until, max = max), headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/x-ndjson"
    }, stream = True)                        
    cnt = 0
    found = 0
    start = time.time()
    for line in r.iter_lines():
        try:
            line = line.decode("utf-8")                    
            obj = json.loads(line)                    
            cnt += 1
            if ( "createdAt" in obj ) and ( "lastMoveAt" in obj ):
                createdat = obj["createdAt"]                
                if createdat < playerndjson.until:
                    playerndjson.until = createdat
                g = LichessGame(obj, playerndjson.player)
                if(prefilterok(g)):
                    playerndjson.ndjson.append(obj)
                    found += 1
                if g.lastmoveat > playerndjson.since:
                    playerndjson.since = g.lastmoveat
                if ( cnt % 20 ) == 0:
                    print("read cnt", cnt, "found", found, "rate", cnt / (time.time() - start))
        except:
            pe()                                
    if found > 0:
        print("writing player", playerndjson.player)
        playerndjson.ndjson = rationalizeplayerdata(playerndjson.ndjson)                
    else:
        print("up to date", playerndjson.player)
    playerndjson.storedb()

def bookfilterok(g):
    return ( g.white.rating >= BOOK_MIN_RATING ) and ( g.black.rating >= BOOK_MIN_RATING )

def bookpath(player):
    return f"{player}_book"

class PlayerNdjson:
    def __init__(self, player, blob = {}):
        self.fromblob(player, blob)

    def fromblob(self, player, blob = {}):
        self.player = player
        self.filterversion = blob.get("filterversion", 0)
        self.ndjson = blob.get("ndjson", [])
        self.since = blob.get("since", 0)
        self.until = blob.get("until", nowms())

    def fromdb(self):
        blob = read_json_from_fdb(ndjsonpath(self.player), {})    
        self.fromblob(self.player, blob)
        return self

    def toblob(self):
        return {
            "player": self.player,
            "filterversion": self.filterversion,
            "since": self.since,
            "until": self.until,
            "ndjson": self.ndjson
        }

    def storedb(self):
        print("storing ndjson", self)
        write_json_to_fdb(ndjsonpath(self.player), self.toblob())    
        return self

    def __repr__(self):
        return f"< player ndjson < {self.player} since {self.since} until {self.until} size {len(self.ndjson)} > >"

def buildplayerbook(player, force = False):
    defaultbookblob = {
        "name": player
    }
    bookblob = read_json_from_fdb(bookpath(player), defaultbookblob)
    book = Book(bookblob)
    if ( BOOK_FILTER_VERSION > book.filterversion ) or force:
        book.gameids = {}
        book.positions = {}
        book.filterversion = BOOK_FILTER_VERSION
    playerndjson = PlayerNdjson(player).fromdb()
    ndjson = playerndjson.ndjson
    print("building", player)
    cnt = 0
    found = 0
    filtered = []
    for gameblob in ndjson:
        cnt += 1
        g = LichessGame(gameblob, player)
        if bookfilterok(g):
            filtered.append(g)
            found += 1
        if ( cnt % 1000 ) == 0:
            print("filtering", cnt, "found", found)
    print("filtering done, found", found)
    if len(filtered) > MAX_BOOK_GAMES:
        filtered = filtered[:MAX_BOOK_GAMES]
    cnt = 0
    for g in filtered:
        cnt += 1
        #print("building", cnt, "of", len(filtered), g.white.name, g.black.name)
        if g.id in book.gameids:
            pass
            #print("up to date")
        else:
            book.gameids[g.id] = True
            board = getvariantboard("atomic")
            zkh = get_zobrist_key_hex(board)
            movecnt = 0
            for san in g.moves:                
                move = board.parse_san(san)                                                             
                if movecnt >= MAX_BOOK_PLIES:                        
                    break
                movecnt += 1
                uci = move.uci()
                if zkh in book.positions:
                    pos = book.positions[zkh]
                else:
                    pos = BookPosition({
                        "zobristkeyhex": zkh
                    })
                if uci in pos.moves:
                    bookmove = pos.moves[uci]
                else:
                    bookmove = BookMove({
                        "uci": uci,
                        "san": san
                    })
                if board.turn == g.mecolor:
                    bookmove.plays += 1
                    if g.meresult == 1:
                        bookmove.wins += 1
                    elif g.meresult == 0:
                        bookmove.losses += 1
                    else:
                        bookmove.draws += 1                
                pos.moves[uci] = bookmove
                pos.addtopgame(g.excerpt())
                book.positions[zkh] = pos
                board.push(move)
                zkh = get_zobrist_key_hex(board)                                                       
            print("added", movecnt, "moves of", g.white.name, g.black.name)
    write_json_to_fdb(bookpath(player), book.toblob())

def buildbooks():    
    BUILD_PLAYERS = SCAN_PLAYER_LIST.split(",")    
    for player in BUILD_PLAYERS:
        buildplayerbook(player)
        time.sleep(5)

def scanplayerstarget():
    SCAN_PLAYERS = SCAN_PLAYER_LIST.split(",")
    print("scan", SCAN_PLAYERS)
    while True:
        for player in SCAN_PLAYERS:
            print("scanning", player)
            playerndjson = PlayerNdjson(player).fromdb()            
            if PRE_FILTER_VERSION > playerndjson.filterversion:
                print("rebuild ndjson")
                playerndjson.filterversion = PRE_FILTER_VERSION
                playerndjson.ndjson = []            
            playerndjson.ndjson = rationalizeplayerdata(playerndjson.ndjson)            
            exportgames("new", playerndjson)            
            exportgames("old", playerndjson)
            time.sleep(5)
        buildbooks()
        time.sleep(BUILD_BOOK_DELAY)

###################################################################

def keepalivetarget():
    for i in range(KEEP_ALIVE):        
        time.sleep(600)
        geturl(SERVER_URL, verbose = True)

###################################################################

def cleanplayers():
    for player in SCAN_PLAYER_LIST.split(","):
        print("cleaning player", player)    
        delfdb(ndjsonpath(player))
        delfdb(bookpath(player))

#cleanplayers()

if IS_PROD() or False:
    Thread(target = scanplayerstarget).start()
    Thread(target = keepalivetarget).start()

print("serverlogic started, prod", IS_PROD())

#buildplayerbook("sefulesefarka", force = True)

###################################################################

def loadbook(req):    
    log(f"< load book < {req.player} > >", "info")
    bookblob = read_json_from_fdb(bookpath(req.player), None)
    return {
        "kind": "loadbook",
        "bookblob": bookblob
    }
