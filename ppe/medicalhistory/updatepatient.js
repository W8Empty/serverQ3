(function(){

    angular.module('myApp')
      .controller('UpdatepatientCtrl', function($scope,appService,$mdDialog,$timeout) {
    
       var socket = appService.getSocket();



$(document).ready(function(){
    $('#update-patient').on('submit', function(e){
        e.preventDefault();
        var id = $('#id').val();
        var number = $('#number').val();
        var name = $('#name').val();
        var surname = $('#surname').val();
        var sex = $('#sex').val();
        var weight = $('#weight').val();
        var bloodtype = $('#bloodtype').val();
        var house = $('#house').val();
        var subarea = $('#subarea').val();
        var area = $('#area').val();
        var postalcode = $('#postalcode').val();
        var education = $('#education').val();
        var jobhis = $('#jobhis').val();
        var allergyhistory = $('#allergyhistory').val();
        var namemedicine = $('#namemedicine').val();
        var tel = $('#tel').val();
        var commentblock = $('#commentblock').val();
        var url = 'http://localhost:3200/users/' +id+ ''

        $.ajax({
            url: url,
            async: true,
            dataType: 'json',
            data: JSON.stringify({
                "number": number,
                "name": name,
                "surname": surname,
                "sex": sex,
                "weight": weight,
                "bloodtype": bloodtype,
                "house": house,
                "subarea": subarea,
                "area": area,
                "postalcode": postalcode,
                "education": education,
                "jobhis": jobhis,
                "allergyhistory": allergyhistory,
                "tel": tel,
                "commentblock": commentblock
            }),
            type: "PUT",
            contentType: "application/json",
            success: function(data){
                window.location.href="medicalhistory.html"
            },
            error: function(xhr, status, err){
                console.log(err);
            }
        });
    });
});



})

})();