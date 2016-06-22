var mongoose = require('mongoose');

var SolutionSchema = new mongoose.Schema({
  position: {type: Number, unique: true},
  result: String,
  frequency: {type: Number, default: 1}
});

SolutionSchema.methods.upvote = function(cb) {
  this.frequency += 1;
  this.save(cb);
};

mongoose.model('Solution', SolutionSchema);