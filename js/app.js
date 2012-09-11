fb_oauthurl = "https://www.facebook.com/dialog/oauth/";
fb_scope = "email,user_birthday";
fb_clientid = "286934128081818";
fb_display = "popup";
fb_authurl = "http://54.248.75.147/fbauth.html";

fblogin = function() {
  var FBLogin_URL, fbauth;
  FBLogin_URL = fb_oauthurl + "?scope=" + encodeURIComponent(fb_scope) + "&redirect_uri=" + encodeURIComponent(fb_authurl) + "&display=" + encodeURIComponent(fb_display) + "&client_id=" + encodeURIComponent(fb_clientid);
  fbauth = window.open(FBLogin_URL, 'fbwindow', 'height=200, width=450, top=300, left=300, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');
  fbauth.focus();
  return this;
};

/* Route Initialize */
angular.module('ngView', [], function($routeProvider, $locationProvider) {
  $routeProvider.when('/', {
    templateUrl: 'login.html',
    controller: MMLoginCtrl
  });
  $routeProvider.when('/main', {
    templateUrl: 'main.html',
    controller: MMMainCtrl
  });
  $routeProvider.when('/newgame', {
    templateUrl: 'newgame.html',
    controller: MMNGCtrl
  });
  $routeProvider.when('/game/:qId', {
    templateUrl: '/game.html',
    controller: MMGCtrl
  });

  $locationProvider.html5Mode(true);
});

function MMCtrl($scope, $route, $routeParams, $location) {
  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;
}

function MMLoginCtrl($scope, $http, $location) {
  window.fbAuthResp = function(code) {
    var data;
    if (code === -1 || code === -2) {
      return alert("Facebook回傳資料錯誤! code: " + code);
    } else {
      data = {
        code: code,
        redirect_uri: fb_authurl
      };
      $http.post('/api/Login/',$.param(data)).success(function(data) {
        data = data.json[0].Message[1];
        if (data.Success === true) {
          $location.path('/main')
        }
      });
    }
  };
}

function MMMainCtrl($scope, $http) {
  $scope.template = '';
}

postData = null;
myFbId = "";

function MMNGCtrl($scope, $http, $location) {
  $http.get('/api/Me/').success(function(data) {
    data = data.json[0].Message[1].Data;
    $scope.friendlist = data.friend_list;
    myFbId = data.user_fb_id;
  })
  $scope.submit = function() {
    data = {
      start_time: 1296489600, //this.startTime,
      end_time: 1349020800, //this.stopTime,
      game_name: this.inputGName,
      group_id: this.groupSelect
    };
    $http.post('/api/Paper/', $.param(data)).success(function(data) {
      postData = data.json[0].Message[1].Data;
      $location.path('/game/0');
    })

  }
}
answer = [];
totalTime = 0;
grade = 0;

function MMGCtrl($scope, $http, $routeParams,$timeout,$location) {
  var time, gameTime, key;

  gameTime = new Date().getTime()
  key = $routeParams.qId;
  $scope.gamename = postData.name;
  $scope.question = postData.question[key].content;
  $scope.key = parseInt(key);
  $scope.option = postData.question[key].option;
  $scope.timer = 0;
  $scope.onTimeout = function(){
    $scope.timer++;
    time = $timeout($scope.onTimeout,1000);
  }
  time = $timeout($scope.onTimeout,1000);

  $scope.pick = function(key, value, name) {
    $timeout.cancel(time);
    endTime = new Date().getTime()
    right = 0;
    if(value === postData.question[key].user.user_fb_id) {
      right = 1;
      grade++;
    }

    answer[key] = right;
    qId = postData.question[key].question_id;
    pId = postData._id;
    duration = parseInt((endTime - gameTime)/1000); //使用者花費的時間
    totalTime = totalTime + duration;

  }
}

