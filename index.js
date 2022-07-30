//this file will serve as the connector point for all files of our project

var express = require('express')
var ejs = require('ejs')

var app = express();

app.use(express.static('public'));
app.set('view engine','ejs');

app. listen(8080);

//localhost:8080
app.get('/',function(req,res){
    res.render('pages/index'); ///views decalred already 9

});