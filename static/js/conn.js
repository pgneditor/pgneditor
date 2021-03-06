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
const MAX_SUCCESS = 10

class GameNode_ extends e{
    get siblings(){
        let siblings = []
        if(this.parentid){
            let parent = this.getparent()
            for(let child of parent.getchilds()){
                if(child.id != this.id){
                    siblings.push(child)
                }
            }
        }
        return siblings
    }

    get haschild(){
        return this.childids.length > 0
    }

    get hasmetrainchild(){
        for(let child of this.getchilds()) if(child.metrainweight > 0) return true
        return false
    }

    childidscmpfunc(ida, idb){
        let nodea = this.parentstudy.nodelist[ida]
        let nodeb = this.parentstudy.nodelist[idb]
        let mea = nodea.metrainweight
        let meb = nodeb.metrainweight
        if(mea != meb) return meb - mea
        let oppa = nodea.opptrainweight
        let oppb = nodeb.opptrainweight
        if(oppa != oppb) return oppb - oppa
        return nodeb.sortindex - nodea.sortindex
    }

    sortedchildids(){                
        for(let i in this.childids){
            this.parentstudy.nodelist[this.childids[i]].sortindex == i
        }
        this.childids.sort(this.childidscmpfunc.bind(this))
        return this.childids
    }

    algebmovenodeid(algeb){
        for(let nodeid of this.childids){
            if(this.parentstudy.nodelist[nodeid].genuci == algeb) return nodeid
        }
        return null
    }

    toendid(){
        let forwardid = this.forwardid()
        if(forwardid) return this.parentstudy.nodelist[forwardid].toendid()
        return this.id
    }

    forwardid(){
        if(this.childids.length == 0) return null
        return this.childids[0]
    }

    backid(){
        if(!this.parentid) return null
        return this.parentid
    }

    measuretreerecursive(depth){
        if(depth > MAX_TREE_COUNT_DEPTH) return 0        
        let nodes = 0
        for(let childid of this.childids){                                    
            nodes++
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
        return this.sortedchildids().map(childid => this.parentstudy.nodelist[childid])
    }

    getgrandchilds(){
        let grandchilds = []
        for(let child of this.getchilds()){
            for(let grandchild of child.getchilds()){
                grandchilds.push(grandchild)
            }
        }
        return grandchilds
    }

    getminsuccessrecursive(baseturn){                  
        let minsuccess = null
        if(this.turn() == baseturn){
            for(let child of this.getchilds()){
                if(child.opptrainweight > 0){
                    let chminsuccess = child.getminsuccessrecursive(baseturn)                    
                    if(chminsuccess != null){
                        if(minsuccess == null){
                            minsuccess = chminsuccess
                        }else{
                            if(chminsuccess > minsuccess){
                                minsuccess = chminsuccess
                            }
                        }
                    }
                }
            }
        }else{
            for(let child of this.getchilds()){
                if(child.metrainweight > 0){
                    let chminsuccess = child.getminsuccessrecursive(baseturn)
                    if(chminsuccess != null){
                        if(minsuccess == null){
                            minsuccess = chminsuccess
                        }else{
                            if(chminsuccess < minsuccess){
                                minsuccess = chminsuccess
                            }
                        }
                    }
                }
            }
        }        
        if((this.turn() == baseturn)&&(this.hasmetrainchild)){
            if(minsuccess == null) minsuccess = this.success
            else if(this.success < minsuccess) minsuccess = this.success
        }    
        return minsuccess
    }

    getminsuccess(){
        return this.getminsuccessrecursive(this.turn())
    }

    movedivclicked(){
        this.parentstudy.parentstudies.parentboard.selectnodebyid(this.parentstudy.id, this.id)
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
            this.parentstudy.parentstudies.parentboard.setpgn(resobj.pgn)
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
            this.messagetextinput.ae("keydown", function(ev){
                ev.stopPropagation()
            })
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
            this.parentstudy.parentstudies.parentboard.setpgn(resobj.pgn)
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
        this.zobristkeyhex = blob.zobristkeyhex
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
        this.success = getelse(blob, "success", 0)
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
    transpositions(){
        let currentnode = this.getcurrentnode()
        let transpositions = []
        for(let nodeid in this.nodelist){
            if(nodeid != this.currentnode.id){
                let node = this.nodelist[nodeid]
                if(node.zobristkeyhex == currentnode.zobristkeyhex){
                    transpositions.push(nodeid)
                }
            }            
        }
        transpositions.sort((tra, trb) => this.nodelist[trb].childids.length - this.nodelist[tra].childids.length)
        return transpositions
    }

    setcurrentnode(nodeid){
        this.currentnodeid = nodeid
        this.currentnode = this.nodelist[this.currentnodeid]
    }

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
        if(this.parentstudies){
            if(this.parentstudies.parentboard){
                let parentboardstudy = this.parentstudies.parentboard.study
                if(parentboardstudy){
                    if(this.selected){
                        downloadcontent(this.title + ".pgn", parentboardstudy.pgn)
                    }else{
                        window.alert("Select this study first to be able to download it !")
                    }
                }                
            }            
        }        
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
            this.parentbookitem.parentboard.setpgn(resobj.pgn)
            this.parentbookitem.parentboard.buildbook()
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
        let weightnode = this.parentbookitem.parentboard.study.nodelist[this.parentbookitem.nodeid]        
        weightnode[this.kind + "trainweight"] = parseInt(value)
        console.log("weightnode", weightnode)
    }

    constructor(parentbookitem, kind){
        super("div")
        this.kind = kind
        this.key = this.kind + "trainweight"
        this.weight = parentbookitem.gamenode[this.key]                
        this.parentbookitem = parentbookitem
        this.disp("flex").ai("center").jc("space-around").pad(2).fs(24).w(100).cp().bc("#ddd").mar(3).ta("center").ff("momospace")
        this.weightselect = Select().setoptions([...Array(11).keys()].map(x => [x, x]), this.weight).onchange(this.weightchanged.bind(this)).fs(16)
        this.a(this.weightselect)
    }
}
function WeightSelector(parentbookitem, kind){return new WeightSelector_(parentbookitem, kind)}

class BookItem_ extends e{
    highlight(highlight){
        if(highlight){
            this.sandiv.bc("#7f7")
        }else{
            this.sandiv.bc("#ddd")
        }
    }

