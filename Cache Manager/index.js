// ********************************************
	// Node packages 
// ********************************************
var restify = require('restify');
var request = require('request');
var NodeCache = require( "node-cache" );

// ********************************************
	// Global Variables 
	// PLEASE SET YOUR RUTIME BACK END SYSTEM
	// IF RUNNING LOCALLY USE LOCALHOST _
	// backend_base_url OTHERWISE USE THE 
	// LIVE URL
// ********************************************
var backend_base_URL = 'http://wordnet-python-service.herokuapp.com';		// LIVE APPLICATION URL
//var backend_base_URL = 'http://localhost:5001';						// LOCAL APPLICATION URL

var myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

// ********************************************
	// Helper Functions 
	// Functions designed to be reusable,
	// aiding the retrival and processing
	// of data structures
// ********************************************

// Async safe call to request extended data for a given offset and POS 
function getExtenedData(offset, pos, fn){
	requestExtendedInformation(offset, pos, function(cbData){
		fn(cbData);
	});
}

// Return data for given word from cache or request
function getData(word, off, fn){
	
	var data = myCache.get(off + '-' + word)	
	if (Object.keys(data).length > 0) {
		fn(data[off + '-' + word])
	} else {
		var key = myCache.get(word);
			if (Object.keys(key).length > 0) {
			fn(key[word]);
		}else{
			requestRawResponse((word), function(getWord){
				key = myCache.get(word);
				fn(key[word]);	
			});
		}
	}
}

// Recursive async safe call to return a node in a tree
function findObjectById(root, id, fn) {
        for (var k in root.children) {
			if (root.children[k].offset == id) {
				fn(root.children[k]);
            }
                 findObjectById(root.children[k], id, fn);
        }  
};

// Refactored method of Highlighting data
function highlightData(root, id, parents){
    for (var k in root.children) {
			if (k > 0) parents = [];
			parents.push(root.children[k]);		
			if (root.children[k].offset == id) {
				for(var p in parents){
					parents[p].visible = 'true';				
				}
            }else{
				root.children[k].visible = 'false';	
			}			
                 highlightData(root.children[k], id, parents);
        }
}

// ********************************************
	// Request Functions
	// Set of functions designed to request 
	// data from the backend service
// ********************************************

function requestExtendedInformation(offset, pos, fn) {	
	var url = (backend_base_URL + '/v1.01/offset/'+ pos +  '/' + offset);
	baseRequest(url, null, fn);
}

function requestRawResponse(word, fn) {
	var url = (backend_base_URL + '/v1.01/word/' + word);
	baseRequest(url, word, fn);
}

function requestBasicSearch(word, fn){	
	var url = (backend_base_URL + '/word/' + word);
	baseRequest(url, null ,fn);
}

// Async safe method to request data from a given url
// If cacheKey is provided response will be cached
function baseRequest(url, cacheKey ,fn){
	request(url, function(error, response, body){
		if (!error){
		 if(response.statusCode == 200){
			if (cacheKey != null) {myCache.set(cacheKey, JSON.parse(body));}
			fn(body); 	
		 }else{
		 	fn(body); // Error in request body - return the details to callback
		 	console.log('error with requested data');
		 }
		}else{
			fn(JSON.stringify({"status" : 500, "error" : error})); // Error in request - raise and return this error
			console.log('Error whilst requesting data from backend' + error);
		}
	});
}

// ********************************************
	// Web Functions 
	// Set of functions designed to consume 
	// a word and write the response based on
	// request routing
// ********************************************

  function requestGraphData(req, res, next) {  
	var wordValue = req.params.word;
	if (checkWordIsValid(wordValue)){
		var value =  myCache.get(wordValue);	
		if (Object.keys(value).length > 0) {
			console.log('cached value : ' + wordValue);
			res.send(value[wordValue]);
		}else{
			console.log('live value : ' + wordValue);
			requestRawResponse((wordValue), function(getWord){
					res.send(JSON.parse(getWord));
			});
		}
	}else{
		res.send(returnInvalidInputParameterMessage());
	}
		next();
}

// Return previous data structure based on word or parent node key
// Request extended data for requested word
// Inject the new data into the correct position in the document
// Highlight the document with visible flags
// Cache the response with the new offset and send
function extendData(req, res, next){

	var offset = req.params.offset;
	var POS = req.params.pos;
	var pWord = req.params.word;

	if (checkWordIsValid(pWord) && checkPOSisValid(POS) &&
		 checkOffsetIsValid(offset) && checkOffsetIsValid(req.params.parent)){

		getData(pWord, req.params.parent, function(result) {

			var data = JSON.parse( JSON.stringify( result ) );		
		
			getExtenedData(offset, POS, function(result) {
				
				// check result here!

				var extendedData = JSON.parse(result);
				
				findObjectById(data.words[0], offset, function(cbResp) {
					var selectedNode = cbResp;
					selectedNode.children = extendedData.extended_information[0].children;
					selectedNode.definitiion = extendedData.extended_information[0].definitiion;
					selectedNode.examples = extendedData.extended_information[0].examples;			
					var x = [];
					highlightData(data.words[0], extendedData.extended_information[0].children[0].offset, x);
					myCache.set((offset + '-' +pWord), data);
					res.send(data);		
				});
			});
		});
	}else{
		res.send(returnInvalidInputParameterMessage());
	}
	next();
}

