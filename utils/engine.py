###################################################################

from subprocess import Popen, PIPE
import threading
import os
import time
from queue import Queue
import chess

###################################################################

from utils.logger import SystemLogItem
from utils.study import getvariantboard

###################################################################

class Engine:
    def __init__(self, workingdirectory, executablename):
        self.workingdirectory = workingdirectory
        self.executablename = executablename
        self.commandpath = os.path.join(self.workingdirectory, self.executablename)

    def read_stdout_func(self, sline):
        print(self, sline)
        pass

    def read_stderr_func(self, sline):
        print("error", self, sline)
        pass

    def terminated_func(self):
        print("terminated", self)
        pass

    def read_stdout_thread_target(self):        
        while True:
            line = self.process.stdout.readline()

            if not line:
                break

            sline = line.rstrip()

            self.read_stdout_func(sline)

        self.process.stdout.close()

        with self.stdin_lock:
            self.process.stdin.close()

        if self.is_alive():
            self.terminate()
            self.wait_for_return_code()

        self.terminated_func()

    def read_stderr_thread_target(self):
        while True:
            line = self.process.stderr.readline()

            if not line:
                break

            sline = line.rstrip()
            
            self.read_stderr_func(sline)

    def open(self):        
        print("open", self)

        self.process = Popen(
            [self.commandpath],
            cwd = self.workingdirectory,
            stdin = PIPE,
            stdout = PIPE,
            stderr = PIPE,            
            bufsize = 1,  # Line buffering
            universal_newlines = True
        )

        self.stdin_lock = threading.Lock()

        self.read_stdout_thread = threading.Thread(target = self.read_stdout_thread_target)
        self.read_stdout_thread.daemon = True
        self.read_stderr_thread = threading.Thread(target = self.read_stderr_thread_target)
        self.read_stderr_thread.daemon = True

        self.read_stdout_thread.start()
        self.read_stderr_thread.start()

    def send_line(self, sline):        
        print("send", self, sline)
        with self.stdin_lock:
            self.process.stdin.write(sline + "\n")
            self.process.stdin.flush()

    def is_alive(self):
        return self.process.poll() is None

    def terminate(self):
        self.process.terminate()

    def kill(self):
        self.process.kill()

    def wait_for_return_code(self):
        self.process.wait()
        return self.process.returncode

    def pid(self):
        return self.process.pid

    def __repr__(self):
        return f"< Engine {self.commandpath} >"

###################################################################

def variantkey2ucivariant(variantkey):
    return variantkey.lower()

class UciInfo:
    def __init__(self, sline):
        self.kind = "unknown"
        self.infostring = None
        parts = sline.split(" ")
        if parts[0] == "bestmove":
            self.kind = "bestmove"
            return
        if not ( parts[0] == "info" ) or ( len(parts) < 2 ):
            return
        if parts[1] == "string":
            self.kind = "infostring"
            self.infostring = " ".join(parts[1:])
            return    
        self.kind = "info"
        self.multipv = None   
        self.scorekind = None     
        self.score = None
        self.depth = None
        self.pv = None        
        key = None
        for token in parts[1:]:
            if key == "multipv":
                try:
                    self.multipv = int(token)
                except:
                    pass
                key = None
            elif key == "depth":
                try:
                    self.depth = int(token)
                except:
                    pass
                key = None
            elif key == "score":
                self.scorekind = token
                key = "scorevalue"
            elif key == "scorevalue":
                try:
                    self.score = int(token)
                except:
                    self.scorekind = None
                key = None
            elif key == "pv":
                self.pv.append(token)
            else:
                key = token
                if key == "pv":
                    self.pv = []

class PvItem:
    def __init__(self, parentdepthitem):        
        self.parentdepthitem = parentdepthitem
        self.multipv = None
        self.depth = None
        self.scorekind = None     
        self.score = None        
        self.pv = None        
        self.pvsan = None

    def mergeuciinfo(self, ui):        
        if not ( ui.scorekind is None ):
            self.scorekind = ui.scorekind
        if not ( ui.score is None ):
            self.score = ui.score
        if not ( ui.pv is None ):
            self.pv = ui.pv
            if True:
                self.pvsan = []
                caj = self.parentdepthitem.parentengine.currentanalyzejob
                board = getvariantboard(caj.variantkey)
                board.set_fen(caj.fen)
                for uci in self.pv:
                    move = chess.Move.from_uci(uci)
                    san = board.san(move)
                    self.pvsan.append(san)
                    board.push(move)
            else:
                pass

    def toblob(self):
        return {
            "multipv": self.multipv,
            "depth": self.depth,
            "scorekind": self.scorekind,
            "score": self.score,
            "pv": self.pv,
            "pvsan": self.pvsan
        }

    def valid(self):
        if self.scorekind is None:
            return False
        if self.score is None:
            return False
        if self.pv is None:
            return False
        return True

    def __repr__(self):
        return f"< pvitem < {self.multipv} | {self.depth} | {self.scorekind} | {self.score} | {self.pv} > >"

