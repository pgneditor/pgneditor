////////////////////////////////////////////////////////////////////
clients = {}
function createconn(connectedcallback){
    //console.log("creating socket", SOCKET_SUBMIT_URL)
    rawsocket = io.connect(SOCKET_SUBMIT_URL)
    //console.log("socket created")

    function onconnect(){
        //console.log("socket connected")
        connectedcallback()
    }

    function siores(resobj){
        console.log("<--", resobj)
        kind = resobj.kind
        alertmessage = resobj.alertmessage
        if(alertmessage){
            window.alert(alertmessage)
        }
        clients[resobj.id].siores(resobj)
    }

    rawsocket.on("connect", onconnect)
    rawsocket.on("siores", siores)
}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// connwidget
class CButton_ extends Button_{
        constructor(caption, action){
            super(caption, action)
            this.fs(20).bdw(0).bc("inherit").c("#009").pad(0).cp()
        }
}
function CButton(caption, action){return new CButton_(caption, action)}

class ConnWidget_ extends e{
    constructor(id){
        super("div")
        this.id = id
        clients[this.id] = this
    }

    uidpath(){
        return `profileconn/uid`
    }

    usernamepath(){
        return `profileconn/username`
    }

    getuid(){
        return localStorage.getItem(this.uidpath()) || "mockuser"
    }

    setuid(uid){
        localStorage.setItem(this.uidpath(), uid)
    }

    isanon(){
        return this.getuid() == "mockuser"
    }

    getusername(){
        return localStorage.getItem(this.usernamepath()) || "Anonymous"
    }

    setusername(username){
        localStorage.setItem(this.usernamepath(), username)
    }

    sioreq(reqobj){	
        reqobj.id = this.id
        reqobj.uid = this.getuid()
        reqobj.username = this.getusername()
        console.log("-->", reqobj)
        rawsocket.emit("sioreq", reqobj)
    }

    siores(resobj){
        //console.log("default siores handler", this.id, resobj)
    }
}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// board
function stripsan(san){
    if(san.includes("..")){
        let parts = san.split("..")
        return parts[1]
    }
    if(san.includes(".")){
        let parts = san.split(".")
        return parts[1]
    }
    return san
}

MOVEDIV_WIDTH = 100
MOVEDIV_HEIGHT = 32
MESSAGE_HEIGHT = 250
NOVUM_LIMIT_HOURS = 24
MESSAGE_WIDTH_FACTOR = 4