    sandivclicked(){
        console.log("book move clicked", this.san)
        this.parentboard.selectnodebyid(this.parentboard.study.id, this.nodeid)
    }

    buildsuccess(){
        this.successdivhook.x
        let minsuccess = this.gamenode.getminsuccess()        
        if(minsuccess != null){
            this.successdiv.html(`${minsuccess}`)
            if(minsuccess > 0){
                this.successdiv.c("#070")
            }else{
                this.successdiv.c("#700")
            }
            this.successdivhook.a(this.successdiv)
        }
    }

    constructor(parentboard, gamenode){
        super("div").mar(2).disp("flex").bc("#eee").ai("center")        
        this.gamenode = gamenode
        this.parentboard = parentboard
        this.san = gamenode.gensan        
        this.nodeid = gamenode.id
        this.success = gamenode.success
        this.sandiv = Div().pad(2).fs(24).w(100).html(this.san).cp().mar(3).ta("center").c("#007").fw("bold")
        this.sandiv.ae("mousedown", this.sandivclicked.bind(this))                
        this.successdiv = Div().w(80).ml(10).pad(2).fs(20).ff("monospace").bc("#ddd").ta("center")
        this.successdivhook = Div()
        this.buildsuccess()
        this.a(
            this.sandiv,
            WeightSelector(this, "me"),
            WeightSelector(this, "opp"),
            this.successdivhook
        )                
        this.highlight(false)        
    }
}
function BookItem(parentboard, gamenode){return new BookItem_(parentboard, gamenode)}

class Book_ extends e{
    moveselected(dir){
        if(this.bookitems.length == 0){
            this.selectedindex = -1
            return
        }
        this.selectedindex += dir        
        if(this.selectedindex >= this.bookitems.length) this.selectedindex = 0
        if(this.selectedindex < 0) this.selectedindex = this.bookitems.length - 1
        this.select()
    }

    click(indexopt){
        if(this.bookitems.length == 0) return
        let index = indexopt || this.selectedindex
        this.selectedindex = index        
        this.select()
        this.bookitems[this.selectedindex].sandivclicked()
    }

    keyhandler(ev){
        let code = ev.code
        if(ev.ctrlKey){
            if(code == "ArrowRight") this.parentboard.toend()
            else if(code == "ArrowLeft") this.parentboard.tobegin()
        }else{
            if(code == "ArrowUp") this.moveselected(-1)
            else if(code == "ArrowDown") this.moveselected(1)
            else if(code == "ArrowRight") this.click()
            else if(code == "ArrowLeft") this.parentboard.back()
        }
    }

    select(indexopt){
        let index = indexopt || this.selectedindex
        this.selectedindex = index
        for(let bookitem of this.bookitems){
            bookitem.highlight(false)
        }
        if(this.selectedindex >= 0){
            this.bookitems[this.selectedindex].highlight(true)
        }
        return this
    }

    build(gamenodeopt){        
        if(!this.parentboard.study) return this
        let gamenode = gamenodeopt || this.parentboard.currentnode
        this.container.x
        this.successdiv = Div().w(80).pad(2).mar(4).ml(10).mb(6).fs(20).ff("monospace").bc("#ddd").ta("center")
        this.successdiv.html(`${gamenode.success}`)
        if(gamenode.success > 0){
            this.successdiv.c("#070")
        }else{
            this.successdiv.c("#700")
        }
        if(gamenode.hasmetrainchild) this.container.a(this.successdiv)
        this.bookitems = []        
        for(let childid of gamenode.sortedchildids()){
            let child = this.parentboard.study.nodelist[childid]
            let bookitem = BookItem(this.parentboard, child)
            this.container.a(bookitem)
            this.bookitems.push(bookitem)
        }
        this.selectedindex = this.bookitems.length > 0 ? 0 : -1
        this.select()
        return this
    }

