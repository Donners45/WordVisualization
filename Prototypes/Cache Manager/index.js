var restify = require('restify');
var request = require('request');
var NodeCache = require( "node-cache" );


var myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

function getWordResponse(word, fn) {

	var url = ('http://obscure-river-4096.herokuapp.com/v1.01/word/' + word);

	console.log(url);

	request(url, function(error, response, body){
			if (!error){
				myCache.set(word, JSON.parse(body));
				fn(body);
			}else{
				console.log('Error whilst requesting server data');
			}
		});
	}


  function respond(req, res, next) {  
	var wordValue = req.params.word;
	var value =  myCache.get(wordValue);
	
	if (Object.keys(value).length > 0) {
		console.log('cached value : ' + wordValue);
		res.send(value[wordValue]);
	}else{
	console.log('live value : ' + wordValue);
		getWordResponse((wordValue), function(getWord){
			res.send(JSON.parse(getWord));
		});
	}
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