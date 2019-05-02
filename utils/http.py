#############################################

import certifi
import urllib3

from json import dumps, loads

#############################################
# http
http = urllib3.PoolManager(
    cert_reqs='CERT_REQUIRED',
    ca_certs=certifi.where()
)
#############################################

#############################################

def posturl(url, headers = {}, fields = None, jsonobj = None, asjson = False, body = "", verbose = False):
    if verbose:
        print("posting {} with fields {} jsonobj {} body {}".format(url, fields, jsonobj, body))
    if fields:
        r = http.request("POST", url, headers = headers, fields = fields)
    else:
        if jsonobj:
            body = dumps(jsonobj)
            headers["Content-Type"] = "application/json"
        r = http.request("POST", url, headers = headers, body = body)
    content = r.data.decode("utf-8")
    if verbose:
        print("post returned content of length {}".format(len(content)))
    if asjson:
        return loads(content)
    return content

def geturl(url, asjson = False, verbose = False):
    if verbose:
        print("getting {}".format(url))
    r = http.request("GET", url)
    content = r.data.decode("utf-8")
    if verbose:
        print("get returned content of length {}".format(len(content)))
    if asjson:
        return loads(content)
    return content

#############################################
