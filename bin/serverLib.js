/* 
// get IP addresss 
*/
function getAddrIP (callback)  {
  var os = require('os');
  var hostIP = '';
  var macAddr = '';                    
  var netMask = '';                    
  var cpu = os.cpus();
  console.log('');
  console.log('<------------------>');
  console.log('<- ServerMain-Start ->');
  console.log('<------------------>');
  console.log(cpu.length+'-Core', os.cpus()[0].model);
  console.log('Total mem', os.totalmem());
  console.log('Free mem', os.freemem());
  console.log('Found', os.platform(), os.release());
  var n = 0;
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
      if (++n >= (Object.keys(ifaces).length*ifaces[ifname].length)) {
        var obj = {hostIP:hostIP, macAddr: macAddr, netMask: netMask}; 
        // console.log ('Network info ->');
        console.log (obj);
        callback(obj);
      }
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if ('IPv4' !== iface.family || iface.internal !== false)  return;
      // this single interface has multiple ipv4 addresses
      if (alias >= 1) console.log(ifname + ':' + alias, iface.address);
      else {  // this interface has only one ipv4 adress
        if (ifname[0] == 'e') {  hostIP = iface.address; macAddr = iface.mac; netMask = iface.netmask;}
        if (ifname[0] == 'w' && hostIP == '') {  hostIP = iface.address; macAddr = iface.mac; netMask = iface.netmask;}
      }
    });
  });  
}

/* 
// Database connection
*/
var MongoClient = require('mongodb').MongoClient;
function baseConnect(baseName, callback)  {
  // MongoClient.connect(baseName,  {  server: { socketOptions: { connectTimeoutMS: 3600000,  socketTimeoutMS: 3600000 } } }, 
  MongoClient.connect(baseName,  {  
    server: { 
      socketOptions: { connectTimeoutMS: 3600000,  socketTimeoutMS: 3600000 },
      sslValidate :false, 
      checkServerIdentity : false,
  } },
  function (err, _db) {
    if (err) {
      console.log('MongoClient.connect err ->',err); 
      throw err;
    };
    _db.collections(function(err, collections)  {
      var tmp = []; 
      for (var i in collections)  {
        // console.log(collections[i]);
        tmp.push(collections[i].s.name);
      }
      callback(_db, tmp);
    });
  });
}

/* 
// connection to IP addr / MongoDB 
*/
// module.exports.firstInitialzation = function (callback) {      //use password
function firstInitialzation (callback) {
  var fs = require('fs');
  fs.readFile('config.json', 'utf8', function(err, data)  {
    // console.log(err, data);
    if (!err)  {
      var config = JSON.parse(data);
      console.log(config);
    }
    getAddrIP(function(ip)  {
      // baseConnect(config.mongo.db.mbedq, function (dbx, mb) {
      //   baseConnect(config.mongo.db.report, function (dbr, mr) {
      // baseConnect('mongodb://webapp:ppetechAT1234@localhost:27217/mbedq?ssl=true', function (dbx, mb) {
      //   baseConnect('mongodb://webapp:ppetechAT1234@localhost:27217/report?ssl=true', function (dbr, mr) {
      baseConnect('mongodb://127.0.0.1:27017/qcore', function (dbx, mb) {
        baseConnect('mongodb://127.0.0.1:27017/report', function (dbr, mr) {
          callback(ip, dbx, mb, dbr, mr);
        });
      });  
    });
  });
}

/* 
// Eminter event define 
*/
var SimpleEE = function() {
  this.events = {};
};
SimpleEE.prototype.on = function(eventname, callback) {
  this.events[eventname] || (this.events[eventname] = []);
  this.events[eventname].push(callback);
};
SimpleEE.prototype.emit = function(eventname) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (this.events[eventname]) {
    this.events[eventname].forEach(function(callback) {
      callback.apply(this, args);
    });
  }
};
var emitter = new SimpleEE();

