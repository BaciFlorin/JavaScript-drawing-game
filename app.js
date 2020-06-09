const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const app = express();
const port = 9999;
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

//data
var users = [];
var rooms = [];

//citire cuvinte din fisier
const fs = require('fs');
let rawdata = fs.readFileSync('words.json');
let wordsJSON = JSON.parse(rawdata);
let words = wordsJSON.cuvinte;

io.on('connection', (socket) => {
    // se genereaza un identificator unic pentru user
    // se inregistreaza userul respectiv
    // se trimite inapoi identificatorul
    var unicId = generateUnicIdentifierUser();
    users.push({
        id: unicId,
        username: "",
        conn: socket,
        admin: false
    });

    socket.emit('identifier', { id: unicId });
    /* functiile care se ocupa cu comunicarea intre socketuri*/

    socket.on('disconnect', (data) => {
        // gasim userul cu pricina
        var me = users.find((element) => {
            return element.id == unicId;
        });

        // gasim camera in care el se afla
        if (me.username != "") {
            // se cauta camera in care cineva intrat are numele userului
            var room = rooms.find((element) => {
                var tmp = element.users.find((usr) => {
                    return usr === me.username;
                });
                return tmp != undefined;
            });

            //daca este o camera atunci il scoatem de acolo
            if (room != undefined) {
                room.users = room.users.filter((element)=>{
                    return element != me.username;
                });

                if (room.users.length == 0) {
                    // daca nu mai este cineva acolo se scoate si camera
                    rooms = rooms.filter((element)=>{
                        return element.id != room.id;
                    });
                    console.log("Camera goala, se sterge!");
                }
                else
                {
                    // anuntam restul participantilor sa il scoata din camera
                    socket.broadcast.emit('user delogat', { roomId: room.id, users: room.users, username: me.username });
                    if(me.admin)
                    {
                        // trebuie sa facem pe altcineva admin
                        var nextAdmin = users.find((element)=>{
                            return element.username == room.users[0];
                        });

                        nextAdmin.admin = true;
                        
                        console.log("Se pune noul admin "+ nextAdmin.username);

                        // anuntam userul ca el este adminul acum
                        getSocketFromId(nextAdmin.id).emit('admin nou');
                    }
                }
            }
        }
        users = users.filter((element)=>{
            return element != me;
        });
    });

    socket.on('deconectare', (data)=>{
        // gasim userul cu pricina
        var me = users.find((element) => {
            return element.id == unicId;
        });

        // gasim camera in care el se afla
        if (me.username != "") {
            // se cauta camera in care cineva intrat are numele userului
            var room = rooms.find((element) => {
                var tmp = element.users.find((usr) => {
                    return usr === me.username;
                });
                return tmp != undefined;
            });

            //daca este o camera atunci il scoatem de acolo
            if (room != undefined) {
                room.users = room.users.filter((element)=>{
                    return element != me.username;
                });

                if (room.users.length == 0) {
                    // daca nu mai este cineva acolo se scoate si camera
                    rooms = rooms.filter((element)=>{
                        return element.id != room.id;
                    });
                    console.log("Camera goala, se sterge!");
                }
                else
                {
                    // anuntam restul participantilor sa il scoata din camera
                    socket.broadcast.emit('user delogat', { roomId: room.id, users: room.users, username: me.username });
                    if(me.admin)
                    {
                        // trebuie sa facem pe altcineva admin
                        var nextAdmin = users.find((element)=>{
                            return element.username == room.users[0];
                        });

                        nextAdmin.admin = true;
                        
                        console.log("Se pune noul admin "+ nextAdmin.username);

                        // anuntam userul ca el este adminul acum
                        getSocketFromId(nextAdmin.id).emit('admin nou');
                    }
                }
            }
        }
        me.username = "";
        me.admin = false;
    });
    
    socket.on('mesaj nou', (data) => {socket.broadcast.emit('mesaj nou', data);});
    socket.on('desen', (data) => socket.broadcast.emit('desen', data));
    socket.on('cuvant ales',(data)=>socket.broadcast.emit('cuvant ales', data));
    socket.on('cuvant ghicit', (data)=>socket.broadcast.emit('cuvant ghicit',data));
    socket.on('scor jucator', (data)=>{socket.broadcast.emit('scor jucator', data)});
    socket.on('desen sters',(data)=>socket.broadcast.emit('desen sters', data));
});


app.get('/', (req, res) => {
    res.render('index',{mesajEroare:undefined});
});

app.post('/creare-joc', (req, res) => {
    var nume = req.body["username"];
    var userId = req.body["id"];
    console.log("Nume:" + nume);
    console.log("ID:" + userId);

    // verificam daca este un user cu numele respectiv
    var user = users.find((element) => {
        return element.username == nume;
    });

    //var pattern = /^[a-zA-Z]*$/i;

    //if(!pattern.test(nume))
    //{
    //    res.render('index',{mesajEroare: "Username-ul trebuie să aibă conțină doar litere!"});
    //}
    if(nume.length < 5 || nume.length > 25)
    {
        res.render('index',{mesajEroare: "Username-ul trebuie să aibă între 5 și 25 de caractere!"});
    }
    else if (user != undefined) {
        console.log("Numele deja exista!");
        res.render('index',{mesajEroare: "Utilizatorul există deja!" });
    }
    else {
        console.log("Se adauga un user nou in camera!");
        var roomId = generateUnicIdentifierRoom();
        rooms.push({
            id: roomId,
            users: [nume],
            isGameStarted: false
        });
        // se updateaza usernameul celui cu id-ul specificat
        var adminRoom = users.find((element) => {
            return element.id == userId;
        });

        adminRoom.username = nume;
        adminRoom.admin = true;

        // trimitem catre user id-ul camerei ca sa il stie
        getSocketFromId(userId).emit('room id', { id: roomId, username: nume });
        res.render('waitingRoom', {
            creator: true,
            participants: [nume],
            roomCode: roomId,
            mesajEroare: undefined
        });
    }
});

