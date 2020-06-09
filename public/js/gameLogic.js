// variabile necesare logicii
var gameStart = false;
var round = 1;
var userIndex = 0;
var participants = [];
var wordsToGuess = [];
var isWordChoosed = false;
var magicWord = "";
var isWordFind = false;
var nrPlayersGuessWord = 1;
var isRoundOver = false;
var isDrawing = false;

// variabile necesare calcul scor
var score = 0;
var startTime = undefined;
var stopTime = undefined;

// salvam id-urile timerelor pentru a le opri
var endRoundTimeoutID = 0;
var chooseRandomWordTimeoutID = 0;

// timp pus la dispozitie jucatorilor in secunde
var chooseWordTime = 15;
var roundTime = 60;

// functie apelata la inceput de program cand vrem sa initializam variabilele necesare logicii jocului
function prepareGame() {
    gameStart = true;
    //avem nevoie de numele userilor
    var participantsList = document.getElementById("participanti").getElementsByTagName("li");
    for (var i = 0; i < participantsList.length; i++) {
        var numeParticipant = participantsList[i].getElementsByClassName("numeParticipant")[0].innerText;
        var scorParticipant = participantsList[i].getElementsByClassName("scorParticipant")[0].innerText;
        participants.push({ 
            nume: numeParticipant,
            scor: parseInt(scorParticipant)
        });
    }
    chooseWord();
}

// functie care daca esti cumva urmatorul participant care trebuie sa aleaga cuvantul si sa il deseneze iti arata pe ecran cele 3 cuvinte
// sau daca nu esti iti spune ce user alege cuvantul
function chooseWord() {
    // participantul ce trebuie sa aleaga cuvantul
    var currentUser = participants[userIndex].nume;

    document.getElementById("prompt").innerHTML = "<h3>Alege un cuvânt!</h3>";

    document.getElementById('round').innerHTML = `Runda ${round}`;
    // daca cumva cel care trebuie sa aleaga esti tu atunci alegi dintre cele 3 cuvinte
    if (currentUser == username) {
        //luam 3 cuvinte din cele pe care le avem
        var words = wordsToGuess.slice(0, 3);

        // punem cuvintele pe ecran ca sa le vedem
        showWordsInGame(words);

        startTimer(chooseWordTime);

        //are 15 secunde sa se hotarasca la un cuvant daca nu se apealeaza functia care alege automat unul
        chooseRandomWordTimeoutID = setTimeout(chooseRandomWord, chooseWordTime * 1000, words);
    }
    else {
        document.getElementById("prompt").innerHTML = "<h3>" + currentUser + " alege un cuvant</h3>";
    }
}

//functie ce afiseaza in joc cuvintele ce trebuie alese
function showWordsInGame(array) {
    var wordsContainer = document.getElementById("cuvinte");
    var text = '<ol id="chestionar"><div class="varianta">';

    for (var i = 0; i < array.length; i++) {
        text += '<div class="varianta-content"><input type="radio" name="cuv" id="cuvant' + i.toString() + '" value="' + array[i] + '">';
        text += '<label for="cuvant' + i.toString() + '">' + array[i] + '</label></div>';         
    }
    text += '</div><button onclick="chooseWordManually()">Alege</button></ol>';
    wordsContainer.innerHTML = text;
}

// functie ce alege automat un cuvant
function chooseRandomWord(array) {
    if (!isWordChoosed) {
        document.getElementById("cuvinte").innerHTML = "";
        // alegem random cuvantul
        var index = parseInt(Math.random() * array.length);
        magicWord = array[index];
        // se scoate cuvantul folosit
        wordsToGuess.splice(wordsToGuess.indexOf(magicWord), 1);
        // afisam ce cuvant am ales
        document.getElementById("prompt").innerHTML = `Cuvantul ales este ${magicWord}!`;
        // anuntam si pe restu din camera ce cuvant este ales
        sendData('cuvant ales', { word: magicWord, roomId: roomId });
        // cuvantul este ales si de asemenea pentru cine l-a ales e deja gasit
        isWordChoosed = true;
        isWordFind = true;
        // el este cel care deseneaza
        isDrawing = true;

        clearTimer();
        beginRound();
    }
    else {
        // cuvantul este deja ales manual de user
    }
}

// functie ce afiseaza ascuns cuvantul ales
function showHiddenWord() {
    var lungimeCuvant = magicWord.length;
    document.getElementById("prompt").innerHTML = "Cuvântul ascuns: " + "_ ".repeat(lungimeCuvant);
}