class GameNode_ extends e{
    gearclicked(ev){        
        ev.stopPropagation()
        if(this.parboard.currpopup) this.parboard.currpopup.disp("none")
        this.gearon = !this.gearon
        if(this.gearon) this.popupdiv.disp("flex").fd("column").ai("center").jc("space-around").zi(10).scrollIntoView({block: "center", inline: "center", behavior: "smooth"})
        this.parboard.currpopup = this.popupdiv
    }
    mgearclicked(ev){        
        if(ev) ev.stopPropagation()
        if(this.parboard.currmpopup) this.parboard.currmpopup.disp("none")
        this.mgearon = !this.mgearon
        if(this.mgearon) this.mpopupdiv.disp("flex").fd("column").ai("center").jc("space-around").zi(20).scrollIntoView({block: "center", inline: "center", behavior: "smooth"})
        this.parboard.currmpopup = this.mpopupdiv
        if(!this.parboard.msgdisp) this.parboard.msgdisp = {}
        let messageid = this.linestr()
        this.parboard.msgdisp[messageid] = this
        if(this.mgearon) this.parboard.sioreq({
            "kind": "getmessage",
            "messageid": messageid
        })
    }
	constructor(){
		super("div")
		this.disp("flex").ai("center").fd("row").ac("unselectable")
		this.parboard = null
		this.par = null
		this.san = null
		this.childs = {}
        this.movediv = Div().bc("#eee").mw(MOVEDIV_WIDTH).w(MOVEDIV_WIDTH).mh(MOVEDIV_HEIGHT).h(MOVEDIV_HEIGHT).curlyborder()
        this.movediv.disp("flex").fd("column").ai("center").jc("space-around").cp().por().ml(1).mr(1)
        this.geardiv = Div().poa().t(1).l(MOVEDIV_WIDTH - 14).html("⚙").cp().ae("mousedown", this.gearclicked.bind(this))
        this.popupdiv = Div().poa().t(15).l(-10).w(2* MOVEDIV_WIDTH).h(40).disp("none").curlyborder().bc("#ffc")
        this.mgeardiv = Div().pad(1).poa().t(1).l(3).html("💭&#xFE0E;").cp().ae("mousedown", this.mgearclicked.bind(this))        
        this.mpopupdiv = Div().poa().t(15).l(-10).w(MESSAGE_WIDTH_FACTOR * MOVEDIV_WIDTH).h(2 *  MESSAGE_HEIGHT + 25).disp("none").curlyborder().bc("#ffc")
        this.mpopupdiv.ae("mousedown", function(ev){ev.stopPropagation()})
		this.childsdiv = Div().disp("flex").ai("left").jc("space-around").fd("column").bc("#eee")
		this.a(this.movediv, this.childsdiv)
	}
	line(fullsan){
		let current = this
		let movelist = []
		while(current.par){
            let san = stripsan(current.san)
            if(fullsan) san = current.san
			movelist.unshift(san)
			current = current.par
		}
		return movelist
    }
    linestr(){
        return this.line(true).join("_")
    }
    savemessage(){        
        let msg = this.messageedit.getText()
        this.parboard.sioreq({
            "kind": "savemessage",
            "messageid": this.linestr(),
            "message": msg
        })
        this.mgearclicked()
    }
    setmessage(message){        
        let msg = message["message"]
        this.messageedit.setText(msg)
        let mhtml = md2html(msg)        
        this.messagemd.html(mhtml)
    }
    messageditchanged(){
        this.messagemd.html(md2html(this.messageedit.getText()))
    }
	build(){
        let captiondiv = Div().html(this.san ? this.san : "root").pl(2).pr(2)
        if(this.san){
            let cbc = "#fff"
            let cc = "#000"
            let fw = "initial"
            if(this.san.includes("..")){
                cbc = "#000"
                cc = "#fff"            
            }
            captiondiv.fw("bold")        
            captiondiv.bc(cbc).c(cc)
        }
        let userdiv = Div().w(MOVEDIV_WIDTH - 10).ellipsis().ta("center")        
        for(let item of (this.parboard.themoves || [])){            
            if(item.line == this.linestr()){
                this.item = item
                userdiv.html(this.item.username)
                break
            }
        }
        this.movediv.x.a(captiondiv, userdiv, this.geardiv, this.popupdiv, this.mgeardiv, this.mpopupdiv).bds("solid").bdw(1).bdc("#777")
        try{   
            let messageitem = this.parboard.messageids[this.linestr()]            
            if(messageitem){                                
                this.mgeardiv.shc("#700").bc("#ffa")
                let messagetime = messageitem["time"]
                if(elapsedhour(messagetime*1000) < NOVUM_LIMIT_HOURS) this.mgeardiv.shc("#00f").bc("#ffa")
            }else{
                this.mgeardiv.shc("#aaa")
            }
        }catch(err){}
        if(this.item){
            this.popupdiv.x.a(Div().fw("bold").html(new Date(this.item.time*1000).toLocaleString()))            
            let ehr = Math.floor(elapsedhour(this.item.time*1000))
            if(ehr < NOVUM_LIMIT_HOURS){
                this.popupdiv.h(50)
                this.popupdiv.a(Div().c("#770").fw("bold").html(`${ehr} hour(s) ago`))            
                this.geardiv.c("#070").blink().bc("#ccc")
            }else{
                this.geardiv.c("#777")
            }            
            if(this.item.username == localStorage.getItem("profileconn/username")){                
                this.userme = true                
            }
            this.minfodiv = Div().h(15).disp("flex").ai("center")
            try{   
                let messageitem = this.parboard.messageids[this.linestr()]            
                let messagetimems = messageitem["time"]*1000
                if(messageitem){                                
                    this.minfodiv.a(
                        Div().html(new Date(messagetimems).toLocaleString()).c("#007").fs(11)
                    )
                    let ehr = Math.floor(elapsedhour(messagetimems))                    
                    if(ehr < NOVUM_LIMIT_HOURS) this.minfodiv.a(
                        Div().fw("bold").ml(15).html(`${ehr} hour(s) ago`).c("#770").fs(12)
                    )
                }
            }catch(err){
                this.minfodiv.h(0)
                this.mpopupdiv.h(2 * MESSAGE_HEIGHT)
            }
            this.mpopupdiv.x.a(this.minfodiv)            
            this.messagemd = Div().w(0.95 * MESSAGE_WIDTH_FACTOR * MOVEDIV_WIDTH).h(MESSAGE_HEIGHT - 35).ovf("scroll")
            this.messageedit = CopyTextArea({width: 0.95 * MESSAGE_WIDTH_FACTOR * MOVEDIV_WIDTH,height:MESSAGE_HEIGHT - 35})            
            this.messageedit.textarea.ae("keyup", this.messageditchanged.bind(this))
            this.mpopupdiv.a(this.messagemd, this.messageedit)            
            this.mcontroldiv = Div().disp("flex")                        
            if(this.userme) this.mcontroldiv.a(Button("Save message", this.savemessage.bind(this)))            
            this.mcontroldiv.a(Button("Close", this.mgearclicked.bind(this)))
            this.mpopupdiv.a(this.mcontroldiv)
        }
		this.movediv.ae("mousedown", this.parboard.gamenodeclicked.bind(this.parboard, this.line()))
        this.childsdiv.x
        this.mar(1)
        if((Object.keys(this.childs).length > 1)||(!this.par)){
            this.childsrgb = randrgb()        
            this.childsdiv.pad(5)
            this.childsdiv.ml(5).curlyborder()
            this.mult = 1                
        }else{
            this.childsrgb = this.par.childsrgb                        
            this.mult = this.par.mult + 1
            if(this.mult > 3) this.mar(0)
        }
        this.childsdiv.bc(this.childsrgb)
		for(let childsan in this.childs){
			this.childsdiv.a(this.childs[childsan].build())
		}
		return this
	}
	highlight(line){
		this.movediv.bc("#afa").bdc("#000")
		if(!line) return
		if(line.length > 0){
            let san = line.shift()            
			this.childs[san].highlight(line)
		}else{
			this.movediv.scrollIntoView({
				block: "center",
				inline: "center"
			})
		}
	}
	fromobj(parboard, obj, par, gensan){
		this.parboard = parboard
		this.childs = {}
		this.par = par
        this.san = gensan        
		for(let childsan in obj){
			let childobj = obj[childsan]
			this.childs[childsan] = GameNode().fromobj(this.parboard, childobj, this, childsan)
		}
		return this
	}
}
function GameNode(){return new GameNode_()}

