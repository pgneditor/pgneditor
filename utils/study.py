###################################################################

import time
import re
import random

###################################################################

import io
import chess
from chess.variant import find_variant
from chess.pgn import Game, StringExporter, read_game
from traceback import print_exc as pe

###################################################################

VARIANT_KEYS = [    
    [ "standard", "Standard" ],
    [ "chess960", "Chess960" ],
    [ "crazyhouse", "Crazyhouse" ],
    [ "antichess", "Giveaway" ],
    [ "atomic", "Atomic" ],
    [ "horde", "Horde" ],
    [ "kingOfTheHill", "King of the Hill" ],
    [ "racingKings", "Racing Kings" ],
    [ "threeCheck", "Three-check" ]
]

DEFAULT_MAX_PLIES = 200
MAX_SUCCESS = 10

###################################################################

def variantnameofvariantkey(variantkey):
    for item in VARIANT_KEYS:
        if item[0] == variantkey:
            return item[1]
    return "Standard"

def variantkeyofvariantname(variantname):
    for item in VARIANT_KEYS:
        if item[1] == variantname:
            return item[0]
    return "standard"

def getvariantboard(variantkey = "standard"):
    if variantkey == "standard":
        return chess.Board()
    elif variantkey == "chess960":
        return chess.Board(chess960 = True)
    elif variantkey == "fromPosition":
        return chess.Board()
    else:
        if variantkey == "kingOfTheHill":
            variantkey = "KOTH"
        VariantBoard = find_variant(variantkey)
        return VariantBoard()

class CommentParseResult:
    def __init__(self, message, drawings, metrainweight, opptrainweight):
        self.message = message
        self.drawings = drawings
        self.metrainweight = metrainweight
        self.opptrainweight = opptrainweight

    def __repr__(self):
        return f"< CommentParseResult < {self.message} | {self.drawings} | {self.metrainweight} | {self.opptrainweight} > >"

LICHESS_DRAWING_MATCHER = re.compile(r"(\[%(...) (.*?)\])")

COMMENT_SINGLE_LINE_MATCHER = re.compile(r"\s+")

def drawingstolichesscomment(drawingsblob):
    try:
        arrows = []
        circles = []
        for drawing in drawingsblob:
            kind = drawing["kind"]
            colorletter = "G"
            if drawing["color"] == "red":
                colorletter = "R"
            if kind == "arrow":
                arrows.append(colorletter + drawing["fromalgeb"] + drawing["toalgeb"])
            if kind == "circlemark":
                circles.append(colorletter + drawing["algeb"])
        blob = ""
        if len(circles) > 0:
            blob += "[%csl " + ",".join(circles) + "]"
        if len(arrows) > 0:
            blob += "[%cal " + ",".join(arrows) + "]"
        return blob
    except:
        return ""

def parselichesscomment(comment):
    try:
        matches = re.findall(LICHESS_DRAWING_MATCHER, comment)
        drawings = []
        purecomment = comment
        metrainweight = 0
        opptrainweight = 0
        for item in matches:
            full = item[0]
            kind = item[1]
            coords = item[2].split(",")
            purecomment = purecomment.replace(full, "")
            for coord in coords:
                if kind == "trn":
                    metrainweight = int(coords[0])
                    opptrainweight = int(coords[1])
                else:
                    colorletter = coord[0]
                    color = "green"
                    if colorletter == "R":
                        color = "red"
                    coord = coord[1:]
                    if kind == "csl":
                        drawings.append({
                            "kind": "circlemark",
                            "algeb": coord,
                            "color": color
                        })
                    elif kind == "cal":
                        drawings.append({
                            "kind": "arrow",
                            "fromalgeb": coord[0:2],
                            "toalgeb": coord[2:4],
                            "color": color
                        })
        return CommentParseResult(purecomment, drawings, metrainweight, opptrainweight)
    except:       
        return CommentParseResult(comment, [], 0, 0)

###################################################################

