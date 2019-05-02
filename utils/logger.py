###################################################################

import utils.config as config
import utils.ansi as ansi

###################################################################

def log(msg, kind = "normal", prompt = "-->"):
    msg = str(msg)
    if config.IS_DEV():
        if kind == "error":
            msg = ansi.brightred(msg)
        elif kind == "info":
            msg = ansi.brightwhite(msg)
        elif kind == "warning":
            msg = ansi.brightyellow(msg)
        elif kind == "success":
            msg = ansi.brightgreen(msg)
        prompt = ansi.brightmagenta(prompt)
    print(prompt, msg)    

###################################################################
