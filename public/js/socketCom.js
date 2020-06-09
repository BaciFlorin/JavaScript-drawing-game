var username = "";
var userId;
var roomId;
var connected = false;

var socket = io();

// send data
function sendData(event, data)
{
    socket.emit(event, data);
}

//socket events

socket.on('identifier',(data)=>{
    userId = data.id;
});


socket.on('room id',(data)=>{
    roomId = data.id;
    username = data.username;
});

socket.on('user nou camera',(data)=>{
    if(data.idCamera == roomId)
    {
        // adaugam username in lista
        var newUser = document.createElement("li");
        newUser.innerHTML = "<div id='profileP'><img src='/images/batman.png' alt='BatmanProfile'></div><div id='numeP'>"+ data.username +"</div>";
        var listaParticipanti = document.getElementById("participanti");
        listaParticipanti.appendChild(newUser);
        
        // face scroll pana la ultimul element
        listaParticipanti.scrollTop = listaParticipanti.scrollHeight;
        infoMessage(data.username + " s-a conectat!");
    }
});

socket.on('incepe jocul',(data)=>{
    if(roomId == data.roomId)
    {
        //salvam cuvintele cu care va trebuie sa ne jucam
        wordsToGuess = data.words;
        //facem o cerere ca sa primim si noi pagina de start a jocului
        var xhttp = new XMLHttpRequest(); 
        xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.body.innerHTML = this.response;
            initCanvas();
            prepareGame();
        }
        };
        xhttp.open("POST","/vizualizare-joc",true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify({
            roomIdentifier : roomId
        }));
        
    }
});

//primim cuvintele cu care trebuie sa ne jucam, noi fiind cel care a initiat jocul
socket.on('cuvinte joc',(data)=>{
    wordsToGuess = data.words;
});

//comunicarea in chat
socket.on('mesaj nou', (data)=>{
    // trebuie adaugat un mesaj in lista, daca acel mesaj se adreseaza noua
    if(data.roomId == roomId)
    {
        puneMesajPeEcran({username:data.username, message:data.message});
    }
});

//in caz de inchidere, se anunta serverul pentru a lua masuri
socket.on('disconnect', () => {
    socket.emit('disconnect');
});

//se anunta toti participanti ca un user s-a delogat ca sa poata face modificarile
socket.on('user delogat',(data)=>{
    //updatam useri din camera daca suntem cumva in camera de asteptare sau de joaca
    var listaParticipanti = document.getElementById("participanti");
    if(listaParticipanti && data.roomId == roomId)
    {
        infoMessage(data.username + " s-a deconectat!");
        while(listaParticipanti.hasChildNodes())
        {
            listaParticipanti.removeChild(listaParticipanti.lastChild);
        }
        var useriNoi = data.users;
        for(var i=0;i<useriNoi.length;i++)
        {
            var user = document.createElement("li");
            var participant = participants.find((element)=>{
                return element.nume == useriNoi[i];
            })
            if(gameStart)
            {
                user.innerHTML = "<div class='numeParticipant'>"+ participant.nume +"</div><div class='score'>Scor:<div class='scorParticipant'>"+ participant.scor +"</div></div>";
            }
            else
            {
                user.innerHTML = "<div id='profileP'><img src='/images/batman.png' alt='BatmanProfile'></div><div id='numeP'>"+ useriNoi[i] +"</div>";
            }
            listaParticipanti.appendChild(user);
            // face scroll pana la ultimul element
            listaParticipanti.scrollTop = listaParticipanti.scrollHeight;
        }
        
        //updatam si lista de participanti din timpul jocului
        if(participants.length != 0)
        {
            if(participants[userIndex].nume == data.username)
            {
                // participantul alegea un cuvant
                if(!isWordChoosed)
                {
                    clearTimeout(chooseRandomWordTimeoutID);
                }
                endRound();
            }

            // scoatem jucatorul
            participants = participants.filter((element)=>{
                return element.nume != data.username;
            });

            if(participants.length == 1)
            {
                clearTimeout(chooseRandomWordTimeoutID);
                clearTimeout(endRoundTimeoutID);
                document.getElementById("round").innerHTML = "";
                clearTimer();
                endGame();
            }
        }

    }
});

// desenare pe canvas
socket.on('desen', onDrawingEvent);

//primire cuvant
socket.on('cuvant ales',(data)=>{
    if(roomId == data.roomId)
    {
        magicWord = data.word;
        wordsToGuess.splice(wordsToGuess.indexOf(magicWord),1);
        showHiddenWord();
        beginRound();
    }
});

// eveniment ce ma anunta ca un user a ghicit cuvantul
socket.on('cuvant ghicit',(data)=>{
    if(data.roomId == roomId)
    {
        nrPlayersGuessWord+=1;
        // daca toti participantii au gasit cuvantul si runda nu e gata, atunci se inchide runda
        if(nrPlayersGuessWord == participants.length && !isRoundOver)
        {
            clearTimer();
            endRound();
        }
    }
});


socket.on('admin nou',(data)=>{
    var incepe = document.getElementById("incepeJocul");
    if(incepe != undefined)
    {
        document.getElementById("incepeJocul").innerHTML = "<p>Administratorul s-a deconectat, ai fost ales ca nou administrator pentru a începe jocul! </p><button onclick='startGame()'>Începe jocul</button>"
    }
});


socket.on('scor jucator', (data)=>{
    if(roomId == data.roomId)
    {
        updateScoreList(data.name, data.score);
        updateScoreScreen(data.name, data.score);
    }
});

socket.on('desen sters',(data)=>{
    if(roomId == data.roomId)
    {
        clear();
    }
});