// functie ce se apeleaza cand utilizatorul alege el manual un cuvant
function chooseWordManually() {
    clearTimeout(chooseRandomWordTimeoutID);
    var inputs = document.getElementsByName("cuv");
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].checked) {
            magicWord = inputs[i].value;
            // se scoate cuvantul folosit
            wordsToGuess.splice(wordsToGuess.indexOf(magicWord), 1);
            document.getElementById("cuvinte").innerHTML = "";
            document.getElementById("prompt").innerHTML = `Cuvântul ales este ${magicWord}!`;
            sendData('cuvant ales', { word: magicWord, roomId: roomId });
            isWordChoosed = true;
            isWordFind = true;
            // el este cel care deseneaza
            isDrawing = true;
            clearTimer();
            beginRound();
        }
    }
}

function beginRound() {
    //se memoreaza momentul cand a inceput jocul
    startTime = new Date().getTime();

    startTimer(roundTime);

    //are 60 de secunde la dispozitie userul sa deseneze sau sa ghiceasca cuvantul
    endRoundTimeoutID = setTimeout(endRound, roundTime * 1000);
}

function endRound() {
    if (!isRoundOver) {
        // stergem evenimentul de timeout
        clearTimeout(endRoundTimeoutID);

        isRoundOver = true;
        calculateScore();

        // pregatim pentru urmatoarea runda
        if (userIndex >= participants.length - 1) {
            // s-a ajuns la ultimul participant se va incepe o noua runda
            if (round == 3) {
                document.getElementById('prompt').innerHTML = "Joc terminat! Se anunță câștigătorul!";
                document.getElementById('timer').innerHTML = "";
                // jocul s-a terminat
                setTimeout(endGame, 4000);
            }
            else {
                document.getElementById('prompt').innerHTML = "Se începe o rundă nouă!";
                setTimeout(nextRound, 4000);
            }
        }
        else {
            document.getElementById('prompt').innerHTML = "Cuvântul era "+magicWord+"!";
            setTimeout(nextPlayer, 4000);
        }
    }
}

function nextPlayer() {
    userIndex += 1;
    isWordFind = false;
    isRoundOver = false;
    isWordChoosed = false;
    nrPlayersGuessWord = 1;
    isDrawing = false;
    clear();
    chooseWord();
}

function nextRound() {
    //se incepe o noua runda
    round += 1;
    userIndex = 0;
    isWordFind = false;
    isRoundOver = false;
    isWordChoosed = false;
    nrPlayersGuessWord = 1;
    isDrawing = false;
    clear();
    chooseWord();
}


function calculateScore() {
    // se actualizeaza scorul doar la cei care au ghicit
    if (isWordFind) {
        if(isDrawing)
        {
            // daca este cel care a desenat, se adauga la scor
            // Aici e in functie de cati jucatori au ghicit
            score += 100 + nrPlayersGuessWord * 25;
        }
        else
        {
            // jucator obisnuit
            // 200 pentru ca a ghicit cuvantul
            // si un bonus influentat de cat de repede l-a ghici
            score += 200 + 3 * (60 - (Math.floor((stopTime-startTime)/1000)));
        }
        updateScoreList(username, score);
        updateScoreScreen(username, score);
        sendData('scor jucator',{roomId: roomId, name: username, score: score});
    }
}

function updateScoreList(username, score)
{
    participants.find((element)=>{
        return element.nume == username;
    }).scor = score;
}

function updateScoreScreen(username, score)
{
    //avem nevoie de numele userilor
    var participantsList = document.getElementById("participanti").getElementsByTagName("li");
    for (var i = 0; i < participantsList.length; i++) {
        var numeParticipant = participantsList[i].getElementsByClassName("numeParticipant")[0].innerText;
        if(numeParticipant == username)
        {
            participantsList[i].getElementsByClassName("scorParticipant")[0].innerHTML = score;
        }
    }
}

function endGame() {
    var winner = participants.sort((a,b)=>{
        return b.scor - a.scor;
    })[0];
    if(winner.nume != username)
    {
        document.getElementById('prompt').innerHTML = `Câștigatorul este ${winner.nume} cu scorul de ${winner.scor}`;
    }
    else
    {
        document.getElementById('prompt').innerHTML = `Am câștigat cu scorul de ${winner.scor}`;
    }
}
