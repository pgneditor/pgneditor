////////////////////////////////////////////////////////////////////
// profile
class Profile_ extends e{
    constructor(){
        super("div")
        this.pad(10)
    }

    login(){
        api({
            "kind": "login",
            "verifyusername": this.usernameinput.getText()
        }, this.build.bind(this))
    }

    verify(){
        api({
            "kind": "verify"
        }, this.build.bind(this))
    }

    cancelverification(){
        api({
            "kind": "cancelverification"
        }, this.build.bind(this))
    }

    loginwithuserid(){
        let user = getuser()
        user.uid = this.useridinput.getText()
        user.verification = null
        setuserfromblobarg(user.toblob())
        api({
            "kind": "connected"
        }, initapp)
    }

    logout(){
        let user = getuser()
        user.uid = "anonuser"
        user.verification = null
        setuserfromblobarg(user.toblob())
        api({
            "kind": "connected"
        }, initapp)
    }

    build(){
        let user = getuser()
        try{
            let cd = this.parenttab.captiondiv
            let username = user.username
            if(user.privileges.admin) username = username + " [ admin ]"
            let it = IconText(username, "r")
            let itcol = "#700"
            let itfw = "normal"            
            if(user.isverified()) itcol = "#070"
            if(user.privileges.admin){
                itcol = "#770"
                itfw = "bold"
            }
            it.captiondiv.c(itcol).fw(itfw)
            it.icondiv.c(itcol)
            cd.x.a(it)
        }catch(err){console.log(err)}
        this.x
        this.usernameinput = TextInput().pad(3).w(400)
        this.usernameinputdiv = Div().disp("flex").ai("center")
        this.loginhook = Div().ml(10)
        this.usernameinputdiv.a(Labeled("Username", this.usernameinput.fs(20)).fs(24), this.loginhook)
        this.a(this.usernameinputdiv)
        if(user.isverified()){
            this.usernameinput.setText(user.username)
            this.loginhook.a(Button("Logout", this.logout.bind(this)).fs(22).bc("#faa"))
        }else if(user.beingverified()){
            app.log("Enter the Verification Code into your lichess profile and press Verify !", "info")
            this.verificationdiv = Div().mt(10).disp("flex").ai("center")
            this.vercodeinput = CopyText({dopaste: false, width: 500}).setText(user.verification.code)
            this.usernameinput.setText(user.verification.username)
            this.verificationdiv.a(
                Labeled("Verification Code",this.vercodeinput).fs(24),
                Button("Verify", this.verify.bind(this)).bc("#afa").fs(24).ml(10).pad(4).pl(20).pr(20),
                Button("Cancel verification", this.cancelverification.bind(this)).bc("#faa").fs(14).ml(20)
            )
            this.a(this.verificationdiv)
        }else{
            this.loginhook.a(Button("Login", this.login.bind(this)).fs(22).bc("#afa"))
        }
        this.useridinput = CopyText({width: 500}).fs(24).setText(user.uid)
        this.useridinputdiv = Div().disp("flex").ai("center").mt(40)
        this.useridinputdiv.a(            
            Labeled("Your user ID", this.useridinput).fs(22),
            Button("Login with User ID", this.loginwithuserid.bind(this)).fs(22).ml(10)
        )
        this.a(this.useridinputdiv)
        return this
    }
}
function Profile(){return new Profile_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// game node
class GameNode_ extends e{
    tree(){
        this.childsdiv.x
        this.movediv.bc("#ddd")
        for(let child of this.getchilds()){
            this.childsdiv.a(child.tree())
        }        
        if(this.getchilds().length > 1){
            this.childsdiv.pad(2).curlyborder()
            this.childsdiv.bc(randrgb())
        }
        if(this.id == this.parentstudy.currentnodeid){            
            let cursor = this
            while(cursor){
                cursor.movediv.bc("#afa")
                cursor = cursor.getparent()
            }                        
        }
        return this
    }

    getline(){
        let rootturn = this.parentstudy.rootnode().turn()                
        let rootfullmovenumber = this.parentstudy.rootnode().fullmovenumber()
        let origindex = rootturn == "w" ? 0 : 1
        let sans = this.id.split("_")
        let line = []
        for(let i=1; i<sans.length; i++){
            let san = sans[i]            
            let moveno = Math.floor(rootfullmovenumber + i/2)
            if(((i + origindex) % 2) == 1) san = `${moveno}. ${san}`
            else{
                if(i==1) san = rootturn == "w" ? `${moveno}. ${san}` : `${moveno}.. ${san}`                
            }
            line.push(san)
        }
        if(line.length == 0) return "*"
        return line.join(" ")
    }

    getparent(){
        if(this.parentid){
            return this.parentstudy.nodelist[this.parentid]
        }else{
            return null
        }
    }

    getchilds(){
        return this.childids.map(childid => this.parentstudy.nodelist[childid])
    }

    nodeselectedbyid(resobj){
        let study = Study({blob: resobj.setstudy, parentstudies: this.parentstudy.parentstudies})
        this.parentstudy.parentstudies.parentboard.setgamefromstudy(study)
    }

    movedivclicked(){
        api({
            "kind": "selectnodebyid",
            "id": this.parentstudy.id,
            "nodeid": this.id
        }, this.nodeselectedbyid.bind(this))
    }

    fullmovenumber(){
        return feninfo(this.fen).fullmovenumber
    }

    turn(){
        return feninfo(this.fen).turn
    }

    numberedsan(){
        if(this.id == "root") return "Root"
        let prefix = this.turn() == "w" ? ".." : "."
        let fn = this.fullmovenumber()
        if(prefix == "..") fn--
        return `${fn}${prefix} ${this.gensan}`
    }

    constructor(parentstudy, blobopt){
        super("div")
        this.container = Div().disp("flex").ai("center")
        this.movediv = Div().w(90).h(20).disp("flex").ai("center").jc("space-around").cp().curlyborder()
        this.movediv.ae("mousedown", this.movedivclicked.bind(this))
        this.movelabeldiv = Div().ff("monospace").ml(6).mr(6)
        this.movediv.a(this.movelabeldiv).ml(2).mr(2).mt(2).mb(2)
        this.childsdiv = Div().disp("flex").fd("column")
        this.container.a(this.movediv, this.childsdiv)
        this.a(this.container)
        this.parentstudy = parentstudy
        let blob = blobopt || {}
        this.id = blob.id
        this.parentid = blob.parentid
        this.fen = blob.fen
        this.gensan = blob.gensan
        this.genuci = blob.genuci
        this.priorityindex = blob.priorityindex
        this.metrainweight = blob.metrainweight
        this.opptrainweight = blob.opptrainweight
        this.childids = blob.childids
        this.movelabeldiv.html(this.numberedsan()).fw("bold").pl(3).pr(3)
        this.movelabeldiv.bc(this.turn() == "w" ? "#000" : "#fff")
        this.movelabeldiv.c(this.turn() == "w" ? "#fff" : "#000")
        if(this.id == "root") this.movelabeldiv.bc("#707")
    }
}
function GameNode(parentstudy, blobopt){return new GameNode_(parentstudy, blobopt)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// study
class Study_ extends e{
    variantdisplayname(){
        return getvariantdisplayname(this.variantkey)
    }

    build(){
        this.variantdiv.html(VARIANT_ICONS[this.variantkey])
        this.titlediv.html(this.title)
        this.container.bc(this.selected ? "#efe" : "#eee")
        this.titlediv.bc(this.selected ? "#eff" : "#eee")
        if(this.selected && this.parentstudies){
            this.parentstudies.setvariantkey(this.variantkey)
        }
        return this
    }

    rootnode(){
        return this.nodelist["root"]
    }

    getcurrentnode(){
        return this.nodelist[this.currentnodeid]
    }

    tree(){
        setseed(20)
        return this.rootnode().tree()
    }

    fromblob(blobopt){
        this.blob = blobopt || {}
        this.id = getelse(this.blob, "id", "default")
        this.title = getelse(this.blob, "title", "Default study")
        this.variantkey = getelse(this.blob, "variantkey", "standard")
        this.createdat = getelse(this.blob, "createdat", gettimesec())
        this.selected = getelse(this.blob, "selected", false)
        this.currentnodeid = getelse(this.blob, "currentnodeid", "root")
        this.flip = getelse(this.blob, "flip", false)
        this.nodelistblob = getelse(this.blob, "nodelist", {})
        this.nodelist = {}
        for(let id in this.nodelistblob) this.nodelist[id] = GameNode(this, this.nodelistblob[id])                
        this.currentnode = this.nodelist[this.currentnodeid]        
        this.pgn = getelse(this.blob, "pgn", "?")
        return this.build()
    }

    titleedited(resobj){
        if(this.parentstudies) this.parentstudies.request()
    }

    edittitle(){
        let title = window.prompt("title", this.title)
        api({
            "kind": "editstudytitle",
            "id": this.id,
            "title": title
        }, this.titleedited.bind(this))
    }

    studydeleted(resobj){
        if(this.parentstudies) this.parentstudies.request()
    }

    delete(){
        api({
            "kind": "deletestudy",
            "id": this.id
        }, this.studydeleted.bind(this))
    }

    studyselected(resobj){
        if(this.parentstudies) this.parentstudies.request()
    }

    titleclicked(){
        api({
            "kind": "selectstudy",
            "id": this.id
        }, this.studyselected.bind(this))
    }

    studycloned(){
        if(this.parentstudies) this.parentstudies.request()
    }

    clone(){
        api({
            "kind": "clonestudy",
            "id": this.id
        }, this.studycloned.bind(this))
    }

    constructor(argsopt){
        super("div")
        let args = argsopt || {}
        this.parentstudies = getelse(args, "parentstudies", null)
        this.container = Div().disp("flex").ai("center").pad(2).curlyborder()
        this.variantdiv = Div().ff("lichess").ml(6)
        this.titlediv = Div().pad(2).ff("monospace").ml(6).fs(16).w(300).ellipsis().cp()
        this.titlediv.ae("mousedown", this.titleclicked.bind(this))
        this.controldiv = Div().disp("flex")
        this.controldiv.a(            
            IconButton("Edit title", "m", this.edittitle.bind(this)).bc("#ffa"),
            IconButton("Clone", "$", this.clone.bind(this)).bc("#aff"),
            IconButton("Delete", "L", this.delete.bind(this)).bc("#faa")
            
        )
        this.container.a(this.variantdiv, this.titlediv, this.controldiv)
        this.a(this.container)
        this.fromblob(getelse(args, "blob", {}))
        this.mt(1).mb(1)
    }
}
function Study(argsopt){return new Study_(argsopt)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// studies
class Studies_ extends e{
    setstudies(resobj){
        this.studies = resobj.studies
        let ids = Object.keys(this.studies)                
        ids.sort((id1,id2) => this.studies[id1].createdat - this.studies[id2].createdat)                
        this.container.x
        let selectedstudy = null
        for(let id of ids){
            let blob = this.studies[id]
            let study = Study({blob: blob, parentstudies: this})
            if(study.selected) selectedstudy = study
            this.container.a(study)
        }
        if(selectedstudy && this.parentboard) this.parentboard.setgamefromstudy(selectedstudy)
    }

    request(){
        api({
            "kind": "getstudies"
        }, this.setstudies.bind(this))
    }

    init(){
        this.request()
    }

    studycreated(resobj){
        this.request()
    }

    createnew(){
        let title = window.prompt("Study title:", `${this.getvariantdisplayname()} study`)
        if(title) api({
            "kind": "createstudy",
            "title": title,
            "variantkey": this.getvariantkey()
        }, this.studycreated.bind(this))
    }

    getvariantkey(){
        return this.variantcombo.v()
    }

    getvariantdisplayname(){
        return getvariantdisplayname(this.getvariantkey())
    }

    setvariantkey(variantkey){
        this.variantcombo.setoptions(VARIANT_KEYS, variantkey)
    }

    constructor(argsopt){
        super("div")
        let args = argsopt || {}     
        this.parentboard = getelse(args, "parentboard", null)
        this.controlpanel = Div().pad(2).disp("flex").ai("center").jc("space-around")
        this.variantcombo = Select().ff("monospace").fs(17)
        this.controlpanel.a(
            IconButton("Create new", "O", this.createnew.bind(this), 20).bc("#afa"),
            this.variantcombo
        )
        this.container = Div().pad(2)
        this.a(this.controlpanel, this.container)
    }
}
function Studies(argsopt){return new Studies_(argsopt)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// board
function BoardControlButton(text, callback, color){
    return Button(text, callback).ff("lichess").c(color).fs(20)
}

class Board_ extends e{
    setgamefromstudy(study){
        console.log("setting game from", study)
        this.study = study
        if(this.basicboard.variantkey != study.variantkey){
            console.log("changing variant to", study.variantkey)
            this.basicboard.variantkey = study.variantkey
            this.resize(this.width, this.height)
        }
        this.basicboard.setflip(this.study.flip)
        this.basicboard.setfromfen(study.currentnode.fen)
        this.basicboard.arrowcontainer.x
        if(study.currentnode.genuci) this.basicboard.addalgebmovearrow(study.currentnode.genuci)
        let treebuild = this.study.tree()
        this.treediv.x.a(treebuild)        
        this.treediv.resize()
        this.study.currentnode.movediv.scrollIntoView({block: "center", inline: "center", behavior: "smooth"})
        this.pgntext.setText(study.pgn)
        this.studytoolshook.x
        let importurl = `${serverroot()}/importstudy/${getuser().code}/${this.study.id}/${this.study.currentnodeid}`                
        let line = this.study.getcurrentnode().getline()
        this.linetextinput = CopyText({dopaste: false}).setText(line)
        this.studytoolshook.a(Labeled("Line", this.linetextinput).setLabelWidth(150).fs(18))
        this.importlinktextinput = CopyText({dopaste: false}).setText(importurl)
        this.embedtextinput = CopyText({dopaste: false}).setText(`<iframe width="800" height="500" src="${importurl}" />`)
        this.studytoolshook.a(Labeled("Import link", this.importlinktextinput).setLabelWidth(150).fs(18))
        this.studytoolshook.a(Labeled("Embed", this.embedtextinput).setLabelWidth(150).fs(18))
        this.searchusernametextinput = CopyText({id: this.id + "/usernametextinput"})
        this.studytoolshook.a(Labeled("Search username", this.searchusernametextinput).setLabelWidth(150).fs(18))
        app.log(`${study.title} [ ${study.variantdisplayname()} ] ${line}`, "info")
        this.studytoolshook.a(IconButton("Search games of user with current moves", "y", this.searchusergames.bind(this), 20).bc("#aff").mar(5).pad(5))
    }

    searchusergames(){
        let searchusername = this.searchusernametextinput.getText()
        let eco = this.study.currentnodeid.replace("root_", "").replace(/_/g, " ")
        let url = `https://fbserv.herokuapp.com/games.html?username=${searchusername}&eco=${eco}&variant=${this.study.variantkey}&color=${this.basicboard.flipcolorname()}&oppkind=human&autocreatecode=true&autostart=true`
        window.open(url, "_blank")
    }

    resize(width, height){
        this.width = width
        this.height = height        
        this.basicboardheight = this.height - this.controlheight
        this.basicboard.resize(null, this.basicboardheight)
        this.boardwidth = this.basicboard.totalwidth()
        this.controlpanel.w(this.boardwidth).h(this.controlheight)
        this.tabpanewidth = this.width - this.boardwidth
        this.tabpane.resize(this.tabpanewidth, this.height)
        this.w(this.width).h(this.height)
    }

    algebmovemade(resobj){        
        let study = Study({blob: resobj.setstudy, parentstudies: this.studies})
        this.setgamefromstudy(study)
    }

    dragmovecallback(move){
        let algeb = move.toalgeb()
        console.log("drag move", algeb, this.study)
        if(this.study){
            api({
                "kind": "makealgebmove",
                "id": this.study.id,
                "algeb": algeb
            }, this.algebmovemade.bind(this))
        }        
    }

    back(){
        if(this.study){
            api({
                "kind": "back",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    del(){
        if(this.study){
            api({
                "kind": "delete",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    tobegin(){        
        if(this.study){
            api({
                "kind": "tobegin",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    forward(){
        if(this.study){
            api({
                "kind": "forward",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    toend(){
        if(this.study){
            api({
                "kind": "toend",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    reset(){
        if(this.study){
            api({
                "kind": "reset",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    pgnparsed(resobj){
        this.algebmovemade(resobj)
    }

    studyflipped(resobj){
        this.algebmovemade(resobj)
    }

    pgnpastecallback(pgn){
        console.log("pasted", pgn)
        api({
            "kind": "parsepgn",
            "id": this.study.id,
            "pgn": pgn
        }, this.pgnparsed.bind(this))
    }

    flip(){
        api({
            "kind": "flipstudy",
            "id": this.study.id
        }, this.studyflipped.bind(this))
    }

    constructor(argsopt){
        super("div")
        let args = argsopt || {}
        this.id = getelse(args, "id", "board")
        this.width = getelse(args, "width", 1000)
        this.height = getelse(args, "height", 400)        
        this.controlheight = getelse(args, "controlheight", 35)
        this.basicboard = BasicBoard({dragmovecallback: this.dragmovecallback.bind(this)})
        this.guicontainer = Div().disp("flex")
        this.boardcontainer = Div().disp("flex").fd("column")
        this.controlpanel = Div().bc("#ccc")
        this.navcontrolpanel = Div().pad(2).bc("#aaa").ta("center")
        this.navcontrolpanel.a(
            BoardControlButton("i", this.reset.bind(this), "#f00"),
            BoardControlButton("W", this.tobegin.bind(this), "#007"),
            BoardControlButton("Y", this.back.bind(this), "#070"),
            BoardControlButton("X", this.forward.bind(this), "#070"),
            BoardControlButton("V", this.toend.bind(this), "#007"),            
            BoardControlButton("L", this.del.bind(this), "#700"),
            BoardControlButton("B", this.flip.bind(this), "#770")
        )
        this.controlpanel.a(this.navcontrolpanel)        
        this.boardcontainer.a(this.controlpanel, this.basicboard)
        this.pgntext = CopyTextArea({pastecallback: this.pgnpastecallback.bind(this)})
        this.treediv = Div().pad(3).bimg("static/img/backgrounds/marble.jpg")
        this.treediv.resize = function(){            
            setTimeout(function(){
                this.treediv.w(this.treediv.e.scrollWidth).h(this.tabpane.contentdiv.e.scrollHeight).mw(2000).mh(1000)            
            }.bind(this), 0)
        }.bind(this)
        this.toolsdiv = Div().pad(3)        
        this.studytoolshook = Div()
        this.toolsdiv.a(this.studytoolshook)
        this.studies = Studies({parentboard: this})
        this.tabpane = TabPane("boardtabpane").settabs([
            Tab("game", "Game", this.pgntext, "C"),
            Tab("tree", "Tree", this.treediv, "$"),
            Tab("tools", "Tools", this.toolsdiv, "%"),
            Tab("studies", "Studies", this.studies, "]")
        ]).selecttab("game", USE_STORED_IF_AVAILABLE)
        if("boardtab" in params){
            console.log("forcing board tab", params.boardtab)
            this.tabpane.selecttab(params.boardtab)
        }
        this.guicontainer.a(this.boardcontainer, this.tabpane)
        this.a(this.guicontainer)
        this.resize(this.width, this.height)
    }

    init(){
        this.studies.init()
    }
}
function Board(argsopt){return new Board_(argsopt)}
////////////////////////////////////////////////////////////////////
