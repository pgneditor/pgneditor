###################################################################

from subprocess import Popen, PIPE
import threading
import os
import time

###################################################################

from utils.logger import SystemLogItem

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
    return variantkey

class UciEngine(Engine):
    def __init__(self, workingdirectory, executablename, id, systemlog):
        super().__init__(workingdirectory, executablename)
        self.id = id
        self.systemlog = systemlog
    
    def read_stdout_func(self, sline):
        #print(self, sline)
        self.systemlog.log(SystemLogItem({"owner": self.id, "msg": sline}))

    def send_line(self, sline):
        print("uci send line", sline)
        super().send_line(sline)
        self.systemlog.log(SystemLogItem({"owner": self.id, "msg": sline, "dir": "in"}))

    def setoption(self, name, value):
        self.send_line(f"setoption name {name} value {value}")

    def analyze(self, fen, multipv = 1, variantkey = "standard"):
        ucivariant = variantkey2ucivariant(variantkey)
        self.send_line("stop")
        self.setoption("UCI_Variant", ucivariant)
        self.setoption("MultiPV", multipv)
        self.send_line(f"position fen {fen}")
        self.send_line("go infinite")

    def stopanalyze(self):
        self.send_line("stop")

    def __repr__(self):
        return f"< UciEngine {self.id} | {self.commandpath} >"