class Board_ extends ConnWidget_{
	gamenodeclicked(line){
		//console.log(line)
		
		this.sioreq({
			kind: "setline",
			line: line
		})
	}
    del(){
        this.sioreq({
            kind: "delmove"            
        })
    }

    tobegin(){
        this.sioreq({
            kind: "tobegin"            
        })
    }

    back(){
        this.sioreq({
            kind: "backmove"            
        })
    }

    forward(){
        this.sioreq({
            kind: "forwardmove"            
        })
    }

    toend(){
        this.sioreq({
            kind: "toend"            
        })
    }

    reset(ev, pgn, fen){                
        this.sioreq({
            kind: "getboard",
            newgame: true,
            variantkey: this.basicboard.variantkey,
            pgn: pgn,
            fen: fen
        })
    }

    totalheight(){
        return this.basicboard.totalheight + this.controlheight
    }

    pgnpath(){
        return this.id + "/variants/" + this.basicboard.variantkey + "/pgn"
    }

    flippath(){
        return this.id + "/variants/" + this.basicboard.variantkey + "/flip"
    }

    setpgn(pgn){        
        this.pgn = pgn || localStorage.getItem(this.pgnpath())        
        if(this.pgn) localStorage.setItem(this.pgnpath(), this.pgn)
        else localStorage.removeItem(this.pgnpath())
        if(this.pgndiv) this.pgntext.setText(this.pgn || "loading game ...")        
    }