    constructor(parentboard){
        super("div")
        this.parentboard = parentboard
        this.container = Div()
        this.a(this.container)
    }
}
function Book(parentboard){return new Book_(parentboard)}

////////////////////////////////////////////////////////////////////
const SOFT_CONFIRM_TREE_SIZE_LIMIT = 10
const HARD_CONFIRM_TREE_SIZE_LIMIT = 50

const LOCKED_UPDATE_MODE = false

function pbTd(){
    return Td().fw("bold").pad(3).w(80).ta("center")
}

class Board_ extends e{
    setpgn(pgn){
        this.pgntext.setText(pgn)
        if(this.study){
            this.study.pgn = pgn
        }
    }

    maxboardsizechanged(){
        this.rebuild()
    }

    playerbookmoveclicked(moveblob){
        this.makealgebmove(moveblob.uci)
    }

    buildplayerbook(){
        if((this.study) && (this.bookblob)){
            this.playerbookdiv = Div().pad(3)
            this.playerssplitpane.setcontentelement(this.playerbookdiv)
            let posblob = this.bookblob.positions[this.currentnode.zobristkeyhex]
            if(posblob){
                let sorteducis = Object.keys(posblob.moves).sort((ucia, ucib) => posblob.moves[ucib].plays - posblob.moves[ucia].plays)
                let table = Table().fs(20).ac("unselectable")
                table.a(Tr().ff("monospace").a(
                    pbTd().html("Move"),
                    pbTd().html(`Plays`),
                    pbTd().html(`Wins`),
                    pbTd().html(`Draws`),
                    pbTd().html(`Losses`),
                    pbTd().html(`Perf%  `)
                ))
                for(let uci of sorteducis){
                    let moveblob = posblob.moves[uci]
                    let trbc = moveblob.plays > 0 ? "#ffe" : "#ccc"
                    let plays = moveblob.plays
                    let wins = moveblob.wins
                    let draws = moveblob.draws
                    let losses = moveblob.losses
                    let perf = plays > 0 ? Math.floor(( ( wins + 0.5 * draws ) / plays ) * 100) : 0
                    table.a(Tr().bc(trbc).a(
                        pbTd().html(`${moveblob.san}`).fw("bold").c("#007").cp().fs(25).ae("mousedown", this.playerbookmoveclicked.bind(this, moveblob)),
                        pbTd().html(`${plays > 0 ? plays : ""}`).c("#007"),
                        pbTd().html(`${plays > 0 ? wins : ""}`).c("#070"),
                        pbTd().html(`${plays > 0 ? draws : ""}`).c("#770"),
                        pbTd().html(`${plays > 0 ? losses : ""}`).c("#700"),
                        pbTd().html(`${plays > 0 ? perf : ""}`).c("#000")
                    ))
                }
                this.playerbookdiv.a(table)
                if(posblob.topgames){
                    let etable = this.excerptstable(posblob.topgames, this.bookblob.name)                
                    this.playerbookdiv.a(etable)
                }                
            }
        }
    }

    excerptstable(excerpts, name){        
        const resultmappingwc = {"1-0": "#070","1/2-1/2": "#770","0-1": "#700"}
        const resultmappingbc = {"0-1": "#070","1/2-1/2": "#770","1-0": "#700"}
        let etable = Table().mt(5).ff("monospace")
        let i = 0
        for(let excerptblob of excerpts){
            let whitec = "#007"
            let blackc = "#007"
            if(excerptblob.white == name){
                whitec = resultmappingwc[excerptblob.result]
            }
            else if(excerptblob.black == name){
                blackc = resultmappingbc[excerptblob.result]
            }
            etable.a(Tr().cp().ae("mousedown", function(){
                window.open(`https://lichess.org/${excerptblob.gameid}`, "_blank")
            }).bc(i++%2 ? "#ffe" : "#eee").a(
                Td().c(whitec).pad(3).html(`${excerptblob.white} ( ${excerptblob.whiterating} )`),
                Td().c(blackc).pad(3).pl(12).html(`${excerptblob.black} ( ${excerptblob.blackrating} )`),
                Td().pad(3).pl(12).html(`${excerptblob.result}`)
            ))
        }
        return etable
    }

