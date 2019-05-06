###################################################################

import time

###################################################################

import chess
from chess.variant import find_variant

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

###################################################################

class GameNode:
    def __init__(self, parentstudy, blob = {}):
        self.parentstudy = parentstudy
        self.fromblob(blob)

    def fromblob(self, blob):
        self.id = blob.get("id", "root")
        self.parentid = blob.get("parentid", None)
        self.fen = blob.get("fen", self.parentstudy.getvariantboard().fen())
        self.gensan = blob.get("gensan", None)
        self.genuci = blob.get("genuci", None)
        self.priorityindex = blob.get("priority", 0)
        self.metrainweight = blob.get("metrainweight", 0)
        self.opptrainweight = blob.get("opptrainweight", 0)        
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
            "childids": self.childids
        }
        
class Study:
    def __init__(self, blob = {}):
        self.fromblob(blob)

    def getvariantboard(self):
        return getvariantboard(self.variantkey)

    def currentnode(self):
        return self.nodelist[self.currentnodeid]

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

    def fromblob(self, blob):
        self.id = blob.get("id", "default")
        self.title = blob.get("title", "Default study")
        self.variantkey = blob.get("variantkey", "standard")
        self.createdat = blob.get("createdat", time.time())
        self.selected = blob.get("selected", False)        
        self.currentnodeid = blob.get("currentnodeid", "root")
        nodelistblob = blob.get("nodelist", {})
        self.nodelist = {}
        for id, gamenodeblob in nodelistblob.items():
            self.nodelist[id] = GameNode(self, gamenodeblob)
        if not "root" in self.nodelist:
            self.nodelist["root"] = GameNode(self)
            
    def toblob(self, nodelist = False):
        nodelistblob = {}
        if nodelist:
            for id, gamenode in self.nodelist.items():
                nodelistblob[id] = gamenode.toblob()
        return {
            "id": self.id,
            "title": self.title,
            "variantkey": self.variantkey,
            "createdat": self.createdat,
            "selected": self.selected,
            "currentnodeid": self.currentnodeid,
            "nodelist": nodelistblob
        }

###################################################################
