
var w = 1000,
	h = 800,
	radius = 10,
	node,
	link,
	root;

var force = d3.layout.force()
	.on("tick", tick)
	.charge(function(d) { return -500; })
	.linkDistance(function(d) { return d.target._children ? 200 : 120; })
	.size([w, h - 160]);

var svg = d3.select("body").append("svg")
	.attr("width", w)
	.attr("height", h);

var jsonURL = 'http://obscure-river-4096.herokuapp.com/word/bitter';
// var jsonURL = 'assets/scripts/nodes2.json';

d3.json(jsonURL, function(json) {
	root.fixed = true;
	root.x = w / 2;
	root.y = h / 2 - 80;
	update();
});

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
	node.enter().append("svg:circle")
		.attr("class", "node")
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; })
		.attr("r", radius)
		.style("fill", color)
		.on("click", click)
		.call(force.drag);

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
			case 'n':
				return "#e74c3c";
				break;
			case 'v':
				return "#3498db";
				break;
			case 'a':
				return "#2ecc71";
				break;
			default:
				return "#9b59b6";
		}
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