    setgamefromstudy(study){
        console.log("setting game from", study)
        this.study = study
        if(this.trainon()){
            if(this.study.currentnode.childids.length == 0){
                let transpositions = this.study.transpositions()
                if(transpositions.length > 0){
                    let maintrid = transpositions[0]
                    let maintrnode = this.study.nodelist[maintrid]
                    if(maintrnode.childids.length > 0){
                        console.log("training transpoisition", maintrid)
                        this.selectnodebyid(this.study.id, maintrid)
                        return
                    }
                }
            }
        }
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
        if(!this.trainon()){
            this.basicboard.setdrawings(this.study.currentnode.drawings)
        }        
        this.builddrawingsorganizer()
        let treebuild = this.study.tree()
        this.treediv.x.a(treebuild)        
        this.treediv.resize()        
        this.pgntext.setText(study.pgn)
        this.studytoolshook.x
        let importurl = `${serverroot()}/importstudy/${getuser().code}/${this.study.id}/${this.study.currentnodeid}`                
        let line = this.study.getcurrentnode().getline()
        this.linetextinput = CopyText({dopaste: false}).setText(line)
        this.studytoolshook.a(Labeled("Line", this.linetextinput).setLabelWidth(150).fs(18))
        this.mergetextinput = CopyTextArea({height: 100, pastecallback: this.mergemoves.bind(this)})
        this.mergemaxplyselect = Select().setid(`${this.id}/mergemaxplies`).setoptions([...Array(20).keys()].map(x => [10 * ( x + 1 ), 10 * ( x + 1 )]), 200)
        this.mergeignorecommentscheck = Check({id: `${this.id}/mergeignorecomments`})
        this.mergeignoredrawingscheck = Check({id: `${this.id}/mergeignoredrawings`})
        this.mergeignoretrainweightscheck = Check({id: `${this.id}/mergeignoretrainweights`})
        this.mergemovespanel = Div().disp("flex").ai("center").a(
            Labeled("Merge moves", this.mergetextinput).setLabelWidth(150).fs(18),
            Div().a(
                Labeled("Max plies       ", this.mergemaxplyselect),
                Labeled("Ignore comments    ", this.mergeignorecommentscheck),
                Labeled("Ignore drawings    ", this.mergeignoredrawingscheck),
                Labeled("Ignore trainweights", this.mergeignoretrainweightscheck)
            ).ml(10)
        )
        this.studytoolshook.a(this.mergemovespanel)
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
        this.buildplayerbook()
        if(!(this.trainroot in this.study.nodelist)){
            this.trainroot = "root"
            this.settrainrootlabel()
        }

        console.log("tree size", this.currenttreesize, this.studytreesize)

        if(this.analyzing){
            this.analyze()
        }else{
            this.getstoredanalysis()
        }

        this.getstoredbook()

        ////////////////////////////////////////////////////////////////////
        if(this.mergequeue){
            this.mergetextinput.setText(this.mergequeue)
            setTimeout(this.mergemoves.bind(this), 5000)
            return
        }
        ////////////////////////////////////////////////////////////////////

        ////////////////////////////////////////////////////////////////////
        this.dotrain()
        ////////////////////////////////////////////////////////////////////
    }

    saveanalysisbook(){        
        let blob = this.analysisbook.toblob()
        console.log("saving analysis book", blob)
        api({
            "kind": "saveanalysisbook",
            "variantkey": this.basicboard.variantkey,            
            "zobristkeyhex": this.currentnode.zobristkeyhex,
            "blob": blob
        }, function(resobj){
            console.log("save analysis book", resobj)
        }.bind(this))
    }

    showanalysisbook(){
        this.analysisbookdiv.x                
        this.analysisbookdiv.a(this.analysisbook)
    }

    buildanalysisbook(blob){
        this.analysisbook = BookPosition(this, blob)
        let hasmissing = false
        for(let child of this.currentnode.getchilds()){
            if(!this.analysisbook.hasuci(child.genuci)){
                hasmissing = true
                this.analysisbook.moves.push(BookMove(this.analysisbook, {uci:child.genuci, san:child.gensan, weight: 0}))
            }
        }
        if(hasmissing){
            this.analysisbook.build()
            this.saveanalysisbook()
        }
        this.showanalysisbook()
    }

    getstoredbook(){
        this.analysisbookdiv.x
        api({
            "kind": "getanalysisbook",
            "variantkey": this.basicboard.variantkey,            
            "zobristkeyhex": this.currentnode.zobristkeyhex
        }, function(resobj){
            if(resobj.zobristkeyhex != this.currentnode.zobristkeyhex){
                console.log("loaded analysis book does not match position")
                return
            }
            let blob = resobj.blob
            this.buildanalysisbook(blob)            
        }.bind(this))
    }

    getstoredanalysis(){
        this.analysisinfodiv.x
        this.basicboard.analysiscanvas.clear()
        api({
            "kind": "getanalysisinfo",
            "variantkey": this.basicboard.variantkey,            
            "zobristkeyhex": this.currentnode.zobristkeyhex
        }, function(resobj){
            let blob = resobj.blob
            if(blob) this.buildanalysisinfo(blob)            
        }.bind(this))
    }

    get currenttreesize(){
        return this.currentnode.measuretree()
    }

    get studytreesize(){
        return this.study.treesize()
    }

    get currentnode(){
        if(!this.study) return null
        return this.study.currentnode
    }

