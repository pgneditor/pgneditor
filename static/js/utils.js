////////////////////////////////////////////////////////////////////
// ws
WS_SCHEME = ( window.location.protocol == "https:" ) ? "wss://" : "ws://"
     
SOCKET_SUBMIT_URL = WS_SCHEME + window.location.host
////////////////////////////////////////////////////////////////////

function getelse(obj, key, defaultvalue){
    if(key in obj) return obj[key]
    return defaultvalue
}

function gettimesec(){
    return new Date().getTime()/1000.0
}

////////////////////////////////////////////////////////////////////

try{
    var markdownconverter = new showdown.Converter()
}catch(err){
    console.log("could not create markdown converter")
}

function md2html(md, def){
    try{
        html = markdownconverter.makeHtml(md)
        return html        
    }catch(err){
        console.log(err)
        return def || md
    }
}

////////////////////////////////////////////////////////////////////

function serverroot(){
    return document.location.protocol + "//" + document.location.host
}

////////////////////////////////////////////////////////////////////
// https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another

function arraymove(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1
        while (k--) {
            arr.push(undefined)
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])    
}

////////////////////////////////////////////////////////////////////

function feninfo(fen){
    info = {
        rawfen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
        turn: "w",
        castlingrights: "KQkq",
        epsquare: "-",
        halfmoveclock: 0,
        fullmovenumber: 1
    }

    try{
        let parts = fen.split(" ")
        info.rawfen = parts[0]
        info.turn = parts[1]
        info.castlingrights = parts[2]
        info.epsquare = parts[3]
        info.halfmoveclock = parseInt(parts[4])
        if(isNaN(info.halfmoveclock)) info.halfmoveclock = 0
        info.fullmovenumber = parseInt(parts[5])
        if(isNaN(info.fullmovenumber)) info.fullmovenumber = 0
    }catch(err){}
    
    return info
}

////////////////////////////////////////////////////////////////////

//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
seed = 1
function random(){
    seed += 1
    x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

function setseed(newseed){
    seed = newseed
}

function randcol(){
	return Math.floor(128 + random() * 128)
}

function randrgb(){
	return `rgb(${randcol()},${randcol()},${randcol()})`
}

////////////////////////////////////////////////////////////////////
// url params https://www.sitepoint.com/get-url-parameters-with-javascript/
function getAllUrlParams(url) {
    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

    // we'll store the parameters here
    var obj = {};

    // if query string exists
    if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
        // separate the keys and the values
        var a = arr[i].split('=');

        // set parameter name and value (use 'true' if empty)
        var paramName = a[0];
        var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

        // (optional) keep case consistent
        //paramName = paramName.toLowerCase();
        //if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

        // if the paramName ends with square brackets, e.g. colors[] or colors[2]
        if (paramName.match(/\[(\d+)?\]$/)) {

        // create key if it doesn't exist
        var key = paramName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        // if it's an indexed array e.g. colors[2]
        if (paramName.match(/\[\d+\]$/)) {
            // get the index value and add the entry at the appropriate position
            var index = /\[(\d+)\]/.exec(paramName)[1];
            obj[key][index] = paramValue;
        } else {
            // otherwise add the value to the end of the array
            obj[key].push(paramValue);
        }
        } else {
        // we're dealing with a string
        if (!obj[paramName]) {
            // if it doesn't exist, create property
            obj[paramName] = paramValue;
        } else if (obj[paramName] && typeof obj[paramName] === 'string'){
            // if property does exist and it's a string, convert it to an array
            obj[paramName] = [obj[paramName]];
            obj[paramName].push(paramValue);
        } else {
            // otherwise add the property
            obj[paramName].push(paramValue);
        }
        }
    }
    }

    return obj;
}

params = getAllUrlParams()
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// dom utils

function ge(id){return document.getElementById(id)}

function se(id, e){
    te = ge(id)
    te.innerHTML = ""
    te.append(e.e)
}

function ae(id, e){
    ge(id).append(e.e)
}

// https://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
function getScrollBarWidth(){
    let outer = document.createElement("div")
    outer.style.visibility = "hidden"
    outer.style.width = "100px"
    outer.style.msOverflowStyle = "scrollbar" // needed for WinJS apps

    document.body.appendChild(outer)

    let widthNoScroll = outer.offsetWidth
    // force scrollbars
    outer.style.overflow = "scroll"

    // add innerdiv
    let inner = document.createElement("div")
    inner.style.width = "100%"
    outer.appendChild(inner)       

    let widthWithScroll = inner.offsetWidth

    // remove divs
    outer.parentNode.removeChild(outer)

    return widthNoScroll - widthWithScroll
}

////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// fetch utils
function defaultcallback(){
}

function defaulterrhandler(kind, url, content, err){
    console.log(kind, url, content, err)
}

function fetchjson(url, callback, errcallback){
    if(!errcallback) errcallback = defaulterrhandler
    fetch(url).then(
        res=>res.text().then(
            content=>{
                try{
                    obj = JSON.parse(content)
                    callback(obj)
                }catch(err){
                    errcallback("fetch parse failed", url, content, err)
                }
            },
            err=>errcallback("fetching content failed", url, "", err)
        ),
        err=>errcallback("fetch request failed", url, "", err)
    )
}

