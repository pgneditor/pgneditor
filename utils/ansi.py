###################################################
# ANSI

ANSI = {
    "NONE" : "",

    "BLACK" : '\033[30m',
    "RED" : '\033[31m', 
    "GREEN" : '\033[32m',
    "YELLOW" : '\033[33m',
    "BLUE" : '\033[34m',
    "MAGENTA" : '\033[35m',
    "CYAN" : '\033[36m',
    "WHITE" : '\033[37m',
    "BRIGHTBLACK" : '\033[90m',
    "BRIGHTRED" : '\033[91m',
    "BRIGHTGREEN" : '\033[92m',
    "BRIGHTYELLOW" : '\033[93m',
    "BRIGHTBLUE" : '\033[94m',
    "BRIGHTMAGENTA" : '\033[95m',
    "BRIGHTCYAN" : '\033[96m',
    "BRIGHTWHITE" : '\033[97m',
        
    "ENDC" : '\033[0m',

    "BOLD" : '\033[1m',
    "UNDERLINE" : '\033[4m'
}

def GETANSI(a):
    if a in ANSI:
        return ANSI[a]
    return None

ANSI_BLACK = ANSI["BLACK"]
ANSI_RED = ANSI["RED"]
ANSI_GREEN = ANSI["GREEN"]
ANSI_YELLOW = ANSI["YELLOW"]
ANSI_BLUE = ANSI["BLUE"]
ANSI_MAGENTA = ANSI["MAGENTA"]
ANSI_CYAN = ANSI["CYAN"]
ANSI_WHITE = ANSI["WHITE"]
ANSI_BRIGHTBLACK = ANSI["BRIGHTBLACK"]
ANSI_BRIGHTRED = ANSI["BRIGHTRED"]
ANSI_BRIGHTGREEN = ANSI["BRIGHTGREEN"]
ANSI_BRIGHTYELLOW = ANSI["BRIGHTYELLOW"]
ANSI_BRIGHTBLUE = ANSI["BRIGHTBLUE"]
ANSI_BRIGHTMAGENTA = ANSI["BRIGHTMAGENTA"]
ANSI_BRIGHTCYAN = ANSI["BRIGHTCYAN"]
ANSI_BRIGHTWHITE = ANSI["BRIGHTWHITE"]

ANSI_ENDC = ANSI["ENDC"]

ANSI_BOLD = ANSI["BOLD"]
ANSI_UNDERLINE = ANSI["UNDERLINE"]

###################################################

for key in ANSI:
    if not key in ["NONE", "ENDC"]:
        exec(
f"""
def {key.lower()}(content):    
    global ANSI
    return ANSI["{key}"] + content + ANSI_ENDC
"""
        )

###################################################

def prettyrec(obj, indent = 2, currindent = 0):    
    lines = []
    if type(obj) == type(None):              
        return brightblue("null")
    if type(obj) == str:                
        return brightgreen(obj)
    if type(obj) == int:                
        return brightcyan(str(obj))
    if type(obj) == float:                
        return brightcyan(str(obj))
    lines.append("")
    if type(obj) == dict:
        lines.append((currindent * " ") + brightred("{"))
        for key, value in obj.items():
            lines.append(((currindent + indent) * " ") + brightyellow(key) + " : " + prettyrec(value, currindent = currindent + 2 * indent))
        lines.append((currindent * " ") + brightred("}"))
    elif type(obj) == list:
        lines.append((currindent * " ") + brightmagenta("["))
        for value in obj:
            lines.append(((currindent + indent) * " ") + prettyrec(value, currindent = currindent + 2 * indent))
        lines.append((currindent * " ") + brightmagenta("]"))
    else:
        return white(str(obj))

    return "\n".join(lines)

def pretty(obj, indent = 2):
    lines =  prettyrec(obj, indent).split("\n")
    lines = [line for line in lines if not line == ""]
    return "\n".join(lines)

###################################################