/*
// Save Q-today
*/
function saveQtoday (globalValue, collName, qtdBuff, branchInfo, callback)  {
  var async = require('async');
  var q = async.queue(function (item, callback) {
    item.pressTime = new Date(item.pressTime);
    item.beginTime  = new Date(item.beginTime);
    item.endTime = new Date(item.endTime);
    if (item.transfer.length)  {
      for (var i in item.transfer)  {
        item.transfer[i].pressTime = new Date(item.transfer[i].pressTime);
        item.transfer[i].beginTime  = new Date(item.transfer[i].beginTime);
        item.transfer[i].endTime = new Date(item.transfer[i].endTime);
      }
    }

    var dt = new Date(item.pressTime);
    dt = ''+dt.getFullYear()+'/'+(dt.getMonth()+1)+'/'+dt.getDate();
    var _id = branchInfo.branchID+'-'+dt;

    var initDate = new Date(item.pressTime);
    initDate.setHours(0);
    initDate.setMinutes(0);
    initDate.setSeconds(0);

    // var dbr = globalValue.read('base').dbr;
    var dbr = globalValue.value['base'].dbr;

    // console.log('Writing Q-today ->', collName, _id, branchID, initDate);
    // dbr.collection(collName).findAndModify({_id: _id}, {}, { $set: { branchID: branchID, date: initDate }, $push: {data: item}},
    // { upsert: true }, function (err, ret) {
    dbr.collection(collName).update({_id: _id}, { $set: { branchID: branchInfo.branchID, branchName: branchInfo.branchName, date: initDate }, 
    $push: {data: item}}, { upsert: true }, function (err, ret) {
      // console.log('------>', err);
        callback(ret);
    });
  });
  q.drain = function() {
    callback (0);          
  }
  if (qtdBuff.length)  {
    console.log('Writing Q-today ->', collName, branchInfo.branchID);
    q.push(qtdBuff, function (data) {
    });
  }
  else callback(1);
}

/*
// Save history
*/
function saveHistory (globalValue, collName, history, branchInfo, callback)  {
  var async = require('async');
  var q = async.queue(function (item, callback) {
    item.dateTime = new Date(item.dateTime);

    var dt = new Date(item.dateTime);
    dt = ''+dt.getFullYear()+'/'+(dt.getMonth()+1)+'/'+dt.getDate();
    var _id = branchInfo.branchID+'-'+dt;

    var initDate = new Date(item.dateTime);
    initDate.setHours(0);
    initDate.setMinutes(0);
    initDate.setSeconds(0);

    var dbr = globalValue.value['base'].dbr;

    dbr.collection(collName).update({_id: _id}, { $set: { branchID: branchInfo.branchID, branchName: branchInfo.branchName, date: initDate },
    $push: {history: item}}, { upsert: true }, function (err, ret) {
      // console.log('------>', err);
        callback(ret);
    });
  });
  q.drain = function() {
    callback (0);          
  }
  if (history.length)  {
    console.log('Writing history ->', collName, branchInfo.branchID);
    q.push(history, function (data) {
    });
  }
  else callback(1);
}

/* 
// Remove report
*/
function clearReport (dbr, cond, callback) {
  dbr.collection('br-Qtoday').remove({ branchID: cond.branchID, branchName: cond.branchName }, function(err) {
    console.log('Remove flag ->', err);
    callback(err, { text: 'Clear report success.' });
  });
}

/*
// Save Employee
*/
function saveEmployee (globalValue, collName, employee, branchInfo, callback)  {  
  for (var i in employee)  {
    employee[i].lastLogon[0] = new Date(employee[i].lastLogon[0]);
    employee[i].lastLogon[1] = new Date(employee[i].lastLogon[1]);
    employee[i].startDate = new Date(employee[i].startDate);
  }
  var dbr = globalValue.value['base'].dbr;
  var obj = { branchID: branchInfo.branchID, branchName: branchInfo.branchName, employee: employee };
  console.log('Writing ->', collName, branchInfo.branchID);
  dbr.collection(collName).update({_id: branchInfo.branchID}, { $set: obj }, { upsert: true }, function (err, ret) {
    callback(0, obj);
  });
}
  /*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/


  function savePatient(globalValue, collName, patient, branchInfo, callback)  {  
    // for (var i in patient)  {
    //   patient[i].lastLogon[0] = new Date(patient[i].lastLogon[0]);
    //   patient[i].lastLogon[1] = new Date(patient[i].lastLogon[1]);
    //   patient[i].startDate = new Date(patient[i].startDate);
    // }
    var dbr = globalValue.value['base'].dbr;
    var obj = {patient: patient};
    console.log('Writing ->', collName, branchInfo.branchID);
    dbr.collection(collName).update({}, { $set: obj }, { upsert: true }, function (err, ret) {
      callback(0, obj);
    });

    /*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/

  // dbr.collection(collName).find({}).toArray(function(err, retAry) {
  //   var obj = { branchID: branchInfo.branchID, branchName: branchInfo.branchName, employee: employee };
  //   if (!retAry.length)  {
  //     var index = 0;
  //   }
  //   else  {
  //     var employeeList = retAry[0].employeeList;
  //     var index = null;
  //     for (var i = 0; i < employeeList.length; i++)  {
  //       if (employeeList[i].branchID == branchInfo.branchID)  break;
  //     }
  //     index = i;
  //   }      
  //   console.log('Writing ->', collName, branchInfo.branchID, 'index ->', index);
  //   dbr.collection(collName).update({}, { $set: {[`employeeList.${index}`]: obj } }, { upsert: true },
  //   function (err, ret) {
  //     callback(0);
  //   });
  // });
}

/* 
// Load employee
*/