    setvariantkey(variantkey){        
        this.args.variantkey = variantkey
        this.basicboard = BasicBoard(this.args)        
        this.resize(this.resizewidth, this.resizeheight)        
        localStorage.setItem(this.id + "/variantkey", this.basicboard.variantkey)                
    }

    variantcombochanged(){                
        let variantkey = this.variantcombo.v()        
        this.setvariantkey(variantkey)
        this.setpgn(null)
        this.reset(null, this.pgn, null)
    }

    fenpastecallback(fen){
        this.reset(null, null, fen)
    }

    pgnpastecallback(pgn){        
        this.reset(null, pgn, null)
    }

    buildvariantcombo(){        
        this.variantcombo = Select().setoptions(VARIANT_KEYS, this.basicboard.variantkey)
        this.variantcombo.ae("change", this.variantcombochanged.bind(this)).fs(14).pad(2)
        //this.variantcombohook.x.a(this.variantcombo)
    }

	buildtree(){
		//this.treediv.x.html("<pre>" + JSON.stringify(this.tree, null, 2) + "</pre>")
		this.rootgamenode = GameNode().fromobj(this, this.tree, null, null)
		setseed(1)
		this.treediv.x.a(this.rootgamenode.build())
        this.rootgamenode.highlight(this.line)
        
        this.buildmoves()
    }

    movelistclicked(movestr){        
        this.guitabpane.selecttab("tree")
        let line = movestr.split("_").map(x => stripsan(x))
        this.sioreq({
			kind: "setline",
			line: line
		})
    }

    usernameclicked(username){
        window.open("https://lichess.org/@/" + username, "_blank")
    }

    buildmoves(){
        this.movesdiv.x
        for(let item of (this.themoves || []).slice().reverse()){
            let username = item.username
            let time = item.time
            let movestr = item.line
            let movestrdisp = movestr.replace(/[0-9]+\.\./g, "")
            movestrdisp = movestrdisp.replace(/_/g, " ")
            let usernamediv = Div().html(username).c("#770").cp().txd("underline")
            usernamediv.ae("mousedown", this.usernameclicked.bind(this, username))
            let timediv = Div().html(new Date(time*1000).toLocaleString()).c("#070").mt(3)
            if(elapsedhour(time*1000)<NOVUM_LIMIT_HOURS) timediv.blink()
            let smallcontainer = Div().disp("flex").fd("column").w(200).mw(200).pad(5)
            smallcontainer.a(usernamediv, timediv)
            let movediv = Div().html(username).html(movestrdisp).cp()
            movediv.ae("mousedown", this.movelistclicked.bind(this, movestr))
            let container = Div().disp("flex").pad(3).curlyborder().mar(3).bc("#eee")
            container.a(smallcontainer, movediv)
            this.movesdiv.a(container)
        }
    }
    
    analyzelichess(){
        let url = `https://lichess.org/analysis/${this.basicboard.variantkey}/${this.basicboard.fen}`
        window.open(url, "_blank")
    }

    analyzefbserv(){
        let url = `https://fbserv2.herokuapp.com/analysis/${this.basicboard.variantkey}/${this.basicboard.fen}`
        window.open(url, "_blank")
    }

