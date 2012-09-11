fb_oauthurl = "https://www.facebook.com/dialog/oauth/";
fb_scope = "email,publish_actions,user_birthday,user_about_me,user_location,user_hometown,user_work_history,user_education_history,user_relationships,user_photos,user_status,user_notes,user_videos,friends_photos,friends_status,friends_notes,friends_videos,read_stream,user_likes,user_subscriptions,user_groups,read_friendlists";
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
window.activeFb = function() {
    (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=286934128081818";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}

/* Route Initialize */
angular.module('ngView', [], function($routeProvider, $locationProvider) {
  $routeProvider.when('/login', {
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
  $routeProvider.when('/gameover/:pId', {
    templateUrl: '/gameover.html',
    controller:MMGOCtrl
  });
  $routeProvider.when('/invited', {
    templateUrl: 'invited.html',
    controller:MMICtrl
  });
  $routeProvider.when('/rank', {
    templateUrl: 'rank.html',
    controller:MMRCtrl
  });
  $locationProvider.html5Mode(true);
});

isLogin = false;
oldPath = '/main';

function MMCtrl($scope, $route, $routeParams, $location, $http) {
  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;
  $http.get('/api/IsLogin/').success(function(data){
    data = data.json[0].Message[1].Data.LoginStatus;
    isLogin = data;
    oldPath = $location.path();
    if(oldPath === '/') {
      oldPath = '/main';
    }
    if(isLogin === false) {
      $location.path('/login');
    } else if($location.path() === '/') {
      $location.path('/main');
    }
  })
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
          isLogin = true;
          $location.path(oldPath);
        }
      });
    }
  };
}

invitedList = [];

function MMMainCtrl($scope, $http) {
  $scope.template = '';
  $http.get('/api/Paper/Unread/').success(function(data){
    data = data.json[0].Message[1].Data;
    invitedList = data;
    $scope.invitedNum = invitedList.length;
  })
  $http.get('/api/Notification/').success(function(data){
    data = data.json[0].Message[1].Data;
    try {
      data = data.reverse();
    }catch(error) {}
    $scope.Notification = data;
  })
}

postData = null;
myFbId = "";

function MMNGCtrl($scope, $http, $location) {
  $http.get('/api/Me/').success(function(data) {
    data = data.json[0].Message[1].Data;
    $scope.friendlist = data.friend_list;
    myFbId = data.user_fb_id;
  })
  $scope.year = [1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012];
  $scope.month = ['January','February','March','April','May','June','July','August','September','October','November','December']
  $scope.submit = function() {
    startTime = new Date(this.startYear, this.startMonth,1,0,0,0,0).getTime()/1000
    endTime = new Date(this.startYear, this.startMonth,28,0,0,0,0).getTime()/1000
    data = {
      start_time: startTime, //1296489600, //this.startTime,
      end_time: endTime, //1349020800, //this.stopTime,
      game_name: this.inputGName,
      group_id: this.groupSelect
    };
    $http.post('/api/Paper/', $.param(data)).success(function(data) {
      //取得post
      postData = data.json[0].Message[1].Data;
      if(postData.question.length < 10) {
        $location.path('/newgame');
      } else {
        $location.path('/game/0');
      }
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

    data = {
      right: right,
      p_id: pId,
      q_id: qId,
      selected_name: name,
      selected_id: value,
      duration: duration
    }
    
    $http.post('/api/Answer/', $.param(data)).success(function(data){
      if(key === 9) {
        data = {
          done_paper_id: pId,
          duration: totalTime,
          grade: grade
        }
        $http.post('/api/Paper/', $.param(data)).success(function(){
          $location.path('/gameover/'+pId);
          grade = 0;
          totalTime = 0;
        })
        
      } else {
        $location.path('/game/'+(key+1));
      }
    });

  }
}

function MMGOCtrl($scope, $http, $routeParams, $location) {
  pId = $routeParams.pId;
  data = {
    view_paper_id: pId
  };
  dataC = {
    read_p_id:pId
  };
  ispData = {
    is_played: pId
  }
  //加入isPlayed
  $http.post('/api/Paper/', $.param(ispData)).success(function(isplayed) {
    $http.post('/api/Paper/',$.param(data)).success(function(data){
      isplayed = isplayed.json[0].Message[1].Success;
      data = data.json[0].Message[1].Data;

      if(!isplayed) {
        postData = data;
        answer = [];
        totalTime = 0;
        grade = 0;
        $location.path('/game/0');
        return;
      }
      $scope.name = data.name;
      $scope.rank = data.done;
      try {
        $scope.rank.sort(function(a,b){
          return a.grade < b.grade;
        })
      } catch(error) {}
      for(var i=0;i<data.question.length;i++) {
        if(!data.question[i].hasOwnProperty('answer')) {
          continue;
        }
        for(var j=0;j<data.question[i].answer.length;j++) {
          if (data.question[i].answer[j].user_fb_id === myFbId) {
            data.question[i].answer[j].right = 'info';
          } else if(data.question[i].answer[j].right === false) {
            data.question[i].answer[j].right = 'error';
          }
          else {
            data.question[i].answer[j].right = 'success';
          }
        }
      }
      $scope.quest = data.question;
    })
  });

  $http.post('/api/Chat/', $.param(dataC)).success(function(data){
    data = data.json[0].Message[1].Data;
    $scope.Chatlist = data;
  })

  $scope.addComment = function() {
    dataP = {
      p_id: pId,
      message: $scope.commentText
    }
    $http.post('/api/Chat/', $.param(dataP)).success(function(data){
      $http.post('/api/Chat/', $.param(dataC)).success(function(data){
        data = data.json[0].Message[1].Data;
        $scope.Chatlist = data;
      })
    })
  }

}

function MMICtrl($scope, $http, $location) {
  $scope.invitedList = invitedList;
  $scope.gotogame = function(key) {
    //data = {
    //  id: gameid
    //};
    //$http.post('/api/', data).success(function(data){
    //  postData = data.json[0].Message[1].Data;
    postData = invitedList[key];
    answer = [];
    totalTime = 0;
    grade = 0;
    $location.path('/game/0');
    //})
  }
}

doneList = [];

function MMRCtrl($scope, $http, $location) {
  $http.get('/api/Paper/Done/').success(function(data){
    data = data.json[0].Message[1].Data;
    doneList = data;
    $scope.rankList = doneList;
  })

  $scope.gotogameover = function(gameid) {
    //data = {
    //  id: gameid
    //};
    //$http.post('/api/', data).success(function(data){
    //  postData = data.json[0].Message[1].Data;
    $location.path('/gameover/'+gameid);
    //})
  }
}
