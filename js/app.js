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