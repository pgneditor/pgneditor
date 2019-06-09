###################################################################

import os

###################################################################

def getenvboolelse(key, defaultvalue):
    if key in os.environ:
        try:
            value = bool(int(os.environ[key]))
            return value
        except:
            return defaultvalue
    return defaultvalue

###################################################################

SERVER_URL = os.environ.get("SERVERURL", "https://pgneditor.herokuapp.com")
KEEP_ALIVE = int(os.environ.get("KEEPALIVE", 3))

def IS_DEV():
    if "PGNEDITORDEV" in os.environ:
        return True
    return False

def IS_PROD():
    return not IS_DEV()

###################################################################

def ENGINE_WORKING_DIR():
    if IS_DEV():
        return "engines"
    return "/app/engines"

def ENGINE_EXECUTABLE_NAME():
    if IS_DEV():
        return "stockfish.exe"
    return "stockfish"

###################################################################
