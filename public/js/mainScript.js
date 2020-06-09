/* Chat room */

// Sends a chat message
function trimiteMesaj() {
    var input = document.getElementById("inputMesaj");
    var message = input.value;
    //daca avem ceva in mesaj, trimite
    if (message) {
        if (message.length > 50) {
            message = message.slice(0, 50);
        }
        input.value = "";
        puneMesajPeEcran({
            username: username,
            message: message
        });

        document.getElementById("charactersLeft").innerHTML = "0/50";
        //trimite mesaj catre ceilalti
        sendData('mesaj nou', { username: username, roomId: roomId, message: message });
    }
}

function puneMesajPeEcran(mesaj) {
    let listaMesaje = document.getElementsByClassName("mesaje")[0];
    let mesajNou = document.createElement("li");
    if (mesaj.message == magicWord) {
        //s-a gasit cuvantul, se memoreaza momentul cand s-a gasit
        mesajNou.innerHTML = "<div class='wordFind'>" + mesaj.username + " a ghicit cuvântul!</div>";
        if (!isWordFind && mesaj.username == username) {
            // s-a gasit cuvantul
            isWordFind = true;
            stopTime = new Date().getTime();

            // se anunta restul participantilor ca am gasit cuvantul
            nrPlayersGuessWord += 1;
            if (nrPlayersGuessWord == participants.length) {
                clearTimer();
                endRound();
            }
            sendData('cuvant ghicit', { roomId: roomId });
        }
    } else {
        mesajNou.innerHTML = "<div class='userNameChat'>" + mesaj.username + "</div><div class='userMessageChat'>" + mesaj.message + "</div>";
    }
    listaMesaje.appendChild(mesajNou);
    scrollToBottom();
}

function scrollToBottom() {
    var messages = document.getElementsByClassName("mesaje")[0];
    messages.scrollTop = messages.scrollHeight;
}

function infoMessage(mesaj) {
    let listaMesaje = document.getElementsByClassName("mesaje")[0];
    let mesajNou = document.createElement("li");
    mesajNou.innerHTML = "<div class='infoMessage'>" + mesaj + "</div>";
    listaMesaje.appendChild(mesajNou);
}

//Evenimente
window.addEventListener('keydown', (event) => {
    if (event.which === 13) {
        var nume = document.getElementById('nume');
        var code = document.getElementById('idJoc');
        if (nume != undefined && code != undefined) {
            nume = nume.value;
            code = code.value;
            if (nume != "" && code != "") {
                joinGame();
            }
            else if (nume != "") {
                createGame();
            }
        }
        else {
            var continut = document.getElementById('inputMesaj').value;
            if (continut != "") {
                trimiteMesaj();
            }
        }
    }
});

// eveniment care permite doar litere sa fie scrise in inputurile de la mesage
var stopString = "";
function initInpuEvent() {
    var inp = document.getElementById("inputMesaj");
    if (inp != undefined) {
        inp.addEventListener("keyup", (e) => {
            if ((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 97 && e.keyCode <= 122) || e.keyCode == 8) {
                var left = inp.value.length;
                if (left <= 50) {
                    document.getElementById("charactersLeft").innerHTML = left.toString() + "/50";
                    stopString = inp.value;
                }
                else {
                    inp.value = stopString;
                }
            }
            else {
                inp.value = stopString;
            }
        });
    }
}

// evenimente care imi opresc introducerea altor caractere in inputuri
var nume = "";
var code = "";

function initRules() {
    console.log("am ajuns!");
    var numeInput = document.getElementById("nume");
    var codeInput = document.getElementById("idJoc");

    if (numeInput != undefined && codeInput != undefined) {
        numeInput.addEventListener('keydown', (e) => {
            if ((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 97 && e.keyCode <= 122) || e.keyCode == 8) {
                nume = numeInput.value;
            }
            else {
                numeInput.value = nume;
            }
        });

        // permite doar litere mari si cifre
        codeInput.addEventListener('keydown', (e) => {
            if ((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode == 8) {
                nume = codeInput.value;
            }
            else {
                codeInput.value = nume;
            }
        });

        numeInput.addEventListener('paste', (e) => {
            var pattern = /^[a-zA-Z]*$/i;
            console.log("Am ajuns:" + numeInput.value);
            if (pattern.test(numeInput.value)) {
                numeInput.value = "";
                document.getElementById("userError").innerHTML = "Numele trebuie să conțină doar litere!";
            }
        });

        codeInput.addEventListener('paste', (e) => {
            var pattern = /^[0-9A-Z]*$/i;
            if (pattern.test(codeInput.value)) {
                codeInput.value = "";
                document.getElementById("userError").innerHTML = "Codul trebuie să conțină doar litere mari și numere!";
            }
        });
    }
}

// timer
var timerIntervalID = 0;

function startTimer(timeMax) {
    timerIntervalID = setInterval(() => {
        timeMax -= 1;
        document.getElementById("timer").innerHTML = "Timp rămas " + timeMax;

        if (timeMax <= 0) {
            clearTimer();
        }
    }, 1000);
}

function clearTimer() {
    clearInterval(timerIntervalID);
}

// deconectare
function disconnect() {
    // cere deconectarea din camera
    sendData('deconectare', {});
    getFrontPage();
    clearTimer();
    clearTimeout(endRoundTimeoutID);
    clearTimeout(chooseRandomWordTimeoutID);
    document.getElementById("timer").innerHTML = "";
    // reinitializam variabilele de lucru
    round = 1;
    score = 0;
    userIndex = 0;
    participants = [];
    wordsToGuess = [];
    isWordChoosed = false;
    magicWord = "";
    isWordFind = false;
    nrPlayersGuessWord = 1;
    isRoundOver = false;
    gameStart = false;
    roomId = 0;
}
