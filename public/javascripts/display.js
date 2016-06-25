
var app = angular.module('app', ['ngAnimate']);

app.factory('socket', function ($rootScope) {
	var socket = io();
	return {
		id: function (eventName, callback) {
			$rootScope.socketid = socket.io.engine.id.substr(1, 4);
		},
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		},
		removeAllListeners: function (eventName, callback) {
			socket.removeAllListeners(eventName, function() {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			}); 
		}
	};
});


function ChatBoxController($rootScope, $scope, socket) {
	$scope.messages = [];

	socket.on('chat message', function(msg){
		$scope.messages.push(msg);
	});

	socket.on('player join', function(p){
		$scope.messages.push({user: p + " has joined the server"});
	});

	$scope.addMessage = function(message) {
		data = {user: ($rootScope.name ? $rootScope.name : $rootScope.socketid), msg: message};
		socket.emit('chat message', data);
		$scope.messages.push({user: "You", msg: message});
		$scope.newMessage = '';
	};
}

app.component('chatbox', {
	templateUrl: '/views/chatbox.html',
	controller: ChatBoxController
});

function RecentListController($scope, socket) {
	$scope.recent = [];
	socket.on('payoutState', function(msg){
		$scope.recent.unshift(msg.spot);
	});
}

app.component('recentlist', {
	templateUrl: '/views/recentlist.html',
	controller: RecentListController
});


app.controller('betting', function($scope, $rootScope, $interval, socket) {
	$('#login').openModal();

	$scope.login = function(givenName) {
		$rootScope.name = givenName;
		$('#login').closeModal();
		socket.emit('new player', givenName);
	};

	$scope.credits = false;
	$rootScope.bettingTime = false;
	$scope.betAmount = '';
	$scope.leftBets = {"total":0, "last":0, "list":[]};
	$scope.midBets = {"total":0, "last":0, "list":[]};
	$scope.rightBets = {"total":0, "last":0, "list":[]};
	var timerPromise = false;

	$scope.leftBet = function(amount) {
		if ($rootScope.bettingTime && $scope.credits && $scope.credits > 0 && amount > 0 && amount <= $scope.credits) {
			var bet = {amount: amount, user: ($rootScope.name ? $rootScope.name : $rootScope.socketid)};
			socket.emit('left bet', bet);
		}
	};

	$scope.midBet = function(amount) {
		if ($rootScope.bettingTime && $scope.credits && $scope.credits > 0 && amount > 0 && amount <= $scope.credits) {
			var bet = {amount: amount, user: ($rootScope.name ? $rootScope.name : $rootScope.socketid)};
			socket.emit('middle bet', bet);
		}
	};

	$scope.rightBet = function(amount) {
		if ($rootScope.bettingTime && $scope.credits && $scope.credits > 0 && amount > 0 && amount <= $scope.credits) {
			var bet = {amount: amount, user: ($rootScope.name ? $rootScope.name : $rootScope.socketid)};
			socket.emit('right bet', bet);
		}
	};

	$scope.adjBet = function(entry) {
		if (entry == 'clear') {
			$scope.betAmount = '';
		} else if (entry == 'double') {
			$scope.betAmount = typeof $scope.betAmount == 'number' ? ($scope.betAmount*2 <= $scope.credits ? $scope.betAmount*2 : $scope.credits) : '';
		} else if (entry == 'half') {
			$scope.betAmount = typeof $scope.betAmount == 'number' ? $scope.betAmount/2 : '';
		} else {
			$scope.betAmount = typeof $scope.betAmount == 'number' ? ($scope.betAmount + entry <= $scope.credits ? $scope.betAmount + entry : $scope.credits) : entry;
		}
	};

	socket.on('connect', function(msg){
		socket.id();
 	});

	socket.on('betState', function(msg){
		$scope.payout = '';
		$scope.leftBets = {"total":0, "last": $scope.leftBets.total, "list":[]};
		$scope.midBets = {"total":0, "last": $scope.midBets.total, "list":[]};
		$scope.rightBets = {"total":0, "last": $scope.rightBets.total, "list":[]};

		$rootScope.bettingTime = new Date();
		timerPromise = $interval(function() {
			var now = new Date();
        //$scope.time = now;
        $scope.elapsedMs = 10000 + $rootScope.bettingTime.getTime() - now.getTime();
      }, 31);

	});

	socket.on('payoutState', function(msg){
		$scope.payout = msg.spot;
	});


	socket.on('startState', function(msg){
		if(timerPromise){
			$interval.cancel(timerPromise);
		};

		$rootScope.bettingTime = false;
	});

	socket.on('left message', function(data, sockid){
		$scope.leftBets.last = $scope.leftBets.total;
		$scope.leftBets.total += Number(data.amount);
		$scope.leftBets.list.push(data.user+" "+data.amount);
	});

	socket.on('middle message', function(data, sockid){
		$scope.midBets.last = $scope.midBets.total;
		$scope.midBets.total += Number(data.amount);
		$scope.midBets.list.push(data.user+" "+data.amount);
	});

	socket.on('right message', function(data, sockid){
		$scope.rightBets.last = $scope.rightBets.total;
		$scope.rightBets.total += Number(data.amount);
		$scope.rightBets.list.push(data.user+" "+data.amount);
	});

	socket.on('updateCredits', function (credits) {
		$scope.credits = credits;
	});
});

