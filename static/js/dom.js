////////////////////////////////////////////////////////////////////
// dom base class
class e{
    constructor(kind){
        this.e = document.createElement(kind)
        this.selected = false
        this.id = null
        this.origbc = "#eee"
        this.selbc = "#0f0"
    }

    setid(id){
        this.id = id
        return this
    }

    setselbc(selbc){
        this.selbc = selbc
        return this
    }

    setorigbc(origbc){
        this.origbc = origbc
        return this
    }

    setselected(selected){
        this.selected = selected        
        this.bc(this.selected ? this.selbc : this.origbc)        
        return this
    }

    transition(transition){
        this.e.style.transition = transition        
        return this
    }

    txd(textdecoration){
        this.e.style.textDecoration = textdecoration
		return this
    }

    float(float){
        this.e.style.float = float
		return this
    }

    transform(transform){
        this.e.style.transform = transform
		return this
    }

    tsh(textshadow){
        this.e.style.textShadow = textshadow
		return this
    }

    shc(shadowcolor){        
		return this.c("transparent").tsh(`0 0 0 ${shadowcolor}`)
    }

    wsp(whitespace){
        this.e.style.whiteSpace = whitespace
		return this
    }

    tovf(textoverflow){
        this.e.style.textOverflow = textoverflow
		return this
    }

    ellipsis(){
        return this.ovf("hidden").wsp("nowrap").tovf("ellipsis")
    }

	scrollIntoView(param){
		this.e.scrollIntoView(param)
		return this
	}

    select(){
        this.e.select()
        return this
    }

    v(){
        return this.e.value
    }

    sv(value){
        this.e.value = value
        return this
    }

    html(content){
        this.e.innerHTML = content
        return this
    }

    focus(){
        this.e.focus()
        return this
    }

    op(opacity){
        this.e.style.opacity = "" + opacity
        return this
    }

    w(width){
        this.e.style.width = width + "px"
        return this
    }

    mw(width){
        this.e.style.minWidth = width + "px"
        return this
    }

    h(height){
        this.e.style.height = height + "px"
        return this
    }

    mh(height){
        this.e.style.minHeight = height + "px"
        return this
    }

    zi(zindex){
        this.e.style.zIndex = zindex
        return this
    }

    t(top){
        this.e.style.top = top + "px"
        return this
    }

    l(left){
        this.e.style.left = left + "px"
        return this
    }

    tl(vect){
        return this.t(vect.y).l(vect.x)
    }

    bc(color){
        this.e.style.backgroundColor = color
        return this
    }

    bimg(path){
        this.e.style.backgroundImage = `url(${path})`
        return this
    }

    c(color){
        this.e.style.color = color
        return this
    }

    ta(value){
        this.e.style.textAlign = value
        return this
    }

    border(style, width, radius, color){
        this.e.style.borderStyle = style
        if(arguments.length > 1) this.e.style.borderWidth = width + "px"
        if(arguments.length > 2) this.e.style.borderRadius = radius + "px"
        if(arguments.length > 3) this.e.style.borderColor = color
        return this
    }

    pad(value){
        this.e.style.padding = value + "px"
        return this
    }

    mar(value){
        this.e.style.margin = value + "px"
        return this
    }

    ml(value){
        this.e.style.marginLeft = value + "px"
        return this
    }

    mr(value){
        this.e.style.marginRight = value + "px"
        return this
    }

    mt(value){
        this.e.style.marginTop = value + "px"
        return this
    }

    mb(value){
        this.e.style.marginBottom = value + "px"
        return this
    }

    fs(value){
        this.e.style.fontSize = value + "px"
        return this
    }

    ff(value){
        this.e.style.fontFamily = value
        return this
    }

    fst(value){
        this.e.style.fontStyle = value
        return this
    }

    fw(value){
        this.e.style.fontWeight = value
        return this
    }

    disp(display){
        this.e.style.display = display
        return this
    }

    blink(){
        return this.ac("blink_me")
    }

    cp(){
        this.e.style.cursor = "pointer"
        return this
    }

    po(position){
        this.e.style.position = position
        return this
    }

    por(){
        return this.po("relative")
    }

    poa(){
        return this.po("absolute")
    }

    jc(justifycontent){
        this.e.style.justifyContent = justifycontent
        return this
    }

    ai(alignitems){
        this.e.style.alignItems = alignitems
        return this
    }

    fd(flexdirection){
        this.e.style.flexDirection = flexdirection
        return this
    }

    sa(key, value){
        this.e.setAttribute(key, value)
        return this
    }

    pl(padleft){
        this.e.style.paddingLeft = padleft + "px"
        return this
    }

    pr(padright){
        this.e.style.paddingRight = padright + "px"
        return this
    }

    a(...args){        
        for(let arg of args){            
            try{
                for(let arge of arg){
                    this.e.appendChild(arge.e)                            
                }
            }catch(e){                
                this.e.appendChild(arg.e)
            }
        }
        return this
    }

    ac(klass){
        this.e.classList.add(klass)
        return this
    }

    acc(cond, klass){
        if(cond) this.ac(klass)
        return this
    }

    rc(klass){
        this.e.classList.remove(klass)
        return this
    }

    ae(kind, handler){
        this.e.addEventListener(kind, handler)
        return this
    }

    ovf(overflow){
        this.e.style.overflow = overflow
        return this
    }

    bds(value){
        this.e.style.borderStyle = value
        return this
    }

    bdw(value){
        this.e.style.borderWidth = value + "px"
        return this
    }

    bdc(value){
        this.e.style.borderColor = value
        return this
    }

    bdr(value){
        this.e.style.borderRadius = value + "px"
        return this
    }

    get x(){                
        return this.html("")
    }

    curlyborder(borderradiusopt){
        let borderradius = borderradiusopt || 10
        return this.bds("solid").bdw(1).bdc("#777").bdr(borderradius)
    }
}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// dom derived classes

