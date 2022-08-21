//this file will serve as the connector point for all files of our project

var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
//create connection
 mysql.createConnection({
    host:"127.0.0.1",
    user:"root",
    password:"",
    database:"ecommerce"
})


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

app.use(session({
    secret:"secret",
    resave: true,
    saveUninitialized: true
}));


function isProductInCart(cart,id){
    for(let i = 0 ; i< cart.length; i++){
       if(cart[i].id == id){
        return true;
       }
    }
    return false;
}

function calTotal(cart,req){
    total = 0;
    for(let i=0; i<cart.length; i++){
       //if we're offering a discounted price
       if(cart[i].sale_price){
          total = total + (cart[i].sale_price*cart[i].quantity);
       }else{
          total = total + (cart[i].price*cart[i].quantity)
       }
    }
    req.session.total = total;
    return total;
 
 }
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

app.post('/add_to_cart', function(req,res){
    var id= req.body.id;
    var name= req.body.name;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity= req.body.quantity;
    var image= req.body.image;

    var product = {id:id, name:name,price:price, sale_price:sale_price, quantity:quantity, image:image};

    if (req.session.cart){  // user already has something in cart

        var cart= req.session.cart;
        if(!isProductInCart(cart,id)){
            cart.push(product);
        }
    }
    else{
        req.session.cart = [product];
        var cart= req.session.cart;

    }

    //calculate total
    calTotal(cart,req);

    //return to cart page
    res.redirect('/cart');

});

app.get('/cart', function(req,res){

    var cart = req.session.cart;
    var total = req.session.total;

    res.render('pages/cart',{cart:cart, total:total});
});

app.post('/remove_item',function(req,res){
    var id= req.body.id;
    var cart= req.session.cart;

    for(let i= 0 ; i< cart.length ; i++){
        if(cart[i].id == id){
            cart.splice(cart.indexOf(i),1);
        }
    }

     //calculate total
     calTotal(cart,req);

     //return to cart page
     res.redirect('/cart');

});

app.post('/edit_quantity', function(req,res){
    var id= req.body.id;
    var quantity= req.body.quantity;
    var increase_product_quantity_btn= req.body.increase_product_quantity_btn;
    var decrease_product_quantity_btn= req.body.decrease_product_quantity_btn;
    var cart= req.session.cart;

    if(increase_product_quantity_btn){
        for(let i=0; i<cart.length; i++ ){
            if(cart[i].id==id){
                if(cart[i].quantity>0)
                    cart[i].quantity = parseInt(cart[i].quantity)+1;
        }
    }
    }
    if(decrease_product_quantity_btn){
        for(let i=0; i<cart.length; i++ ){
            if(cart[i].id==id){
                if(cart[i].quantity>1)
                    cart[i].quantity = parseInt(cart[i].quantity)-1;
        }
    }
    }
    
     //calculate total
     calTotal(cart,req);

     //return to cart page
     res.redirect('/cart');

});

app.get('/checkout', function(req,res){
    var total= req.session.total;

    res.render('pages/checkout',{total:total})
});
app.post('/place_order',function(req,res){
    var name = req.body.name;
    var address = req.body.address;
    var email = req.body.email;
    var phone = req.body.phone;
    var city = req.body.city;
    var cost = req.session.total;
    var product_id;
    var status = "Not Paid";
    var date= new Date();
    var id= Date.now();
    req.session.order_id = id;

    var con=  mysql.createConnection({
        host:"127.0.0.1",
        user:"root",
        password:"",
        database:"ecommerce"
    })

    var cart =  req.session.cart;
    for(let i=0; i<cart.length; i++){
        product_id= product_id+ ","+ cart[i].id;
    }
    con.connect((err)=>{
        if(err){
            console.log(err)

        }else{
            var query = "INSERT INTO orders(id,cost,name,email,city,address,phone,date,status, product_id) VALUES ?";
            var values = [[id,cost,name,email,city,address,phone,date,status,product_id]];
            con.query(query,[values],(err,result)=>{
                for(let i=0; i<cart.length; i++){
                    var query = "INSERT INTO order_items(order_id, product_id,product_name, product_price,product_image,product_quantity,order_date) VALUES ?";
                var values = [[id, cart[i].id, cart[i].name, cart[i].price, cart[i].image, cart[i].quantity, new Date()]];
                con.query(query,[values],(err,result)=>{})
                }
                res.redirect('/payment');

            })
        }
    })


});

app.get('/payment', function(req,res){
    var total= req.session.total;
    res.render('pages/payment',{total:total});
});

app.get("/verify_payment",function(req,res){

    var transaction_id = req.query.transaction_id;
    var order_id= req.session.order_id;

    var con = mysql.createConnection({
        host:"127.0.0.1",
        user:"root",
        password:"",
        database:"ecommerce"
    })

    con.connect((err)=>{
        if(err){
            console.log(err)

        }else{
            var query = "INSERT INTO payments(order_id,transaction_id,date) VALUES ?";
            var values = [[order_id,transaction_id,new Date()]];

            con .query(query,[values],(err,result)=>{
                con.query("UPDATE orders SET status='Paid' WHERE id='"+order_id+"'", (err,result)=> {})
                res.redirect('/thank_you')
            });
        }

})
});

app.get('/thank_you', function(req,res){
    var order_id = req.session.order_id;
    res.render("pages/thank_you",{order_id:order_id});
})
