var lib = require('./serverLib.js');

// var emitter = new lib.SimpleEE();
var emitter = lib.emitter;

/* 
// Global variable access here
*/
var globalValue = {
  value: {},
  read: function (name)  {
    // var val = globalValue[name];
    var val = globalValue.value[name];
    return val;
  },
  write: function (name, val)  {
    // globalValue[name] = val;
    globalValue.value[name] = val;
    return val;
  },
}

/* 
// Initialization
*/
function Initialization (server)  {
lib.firstInitialzation(function (net, dbx, mb, dbr, mr)  {
  // globalValue.write('net', net);
  // globalValue.write('base', { dbx: dbx, dbr: dbr});
  globalValue.value['net'] = net;
  globalValue.value['base'] = { dbx: dbx, dbr: dbr};
  globalValue.value['updateUrl'] = '';

  var io = require('socket.io').listen(server);

  lib.loadTable(globalValue, function()  {
    emitter.emit('webpage-socket-start', io);
    emitter.emit('server-socket-start', io);
  })

})
}
// module.exports = Initialization;

/* 
// socket IO Web interface 
*/
emitter.on('webpage-socket-start', function(_io) {
  var io = _io;
  globalValue.value['webSocket'] = [];
  var webSocket = globalValue.value['webSocket'];
  io.on('connection', function (socket) {
    // var temp = socket.handshake.address.split(':');
    var temp = socket.request.connection.remoteAddress.split(':');
    var ip = temp[temp.length-1];
    webSocket.push({socket: socket, name: '', id:'', ip: ip});
    console.log('Web socket connecte / total connection ->', webSocket.length, ip);

    // Socket disconnect
    socket.on('disconnect', function () {
      for (var i in webSocket)  {
        if (webSocket[i].socket == socket)  {
          console.log('Web socket close', webSocket[i].name, webSocket[i].id, '/ remain connection ->',webSocket.length-1);
          webSocket.splice(i, 1);
        }
      }
    });

    // home get data
    socket.on('web-home-get-data', function (cond, callback) {
      // console.log('web-home-get-data ->', cond);
      var clientSocket = globalValue.value['clientSocket'];
      for (var i = 0; i < webSocket.length; i++)  {
        if (webSocket[i].socket == socket)  {
          break;
        }
      }
      var tblName = 'tm'+i+'-'+webSocket[i].ip;
      cond.startDate = new Date(cond.startDate);
      cond.stopDate = new Date(cond.stopDate);
      cond['collOut'] = tblName;
      var dbr = globalValue.value['base'].dbr;
      lib.dashBoard(dbr, cond, function(err, data)  {
        var online = [];
        for (var i in clientSocket)  {
          var obj = { branchInfo: clientSocket[i].branchInfo, realtime: clientSocket[i].realtime };
          online.push(obj);
        }
        callback(0, { online: online, dashboard: data } );
      })
    });

    // realtime get data
    socket.on('web-realtime-get-data', function (cond, callback) {
      console.log('web-realtime-get-data ->', cond);
      var clientSocket = globalValue.value['clientSocket'];
      var online = [];
      for (var i in clientSocket)  {
        var obj = { branchInfo: clientSocket[i].branchInfo, realtime: clientSocket[i].realtime };
        online.push(obj);
      }
      callback(0, { online: online } );
    });

    // Setting get online
    socket.on('web-setting-get-online', function (callback) {
      console.log('web-setting-get-online ->');
      var clientSocket = globalValue.value['clientSocket'];
      var online = [];
      for (var i in clientSocket)  {
        // var obj = { branchInfo: clientSocket[i].branchInfo, realtime: clientSocket[i].realtime };
        var obj = { branchInfo: clientSocket[i].branchInfo };
        online.push(obj);
      }
      callback(0, { online: online } );
    });

    // get report
    socket.on('web-report-get-data', function (cond, callback) {
      // console.log('web-home-get-data ->', cond);
      console.log('web-home-get-data ->');
      // var clientSocket = globalValue.read('clientSocket');
      var clientSocket = globalValue.value['clientSocket'];
      for (var i = 0; i < webSocket.length; i++)  {
        if (webSocket[i].socket == socket)  {
          break;
        }
      }
      var tblName = 'tm'+i+'-'+webSocket[i].ip;
      cond.startDate = new Date(cond.startDate);
      cond.stopDate = new Date(cond.stopDate);
      cond['collOut'] = tblName;
      // var dbr = globalValue.read('base').dbr;
      var dbr = globalValue.value['base'].dbr;

      lib.reportMapReduce(dbr, cond, function(err, data)  {
        callback(0, { report: data } );
      })

    });

    // get report
    socket.on('web-report-clear-data', function (cond, callback) {
      console.log('web-report-clear-data ->', cond);
      var dbr = globalValue.value['base'].dbr;
      lib.clearReport(dbr, cond, function(err, ret)  {
        callback(err, ret);
      })
    });

    // Web get data
    socket.on('web-setting-get-data', function (data, callback) {
      // var ret = globalValue.value[data];
      lib.getData(globalValue, data, function(err, ret) {
        // console.log('web-setting-get-data ->', data, ret);

/*----------------------------------------------------------------แก้ไข// ret-----------------------------------------------------------------------------*/

        console.log('web-setting-get-data ->', data,ret);


/*----------------------------------------------------------------แก้ไข// ret-----------------------------------------------------------------------------*/        
        callback(0, ret);
      });
    });

    socket.on('web-setting-get-pat', function (data, callback) {
      // var ret = globalValue.value[data];
      lib.getPat(globalValue, data, function(err, ret) {
        // console.log('web-setting-get-data ->', data, ret);

/*----------------------------------------------------------------แก้ไข// ret-----------------------------------------------------------------------------*/

        console.log('web-setting-get-pat ->', data,ret);


/*----------------------------------------------------------------แก้ไข// ret-----------------------------------------------------------------------------*/        
        callback(0, ret);
      });
    });

    // login get user
    socket.on('web-login-get-user', function (data, callback) {
      console.log('web-login-get-user ->', data);
      lib.userAuthen(globalValue, data, function(err, ret) {
        callback(0, ret);
      });
    });

    // Setting write data
    socket.on('web-setting-write-data', function (data, callback) {      
      console.log('webs-setting-write-data ->', data.base);
      lib.writeData(globalValue, data, function(err, ret) {
        // console.log(obj);
        callback(err, ret);
      });  
        console.log(data);    
    });
    socket.on('web-setting-write-patient', function (data, callback) {      
      console.log('webs-setting-write-patient ->', data.base);
      lib.writePatient(globalValue, data, function(err, ret) {
        // console.log(obj);
        callback(err, ret);
      });  
        console.log(data);    
    });
    socket.on('web-setting-write-drug', function (data, callback) {      
      console.log('webs-setting-write-drug ->', data.base);
      lib.writeDrug(globalValue, data, function(err, ret) {
        // console.log(obj);
        callback(err, ret);
      });  
        console.log(data);    
    });

    //Encrypt data
    socket.on('web-setting-encryp-data', function (data, callback) { 
      console.log('websetting-encryp-data ->', data);
      var ret = lib.encrypData(data);
      console.log(ret);
      callback(0, ret);
    });      

    //Excel export
    socket.on('web-report-excel-export', function (data, callback) { 
      console.log('web-report-excel-export ->', data.fileName);
      var ret = lib.excelExport(data);
      // var hostIP = globalValue.value['net'].hostIP;
      // ret['url'] = 'http://'+hostIP+':3200/report/'+data.fileName;
      ret['url'] = 'https://cloud1.ppetech.com:3200/report/'+data.fileName;
      callback(0, ret);
    });

    //Branch update 
    socket.on('web-setting-update-source', function (data, callback)  {
      console.log('web-setting-update-source ->', data);
      lib.branchListManage (globalValue, null, function(err, brList)  {
        var clientSocket = globalValue.value['clientSocket'];
        for (var i in clientSocket)  {
          for (var j in brList)  {
            if (clientSocket[i].branchInfo.branchID == brList[j].branchID && 
                clientSocket[i].branchInfo.branchName == brList[j].branchName)  {
              clientSocket[i].branchInfo.update = brList[j].update;
              break;
            }
          }
        }
        callback(0, {text: 'You success to do.'});
      });      
    });      

  })

})