class DepthItem:
    def __init__(self, parentengine, depth):
        self.parentengine = parentengine
        self.depth = depth
        self.pvitems = []

    def getitem(self, multipv):
        while len(self.pvitems) < ( multipv + 1 ):
            self.pvitems.append(None)
        if self.pvitems[multipv] is None:
            self.pvitems[multipv] = PvItem(self)
        return self.pvitems[multipv]

    def updateitem(self, multipv, uciinfo):
        pvitem = self.getitem(multipv)
        pvitem.mergeuciinfo(uciinfo)
        pvitem.multipv = multipv
        pvitem.depth = self.depth

    def toblob(self):
        return {
            "depth": self.depth,
            "pvitems": [pvitem.toblob() for pvitem in self.pvitems if not ( pvitem is None )]
        }

    def multipvcount(self):
        mpc = 0
        for pvitem in self.pvitems:
            if not ( pvitem is None ):
                if pvitem.valid():
                    mpc += 1
        return mpc

    def __repr__(self):
        return f"< depthitem < {self.depth} | {[pvitem for pvitem in self.pvitems]} >"

class AnalyzeJob:
    def __init__(self, fen, multipv = 1, variantkey = "standard"):
        self.fen = fen
        self.multipv = multipv
        self.variantkey = variantkey

    def __repr__(self):
        return f"< analyzejob < {self.fen} | {self.multipv} | {self.variantkey} > >"

class UciEngine(Engine):
    def resetanalysis(self):
        self.depthitems = []
        self.depth = 0
        self.multipv = 1

    def __init__(self, workingdirectory, executablename, id, systemlog):
        super().__init__(workingdirectory, executablename)
        self.id = id
        self.systemlog = systemlog
        self.resetanalysis()
        self.terminated = False
        self.analyzing = False
        self.currentanalyzejob = None
        self.analysisqueue = Queue()
        threading.Thread(target = self.analyzethreadtarget).start()

    def terminated_func(self):
        self.terminated = True
        self.analyze("terminated")
    
    def read_stdout_func(self, sline):
        #print(self, sline)
        ui = UciInfo(sline)
        self.systemlog.log(SystemLogItem({"owner": self.id, "msg": sline, "kind": ui.kind}))
        if ui.kind == "bestmove":
            print("bestmove")
            self.analyzing = False
        if ui.kind == "info":
            depthold = self.depth
            if ui.depth is None:
                ui.depth = self.depth
            else:
                self.depth = ui.depth
            if ui.multipv is None:
                ui.multipv = self.multipv
            else:
                self.multipv = ui.multipv
            while len(self.depthitems) < ( self.depth + 1 ):
                self.depthitems.append(None)
            if self.depthitems[self.depth] is None:
                self.depthitems[self.depth] = DepthItem(self, self.depth)
            mpcold = self.depthitems[self.depth].multipvcount()
            self.depthitems[self.depth].updateitem(self.multipv, ui)
            if ( time.time() - self.analyzestartedat ) > 0.5:
                self.systemlog.log(SystemLogItem({"owner": self.id, "blob": [depthitem.toblob() for depthitem in self.depthitems if not ( depthitem is None )], "kind": "analysisinfo"}))
                self.analyzestartedat = time.time()

    def send_line(self, sline):        
        super().send_line(sline)
        self.systemlog.log(SystemLogItem({"owner": self.id, "msg": sline, "dir": "in"}))

    def setoption(self, name, value):
        self.send_line(f"setoption name {name} value {value}")

    def awaitstop(self):
        if self.analyzing:
            print("awaiting stop")
            self.send_line("stop")
            while self.analyzing:
                time.sleep(0.1)
            print("awaiting stop done")

    def analyzethreadtarget(self):
        while True:
            analyzejob = self.analysisqueue.get()
            print("got analyze job", analyzejob)
            if self.terminated:
                    return
            ucivariant = variantkey2ucivariant(analyzejob.variantkey)
            self.awaitstop()
            print("starting", analyzejob)
            self.setoption("UCI_Variant", ucivariant)
            self.setoption("MultiPV", analyzejob.multipv)
            self.send_line(f"position fen {analyzejob.fen}")
            self.resetanalysis()
            self.analyzestartedat = time.time()            
            self.analyzing = True
            self.currentanalyzejob = analyzejob
            self.send_line("go infinite")                

    def analyze(self, analyzejob):        
        self.analysisqueue.put(analyzejob)

    def stopanalyze(self):
        self.send_line("stop")

    def __repr__(self):
        return f"< UciEngine {self.id} | {self.commandpath} >"

