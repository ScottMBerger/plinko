var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');

var Solution = mongoose.model('Solution');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

router.post('/solutions', function(req, res, next) {
  var solution = new Solution(req.body);

  solution.save(function(err, solution){
    if(err){ return next(err); }

    res.json(solution);
  });
});

router.get('/solutions', function(req, res, next) {
  Solution.find(function(err, solutions){
    if(err){ return next(err); }

    res.json(solutions);
  });
});

router.get('/result', function(req, res, next) {
	Solution.findOne({ 'position': 360 }, 'result position', function (err, response) {
	  if (err) return handleError(err);
	  console.log('Result for position '+response.position+' is '+response.result);
	  res.json(response);
	})
});

router.get('/count', function(req, res, next) {
	Solution.count({ 'result': 'right' }, function (err, response) {
	  if (err) return handleError(err);
	  //console.log('Result for position '+response.position+' is '+response.result);
	  res.json(response);
	})
});

router.post('/posts', function(req, res, next) {
  var post = new Post(req.body);

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});


router.get('/posts/:post', function(req, res) {
  res.json(req.post);
});

router.put('/posts/:post/upvote', function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});


module.exports = router;

