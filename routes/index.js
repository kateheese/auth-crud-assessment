var express = require('express');
var router = express.Router();
var db = require('monk')('localhost/users');
var Users = db.get('users');
var Students = db.get('students');
var bcrypt = require('bcrypt');

router.get('/', function(req, res) {
  res.render('index', { title: 'Sign Up' });
});

router.post('/', function(req, res) {
  Users.findOne({ email: req.body.email }, function(err, user) {
    var errors = [];
    if(user) {
      errors.push("Email already exists");
    }
    if(!req.body.email.trim()) {
      errors.push("Email can't be blank");
    }
    if(!req.body.password.trim()) {
      errors.push("Password can't be blank");
    }
    if(req.body.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    if(!req.body.pass_confirm.trim()) {
      errors.push("Please confirm your password");
    }
    if(req.body.password != req.body.pass_confirm) {
      errors.push("Passwords don't match");
    }
    if(errors.length) {
      res.render('index', { email: req.body.email, errors: errors});
    } else {
      var hash = bcrypt.hashSync(req.body.password, 8);
      Users.insert({
        email: req.body.email,
        passwordDigest: hash,
      }, function(err, user) {
        req.session.userId = user._id;
        res.redirect('/dashboard');
      })
    }
  })
});

router.get('/signin', function(req, res) {
  res.render('pages/signin', { title: 'Sign In' });
});

router.post('/signin', function(req, res) {
  Users.findOne({ email: req.body.email }, function(err, user) {
    if(user) {
      if(bcrypt.compareSync(req.body.password, user.passwordDigest)) {
        req.session.userId = user._id;
        res.redirect('/dashboard');
      }
      else {
        res.render('pages/signin', { error: "Email / password don't match" });
      }
    } else {
      res.render('pages/signin', { error: "Email / password don't match" });
    }
  });
});

router.get('/dashboard', function(req, res) {
  if(req.session.userId) {
    Users.findOne({ _id: req.session.userId }, function(err, user) {
      Students.find({}, function(err, students) {
        res.render('pages/dashboard', { title: 'Dashboard', user: user, students: students });
      })
    });
  }
  else {
    res.redirect('/signin');
  }
});

router.post('/dashboard', function(req, res) {
  Students.findOne({ phone: req.body.phone }, function(err, student) {
    var errors = [];
    if(student) {
      errors.push("Phone number already exists");
    }
    if(!req.body.name.trim()) {
      errors.push("Name can't be blank");
    }
    if(!req.body.phone.trim()) {
      errors.push("Phone number can't be blank");
    }
    if(req.body.phone.replace('-', '').length < 10) {
      errors.push("Invalid phone number");
    }
    if(errors.length) {
      Users.findOne({ _id: req.session.userId }, function(err, user) {
        res.render('pages/dashboard', { user: user, name: req.body.name, phone: req.body.phone, errors: errors});
    });
    } else {
      Students.insert({
        name: req.body.name,
        phone: req.body.phone,
      }, function(err, users) {
        res.redirect('/dashboard');
      })
    }
  })
});

router.get('/students/:id', function(req, res) {
  Users.findOne({ _id: req.session.userId }, function(err, user) {
    Students.findById(req.params.id, function(err, student) {
      res.render('pages/show', { title: student.name, user: user, student: student });
    })
  })
});

router.get('/signout', function(req, res) {
  req.session = null;
  res.redirect('/');
});

module.exports = router;