/* 
// socket IO server interface 
*/
emitter.on('server-socket-start', function(_io) {
  var ns = _io.of('/ns');
  // globalValue.write('clientSocket', []);
  // var clientSocket = globalValue.read('clientSocket');
  globalValue.value['clientSocket'] = [];
  var clientSocket = globalValue.value['clientSocket'];

  ns.on('connection', function (sockAPI) {
    var temp = sockAPI.client.conn.remoteAddress.split(':');
    var clientIP = temp[temp.length-1];
    // console.log('Client connect from IP->', clientIP);
    var dateTime = new Date();
    sockAPI.emit('client-get-information', dateTime, function(err, ret) {
      ret.branchInfo['clientIP'] = clientIP;
      ret.branchInfo['status'] = 'Online';
      lib.branchListManage (globalValue, ret.branchInfo, function(err, brInfo)  {
        var obj = { socket: sockAPI, branchInfo: brInfo};
        clientSocket.push(obj);
        console.log('Client connect from ->', brInfo, '(clientSocket-length) ->', clientSocket.length);
        if (ret.employee.length)  {
          lib.saveEmployee(globalValue, 'employee', ret.employee, ret.branchInfo, function(err)  {
          })
        }
        if (clientSocket.length == 1)  {
          setTimeout (function()  {
            emitter.emit('client-start-scan', clientSocket);
          }, 1000);
        }
      })
    });  

    // Connection colse
    sockAPI.on('disconnect', function () {
      for (var i in clientSocket)  {
        if (sockAPI == clientSocket[i].socket)  {
          var branchInfo = clientSocket[i].branchInfo;
          branchInfo.status = '-'; 
          lib.branchListManage (globalValue, branchInfo, function(err, brInfo)  {
            clientSocket.splice(i, 1);
            console.log('Client disconnect from ->', branchInfo, '(clientSocket-length) ->', clientSocket.length);
          });
          break;
        }
      }
    });

  });

})

