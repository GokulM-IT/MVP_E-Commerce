require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Make the folder available to the public
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/ProductImages'));

// Declared Variable
let status = false;
let whichUser;
let current_userID;
let oldImgPath;

// Mysql Creation
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

// Mysql Connection
con.connect(function (err) {
    if (err) throw err;
    console.log('Mysql Connected!!!');
});

// Route GET
app.get('/', function (req, res) {
    res.render('signup');
});

// Signup GET
app.get('/signup', function (req, res) {
    res.render('signup');
});

// Signup POST
app.post('/signup', function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmpassword = req.body.confirmPassword;
    const userType = req.body.userType;

    bcrypt.hash(password, 10, function (err, hash) {
        if (err) {
            throw err;
        } else {
            const data = {
                NAME: name,
                PASSWORD: hash,
                EMAIL: email,
                USERTYPE: userType
            };
            const query = "INSERT INTO users SET ?";

            con.query(query, data, function (err) {
                if (err) {
                    throw err;
                } else {
                    return res.redirect('/login');
                }
            });
        }
    });
});

// Login GET
app.get('/login', function (req, res) {
    res.render('login', { passCheck: 'passAgreed' });
});

// Login POST
app.post('/login', function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const data = { EMAIL: email };
    const query = 'SELECT ID, PASSWORD, USERTYPE FROM users WHERE ?';

    con.query(query, data, function (err, results) {
        if (results.length == 0) {
            return res.render('login', { passCheck: 'error' });
        } else {
            const hashPass = results[0].PASSWORD;
            const userType = results[0].USERTYPE;
            current_userID = results[0].ID;

            bcrypt.compare(password, hashPass, function (err, passwordMatch) {
                if (passwordMatch) {
                    if (userType === 'Vendor') {
                        whichUser = 'Vendor';
                        status = true;
                        return res.redirect('/add-products');
                    } else {
                        whichUser = 'Customer';
                        status = true;
                        return res.redirect('/Home');
                    }
                } else {
                    return res.render('login', { passCheck: 'error' });
                }
            });
        }
    });
});

// Logout
app.get('/logout', function (req, res) {
    status = false;
    whichUser = '';
    current_userID = null;
    oldImgPath = '';

    res.redirect('/login');
});

// VENDOR

// Add products GET
app.get('/add-products', function (req, res) {
    if (status === true) {
        if (whichUser === 'Vendor') {
            return res.render('add-products');
        } else {
            return res.render('Error', { imgPath: 'Images/401.jpg' });
        }
    } else {
        return res.render('Error', { imgPath: 'Images/403.jpg' });
    }
});

// Set storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'ProductImages/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

// Initialize multer
const upload = multer({ storage: storage });

// Add products POST
app.post('/add-products', upload.single('imgFile'), function (req, res) {
    const productName = req.body.productName;
    const productPrice = req.body.productPrice;
    const textArea = req.body.textArea;
    const imgPath = req.file.path;

    const data = {
        PRODUCTNAME: productName,
        PRICE: productPrice,
        PRODUCTDETAILS: textArea,
        IMGPATH: imgPath,
        OWNERID: current_userID
    };
    const query = 'INSERT INTO products SET ?';

    con.query(query, data, function (err, results) {
        if (err) throw err;
        res.send();
    });
});

// Edit products POST
app.post('/edit-products', function (req, res) {
    const productId = req.body.productId;
    const query = 'SELECT * FROM products WHERE PRODUCTID = ?'

    con.query(query, [productId], function (err, results) {
        oldImgPath = results[0].IMGPATH;
        res.render('edit-products', { products: results }); 
    });
});

// Update edited product POST
app.post('/update-products', upload.single('imgFile'), function (req, res) {
    const productId = req.body.productId;
    const productName = req.body.productName;
    const productPrice = req.body.productPrice;
    const textArea = req.body.textArea;

    if (req.file) {
        oldImgPath = req.file.path;
    }
    
    const query = 'UPDATE products SET PRODUCTNAME = ?, PRICE = ?, PRODUCTDETAILS = ?, IMGPATH = ? WHERE PRODUCTID = ?';
    
    con.query(query, [productName, productPrice, textArea, oldImgPath, productId], function (err, results) {
        if (err) throw err;
        res.redirect('/view-products');
    });
});

// View products GET
app.get('/view-products', function (req, res) {
    if (status === true) {
        if (whichUser === 'Vendor') {
            const data = {
                OWNERID: current_userID
            };
            const query = 'SELECT * FROM products WHERE ?'

            con.query(query, data, function (err, results) {
                if (results.length == 0) {
                    res.render('view-products', { title: 'Product are Empty', products: results });
                } else {
                    res.render('view-products', { title: 'Products', products: results });
                }
            });
        } else {
            return res.render('Error', { imgPath: 'Images/401.jpg' });
        }
    } else {
        return res.render('Error', { imgPath: 'Images/403.jpg' });
    }
});

