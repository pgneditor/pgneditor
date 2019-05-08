###################################################################

import os
import json
import codecs
from traceback import print_exc as pe

###################################################################

from utils.logger import log
from utils.config import IS_PROD

###################################################################

FILE_VERBOSE = False

FORCE_REMOTE_DB = True

DO_REMOTE_DB = IS_PROD() or FORCE_REMOTE_DB

###################################################################

if DO_REMOTE_DB:
    
    ###################################################

    import firebase_admin
    from firebase_admin import credentials
    from firebase_admin import firestore

    ###################################################

    cred = credentials.Certificate("firebase/sacckey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    ###################################################

###################################################################

def deletefile(path):
    if FILE_VERBOSE:
        log(f"< deleting file < {path} >", "info")
    try:
        os.remove(path)
    except:
        pe()

def createdir(path, createall = True):
    if os.path.isdir(path):
        if FILE_VERBOSE:
            log(f"< < {path} > already exists >", "warning")
        return True
    try:
        if createall:
            os.makedirs(path)
        else:
            os.mkdir(path)
        if FILE_VERBOSE:
            log(f"< < {path} > created >", "success")
        return True
    except:
        pe()
        if FILE_VERBOSE:
            log(f"< < {path} > could not be created >", "error")
        return False

###################################################################

def getfilenamesfromdir(path, ext = None):
    for (dirpath, dirnames, filenames) in os.walk(path):
        if ext:
            filenames = [os.path.splitext(filename)[0] for filename in filenames if os.path.splitext(filename)[1] == ext]
        return filenames

###################################################################

def write_string_to_file(path, content):
    with open(path,"wb") as outfile:
        outfile.write(content.encode("utf-8"))
    if FILE_VERBOSE:
        log(f"< written file < { path } [ { len(str) } characters ] > >", "info")

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
        log(f"< written json < { path } [ { len(json.dumps(obj, indent = indent)) } characters ] > >", "info")
    
def read_json_from_file(path, default):    
    try:
        obj = json.load(open(path))        
        return obj
    except:
        pe()
        return default

###################################################################

class Db:
    def __init__(self, dbpath = "db"):
        self.dbpath = dbpath
        createdir(self.dbpath)

    def isdocpath(self, path):
        return ( len(path.split("/")) % 2 ) == 0

    def getdocfromdb(self, path):
        if DO_REMOTE_DB:
            doc_ref = db.document(path)
            doc = doc_ref.get()
            if not doc:
                return None
            blob = doc.to_dict()
            return blob
        else:
            return None

    def getcollfromdb(self, path):
        if DO_REMOTE_DB:
            coll_ref = db.collection(path)
            docs = coll_ref.stream()
            if not docs:
                return None
            blob = {}
            for doc in docs:
                blob[doc.id] = doc.to_dict()
            return blob
        else:
            return None

    def getpathfromdb(self, path):
        if self.isdocpath(path):
            return self.getdocfromdb(path)
        return self.getcollfromdb(path)

    def setdocindb(self, path, doc):
        if DO_REMOTE_DB:
            doc_ref = db.document(path)
            doc_ref.set(doc)
        else:
            pass

    def deletedocfromdb(self, path):
        if DO_REMOTE_DB:
            doc_ref = db.document(path)
            doc_ref.delete()
        else:
            pass

    def pathexists(self, path, create = None):
        parts = path.split("/")
        l = len(parts)
        isdoc = ( ( l % 2 ) == 0 )                
        if isdoc:
            dirpath = self.dbpath + "/" + "/".join(parts[:-1])
            effpath = dirpath + "/" + parts[-1] + ".json"
            exists = os.path.isfile(effpath)                    
        else:
            dirpath = self.dbpath + "/" + path
            effpath = dirpath        
            exists = os.path.isdir(effpath)         
        if not create:
            return exists
        if not exists:
            if FILE_VERBOSE:
                log(f"< < {dirpath} > does not exist, creating >", "warning")
            createdir(dirpath)
        if isdoc:
            write_json_to_file(effpath, create)
        else:
            for id, doc in create.items():
                write_json_to_file(dirpath + "/" + id + ".json", doc)

    def setdoc(self, path, doc):
        self.pathexists(path, doc)
        self.setdocindb(path, doc)

    def deletedoc(self, path):
        self.deletedocfromdb(path)
        path = self.dbpath + "/" + path + ".json"
        deletefile(path)

    def getpath(self, path):
        if FILE_VERBOSE:
            log(f"< getting < {path} > from db >", "info")        
        if not self.pathexists(path):
            if FILE_VERBOSE:
                log(f"< < {path} > does not exist, requesting from remote >", "warning")        
            dbresult = self.getpathfromdb(path)
            if not dbresult:
                if FILE_VERBOSE:
                    log(f"< < {path} > does not exist on remote >", "error")        
                return None
            if FILE_VERBOSE:
                log(f"< setting < {path} > locally to < {dbresult} > >", "info")        
            self.pathexists(path, dbresult)
            return dbresult
        if FILE_VERBOSE:
            log(f"< < {path} > exists >", "info")        
        if self.isdocpath(path):            
            effpath = self.dbpath + "/" + path + ".json"
            doc = read_json_from_file(effpath, {})
            if FILE_VERBOSE:
                log(f"< returning doc from < {effpath} | {doc} > >", "info")        
            return doc
        ids = getfilenamesfromdir(self.dbpath + "/" + path, ext = ".json")
        colldict = {}
        for id in ids:
            colldict[id] = read_json_from_file(self.dbpath + "/" + path + "/" + id + ".json", {})
        if FILE_VERBOSE:
            log(f"< returning coll dict from < {path} > >", "info")        
        return colldict

###################################################################
