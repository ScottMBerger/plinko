
var users = [];
var sockets = {};

var resultTable = [];
resultTable[0] = {num: -1300, land:"m"};
resultTable[1] = {num: -1000, land:"m"};
resultTable[2] = {num: -700, land:"r"};
resultTable[3] = {num: -400, land:"r"};
resultTable[4] = {num: -100, land:"m"};
resultTable[5] = {num: 200, land:"m"};
resultTable[6] = {num: 500, land:"r"};
resultTable[7] = {num: 800, land:"r"};
resultTable[8] = {num: 1100, land:"m"};
var rand = resultTable[Math.floor(Math.random() * resultTable.length)];
var endgame = true;
var leftBets = [];
var midBets = [];
var rightBets = [];
var winTbl = {"l":leftBets, "m":midBets, "r":rightBets};

setInterval(function(){
	if (endgame) {
		var ballx = Math.floor(350 + (Math.random() * 2798));

		console.log("end game");
		if (rand.land == "l") {
			calcWinners(leftBets);
		} else if (rand.land == "m") {
			calcWinners(midBets);
		} else if (rand.land == "r") {
			calcWinners(rightBets);
		}
		
		io.emit('end game', {
	      ballx: rand.num
	  });
	  endgame = false;
	  leftBets = [];
	  midBets = [];
		rightBets = [];
	} else {
		var ballx = Math.floor(-1399 + (Math.random() * 2798));
		rand = resultTable[Math.floor(Math.random() * resultTable.length)];
		//rand.num = 345//+345 2799.99 3144
		rand.num = Math.floor(345 + (Math.random() * 2799.99));
		console.log(rand.num);

		io.emit('new game', {
	      ballx: rand.num
	  });
	  console.log("new: "+rand.land);
	  
	  endgame = true;
	}

}, 8000);

io.on('connection', function(socket){
  console.log('A user connected! '+socket.id);

  var currentPlayer = {
  	id: socket.id,
  	credits: 1000
  };

  socket.emit('updateCredits', 1000);
  sockets[socket.id] = socket;
  users[currentPlayer.id] = currentPlayer;

  socket.on('left bet', function(msg){
  	console.log(socket.id+ " leftbets");
  	leftBets.push({
  		bet: msg,
  		id: socket.id
  	});
  	users[currentPlayer.id].credits -= msg;
  	socket.emit('updateCredits', users[currentPlayer.id].credits);
    io.emit('left message', msg, socket.id);
  });

  socket.on('middle bet', function(msg){
  	midBets.push({
  		bet: msg,
  		id: socket.id
  	});
  	users[currentPlayer.id].credits -= msg;
  	socket.emit('updateCredits', users[currentPlayer.id].credits);
    io.emit('middle message', msg, socket.id);
  });

  socket.on('right bet', function(msg){
  	rightBets.push({
  		bet: msg,
  		id: socket.id
  	});
  	users[currentPlayer.id].credits -= msg;
  	socket.emit('updateCredits', users[currentPlayer.id].credits);
    io.emit('right message', msg, socket.id);
  });
});

function calcWinners(table) {
		table.forEach( function(u) {
			console.log(u.bet);
			users[u.id].credits += u.bet*2
			sockets[u.id].emit('updateCredits', users[u.id].credits);
		});
}
function sendUpdates() {
    users.forEach( function(u) {
        sockets[u.id].emit('updateCredits', users[u.id].credits);
    });
};