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

def IS_DEV():
    return getenvboolelse("PGNEDITOR_DEV", False)

def IS_PROD():
    return not IS_DEV()

###################################################################