    mergepgnpastecallback(pgn){
        this.sioreq({
            "kind": "mergepgn",
            "pgn": pgn
        })
    }

    getflip(){
        return localStorage.getItem(this.flippath()) ? true : false
    }

    setflip(flip){
        if(flip) localStorage.setItem(this.flippath(), "true")
        else localStorage.removeItem(this.flippath())
        this.basicboard.setflip(flip)
    }

    flip(){
        this.setflip(!this.getflip())        
        this.basicboard.buildall()
        this.buildcontrolpanel()
    }

    buildcontrolpanel(){
        this.controlpanel = Div().disp("flex").ai("center").jc("space-around").bimg("static/img/backgrounds/marble.jpg").h(this.controlheight - this.fenheight).w(this.boardwidth)
        this.variantcombohook = Div()
        //this.controlpanel.a(this.variantcombohook)
        this.buildvariantcombo()        
        this.prompiececombo = Select().setoptions([
            ["", "Promotion piece"],
            ["q", "Queen"],
            ["r", "Rook"],
            ["b", "Bishop"],
            ["n", "Knight"],
        ])
        this.controlpanel.a(this.prompiececombo)
        //this.controlpanel.a(CButton("✖", this.del.bind(this)).c("#a00"))
        this.controlpanel.a(CButton("⏮", this.tobegin.bind(this)).mb(3))
        this.controlpanel.a(CButton("◀", this.back.bind(this)).c("#0a0"))
        this.controlpanel.a(CButton("▶", this.forward.bind(this)).c("#0a0"))
        this.controlpanel.a(CButton("⏭", this.toend.bind(this)).mb(3))
        //this.controlpanel.a(CButton("↩", this.reset.bind(this)).fs(35).c("#f00").mt(8))
        this.controlpanel.a(CButton("↕", this.flip.bind(this)).fs(25))        
        this.controlpanel.a(Button("🔎 lichess", this.analyzelichess.bind(this)))        
        this.controlpanel.a(Button("🔎 fbserv", this.analyzefbserv.bind(this)))        
        this.controlpanelhook.x.a(this.controlpanel)
    }

    build(){        
        this.boardwidth = this.basicboard.totalwidth()
        this.maincontainer = Div().disp("flex").fd("column")        
        this.fentext = CopyText({width:this.boardwidth, height:this.fenheight, pastecallback:this.fenpastecallback.bind(this)})
        this.controlpanelhook = Div()
        this.maincontainer.a(this.controlpanelhook, this.fentext, this.basicboard)
        this.buildcontrolpanel()
        this.guicontainer = Div().disp("flex")                              
        this.pgndiv = Div()
        this.mergepgndiv = Div()
        this.treediv = Div().ff("monospace").pad(5)
        this.movesdiv = Div().ff("monospace").pad(3)
        this.guitabpane = TabPane(this.id + "/guitabpane", {width:this.guiwidth, height:this.totalheight()}).settabs([
            Tab("tree", "Tree", this.treediv),            
            Tab("moves", "Moves", this.movesdiv),            
            Tab("pgn", "PGN", this.pgndiv),   
            //Tab("mergepgn", "Merge PGN", this.mergepgndiv),                     
            //Tab("book", "Book", this.bookdiv = Div())
        ]).selecttab("tree", USE_STORED_IF_AVAILABLE)        
        this.pgntext = CopyTextArea({
            width:this.guiwidth - getScrollBarWidth(),
            height:this.guitabpane.contentheight - getScrollBarWidth(),
            pastecallback: this.pgnpastecallback.bind(this)
        })
        this.pgndiv.a(this.pgntext)
        this.mergepgntext = CopyTextArea({
            width:this.guiwidth - getScrollBarWidth(),
            height:this.guitabpane.contentheight - getScrollBarWidth(),
            pastecallback: this.mergepgnpastecallback.bind(this)
        })
        this.mergepgndiv.a(this.mergepgntext)
        this.setpgn()
	    this.buildtree()
        this.guicontainer.a(this.maincontainer, this.guitabpane)
        this.x.a(this.guicontainer)
        return this
    }