function requestBasicInfo(req, res, next){
	var word = req.params.word;
	if (checkWordIsValid(word)){

		requestBasicSearch((word), function(getWord){
			res.send(JSON.parse(getWord));
		});
	}else{
		res.send(returnInvalidInputParameterMessage());
	}
	next();
}

// ********************************************
	// Web service cache helper functions
	// Set of functions to show the status of
	// services through HTTP GETs 
	// These should be secured with some form 
	// of key or auth token as they can directly
	// view and flush caches
// ********************************************

function flush(){
	myCache.flushAll();
}

function flushAll(req, res, next){
	try{
		flush();
		status = {"status" : 200};
	}catch(err){
		status = returnStandardErrorMessage(err);
	}
	res.send(status);
	next();
}

function printStats(req, res, next){
	res.send(myCache.getStats());	
	next();
}

function help(req, res, next){
	var msg = 'Usage - [ Basic Requests - /word/basic/{string : word to search} - returns JSON object of the requested word ] [Standard Request - /word/{string - word to search}  - returns JSON object of requested word] [Extend Search - /offset/{integer - offset of word to extend}/pos/{char - group of word to extend}/word/{string - word of the root search}/parent/{integer - offset of imediate parent of word to extend, enter 0 if parent node is root.} - Returns orignal JSON feed with extended data for the requested word]'; 
	var messageObj = {'help' : msg};
	res.send(messageObj);
	next();
}


// ********************************************
	// Validation & Authentication functions
	// Set of functions to aid validation 
	// and authentication
// ********************************************

function checkOffsetIsValid(OffsetToCheck){
	var regex = /^[0-9]+$/
	if (OffsetToCheck.match(regex)){
		return true;
	}
	else{
		return false;
	}
}

function checkPOSisValid(POStoCheck){
	var regex = /^[a-zA-Z]$/		// character a-z A-Z
	if(POStoCheck.match(regex)){
		return true;
	}else{
		return false;
	}
}

function checkWordIsValid(wordToCheck){
	var regex=/^[a-zA-Z_]{0,30}$/		// String of text no spaces _ allowed 30

	if (wordToCheck.match(regex)){
		return true;
	} else {
		return false; 
	}
}

// ********************************************
	// Standard responses
	// reuseable methods for building response 
	// message
// ********************************************

// returns an internal server err with caught exception message as error object
function returnStandardErrorMessage(err){
	return {"status" : 500, "Message" : err.message};
}

function returnInvalidInputParameterMessage(){
	return {"status" : 400, "Message" : "bad response - input parameters not valid" };
}


// ********************************************
	// runtime unit testing exposed as resource
// ********************************************

// runs a series of unit tests to validate the validation logic
function severstatus(req, res, next){
	
	var valid_word = 'bitter';
	var valid_word2 = 'distance_between';
	var valid_POS = "C";
	var valid_POS2 = "g";
	var valid_offset = '12345678'
	var valid_offset2 = '098765'

	var invalid_word = 'logic is fun';
	var invalid_word2 = 'b1tt3rne55';
	var invalid_word3 = "bitter?word=hello";
	var invalid_POS = "ab";
	var invalid_POS2 = "1";
	var invalid_POS3 = "*";
	var invalid_offset = '12345k678'
	var invalid_offset2 = ' 010234'
	var invalid_offset3 = '1246*235'

	res.send({"valid word 1" : checkWordIsValid(valid_word),
			  "valid word 2" : checkWordIsValid(valid_word2),
			  "invalid word 1" : checkWordIsValid(invalid_word),
			  "invalid word 2" : checkWordIsValid(invalid_word2),
			  "invalid word 3" : checkWordIsValid(invalid_word3),
			  "valid POS" : checkPOSisValid(valid_POS),
			  "valid POS 2" : checkPOSisValid(valid_POS2),
			  "invalid POS" : checkPOSisValid(invalid_POS),
			  "invalid POS 2" : checkPOSisValid(invalid_POS2),
			  "invalid POS 3" : checkPOSisValid(invalid_POS3),
			  "valid offset" : checkOffsetIsValid(valid_offset),
			  "valid offset2" : checkOffsetIsValid(valid_offset2),
			  "invalid offset" : checkOffsetIsValid(invalid_offset),
			  "invalid offset 2" : checkOffsetIsValid(invalid_offset2),
			  "invalid offset 3" : checkOffsetIsValid(invalid_offset3)
			});
}

// ********************************************
	// initialize the webservice and handlers
// ********************************************

var server = restify.createServer({name : 'WordService-Application-Layer'});

// Set up Fullresponse to help build response formats
server.use(restify.fullResponse());

// GET routing for standard word information
server.get('/word/:word', requestGraphData);

//server.head('/word/:word', requestGraphData);
// GET routing for extending data
server.get('/offset/:offset/pos/:pos/word/:word/parent/:parent', extendData);

// GET routing for basic word information
server.get('/word/basic/:word', requestBasicInfo);

// GET route for flushing cache - this will ideally require authentication
server.get('/functions/flush', flushAll);

// GET route for printing the contents of the cache - again this should require authentication
server.get('/resources/stats', printStats);

// GET route for help resource
server.get('/resources/help', help);

// GET route for help resource
server.get('/resources/servicestatus', severstatus);
// Allocate application port - 5000 for local debugging - 80 for live
var port = process.env.PORT || 5000;

// Boot up the application
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});