function loadEmployee (dbr, callback) {
  dbr.collection('employee').find({_id: '0000'}).toArray(function(err, retAry) {
    // console.log('Employee ->', err, ret);
    if (!retAry.length)  {
      var obj = { 
        branchID: '0000',
        branchName: 'server',
        employee: [
          {
            fullname: 'admin',
            passWord: '1234',
            lastname: 'test',
            roleLevel: 'Admin',
            commentcontact:''
          }]
//           ,


// /*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/

//         historymedicine:[
//                 {
//                  number : '1',
//                  name : 'somchai',
//                  surname : 'jaidee',
//                  sex : "Male",
//                  age : '25 years',
//                  weight: '60 kg.',
//                  bloodtype : 'AB',
//                  houseno : '111/1',
//                  villageno : '8',
//                  subarea : 'Ladkrabang',
//                  area : 'Ladkrabang',
//                  postalcode : '10520',
//                  education : "Bachelor’s Degree",
//                  jobhis : 'Doctor',
//                  allergyhistory : 'Siyanite',


//                  namemedicine : 'Amoxicillin',
//                  barcode : '13number',
//                  data: [],
//                  tel : "032-357480",
//                  commentblock : ''

//           }]

      }
      dbr.collection('employee').update({_id: '0000'}, { $set: obj }, { upsert: true }, function (err, ret) {
        callback(1, 1);
      });
      return;
    }
    dbr.collection('employee').count(function(err, count)  {
      callback(0, count);
    });
  });
}



function loadPatient (dbr, callback) {
  dbr.collection('patient').find({}).toArray(function(err, retAry) {
    // console.log('Employee ->', err, ret);
    if (!retAry.length)  {
      var obj = { 
        
        email:'4ttacking@gmail.com',
        password:'4ttacking', 
        fullname:'somchai jaidee', 

                 number : '1',
                 name : 'somchai',
                 surname : 'jaidee',
                 sex : "Male",
                 age : '25 years',
                 weight: '60 kg.',
                 bloodtype : 'AB',
                 house : '111/1',
                 village : '8',
                 subarea : 'Ladkrabang',
                 area : 'Ladkrabang',
                 postalcode : '10520',
                 education : "Bachelor’s Degree",
                 jobhis : 'Doctor',
                 allergyhistory : 'Siyanite',
                 month:[],
                 tel : "032-357480",
                 commentblock : ''


      }
      dbr.collection('patient').update({}, { $set: obj }, { upsert: true }, function (err, ret) {
        callback(1, 1);
      });
      return;
    }
    dbr.collection('patient').count(function(err, count)  {
      callback(0, count);
    });
  });
}

/*Editer************************************************************************************************************/
/* 
// Role level init
*/
function loadRole (dbr, callback) {
  dbr.collection('serverRole').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    if (!retAry.length)  {
      var fs = require('fs'); 
      fs.readFile('ppe/setting/menu.json', 'utf8', function(err, data)  {
        if (err)  var menu = [];
        else  var menu = JSON.parse(data);
        // console.log(menu);
        var obj = {
          role: [
           
              {
              roleName: 'Admin',
              textDis: true,
              roleLevel: menu,
            },
            {
              roleName: 'User',
              textDis: true,
              roleLevel: menu,
            },
            
          ]
        };
        dbr.collection('serverRole').update({}, {"$set": obj}, { upsert: true }, function (err, item)  {
          console.log('Create first role ->', err);
          dbr.collection('serverRole').find({}).sort({_id: 1}).toArray(function(err, retAry) {
            callback(err,  retAry[0].role);
          });
        });

      });
      return;
    }
    callback(err, retAry[0].role);
  });
}