function jsonapi(url, obj, callbackarg, errcallbackarg){
    let callback = callbackarg || defaultcallback
    let errcallback = errcallbackarg || defaulterrhandler
    fetch(url, {
        method: "POST",
        body: JSON.stringify(obj),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    }).then(
        res=>res.text().then(
            content=>{
                try{
                    obj = JSON.parse(content)
                    callback(obj)
                }catch(err){
                    errcallback("fetch parse failed", url, content, err)
                }
            },
            err=>errcallback("fetching content failed", url, "", err)
        ),
        err=>errcallback("fetch request failed", url, "", err)
    )
}

function fetchallndjson(url, callback, errcallback){
    fetch(url, {
        headers:{
            Accept: "application/x-ndjson"
        }                    
    }).then(
        res=>res.text().then(
            content=>{
                try{
                    list = []
                    for(line of content.split("\n")){
                        try{
                            obj = JSON.parse(line)
                            list.push(obj)
                        }catch(e){
                        }
                    }                    
                    callback(list)
                }catch(err){
                    errcallback("fetch parse failed", url, content, err)
                }
            },
            err=>errcallback("fetching content failed", url, "", err)
        ),
        err=>errcallback("fetch request failed", url, "", err)
    )
}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// date and time

function dateToDateInputStr(dateObj){
    let month = "" + ( dateObj.getUTCMonth() + 1 )
	let day = "" + dateObj.getUTCDate()
	let year = dateObj.getUTCFullYear()
    return year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0")
}

function dateInputStrToDate(dateInputStr){
	let parts = dateInputStr.split("-")
	let year = parseInt(parts[0])
	let month = parseInt(parts[1]) - 1
	let day = parseInt(parts[2])
    return new Date(year, month, day)
}

ONE_SECOND = 1000
ONE_MINUTE = 60 * ONE_SECOND
ONE_HOUR = 60 * ONE_MINUTE
ONE_DAY = 24 * ONE_HOUR

function elapsed(time1ms, time2ms){
    let diff = Math.abs(time1ms - (time2ms || new Date().getTime()) )
    return diff
}

function elapsedsec(time1ms, time2ms){
    return elapsed(time1ms, time2ms) / ONE_SECOND
}

function elapsedmin(time1ms, time2ms){
    return elapsed(time1ms, time2ms) / ONE_MINUTE
}

function elapsedhour(time1ms, time2ms){
    return elapsed(time1ms, time2ms) / ONE_HOUR
}

function elapsedday(time1ms, time2ms){
    return elapsed(time1ms, time2ms) / ONE_DAY
}

////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////

function downloadcontent(filename, content){
    filename = filename.replace(/ /g, "_")
    filename = filename.toLowerCase()
    let file = new Blob([content])
    let a = document.createElement("a")
    let url = URL.createObjectURL(file)
    a.href = url
    a.download = filename
    document.body.appendChild(a)        
    a.click()
    setTimeout(function() {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }, 0)
}

////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// local storage

function getLocalElse(key, defaultvalue){
    valuestring = localStorage.getItem(key)
    let value = defaultvalue
    if(!value) value = null
    if(valuestring) try{
        value = JSON.parse(valuestring)
    }catch(err){}
    return value
}

function setLocal(key, value){
    localStorage.setItem(key, JSON.stringify(value))
}

////////////////////////////////////////////////////////////////////

function textconfirm(message, text){
    let input = window.prompt(`Are you sure you want to ${message}? Type in "${text}" to confirm:`, "")
    return input == text
}

////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// user

class User_{
    constructor(blobarg){
        let blob = blobarg || {}        
        this.uid = getelse(blob, "uid", "anonuser")
        this.code = getelse(blob, "code", null)
        this.username = getelse(blob, "username", "Anonymous")
        this.createdat = getelse(blob, "createdat", gettimesec())
        this.verifiedat = getelse(blob, "verifiedat", null)
        this.lastactiveat = getelse(blob, "lastactiveat", gettimesec())
        this.verification = getelse(blob, "verification", null)
        this.privileges = getelse(blob, "privileges", {})
    }

    isverified(){        
        return !(!this.verifiedat)
    }

    beingverified(){        
        return !(!this.verification)
    }

    toblob(){
        return {
            uid: this.uid,
            code: this.code,
            username: this.username,
            createdat: this.createdat,
            verifiedat: this.verifiedat,
            lastactiveat: this.lastactiveat,
            verification: this.verification,
            privileges: this.privileges
        }
    }
}
function User(blobarg){return new User_(blobarg)}

function getuser(){
    let blobarg = getLocalElse("user", {})
    return User(blobarg)
}

function getuserblob(){
    return getuser().toblob()
}

function setuserfromblobarg(blobarg){
    let user = User(blobarg)
    let blob = user.toblob()
    setLocal("user", blob)
}

////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// api

function api(reqobj, callback){
    function defaultapicallback(resobj){
        console.log("<-", resobj.kind, resobj)        
        setuserfromblobarg(resobj.user)
        if("alert" in resobj){
            window.alert(resobj.alert.msg)
        }
        if(callback) callback(resobj)
    }
    reqobj.user = getuserblob()    
    reqobj.queryparams = params
    console.log("->", reqobj.kind, reqobj)
    jsonapi("/jsonapi", reqobj, defaultapicallback)
}

////////////////////////////////////////////////////////////////////