class GameNode:
    def __init__(self, parentstudy, blob = {}):
        self.parentstudy = parentstudy
        self.fromblob(blob)

    def getsiblings(self):
        siblings = []
        if self.parentid:
            parentnode = self.parentstudy.nodelist[self.parentid]
            for childid in parentnode.childids:
                if not ( childid == self.id ):
                    siblings.append(self.parentstudy.nodelist[childid])
        return siblings

    def settrainweight(self, weightkind, weight):
        try:
            if ( ( weightkind == "me" ) or ( weightkind == "opp" ) ) and ( ( weight >= 0 ) and ( weight <= 10 ) ):
                if weightkind == "me":
                    self.metrainweight = weight
                elif weightkind == "opp":
                    self.opptrainweight = weight
                return True
            else:
                print("wrong parameters for setting train weight", weightkind, weight)
                return False
        except:
            print("problem setting train weight", weightkind, weight)
            return False

    def getchilds(self):
        return [self.parentstudy.nodelist[childid] for childid in self.childids]

    def comment(self):
        comment = ""
        if self.message:
            comment += self.message
        comment += drawingstolichesscomment(self.drawings)
        if ( self.metrainweight > 0 ) or ( self.opptrainweight > 0 ):
            comment += f"[%trn {self.metrainweight},{self.opptrainweight}]"
        comment = re.sub(COMMENT_SINGLE_LINE_MATCHER, " ", comment)
        return comment

    def parsecomment(self, comment, ignorecomments = False, ignoredrawings = False, ignoretrainweights = False):
        plcr = parselichesscomment(comment)
        if not ignorecomments:
            self.message = plcr.message
        if not ignoredrawings:
            self.drawings = plcr.drawings
        if not ignoretrainweights:
            self.metrainweight = plcr.metrainweight
            self.opptrainweight = plcr.opptrainweight

    def fromblob(self, blob):
        self.id = blob.get("id", "root")
        self.parentid = blob.get("parentid", None)
        self.fen = blob.get("fen", self.parentstudy.getvariantboard().fen())
        self.gensan = blob.get("gensan", None)
        self.genuci = blob.get("genuci", None)
        self.priorityindex = blob.get("priority", 0)
        self.metrainweight = blob.get("metrainweight", 0)
        self.opptrainweight = blob.get("opptrainweight", 0)        
        self.drawings = blob.get("drawings", [])
        self.message = blob.get("message", None)
        self.duration = blob.get("duration", 1000)
        self.nags = blob.get("nags", [])
        self.success = blob.get("success", 0)
        self.childids = blob.get("childids", [])        

    def toblob(self):
        return {
            "id": self.id,
            "parentid": self.parentid,
            "fen": self.fen,
            "gensan": self.gensan,
            "genuci": self.genuci,
            "priorityindex": self.priorityindex,
            "metrainweight": self.metrainweight,
            "opptrainweight": self.opptrainweight,
            "drawings": self.drawings,
            "message": self.message,
            "duration": self.duration,
            "nags": self.nags,
            "success": self.success,
            "childids": self.childids
        }
        
