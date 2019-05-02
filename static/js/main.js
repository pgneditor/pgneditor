////////////////////////////////////////////////////////////////////

let app = HeadlogPane({fillwindow: true})
app.controlpanel.bc("#ddd")

let maintabpane = TabPane().settabs([
    Tab("about", "About", Div().html("Pgn Editor.").mar(10).fs(20))
]).selecttab("about", USE_STORED_IF_AVAILABLE).op(0.25).transition("all 1s")

app.setcontentelement(maintabpane)

se("root", app)

function initapp(resobj){
    app.log("Welcome to Pgn Editor !", "success")    

    maintabpane.op(1)
}

function connect(){    
    api({
        "kind": "connected"
    }, initapp)
}

////////////////////////////////////////////////////////////////////

app.log("Pgn Editor authenticating ...", "info")

setTimeout(connect, 1000)

////////////////////////////////////////////////////////////////////
