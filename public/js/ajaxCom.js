//Ajax communication
function createGame()
{
  var userName = document.getElementById("nume").value;
  if(userName != "")
  {
    var xhttp = new XMLHttpRequest(); 
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        document.body.innerHTML = this.response;
        initInpuEvent();
    }
    };
    xhttp.open("POST","/creare-joc",true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
        id:userId,
        username : userName
    }));
   }
   else  if(userName.length < 5 || username.length > 25)
   {
        document.getElementById("userError").innerHTML = "Username-ul trebuie să aibă între 5 și 25 de caractere!";
   }
   else {
        document.getElementById("userError").innerHTML = "Trebuie completat câmpul user!";
   }
}

function joinGame()
{
  var userName = document.getElementById("nume").value;
  var roomCode = document.getElementById("idJoc").value;

  if(userName != "" && roomCode != "" && roomCode.length == 9)
  {
    var xhttp = new XMLHttpRequest(); 
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        document.body.innerHTML = this.response;
        initInpuEvent();
    }
    };
    xhttp.open("POST","/participa-joc",true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
        userIdentifier : userId,
        roomIdentifier : roomCode,
        username : userName
    }));
   }
   else
   {
       document.getElementById("userError").innerHTML = "Trebuie completat câmpul user, câmpul cod joc, iar codul jocului trebuie să aibă 9 caractere!";
   }
}

function startGame()
{
    var xhttp = new XMLHttpRequest(); 
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        document.body.innerHTML = this.response;
        //initializare spatiu de desenare
        var gameStart = document.getElementsByClassName('whiteboard')[0] != undefined;
        if(gameStart)
        {
            initCanvas();
            prepareGame();
            initInpuEvent();
        }
    }
    };
    xhttp.open("POST","/porneste-joc",true);
    xhttp.setRequestHeader("Content-type", "application/json");
    //trimitem codul camerei si codul userului pentru a sti ce useri trebuie anuntati ca a inceput jocul
    xhttp.send(JSON.stringify({
        userIdentifier : userId,
        roomIdentifier : roomId
    }));
}

function getFrontPage()
{
    var xhttp = new XMLHttpRequest(); 
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.body.innerHTML = this.response;
        }
    };
    xhttp.open("GET","/",true);
    xhttp.send();
}