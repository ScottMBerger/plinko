
var app = angular.module('app', ['ngAnimate']);

app.factory('socket', function ($rootScope) {
	var socket = io();
	console.log(socket.io.engine.id);
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


function ChatBoxController($scope, socket) {
	$scope.messages = [];

	socket.on('chat message', function(msg){
		$scope.messages.push(msg);
	});

	$scope.addMessage = function(message) {
		socket.emit('chat message', message);
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
	$scope.credits = false;
	$scope.bettingTime = false;
	$scope.betAmount = '';
	$scope.leftBets = {"total":0, "last":0, "list":[]};
	$scope.midBets = {"total":0, "last":0, "list":[]};
	$scope.rightBets = {"total":0, "last":0, "list":[]};
	var timerPromise = false;

	$scope.leftBet = function(amount) {
		if ($scope.bettingTime && $scope.credits && $scope.credits > 0 && amount > 0 && amount <= $scope.credits) {
			socket.emit('left bet', amount);
		}
	};

	$scope.midBet = function(amount) {
		if ($scope.bettingTime && $scope.credits && $scope.credits > 0 && amount > 0 && amount <= $scope.credits) {
			socket.emit('middle bet', amount);
		}
	};

	$scope.rightBet = function(amount) {
		if ($scope.bettingTime && $scope.credits && $scope.credits > 0 && amount > 0 && amount <= $scope.credits) {
			socket.emit('right bet', amount);
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

		$scope.bettingTime = new Date();
		timerPromise = $interval(function() {
			var now = new Date();
        //$scope.time = now;
        $scope.elapsedMs = 5000 + $scope.bettingTime.getTime() - now.getTime();
      }, 31);

	});

	socket.on('payoutState', function(msg){
		$scope.payout = msg.spot;
	});


	socket.on('startState', function(msg){
		if(timerPromise){
			$interval.cancel(timerPromise);
		};

		$scope.bettingTime = false;
	});

	socket.on('left message', function(amount, user){
		$scope.leftBets.last = $scope.leftBets.total;
		$scope.leftBets.total += Number(amount);
		$scope.leftBets.list.push(user.substr(3, 4)+" "+amount);
	});

	socket.on('middle message', function(amount, user){
		$scope.midBets.last = $scope.midBets.total;
		$scope.midBets.total += Number(amount);
		$scope.midBets.list.push(user.substr(3, 4)+" "+amount);
	});

	socket.on('right message', function(amount, user){
		$scope.rightBets.last = $scope.rightBets.total;
		$scope.rightBets.total += Number(amount);
		$scope.rightBets.list.push(user.substr(3, 4)+" "+amount);
	});

	socket.on('updateCredits', function (credits) {
		$scope.credits = credits;
	});
});

