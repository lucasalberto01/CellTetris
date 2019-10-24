var express = require('express')
var bodyParser     = require("body-parser");
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var passport       = require("passport");
var twitchStrategy = require("passport-twitch").Strategy;

var userOnline = 0

var score = {};

var twitch_client = 'gfsq9gsadlgor57yjimxbasprcvw9w';
var twitch_secret = '98sgkre84cuicf4h24x9dpp78glfnm';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

passport.use(new twitchStrategy({
    clientID: twitch_client,
    clientSecret: twitch_secret,
    callbackURL: "http://179.124.185.94:3000/auth",
    scope: "user:read:email analytics:read:games"
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile)
    User.findOrCreate({ twitchId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/app', (req, res) =>{
    res.sendFile(__dirname + '/public/app.html')
})

app.get("/twitch", passport.authenticate("twitch"));
app.get("/auth", passport.authenticate("twitch", { failureRedirect: "/" }), function(req, res) {
    // Successful authentication, redirect home.
    res.send("Foi");
});


app.get('/play', (req, res) => {
    for (var i = 0; i < score.length; i += 1) {
        score[i].pontos = 0;
        score[i].game_over = false;
    }
    io.emit('PlayGame', {});
    res.json({'Ok' : true})

})

app.get('/reset', (req, res) => {
    for (i in score) {
        score[i].pontos = 0;
        score[i].game_over = false;
    }
    io.emit('RestartGame', {});
    res.json({'Ok' : true})

})

app.get('/zero', (req, res)=>{
    for (i in score) {
        console.log(i)
        score[i].pontos = 0;
        score[i].game_over = false;
    }
    res.json({'Ok' : true})
})

app.get('/add', (req, res) =>{
    io.emit('AddLine', {});
    res.json({'Ok' : true})
})

io.on('connection', function(socket){
    var address = socket.handshake.address;

    userOnline++

    let sala = socket.handshake.query.sala;
    let nome = socket.handshake.query.nome;

    
    var room = io.sockets.adapter.rooms[sala];
    var dono = false;
    if(room !== undefined){
        console.log(room)
    }else{
        dono = true
    }

    socket.join(sala);

    score[socket.id] = { pontos : 0, id : socket.id.toString(), game_over : false, nome : nome, sala : sala, dono : dono};

    io.to(sala).emit('UpdateNumber', { 'number' : userOnline})
    console.log('a user connected. Id > ', socket.id, ' ip > ', address);



    socket.on('disconnect', () => {
        console.log('a user disconnected');
        userOnline--;    
        
        let novo_dono = [];
        for(i in score){
            if(!score[i].dono && score[i].sala === sala){
                novo_dono.push(score[i])
            }
        }

        var random_ = novo_dono[Math.floor(Math.random()*novo_dono.length)];
        if(random_){
            console.log('Novo Dono: ', random_);
            score[random_.id].dono = true;
        }  

        delete score[socket.id];

        io.to(sala).emit('UpdateNumber', { 'number' : userOnline})
    });

    socket.on('GetNumberUsers', (fn) =>{
        fn({'number' : userOnline})
    })

    socket.on('SetScore', (data, fn)=>{
        score[socket.id].pontos = data.score;

        let list = []
        for(i in score){
            if(score[i].sala === sala){
                list.push(score[i]);
            }
        }

        fn({'pontos' : list });
    });

    socket.on('SetGameOver', (data)=>{
        score[socket.id].game_over = true;
    })

    socket.on('AddLine', ()=>{
        let list = []

        for(a in score){
            if(!score[a].game_over && parseInt(score[a].pontos) > 0 && a !== socket.id && score[a].sala === sala){
                list.push(a);
            }
        }

        var random_ = list[Math.floor(Math.random()*list.length)];

        if(random_){
            console.log('Mandando linha para: ', random_)
            io.to(random_).emit('AddLine', {});
        }  
    })

    

    



});

http.listen(3000, function(){
  console.log('listening on *:3000');
});