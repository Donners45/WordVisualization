var restify = require('restify');
var request = require('request');



function getWordResponse(word, fn) {
console.log('called');

var url = ('http://obscure-river-4096.herokuapp.com/v1.01/word/' + word);

console.log(url);

request(url, function(error, response, body){
		if (!error){
			fn(body);
		}else{
			console.log('fail');
		}
	});
  }

function respond(req, res, next) {  

getWordResponse((req.params.word), function(getWord){
	res.send(JSON.parse(getWord));
		});
  next();
}

var server = restify.createServer();
server.use(restify.fullResponse());
server.get('/word/:word', respond);
server.head('/word/:word', respond);

var port = process.env.PORT || 5000;
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});