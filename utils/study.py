###################################################################

import time
import re

###################################################################

import io
import chess
from chess.variant import find_variant
from chess.pgn import Game, StringExporter, read_game

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
    def __init__(self, message, drawings):
        self.message = message
        self.drawings = drawings

    def __repr__(self):
        return f"< CommentParseResult < {self.message} | {self.drawings} > >"

LICHESS_DRAWING_MATCHER = re.compile(r"(\[%(...) (.*?)\])")

def parsecomment(comment):
    matches = re.findall(LICHESS_DRAWING_MATCHER, comment)
    drawings = []
    for item in matches:
        full = item[0]
        kind = item[1]
        coords = item[2].split(",")
        comment = comment.replace(full, "")
        for coord in coords:
            color = coord[0]
            color = "green"
            if color == "R":
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
    return CommentParseResult(comment, drawings)

print(parsecomment("pure comment [%csl Gg5,Ge5,Gd4,Rh4] some [%cal Gf3e5,Gf3g5,Ge2e3] other comment"))

###################################################################

class GameNode:
    def __init__(self, parentstudy, blob = {}):
        self.parentstudy = parentstudy
        self.fromblob(blob)

    def getchilds(self):
        return [self.parentstudy.nodelist[childid] for childid in self.childids]

    def comment(self):
        if self.message:
            return self.message
        return ""

    def parsecomment(self, comment):
        self.message = comment

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

    def addgamenoderecursive(self, currentid, gamenode):
        for childnode in gamenode.variations:
            self.currentnodeid = currentid
            moveuci = childnode.uci()
            if self.makealgebmove(moveuci):
                self.currentnode().parsecomment(childnode.comment)
                self.addgamenoderecursive(self.currentnodeid, childnode)
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
        self.rootnode().parsecomment(game.comment)
        self.addgamenoderecursive("root", game)

    def mergemoves(self, moves):
        pgnio = io.StringIO(moves)
        try:
            game = read_game(pgnio)
        except:
            print("could not read game")
            return        
        self.addgamenoderecursive("root", game)

    def setdrawings(self, drawings):
        self.currentnode().drawings = drawings

    def setmessage(self, nodeid, message):
        try:
            self.nodelist[nodeid].message = message
            return True
        except:
            print("could not set message for", nodeid)
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
