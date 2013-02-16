fb_oauthurl = "https://www.facebook.com/dialog/oauth/";
fb_scope = "publish_stream,read_stream,read_friendlists,email";
fb_clientid = "286934128081818";
fb_display = "popup";
fb_authurl = "https://mmgame.pipos.tv/fbauth.html";

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
window.getUrlVars = function() {
  var hash, hashes, vars, _fn, _i, _len;
  vars = [];
  hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  _fn = function(hash) {
    hash = hash.split('=');
    vars.push(hash[0]);
    return vars[hash[0]] = decodeURIComponent(hash[1]);
  };
  for (_i = 0, _len = hashes.length; _i < _len; _i++) {
    hash = hashes[_i];
    _fn(hash);
  }
  return vars;
};

window.language = null;

window.baseQuery = getUrlVars();
/*$.ajax({
  url: '/api/Language/',
  async: false,
  type: 'POST',
  data: {
    lang: baseQuery['locale']
  }, 
  success: function(data) {
    data = $.parseJSON(data);
    window.language = data['json'][0]['Message'][1]['Data']['data'];
  }
})*/

/* Route Initialize */
angular.module('ngView', [], function($routeProvider, $locationProvider) {
  $routeProvider.when('/preload', {
    templateUrl: 'preload.html',
    controller: MMPLCtrl
  });
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
  //拿URL
  oldPath = $location.path();
  $location.path('/preload');
  //取得語系
  dataL = {
    lang: baseQuery['locale']
  }
  $http.post('/api/Language/', $.param(dataL)).success(function(data){
    window.language = data['json'][0]['Message'][1]['Data']['data'];
    $scope.lang = window.language;
    $http.get('/api/IsLogin/').success(function(data){
      data = data.json[0].Message[1].Data.LoginStatus;
      isLogin = data;
      //oldPath = $location.path();
      if(oldPath === '/' || oldPath === '/login') {
        oldPath = '/main';
      }
      if(isLogin === false) {
        $location.path('/login');
      } else {
        $location.path(oldPath);
      }
    })
  })

  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;
  $scope.currentPath = $location.path;
  $scope.lang = {};
  $scope.locale = baseQuery['locale'];
}

function MMPLCtrl($scope, $route) {

}

function MMLoginCtrl($scope, $http, $location) {
  window.fbAuthResp = function(code) {
    var data;
    if (code === -1 || code === -2) {
      return alert("Facebook Response Error! code: " + code);
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
  $scope.lang = language;
  try {
    FB.XFBML.parse();
  }catch(err) {}
}

invitedList = [];

function MMMainCtrl($scope, $http, $location) {
  if(!isLogin) {
    $location.path('/login');
  }
  try {
    FB.XFBML.parse();
  } catch(err) {}
  $scope.lang = language;
  $scope.template = '';
  $http.get('/api/Paper/Unread/').success(function(data){
    data = data.json[0].Message[1].Data;
    nData = [];
    /* question.length < 10 */
    for(var i=0;i<data.length;i++) {
      try {
        if(data[i].question.length >= 10) {
          if(!data[i].hasOwnProperty('done')) {
            data[i]['done'] = []
          }
          nData.push(data[i]);
        }
      } catch(error) {}
    }
    invitedList = nData;
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

function MMNGCtrl($scope, $http, $location, $rootScope) {
  if(!isLogin) {
    $location.path('/login');
  }
  $scope.lang = language;
  var fCount = function() {
    count = $('#cusFriendlist').tokenInput("get").length;
    if(count<4) {
      $('#pipoError').css('display', 'inline');
    } else {
      $('#pipoError').css('display', 'none');
    }
  };
  $http.get('/api/Me/').success(function(data) {
    data = data.json[0].Message[1].Data;
    $scope.friendlist = data.friend_list;
    //$scope.friend = data.friend;
    myFbId = data.user_fb_id;
    for(var i=0;i<data.friend.length;i++) {
      data.friend[i]['id'] = data.friend[i]['user_fb_id'];
    }
    $('#cusFriendlist').tokenInput(data.friend,{
      propertyToSearch: "name",
      theme: "facebook",
      preventDuplicates: true,
      hintText: language['ti_hintText'],
      noResultsText: language['ti_noResultsText'],
      searchingText: language['ti_searchingText'],
      onAdd: fCount,
      onDelete: fCount,
      resultsFormatter: function(item){
        return "<li>" + "<img src='https://graph.facebook.com/" + item.user_fb_id + "/picture?width=25&height=25' name='" + item.name + "' height='25px' width='25px' />" + "<div style='display: inline-block; padding-left: 10px;'><div class='full_name'>" + item.name + "</div></div></li>"; 
      },
      tokenFormatter: function(item) {
        return "<li><p><b style='color: #08C'>" + item.name + "</b></p></li>" 
      },
    })
  })
  $scope.isLoading = false;
  $scope.isError = false;
  currentmemList = null;
  $scope.startDate = new Date(2012,0,1);
  $scope.endDate = new Date(2012,0,31);
  $('#dp_start').datepicker({format: 'mm-dd-yyyy'}).on('changeDate', function(ev){
    if (ev.date.valueOf() > $scope.endDate.valueOf()){
      $('#timeError').css('display', 'inline');
    } else {
      $('#timeError').css('display', 'none');
    }
    $scope.startDate = new Date(ev.date);
    $('#dp_start').datepicker('hide');
  });
  $('#dp_end').datepicker({format: 'mm-dd-yyyy'}).on('changeDate', function(ev){
    if (ev.date.valueOf() < $scope.startDate.valueOf()){
      $('#timeError').css('display', 'inline');
    } else {
      $('#timeError').css('display', 'none');
    }
    $scope.endDate = new Date(ev.date);
    $('#dp_end').datepicker('hide');
  });
  $scope.setFriend = function() {
    memList = this.groupSelect.member;
    if(currentmemList != null) {
      for(var j=0;j<currentmemList.length;j++) {
        //for(var i=0;i<$scope.friend.length;i++) {
        //  if($scope.friend[i].user_fb_id == ) {
        //    $scope.friend[i].checked = false;
        //  }
        //}

        $('#cusFriendlist').tokenInput("remove", {id: currentmemList[j].user_fb_id})
      }
    }
    currentmemList = memList;
    for(var j=0;j<memList.length;j++) {
      //for(var i=0;i<$scope.friend.length;i++) {
      //  if($scope.friend[i].user_fb_id == memList[j].user_fb_id) {
      //    $scope.friend[i].checked = true;
      //  }
      //}
      var obj = memList[j];
      obj['id'] = obj['user_fb_id'];
      $('#cusFriendlist').tokenInput("add", obj)
    }
  }
  $scope.submit = function() {
    $scope.isLoading = true;
    startTime = $scope.startDate.getTime()/1000;
    endTime = $scope.endDate.getTime()/1000;

    fSelect = "";
    sFriend = $('#cusFriendlist').tokenInput("get");
    for(var i=0;i<sFriend.length;i++) {
      //if($scope.friend[i].hasOwnProperty('checked') && $scope.friend[i].checked) {
      //  fSelect += $scope.friend[i].user_fb_id + ',';
      //}
      fSelect += sFriend[i].id + ',';
    }
    data = {
      start_time: startTime,
      end_time: endTime,
      game_name: this.inputGName,
      fb_id_list: fSelect,
      group_id: 0//this.groupSelect.group_id
    };
    $http.post('/api/Paper/', $.param(data)).success(function(data) {
      try {
        postData = data.json[0].Message[1].Data;
      } catch(error) {
        $scope.isLoading = false;
        $scope.isError = true;
        return;
      }
      if(postData.question.length < 10) {
        //$location.path('/newgame');
        $scope.isLoading = false;
        $scope.isError = true;
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
  $scope.lang = language;

  if(postData === null) {
    $location.path('/main');
  }

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
    duration = parseInt((endTime - gameTime)/1000);
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
  $scope.lang = language;
  $scope.isplayer = false;
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
      if(typeof data.question != 'undefined') {
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
        $scope.isplayer = true;
      }
    })
  });

  $('#commentText').keypress(function(event) {
    if ( event.which == 13 ) {
      $scope.addComment();
    }
  });

  $http.post('/api/Chat/', $.param(dataC)).success(function(data){
    data = data.json[0].Message[1].Data;
    $scope.Chatlist = data;
  })

  $scope.isPlayer = function(){
    return $scope.isplayer;
  }

  $scope.addComment = function() {
    if($scope.commentText == "") {
      return;
    }
    dataP = {
      p_id: pId,
      message: $scope.commentText
    }
    $scope.commentText = "";
    $http.post('/api/Chat/', $.param(dataP)).success(function(data){
      $http.post('/api/Chat/', $.param(dataC)).success(function(data){
        data = data.json[0].Message[1].Data;
        $scope.Chatlist = data;
      })
    })
  }

}

function MMICtrl($scope, $http, $location) {
  if(!isLogin) {
    $location.path('/login');
  }
  $scope.lang = language;
  /* reload hack */
  if(invitedList.length < 1) {
    $http.get('/api/Paper/Unread/').success(function(data){
      data = data.json[0].Message[1].Data;
      nData = [];
      /* 蝘駁question.length < 10 */
      for(var i=0;i<data.length;i++) {
        try {
          if(data[i].question.length >= 10) {
            if(!data[i].hasOwnProperty('done')) {
              data[i]['done'] = []
            }
            nData.push(data[i]);
          }
        } catch(error) {}
      }
      $scope.invitedList = invitedList = nData;
      $scope.invitedNum = invitedList.length;
    })
  }
  $scope.invitedList = invitedList;
  $scope.gotogame = function(key) {
    postData = invitedList[key];
    answer = [];
    totalTime = 0;
    grade = 0;
    if(postData.question.length < 10) {
      return;
    }
    $location.path('/game/0');
  }
}

doneList = [];

function MMRCtrl($scope, $http, $location) {
  if(!isLogin) {
    $location.path('/login');
  }
  $scope.lang = language;
  $http.get('/api/Paper/Done/').success(function(data){
    data = data.json[0].Message[1].Data;
    doneList = data;
    $scope.rankList = doneList;
  })

  $scope.gotogameover = function(gameid) {
    $location.path('/gameover/'+gameid);
  }
}