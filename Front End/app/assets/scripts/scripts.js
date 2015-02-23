var $wordToSearch = getUrlParameter('wordSearch');

var w = 960,
	h = 960,
	node,
	link,
	root,
	title
	previousOffset = 0;
	
var jsonURL = 'http://desolate-taiga-6759.herokuapp.com/word/' + $wordToSearch;

jsonTextArea(jsonURL);

d3.json(jsonURL, function(json) {
	root = json.words[0]; //set root node
	root.fixed = true;
	root.x = w / 2;
	root.y = h / 2 - 80;
	update();
});

var force = d3.layout.force()
	.on("tick", tick)
	.charge(-700)
	.gravity(0.1)
	.friction(0.9)
	.linkDistance(50)
	.size([w, h]);

var svg = d3.select(".graph").append("svg")
	.attr("width", w)
	.attr("height", h);

//Create tool tips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
		var $nodeWord = d.definition;    	
    	if($nodeWord.indexOf("_") > 0){
    		$newNodeWord = $nodeWord.replace(/_/g, ' ');
    		return $newNodeWord;
    	}else{
    		return $nodeWord;
    	}
	});

svg.call(tip);





//Update the graph
function update() {
	var nodes = flatten(root),
	links = d3.layout.tree().links(nodes);

	// Restart the force layout.
	force
		.nodes(nodes)
		.links(links)
		.start();

	// Update the links…
	link = svg.selectAll("line.link")
		.data(links, function(d) { return d.target.id; });

	// Enter any new links.
	link.enter().insert("svg:line", ".node")
		.attr("class", "link")
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	// Exit any old links.
	link.exit().remove();

	// Update the nodes…
	node = svg.selectAll(".node")
		.data(nodes)
		.enter().append("g")
		.attr("class", "node")
		.call(force.drag)
		.on('mouseout', function(d){
			tip.hide(d);
		})
		.on('mouseover', function(d){
			tip.show(d);
			examples(d);
		});

	node.append("circle")	
		.attr("r", 10)
		.style("fill", color);

	node.append("text")
    	.attr("dy", 10 + 15)
    	.attr("text-anchor", "middle")
    	.text(findNodeWord);

}

function tick() {
	link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}




/***********************
*** CUSTOM FUNCTIONS ***
***********************/

function examples(d) {
	$('.examples').empty();
	$.each(d.examples, function( key, value ) {
		$('.examples').append("<li>" + toTitleCase(value.example) + "</li>");
	});
}

function findNodeWord(d) {
	var $nodeWord = d.word;    	
	if($nodeWord.indexOf("_") > 0){
		$newNodeWord = $nodeWord.replace(/_/g, ' ');
		return $newNodeWord;
	}else{
		return $nodeWord;
	}
}


//Change the color of the nodes based off their group
function color(d) {
	if(d._children){
		return "#95a5a6";
	}else{
		switch(d.group) {
			case 'r': //adverb
				return "#e74c3c";
				break;
			case 'n': //noun
				return "#3498db";
				break;
			case 'v': //verb
				return "#2ecc71";
				break;
			case 's': //adjective
				return "#e78229";
				break;
			default:
				return "#9b59b6";
		}
	}
}

//Request extended JSON objects when clicking a clickable node
function click(d) {
	$offsetClicked = d.offset;
	$group = d.group;
	$wordClicked = d.word;
	var jsonURL = 'http://desolate-taiga-6759.herokuapp.com/word/' + $wordClicked;
	console.log(jsonURL);
	previousOffset = $offsetClicked;
	updateGraph(jsonURL);
	saveItem(d.word);
}

// Returns a list of all nodes under the root.
function flatten(root) {
	var nodes = [], i = 0;

	function recurse(node) {
		if (node.children) node.size = node.children.reduce(function(p, v) { return p + recurse(v); }, 0);
		if (!node.id) node.id = ++i;
		nodes.push(node);
		return node.size;
	}

	root.size = recurse(root);
	return nodes;

}

//Add json to textarea
function jsonTextArea(newURL){
	$.getJSON(newURL, function(data) {
		$('#jsonCode').html(JSON.stringify(data, null, 4));
	});
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

var breadcrumbArray = [];

function refresh(){
	results.innerHTML = '';

	if  (localStorage.getItem('testObject') !== null) {
		breadcrumbArray =  JSON.parse(localStorage.getItem('testObject'));

		for (var i = 0; i < breadcrumbArray.length; i++) {
			results.innerHTML += '<li class="list-group-item" style="background-color: #333;">' + breadcrumbArray[i] + ' </li>';
		}	
	}
	
}	

function saveItem(text){
	breadcrumbArray.push(text);	
	localStorage.setItem('testObject', JSON.stringify(breadcrumbArray));
	refresh();
}

refresh();







/********************
****** SEARCH *******
********************/

$('.login header span').click(function (){
	hideSearch();
});

function showSearch() {
	$('.login').removeClass('hide');
	$('.overlay').removeClass('hide');
}

function hideSearch() {
	$('.login').addClass('hide');
	$('.overlay').addClass('hide');
}

function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            if (sParameterName[1] != ''){
            	hideSearch();
            }
            return sParameterName[1];
        }
    }
} 