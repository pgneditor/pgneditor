////////////////////////////////////////////////////////////////////
// conf
const MESSAGE_WIDTH = 400
const MESSAGE_HEIGHT = 300
const MOVEDIV_HEIGHT = 20
const MOVEDIV_WIDTH = 100
////////////////////////////////////////////////////////////////////

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
const MAX_TREE_COUNT_DEPTH = 500
class GameNode_ extends e{
    measuretreerecursive(depth){
        if(depth > MAX_TREE_COUNT_DEPTH) return 0        
        let nodes = 1
        for(let childid of this.childids){                                    
            nodes += this.parentstudy.nodelist[childid].measuretreerecursive(depth + 1)            
        }        
        return nodes
    }

    measuretree(){        
        let size = this.measuretreerecursive(0) + 1        
        return size
    }

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

    maxtrainweight(kind){
        let maxweight = 0
        for(let childid of this.childids){
            let weight = this.parentstudy.nodelist[childid][kind + "trainweight"]
            if(weight > maxweight) maxweight = weight
        }
        return maxweight
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
        this.parentstudy.parentstudies.parentboard.selectnodebyid(this.parentstudy.id, this.id, this.nodeselectedbyid.bind(this))
    }

    fullmovenumber(){
        return feninfo(this.fen).fullmovenumber
    }

    turn(){
        return feninfo(this.fen).turn
    }

    oppturn(){
        let turn = feninfo(this.fen).turn
        return turn == "w" ? "b" : "w"
    }

    numberedsan(){
        if(this.id == "root") return "Root"
        let prefix = this.turn() == "w" ? ".." : "."
        let fn = this.fullmovenumber()
        if(prefix == "..") fn--
        return `${fn}${prefix} ${this.gensan}`
    }

    messagesaved(resobj){        
        if(resobj.kind == "messagesaved"){
            this.message = resobj.message
            this.parentstudy.parentstudies.parentboard.pgntext.setText(resobj.pgn)
            this.buildmessage()
            console.log("message saved", this.message)            
        }
    }

    savemessage(){
        let message = this.messagetextinput.getText()        
        this.closemessage()
        api({
            "kind": "savemessage",
            "id": this.parentstudy.id,
            "nodeid": this.id,
            "message": message
        }, this.messagesaved.bind(this))
    }

    closemessage(){
        this.messageopen = false
        this.buildmessage()
    }

    buildmessage(){
        if(this.message){
            this.messagegeardiv.html("d").c("#00f")
        }else{
            this.messagegeardiv.html("c").c("#000")
        }
        if(this.messageopen){
            this.messagediv.disp("flex")            
            this.messagediv.scrollcentersmooth()
            this.messagetextinput = CopyTextArea({width: MESSAGE_WIDTH - 10, height: MESSAGE_HEIGHT - 30})
            this.messagecontroldiv = Div().disp("flex").a(
                Button("Save", this.savemessage.bind(this)),
                Button("Close", this.closemessage.bind(this)).ml(10)
            )
            this.messagediv.x.a(this.messagetextinput, this.messagecontroldiv)            
            if(this.message) this.messagetextinput.setText(this.message)            
        }else{            
            this.messagediv.disp("none")
            this.movediv.scrollcentersmooth()
        }
    }

    hideothermessages(){        
        for(let gamenode of Object.values(this.parentstudy.nodelist)){            
            gamenode.messageopen = false
            gamenode.messagediv.disp("none")
        }
    }

    messagegeardivclicked(){
        if(!this.messageopen) this.hideothermessages()
        this.messageopen = !this.messageopen                
        this.buildmessage()
    }

    nagsstr(){
        let nagstrs = []
        for(let nag of this.nags){
            if(nag in NAGS){
                nagstrs.push(NAGS[nag])
            } else {
                nagstrs.push(`$${nag}`)
            }
        }
        return nagstrs.join(" ")
    }

    nagssaved(resobj){
        if(resobj.kind == "nagssaved"){
            this.nags = resobj.nags
            this.parentstudy.parentstudies.parentboard.pgntext.setText(resobj.pgn)
            this.buildnags()
            console.log("nags saved", this.nags)            
        }
    }

    nagchangehandler(nag, value){
        if(value){
            if(!this.nags.includes(nag)) this.nags.push(nag)
        } else {
            this.nags = this.nags.filter(x => x != nag)
        }
        api({
            "kind": "savenags",
            "id": this.parentstudy.id,
            "nodeid": this.id,
            "nags": this.nags
        }, this.nagssaved.bind(this))
    }

