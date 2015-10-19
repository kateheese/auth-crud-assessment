var express = require('express');
var router = express.Router();
var db = require('monk')('localhost/users');
var Users = db.get('users');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