////////////////////////////////////////////////////////////////////
// div
class Div_ extends e{
    constructor(){
        super("div")
    }
}
function Div(){return new Div_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// a
class A_ extends e{
    constructor(){
        super("a")
    }

    href(href){
        this.sa("href", href)
        return this
    }

    download(download){
        this.sa("download", download)
        return this
    }
}
function A(){return new A_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// canvas
// https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
// https://stackoverflow.com/questions/4839993/how-to-draw-polygons-on-an-html5-canvas
// https://stackoverflow.com/questions/5998924/how-can-i-rotate-a-shape-in-canvas-html5
// https://stackoverflow.com/questions/4405336/how-to-copy-contents-of-one-canvas-to-another-canvas-locally

class Canvas_ extends e{
    constructor(){
        super("canvas")
        this.ctx = this.getContext("2d")
        this.setWidth(100).setHeight(100)
    }

    clear(){
        this.ctx.clearRect(0, 0, this.width, this.height)
    }

    arrow(from, to, argsopt){        
        let diff = to.m(from)
        let l = diff.l()
        let rot = Math.asin((to.y - from.y)/l)        
        if(to.x < from.x) rot = Math.PI - rot             
        let args = argsopt || {}
        let linewidth = getelse(args, "linewidth", 16)
        let halflinewidth = linewidth / 2
        let pointheight = getelse(args, "pointheight", 40)
        let pointwidth = getelse(args, "pointwidth", 30)
        let halfpointwidth = pointwidth / 2
        let color = getelse(args, "color", "#ff0")        
        let lineheight = l - pointheight
        this.ctx.save()
        this.ctx.translate(from.x, from.y)
        this.ctx.rotate(rot)
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(0, halflinewidth)        
        this.ctx.lineTo(lineheight, halflinewidth)
        this.ctx.lineTo(lineheight, halflinewidth + halfpointwidth)
        this.ctx.lineTo(l, 0)
        this.ctx.lineTo(lineheight, - ( halflinewidth + halfpointwidth ) )
        this.ctx.lineTo(lineheight, - halflinewidth)
        this.ctx.lineTo(0, -halflinewidth)        
        this.ctx.lineTo(0, 0)        
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.restore()
    }

    setWidth(width){
        this.width = width
        this.sa("width", width)
        return this
    }

    setHeight(height){
        this.height = height
        this.sa("height", height)
        return this
    }

    getContext(context){
        return this.e.getContext(context)
    }

    toDataURL(kind){
        return this.e.toDataURL(kind)
    }

    downloadHref(name, kind){
        let dt = this.toDataURL('image/' + kind)
        dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream')
        dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=' + name + "." + kind)
        return dt
    }
}
function Canvas(){return new Canvas_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// background canvas
class BackgroundCanvas_ extends Canvas_{
    bimgloaded(){
        let mulx = Math.floor(this.width / this.bimg.naturalWidth) + 1
        let muly = Math.floor(this.height / this.bimg.naturalHeight) + 1
        for(let x = 0; x < mulx; x++) for(let y = 0; y < muly; y++){
            this.ctx.drawImage(this.bimg.e, x * this.bimg.naturalWidth, y * this.bimg.naturalHeight)
        }
    }

    constructor(width, height, url){
        super()
        this.setWidth(width).setHeight(height)
        this.bimg = Img().ae("load", this.bimgloaded.bind(this))
        this.bimg.src = url
    }
}
function BackgroundCanvas(width, height, url){return new BackgroundCanvas_(width, height, url)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// img
class Img_ extends e{
    constructor(){
        super("img")
    }

    width(width){
        this.sa("width", width)
        return this
    }

    height(height){
        this.sa("height", height)
        return this
    }

    set src(src){
        this.e.src = src
    }

    get naturalWidth(){return this.e.naturalWidth}
    get naturalHeight(){return this.e.naturalHeight}
}
function Img(){return new Img_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// table
class Table_ extends e{
    constructor(){
        super("table")
    }
}
function Table(){return new Table_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// tr
class Tr_ extends e{
    constructor(){
        super("tr")
    }
}
function Tr(){return new Tr_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// td
class Td_ extends e{
    constructor(){
        super("td")
    }
}
function Td(){return new Td_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// input
class Input_ extends e{
    constructor(kind){
        super("input")
        this.sa("type", kind)
    }
}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// textinput
class TextInput_ extends Input_{
    constructor(){
        super("text")
    }

    setText(text){
        return this.sv(text)
    }

    getText(){
        return this.v()
    }
}
function TextInput(){return new TextInput_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// textarea
class TextArea_ extends e{
    constructor(){
        super("textarea")
    }

    setText(text){
        return this.sv(text)
    }

    getText(){
        return this.v()
    }

    ss(){
        return this.e.selectionStart
    }

    se(){
        return this.e.selectionEnd
    }

    srt(content, start, end, selectmode){        
        // selectmode : select / start / end / preserve
        this.e.setRangeText(content, start, end, selectmode)
        return this
    }

    insert(content){
        this.srt(content, this.ss(), this.ss(), "end")
        this.focus()
        return this
    }

    rs(content){
        this.srt(content, this.ss(), this.se(), "select")
        this.focus()
        return this
    }

    gs(){
        let text = this.getText()
        return text.slice(this.ss(), this.se())
    }

    ssr(start, end, direction){        
        this.e.setSelectionRange(start, end, direction)
        return this
    }

    selectall(){                
        this.e.select()        
        return this
    }
}
function TextArea(){return new TextArea_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// copytext
class CopyText_ extends e{
    setText(text){
        this.textinput.setText(text)
        return this
    }

    getText(){
        return this.textinput.getText()
    }

    copy(){
        this.textinput.select()
        document.execCommand("copy")
    }

    paste(){        
        try{
            navigator.clipboard.readText().then(clipText => {
                this.textinput.setText(clipText)
                if(this.pastecallback) this.pastecallback(clipText)
            }, err => console.log(err))        
        }catch(err){
            console.log("clipboard.readText does not work, falling back to text pasted manually")
            this.pastecallback(this.textinput.getText())
        }        
    }

    resize(width, height){
        this.width = width
        this.height = height        
        this.copydiv.w(this.dopaste ? this.controlwidth/2 : this.controlwidth).h(this.height/1.4)
        this.pastediv.w(this.docopy ? this.controlwidth/2 : this.controlwidth).h(this.height/1.4)
        this.textinput.w(this.width - this.controlwidth * 1.2).h(this.height * 0.5).fs(this.height * 0.5).pl(5)
        this.w(this.width).h(this.height)
        return this
    }

    textchanged(){
        if(this.id){
            localStorage.setItem(this.id, this.textinput.getText())
        }
    }

    constructor(argsopt){
        super("div")
        let args = argsopt || {}        
        this.id = args.id
        this.dopaste = getelse(args, "dopaste", true)
        this.docopy = getelse(args, "docopy", true)
        this.disp("flex").ai("center").jc("space-around").bc("#ddd").ac("unselectable")
        this.width = args.width || 400
        this.height = args.height || 40
        this.controlwidth = args.controlwidth || 80                
        this.pastecallback = args.pastecallback
        this.copydiv = Div().disp("flex").ai("center").jc("space-around").a(Div().html("Copy")).bc("#efe").cp().fs(10)
        this.copydiv.ae("mousedown", this.copy.bind(this))
        this.pastediv = Div().disp("flex").ai("center").jc("space-around").a(Div().html("Paste")).bc("#fee").cp().fs(10)
        this.pastediv.ae("mousedown", this.paste.bind(this))        
        this.textinput = TextInput().ff("monospace")
        if(this.id){
            this.textinput.ae("keyup", this.textchanged.bind(this))
            this.textinput.ae("change", this.textchanged.bind(this))
            let origtext = localStorage.getItem(this.id)
            if(origtext) this.textinput.setText(origtext)
        }
        this.a(this.textinput)
        if(this.docopy) this.a(this.copydiv)
        if(this.dopaste) this.a(this.pastediv)
        this.resize(this.width, this.height)
    }
}
function CopyText(args){return new CopyText_(args)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// copytextarea
class CopyTextArea_ extends e{
    build(){
        this.x.disp("flex").fd("column")
        this.a(this.controldiv, this.contentdiv)
        return this
    }

    resize(width, height){
        this.width = width
        this.height = height
        this.contentheight = this.height - this.controlheight
        this.controldiv.w(this.width).h(this.controlheight)
        this.contentdiv.w(this.width).h(this.contentheight)
        this.copydiv.w(this.width/2.1).h(this.controlheight/1.4)
        this.pastediv.w(this.width/2.1).h(this.controlheight/1.4)
        this.textarea.w(this.width - 10).h(this.contentheight - 10)        
        return this.build()
    }

    setText(text){
        this.textarea.setText(text)
        return this
    }

    getText(){
        return this.textarea.getText()
    }

    copy(){
        this.textarea.select()
        document.execCommand("copy")
    }

    paste(){ 
        try{
            navigator.clipboard.readText().then(clipText => {
                this.textarea.setText(clipText)
                if(this.pastecallback) this.pastecallback(clipText)
            }, err => console.log(err))        
        }catch(err){
            console.log("clipboard.readText does not work, falling back to text pasted manually")
            this.pastecallback(this.textarea.getText())
        }        
    }

    constructor(argsopt){
        super("div")
        let args = argsopt || {}
        this.width = args.width || 400
        this.height = args.height || 200
        this.controlheight = args.controlheight || 20 
        this.pastecallback = args.pastecallback       
        this.controldiv = Div().disp("flex").ai("center").jc("space-around").bc("#ddd").ff("monospace").fs(11).ac("unselectable")
        this.copydiv = Div().disp("flex").ai("center").jc("space-around").a(Div().html("Copy")).bc("#efe").cp()
        this.copydiv.ae("mousedown", this.copy.bind(this))
        this.pastediv = Div().disp("flex").ai("center").jc("space-around").a(Div().html("Paste")).bc("#fee").cp()
        this.pastediv.ae("mousedown", this.paste.bind(this))
        this.controldiv.a(this.copydiv, this.pastediv)
        this.textarea = TextArea()
        this.contentdiv = Div().disp("flex").ai("center").jc("space-around").a(this.textarea).bc("#ccc")        
        this.resize(this.width, this.height)
    }
}
function CopyTextArea(args){return new CopyTextArea_(args)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// checkbox
class CheckBox_ extends Input_{
    constructor(){
        super("checkbox")
    }

    set(value){
        this.e.checked = value
        return this
    }

    get checked(){
        return this.e.checked
    }

    onchange(handler){
        return this.ae("change", handler)
    }
}
function Check(){return new CheckBox_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// button
class Button_ extends Input_{
    constructor(caption, handler){
        super("button")
        this.e.value=caption
        this.ae("mousedown", handler)
        this.mar(1)
    }
}
function Button(caption, handler){return new Button_(caption, handler)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// hlink
class Hlink_ extends e{
    constructor(href, caption, newtab){                
        super("a")
        this.sa("href", href)
        if(newtab){                    
            this.sa("target", "_blank")
            this.sa("rel", "noopener noreferrer")
        }
        this.html(caption)                
    }
}
function Hlink(href, caption, newtab){return new Hlink_(href, caption, newtab)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// slider
class Slider_ extends Input_{
    constructor(){
        super("range")        
    }

    min(value){
        this.e.min = value
        return this
    }

    max(value){
        this.e.max = value
        return this
    }

    step(value){
        this.e.step = value
        return this
    }

    set(value){
        return this.sv(value)
    }

    get value(){
        return this.e.valueAsNumber
    }
}
function Slider(){return new Slider_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// slidertext
class SliderText_ extends e{
    sliderhcanged(){
        this.text.setText(this.slider.v())
    }

    checktext(){
        this.slider.set(this.text.getText())
    }

    constructor(){
        super("div")        
        this.disp("flex").ai("center").bc("#eee").curlyborder().pad(2).jc("space-around")
        this.slider = Slider().ae("change", this.sliderhcanged.bind(this))
        this.text = TextInput().ml(3).mr(3).w(80)
        this.a(this.text, this.slider)
        this.sliderhcanged()
        setInterval(this.checktext.bind(this), 3000)
    }

    w(value){
        this.slider.w(value - 110)
        super.w(value)
        return this
    }

    min(value){        
        this.slider.min(value)
        this.sliderhcanged()
        return this
    }

    max(value){
        this.slider.max(value)
        this.sliderhcanged()
        return this
    }

    step(value){
        this.slider.step(value)
        this.sliderhcanged()
        return this
    }

    set(value){
        this.slider.set(value)
        this.sliderhcanged()
        return this
    }

    get value(){
        return this.text.getText()
    }
}
function SliderText(){return new SliderText_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// range
class Range_ extends e{
    constructor(frommin, frommax, fromstep, fromval, tomin, tomax, tostep, toval){
        super("div")
        this.disp("flex").ai("center").bc("#ddd").curlyborder().pad(2).jc("space-around")
        this.fromlabel = Div().html("From").fs(12).fs(12).ff("courier").fst("italic")
        this.fromslider = SliderText().min(frommin).max(frommax).step(fromstep).set(fromval).w(400)
        this.tolabel = Div().html("To").fs(12).ff("courier").fst("italic")
        this.toslider = SliderText().min(tomin).max(tomax).step(tostep).set(toval).w(400)
        this.a(this.fromlabel, this.fromslider, this.tolabel, this.toslider).w(880)
    }
}
function Range(frommin, frommax, fromstep, fromval, tomin, tomax, tostep, toval){return new Range_(frommin, frommax, fromstep, fromval, tomin, tomax, tostep, toval)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// dateinput
class DateInput_ extends Input_{
    constructor(){
        super("date")
    }

    set(value){        
        this.sv(value)
        return this
    }

    asms(){
        let date = dateInputStrToDate(this.v())        
        return date.getTime()
    }
}
function DateInput(){return new DateInput_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// option
class Option_ extends e{
    constructor(){
        super("option")
    }

    key(key){
        this.sv(key)
        return this
    }

    value(value){
        this.html(value)
        return this
    }
}
function Option(){return new Option_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// select
class Select_ extends e{
    constructor(){
        super("select")
    }

    setoptions(options, selected){
        this.x
        for(let keyvalue of options){
            let key = keyvalue[0]
            let value = keyvalue[1]
            let o = Option().key(key).value(value)
            if(selected == key){
                o.sa("selected", true)
            }
            this.a(o)
        }
        return this
    }
}
function Select(){return new Select_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// featuredtextinput
class FeaturedTextInput_ extends e{
    constructor(label, width){
        super("div")
        this.width = width || 300
        this.disp("flex").ai("center").jc("space-around").w(this.width).curlyborder().pad(3).mar(3)
        this.label = Div().html(label)
        this.textinput = TextInput().w(this.width - 100).fs(20).pad(3).pl(5)
        this.a(this.label, this.textinput)
    }

    setText(value){
        this.textinput.setText(value)
        return this
    }

    getText(){
        return this.textinput.getText()
    }
}
function FeaturedTextInput(label, width){return new FeaturedTextInput_(label, width)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// splitpane

class SplitPane_ extends e{
    setcontentelement(contentelement){        
        this.contentelement = contentelement
        this.contentdiv.x.a(this.contentelement)
        try{
            this.contentelement.resize(this.contentinnerwidth, this.contentinnerheight)
        }catch(err){}
        return this
    }

    resize(width, height){        
        this.width = width
        this.height = height
        if(this.isrow){
            this.controlpanel.w(this.width).h(this.controlheight)
            this.contentwidth = this.width
            this.contentheight = this.height - this.controlheight
            this.contentdiv.w(this.contentwidth).h(this.contentheight)
        }else{            
            this.controlpanel.w(this.controlheight).h(this.height)
            this.contentwidth = this.width - this.controlheight
            this.contentheight = this.height
            this.contentdiv.w(this.contentwidth).h(this.contentheight)
        }
        this.contentinnerwidth = this.contentwidth - getScrollBarWidth()
        this.contentinnerheight = this.contentheight - getScrollBarWidth()
        this.setcontentelement(this.contentelement)
        return this
    }

    resizetowindow(){
        this.resize(window.innerWidth, window.innerHeight)
        return this
    }

    constructor(args){
        args = args || {}
        super("div")
        // direction of control panel
        this.dir = args.dir || "row"
        this.isrow = ( this.dir == "row" )
        // direction of div arrangement
        this.flowdir = this.dir == "row" ? "column" : "row"
        this.controlpanel = Div().bc("#eee").disp("flex").fd(this.dir).ai("center").jc("space-around")
        this.contentdiv = Div().ovf("scroll")
        this.bimg = args.bimg
        if(this.bimg) this.contentdiv.bimg(this.bimg)
        this.bcol = args.bcol //|| "#eff"
        if(this.bcol) this.contentdiv.bc(this.bcol)
        this.disp("flex").fd(this.flowdir)
        this.a(this.controlpanel, this.contentdiv)
        this.width = args.width || 600
        this.height = args.height || 400
        this.controlheight = args.controlheight || ( this.isrow ? 40 : 120 )        
        this.contentelement = Div()
        this.resize(this.width, this.height)
        if(args.fillwindow){
            window.addEventListener("resize", this.resizetowindow.bind(this))
            this.resizetowindow()
        }
    }
}
function SplitPane(args){return new SplitPane_(args)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// head log pane

class HeadlogPane_ extends SplitPane_{
    constructor(args){
        super(args)
        this.controlpanel.fd("row").jc("left")
        this.logdiv = Div().ff("monospace").ml(10).mr(10).ellipsis().fs(20)
        this.controlpanel.a(this.logdiv)
    }

    log(msg, kind){
        this.logdiv.html(msg)
        this.logdiv.c("#000")
        if(kind == "info") this.logdiv.c("#007")
        if(kind == "success") this.logdiv.c("#070")
        if(kind == "error") this.logdiv.c("#700")
    }
}
function HeadlogPane(args){return new HeadlogPane_(args)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// tab
class Tab_ extends e{
    setcaption(caption, icon){
        this.caption = caption
        this.icon = icon        
        if(this.icon) this.captiondiv.x.a(IconText(this.caption, this.icon))
        else this.captiondiv.html(this.caption)
    }

    constructor(id, caption, contentelement, icon){
        super("div")        
        this.id = id        
        this.contentelement = contentelement        
        this.disp("flex").ai("center").jc("space-around").bc("#ddd").cp().pad(5)
        this.captiondiv = Div()
        this.setcaption(caption, icon)
        this.a(this.captiondiv)
        contentelement.parenttab = this
    }
}
function Tab(id, caption, contentelement, icon){return new Tab_(id, caption, contentelement, icon)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// tabpane
const USE_STORED_IF_AVAILABLE = true
class TabPane_ extends SplitPane_{
    constructor(id, args){
        super(args)
        this.id = id        
        this.tabs = []
    }

    selecttab(id, usestored){
        if(usestored){
            let storedid = localStorage.getItem("tabpanes/" + this.id)
            if(storedid){
                id = storedid
            }
        }
        localStorage.setItem("tabpanes/" + this.id, id)
        for(let tab of this.tabs){
            if(id == tab.id){
                tab.op(1)
                this.setcontentelement(tab.contentelement)
            }else{
                tab.op(0.5)
            }
        }
        return this
    }

    tabclicked(tab){
        this.selecttab(tab.id)
    }

    build(){
        this.controlpanel.x
        for(let tab of this.tabs){
            this.controlpanel.a(tab)
            tab.ae("mousedown", this.tabclicked.bind(this, tab))
        }
        return this
    }

    settabs(tabs){
        this.tabs = tabs
        return this.build()
    }
}
function TabPane(id, args){return new TabPane_(id, args)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// basicboard
const STANDARD_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
const ANTICHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1"
const RACING_KINGS_START_FEN = "8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - - 0 1"
const HORDE_START_FEN = "rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1"
const THREE_CHECK_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 3+3 0 1"
const CRAZYHOUSE_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[] w KQkq - 0 1"

const WHITE = 1
const BLACK = 0

VARIANT_KEYS = [    
    [ "standard", "Standard" ],
    [ "chess960", "Chess960" ],
    [ "crazyhouse", "Crazyhouse" ],
    [ "antichess", "Giveaway" ],
    [ "atomic", "Atomic" ],
    [ "horde", "Horde" ],
    [ "kingOfTheHill", "King of the Hill" ],
    [ "racingKings", "Racing Kings" ],
    [ "threeCheck", "Three-check" ]
]

VARIANT_ICONS = {    
    standard: "&#x0023;",
    chess960: "&#x0027;",
    crazyhouse: "&#xE00B;",
    antichess: "&#x0040;",
    atomic: "&#x003E;",
    horde: "&#x005F;",
    kingOfTheHill: "&#x0028;",
    racingKings: "&#xE00A;",
    threeCheck: "&#x002E;"
}

function getvariantdisplayname(variantkey){
    let item = VARIANT_KEYS.find(x => x[0] == variantkey)
    if(!item) return "! Unknown Variant !"
    return item[1]
}

function getstartfenforvariantkey(variantkey){
    if(variantkey == "antichess") return ANTICHESS_START_FEN
    if(variantkey == "racingKings") return RACING_KINGS_START_FEN
    if(variantkey == "horde") return HORDE_START_FEN    
    if(variantkey == "threeCheck") return THREE_CHECK_START_FEN
    if(variantkey == "crazyhouse") return CRAZYHOUSE_START_FEN
    return STANDARD_START_FEN
}

function getclassforpiece(p, style){
    let kind = p.kind
    if(p.color == WHITE) kind = "w" + kind
    return style + "piece" + kind
}

class Square{
    constructor(file, rank){
        this.file = file
        this.rank = rank
    }

    toalgeb(){
        return `${String.fromCharCode(this.file + 'a'.charCodeAt(0))}${String.fromCharCode(7 - this.rank + '1'.charCodeAt(0))}`
    }
}
function Sq(file, rank){return new Square(file, rank)}

class Move{
    constructor(fromsq, tosq, prompiece){
        this.fromsq = fromsq
        this.tosq = tosq
        this.prompiece = prompiece
    }

    toalgeb(){
        let algeb = `${this.fromsq.toalgeb()}${this.tosq.toalgeb()}`
        if(this.prompiece) algeb += this.prompiece.kind
        return algeb
    }
}

class Vect{
    constructor(x, y){
        this.x = x
        this.y = y
    }

    p(v){
        return V(this.x + v.x, this.y + v.y)
    }

    m(v){
        return V(this.x - v.x, this.y - v.y)
    }

    l(){
        return Math.sqrt(this.x*this.x + this.y*this.y)
    }

    s(s){
        return V(s*this.x, s*this.y)
    }
}
function V(x,y){return new Vect(x,y)}

class Arrow_ extends Div_{
    setcolor(color){
        this.linediv.bc(color)
        this.pointdiv.e.style.borderLeft = `${this.pointheight}px solid ${color}`
    }
    constructor(from, to, argsopt){
        super()
        let args = argsopt || {}
        let opacity = args.opacity || 1
        this.op(opacity)
        let diff = to.m(from)
        let l = diff.l()
        let linewidth = args.linewidth || 12
        let pointwidth = args.pointwidth || 36
        let pointheight = args.pointheight || 36
        this.pointheight = pointheight
        let color = args.color || "#ff7"        
        this.h(pointwidth).w(l)
        let lineheight = l - pointheight        
        this.linediv = Div().h(linewidth).w(lineheight).float("left")
        this.linediv.mt((pointwidth - linewidth)/2).bc(color)
        this.pointdiv = Div().float("right")
        this.pointdiv.e.style.borderTop = `${pointwidth/2}px solid transparent`
        this.pointdiv.e.style.borderBottom = `${pointwidth/2}px solid transparent`
        this.pointdiv.e.style.borderLeft = `${pointheight}px solid ${color}`
        let rot = Math.asin((to.y - from.y)/l)        
        if(to.x<from.x) rot = Math.PI-rot             
        this.transform(`rotate(${rot/Math.PI*180}deg)`)        
        this.a(this.linediv, this.pointdiv)                        
        let shifty = l/2*Math.sin(rot) - pointwidth/2
        let shiftx = - (l/2 - l/2*Math.cos(rot))
        
        this.t(from.y + shifty).l(from.x + shiftx)
        this.poa()
    }
}
function Arrow(from, to, args){return new Arrow_(from, to, args)}

class Piece{
    constructor(kind, color){
        this.kind = kind || "-"
        this.color = ( color ? color : 0 )
    }

    fenletter(){
        if(this.color == 0) return this.kind
        return this.kind.toUpperCase()
    }

    empty(){
        return this.kind == "-"
    }

    nonempty(){
        return !this.empty()
    }
}

class BasicBoard_ extends e{
    setdrawkind(drawkind){
        this.drawkind = drawkind
        console.log("drawkind", this.drawkind)
        this.drawfromsq = null
        this.drawtosq = null
    }

    setdrawcolor(drawcolor){
        this.drawcolor = drawcolor
    }

    flipcolorname(){
        return this.flip ? "black" : "white"
    }

    squarefromalgeb(algeb){        
        let file = algeb.charCodeAt(0) - "a".charCodeAt(0)
        let rank = this.LAST_SQUARE - ( algeb.charCodeAt(1) - "1".charCodeAt(0) )
        return new Square(file, rank)
    }

    movefromalgeb(algeb){
        return new Move(this.squarefromalgeb(algeb.slice(0,2)), this.squarefromalgeb(algeb.slice(2,4)))
    }

    squaremiddlecoord(sq){
        return this.squarecoord(sq).p(V(this.squaresize/2,this.squaresize/2))
    }

    addmovearrow(move, args){        
        let fromc = this.squaremiddlecoord(move.fromsq)
        let toc = this.squaremiddlecoord(move.tosq)
        //this.arrowcontainer.a(Arrow(fromc, toc, args))
        this.drawcanvas.arrow(fromc, toc, args)
    }

    addalgebmovearrow(algeb, args){        
        let move = this.movefromalgeb(algeb)        
        this.addmovearrow(move, args)
    }

    flipawaresquare(sq){
        let fsq = new Square(sq.file, sq.rank)
        if(this.flip){
            fsq.file = this.LAST_SQUARE - fsq.file
            fsq.rank = this.LAST_SQUARE - fsq.rank
        }
        return fsq
    }

    squarecoord(sq){
        let fsq = this.flipawaresquare(sq)
        return new Vect(fsq.file * this.squaresize, fsq.rank * this.squaresize)
    }

    piececoord(sq){
        let sc = this.squarecoord(sq)
        return new Vect(sc.x + this.piecemargin, sc.y + this.piecemargin)
    }

    fileranktorepindex(file, rank){
        return file + rank * this.NUM_SQUARES
    }

    pieceatsquare(sq){
        return this.rep[this.fileranktorepindex(sq.file, sq.rank)]
    }

    piecedragstart(p, sq, pdiv, ev){                
        if(this.drawkind){
            ev.preventDefault()
            return
        }
        this.draggedp = p
        this.draggedsq = sq
        pdiv.zi(10)
        this.draggedpdiv = pdiv
        this.draggedpdiv.op(0.7)
    }

    getpiececanvas(){
        let piececanvas = Canvas().setWidth(this.boardsize).setHeight(this.boardsize)        
        for(let pdri of this.piecedivregistry){            
            let sc = pdri.sc            
            let light = pdri.light
            piececanvas.ctx.fillStyle = light ? this.lightsquarebc(this.squareop) : this.darksquarebc(this.squareop)
            piececanvas.ctx.fillRect(sc.x, sc.y, this.squaresize, this.squaresize)            
        }
        piececanvas.ctx.drawImage(this.drawcanvas.e, 0, 0)
        for(let pdri of this.piecedivregistry){
            let pdiv = pdri.pdiv            
            let pc = pdri.pc            
            if(pdiv){
                let imgurl = window.getComputedStyle(pdiv.e)["background-image"]
                imgurl = imgurl.substring(5, imgurl.length - 2)    
                let img = Img().width(this.piecesize).height(this.piecesize)
                img.e.src = imgurl                            
                piececanvas.ctx.drawImage(img.e, pc.x, pc.y, this.piecesize, this.piecesize)
            }            
        }
        return piececanvas
    }

    getcanvas(){
        let canvas = Canvas().setWidth(this.outerboardsize).setHeight(this.outerboardsize)
        canvas.ctx.drawImage(this.outerboardcontainerbackgroundcanvas.e, 0, 0)
        canvas.ctx.drawImage(this.innerboardcontainerbackgroundcanvas.e, this.outerboardmargin, this.outerboardmargin)
        canvas.ctx.drawImage(this.boardcontainerbackgroundcanvas.e, this.outerboardmargin + this.innerboardmargin, this.outerboardmargin + this.innerboardmargin)
        canvas.ctx.drawImage(this.getpiececanvas().e, this.outerboardmargin + this.innerboardmargin, this.outerboardmargin + this.innerboardmargin)
        return canvas
    }

    buildpieces(){                
        this.piecedivregistry = []
        this.piececontainer.x
        for(let file=0;file<this.NUM_SQUARES;file++) for(let rank=0;rank<this.NUM_SQUARES;rank++){
            let light = (((file+rank)%2)==1)            
            let sq = new Square(file, rank)                        
            let p = this.pieceatsquare(sq)            
            let sc = this.squarecoord(sq)            
            let pc = this.piececoord(sq)            
            let pdropdiv = Div().poa().tl(sc).w(this.squaresize).h(this.squaresize)
            pdropdiv.ae("dragover", this.piecedragover.bind(this))
            pdropdiv.ae("drop", this.piecedrop.bind(this, sq))
            pdropdiv.ae("mousedown", this.squareclicked.bind(this, sq))
            this.piececontainer.a(pdropdiv)
            let pdiv = null
            if(p.nonempty()){                
                pdiv = Div().poa().tl(pc)                
                pdiv.w(this.piecesize).h(this.piecesize)
                let klass = getclassforpiece(p, this.piecestyle)                    
                pdiv.ac(klass).sa("draggable", true)
                pdiv.ae("dragstart", this.piecedragstart.bind(this, p, sq, pdiv))
                pdiv.ae("dragover", this.piecedragover.bind(this))
                pdiv.ae("drop", this.piecedrop.bind(this, sq))
                pdiv.ae("mousedown", this.squareclicked.bind(this, sq))
                this.piececontainer.a(pdiv)                                
            }            
            this.piecedivregistry.push({
                pdiv: pdiv,
                sc: sc,
                pc: pc,                    
                light: light
            })
        }        
        let relturn = this.flip ? this.blackturn : this.whiteturn
        let onturnarrow = relturn ? this.bottomturnarrow : this.topturnarrow
        let offturnarrow = relturn ? this.topturnarrow : this.bottomturnarrow
        onturnarrow.disp("initial").setcolor(this.whiteturn ? "#fff" : "#000")
        offturnarrow.disp("none")
    }

    setfromfen(fen){        
        this.fen = fen
        let fenparts = fen.split(" ")
        this.whiteturn = fenparts[1] == "w"
        this.blackturn = !this.whiteturn
        let rankfens = fenparts[0].split("/")
        for(let i=0;i<this.BOARD_AREA;i++) this.rep[i] = new Piece()
        let i = 0
        for(let rankfen of rankfens){
            for(let c of Array.from(rankfen)){
                if((c>='0')&&(c<='9')){
                    let repcnt = c.charCodeAt(0) - '0'.charCodeAt(0)
                    for(let j=0;j<repcnt;j++){
                        this.rep[i++] = new Piece()
                    }
                }else{
                    let kind = c
                    let color = 0
                    if((c>='A')&&(c<="Z")){
                        kind = c.toLowerCase()
                        color = 1
                    }                    
                    this.rep[i++] = new Piece(kind, color)
                }
            }
        }        
        this.buildpieces()
        return this
    }

    settottalheight(totalheight){
        this.totalheight = totalheight || 400        
        this.capturedpanelheight = ( this.variantkey == "crazyhouse" ? 0.1 * this.totalheight : 0 )
        this.outerboardsize = this.totalheight - ( 2 * this.capturedpanelheight )
        this.outerboardmargin = ( 0.02 * this.outerboardsize )
        this.innerboardsize = this.outerboardsize - ( 2 * this.outerboardmargin )
        this.innerboardmargin = ( 0.01 * this.outerboardsize )
        this.boardsize = this.innerboardsize - ( 2 * this.innerboardmargin )
        this.squaresize = ( this.boardsize / this.NUM_SQUARES )
        this.piecesize = ( this.squaresize * this.piecefactor )
        this.piecemargin = ( this.squaresize - this.piecesize ) / 2
        this.build()
    }

    resize(width, height){
        this.settottalheight(height)
        this.setfromfen(this.fen)
        return this
    }

    piecedragover(ev){
        ev.preventDefault()
    }

    piecedrop(sq, ev){        
        ev.preventDefault()
        let m = new Move(this.draggedsq, sq)
        this.draggedpdiv.tl(this.piececoord(sq))
        if(this.dragmovecallback){
            this.dragmovecallback(m)
        }
    }

    totalwidth(){
        return this.outerboardsize
    }

    squareclicked(sq){
        if(!this.drawkind){            
            return
        }        
        this.drawanimationcanvas.clear()
        if(this.drawkind == "arrow"){
            if(this.drawfromsq){
                console.log("arrow to", sq)
                this.drawings.push({
                    kind: "arrow",
                    color: this.drawcolor,
                    fromalgeb: this.drawfromsq.toalgeb(),
                    toalgeb: sq.toalgeb()
                })
                this.setdrawings(this.drawings, true)
                this.drawfromsq = null
            }else{
                this.drawfromsq = sq
                console.log("arrow from", sq)
            }
        }
    }

    build(){
        this.maincontainer = Div().disp("flex").fd("column")
        // captured panels
        this.capturedpanels = []
        for(let i=0;i<2;i++){
            let cp = Div().w(this.outerboardsize).h(this.capturedpanelheight).bc("#ccc")
            this.capturedpanels.push(cp)
        }
        // board containers
        this.outerboardcontainer = Div().w(this.outerboardsize).h(this.outerboardsize).por().bc("#ddd")
        //this.outerboardcontainer.bimg(this.backgroundimagepath)
        this.outerboardcontainerbackgroundcanvas = BackgroundCanvas(this.outerboardsize, this.outerboardsize, this.backgroundimagepath).poa()        
        this.outerboardcontainer.a(this.outerboardcontainerbackgroundcanvas)
        this.innerboardcontainer = Div().w(this.innerboardsize).h(this.innerboardsize).poa()
        this.innerboardcontainer.t(this.outerboardmargin).l(this.outerboardmargin).bc("#eee")
        //this.innerboardcontainer.bimg(this.backgroundimagepath)
        this.innerboardcontainerbackgroundcanvas = BackgroundCanvas(this.innerboardsize + 1, this.innerboardsize + 1, this.backgroundimagepath).poa()        
        this.innerboardcontainer.a(this.innerboardcontainerbackgroundcanvas)
        this.outerboardcontainer.a(this.innerboardcontainer)
        this.boardcontainer = Div().w(this.boardsize).h(this.boardsize).poa()
        this.boardcontainer.t(this.innerboardmargin).l(this.innerboardmargin).bc("#ffe")
        //this.boardcontainer.bimg(this.backgroundimagepath)
        this.boardcontainerbackgroundcanvas = BackgroundCanvas(this.boardsize + 1, this.boardsize + 1, this.backgroundimagepath).poa()        
        this.boardcontainer.a(this.boardcontainerbackgroundcanvas)
        this.innerboardcontainer.a(this.boardcontainer)
        this.maincontainer.a(this.capturedpanels[0], this.outerboardcontainer, this.capturedpanels[1])
        // square container
        this.squarecontainer = Div().w(this.boardsize).h(this.boardsize).poa()
        for(let file=0;file<8;file++) for(let rank=0;rank<8;rank++){
            let sq = new Square(file, rank)
            let sc = this.squarecoord(sq)
            let sqdiv = Div().poa().w(this.squaresize).h(this.squaresize).tl(sc)            
            let light = (((file+rank)%2)==1)            
            sqdiv.bc( light ? this.darksquarebc() : this.lightsquarebc() ).op(this.squareop)            
            this.squarecontainer.a(sqdiv)
        }
        this.boardcontainer.a(this.squarecontainer)
        // arrow container
        this.arrowcontainer = Div().w(this.boardsize).h(this.boardsize).poa()        
        // draw container
        this.drawcontainer = Div().w(this.boardsize).h(this.boardsize).poa()        
        this.drawcanvas = Canvas().setWidth(this.boardsize).setHeight(this.boardsize).poa()        
        this.drawingscanvas = Canvas().setWidth(this.boardsize).setHeight(this.boardsize).poa()                
        this.drawanimationcanvas = Canvas().setWidth(this.boardsize).setHeight(this.boardsize).poa()                
        this.drawcontainer.a(this.drawcanvas, this.drawingscanvas, this.drawanimationcanvas)
        // piece container
        this.piececontainer = Div().w(this.boardsize).h(this.boardsize).poa()        
        this.boardcontainer.a(this.arrowcontainer, this.drawcontainer, this.piececontainer)
        this.boardcontainer.ae("mousemove", this.boardcontainermousemove.bind(this))
        this.boardcontainer.ae("mouseout", this.boardcontainermouseout.bind(this))  
        this.x.a(this.maincontainer)
        // turn arrows
        let turnarrowmiddlex = this.squaresize*8+2*this.innerboardmargin+1.3*this.outerboardmargin
        this.fullboardmargin = this.innerboardmargin + this.outerboardmargin
        let bottomturnarrowfrom = V(turnarrowmiddlex, this.squaresize*8+this.fullboardmargin)
        let bottomturnarrowto = V(turnarrowmiddlex, this.squaresize*7+this.fullboardmargin)
        let topturnarrowfrom = V(turnarrowmiddlex, this.squaresize*0+this.fullboardmargin)
        let topturnarrowto = V(turnarrowmiddlex, this.squaresize*1+this.fullboardmargin)
        let turnarrowargs = {linewidth: this.outerboardmargin/2, pointwidth: this.outerboardmargin, pointheight: this.squaresize/2}
        this.bottomturnarrow = Arrow(bottomturnarrowfrom, bottomturnarrowto, turnarrowargs).disp("none")
        this.topturnarrow = Arrow(topturnarrowfrom, topturnarrowto, turnarrowargs).disp("none")
        this.outerboardcontainer.a(this.bottomturnarrow, this.topturnarrow)
    }

    boardvect2sq(boardvect){
        let file = Math.floor(boardvect.x / this.squaresize)
        let rank = Math.floor(boardvect.y / this.squaresize)
        return this.flipawaresquare(Sq(file, rank))
    }

    fillsquare(canvas, sq, fillstyle){
        let sqc = this.squarecoord(sq)
        canvas.ctx.fillStyle = fillstyle
        canvas.ctx.fillRect(sqc.x, sqc.y, this.squaresize, this.squaresize)
    }

    boardcontainermousemove(ev){
        if(this.drawkind){
            let bccr = this.boardcontainer.e.getBoundingClientRect()
            let boardvect = V(ev.clientX - bccr.x, ev.clientY - bccr.y)
            let sq = this.boardvect2sq(boardvect)        
            if(this.drawkind == "arrow"){
                if(this.drawfromsq){                        
                    this.drawanimationcanvas.clear()
                    this.fillsquare(this.drawanimationcanvas, this.drawfromsq, "rgb(255, 255, 0, 0.5)")
                    this.fillsquare(this.drawanimationcanvas, sq, "rgb(255, 255, 0, 0.5)")
                    this.drawanimationcanvas.arrow(this.squaremiddlecoord(this.drawfromsq), this.squaremiddlecoord(sq), {color: this.drawcolor})
                }else{
                    this.drawanimationcanvas.clear()                    
                    this.fillsquare(this.drawanimationcanvas, sq, "rgb(255, 255, 0, 0.5)")
                }
            }
        }        
    }

    boardcontainermouseout(){
        this.drawanimationcanvas.clear()
    }

    buildall(){
        this.build()
        this.buildpieces()
    }

    setflip(flip){
        this.flip = ( flip ? true : false )
    }

    darksquarebc(opopt){
        let op = opopt || 1
        return `rgba(63, 63, 63, ${op})`
    }

    lightsquarebc(opopt){
        let op = opopt || 1
        return `rgba(255, 255, 255, ${op})`
    }

    setdrawings(drawings, changed){
        this.drawings = drawings
        this.drawingscanvas.clear()
        for(let drawing of this.drawings){
            if(drawing.kind == "arrow"){
                let afsq = this.flipawaresquare(this.squarefromalgeb(drawing.fromalgeb))
                let atosq = this.flipawaresquare(this.squarefromalgeb(drawing.toalgeb))
                this.drawingscanvas.arrow(this.squaremiddlecoord(afsq), this.squaremiddlecoord(atosq), {color: drawing.color})
            }
        }
        if(changed && this.drawingschangedcallback) this.drawingschangedcallback(this.drawings)
    }

    deletedrawing(){
        if(this.drawings.length > 0){
            let drawing = this.drawings.pop()
            console.log("deleted drawing", drawing)
            this.setdrawings(this.drawings, true)
        }
    }

    constructor(argsopt){
        super("div")        
        let args = argsopt || {}
        this.drawkind = null
        this.drawcolor = "green"
        this.draggedp = undefined
        this.draggedsq = undefined
        this.draggedpdiv = undefined
        this.NUM_SQUARES = 8
        this.LAST_SQUARE = 7
        this.BOARD_AREA = this.NUM_SQUARES * this.NUM_SQUARES
        this.rep = new Array(this.BOARD_AREA)
        this.variantkey = args.variantkey || "standard"
        this.backgroundimage = args.backgroundimage || "wood.jpg"
        this.backgroundimagepath = `static/img/backgrounds/${this.backgroundimage}`
        this.setflip(args.flip)
        this.fen = args.fen || getstartfenforvariantkey(this.variantkey)
        this.piecefactor = args.piecefactor || 0.9
        this.piecestyle = args.piecestyle || "alpha"        
        this.squareop = args.squareop || 0.2
        this.settottalheight(args.totalheight)      
        this.dragmovecallback = args.dragmovecallback  
        this.drawingschangedcallback = args.drawingschangedcallback
        this.setfromfen(this.fen)
        this.setdrawings([])
    }
}
function BasicBoard(argsopt){return new BasicBoard_(argsopt)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// labeled
class Labeled_ extends e{
    constructor(caption, element){
        super("div")
        this.disp("inline-block")
        this.container = Div().disp("flex").curlyborder().pad(3).ai("center").jc("space-around").mar(1).bc("#ffe")
        this.captiondiv = Div().pad(2).pl(8).pr(8).html(caption).ff("monospace").ml(1).mr(6).bc("#eff").curlyborder()
        this.contentdiv = Div().a(element).mr(5)
        this.container.a(this.captiondiv, this.contentdiv)
        this.a(this.container)
    }

    setLabelWidth(labelwidth){
        this.captiondiv.w(labelwidth)
        return this
    }
}
function Labeled(caption, element){return new Labeled_(caption, element)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// labeled
class IconText_ extends e{
    constructor(caption, icon){
        super("div")
        this.caption = caption
        this.icon = icon
        this.disp("inline-block")
        this.container = Div().disp("flex").ai("center")
        this.captiondiv = Div().html(this.caption).ml(4)
        this.icondiv = Div().ff("lichess").html(this.icon)
        this.container.a(this.icondiv, this.captiondiv)
        this.a(this.container)
    }
}
function IconText(caption, icon){return new IconText_(caption, icon)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// font explorer
function FontExplorerTd(){
    return Td().pad(5).pl(8).pr(8).bds("solid").bdw(1).bdc("#777")
}
class FontExplorer_ extends e{    
    build(){
        this.table.x
        for(let charcode = 32; charcode < 128; charcode++){
            let char = String.fromCharCode(charcode)            
            this.table.a(Tr().fs(20).a(                
                FontExplorerTd().html(`${charcode}`).ff("monospace"),                
                FontExplorerTd().html(char).ff("monospace"),
                FontExplorerTd().html(char).ff(this.fontfamily),                
                FontExplorerTd().html(`&amp;#x${charcode.toString(16).toUpperCase().padStart(4, "0")};`).ff("monospace")                
            ))
        }
        return this
    }

    constructor(fontfamily){
        super("div")
        this.table = Table()
        this.fontfamily = fontfamily
        this.a(this.table)
        this.build().pad(5)
    }
}
function FontExplorer(fontfamily){return new FontExplorer_(fontfamily)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// iframe
class Iframe_ extends e{
    constructor(){
        super("iframe")
    }

    setWidth(width){
        this.sa("width", width)
        return this
    }

    setHeight(height){
        this.sa("height", height - 3)
        return this
    }

    setSrc(url){
        this.sa("src", url)
        return this
    }

    resize(width, height){                
        this.setWidth(width).setHeight(height)
    }

    rendermarkdown(){        
        let contente = this.e.contentDocument.body
        let content = contente.innerHTML        
        content = md2html(content)
        console.log("head", this.e.contentDocument.head)
        this.e.contentDocument.head.innerHTML = `<link rel="stylesheet" href="/static/css/markdown.css" />`
        contente.innerHTML = ""
        let waitdiv = Div().html("Loading content, please wait ...").ff("monospace").c("#007")
        contente.appendChild(waitdiv.e)
        setTimeout(function(){
            contente.innerHTML = content            
        }.bind(this), 2000)        
    }

    domarkdown(){
        this.ae("load", this.rendermarkdown.bind(this))
        return this
    }
}
function Iframe(){return new Iframe_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// content button
class ContentButton_ extends e{
    constructor(content, callback){
        super("div")        
        this.disp("inline-block").cp().bds("solid").bdw(1).pad(2).bdc("#777").pl(4).pr(4).mar(2).curlyborder(5)
        if(callback) this.ae("mousedown", callback)        
        this.content = content
        this.a(this.content)
        this.setselected(false)
        this.ac("unselectable")
    }
}
function ContentButton(content, callback){return new ContentButton_(content, callback)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// icon button
class IconButton_ extends ContentButton_{    
    constructor(caption, icon, callback, fontsizeopt){
        super(IconText(caption, icon), callback)
        this.fontsize = fontsizeopt || 14        
        this.content.fs(this.fontsize)        
        this.h(this.fontsize).pr(6)
    }
}
function IconButton(caption, icon, callback, fontsizeopt){return new IconButton_(caption, icon, callback, fontsizeopt)}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////
// radio group
class RadioGroup_ extends e{
    itemclicked(item){
        this.selid = item.id
        if(this.id && this.selid) setLocal(this.id, this.selid)
        if(this.selcallback) this.selcallback(this.selid)
        this.build()
    }

    build(){
        this.container.x
        for(let item of this.items){
            this.container.a(item.setselected(this.selid && (item.id == this.selid)))            
        }
        return this
    }

    constructor(){
        super("div")
        this.disp("inline-block")
        this.container = Div().pad(3).pl(4).pr(4).curlyborder().disp("flex").bc("#eee")        
        this.a(this.container)
        this.items = []        
    }

    setitems(items){
        this.selid = null
        if(this.id) this.selid = getLocalElse(this.id, items[0].id)        
        this.items = items
        if(this.selcallback) this.selcallback(this.selid)
        for(let item of this.items){
            item.ae("mousedown", this.itemclicked.bind(this, item))
        }
        return this.build()
    }

    setselcallback(selcallback){
        this.selcallback = selcallback
        return this
    }
}
function RadioGroup(){return new RadioGroup_()}
////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////

