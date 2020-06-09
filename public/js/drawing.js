//Desenare pe whiteboard
var context = undefined;
var canvas = undefined;
var current = undefined;
var drawing = false;
var lineWidth = 5;
var canvasBounding = undefined;

function initCanvas() {
  canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  context = canvas.getContext('2d');
  var dimensions = document.getElementsByClassName('dimension');

  current = {
    color: 'black'
  };

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 5), false);

  for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  for(var i=0;i<dimensions.length;i++){
    dimensions[i].addEventListener('click', onDimensionUpdate, false);
  }

  document.getElementsByClassName('eraser')[0].addEventListener('click', onEraserClick, false);

  window.addEventListener('resize', onResize, false);
  onResize();
}

function drawLine(x0, y0, x1, y1, color, emit) {
  
    // se deseneaza doar daca e randul jucatorului
    if(x0 != 0 && y0 != 0)
    {
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.stroke();
      context.closePath();
    

      if (!emit) { return; }
      var w = canvas.width;
      var h = canvas.height;

      sendData('desen', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color,
        roomId: roomId,
        lineWidth: lineWidth
      });
    }
}

function initMargins()
{
  canvasBounding = {
    left: canvas.getBoundingClientRect().left,
    top: canvas.getBoundingClientRect().top
  };
}


function onMouseDown(e) {
    drawing = true;
    if(canvasBounding != undefined)
    {
      current.x = e.clientX - canvasBounding.left;
      current.y = e.clientY - canvasBounding.top;
    }
}

function onMouseUp(e) {
  if (!drawing) { return; }
  drawing = false;
  if (isDrawing) {
    var x = e.clientX - canvasBounding.left;
    var y = e.clientY - canvasBounding.top;
    drawLine(current.x, current.y, x, y, current.color, true);
  }
}

function onMouseMove(e) {
  if (!drawing) { return; }
  if (isDrawing) {
    // se initializeaza marginile canvasului necesare calculului coordonatelor
    // se apeleaza aici pentru ca la acest moment s-a ales cuvantul si div-ul de deasupra este gol
    initMargins();
    var x = e.clientX - canvasBounding.left;
    var y = e.clientY - canvasBounding.top;
    drawLine(current.x, current.y, x, y, current.color, true);
    current.x = e.clientX - canvasBounding.left;
    current.y = e.clientY - canvasBounding.top;
  }
  
}

function onColorUpdate(e) {
  clearBorder();
  e.target.setAttribute("id","toolBorder");
  current.color = e.target.className.split(' ')[1];
}

function onDimensionUpdate(e){
  clearBorder();
  e.target.setAttribute("id","toolBorder");
  var dimension = e.target.className.split(' ')[1];
  if(dimension == "small")
  {
    lineWidth = 5;
  }
  else if(dimension == "medium")
  {
    lineWidth = 8;
  }
  else
  {
    lineWidth = 15;
  }
}

function onEraserClick(e){
  clearBorder();
  e.target.setAttribute("id","toolBorder");
  current.color = "#ccdfcb";
}

// limit the number of events per second
function throttle(callback, delay) {
  var previousCall = new Date().getTime();
  return function () {
    var time = new Date().getTime();

    if ((time - previousCall) >= delay) {
      previousCall = time;
      callback.apply(null, arguments);
    }
  };
}

function onDrawingEvent(data) {
  if (data.roomId == roomId) {
    var w = canvas.width;
    var h = canvas.height;
    lineWidth = data.lineWidth;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }
}

// make the canvas fill its parent
function onResize() {
  var zonaDesenat = document.getElementById("gameArea").getBoundingClientRect();
  canvas.width = Math.floor((65*zonaDesenat.width)/100);
  canvas.height = 530;
}

function clearWhiteBoard()
{
  if(isDrawing)
  {
    sendData('desen sters',{roomId:roomId});
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
  
}

function clear()
{
  lineWidth = 5;
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function clearBorder()
{
  var colors = document.getElementsByClassName('color');
  var dimensions = document.getElementsByClassName('dimension');
  var eraser = document.getElementsByClassName('eraser')[0];

  for(var i=0;i<colors.length;i++)
  {
    if(colors[i].hasAttribute("id"))
    {
      colors[i].removeAttribute("id");
      return;
    }
  }

  for(var i=0;i<dimensions.length;i++)
  {
    if(dimensions[i].hasAttribute("id"))
    {
      dimensions[i].removeAttribute("id");
      return;
    }
  }

  if(eraser.hasAttribute("id"))
  {
    eraser.removeAttribute("id");
  }
}