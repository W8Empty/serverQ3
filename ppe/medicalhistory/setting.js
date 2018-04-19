(function () {

var appFact = angular.module('tree.factory', []);
appFact.factory("URLConfig", [function () {
  return {
    tree: "/setting/menu.json"
  }
}]);

var appServ = angular.module('tree.service', ['tree.factory']);
appServ.service("TreeService", ["$http", "URLConfig", function ($http, URLConfig) {
  this.getTree = function () {
    return $http.get(URLConfig.tree);
  };
}]);

var appDirect = angular.module('tree.directives', []);
appDirect.directive('nodeTree', function () {
  return {
    template: '<node ng-repeat="node in tree track by $index"></node>',
    replace: true,
    restrict: 'E',
    scope: {
      tree: '=children'
    }
  };
});
appDirect.directive('node', function ($compile) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/setting/node.html', // HTML for a single node.
    link: function (scope, element) {
    if (scope.node && scope.node.children && scope.node.children.length > 0) {
      scope.node.childrenVisibility = true;
      var childNode = $compile('<ul class="tree" ng-if="!node.childrenVisibility"><node-tree children="node.children"></node-tree></ul>')(scope);
        element.append(childNode);
      } 
      else {
        scope.node.childrenVisibility = false;
      }
    },
    controller: ["$scope", function ($scope) {
      // This function is for just toggle the visibility of children
      $scope.toggleVisibility = function (node) {
        if (node.children) {
          node.childrenVisibility = !node.childrenVisibility;
        }
      };
      // Here We are marking check/un-check all the nodes.
      $scope.checkNode = function (node) {
        node.checked = !node.checked;
        function checkChildren(c) {
          angular.forEach(c.children, function (c) {
            c.checked = node.checked;
            checkChildren(c);
          });
        }
        checkChildren(node);
      };
    }]
  };
});
/* 
// config controller 
*/
angular.module('myApp')
.controller('contactCtrl', function($scope, TreeService, $timeout, $mdDialog, appService) {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Setting';
  $scope.ctrl.menuText = 'Medical History';

  $scope.saveComment = function (ev)
   { alert ("test")}

});
/* 
// config controller 
*/
angular.module('myApp')
.controller('roleCtrl', function($scope, TreeService, $timeout, $mdDialog, appService) {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Setting';
  $scope.ctrl.menuText = 'Medical History';

  var roleList = [];
  var employeeList = [];

/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/

  var historymedicineList =[];

/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/

  var success = false;

  var tc = this;
  function buildTree() {
    TreeService.getTree().then(function (result) {      
      // console.log(result.data);
      // tc.tree = result.data;         
      socket.emit('web-setting-get-data', { base: 'serverRole', query: {}}, function(err, retRole)  {
        socket.emit('web-setting-get-data', { base: 'employee', query: {_id: '0000'} }, function(err, retEmp)  {
          $timeout(function() {
            if (!retRole.length)  {
              alert('No role data!');
              return;
            }
            roleList = retRole[0].role;
            $scope.roleList = roleList;
            if (!retEmp.length)  {
              alert('No employee data!');
              return;
            }
            employeeList = retEmp[0].employee;
            employeeList.sort(function(a, b){
              return a.userName-b.userName;
            });
            for (var i in employeeList)  {
              employeeList[i]['passTemp'] = '';
              employeeList[i]['passConfirm'] = '';
            }
            $scope.employeeList = employeeList;

/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/
            console.log (retEmp[0].historymedicine);

              /*historymedicineList*/

            $scope.historymedicineList = retEmp[0].historymedicine;
            
/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/

            var elmnt = document.getElementById("myDIV");
            elmnt.scrollTop = 0;

          }, 500);
        });
      });
    }, function (result) {
      alert("Tree no available, Error: " + result);
    });
  }

  buildTree();

  $scope.gotoRefreshTree = function()  {
    roleList = [];
    $scope.roleList = roleList;
    employeeList = [];
    $scope.employeeList = employeeList;
    success = false;
    buildTree(); 
  }

  $scope.saveEmployee = function(ev)  {

    for (var i in employeeList)  {
      if (employeeList[i].userName == '' || employeeList[i].fullname == '')  {
        $mdDialog.show(
          $mdDialog.alert()
          .title('Alert')
          .textContent('Required field "User-name" and "Full-name" please check and try again.')
          .targetEvent(ev)
          // .clickOutsideToClose(false)
          .ok('OK!')
        ); 
        return;       
      }
    }
    
    var confirm = $mdDialog.confirm()
      .title('Save employee')
      .textContent('Would you like to save change ?')
      .targetEvent(ev)
      .ok('Confirm!')
      .cancel('Cancel');
    $mdDialog.show(confirm).then(function() {
      // console.log(counterList);    
      success = false;
      var count = 0;
      var temp = 0;
      for (var i in employeeList)  {
        if (employeeList[i].passTemp != '' && employeeList[i].passConfirm != '')  {      
          if (employeeList[i].passTemp == employeeList[i].passConfirm)  {

            count++;

            (function() {
              var j = i;
            //   socket.emit('web-setting-encryp-data', { userName: employeeList[j].userName, passWord: employeeList[j].passTemp }, 
            //   function(err, ret)  {
            //     employeeList[j].passWord[0].passWord = ret.passWord;
              $timeout(function() {
                if (++temp >= count)  success = true;
              }, 100);
            //   });
            })();


          }
          else  {
            $mdDialog.show(
              $mdDialog.alert()
              .title('Alert')
              .textContent('Password and confirm not equal, please try again.')
              .targetEvent(ev)
              // .clickOutsideToClose(false)
              .ok('OK!')
            );
            return;
          }          
        }        
      }
      if (count == 0)  success = true;
      // alert(count+'/'+success);    
      retrySaveEmployee(200, ev);

    }, function() {
    });

  }

  var retrySaveEmployee = function (retryInMilliseconds, ev) {
    $timeout(function(){
      // alert('Sucess = '+success);
      if (!success) {
        retrySaveEmployee(200);
      }
      else  {
        for (var i in employeeList)  {
          employeeList[i].passTemp = '';
          employeeList[i].passConfirm = '';
        }
        var obj = { employee: employeeList };
        socket.emit('web-setting-write-data', { base: 'employee', data: obj, flag: 0 }, function(err, ret)  {

          $mdDialog.show(
            $mdDialog.alert()
            .title('Alert')
            .textContent(ret.text)
            .targetEvent(ev)
            // .clickOutsideToClose(false)
            .ok('OK!')
          );
          
        });
      }
    }, retryInMilliseconds);
  }


  $scope.addEmployee = function()  {
    var obj =  {
            fullname: '',
            passWord: '1234',
            lastname: '',
            roleLevel: 'User',
    };
    employeeList.push(obj);
  }

  $scope.addHistorymedicine = function()  {
    var obj =  {
            name: '',
            surname: '',
            sex : "Male",
            age : '25 years',
            weight: '60 kg.',
            bloodtype : 'AB',
            namemedicine : 'Amoxicillin',
            barcode : '13number',
            data: [],
            tel : "032-357480"
    };
    historymedicineList.push(obj);
  }

  /*$scope.addHistorymedicine = function(historymedicine)  {
    historymedicine.push({name: '', surname: '',age: '',bloodtype: '',sex: '',namemedicine:'',tel: ''});
  }

  $scope.removeHistorymedicine = function(historymedicine, index)  {
    historymedicine.splice(index, 1);
  }*/


  $scope.removeEmployee = function(index)  {
    employeeList.splice(index, 1);
  }


/***********************************************************************************************************************/
   

  $scope.removeHistorymedicine = function(index)  {
    historymedicineList.splice(index, 1);
  }



/**********************************************************************************************************************/


  $scope.gotoSaveRole = function(ev, role)  {
    // console.log(role);
    // alert(role);    
    var obj = { role: role };
    socket.emit('web-setting-write-data', { base: 'serverRole', data: obj, flag: 0 }, function(err, ret)  {
      $mdDialog.show(
        $mdDialog.alert()
        .title('Alert')
        .textContent(ret.text)
        .targetEvent(ev)
        // .clickOutsideToClose(false)
        .ok('OK!')
      );
    });
  }

});

