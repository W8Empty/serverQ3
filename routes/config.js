var express = require('express');
var router = express.Router();
var fs = require('fs');

/* Load list file in folder */
function listDir (folder)  {
  var path = require('path');
  var files = fs.readdirSync(folder);
  if (files.length)  {
    for (var i in files)  files[i] = folder+files[i];
  }
  // else files = ['Error...'];
  console.log(files, files.length);
  return(files);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  var listFiles = listDir('./');
  res.render('config', {  title: 'Server configuration', listFiles: listFiles});

  // res.render('config', { title: 'Server configuration'});
});

/* POST */
router.post('/', function(req, res, next) {
  console.log(req.body);
  if (req.body.cmd == 'loadJson')  {
    var preference = fs.readFileSync(req.body.fileName, 'utf8');
    // res.send('config', { title: 'Server config', jsonText: preference});
    res.send({ title: 'Server config', json: preference});
  }
  if (req.body.cmd == 'saveJson')  {
    fs.writeFileSync(req.body.fileName, req.body.data);
    // res.send('config', { title: 'Server config', jsonText: req.body.data});
    res.send({ title: 'Server config', jsonText: req.body.data});
  }
  if (req.body.cmd == 'readFolder')  {
    var listFiles = listDir (req.body.folderName);
    // res.send('config', { title: 'Server config', listFiles: listFiles});
    res.send({ title: 'Server config', listFiles: listFiles});
  }

  if (req.body.cmd == 'Cha')  {
    var listFiles = listDir (req.body.folderName);
    // res.send('config', { title: 'Server config', listFiles: listFiles});
    res.send({ title: 'Server config', listFiles: listFiles});
  }



});

module.exports = router;


