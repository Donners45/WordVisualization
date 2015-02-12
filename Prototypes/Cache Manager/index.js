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


  function requestGraphData(req, res, next) {  
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

function getData(word, fn){
	
	var key = myCache.get(word);
	
		if (Object.keys(key).length > 0) {
		fn(key[word]);
	}else{
		getWordResponse((word), function(getWord){
			key = myCache.get(word);
			fn(key[word]);	
		});
	}
}

function highlightData(req, res, next) {

	getData(req.params.word, function(result) { 
		var data = result;
		var offset = req.params.offset;
	
		var setParentVisible = false;
		
		for  (var i = 0; i < data.words[0].children.length; i++){
			setParentVisible = false;
			
			if (data.words[0].children[i].children.length  == 0){
			
				data.words[0].children[i].visible = 'false';
			
			}else{
			
				for (var x = 0; x < data.words[0].children[i].children.length; x++){
		
						if  (data.words[0].children[i].children[x].offset != offset){
							
							data.words[0].children[i].children[x].visible = 'false';
						}else{
							setParentVisible = true;
						}
				}	
			
			if (setParentVisible == false) {
				data.words[0].children[i].visible = 'false';
			}
			
			}
		}
		
		res.send(data);
		
	});
	
		next();

	
}

var server = restify.createServer();
server.use(restify.fullResponse());
server.get('/word/:word', requestGraphData);
server.head('/word/:word', requestGraphData);
server.get('/offset/:offset/word/:word', highlightData);

var port = process.env.PORT || 5000;
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});