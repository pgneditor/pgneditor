###################################################

from os import stat

###################################################

from utils.file import dir_listing_as_list, read_string_from_file, write_string_to_file
from utils.misc import firstbetween, sepprint
from utils.ansi import *

###################################################

VERSIONED_DIRS = [
    "static/js",
    "static/css"
]

HTML_DIRS = [
    "templates"
]

###################################################

VERSION_DELIMS = [
    {
        "find": '<link rel="stylesheet"',
        "left": 'href="',
        "right": '"'
    },
    {
        "find": '<script src="',
        "left": 'src="',
        "right": '"'
    }
]

###################################################

sepprint(brightmagenta("versioning assets"))

allhtmls = []

for htmldir in HTML_DIRS:
    files = dir_listing_as_list(htmldir)    
    for file in files:
        if file["ext"] == "html":
            allhtmls.append([htmldir, file])

allversioned = []

for versioneddir in VERSIONED_DIRS:
    files = dir_listing_as_list(versioneddir)    
    for file in files:        
        allversioned.append("{}/{}".format(versioneddir, file["name"]))

###################################################

for file in allhtmls:
    path = file[0] + "/" + file[1]["name"]
    content = read_string_from_file(path, "")
    newlines = []
    changed = False
    for line in content.splitlines():
        newline = line        
        for delim in VERSION_DELIMS:
            if delim["find"] in line:                
                fullname = firstbetween(line, delim["left"], delim["right"])
                propername = firstbetween(fullname, '', '?')                
                if propername in allversioned:
                    mtime = "{:.0f}".format(stat(propername).st_mtime)
                    newfullname = propername + "?ver=" + mtime                    
                    newline = line.replace(fullname, newfullname)                
                    if not ( newline == line ):
                        print("-->", newfullname, path)
                        changed = True
        newlines.append(newline)
    if changed:
        newcontent = "\n".join(newlines)
        sepprint(brightgreen("updating {}".format(path)))
        write_string_to_file(path, newcontent)

###################################################
