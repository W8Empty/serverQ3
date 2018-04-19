(function(){

    angular.module('myApp')
      .controller('adddrugCtrl', function($scope,appService,$mdDialog,$timeout) {
    
       var socket = appService.getSocket();



$(document).ready(function(){
    $('#add-drug').on('submit', function(e){
        e.preventDefault();
        console.log("Hello");
        var drugaddict = $('#drugaddict').val();
        var day = $('#day').val();
        var duration = $('#duration').val();
        var barcode = $('#barcode').val();
        var namemedicine = $('#namemedicine').val();
        var druglabel = $('#druglabel').val();
        var time = $('#time').val();
        var check = $('#check').val();

        console.log(day);

        $.ajax({
            url:"http://localhost:3200/dates",
            async: true,
            dataType: 'json',
            data: JSON.stringify({
                "drugaddict": drugaddict,
                "day": day,
                "duration": duration,
                "barcode": barcode,
                "namemedicine": namemedicine,
                "druglabel": druglabel,
                "time": time,
                "check": check
            }),
            type: "POST",
            contentType: "application/json",
            success: function(data){
                window.location.href="adddrug.html"
            },
            error: function(xhr, status, err){
                console.log(err);
            }
        });
    });
});



})

})();