    buildbook(){                
        this.book = Book(this).build()                
        this.bookdiv.x.a(
            this.transpositionshook = Div(),
            this.book
        )
        let transpositions = []        
        if(this.study){
            transpositions = this.study.transpositions()
            for(let nodeid of transpositions){
                let node = this.study.nodelist[nodeid]
                let numchilds = node.childids.length
                let name = numchilds > 0 ? `branch(${numchilds})` : `leaf node`
                let line = nodeid.split("_")
                let trdiv = Div().cp().ff("monospace").mar(2).curlyborder().pad(2).pl(8).pr(8).html(`transposition - ${name} - ${line.join(" ")}`)
                trdiv.bc(numchilds > 0 ? "#efe" : "#fee")
                trdiv.ae("mousedown", function(){
                    this.selectnodebyid(this.study.id, nodeid)
                }.bind(this))
                this.transpositionshook.a(
                    trdiv
                )
            }            

            this.basicboard.bookcanvas.clear()
            if(!this.trainon()){
                for(let child of this.currentnode.getchilds().slice().reverse()){
                    if(child.metrainweight > 0){
                        this.basicboard.addalgebmovearrow(child.genuci, {opacity: child.metrainweight/10, color: "#00f", auxscalefactor: 1.2, canvas: this.basicboard.bookcanvas})
                    }                
                }
            }
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
        let [pgn, rest] = extractpgn(moves)
        console.log("merge", pgn)        
        this.mergequeue = null
        if(pgn){
            this.mergequeue = rest
            api({
                "kind": "mergemoves",
                "id": this.study.id,
                "moves": pgn,
                "ignorecomments": this.mergeignorecommentscheck.checked,
                "ignoredrawings": this.mergeignoredrawingscheck.checked,
                "ignoretrainweights": this.mergeignoretrainweightscheck.checked,
                "maxplies": parseInt(this.mergemaxplyselect.v())
            }, this.movesmerged.bind(this))
        }
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

    successset(resobj){
        console.log("success set", resobj)
    }

    setsuccess(node, success){
        if(success < MAX_SUCCESS){
            node.success = success
        }else{
            for(let sibling of node.siblings){
                console.log("sibling", sibling)
                if(sibling.success > 0){                    
                    sibling.success--
                }
            }
            node.success = MAX_SUCCESS
        }
        
        api({
            "kind": "setsuccess",
            "id": this.study.id,
            "nodeid": node.id,            
            "success": success
        }, this.successset.bind(this))
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
                    this.setsuccess(this.study.currentnode, this.study.currentnode.success + 1)
                    if(mymoveweight == maxweight){

                    }else{
                        setTimeout(function(){
                            window.alert("Good move, but keep in mind, there is a better move !")                        
                        }.bind(this))                                                                
                    }
                }else{                    
                    if(maxweight > 0){                        
                        this.basicboard.setfromfen(this.basicboard.fen)                        
                        if(!move.isnull){
                            this.setsuccess(this.study.currentnode, 0)
                            window.alert("Wrong move !")                    
                        }
                        this.buildbook()
                        return
                    }else{
                        setTimeout(function(){
                            window.alert("Line completed. Well done !")
                            this.traintobegin()
                        }.bind(this))                                        
                        return
                    }
                }
            }
        }
        this.makealgebmove(algeb)
    }

    makealgebmove(algeb){
        if(this.study){
            if(LOCKED_UPDATE_MODE){
                api({
                    "kind": "makealgebmove",
                    "id": this.study.id,
                    "algeb": algeb
                }, this.algebmovemade.bind(this))
            }else{
                let algebmovenodeid = this.currentnode.algebmovenodeid(algeb)
                if(algebmovenodeid){
                    api({
                        "kind": "setcurrentnode",
                        "id": this.study.id,                
                        "nodeid": algebmovenodeid
                    }, this.currentnodeset.bind(this))
                    this.study.setcurrentnode(algebmovenodeid)
                    this.setgamefromstudy(this.study)
                }else{
                    // fall back to locked update mode
                    api({
                        "kind": "makealgebmove",
                        "id": this.study.id,
                        "algeb": algeb
                    }, this.algebmovemade.bind(this))
                }
            }
        }
    }

    currentnodeset(resobj){
        console.log("current node set", resobj)
        console.log("current node id", this.study.currentnodeid)
        let treebuild = this.study.tree()
        this.treediv.x.a(treebuild)        
        this.treediv.resize()
    }

    scrollcurrentnodeintoview(quick){
        try{            
            this.study.currentnode.messagegeardiv.scrollcentersmooth(quick)
        }catch(err){console.log("could not scroll current node into view", err)}
    }

    back(){
        if(this.study){
            if(LOCKED_UPDATE_MODE){
                api({
                    "kind": "back",
                    "id": this.study.id                
                }, this.algebmovemade.bind(this))
            }else{
                let nodeid = this.currentnode.backid()
                if(nodeid){
                    api({
                        "kind": "setcurrentnode",
                        "id": this.study.id,                
                        "nodeid": nodeid
                    }, this.currentnodeset.bind(this))
                    this.study.setcurrentnode(nodeid)
                    this.setgamefromstudy(this.study)
                }else{
                    console.log("no way back")
                }                
            }            
        }        
    }

    del(){
        if(!this.confirmdeleteoperation("delete this line", this.currenttreesize)) return        
        if(this.study){
            api({
                "kind": "delete",
                "id": this.study.id                
            }, this.algebmovemade.bind(this))
        }        
    }

    selectnodebyid(idopt, nodeidopt){
        let id = idopt || this.study.id
        let nodeid = nodeidopt || this.study.currentnodeid
        if(LOCKED_UPDATE_MODE){
            api({
                "kind": "selectnodebyid",
                "id": id,
                "nodeid": nodeid
            }, this.algebmovemade.bind(this))
        }else{
            api({
                "kind": "setcurrentnode",
                "id": id,                
                "nodeid": nodeid
            }, this.currentnodeset.bind(this))
            this.study.setcurrentnode(nodeid)
            this.setgamefromstudy(this.study)
        }
    }

