var width = 700,
	height = 690;

var color = d3.scale.category10();

var force = d3.layout.force()
		.charge(-1000)
		.linkDistance(100)
		.size([width, height]);

var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height);


d3.json("assets/scripts/nodes.json", function(error, graph) {
	force
		.nodes(graph.nodes)
		.links(graph.links)
		.start();


	var node_drag = d3.behavior.drag()
		.on("dragstart", dragstart)
		.on("drag", dragmove)
		.on("dragend", dragend);

	function dragstart(d, i) {
		force.stop() // stops the force auto positioning before you start dragging
	}

	function dragmove(d, i) {
		d.px += d3.event.dx;
		d.py += d3.event.dy;
		d.x += d3.event.dx;
		d.y += d3.event.dy; 
		tick(); // this is the key to make it work together with updating both px,py,x,y on d !
	}

	function dragend(d, i) {
		d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
		tick();
		force.resume();
	}

	var link = svg.selectAll(".link")
			.data(graph.links)
			.enter().append("line")
			.attr("class", "link")
			.style("stroke-width", function(d) {
				return Math.sqrt(d.value);
			});

	var gnodes = svg.selectAll('g.gnode')
			.data(graph.nodes)
			.enter()
			.append('g')
			.classed('gnode', true)
			.call(node_drag);

	var node = gnodes.append("circle")
			.attr("class", "node")
			.attr("r", 10)
			.style("fill", function(d) { return color(d.group); });

	var labels = gnodes.append("text")
			.text(function(d) {return d.name; })
			.attr("dy", "2em")
			.style("text-anchor", "middle");

	force.on("tick", tick);

	function tick() {
		// Update the links
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		gnodes.attr("transform", function(d) { 
			return 'translate(' + [d.x, d.y] + ')'; 
		});    

	}

});	