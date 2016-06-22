
var socket = io();
var app = angular.module('app', ['ngAnimate']);

app.controller('betting', function($scope, $interval) {
	$scope.credits = false;
	$scope.bettingTime = false;
  $scope.leftBets = {"total":0, "list":[]};
  $scope.midBets = {"total":0, "list":[]};
  $scope.rightBets = {"total":0, "list":[]};
  timerPromise = false;
  $scope.messages = [];
  $scope.recent = [];

  $scope.getTimeRemaining = function(){
  	var now = new Date();
    elapsedMs = now.getTime() - $scope.bett.getTime();
	  return elapsedMs;
	}

	$('#lbutton').click(function(){
		if ($scope.bettingTime && $scope.credits && $scope.credits > 0 && $('#linput').val() > 0) {
		  socket.emit('left bet', $('#linput').val());
		  console.log($('#linput').val());
		  //$('#linput').val('');
		  return false;
		}
	});

	$('#mbutton').click(function(){
		if ($scope.bettingTime && $scope.credits && $scope.credits > 0 && $('#minput').val() > 0) {
		  socket.emit('middle bet', $('#minput').val());
		  //$('#minput').val('');
		  return false;
		}
	});

	$('#rbutton').click(function(){
		if ($scope.bettingTime && $scope.credits && $scope.credits > 0 && $('#rinput').val() > 0) {
		  socket.emit('right bet', $('#rinput').val());
		  //$('#rinput').val('');
		  return false;
		 }
	});

	socket.on('connect', function(){
		$scope.$apply(function () {
	    $scope.socketid = socket.io.engine.id.substr(1, 4);
	  });
	});

  socket.on('betState', function(msg){
	  $scope.$apply(function () {
	  	$scope.payout = '';
      $scope.leftBets = {"total":0, "list":[]};
      $scope.midBets = {"total":0, "list":[]};
  		$scope.rightBets = {"total":0, "list":[]};
  		

      $scope.bettingTime = new Date();
      timerPromise = $interval(function() {
        var now = new Date();
        //$scope.time = now;
        $scope.elapsedMs = 5000 + $scope.bettingTime.getTime() - now.getTime();
      }, 31);

    });
	});

	socket.on('payoutState', function(msg){
	  $scope.$apply(function () {
	  	$scope.recent.unshift(msg.spot);
	  	$scope.payout = msg.spot;
  		
    });
	});


	socket.on('startState', function(msg){
	  $scope.$apply(function () {
	  	if(timerPromise){
	  		$interval.cancel(timerPromise);
	  	};
	  	
  		$scope.bettingTime = false;
    });
	});

	socket.on('left message', function(amount, user){
	  $scope.$apply(function () {
	  		$scope.leftBets.total += Number(amount);
        $scope.leftBets.list.push(user.substr(3, 4)+" "+amount);
    });
	});

	socket.on('middle message', function(amount, user){
	  $scope.$apply(function () {
	  		$scope.midBets.total += Number(amount);
        $scope.midBets.list.push(user.substr(3, 4)+" "+amount);
    });
	});

	socket.on('right message', function(amount, user){
	  $scope.$apply(function () {
	  		$scope.rightBets.total += Number(amount);
        $scope.rightBets.list.push(user.substr(3, 4)+" "+amount);
    });
	});

	socket.on('updateCredits', function (credits) {
      $scope.credits = credits;
  });

	//chat
  $('form').submit(function(){
    socket.emit('chat message', $('#m').val());
    $scope.$apply(function () {
    	$scope.messages.push("You: "+$('#m').val());
    });
    $('#m').val('');
    return false;
  });

  socket.on('chat message', function(msg){
  	$scope.$apply(function () {
    	$scope.messages.push(msg);
    });
  });
});

