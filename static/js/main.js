////////////////////////////////////////////////////////////////////

let app = HeadlogPane({fillwindow: true})
app.controlpanel.bc("#ddd")

let profile = Profile()
let board = Board()

//let aboutiframe = Iframe().setSrc("/docs/about").domarkdown()
let aboutiframe = Iframe().setSrc("https://lishadowapps-blog.netlify.com/posts/pgn_editor/?nolog=true&hideheader=true")

let maintabpane = TabPane("maintabpane").settabs([
    Tab("board", "Board", board, "4"),    
    Tab("font", "Font", FontExplorer("lichess"), "A"),
    Tab("about", "About", aboutiframe, "&"),
    Tab("profile", "Profile", profile)
]).selecttab("board", USE_STORED_IF_AVAILABLE).op(0.25).transition("all 1s")
if("tab" in params){
    console.log("forcing tab", params.tab)
    maintabpane.selecttab(params.tab)
}

app.setcontentelement(maintabpane)

let appdiv = Div().por().a(app)

let wiw = window.innerWidth
let wih = window.innerHeight
let infh = 75
let infodiv = Div().zi(100).pad(25).ta("center").disp("none").poa().l(wiw/2 - 100).t(wih - infh - 100).w(wiw/2).h(infh).bc("#afa").curlyborder()

infodiv.html(`<font size="6" style="font-weight: bold; color: #070;">Cloud analysis enabled.</font><br><br><font size="5"><a href="https://lishadowapps-blog.netlify.com/posts/pgn_editor/#analysis" target="_blank" rel="noopener noreferrer">Analysis documentation</a></font>`)

appdiv.a(infodiv)

se("root", appdiv)

function keydownhandler(ev){
    //console.log("key down", ev.code, ev)
    try{
        board.book.keyhandler(ev)
    }catch(err){
        console.log("book could not handle key event", err)
    }
}

function initapp(resobj){
    app.log("Welcome to Pgn Editor !", "success")    

    board.init(resobj)

    profile.build()
    maintabpane.op(1)

    if(getuser().beingverified()) maintabpane.selecttab("profile")

    document.addEventListener("keydown", keydownhandler)

    if(resobj.freeanalysis){
        infodiv.disp("block")
        setTimeout(function(){
            infodiv.disp("none")
        }, 10000)
    }    
}

function connect(){    
    api({
        "kind": "connected"
    }, initapp)
}

////////////////////////////////////////////////////////////////////

function testeventsource(){
    let es = new EventSource("/testevents")
    es.onmessage= function(ev){
        console.log("event source data", ev.data)
    }
}

////////////////////////////////////////////////////////////////////

app.log("Pgn Editor authenticating ...", "info")

//testeventsource()

setTimeout(connect, 100)

////////////////////////////////////////////////////////////////////