/*
// Branh list init
*/
function branchListManage (globalValue, branchInfo, callback) {
  var dbr = globalValue.value['base'].dbr;
  dbr.collection('br-List').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    if (!retAry.length)  {
      var brlist = [];     
      if (branchInfo != null)  {
        branchInfo['report'] = 'Clear';
        branchInfo['update'] = '-';
        brlist.push(branchInfo);
      }
      dbr.collection('br-List').update({}, {"$set": { brlist: brlist }}, { upsert: true }, function (err, item)  {
        console.log('Create branch list ->', err, brlist);
        if (branchInfo == null)  callback(err, brlist);
        else  callback(err, branchInfo);
      });
    }
    else  {
      var brlist = retAry[0].brlist;
      if (branchInfo == null)  {
        callback(err, brlist);
      }
      else  {
        var flag = false;
        for (var i = 0; i < brlist.length; i++)  {
          if (brlist[i].branchID == branchInfo.branchID && brlist[i].branchName == branchInfo.branchName)  {
            if (branchInfo['report'] == undefined)  branchInfo['report'] = brlist[i].report;
            if (branchInfo['update'] == undefined)  branchInfo['update'] = brlist[i].update;
            // if (branchInfo['update'] != 'Connecting' && branchInfo['update'] != 'Downloading' && branchInfo['update'] != 'Complete' &&
            //     branchInfo['update'] != '-' )  {
            //   branchInfo['update'] = brlist[i].update;
            // }
            flag = true;
            brlist.splice(i, 1);
            break;
          }
        }
        if (!flag)  {
          branchInfo['report'] = 'Clear';
          branchInfo['update'] = '-';
        }
        brlist.push(branchInfo);
        dbr.collection('br-List').update({}, {"$set": { brlist: brlist }}, { upsert: true }, function (err, item)  {
          // console.log('Update branch list ->', err, brlist.length, branchInfo);
          callback(err, branchInfo);
        });
      }
    }
  });
}

/* 
// Load table
*/
function loadTable (globalValue, callback)  {
  console.log('...');

  // var dbr = globalValue.read('base').dbr;
  var dbr = globalValue.value['base'].dbr;

  var async = require('async');
  async.series(
  [
    function(callback) {
      loadEmployee(dbr, function (err, item) {
        // globalValue.value['employee'] = item;
        console.log('employee -> ', item, 'items');


/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/
        // console.log('historymedicine -> ', item, 'items');
/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/



        callback(null, 1);
      });
    },

/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/

    function(callback) {
      loadPatient(dbr, function (err, item) {
        // globalValue.value['employee'] = item;

     console.log('patient -> ', item, 'items');

/*----------------------------------------------------------------แก้ไข-----------------------------------------------------------------------------*/



        callback(null, 1);
      });
    },
    function(callback) {
      loadRole (dbr, function(err, item) {
        globalValue.value['role'] = item;
        // console.log('Role level ->', item.length);
        console.log('Role level ->', item.length, 'items');
        callback(null, 2)
      });
    },
    function(callback) {
      callback(null, 2);
    },
  ],  
  function(error, results) {
    // console.log(results);
    // console.log (globalValue.read('holdBuff'));
    console.log('...');
    callback (0);
  });
}

/*
// Excel file export
*/
function excelExport (data)  {
  var XLSX = require('xlsx');
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(data.data, {cellDates:true});
  XLSX.utils.book_append_sheet(wb, ws, 'report');
  wb.Props = {
    Title: "AXA-Report",
    Subject: "Report",
    Author: "ajbear",
    Manager: "ajbear",
    Company: "ppe-tech",
    Category: "Category",
    Keywords: "No-keywords",
    Comments: "Nothing to say here",
    LastAuthor: "Najbear",
    CreatedDate: new Date(),
  };
  // XLSX.writeFile(wb, 'ppe/report/report.xlsx', {bookSST:true});
  XLSX.writeFile(wb, 'ppe/report/'+data.fileName, {bookSST:true});
  return ({text: 'Export to excel done.'});
}

/*
// get data 
*/
function getData (globalValue, data, callback)  {
  // var obj = globalValue.read(data.table);
  // callback(0, obj);
  var base = data.base;
  var dbr = globalValue.read('base').dbr;
  var query = data.query;
  dbr.collection(base).find(query).sort({}).toArray(function(err, retAry) {
    // console.log('configs ->', 'name = '+retAry[0].name);
    if (!retAry.length)  callback(1, []);
    else  {
      callback(0, retAry);  // loded finish
    }
  });
}


