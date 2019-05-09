////////////////////////////////////////////////////////////////////

let app = HeadlogPane({fillwindow: true})
app.controlpanel.bc("#ddd")

let profile = Profile()
let board = Board()

let aboutiframe = Iframe().setSrc("/docs/about").domarkdown()

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

se("root", app)

function initapp(resobj){
    app.log("Welcome to Pgn Editor !", "success")    

    board.init()

    profile.build()
    maintabpane.op(1)

    if(getuser().beingverified()) maintabpane.selecttab("profile")
}

function connect(){    
    api({
        "kind": "connected"
    }, initapp)
}

////////////////////////////////////////////////////////////////////

app.log("Pgn Editor authenticating ...", "info")

setTimeout(connect, 100)

////////////////////////////////////////////////////////////////////