    closenags(){
        this.nagsgeardivclicked()
    }

    buildnags(){        
        if(this.nagsopen){
            this.nagsdiv.disp("block")
            this.nagsdiv.x            
            for(let nagstr in NAGS){
                let nag = parseInt(nagstr)                
                let symbol = NAGS[nag]
                let check = Check().w(20).h(20).set(this.nags.includes(nag)).onchange(this.nagchangehandler.bind(this, nag))
                let l = Labeled(symbol, check).w(100)
                l.captiondiv.w(35).fs(20).ff("monospace")
                this.nagsdiv.a(l)
            }
            this.nagsdiv.a(Div().mt(10).a(Button("Close", this.closenags.bind(this)).w(MESSAGE_WIDTH - 10).h(40)))
            this.nagsdiv.scrollcentersmooth()            
        }else{            
            this.nagsdiv.disp("none")
            this.movediv.scrollcentersmooth()
        }        
        this.nagsgeardiv.html(this.nagsstr())
    }

    hideothernags(){        
        for(let gamenode of Object.values(this.parentstudy.nodelist)){            
            gamenode.nagsopen = false
            gamenode.nagsdiv.disp("none")
        }
    }

    nagsgeardivclicked(){
        if(!this.nagsopen) this.hideothernags()
        this.nagsopen = !this.nagsopen
        this.buildnags()
    }