class Study:
    def __init__(self, blob = {}):
        self.fromblob(blob)

    def getvariantboard(self):
        return getvariantboard(self.variantkey)

    def currentnode(self):
        return self.nodelist[self.currentnodeid]

    def rootnode(self):
        return self.nodelist["root"]

    def getrootboard(self):
        board = self.getvariantboard()
        board.set_fen(self.rootnode().fen)
        return board

    def addgamenoderecursive(self, currentid, gamenode, maxplies = DEFAULT_MAX_PLIES, ignorecomments = False, ignoredrawings = False, ignoretrainweights = False, depth = 0):
        if(depth >= maxplies):
            return
        for childnode in gamenode.variations:
            self.currentnodeid = currentid
            moveuci = childnode.uci()
            if self.makealgebmove(moveuci):                
                self.currentnode().parsecomment(childnode.comment,  ignorecomments = ignorecomments, ignoredrawings = ignoredrawings, ignoretrainweights = ignoretrainweights)
                if not ignorecomments:
                    self.currentnode().nags = list(childnode.nags)
                self.addgamenoderecursive(self.currentnodeid, childnode, maxplies = maxplies, depth = depth + 1)
            else:
                print("could not make move", moveuci)

    def parsepgn(self, pgn):
        pgnio = io.StringIO(pgn)
        try:
            game = read_game(pgnio)
        except:
            print("could not read game")
            return
        rootboard = self.getrootboard()
        try:
            gamerootfen = game.board().fen()            
            rootboard.set_fen(gamerootfen)
        except:
            print("could not set root board fen")
            return
        self.nodelist = {
            "root": GameNode(self, {
                "id": "root",
                "fen": gamerootfen 
            })
        }       
        self.currentnodeid = "root"
        self.rootnode().parsecomment(game.comment)
        self.addgamenoderecursive("root", game)

    def mergemoves(self, moves, maxplies = DEFAULT_MAX_PLIES, ignorecomments = False, ignoredrawings = False, ignoretrainweights = False):
        pgnio = io.StringIO(moves)
        try:
            game = read_game(pgnio)
        except:
            print("could not read game")
            return        
        self.addgamenoderecursive("root", game, maxplies = maxplies, ignorecomments = ignorecomments, ignoredrawings = ignoredrawings, ignoretrainweights = ignoretrainweights)

    def setdrawings(self, drawings):
        self.currentnode().drawings = drawings

    def setsuccess(self, nodeid, success):
        try:
            success = int(success)
            node = self.nodelist[nodeid]
            if success < MAX_SUCCESS:
                node.success = success
            else:
                for sibling in node.getsiblings():
                    if sibling.success > 0:
                        sibling.success -= 1
                node.success = MAX_SUCCESS                
            return True
        except:
            print("could not set success for", nodeid)
            return False

    def setmessage(self, nodeid, message):
        try:
            self.nodelist[nodeid].message = message
            return True
        except:
            print("could not set message for", nodeid)
            return False

    def setnags(self, nodeid, nags):
        try:
            self.nodelist[nodeid].nags = nags
            return True
        except:            
            print("could not set nags for", nodeid)
            return False

    def settrainweight(self, nodeid, weightkind, weight):
        try:            
            return self.nodelist[nodeid].settrainweight(weightkind, weight)
        except:            
            print("could not set weight for", nodeid, weightkind, weight)
            return False

    def setduration(self, nodeid, duration):
        try:
            self.nodelist[nodeid].duration = duration
            return True
        except:
            print("could not set duration for", nodeid)
            return False

    def reset(self):
        self.nodelist = {
            "root": GameNode(self, {
                "id": "root",
                "fen": self.getvariantboard().fen()
            })
        }        
        self.currentnodeid = "root"

    def addmovesrecursive(self, studynode, gamenode):
        for childnode in studynode.getchilds():            
            move = chess.Move.from_uci(childnode.genuci)
            gamenode.add_variation(move)
            childgamenode = gamenode[move]
            childgamenode.comment = childnode.comment()
            childgamenode.nags = set(childnode.nags)
            self.addmovesrecursive(childnode, childgamenode)
        return gamenode

    def reportpgn(self):
        rootboard = self.getrootboard()
        game = Game()
        game.setup(rootboard)        
        game.comment = self.rootnode().comment()
        game = self.addmovesrecursive(self.rootnode(), game)
        exporter = StringExporter(headers=True, variations=True, comments=True)
        pgn = game.accept(exporter)
        return pgn

    def makealgebmove(self, algeb):
        currentnode = self.currentnode()
        board = self.getvariantboard()
        board.set_fen(currentnode.fen)
        move = chess.Move.from_uci(algeb)
        san = board.san(move)
        newid = currentnode.id + "_" + san
        if board.is_legal(move):
            board.push(move)
            newfen = board.fen()
            if not newid in currentnode.childids:
                self.nodelist[newid] = GameNode(self, {
                    "id": newid,
                    "parentid": currentnode.id,
                    "fen": newfen,
                    "gensan": san,
                    "genuci": algeb
                })
            if not newid in currentnode.childids:
                currentnode.childids.append(newid)
            self.currentnodeid = newid
            return True
        else:
            return False

    def selectnodebyid(self, id):
        if id in self.nodelist:
            self.currentnodeid = id
            return True
        return False

    def back(self):
        currentnode = self.currentnode()
        parentid = currentnode.parentid
        if parentid:
            self.currentnodeid = parentid

    def deletnoderecursive(self, node):
        for childid in node.childids:
            childnode = self.nodelist[childid]
            self.deletnoderecursive(childnode)
        del self.nodelist[node.id]

    def delete(self):
        currentnode = self.currentnode()
        currentid = currentnode.id
        parentid = currentnode.parentid
        if parentid:
            parentnode = self.nodelist[parentid]
            if currentid in parentnode.childids:
                parentnode.childids = [childid for childid in parentnode.childids if not ( childid == currentid )]
            self.deletnoderecursive(currentnode)
            self.currentnodeid = parentid

    def tobegin(self):
        while self.currentnode().parentid:
            self.back()

    def forward(self):
        currentnode = self.currentnode()
        childids = currentnode.childids
        selectedid = None
        for childid in childids:
            if not selectedid:
                selectedid = childid
            else:
                if self.nodelist[childid].priorityindex < self.nodelist[selectedid].priorityindex:
                    selectedid = childid
        if selectedid:
            self.currentnodeid = selectedid
        return selectedid

    def toend(self):
        while self.forward():
            pass

    def setflip(self, flip):
        self.flip = flip

    def fromblob(self, blob):
        self.id = blob.get("id", "default")
        self.title = blob.get("title", "Default study")
        self.variantkey = blob.get("variantkey", "standard")
        self.createdat = blob.get("createdat", time.time())
        self.selected = blob.get("selected", False)        
        self.currentnodeid = blob.get("currentnodeid", "root")
        self.flip = blob.get("flip", False)
        nodelistblob = blob.get("nodelist", {})
        self.nodelist = {}
        for id, gamenodeblob in nodelistblob.items():
            self.nodelist[id] = GameNode(self, gamenodeblob)
        if not "root" in self.nodelist:
            self.nodelist["root"] = GameNode(self)
            
    def toblob(self, nodelist = False):
        nodelistblob = {}
        pgn = None
        if nodelist:
            for id, gamenode in self.nodelist.items():
                nodelistblob[id] = gamenode.toblob()
            pgn = self.reportpgn()
        return {
            "id": self.id,
            "title": self.title,
            "variantkey": self.variantkey,
            "createdat": self.createdat,
            "selected": self.selected,
            "currentnodeid": self.currentnodeid,
            "flip": self.flip,
            "nodelist": nodelistblob,
            "pgn": pgn
        }

###################################################################
