###################################################################

import os

###################################################################

SERVER_URL = os.environ.get("SERVERURL", "https://pgneditor.herokuapp.com")
KEEP_ALIVE = int(os.environ.get("KEEPALIVE", 15))

def IS_DEV():
    if "PGNEDITORDEV" in os.environ:
        return True
    return False

def IS_PROD():
    return not IS_DEV()

###################################################################