    tobegin(){        
        if(this.study){            
            if(this.study.currentnodeid == "root"){
                console.log("tobegin ignored, already at root")
            }else{
                if(LOCKED_UPDATE_MODE){
                    api({
                        "kind": "tobegin",
                        "id": this.study.id                
                    }, this.algebmovemade.bind(this))
                }else{                    
                    api({
                        "kind": "setcurrentnode",
                        "id": this.study.id,                
                        "nodeid": "root"
                    }, this.currentnodeset.bind(this))
                    this.study.setcurrentnode("root")
                    this.setgamefromstudy(this.study)
                }            
            }            
        }        
    }

    forward(){
        if(this.study){
            if(LOCKED_UPDATE_MODE){
                api({
                    "kind": "forward",
                    "id": this.study.id                
                }, this.algebmovemade.bind(this))
            }else{
                let nodeid = this.currentnode.forwardid()
                if(nodeid){
                    api({
                        "kind": "setcurrentnode",
                        "id": this.study.id,                
                        "nodeid": nodeid
                    }, this.currentnodeset.bind(this))
                    this.study.setcurrentnode(nodeid)
                    this.setgamefromstudy(this.study)
                }else{
                    console.log("no way forward")
                }                
            }            
        }        
    }

    toend(){
        if(this.study){
            if(LOCKED_UPDATE_MODE){
                api({
                    "kind": "toend",
                    "id": this.study.id                
                }, this.algebmovemade.bind(this))
            }else{
                let nodeid = this.currentnode.toendid()
                if(nodeid){
                    api({
                        "kind": "setcurrentnode",
                        "id": this.study.id,                
                        "nodeid": nodeid
                    }, this.currentnodeset.bind(this))
                    this.study.setcurrentnode(nodeid)
                    this.setgamefromstudy(this.study)
                }else{
                    console.log("fatal, no way to end")
                }                
            }            
        }        
    }

    confirmdeleteoperation(msg, treesize){        
        if(treesize >= SOFT_CONFIRM_TREE_SIZE_LIMIT) if(!textconfirm(`${msg} and delete ${treesize} move(s)`, "delete", treesize < HARD_CONFIRM_TREE_SIZE_LIMIT)) return false
        return true
    }

    reset(){
        if(!this.confirmdeleteoperation("reset the study", this.studytreesize)) return
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
        if(!this.confirmdeleteoperation("reset study from PGN", this.studytreesize)){
            if(this.study) this.pgntext.setText(this.study.pgn)
            return
        }
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
        console.log("duration saved", resobj)
    }

    durationchanged(){
        let duration = parseInt(this.durationtextinput.getText())
        if(isNaN(duration)) duration = 1000
        this.currentnode.duration = duration
        api({
            "kind": "saveduration",
            "id": this.study.id,
            "nodeid": this.study.currentnodeid,
            "duration": duration
        }, this.durationsaved.bind(this))
    }

    drawingsset(resobj){
        console.log("drawings set", resobj)        
        this.setpgn(resobj.pgn)
    }