    resize(width, height){        
        this.resizewidth = width
        this.resizeheight = height
        this.basicboard.flip = this.getflip()
        this.basicboard.resize(width, height - this.controlheight)
        this.guiwidth = width - this.basicboard.totalwidth()
        this.build()
    }

    dragmovecallback(m){
        let algeb = m.toalgeb()     
        let prompiece = this.prompiececombo.v()
        algeb += prompiece
        this.sioreq({
            "kind": "makealgebmove",
            "algeb": algeb
        })
    }

    constructor(id, args){
        super(id)
        this.args = args
        this.boardheight = args.boardheight || 300
        this.fenheight = 20 || args.fenheight
        this.controlheight = 60 || args.controlheight
        this.guiwidth = args.guiwidth || 400
        this.args.dragmovecallback = this.dragmovecallback.bind(this)
        this.args.variantkey = localStorage.getItem(this.id + "/variantkey") || "standard"
        this.basicboard = BasicBoard(this.args)    
	    this.tree = {}
        //localStorage.removeItem(this.pgnpath())    
        this.setpgn()        
        this.build()

	this.tree = {}
        this.sioreq({
            kind: "getboard",
            newgame: true,
            variantkey: this.basicboard.variantkey,
            pgn: this.pgn
        })
    }

    siores(obj){        
        if(obj.kind == "setboard"){            
            let variantkey = obj.variantkey
            this.setvariantkey(variantkey)
            let fen = obj.fen
            let pgn = obj.pgn
            this.basicboard.setfromfen(fen)            
            this.setpgn(pgn)
            this.fentext.setText(fen)
            this.tree = obj.tree
            this.line = obj.line
            this.algebline = obj.algebline            
            if(this.algebline.length > 0) this.basicboard.addalgebmovearrow(this.algebline.pop(), {opacity: 0.6})
            if(this.algebline.length > 0) this.basicboard.addalgebmovearrow(this.algebline.pop(), {opacity: 0.4, color: "#77a"})
            this.themoves = obj.themoves
            this.messageids = obj.messageids
            this.buildtree()
        }
        if(obj.kind == "setmessage"){
            let messageid = obj["messageid"]       
            let message = obj["message"]     
            try{
                this.msgdisp[messageid].setmessage(message)
            }catch(err){}
        }
    }
}
function Board(id, args){return new Board_(id, args)}
////////////////////////////////////////////////////////////////////
class ProfileConnWidget_ extends ConnWidget_{
    constructor(siorescallback){        
        super("profileconn")
        this.siorescallback = siorescallback        
    }

    siores(resobj){        
        this.siorescallback(resobj)
    }
}
function ProfileConnWidget(siorescallback){return new ProfileConnWidget_(siorescallback)}

class ProfileTab_ extends Tab_{
    getuid(){return this.connwidget.getuid()}
    setuid(uid){this.connwidget.setuid(uid)}
    getusername(){return this.connwidget.getusername()}
    setusername(username){this.connwidget.setusername(username)}
    isanon(){return this.connwidget.isanon()}
    isuser(){return !this.connwidget.isanon()}

    signin(){
        this.setusername(this.usernameinput.getText())
        this.sioreq({
            "kind": "signin"
        })
    }

    signinuid(){        
        this.setuid(this.uidinput.getText())
        this.sioreq({
            "kind": "auth"
        })
    }

    vercode(){
        this.sioreq({
            "kind": "vercode",
            "tempuid": this.tempuid
        })
    }

    signout(){
        this.setuid("mockuser")
        this.build()
    }

