////////////////////////////////////////////////////////////////////

let app = HeadlogPane({fillwindow: true})
app.controlpanel.bc("#ddd")

let profile = Profile()

let maintabpane = TabPane().settabs([
    Tab("about", "About", Div().html("Pgn Editor.").mar(10).fs(20)),
    Tab("profile", "Profile", profile)
]).selecttab("about", USE_STORED_IF_AVAILABLE).op(0.25).transition("all 1s")

app.setcontentelement(maintabpane)

se("root", app)

function initapp(resobj){
    app.log("Welcome to Pgn Editor !", "success")    

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
