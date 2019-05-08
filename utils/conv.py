import base64
from utils.file import read_string_from_file, write_string_to_file
import sys, os
import heroku3

CHUNK_SIZE = 512

ENV_NAME = "FBSACCKEY"
APP_NAME = "pgneditor"
TOKEN_NAME = "PGNEDITOR_TOKEN"

def chunkstring(string, length):
    return (string[0+i:length+i] for i in range(0, len(string), length))

def enc(s):
    return base64.b64encode(str.encode(s))

def toenv():
    fbsacckey = read_string_from_file("firebase/sacckeyorig.json","{}")

    print("read sacckeyorig, length", len(fbsacckey))

    chunks = chunkstring(enc(fbsacckey), CHUNK_SIZE)

    bat = ""

    heroku_conn = heroku3.from_key(os.environ[TOKEN_NAME])

    app = heroku_conn.apps()[APP_NAME]

    appconfig = app.config()

    print("heroku app", app, appconfig)

    i = 0
    for chunk in chunks:        
        varname = "{}_{}".format(ENV_NAME, i)
        decchunk = chunk.decode()
        print("setting config var", i, varname, decchunk)        
        appconfig[varname] = decchunk
        bat += "set {}={}\n".format(varname, decchunk)
        i+=1

    write_string_to_file("firebase/toenv.bat", bat)
    
    print("new app config", appconfig)

def fromenv():
    content = ""
    for i in range(100):
        try:
            chunk = os.environ["{}_{}".format(ENV_NAME, i)]
            cd = base64.b64decode(chunk).decode()
            content += cd
        except:
            break
        
    write_string_to_file("firebase/sacckey.json", content)

    print("written sacckey", content)

if sys.argv[1] == "e":
    toenv()
elif sys.argv[1] == "d":
    fromenv()