app.post('/participa-joc', (req, res) => {
    var nume = req.body["username"];
    var roomId = req.body["roomIdentifier"];
    var userId = req.body["userIdentifier"];

    console.log("Nume:" + nume + " ID:" + userId);
    // verificam daca este un user cu numele respectiv
    var user = users.find((element) => {
        return element.username == nume;
    });
    //var pattern = /^[a-zA-Z]*$/i;
    
    //if(pattern.test(nume))
    //{
    //    res.render('index',{mesajEroare: "Username-ul trebuie să aibă conțină doar litere!"});
    //}
    if(nume.length < 5 || nume.length > 25)
    {
        res.render('index',{mesajEroare: "Username-ul trebuie să aibă între 5 și 25 de caractere!"});
    }
    else if (user != undefined) {
        console.log("Numele deja exista!");
        res.render('index',{mesajEroare:"Utilizatorul există deja!"});
    }
    else {
        var wantedRoom = rooms.find((element) => {
            return element.id === roomId;
        });

        if (wantedRoom == undefined) {
            console.log("Camera cu id-ul " + roomId + " nu exista!");
            res.render('index',{mesajEroare:"Camera introdusă nu există!"});
        }
        else if (wantedRoom.isGameStarted == true) {
            console.log("Jocul in aceasta camera deja a inceput, nu se mai poate intra!");
            res.render('index',{mesajEroare:"Jocul deja a început!"});
        }
        else if (wantedRoom.users.length == 6)
        {
            console.log("S-a atins numarul maxim de jucatori");
            res.render('index',{mesajEroare:"Camera este plină, s-a atins numărul maxim de jucători!"});
        }
        else {
            //updatare nume user
            // se updateaza usernameul celui cu id-ul specificat
            users.find((element) => {
                return element.id == userId;
            }).username = nume;

            //adaugare user in camera
            wantedRoom.users.push(nume);

            // confirmam userului id-ul camerei pe care il are
            var userSocket = getSocketFromId(userId);
            userSocket.emit('room id', { id: roomId, username: nume });
            
            // spunem celorlalti useri din camera ca a intrat un jucator nou
            userSocket.broadcast.emit('user nou camera', { username: nume, idCamera: roomId });

            res.render('waitingRoom', {
                creator: false,
                participants: wantedRoom.users,
                roomCode: roomId,
                mesajEroare:undefined
            });
        }
    }
});

app.post('/porneste-joc', (req, res) => {
    var userIdentifier = req.body["userIdentifier"];
    var roomIdentifier = req.body["roomIdentifier"];
    
    //gasim camera de joaca
    var room = rooms.find((element) => {
        return element.id == roomIdentifier;
    });

    if(room.users.length > 1)
    {
        room.isGameStarted = true;

        //determinam numarul de cuvinte necesare
        var numberOfWords = 3 * room.users.length + 2;
        //amestecam cuvintele si trimitem catre jucatori ca sa le poata memora
        var wordsToSend = shuffle(words).slice(0, numberOfWords);

        //trimite mesaj la toti ca jocul a inceput ca fiecare sa primeasca pagina de start
        var conn =  getSocketFromId(userIdentifier);
        conn.broadcast.emit('incepe jocul', { roomId: roomIdentifier, words:wordsToSend });
        conn.emit('cuvinte joc', { words:wordsToSend });

        //gasim camera cu in vector si luam useri conectati pentru ai trimite
    
        // returnam pagina de joc
        res.render('gameRoom', { participants: room.users });
    }
    else
    {
        // trebuie mai mult de 1 jucator pentru a incepe jocul
        console.log("Trebuie mai mult de 1 jucator!");
        res.render('waitingRoom', {
            creator: true,
            participants: room.users,
            roomCode: room.id,
            mesajEroare: "Trebuie să fie mai mult de un jucător ca jocul să înceapă!"
        });
    }
});

app.post('/vizualizare-joc', (req, res) => {
    var roomIdentifier = req.body["roomIdentifier"];

    //cautam camera in care e jucatorul
    var room = rooms.find((element) => {
        return element.id == roomIdentifier;
    });
    // trimitem pagina jocului impreuna cu userii conectati
    res.render('gameRoom', { participants: room.users });
});


server.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:` + port.toString()));


//usefull functions

function generateUnicIdentifierUser() {
    return "xxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
}

function generateUnicIdentifierRoom() {
    return "xxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
}

function getSocketFromId(id) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].id == id) {
            return users[i].conn;
        }
    }
}

function shuffle (array) {
    var i = 0, j = 0, temp = null;
  
    for (i = array.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1));
      temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
}