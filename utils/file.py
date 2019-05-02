###################################################################

import os
import json
import codecs
from traceback import print_exc as pe

###################################################################

FILE_VERBOSE = True

###################################################################

def createdir(path):
    if os.path.isdir(path):
        if FILE_VERBOSE:
            print(f"{path} already exists")
        return True
    try:
        os.mkdir(path)
        if FILE_VERBOSE:
            print(f"{path} created")
        return True
    except:
        pe()
        if FILE_VERBOSE:
            print(f"{path} could not be created")
        return False

###################################################################

def getfilenamesfromdir(path, ext = None):
    for (dirpath, dirnames, filenames) in os.walk(mypath):
        if ext:
            filenames = [os.path.splitext(filename)[0] for filename in filenames if os.path.splitext(filename)[1] == ext]
        return filenames

###################################################################

def write_string_to_file(path, content):
    with open(path,"wb") as outfile:
        outfile.write(content.encode("utf-8"))
    if FILE_VERBOSE:
        print(f"written file { path } ( { len(str) } characters )")

def read_string_from_file(path, default):
	try:		
		content = codecs.open(path, encoding = "utf-8").read()
		return content
	except:
		pe()
		return default

###################################################################

def write_json_to_file(path, obj, indent = 2):        
    json.dump(obj, open(path, "w"), indent = indent)
    if FILE_VERBOSE:
        print(f"written json { path } ( { len(json.dumps(obj, indent = indent)) } characters )")
    
def read_json_from_file(path, default):
    try:
        obj = json.load(open(path))
        return obj
    except:
        return default

###################################################################

class Db:
    def __init__(self, dbpath = "db"):
        self.dbpath = dbpath
        createdir(self.dbpath)

    def isdocpath(self, path):
        return ( len(path.split("/")) % 2 ) == 0

    def getdocfromdb(self, path):
        return None

    def getcollfromdb(self, path):
        return None

    def getpathfromdb(self, path):
        if self.isdocpath(path):
            return self.getdocfromdb(path)
        return self.getcollfromdb(path)

    def setdocindb(self, path, doc):
        pass

    def pathexists(self, path, create = None):
        parts = path.split("/")
        l = len(parts)
        isdoc = ( ( l % 2 ) == 0 )                
        if isdoc:
            dirpath = self.dbpath + "/" + "/".join(parts[:-1])
            effpath = dirpath + "/" + parts[-1] + ".json"
            exists = os.path.isfile(effpath)        
            if exists:
                exists = read_json_from_file(effpath, {})
        else:
            dirpath = self.dbpath + "/" + path
            effpath = dirpath        
            exists = os.path.isdir(effpath)        
            if exists:
                exists = {}
        if not create:
            return exists
        createdir(dirpath)
        if isdoc:
            write_json_to_file(effpath, create)
        else:
            for id, doc in create.items():
                write_json_to_file(dirpath + "/" + id + ".json", doc)

    def setdoc(self, path, doc):
        self.pathexists(path, doc)
        self.setdocindb(path, doc)

    def getpath(self, path):
        if FILE_VERBOSE:
            print(f"getting {path} from db")        
        if not self.pathexists(path):
            if FILE_VERBOSE:
                print(f"{path} does not exist, requesting from remote")        
            dbresult = self.getpathfromdb(path)
            if not dbresult:
                if FILE_VERBOSE:
                    print(f"{path} does not exist on remote")        
                return None
            if FILE_VERBOSE:
                print(f"setting {path} locally to", dbresult)        
            self.pathexists(path, dbresult)
            return dbresult
        if FILE_VERBOSE:
            print(f"{path} exists")        
        if self.isdocpath(path):            
            effpath = self.dbpath + "/" + path + ".json"
            doc = read_json_from_file(effpath, {})
            if FILE_VERBOSE:
                print(f"returning doc from {effpath}", doc)        
            return doc
        ids = getfilenamesfromdir(self.dbpath + "/" + path, ext = ".json")
        colldict = {}
        for id in ids:
            colldict[id] = read_json_from_file(path + "/" + id + ".json", {})
        if FILE_VERBOSE:
            print(f"returning coll dict from {path}")        
        return colldict

###################################################################
