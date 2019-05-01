////////////////////////////////////////////////////////////////////
// canvas

let img = Img().width(100).h(100).disp("none")
let canvas = Canvas().width(100).height(100)

let b = BasicBoard({})

let maindiv = Div().pad(5)

let dl = A().href("#").download("canvas.png").html("Download canvas").ae("click", dlCanvas)

function dlCanvas() {
    dl.href(canvas.downloadHref("canvas", "png"))
}

let pd = Div().ac("alphapiecewq").w(50).h(50).disp("none")
maindiv.a(img, canvas, pd, dl)

se("root", maindiv)

setTimeout(function(){
    let imgurl = window.getComputedStyle(pd.e)["background-image"]
    imgurl = imgurl.substring(5, imgurl.length - 2)    
    img.e.src = imgurl
    setTimeout(function(){
        context = canvas.getContext('2d')        
        context.drawImage(img.e, 0, 0)
    })
}, 0)

////////////////////////////////////////////////////////////////////