    changeside(){
        let side = null
        while(!side){
            side = window.prompt("Choose side to play. Type 'black' or type 'white'. This decision is committal for this account !")
            if((side=="white")||(side=="black")){
                this.sioreq({
                    "kind": "setside",
                    "side": side
                })
            }else{
                side = null
            }
        }
    }

    build(){        
        if(this.isuser()){
            this.setcaption(this.getusername())
            this.captiondiv.c("#070")    
        }else{
            this.setcaption("Anonymous")
            this.captiondiv.c("#700")    
        }        

        if(this.isanon()){
            if(this.code){
                this.contentelement.x.html("Insert this code into your profile:")
                this.vercodebutton = Button("Verify code", this.vercode.bind(this)).ml(12).fs(18)
                this.contentelement.a(Div().mar(5).disp("flex").ai("center").a(CopyText({width: 500, dopaste: false}).setText(this.code), this.vercodebutton))
            }else{
                this.usernameinput = FeaturedTextInput("Username:")
                let defusername = this.getusername()
                if(defusername == "Anonymous") defusername = ""
                this.usernameinput.setText(defusername)
                this.signinbutton = Button("Sign in with Username", this.signin.bind(this)).h(30).fs(16).ml(10)
                this.contentelement.x.a(Div().disp("flex").ai("center").a(this.usernameinput, this.signinbutton))
                this.uidinput = CopyText({width: 500, docopy: false})
                this.signinuidbutton = Button("Sign in with User Id", this.signinuid.bind(this)).h(30).fs(16).ml(10)
                this.contentelement.a(Div().mt(20).ml(10).ff("monospace").html("Your User Id:"))
                this.contentelement.a(Div().mt(10).ml(20).disp("flex").ai("center").a(this.uidinput, this.signinuidbutton))
            }            
        }else{
            this.contentelement.x.a(Button("Sign out", this.signout.bind(this)).fs(20).mar(10))
            this.sidediv = Div().ml(20).html(this.user.side || "Not chosen yet.").fs(25).curlyborder().pad(10).ta("center").w(200)
            this.changesidebutton = Button("Change side", this.changeside.bind(this)).ml(15).fs(16)
            this.contentelement.a(Div().mt(20).ml(20).ff("monospace").html("Your Side:"))
            this.contentelement.a(Div().mt(20).disp("flex").ai("center").a(this.sidediv, this.changesidebutton))
            this.contentelement.a(Div().ml(20).ff("monospace").mt(35).html("Your User Id ( don't reveal to third parties ):"), CopyText({width: 500, dopaste: false}).setText(this.getuid()).mt(10).ml(30))
            if(!this.user.side){
                this.changeside()
            }
        }

        if(this.isuser()){
            this.usercallback()
        }
    }

    siores(resobj){
        //console.log("profile received", resobj)
        let kind = resobj.kind
        this.code = null
        if(kind=="signin"){
            this.code = resobj.setcode
            this.tempuid = resobj.setuid
        }else if(kind=="codeverified"){
            if(resobj.verified){
                this.user = resobj.user
                this.setusername(resobj.username)
                this.setuid(resobj.uid)
            }else{
                window.alert("Code was not found on your profile page! Sign in failed.")
            }
        }else if(kind == "auth"){
            this.user = resobj.user
            if(this.user.verified){
                this.setuid(this.user.uid)
                this.setusername(this.user.username)                
            }else{
                this.setuid("mockuser")
            }            
        }
        this.build()
    }

    usercallback(){
        console.log("user changed", this.user)
    }

    constructor(args){        
        super("profile", "Profile", Div())        
        this.args = args || {}
        this.usercallback = getelse(this.args, "usercallback", this.usercallback.bind(this))
        this.connwidget = ProfileConnWidget(this.siores.bind(this))
        this.contentelement.pad(5)
        this.sioreq({
            "kind": "auth"
        })
    }

    sioreq(reqobj){
        this.connwidget.sioreq(reqobj)
    }
}
function ProfileTab(args){return new ProfileTab_(args)}
////////////////////////////////////////////////////////////////////
