$(function(){
    var sala = sessionStorage.getItem('Sala');
    var nome = sessionStorage.getItem('Nome');
    var x = document.getElementById("foi");
    
    if(sala){
        $('#game').show()
        $('#sala').html(sala)
    }else{
        $('#indisponivel').show();
    }
    var socket = io({
        query : {
            sala : sala,
            nome : nome
        }
    });


    $client = $('.client').blockrain_client();

    $client.blockrain_client('clientData', {})

    $tetris = $('.game').blockrain({
        onGameOver: function() {
            socket.emit('SetGameOver', {'game_over' : true})
        },
        onLine : function(){
            socket.emit('AddLine')
        },
        onRender : function(data){
            //console.log(data);
            //$client.blockrain_client('clientData', data) 
        },
        onRender2 : function(data){
            console.log('a', data)
            $client.blockrain_client('clientData', data) 
        }
    });
    
    //$tetris.blockrain();

    $('#add').click(() =>{
    $tetris.blockrain('addline');
    })

    socket.emit('GetNumberUsers', (data) => {
        $('#n_users').html(data.number)
    })

    socket.on('UpdateNumber', (data)=>{
        $('#n_users').html(data.number)
    })

    socket.on('PlayGame', ()=>{
        x.play()
        $tetris.blockrain('start');
    });

    socket.on('RestartGame', () => {
        x.play()
        $tetris.blockrain('restart');
    })

    socket.on('AddLine', ()=>{
        $tetris.blockrain('addline');
    })

    socket.on('disconnect', ()=>{
        sessionStorage.clear();
        window.location = '/'
    })

    

    setInterval(() =>{
        var score = $tetris.blockrain('score');
        $('#score').html(score);
        //$('#usuarios').empty();
        var saida
        socket.emit('SetScore', { 'score' : score}, (data) => {
        
            
            $.map(data.pontos,function(e){

                if(e.dono && e.id === socket.id){
                    $('#dono').show();
                }
                //console.log(e.id, socket.id, e.dono)

                var tipo;

                if(e.game_over){
                    tipo = 'bg-warning'
                
                }else if(e.dono){
                    tipo = 'bg-success'
                
                }

                let html = `
                    <tr class="${tipo}">
                        
                        <td>${e.nome}</td>
                        <td>${e.pontos}</td>
                        <td>${e.game_over}</td>
                        
                    </tr>
                `;
                saida = saida + html;
            })

            $('#usuarios').html(saida);
            
        })
    }, 1000)
})