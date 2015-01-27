var $wordToSearch = getUrlParameter('wordSearch');

var w = 1000,
	h = 800,
	node,
	link,
	root,
	title;
	
var jsonURL = 'http://desolate-taiga-6759.herokuapp.com/word/' + $wordToSearch;
d3JSON(jsonURL);
function d3JSON(jsonURL) {
		d3.json(jsonURL, function(json) {

		root = json.words[0]; //set root node
		root.fixed = true;
		root.x = w / 2;
		root.y = h / 2 - 80;
		update();
	});
}

var force = d3.layout.force()
	.on("tick", tick)
	.charge(function(d) { return -500; })
	.linkDistance(function(d) { return d.target._children ? 200 : 120; })
	.size([w, h - 160]);

var svg = d3.select(".graph").append("svg")
	.attr("width", w)
	.attr("height", h);

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
	    return  d.word + "";
	})

svg.call(tip);

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
		.on('mouseover', tip.show) //Added
 		.on('mouseout', tip.hide); //Added

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

// Color leaf nodes orange, and packages white or blue.
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

function radius(d) {
	switch(d.identifier) {
		case 'word-hypernym': //adverb
			return "20";
			break;
		default:
			return "10";
	}
}

// Toggle children on click.
function click(d) {
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else {
		d.children = d._children;
		d._children = null;
	}
	update();
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