function getPat (globalValue, data, callback)  {
  // var obj = globalValue.read(data.table);
  // callback(0, obj);
  var base = data.base;
  var dbr = globalValue.read('base').dbr;
  var query = data.query;
  dbr.collection(base).find(query).sort({}).toArray(function(err, retAry) {
    // console.log('configs ->', 'name = '+retAry[0].name);
    if (!retAry.length)  callback(1, []);
    else  {
      callback(0, retAry);  // loded finish
    }
  });
}

/*
// write data 
*/
function writeData (globalValue, data, callback)  {
  var dbr = globalValue.read('base').dbr;
  var obj = data.data;
  var base = data.base;
  // console.log('55555555555555555555555555555555555555555555555555555555555555',obj);
  // if (base == 'employee')  {
  //   for (var i in obj.employee)  {
  //     obj.employee[i].lastLogon[0] = new Date(obj.employee[i].lastLogon[0]);
  //     obj.employee[i].lastLogon[1] = new Date(obj.employee[i].lastLogon[1]);
  //     obj.employee[i].startDate = new Date(obj.employee[i].startDate);
  //   }
  // }
  // dbr.collection(base).findAndModify({}, {}, {$set: obj}, { upsert: true }, function (err, ret) {
  dbr.collection(base).update({}, { $set: obj }, { upsert: true }, function (err, ret) {
    // console.log('GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',obj);
    // console.log('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',ret);
    if (err) var text =   'Write error something was wrong.';
    else  var text = 'Operation success.';
    console.log(text);
    callback(err, {text: text});
  });
}
function writePatient (globalValue, data, callback)  {
  var dbr = globalValue.read('base').dbr;
  var obj = data.data;
  // var a = "Object(";
  // var b = ")"

    // console.log('Object("'+obj[0]._id+'")');
 
  for(var i = 0; i < obj.length; i++){

    var a = 'Object("'+obj[i]._id+'")';

    console.log("6666666666666666666666666666666666666",a);

  dbr.collection('patient').update({_id: obj[i]._id}, {

                                                         _id: a,
                                                        number: obj[i].number,
                                                        name: obj[i].name,
                                                        sex: obj[i].sex,
                                                        age: obj[i].age,
                                                        weight: obj[i].weight,
                                                        bloodtype: obj[i].bloodtype,
                                                        houseno: obj[i].houseno,
                                                        villageno: obj[i].villageno,
                                                        subarea: obj[i].subarea,
                                                        area: obj[i].area,
                                                        postalcode: obj[i].postalcode,
                                                        education: obj[i].education,
                                                        jobhis: obj[i].jobhis,
                                                        allergyhistory: obj[i].allergyhistory,
                                                        tel: obj[i].tel,
                                                        commentblock: obj[i].commentblock

                                                      }, { upsert: true }, function (err, ret) {
    
    if (err) var text =   'Write error something was wrong.';
    else  var text = 'Operation success.';
    console.log(text);
    callback(err, {text: text});
  });
}
}
function writeDrug (globalValue, data, callback)  {
  var dbr = globalValue.read('base').dbr;
  var obj = data.data;

  for(var i = 0; i < obj.length; i++){
  dbr.collection('drug').update({_id: obj[i]._id}, { 
          
                                                    _id: obj[i]._id,
                                                    day: obj[i].day,
                                                    duration: obj[i].duration,
                                                    barcode: obj[i].barcode,
                                                    druglabel: obj[i].druglabel,
                                                    time: obj[i].time,
                                                    check: obj[i].check,
                                                    drugaddict: odj[i].drugaddict
                                                    
                                                    }, { upsert: true }, function (err, ret) {
    
    if (err) var text =   'Write error something was wrong.';
    else  var text = 'Operation success.';
    console.log(text);
    callback(err, {text: text});
  });
}
}
/*
// Password encode 
*/
function encrypData (data)  {
  var crypto = require('crypto'), algorithm = 'aes-128-cbc', key = 'Pas$w0rd';  
  var cipher = crypto.createCipher(algorithm,key);
  var crypted = cipher.update(data.passWord,'utf8','hex');
  crypted += cipher.final('hex');
  return ({ passWord: crypted });
}

