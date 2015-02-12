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
		var $nodeWord = d.word;    	
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
	node = svg.selectAll("circle.node")
		.data(nodes, function(d) { return d.id; })
		.style("fill", color)

	node.transition()
		.attr("r", radius);

	// Enter any new nodes.
	node.enter()
		.append("svg:circle")
		.attr("class", "node")
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; })
		.attr("r", radius)
		.style("fill", color)
		.on("click", click)
		.call(force.drag)
		.on('mouseout', function(d){
			tip.hide(d);
		})
		.on('mouseover', function(d){
			tip.show(d);
			examples(d);
		});

	// Exit any old nodes.
	node.exit().remove();

}

function tick() {
	link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	node.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
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
	if(d.clickable == "true"){
		$offsetClicked = d.offset;
		$group = d.group;
		var jsonURL = 'http://desolate-taiga-6759.herokuapp.com/offset/' + $offsetClicked + '/pos/' + d.group + '/word/' + $wordToSearch + '/parent/' + previousOffset;
		previousOffset = $offsetClicked;
		updateGraph(jsonURL);
	}
}

//Changes the radius of the circle based of the identifier
function radius(d) {
	switch(d.identifier) {
		case 'word-hypernym': //adverb
			return "20";
			break;
		default:
			return "10";
	}
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


//Update graph with new extended JSON objects
function updateGraph(newURL) {
	d3.json(newURL, function(json) {
		root = json.words[0]; //set root node
		root.fixed = true;
		root.x = w / 2;
		root.y = h / 2 - 80;
		update();
	 	jsonTextArea(newURL);
	});
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