    drawingschanged(drawings){
        console.log("drawings changed", drawings)
        this.basicboard.setdrawings(drawings)        
        this.currentnode.drawings = drawings
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
        if(!this.confirmdeleteoperation("reset study from FEN", this.studytreesize)){
            this.fentext.setText(this.basicboard.fen)
            return
        }
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

    bookloaded(resobj){
        this.buildplayers(false)
        if(resobj.kind == "loadbook"){
            this.bookblob = resobj.bookblob
            if(!this.bookcache) this.bookcache = {}
            let playerlower = this.bookblob.name.toLowerCase()
            this.bookcache[playerlower] = resobj.bookblob
        }
        this.setgamefromstudy(this.study)
    }

    loadbook(){
        this.buildplayers(true)
        let player = this.playerscombo.v()
        if(this.bookcache){
            let playerlower = player.toLowerCase()
            if(this.bookcache[playerlower]){
                this.bookblob = this.bookcache[playerlower]
                this.buildplayers(false)
                this.setgamefromstudy(this.study)
                return
            }
        }
        api({
            "kind": "loadbook",
            "player": player
        }, this.bookloaded.bind(this))
    }

    playerscombochanged(){
        if(!this.bookcache) return
        let playerlower = this.playerscombo.v().toLowerCase()
        if(this.bookcache[playerlower]) this.loadbook()
    }

    buildplayers(loading){
        if(!this.players) return
        this.playerscombo = Select().ff("monospace").pad(2).fs(20).setid(`${this.id}/playerscombo`).setoptions(this.players.map(player => [player, player]))        
        this.playerscombo.onchange(this.playerscombochanged.bind(this))
        this.playerscombohook.x.a(
            this.playerscombo            
        )
        this.playersloadhook.x
        if(loading){
            this.playersloadhook.a(Div().html("Loading book, please wait ..."))
        }else{
            this.playersloadhook.a(Button("Load book", this.loadbook.bind(this)).fs(20).ml(10))
        }
    }

    analyze(){
        this.analyzing = true
        api({
            "kind": "analyze",
            "fen": this.basicboard.fen,
            "variantkey": this.basicboard.variantkey,
            "multipv": this.multipvselect.v()
        }, function(resobj){console.log("analyze response", resobj)})
    }

    stopanalyze(){
        this.analyzing = false
        api({
            "kind": "stopanalyze"
        }, function(resobj){console.log("stop analyze response", resobj)})
    }

    newengine(){        
        api({
            "kind": "newengine"
        }, function(resobj){console.log("new engine response", resobj)})
    }

    constructor(argsopt){
        super("div")
        this.initgif()
        let args = argsopt || {}
        this.mergequeue = null
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
        let self = this
        this.treediv.resize = function(){            
            setTimeout(function(){
                this.treediv.w(this.treediv.e.scrollWidth).h(this.tabpane.contentdiv.e.scrollHeight).mw(2000).mh(1000)            
                self.scrollcurrentnodeintoview(true)
            }.bind(this), 0)
        }.bind(this)
        this.toolsdiv = Div().pad(3)        
        this.studytoolshook = Div()
        this.toolsdiv.a(this.studytoolshook)
        this.studies = Studies({parentboard: this})
        this.bookdiv = Div().pad(3)
        this.playerssplitpane = SplitPane()
        this.playerscombohook = Div()
        this.playersloadhook = Div()
        this.playerssplitpane.controlpanel.a(this.playerscombohook, this.playersloadhook).bc("#ddd")
        this.buildplayers()
        this.traindiv = Div().pad(3)
        this.trainmode = "none"
        this.buildtraindiv()        
        this.rawsplitpane = SplitPane()
        this.enginesubmittext = SubmitText().onclick(this.enginesubmit.bind(this))
        this.multipvselect = Select().setid(`${this.id}/multipv`).setoptions([...Array(20).keys()].map(x => [x + 1, x + 1]), 1)
        this.rawsplitpane.controlpanel.a(
            this.enginesubmittext,
            Button("Analyze", this.analyze.bind(this)),
            Button("Stop", this.stopanalyze.bind(this)),            
            Button("New", this.newengine.bind(this))            
        )
        this.enginelog = SystemLog()
        this.rawsplitpane.setcontentelement(this.enginelog)
        this.createengineeventsource()
        this.analysissplitpane = SplitPane()
        this.analysissplitpane.controlpanel.a(
            Button("Analyze", this.analyze.bind(this)).bc("#afa"),
            Button("Stop", this.stopanalyze.bind(this)).bc("#faa"),
            Labeled("MultiPV", this.multipvselect)
        )
        this.analysisinfocontainer = Div().pad(3)
        this.enginetickdiv = Div().ff("monospace").pad(2).pl(8).pr(8).bc("#eee").curlyborder()
        this.analysisinfodiv = Div().mt(3)
        this.analysisinfocontainer.a(
            this.enginetickdiv,
            this.analysisinfodiv
        )
        this.analysissplitpane.setcontentelement(this.analysisinfocontainer)
        this.analysisbookdiv = Div().pad(3).pl(9)
        this.botdiv = Div().pad(3)
        this.challengediv = Div().pad(3).curlyborder().mt(5)
        this.challengeusernametextinput = CopyText({id: this.id + "/challengeusernametextinput", docopy:false})
        this.challengeinitialtextinput = CopyText({id: this.id + "/challengeinitialtextinput", docopy:false, width: 150})
        this.challengeincrementtextinput = CopyText({id: this.id + "/challengeincrementtextinput", docopy:false, width: 150})
        this.challengeratedcheck = Check({id: `${this.id}/challengerated`})
        this.challengecolorselect = Select().setid(`${this.id}/challengecolor`).setoptions([
            ["random", "random"],
            ["white", "white"],
            ["black", "black"]
        ], "random")
        this.challengediv.a(
            Labeled("Challenge user", this.challengeusernametextinput),
            Labeled("Initial time", this.challengeinitialtextinput),
            Labeled("Increment", this.challengeincrementtextinput),
            Labeled("Rated", this.challengeratedcheck),
            Labeled("Color", this.challengecolorselect),
            Div().mt(5).mb(5).a(Button("Challenge", this.challenge.bind(this)).fs(20).w(300))
        )
        this.botdiv.a(
            Button("Reload analysis book", this.botreloadanalysisbook.bind(this)).fs(20),
            this.challengediv
        )
        this.analysistabpane = TabPane("analysistabpane").settabs([
            Tab("analysis", "Analysis", this.analysissplitpane, "A"),
            Tab("book", "Book", this.analysisbookdiv, "?"),
            Tab("bot", "Bot", this.botdiv, "%"),
            Tab("raw", "Raw", this.rawsplitpane, "n")
        ]).selecttab("analysis", USE_STORED_IF_AVAILABLE)
        this.analysistabpane.controlpanel.bc("#ccc")        
        this.tabpane = TabPane("boardtabpane").settabs([
            Tab("game", "Game", this.pgntext, "C"),
            Tab("tree", "Tree", this.treediv, "$"),
            Tab("book", "Book", this.bookdiv, "?"),
            Tab("analysis", "Analysis", this.analysistabpane, "A"),
            Tab("players", "Players", this.playerssplitpane, "f"),
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
        this.enginelasttick = new Date().getTime()
        window.setInterval(this.checkengineconn.bind(this), 2000)
    }

    challenge(){
        api({
            "kind": "challenge",
            "username": this.challengeusernametextinput.getText(),
            "initial": this.challengeinitialtextinput.getText(),
            "increment": this.challengeincrementtextinput.getText(),
            "rated": this.challengeratedcheck.checked,
            "color": this.challengecolorselect.v()
        }, function(resobj){
            console.log("challenge", resobj)
            window.alert(`Challenge returned : ${JSON.stringify(resobj.status)}`)
        })
    }

    botreloadanalysisbook(){
        api({
            "kind": "reloadanalysisbook"
        }, function(resobj){console.log("reload analysis book", resobj)})
    }

    checkengineconn(){
        if((new Date().getTime() - this.enginelasttick) > 9000){
            console.log("engine conn timeout")
            this.engineeventsource.close()
            this.createengineeventsource()
        }
    }

    createengineeventsource(){
        this.engineeventsource = new EventSource("/enginelog")
        this.engineeventsource.onmessage= function(ev){
            let li = SystemLogItem(JSON.parse(ev.data))
            if(li.kind == "analysisinfo"){                
                if(li.blob.analyzejob.zobristkeyhex == this.currentnode.zobristkeyhex){
                    this.buildanalysisinfo(li.blob)   
                }                
            }else if(li.kind == "enginetick"){
                this.enginetickdiv.html(li.msg)                
                if(li.blob.analyzing){
                    this.analysissplitpane.controlpanel.bc("#afa")
                }else{
                    this.analysissplitpane.controlpanel.bc("#ddd")
                }
                this.enginelasttick = new Date().getTime()
            }else{
                this.enginelog.add(li)
            }            
        }.bind(this)
    }

    showanalysisinfo(){
        this.analysisinfodiv.x
        this.analysisinfodiv.a(this.analysisinfo)
        let hfi = this.analysisinfo.highestfullitem()
        let acanvas = this.basicboard.analysiscanvas
        acanvas.clear()
        if( hfi && !this.trainon() ) {
            let multipv = this.analysisinfo.analyzejob.multipv
            let i = multipv
            for(let pvi of hfi.pvitems){
                if(pvi){
                    let uci = pvi.getuci()
                    this.basicboard.addalgebmovearrow(uci, {canvas: acanvas, auxscalefactor: i / multipv, color: scorecolor(pvi.scorekind, pvi.score)})
                    i--
                }
            }
        }
    }

    buildanalysisinfo(blob){        
        this.analysisinfo = AnalysisInfo(this, blob)
        this.showanalysisinfo()
    }

    enginesubmit(command){
        console.log("engine command", command)
        api({
            "kind": "enginecommand",
            "command": command
        }, function(resobj){console.log("engine command response", resobj)})
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
                    if(withchance(this.gettrainbyerrorpercent())){
                        console.log("train by error")
                        let minsuccesschild = null
                        let minsuccess = null
                        for(let child of this.study.currentnode.getchilds()){                            
                            let chminsuccess = child.getminsuccess()
                            if(chminsuccess != null){
                                if(minsuccesschild == null){
                                    minsuccesschild = child
                                    minsuccess = chminsuccess
                                }else{
                                    if(chminsuccess < minsuccess){
                                        minsuccesschild = child
                                        minsuccess = chminsuccess
                                    }
                                }
                            }
                        }
                        console.log("min success", minsuccesschild)
                        this.makealgebmove(minsuccesschild.genuci)
                    }else{
                        console.log("train by weights")
                        let ri = Math.floor(Math.random() * candidates.length)
                        let selected = candidates[ri]
                        console.log("selected", ri, selected)
                        this.makealgebmove(selected.genuci)
                    }
                }else{
                    setTimeout(function(){
                        window.alert("Line completed. Well done !")
                        this.traintobegin()
                    }.bind(this))                                        
                    return
                }
            }else{
                console.log("checking")
                if(this.study.currentnode.maxtrainweight("me") > 0){                    
                    
                }else{
                    setTimeout(function(){
                        window.alert("Line completed. Well done !")
                        this.traintobegin()
                    }.bind(this))                                        
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
        if(this.trainon()){
            this.basicboard.drawingscanvas.clear()
            this.basicboard.analysiscanvas.clear()
            this.basicboard.bookcanvas.clear()
        }else{
            this.setgamefromstudy(this.study)
        }
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

    gettrainbyerrorpercent(){
        return this.trainbyerrorpercentselect.v()
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
        this.trainbyerrorpercentselect = Select().setid(`${this.id}/trainbyerrorpercent`).setoptions([...Array(11).keys()].map(x => [10 * x, 10 * x]), 50)
        this.traindiv.a(
            this.trainmodeselect,
            Div().mt(10).ml(5).a(Labeled("Train by error %", this.trainbyerrorpercentselect)),
            this.trainrootdiv
        )
    }

    init(resobj){
        this.studies.init()
        this.players = getelse(resobj, "players", [])
        this.buildplayers()
    }
}
function Board(argsopt){return new Board_(argsopt)}
////////////////////////////////////////////////////////////////////