/*
// Authentication 
*/
function userAuthen (globalValue, data, callback)  {
  var dbr = globalValue.read('base').dbr;
  dbr.collection('employee').find({}).sort({_id: 1}).toArray(function(err, retAry) {

    if (!retAry.length)  {
      callback (0, { success: false });
      return;
    }


    for (var i in retAry)  {
      var employee = retAry[i].employee;
      // console.log('->', employee);
      for (var j in employee)  {
        var emp = employee[j];  
        // console.log('->', emp.userName, data.userName, emp.passWord[0].passWord, encryp.passWord;
        if (emp.fullname == data.userName && emp.passWord == data.passWord)  {
          console.log('Authen success ->', emp.userName, emp.passWord);
          callback (0, { success: true, roleLevel: emp.roleLevel });
          return;
        }
      }
    }


    callback (0, { success: false });
  });
}

/*
// Dashboard  
*/
function dashBoard (dbr, cond, callback)  {
  var map = function() {
    var Qtoday = this.data;
    var Qtotal = Qtoday.length;
    emit(this.branchID,  { branchID: this.branchID, branchName: this.branchName, Qtotal: Qtotal, Qtoday: Qtoday});
  }
  var reduce = function(bID, bData) {  
    var result = { branchID: '', branchName: '', Qtotal: 0, Qtoday: []};
    for (var i = 0; i < bData.length; i++) {
      result.Qtotal += bData[i].Qtotal;
      result.branchID = bData[i].branchID;
      result.branchName = bData[i].branchName;
    }
    for (var j in bData)  {
      var one = bData[j];
      var count = one.Qtoday.length;
      for (var i = 0; i < count; i++)  {
        result.Qtoday.push(one.Qtoday[i]);
      }
    }
    return result;
  }
  var final = function(bID, reduceQ)  {
    reduceQ['Qcomplete'] = 0;
    reduceQ['Qcancel'] = 0;
    reduceQ['Qundefine'] = 0;
    reduceQ['completePeriod'] =  [0,0,0,0,0,0,0,0,0,0,0,0];
    reduceQ['cancelPeriod'] =  [0,0,0,0,0,0,0,0,0,0,0,0];
    reduceQ['undefinePeriod'] =  [0,0,0,0,0,0,0,0,0,0,0,0];
    reduceQ['satValue'] =  [0,0,0,0,0,0];
    var jb = [];
    reduceQ['jobName'] = [];
    var emp = [];
    reduceQ['employee'] = [];
    var ct = [];
    reduceQ['counter'] = [];

    for (var i = 0; i < reduceQ.Qtoday.length; i++)  {
      var item = reduceQ.Qtoday[i];


      var dt = new Date(item.pressTime);
      var t = dt.getHours();
      if (t < 8)  t = 0;
      else  {
        if (t > 19)  t = 11;
        else  t -= 8;
      }

      // if (item.status == 'noservice') {
      //  reduceQ.undefinePeriod[t]++;
      //  reduceQ.Qundefine++;
      //  continue;
      // }

      var comVal = 0;
      var canVal = 0;
      var undefVal = 0;
      switch(item.status)  {
        case 'complete':
        reduceQ.Qcomplete++;
        reduceQ.completePeriod[t]++;        
        comVal = 1;
        break;
        case 'cancel':
        reduceQ.Qcancel++;
        reduceQ.cancelPeriod[t]++;
        canVal = 1;
        break;
        default:
        reduceQ.Qundefine++;
        reduceQ.undefinePeriod[t]++;
        undefVal = 1;
        break;
      }

      item.jobName = item.jobName.trim();

      if (item.satisfy != null)  {
        var n = Number(item.satisfy);
        reduceQ.satValue[n]++;
      }
      else  {
        n = 0;
        reduceQ.satValue[n]++;
      }

      var j =  jb.indexOf(item.jobName);
      if (j < 0)  {
        jb.push(item.jobName);
        var jobObj = { jobName: item.jobName, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal, satValue: [0,0,0,0,0,0]};
        jobObj.satValue[n]++;
        reduceQ.jobName.push(jobObj);
      }
      else  {
        reduceQ.jobName[j].satValue[n]++;
        reduceQ.jobName[j].Qtotal++;
        reduceQ.jobName[j].Qcomplete += comVal;
        reduceQ.jobName[j].Qcancel += canVal;
        reduceQ.jobName[j].Qundefine += undefVal;
      }


      if (item.status == 'noservice') {
       continue;
      }


      var j =  emp.indexOf(item.userName.userName);
      if (j < 0)  {
        emp.push(item.userName.userName);
        var empObj = {userName: item.userName.userName, fullname: item.userName.fullname, Qtotal: 1, 
                   // Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal, satValue: [0,0,0,0,0,0] };
                   Qcomplete: comVal, Qcancel: canVal, satValue: [0,0,0,0,0,0] };
        empObj.satValue[n]++;
        // empObj.Qtotal++;
        reduceQ.employee.push(empObj);
      }
      else  {
        reduceQ.employee[j].satValue[n]++;
        reduceQ.employee[j].Qtotal++;
        reduceQ.employee[j].Qcomplete += comVal;
        reduceQ.employee[j].Qcancel += canVal;
        // reduceQ.employee[j].Qundefine += undefVal;
      }

      var j =  ct.indexOf(item.counter.id);
      if (j < 0)  {
        ct.push(item.counter.id);
        // reduceQ.counter.push({counter: item.counter.id, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal});
        reduceQ.counter.push({counter: item.counter.id, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal});
      }
      else  {
        reduceQ.counter[j].Qtotal++;
        reduceQ.counter[j].Qcomplete += comVal;
        reduceQ.counter[j].Qcancel += canVal;
        // reduceQ.counter[j].Qundefine += undefVal;
      }
    }
    delete reduceQ.Qtoday;
    return reduceQ;
  }

  var brQuery = [];
  if (cond.branchList.length)  {
    for (var i in cond.branchList)  {
      brQuery.push({branchID: cond.branchList[i].name});  
    }
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}, { $or: brQuery }]};
  }
  else  {    
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}]};
  }
  // console.log('Map-reduce for dashboard start ->');
  dbr.collection('br-Qtoday').mapReduce ( map, 
                                          reduce, 
                                          { 
                                            query: query, 
                                            out: cond.collOut,
                                            finalize: final 
                                          }, 
  function(err, dat)  {
    dbr.collection(cond.collOut).find({}).sort({_id: 1}).toArray(function (err, data) {     
      console.log('Map-reduce for dashboard ->', err, data.length);
      dbr.collection(cond.collOut).count(function (err, count) {
        console.log('Collection count ->', err, count);
        if (count != 0)  {
          dbr.collection(cond.collOut).drop(function (err) {
            callback(null, data);
          });
        }
        else  callback(1, data);
      });
    });
  });
}