/*
// Scan to get BR info  
*/
emitter.on('client-start-scan', function(clientSocket) {
  var async = require('async');  
  var q = async.queue(function (item, callback) {
    var flg = 0;
    var brUpdate = item.branchInfo.update;
    if (item.branchInfo.update == 'Connecting' || item.branchInfo.update == 'Downloading' || item.branchInfo.update == 'Complete')  {
      brUpdate = '-';
    }
    var sockAPI = item.socket;
    // console.log('Update status ---------------------------------------------->1', item.branchInfo, brUpdate);
    sockAPI.emit('client-get-qtoday', { limit: 3, updateUrl: brUpdate }, function(err, ret) {
      if (flg == 0)  {
        flg = 1;
        // console.log('client-get-qtoday return length ->', ret.qtdEnd.length, ret.history);
        console.log('* ->', item.branchInfo.branchID, item.branchInfo.branchName, ret.qtdEnd.length, ret.history, ret.update);
        item['realtime'] = ret.realtime;
        lib.saveQtoday(globalValue, 'br-Qtoday', ret.qtdEnd, ret.branchInfo, function(err)  {
          lib.saveHistory(globalValue, 'br-History', ret.history, ret.branchInfo, function(err)  {
            // For branch update
            if (item.branchInfo.update != ret.update)  {
              if (ret.update == 'Connecting' || ret.update == 'Downloading' || ret.update == 'Complete' || ret.update == '-') {
                item.branchInfo.update = ret.update;
                lib.branchListManage (globalValue, item.branchInfo, function(err, brInfo)  {
                  console.log('Update status ->', brInfo.update, ret.update);
                  callback(0);
                })
              }
              else  callback(0);
            }
            else  callback(0);

          })
        })
      }
    });
    setTimeout(function()  {
      if (flg == 0)  {
        flg = 1;
        console.log('No response from branch over 3 secs ->', item.branchInfo);
        callback(1);
      }
    }, 1000*3);
  });
  q.drain = function() {
    setTimeout(function()  {
      console.log('Next scan sockLength ->', clientSocket.length);
      if (clientSocket.length)  emitter.emit('client-start-scan', clientSocket);
    }, 1000*3);
  }
  if (clientSocket.length)  {
    q.push(clientSocket, function (err) {
    });
  }
})

//-------------------------------------------------------------------------------------------//

// socket.on('web-get-data-patient',function(data, callback){
//   var dbr = globalValue.read('base').dbr;
//   dbr.collection('patient').find({}).sort({_id:1}).toArray(function(err, retAry){
//     console.log(data,retAry[0]);
//     callback('no-data', {success: false});
//   });
// });

//------------------------------------------------------------------------------------------------//

module.exports = {
  Initialization: Initialization,
};

