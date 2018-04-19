function updateProgram (globalValue, callback)  {

  var updateList = [
    {
      url: 'https://cloud1.ppetech.com:3200/update/update.js',
      output: 'test1.js',
    },
    {
      url: 'https://cloud1.ppetech.com:3200/update/update.js',
      output: 'test2.js',
    },
  ];

  setTimeout(function()  {
    // console.log('Update list ->', updateList);
    var https = require('https');
    var fs = require('fs');
    var async = require('async');
    var q = async.queue(function (item, callback) {

      console.log('Updating ->', item.output, item.url);

      var file = fs.createWriteStream(item.output);
      var request = https.get(item.url, function(res) {
        res.pipe(file);
        res.on('end', function()  {
          console.log('Complete download file ->', item.output);
          callback(0);
        });
      });
    });
    q.drain = function() {
      console.log('Update program done ->', updateList);
      callback(0, {text: 'Program update done ->'});
    }
    q.push(updateList, function (err) {
    });

  }, 1000*5);

}

module.exports = {
  updateProgram: updateProgram,
};

