var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var home = require('./home');
var mysql = require('mysql');
var session = require('express-session');
const { check, validationResult } = require('express-validator');

// Establish MySQL connection
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hmsystem'
});

router.get('/', function(req ,res){
    res.render('login.ejs');  // Render the login page
});

// Session middleware
router.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Body-parser middleware
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// POST request for login validation
router.post('/', [
    check('username').notEmpty().withMessage("Username is required"),
    check('password').notEmpty().withMessage("Password is required")
], function (request, response) {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        // Return validation errors
        return response.status(422).json({ errors: errors.array() });
    }

    var username = request.body.username;
    var password = request.body.password;
    console.log(username);

    if (username && password) {
        // Query database for matching username and password
        con.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (error) {
                console.error('Error during query:', error);
                return response.status(500).send('Database query error');
            }

            if (results.length > 0) {
                // Login successful
                request.session.loggedin = true;
                request.session.username = username;
                response.cookie('username', username);

                var status = results[0].email_status;
                if (status === "not_verified") {
                    // Email not verified
                    return response.send("Please verify your email.");
                } else {
                    // Redirect to home after successful login
                    return response.redirect('/home');  // Ensure no further response is sent
                }
            } else {
                // Incorrect login details
                return response.status(401).send("Incorrect Username/Password");
            }
        });
    } else {
        // Username and password not provided
        return response.status(400).send("Please enter your username and password.");
    }
});

module.exports = router;
