const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PatientSchema = new Schema({

    
  email: { type : String,required:[true, 'email field is requied']},
  password: { type : String,required:[true, 'password field is requied']},
  fullname: { type : String,required:[true, 'fullname field is requied']},
  
  
  number : {type:Number,default:''},
      name : {type:String,default:''},
      surname : {type:String,default:''},
      sex : {type:String,default:''},
      age : {type:String,default:''},
      weight: {type:String,default:''},
      bloodtype : {type:String,default:''},
      house : {type:String,default:''},
      village : {type:String,default:''},
      subarea : {type:String,default:''},
      area : {type:String,default:''},
      postalcode : {type:Number,default:''},
      education : {type:String,default:''},
      jobhis : {type:String,default:''},
      allergyhistory : {type:String,default:''},
      
      Beforebreakfast: {type:String,default:'NO'},
      BB1 : {type:String,default:''},
      BB2 : {type:String,default:''},
      BB3 : {type:String,default:''},
      BB4 : String,
      BB5 : String,
      BBH : {type:String,default:'7'},
      BBM : {type:String,default:'0'},
  
      Afterbreakfast: {type:String,default:'NO'},
      AB1 : {type:String,default:''},
      AB2 : {type:String,default:''},
      AB3 : {type:String,default:''},
      AB4 : String,
      AB5 : String,
      ABH : {type:String,default:'8'},
      ABM : {type:String,default:'0'},
  
      Beforelunch: {type:String,default:'NO'},
      BL1 : {type:String,default:''},
      BL2 : {type:String,default:''},
      BL3 : {type:String,default:''},
      BL4 : String,
      BL5 : String,
      BLH : {type:String,default:'11'},
      BLM : {type:String,default:'0'},
  
      Afterlunch: {type:String,default:'NO'},
      AL1 : {type:String,default:''},
      AL2 : {type:String,default:''},
      AL3 : {type:String,default:''},
      AL4 : String,
      AL5 : String,
      ALH : {type:String,default:'13'},
      ALM : {type:String,default:'0'},
  
      Beforedinner: {type:String,default:'NO'},
      BD1 : {type:String,default:''},
      BD2 : {type:String,default:''},
      BD3 : {type:String,default:''},
      BD4 : String,
      BD5 : String,
      BDH : {type:String,default:'17'},
      BDM : {type:String,default:'0'},
  
      Afterdinner: {type:String,default:'NO'},
      AD1 : {type:String,default:''},
      AD2 : {type:String,default:''},
      AD3 : {type:String,default:''},
      AD4 : String,
      AD5 : String,
      ADH : {type:String,default:'19'},
      ADM : {type:String,default:'0'},
  
      Beforenight: {type:String,default:'NO'},
      BN1 : {type:String,default:''},
      BN2 : {type:String,default:''},
      BN3 : {type:String,default:''},
      BN4 : String,
      BN5 : String,
      BNH : {type:String,default:'21'},
      BNM : {type:String,default:'0'},
  
      tel : {type:String,default:''},
      commentblock : {type:String,default:''}
  

  },{collection: 'user'});
//---------------------database-------------------------------------------------  
  const Patient = mongoose.model('patient',PatientSchema);
  

 router.get('/patients',function(req, res){
  Patient.find({}).then(function(patient){
    res.send(patient)
  });
 });

  router.post('/register',function(req, res){
   Patient.create(req.body).then(function(patient){
     res.send(patient)
   });
  });

  router.put('/:id',function(req, res){
    Patient.findByIdAndUpdate({_id: req.params.id},req.body).then(function(patient){
      Patient.findOne({_id: req.params.id}).then(function(patient){ 
        res.send(patient);               
      });
    });
   });

   router.delete('/:id',function(req, res){
    Patient.findByIdAndRemove({_id: req.params.id},req.body).then(function(patient){
      res.send(patient)
    });
   });

router.post('/login',function(req, res){
  var email = req.body.email;
  var password = req.body.password;

  Patient.findOne(
    {
      email: email,
      password: password
    }
    , function(err, patient) {
      if(err) {
        console.log(err);
        return res.status(500).send({check:"False"});
      }

      if(!patient) {
        return res.status(404).send({check:"False"});
      }

      return res.status(200).send(patient);
    })
});

router.post('/getid',function(req, res){
  var email = req.body.email;
  var password = req.body.password;

  Patient.findOne(
    {
      email: email,
      password: password
    }
    , function(err, patient) {
      if(err) {
        console.log(err);
        return res.status(500).send({check:"False"});
      }

      if(!patient) {
        return res.status(404).send({check:"False"});
      }

      return res.status(200).send({_id :patient.id});
    })
});

router.post('/reqid',function(req, res){
  
  var id = req.body._id;

  Patient.findOne(
    {
      _id: id
    }
    , function(err, patient) {
      if(err) {
        console.log(err);
        return res.status(500).send({check:"False"});
      }

      if(!patient) {
        return res.status(404).send({check:"False"});
      }

      return res.status(200).send(patient);
    })
});

// router.post('/checkbarcode',function(req, res){
  
//   var barcode = req.body.barcode;

//   Car.findOne(
//     {
//       barcode : barcode
//     }
//     , function(err, car) {
//       if(err) {
//         console.log(err);
//         return res.status(500).send({notfound:"Not found this email-password."});
//       }

//       if(!car) {
//         return res.status(404).send({mistake:"You have mistake something."});
//       }
//       return res.status(200).send(car);

//     })
// });


module.exports = router;