/* 
// config controller 
*/
angular.module('myApp')
.controller('settingCtrl', function($scope, $state, $mdDialog, $timeout, $interval, $window, $sce, $http, appService) {
// $timeout(function() {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Setting';

  $scope.griSettBranch = {
    data: []
  };
  $scope.gridSettBrs = {};

  var branchList = [];
  $scope.griSettBranch.data = branchList;

  var setBranchRefresh = function ()  {
    // socket.emit('web-setting-get-online', function(err, ret)  {
    socket.emit('web-setting-get-data', { base: 'br-List', query: {}}, function(err, ret)  {
    $timeout(function() {
      // console.log(ret);
      // if (!ret.length)  return; 
      // for (var i in ret[0].brlist)  {
      //   var item = ret[0].brlist[i];
      //   // console.log(item);
      //   // var status = '-';
      //   // if (item.status == 'online')  status = item.status;
      //   var obj = { branchID: item.branchID, branchName: item.branchName, status: item.status, clientIP: item.clientIP};
      //   branchList.push(obj);
      // }
      // branchList = [];
      if (ret.length)  {
        branchList = ret[0].brlist; 
        // for (var i in branchList)  branchList[i]['report'] = 'clear';
      }
      branchList.sort(function(a, b){
        return a.branchID-b.branchID;
      });                  
      $scope.griSettBranch.data = branchList;

      var elmnt = document.getElementById("myDIV");
      elmnt.scrollTop = 0;

    }, 500);
    });
  }

  setBranchRefresh();
  // var intervalSetting = $interval(function()  {
  //   setBranchRefresh(); 
  // },1000*3);
  // $scope.$on('$destroy', function () { $interval.cancel(intervalSetting); });

  $scope.gotoUpdateAllBranch = function(ev)  {
    // socket.emit('web-setting-update-source', { updateUrl: 'https://cloud1.ppetech.com:3200/update/update.js'}, function(err, ret)  {     
    for (var i in branchList)  {
      if (branchList[i].status == 'Online')  branchList[i].update = 'https://cloud1.ppetech.com:3200/update/update.js';
      else  branchList[i].update = '-';
    }
    var obj = {brlist: branchList };
    socket.emit('web-setting-write-data', { base: 'br-List', data: obj, flag: 0 }, function(err, ret)  {
      socket.emit('web-setting-update-source', { updateUrl: branchList[i].update }, function(err, ret)  { 
        setBranchRefresh();
        // $mdDialog.show(
        // $mdDialog.alert()
        //   .title('Alert')
        //   .textContent('Update new software to online branch.')
        //   .targetEvent(ev)
        //   .ok('OK!')
        // );
      });
    });
  }

  $scope.gotoClearAllBranch = function(ev)  {
    for (var i in branchList)  {
      if (branchList[i].status == 'Online')  branchList[i].update = 'Clear';
    }
    var obj = {brlist: branchList };
    socket.emit('web-setting-write-data', { base: 'br-List', data: obj, flag: 0 }, function(err, ret)  {
      socket.emit('web-setting-update-source', { updateUrl: branchList[i].update }, function(err, ret)  { 
        setBranchRefresh();
      });
    });
  }

  $scope.gotoUpdateOneBranch = function(branchID, branchName, ev)  {
    var text = '-';
    var brOnline = '-';
    for (var i in branchList)  {
      if (branchList[i].branchID == branchID && branchList[i].branchName == branchName)  {
         text = branchList[i].update;
         brOnline = branchList[i].status;
        break;
      }
    }
    if (brOnline == '-')  {
      $mdDialog.show(
      $mdDialog.alert()
        .title('Alert')
        .textContent('Can not update offline branch.')
        .targetEvent(ev)
        .ok('OK!')
      );
      return;
    }
    if (text == '-')  text = 'Do tou want to update to "'+branchID+' / '+branchName+'" ?';
    else  text = 'Do tou want delete update flag of "'+branchID+' / '+branchName+'" ?';
    var confirm = $mdDialog.confirm()
      .title('Alert')
      .textContent(text)
      .targetEvent(ev)
      .ok('Confirm!')
      .cancel('Cancel');
    $mdDialog.show(confirm).then(function() {      
      if (branchList[i].update == '-')  branchList[i].update = 'https://cloud1.ppetech.com:3200/update/update.js';
      else branchList[i].update = 'Clear';
      var obj = {brlist: branchList };
      socket.emit('web-setting-write-data', { base: 'br-List', data: obj, flag: 0 }, function(err, ret)  {
        socket.emit('web-setting-update-source', { updateUrl: branchList[i].update }, function(err, ret)  { 
          setBranchRefresh();
          // $mdDialog.show(
          // $mdDialog.alert()
          //   .title('Alert')
          //   .textContent(ret.text)
          //   .targetEvent(ev)
          //   .ok('OK!')
          // );
        });
      });
    }, function() { 
    });


  }

  $scope.gotoRefreshBranch = function()  {
    var req = {
      method: 'POST',
      url: "http://127.0.0.1:3200/config",
      headers: {
        "content-type" : "application/json"
      },
      data: { cmd: 'loadJson', fileName: 'app.js' }
    }
    $http(req).then(function(ret){
      console.log(ret);
      alert(ret+'1');
    }, function(ret){
      console.log(ret);
      alert(ret+'2');
    });
    
    // var branchList = [];
    // $scope.griSettBranch.data = branchList;
    // setBranchRefresh(); 
  }

  $scope.gotoBranchConfig = function(ip, status, ev)  {
    // $window.open('http://'+ip+':8001/setting/websetting.html', 'C-Sharpcorner');
    // alert('http://'+ip+':8001/setting/websetting.html');
    if (status == '-')  {
      $mdDialog.show(
        $mdDialog.alert()
        .title('Alert')
        .textContent('Offline can not connect to branch.')
        .targetEvent(ev)
        // .clickOutsideToClose(false)
        .ok('OK!')
      );
      return;
    }
    $scope.detailFrame = $sce.trustAsResourceUrl('http://'+ip+':8001/setting/websetting.html?logon=auto');
  }

  $scope.gotoRemoveBranch = function(branchID, branchName, ev)  {
    var confirm = $mdDialog.confirm()
      .title('Alert')
      .textContent('Do you want to remove branch "'+branchID+'/'+branchName+'" from branch list ?')
      .targetEvent(ev)
      .ok('Confirm!')
      .cancel('Cancel');
    $mdDialog.show(confirm).then(function() {
      for (var i in branchList)  {
        if (branchList[i].branchID == branchID && branchList[i].branchName == branchName)  {
          branchList.splice(i, 1);
          break;
        }
      }
      var obj = {brlist: branchList };
      socket.emit('web-setting-write-data', { base: 'br-List', data: obj, flag: 0 }, function(err, ret1)  {
        socket.emit('web-report-clear-data', { branchID: branchID, branchName: branchName }, function(err, ret2)  {
          $mdDialog.show(
          $mdDialog.alert()
            .title('Alert')
            .textContent(ret1.text)
            .targetEvent(ev)
            // .clickOutsideToClose(false)
            .ok('OK!')
          );
        });
      });
    }, function() { 
    });
  }

  $scope.gotoClearReport = function(branchID, branchName, ev)  {
    var confirm = $mdDialog.confirm()
      .title('Alert')
      .textContent('Do you want to clear report of "'+branchID+'/'+branchName+'" ?')
      .targetEvent(ev)
      .ok('Confirm!')
      .cancel('Cancel');
    $mdDialog.show(confirm).then(function() {
      // for (var i in branchList)  {
      //   if (branchList[i].branchID == branchID && branchList[i].branchName == branchName)  {
      //     branchList.splice(i, 1);
      //     break;
      //   }
      // }
      socket.emit('web-report-clear-data', { branchID: branchID, branchName: branchName }, function(err, ret)  {
        $mdDialog.show(
        $mdDialog.alert()
          .title('Alert')
          .textContent(ret.text)
          .targetEvent(ev)
          // .clickOutsideToClose(false)
          .ok('OK!')
        );
      });
    }, function() { 
    });
  }

  $scope.gotoBranchDetail = function(branchID)  {
    // alert(item);
    appService.subMenu = branchID;
    $scope.ctrl.gotoMenu('branch');
  }

  window.uploadDone=function(){
    // alert('onLoad');
/*    var req = {
      method: 'POST',
      url: "http://192.168.1.100:3200/config",
      headers: {
        "content-type" : "application/json"
      },
      data: { cmd: 'loadJson', fileName: 'app.js' }
    }
    $http(req).then(function(ret){
      console.log(ret);
      alert(ret+'1');
    }, function(ret){
      console.log(ret);
      alert(ret+'2');
    });*/
  }

});

})();