/*
// Dashboard  
*/
function reportMapReduce (dbr, cond, callback)  {
  var map = function() {
    var Qtoday = this.data;
    var Qtotal = Qtoday.length;
    emit(this.branchID,  { branchID: this.branchID, branchName: this.branchName, Qtotal: Qtotal, Qtoday: Qtoday});
  }
  var reduce = function(bID, bData) {  
    var result = { branchID: '', branchName: '', Qtotal: 0, Qtoday: []};
    for (var i = 0; i < bData.length; i++) {
      result.Qtotal += bData[i].Qtotal;
      result.branchID = bData[i].branchID;
      result.branchName = bData[i].branchName;
    }
    for (var j in bData)  {
      var one = bData[j];
      var count = one.Qtoday.length;
      for (var i = 0; i < count; i++)  {
        result.Qtoday.push(one.Qtoday[i]);
      }
    }
    return result;
  }
  var final = function(bID, reduceQ)  {
 
    var total = {
      Qcomplete: 0,
      Qcancel: 0,
      Qundefine: 0,
      Qtotal: 0,
    }
    var period = {
      Qcomplete: [0,0,0,0,0,0,0,0,0,0,0,0],
      Qcancel: [0,0,0,0,0,0,0,0,0,0,0,0],
      Qundefine: [0,0,0,0,0,0,0,0,0,0,0,0],
      Qtotal: [0,0,0,0,0,0,0,0,0,0,0,0],
    }
    var jb = [];
    var jobName = [];
    var emp = [];
    var employee = [];
    var ct = [];
    var counter = [];

    for (var i in reduceQ.Qtoday)  {
      var item = reduceQ.Qtoday[i];

      // if (item.status == 'noservice')  continue;

      var dt = new Date(item.pressTime);
      var t = dt.getHours();
      if (t < 8)  t = 0;
      else  {
        if (t > 19)  t = 11;
        else  t -= 8;
      }

      if (item.satisfy != null) var n = Number(item.satisfy);
      else  n = 0;

      total.Qtotal++;
      period.Qtotal[t]++;        

      var comVal = 0;
      var canVal = 0;
      var undefVal = 0;

      switch(item.status)  {
        case 'complete':
        total.Qcomplete++;
        period.Qcomplete[t]++;        
        comVal = 1;
        break;
        case 'cancel':
        total.Qcancel++;
        period.Qcancel[t]++;
        canVal = 1;
        break;
        default:
        total.Qundefine++;
        period.Qundefine[t]++;
        undefVal = 1;
        break;
      } 

      var j =  jb.indexOf(item.jobName);
      if (j < 0)  {
        jb.push(item.jobName);
        var obj = {jobName: item.jobName, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal,
                      period: [0,0,0,0,0,0,0,0,0,0,0,0], satValue: [0,0,0,0,0,0], };
        obj.period[t]++;
        obj.satValue[n]++;
        jobName.push(obj);
      }
      else  {
        jobName[j].period[t]++;
        jobName[j].satValue[n]++;
        jobName[j].Qtotal++;
        jobName[j].Qcomplete += comVal;
        jobName[j].Qcancel += canVal;
        jobName[j].Qundefine += undefVal;
      }

      if (item.status == 'noservice')  continue;

      var j =  emp.indexOf(item.userName.userName);
      if (j < 0)  {
        emp.push(item.userName.userName);
        var obj = { userName: item.userName.userName, fullname: item.userName.fullname, Qtotal: 1,  Qcomplete: comVal, 
                    Qcancel: canVal, Qundefine: undefVal, satValue: [0,0,0,0,0,0], period: [0,0,0,0,0,0,0,0,0,0,0,0],
                    jobName: [{jobName: item.jobName, Qtotal: 1 }]};
        obj.satValue[n]++;
        obj.period[t]++;
        employee.push(obj);
      }
      else  {
        employee[j].period[t]++;
        employee[j].satValue[n]++;
        employee[j].Qtotal++;
        employee[j].Qcomplete += comVal;
        employee[j].Qcancel += canVal;
        employee[j].Qundefine += undefVal;
        for (var k = 0; k < employee[j].jobName.length; k++)  {
          if (employee[j].jobName[k].jobName == item.jobName) break;
        }
        if (k >= employee[j].jobName.length)  {
          employee[j].jobName.push({ jobName: item.jobName, Qtotal: 0});
          var k = employee[j].jobName.length-1;
        }
        employee[j].jobName[k].Qtotal++;
      }

      var j =  ct.indexOf(item.counter.id);
      if (j < 0)  {
        ct.push(item.counter.id);
        counter.push({counter: item.counter.id, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal});
      }
      else  {
        counter[j].Qtotal++;
        counter[j].Qcomplete += comVal;
        counter[j].Qcancel += canVal;
        counter[j].Qundefine += undefVal;
      }

    }

    reduceQ['total'] = total;
    reduceQ['period'] = period;
    reduceQ['jobName'] = jobName;
    reduceQ['employee'] = employee;
    reduceQ['counter'] = counter;

    delete reduceQ.Qtoday;
    return reduceQ;
  }
  var brQuery = [];
  if (cond.branchList.length)  {
    for (var i in cond.branchList)  {
      brQuery.push({branchID: cond.branchList[i].name});  
    }
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}, { $or: brQuery }]};
  }
  else  {    
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}]};
  }
  // console.log('Map-reduce for report start ->');
  dbr.collection('br-Qtoday').mapReduce ( map, 
                                          reduce, 
                                          { 
                                            query: query, 
                                            out: cond.collOut,
                                            finalize: final 
                                          }, 
  function(err, dat)  {
    dbr.collection(cond.collOut).find({}).sort({_id: 1}).toArray(function (err, data) {     
      console.log('Map-reduce for report ->', err, data.length);
      dbr.collection(cond.collOut).count(function (err, count) {
        console.log('Collection count ->', err, count);
        if (count != 0)  {
          dbr.collection(cond.collOut).drop(function (err) {
            callback(null, data);
          });
        }
        else  callback(1, data);
      });
    });
  });
}

module.exports = {
  firstInitialzation: firstInitialzation,
  emitter: emitter,
  clearReport: clearReport,
  saveQtoday: saveQtoday,
  saveHistory: saveHistory,
  excelExport: excelExport,
  saveEmployee: saveEmployee,
  savePatient: savePatient,
  branchListManage: branchListManage,
  loadTable: loadTable,
  getData: getData,
  getPat: getPat,
  writeData: writeData,
  writePatient: writePatient,
  writeDrug: writeDrug,
  userAuthen: userAuthen,
  encrypData: encrypData,
  dashBoard: dashBoard,
  reportMapReduce: reportMapReduce,
};