    constructor(parentstudy, blobopt){
        super("div")
        this.container = Div().disp("flex").ai("center")
        this.movecontainerdiv = Div().disp("flex")
        this.movediv = Div().mw(MOVEDIV_WIDTH).h(MOVEDIV_HEIGHT).disp("flex").ai("center").jc("space-around")
        this.movediv.curlyborder()
        this.messagegeardiv = Div().ff("lichess").cp().ml(4).mb(1).fs(14)
        this.messagehookdiv = Div().por()
        this.messagediv = Div().disp("flex").ai("center").fd("column").jc("space-around").poa().pad(3).ml(15)
        this.messagediv.w(MESSAGE_WIDTH).h(MESSAGE_HEIGHT).mt(20).bc("#eee").zi(10).curlyborder()        
        this.messagehookdiv.a(this.messagediv)
        this.messageopen = false        
        this.nagsopen = false
        this.messagegeardiv.ae("mousedown", this.messagegeardivclicked.bind(this))
        this.movelabeldiv = Div().ff("monospace").ml(1).mr(1).cp()
        this.movelabeldiv.ae("mousedown", this.movedivclicked.bind(this))
        this.nagsgeardiv = Div().ml(2).mr(4).ff("monospace").bc("#aff").mw(10).mh(10).cp()
        this.nagsgeardiv.ae("mousedown", this.nagsgeardivclicked.bind(this))
        this.nagshookdiv = Div().por()
        this.nagsdiv = Div().w(MESSAGE_WIDTH).h(MESSAGE_HEIGHT + 40).mt(20).bc("#eee").zi(10).curlyborder().poa().pad(10)
        this.nagshookdiv.a(this.nagsdiv)
        this.movediv.a(this.messagegeardiv, this.movelabeldiv, this.nagsgeardiv).ml(2).mr(2).mt(2).mb(2)
        this.movecontainerdiv.a(this.messagehookdiv, this.nagshookdiv, this.movediv)
        this.childsdiv = Div().disp("flex").fd("column")
        this.container.a(this.movecontainerdiv, this.childsdiv)
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
        this.drawings = blob.drawings
        this.message = blob.message
        this.duration = blob.duration
        this.nags = blob.nags || []
        this.movelabeldiv.html(this.numberedsan()).fw("bold").pl(3).pr(3)
        this.movelabeldiv.bc(this.turn() == "w" ? "#000" : "#fff")
        this.movelabeldiv.c(this.turn() == "w" ? "#fff" : "#000")
        this.nagsgeardiv.html(this.nagsstr())
        if(this.id == "root") this.movelabeldiv.bc("#707")
        this.ac("unselectable")
        this.buildmessage()
        this.buildnags()
    }
}
function GameNode(parentstudy, blobopt){return new GameNode_(parentstudy, blobopt)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// study
class Study_ extends e{
    treesize(){
        return this.rootnode().measuretree()
    }

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
        console.log("title edited", resobj)
        if(this.parentstudies){
            this.parentstudies.request()
            this.parentstudies.parentboard.selectnodebyid()
        }
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
        if(!textconfirm(`delete this study`, "delete")) return
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

    download(){
        downloadcontent(this.title + ".pgn", this.pgn)
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
            IconButton("Download", "x", this.download.bind(this)).bc("#faf"),
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

class WeightSelector_ extends e{    
    trainweightset(resobj){
        console.log("train weight set", resobj)
        if(resobj.kind == "trainweightset"){
            this.parentbookitem.parentboard.pgntext.setText(resobj.pgn)
        }        
    }

    weightchanged(value){
        api({
            "kind": "settrainweight",
            "id": this.parentbookitem.parentboard.study.id,
            "nodeid": this.parentbookitem.nodeid,
            "weightkind": this.kind,
            "weight": parseInt(value)
        }, this.trainweightset.bind(this))
    }

    constructor(parentbookitem, kind){
        super("div")
        this.kind = kind
        this.key = this.kind + "trainweight"
        this.weight = parentbookitem.blob[this.key]                
        this.parentbookitem = parentbookitem
        this.disp("flex").ai("center").jc("space-around").pad(2).fs(24).w(100).cp().bc("#ddd").mar(3).ta("center").ff("momospace")
        this.weightselect = Select().setoptions([...Array(11).keys()].map(x => [x, x]), this.weight).onchange(this.weightchanged.bind(this)).fs(16)
        this.a(this.weightselect)
    }
}
function WeightSelector(parentbookitem, kind){return new WeightSelector_(parentbookitem, kind)}

class BookItem_ extends e{
    nodeselectedbyid(resobj){
        let study = Study({blob: resobj.setstudy, parentstudies: this.parentboard.studies})
        this.parentboard.setgamefromstudy(study)
    }

    sandivclicked(){
        console.log("book move clicked", this.san)
        this.parentboard.selectnodebyid(this.parentboard.study.id, this.nodeid, this.nodeselectedbyid.bind(this))
    }

    constructor(parentboard, blob){
        super("div").mar(2).disp("flex").bc("#eee")
        this.blob = blob
        this.parentboard = parentboard
        this.san = blob.gensan        
        this.nodeid = blob.id
        this.sandiv = Div().pad(2).fs(24).w(100).html(this.san).cp().bc("#ddd").mar(3).ta("center").c("#007").fw("bold")
        this.sandiv.ae("mousedown", this.sandivclicked.bind(this))                
        this.a(
            this.sandiv,
            WeightSelector(this, "me"),
            WeightSelector(this, "opp")
        )
    }
}
function BookItem(parentboard, blob){return new BookItem_(parentboard, blob)}

////////////////////////////////////////////////////////////////////
const SOFT_CONFIRM_TREE_SIZE_LIMIT = 10
const HARD_CONFIRM_TREE_SIZE_LIMIT = 50

class Board_ extends e{
    maxboardsizechanged(){
        this.rebuild()
    }

    setgamefromstudy(study){
        console.log("setting game from", study)
        this.study = study
        if(this.basicboard.variantkey != study.variantkey){
            console.log("changing variant to", study.variantkey)
            this.basicboard.variantkey = study.variantkey
            this.resize(this.width, this.height)
        }
        this.basicboard.setflip(this.study.flip)
        this.basicboard.setfromfen(this.study.currentnode.fen)
        this.fentext.setText(this.study.currentnode.fen)
        this.basicboard.arrowcontainer.x
        this.basicboard.drawcanvas.clear()
        this.basicboard.setgenuci(study.currentnode.genuci)
        this.basicboard.setdrawings(this.study.currentnode.drawings)
        this.builddrawingsorganizer()
        let treebuild = this.study.tree()
        this.treediv.x.a(treebuild)        
        this.treediv.resize()
        this.study.currentnode.messagegeardiv.scrollcentersmooth()
        this.pgntext.setText(study.pgn)
        this.studytoolshook.x
        let importurl = `${serverroot()}/importstudy/${getuser().code}/${this.study.id}/${this.study.currentnodeid}`                
        let line = this.study.getcurrentnode().getline()
        this.linetextinput = CopyText({dopaste: false}).setText(line)
        this.studytoolshook.a(Labeled("Line", this.linetextinput).setLabelWidth(150).fs(18))
        this.mergetextinput = CopyTextArea({height: 80, pastecallback: this.mergemoves.bind(this)})
        this.studytoolshook.a(Labeled("Merge moves", this.mergetextinput).setLabelWidth(150).fs(18))
        this.importlinktextinput = CopyText({dopaste: false}).setText(importurl)
        this.embedtextinput = CopyText({dopaste: false}).setText(`<iframe width="800" height="500" src="${importurl}" />`)
        this.studytoolshook.a(Labeled("Import link", this.importlinktextinput).setLabelWidth(150).fs(18))
        this.studytoolshook.a(Labeled("Embed", this.embedtextinput).setLabelWidth(150).fs(18))
        this.searchusernametextinput = CopyText({id: this.id + "/usernametextinput"})
        this.studytoolshook.a(Labeled("Search username", this.searchusernametextinput).setLabelWidth(150).fs(18))
        app.log(`${study.title} [ ${study.variantdisplayname()} ] ${line}`, "info")
        this.studytoolshook.a(IconButton("Search games of user with current moves", "y", this.searchusergames.bind(this), 20).bc("#aff").mar(5).pad(5))
        this.dl = A().href("#").download("board.png").html("Export board screenshot").ae("click", this.dlBoard.bind(this)).fs(26)        
        this.studytoolshook.a(Div().pad(10).a(this.dl))
        this.withcommentscheck = Check({id: `${this.id}/withcommentscheck`})
        this.studytoolshook.a(
            IconButton("Init GIF", "i", this.initgif.bind(this), 24).ml(5).bc("#faa"),
            IconButton("Add frame", "O", this.addframe.bind(this), 24).ml(15).bc("#afa"),
            IconButton("Render", "F", this.rendergif.bind(this), 24).ml(15).bc("#ffa"),            
        )
        if(this.durationtextinput) this.durationtextinput.setText(`${this.study.currentnode.duration}`)
        this.maxboardsizeselect = Select().setid(`${this.id}/maxboardsizeselect`).setoptions([...Array(27).keys()].map(x => [200 + 50 * x, 200 + 50 *x]), 1000).onchange(this.maxboardsizechanged.bind(this))
        this.studytoolshook.a(Div().mt(5).a(
            Labeled("Add comments to frame", this.withcommentscheck),
            Labeled("Max board size", this.maxboardsizeselect)
        ))
        this.buildbook()
        if(!(this.trainroot in this.study.nodelist)){
            this.trainroot = "root"
            this.settrainrootlabel()
        }

        console.log("tree size", this.currenttreesize, this.studytreesize)

        ////////////////////////////////////////////////////////////////////
        this.dotrain()
        ////////////////////////////////////////////////////////////////////
    }

    get currenttreesize(){
        return this.currentnode.measuretree()
    }

    get studytreesize(){
        return this.study.treesize()
    }

    get currentnode(){
        return this.study.currentnode
    }

    buildbook(){
        this.bookdiv.x
        let sortedids = this.study.currentnode.childids.slice()
        sortedids.sort((ida, idb) => this.study.nodelist[idb].metrainweight - this.study.nodelist[ida].metrainweight)
        for(let childid of sortedids){
            let child = this.study.nodelist[childid]
            let bookitem = BookItem(this, child)
            this.bookdiv.a(bookitem)
        }
    }

    initgif(){
        this.gif = new GIF({
            workers: 2,
            quality: 10
        })

        this.gif.on('finished', function(blob) {
            window.open(URL.createObjectURL(blob));
        })
        
        console.log("created gif", this.gif)
    }

    getcanvas(){
        if(this.withcommentscheck.checked){
            let boardcanvas = this.basicboard.getcanvas()            
            let bcw = boardcanvas.getWidth()
            let bch = boardcanvas.getHeight()
            let framecanvas = Canvas().setWidth(2 * bcw).setHeight(bch)
            framecanvas.ctx.drawImage(boardcanvas.e, 0, 0)
            let commentcanvas = Canvas().setWidth(bcw).setHeight(bch)
            commentcanvas.ctx.fillStyle = "#FFFFFF"
            commentcanvas.ctx.fillRect(0, 0, bcw, bch)
            commentcanvas.ctx.textBaseline = "top"
            commentcanvas.ctx.fillStyle = "#000000"
            this.commentfontsize = 40
            this.commentmargin = 15
            commentcanvas.ctx.font = `${this.commentfontsize}px serif`
            let message = this.study.currentnode.message
            if(message) commentcanvas.renderText(message, bcw - 2 * this.commentmargin, 45, this.commentmargin, this.commentmargin)
            framecanvas.ctx.drawImage(commentcanvas.e, bcw, 0)
            return framecanvas
        }else{
            return this.basicboard.getcanvas()
        }
    }

    addframe(){
        let framecanvas = this.getcanvas()
        this.gif.addFrame(framecanvas.e, {delay: this.study.currentnode.duration})
    }

    rendergif(){
        this.gif.render()
    }

    dlBoard(){
        let boardcanvas = this.getcanvas()                
        this.dl.href(boardcanvas.downloadHref("board", "png"))
    }

    movesmerged(resobj){
        this.algebmovemade(resobj)
    }

    mergemoves(){
        let moves = this.mergetextinput.getText()
        console.log("merge", moves)
        api({
            "kind": "mergemoves",
            "id": this.study.id,
            "moves": moves
        }, this.movesmerged.bind(this))
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
        this.maxboardsize = getLocalElse(`${this.id}/maxboardsizeselect`, 1000)
        if(this.basicboardheight > this.maxboardsize) this.basicboardheight = this.maxboardsize
        this.basicboard.resize(null, this.basicboardheight)
        this.boardwidth = this.basicboard.totalwidth()
        this.controlpanel.w(this.boardwidth).h(this.controlheight)
        this.tabpanewidth = this.width - this.boardwidth
        this.tabpane.resize(this.tabpanewidth, this.height)
        this.w(this.width).h(this.height)
        this.drawmode = !this.drawmode
        this.switchdraw()
        this.fentext = CopyText({pastecallback: this.fenpastecallback.bind(this), height: 15, width: this.basicboard.totalwidth() - 60})
        this.fentext.setText(this.basicboard.fen)
        this.fentexthook.x.a(this.fentext)
    }

    rebuild(){
        this.resize(this.width, this.height)
    }

    algebmovemade(resobj){        
        let study = Study({blob: resobj.setstudy, parentstudies: this.studies})
        this.setgamefromstudy(study)
    }

    dragmovecallback(move){
        let prompiece = this.prompieceselect.v()
        this.buildprompieceselect()
        let algeb = move.toalgeb() + prompiece        
        console.log("drag move", algeb, this.study)
        if(this.trainon()){
            if(this.metrainturn()){
                console.log("me train turn")
                let maxweight = 0
                let moveok = false
                let mymoveweight = 0
                for(let childid of this.study.currentnode.childids){
                    let child = this.study.nodelist[childid]
                    let moveweight = child.metrainweight
                    if(moveweight > 0){                        
                        if(child.genuci == algeb){
                            moveok = true
                            mymoveweight = moveweight
                        }
                    }
                    if(moveweight > maxweight) maxweight = moveweight
                }
                console.log(mymoveweight, maxweight)
                if(moveok){
                    if(mymoveweight == maxweight){

                    }else{
                        window.alert("Good move, but keep in mind, there is a better move !")
                    }
                }else{
                    this.basicboard.setfromfen(this.basicboard.fen)
                    if(maxweight > 0){                        
                        window.alert("Wrong move !")                    
                        return
                    }else{
                        window.alert("Line completed. Well done !")                        
                        this.traintobegin()
                        return
                    }
                }
            }
        }
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
        let currenttreesize = this.currenttreesize
        if(currenttreesize >= SOFT_CONFIRM_TREE_SIZE_LIMIT) if(!textconfirm(`delete line with ${currenttreesize} move(s)`, "delete", currenttreesize < HARD_CONFIRM_TREE_SIZE_LIMIT)) return
        if(this.study){
            api({
                "kind": "delete",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    selectnodebyid(idopt, nodeidopt, callbackopt){
        let id = idopt || this.study.id
        let nodeid = nodeidopt || this.study.currentnodeid
        let callback = callbackopt || this.algebmovemade.bind(this)
        api({
            "kind": "selectnodebyid",
            "id": id,
            "nodeid": nodeid
        }, callback)
    }

    tobegin(){        
        if(this.study){
            if(this.study.currentnodeid == "root"){
                console.log("tobegin ignored, already at root")
            }else{
                api({
                    "kind": "tobegin",
                    "id": this.study.id                
                }, this.algebmovemade.bind(this))
            }            
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
        let studytreesize = this.studytreesize
        if(studytreesize >= SOFT_CONFIRM_TREE_SIZE_LIMIT) if(!textconfirm(`reset the study and delete ${studytreesize} move(s)`, "reset", studytreesize < HARD_CONFIRM_TREE_SIZE_LIMIT)) return
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

    deletedrawing(){
        this.basicboard.deletedrawing()
    }

    builddrawingsorganizer(){        
        if(this.drawingsorganizer) this.drawingsorganizer.setitems(this.basicboard.drawings.slice().reverse().map(blob => Drawing(blob)))
    }

    switchdraw(){
        this.drawmode = !this.drawmode
        this.drawcontrolmargin = 40
        this.drawpanelwidth = 460
        this.drawlabeledwidth = this.drawpanelwidth - 55
        this.groupwidth = 220
        this.labelwidth = 100
        this.drawpanelhook.x.t(this.drawcontrolmargin).l(this.basicboard.totalwidth() + 3)
        if(this.drawmode){            
            this.drawpanel = Div().w(this.drawpanelwidth).ta("center").h(this.height - this.drawcontrolmargin).bimg("static/img/backgrounds/marble.jpg").ovf("scroll")
            this.drawcontrolpanel = Div().pad(3).mar(10).mb(5).curlyborder().bc("#ddd")
            this.kindgroup = RadioGroup().setid(`${this.id}/drawkindgroup`).setselcallback(this.basicboard.setdrawkind.bind(this.basicboard)).setitems([
                IconButton("Arrow", "N", null, 18).setid("arrow"),
                IconButton("Circle", "K", null, 18).setid("circlemark")
            ]).fs(18)
            this.colorgroup = RadioGroup().setid(`${this.id}/drawcolorgroup`).setselcallback(this.basicboard.setdrawcolor.bind(this.basicboard)).setitems([
                Button("Green").fs(14).curlyborder().setselbc("#afa").c("#070").setid("green"),
                Button("Blue").fs(14).curlyborder().setselbc("#aaf").c("#007").setid("blue"),
                Button("Red").fs(14).curlyborder().setselbc("#faa").c("#700").setid("red")
            ])
            this.thicknessgroup = RadioGroup().setid(`${this.id}/drawthicknessgroup`).setselcallback(this.basicboard.setdrawthickness.bind(this.basicboard)).setitems([
                Button("Medium").fs(14).curlyborder().fw("normal").setid("medium"),                
                Button("Thin").fs(14).curlyborder().fw("normal").c("#777").setid("thin"),
                Button("Thick").fs(14).curlyborder().fw("bold").setid("thick")
            ])
            this.durationtextinput = TextInput().pad(2).pl(5).fs(16).fw("bold").onchange(this.durationchanged.bind(this)).setText(`${this.study.currentnode.duration}`)
            this.shapelabeled = Labeled("Shape", this.kindgroup).fs(24).mar(1).w(this.drawlabeledwidth)
            this.shapelabeled.captiondiv.w(this.labelwidth)
            this.kindgroup.w(this.groupwidth)
            this.colorlabeled = Labeled("Color", this.colorgroup).fs(16).mar(1).w(this.drawlabeledwidth)
            this.colorlabeled.captiondiv.w(this.labelwidth)
            this.colorgroup.w(this.groupwidth)
            this.thicknesslabeled = Labeled("Thickness", this.thicknessgroup).fs(16).mar(1).w(this.drawlabeledwidth)
            this.thicknesslabeled.captiondiv.w(this.labelwidth)
            this.thicknessgroup.w(this.groupwidth)
            this.framedurationlabeled = Labeled("Duration", this.durationtextinput).fs(16).mar(1).w(this.drawlabeledwidth)
            this.framedurationlabeled.captiondiv.w(this.labelwidth)
            this.durationtextinput.w(this.groupwidth - 10)
            this.drawcontrolpanel.a(
                this.shapelabeled,
                this.colorlabeled,
                this.thicknesslabeled,
                this.framedurationlabeled,
                Div().a(IconButton("Delete", "L", this.deletedrawing.bind(this), 20).pad(5).w(this.drawpanelwidth - 70).mar(2).bc("#fbb"))
            )                       
            this.drawingsorganizer = ListOrganizer().ml(10).mr(10).onchange(this.drawingsorganizerchanged.bind(this))
            this.builddrawingsorganizer()
            this.drawpanel.a(this.drawcontrolpanel, this.drawingsorganizer)
            this.drawpanelhook.a(this.drawpanel)
        }else{            
            this.basicboard.setdrawkind(null)
        }
        this.switchdrawbutton.setselected(this.drawmode)
    }

    drawingsorganizerchanged(){
        let newdrawings = this.drawingsorganizer.items.slice().reverse().map(item => item.blob)
        console.log("drawings reorganized", newdrawings)
        this.drawingschanged(newdrawings)
    }

    durationsaved(resobj){
        if(resobj.kind == "durationsaved"){
            let duration = resobj.duration
            //this.durationtextinput.setText(`${duration}`)
        }
    }

    durationchanged(){
        let duration = parseInt(this.durationtextinput.getText())
        if(isNaN(duration)) duration = 1000
        api({
            "kind": "saveduration",
            "id": this.study.id,
            "nodeid": this.study.currentnodeid,
            "duration": duration
        }, this.durationsaved.bind(this))
    }

    drawingsset(resobj){
        console.log("drawings set", resobj)        
    }

    drawingschanged(drawings){
        console.log("drawings changed", drawings)
        this.basicboard.setdrawings(drawings)        
        this.builddrawingsorganizer()
        api({
            "kind": "setdrawings",
            "id": this.study.id,
            "drawings": drawings
        }, this.drawingsset.bind(this))
    }

    buildprompieceselect(){
        this.prompieceselect = Select().setoptions([
            ["", "Prom"],
            ["q", "Queen"],
            ["r", "Rook"],
            ["b", "Bishop"],
            ["n", "Knight"],
            ["k", "King"]
        ], "")
        this.prompieceselecthook.x.a(this.prompieceselect)
    }

    fenpastecallback(){
        let fen = this.fentext.getText()        
        let pgn = `[FEN "${fen}"]`
        console.log("fen pasted", fen, "parsing", pgn)
        api({
            "kind": "parsepgn",
            "id": this.study.id,
            "pgn": pgn
        }, this.pgnparsed.bind(this))
    }

    openurl(url){
        window.open(url, "_blank")
    }

    analyzelichess(){
        this.openurl(`https://lichess.org/analysis/${this.basicboard.variantkey}/${this.basicboard.fen}`)
    }

    analyzefbserv(){
        this.openurl(`https://fbserv2.herokuapp.com/analysis/${this.basicboard.variantkey}/${this.basicboard.fen}`)
    }

    constructor(argsopt){
        super("div")
        this.initgif()
        let args = argsopt || {}
        this.trainroot = "root"
        this.id = getelse(args, "id", "board")
        this.width = getelse(args, "width", 1000)
        this.height = getelse(args, "height", 400)        
        this.controlheight = getelse(args, "controlheight", 56)
        this.basicboard = BasicBoard({
            dragmovecallback: this.dragmovecallback.bind(this),
            drawingschangedcallback: this.drawingschanged.bind(this)
        })
        this.guicontainer = Div().disp("flex")
        this.boardcontainer = Div().disp("flex").fd("column").por()
        this.controlpanel = Div().bc("#ccc")
        this.navcontrolpanel = Div().pad(2).bc("#aaa").disp("flex").ai("center").jc("space-around")
        this.switchdrawbutton = BoardControlButton("m", this.switchdraw.bind(this), "#707")        
        this.buttoncontrolpanel = Div().disp("flex").ai("center").a(
            BoardControlButton("i", this.reset.bind(this), "#f00"),
            BoardControlButton("W", this.tobegin.bind(this), "#007"),
            BoardControlButton("Y", this.back.bind(this), "#070"),
            BoardControlButton("X", this.forward.bind(this), "#070"),
            BoardControlButton("V", this.toend.bind(this), "#007"),            
            BoardControlButton("L", this.del.bind(this), "#700"),
            BoardControlButton("B", this.flip.bind(this), "#770"),
            this.switchdrawbutton
        )
        this.prompieceselecthook = Div()
        this.buildprompieceselect()
        this.navcontrolpanel.a(
            this.prompieceselecthook,            
            this.buttoncontrolpanel
        )
        this.fencontrolpanel = Div().pad(1).bc("#bbb").disp("flex").ai("center").jc("space-around").mt(2)
        this.fentexthook = Div()        
        this.fencontrolpanel.a(
            this.fentexthook,
            Button(" L ", this.analyzelichess.bind(this)).fs(10).pad(0),
            Button(" F ", this.analyzefbserv.bind(this)).fs(10).pad(0)
        )
        this.controlpanel.a(this.navcontrolpanel, this.fencontrolpanel)        
        this.drawpanelhook = Div().poa()
        this.boardcontainer.a(this.controlpanel, this.basicboard, this.drawpanelhook)
        this.drawmode = true
        this.switchdraw()
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
        this.bookdiv = Div().pad(3)
        this.traindiv = Div().pad(3)
        this.trainmode = "none"
        this.buildtraindiv()
        this.tabpane = TabPane("boardtabpane").settabs([
            Tab("game", "Game", this.pgntext, "C"),
            Tab("tree", "Tree", this.treediv, "$"),
            Tab("book", "Book", this.bookdiv, "?"),
            Tab("train", "Train", this.traindiv, "-"),
            Tab("tools", "Tools", this.toolsdiv, "%"),
            Tab("studies", "Studies", this.studies, "]")
        ]).selecttab("game", USE_STORED_IF_AVAILABLE)
        if("boardtab" in params){
            console.log("forcing board tab", params.boardtab)
            this.tabpane.selecttab(params.boardtab)
        }
        this.boardcontainer.zi(100)
        this.guicontainer.a(this.boardcontainer, this.tabpane)
        this.a(this.guicontainer)
        this.resize(this.width, this.height)
    }

    trainon(){
        return this.trainmode != "none"
    }

    trainturn(){
        return ( this.trainmode == this.study.currentnode.turn() )
    }

    opptrainturn(){
        return ( this.trainmode == this.study.currentnode.oppturn() )
    }

    metrainturn(){
        return ( this.trainmode == this.study.currentnode.turn() )
    }

    dotrain(){
        let checktrainroot = this.checktrainroot
        this.checktrainroot = false
        if(this.study && this.trainon()){
            if(checktrainroot){
                if(this.study.currentnodeid != this.trainroot){
                    this.traintobegin()
                    return
                }
            }
            let turn = this.study.currentnode.turn()
            if(this.opptrainturn()){
                console.log("opp train turn", turn)            
                let candidates = []
                for(let childid of this.study.currentnode.childids){
                    let child = this.study.nodelist[childid]
                    if(child.opptrainweight > 0){
                        if(child.maxtrainweight("me") > 0){
                            for(let i=0;i<child.opptrainweight;i++) candidates.push(child)
                        }                        
                    }
                }
                if(candidates.length > 0){                    
                    let ri = Math.floor(Math.random() * candidates.length)
                    let selected = candidates[ri]
                    console.log("selected", ri, selected)
                    api({
                        "kind": "makealgebmove",
                        "id": this.study.id,
                        "algeb": selected.genuci
                    }, this.algebmovemade.bind(this))
                }else{
                    window.alert("Line completed. Well done !")                    
                    this.traintobegin()
                    return
                }
            }else{
                console.log("checking")
                if(this.study.currentnode.maxtrainweight("me") > 0){                    
                    
                }else{
                    window.alert("Line completed. Well done !")                                        
                    this.traintobegin()
                    return
                }
            }            
        }
    }

    traintobegin(){
        if(this.trainroot in this.study.nodelist){
            if(this.study.currentnodeid == this.trainroot){
                console.log("train to begin ignored, already at train root")
            }else{
                this.selectnodebyid(this.study.id, this.trainroot)
            }            
        }else{
            this.tobegin()
        }
    }

    trainmodechanged(){
        this.checktrainroot = true
        this.trainmode = this.trainmodeselect.v()
        console.log("train mode changed to", this.trainmode)
        if(((this.trainmode == "w")&&(this.basicboard.flip))||((this.trainmode == "b")&&(!this.basicboard.flip))){
            this.flip()
        }else{
            this.dotrain()
        }        
    }

    settrainroot(){
        if(this.study){
            this.trainroot = this.study.currentnodeid
            this.settrainrootlabel()
        }
    }

    settrainrootlabel(){
        this.trainrootlabel.html(this.trainroot.replace(/_/g, " "))
    }

    buildtraindiv(){
        this.trainmodeselect = Select().setoptions([
            ["none", "Training off"],
            ["w", "Train white"],
            ["b", "Train black"]
        ], this.trainmode).fs(20).ff("monospace").pad(2).onchange(this.trainmodechanged.bind(this))
        this.traindiv.x
        this.trainrootdiv = Div().mt(10).ml(5)
        this.trainrootlabel = Div().ff("monospace")
        this.settrainrootlabel()
        this.trainrootdiv.a(
            Div().a(Labeled("Train root", this.trainrootlabel)),
            Button("Set train root to current position", this.settrainroot.bind(this)).mt(5).ml(5)
        )
        this.traindiv.a(
            this.trainmodeselect,
            this.trainrootdiv
        )
    }

    init(){
        this.studies.init()
    }
}
function Board(argsopt){return new Board_(argsopt)}
////////////////////////////////////////////////////////////////////