// Delete products POST
app.post('/delete-products', function (req, res) {
    const data = {
        PRODUCTID: req.body.productId
    }
    const query = 'DELETE FROM orders WHERE ?';

    con.query(query, data, function (err, results) {
        if (err) throw err;
        const nestedQuery = 'DELETE FROM cart WHERE ?';

        con.query(nestedQuery, data, function (err, results) {
            if (err) throw err;
            const innerNestedQuery = 'DELETE FROM products WHERE ?';

            con.query(innerNestedQuery, data, function (err, results) {
                if (err) throw err;
                res.redirect('view-products');
            });
        });
    })
});

// View orders GET
app.get('/view-orders', function (req, res) {
    if (status === true) {
        if (whichUser === 'Vendor') {
            const query = 'SELECT products.PRODUCTID, products.PRODUCTNAME, products.IMGPATH, products.PRODUCTDETAILS, products.PRICE ' +
                'FROM orders JOIN products ' +
                'ON orders.PRODUCTID = products.PRODUCTID ' +
                'WHERE orders.OWNERID = ?';

            con.query(query, [current_userID], function (err, results) {
                if (err) throw err;

                if (results.length == 0) {
                    res.render('view-orders', { title: 'No Orders', products: results });
                } else {
                    res.render('view-orders', { title: 'Orders', products: results });
                }
            });
        } else {
            return res.render('Error', { imgPath: 'Images/401.jpg' });
        }
    } else {
        return res.render('Error', { imgPath: 'Images/403.jpg' });
    }
});

// CUSTOMER

// Home GET
app.get('/Home', function (req, res) {
    if (status === true) {
        if (whichUser === 'Customer') {
            const query = 'SELECT * FROM products';

            con.query(query, function (err, results) {
                return res.render('Home', { title: 'Products', products: results });
            });
        } else {
            return res.render('Error', { imgPath: 'Images/401.jpg' });
        }
    } else {
        return res.render('Error', { imgPath: 'Images/403.jpg' });
    }
});

// Cart POST 
// From Home GET
app.post('/cart', function (req, res) {
    const productId = req.body.productId;
    const data = {
        USERID: current_userID,
        PRODUCTID: productId
    }
    const query = 'INSERT INTO cart SET ?';

    con.query(query, data, function (err, results) {
        if (err) throw err;
    });
    res.send();
});

// View cart GET
app.get('/view-cart', function (req, res) {
    if (status === true) {
        if (whichUser === 'Customer') {
            const data = {
                USERID: current_userID
            }
            const query = 'SELECT products.PRODUCTID, products.PRODUCTNAME, products.PRICE, products.PRODUCTDETAILS, products.IMGPATH ' +
                'from cart join products ' +
                'ON cart.PRODUCTID = products.PRODUCTID ' +
                'WHERE ?';

            con.query(query, data, function (err, results) {
                if (err) throw err;

                if (results.length == 0) {
                    res.render('view-cart', { title: 'Cart is empty', products: results });
                } else {
                    res.render('view-cart', { title: 'Cart', products: results });
                }
            });
        } else {
            return res.render('Error', { imgPath: 'Images/401.jpg' });
        }
    } else {
        return res.render('Error', { imgPath: 'Images/403.jpg' });
    }
});

// Remove cart POST
app.post('/remove-cart', function (req, res) {
    const userId = current_userID;
    const productId = req.body.productId;

    const query = 'DELETE FROM cart WHERE USERID = ? AND PRODUCTID = ?';

    con.query(query, [userId, productId], function (err, results) {
        if (err) throw err;
        res.redirect('view-cart');
    });
});

// Place order GET
app.get('/place-order', function (req, res) {
    if (status === true) {
        if (whichUser === 'Customer') {
            const query = 'SELECT cart.USERID, products.PRODUCTID, products.OWNERID ' +
                'FROM cart JOIN products ' +
                'ON cart.PRODUCTID = products.PRODUCTID ' +
                'WHERE cart.USERID = ?';

            // Getting products ownerid and productid by relationship table(cart, products)
            con.query(query, [current_userID], function (err, results) {
                if (err) throw err;

                // User don't have any product in cart
                if (results.length == 0) {
                    return res.redirect('/Home');
                } else {
                    const data = results.map(row => [row.USERID, row.PRODUCTID, row.OWNERID]);

                    // Insert above data into orders table    
                    const nestedQuery = 'INSERT INTO orders (USERID, PRODUCTID, OWNERID) VALUES ?';
                    con.query(nestedQuery, [data], function (err, result) {
                        if (err) throw err;

                        // After order placed delete products from cart table
                        const innerNestedQuery = 'DELETE FROM cart WHERE USERID = ?';
                        con.query(innerNestedQuery, [current_userID], function (err, res) {
                            if (err) throw err;
                        });
                    });

                    // Order confirmed message with email
                    const secondQuery = 'SELECT EMAIL FROM users WHERE ID = ?';
                    con.query(secondQuery, [current_userID], function (err, response) {
                        if (err) throw err;
                        return res.render('order-confirmed', { email: response });
                    });
                }
            });
        } else {
            return res.render('Error', { imgPath: 'Images/401.jpg' });
        }
    } else {
        return res.render('Error', { imgPath: 'Images/403.jpg' });
    }
});

// Local Hosting 
app.listen(process.env.PORT || 3000, function () {
    console.log('Server running at port on 3000...');
});