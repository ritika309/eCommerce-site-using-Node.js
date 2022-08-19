//this file will serve as the connector point for all files of our project

var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mysql = require('mysql');

//create connection
 mysql.createConnection({
    host:"127.0.0.1",
    user:"root",
    password:"",
    database:"ecommerce"
})
//

var app = express();

//tells the program to use public folder
app.use(express.static('public'));

//use ejs file as view engine
app.set('view engine','ejs');

app.listen(8080);
//localhost:8080

app.use(bodyParser.urlencoded({
    extended:true
}));

app.get('/',function(req,res){
    var con = mysql.createConnection({
        host:"127.0.0.1",
        user:"root",
        password:"",
        database:"ecommerce"
    })
    con.query("SELECT * FROM products",(err,result)=>{res.render('pages/index',{result:result}); })
    ///views is already known node, it is for html + don't use .ejs extension
 
});