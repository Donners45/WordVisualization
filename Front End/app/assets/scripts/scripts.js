



/********************
****** GRAPH *******
********************/


var $wordToSearch = getUrlParameter('wordSearch');

var w = 960,
    h = 960,
    node,
    link,
    root,
    title,
    previousOffset = 0;

var simpleJsonURL = 'http://desolate-taiga-6759.herokuapp.com/word/basic/';
var jsonURL = 'http://desolate-taiga-6759.herokuapp.com/word/basic/' + $wordToSearch;

jsonTextArea(jsonURL);

d3.json(jsonURL, function (json) {
    root = json.words[0]; //set root node
    root.fixed = false;
    root.x = w / 2;
    root.y = h / 2 - 80;
    update();
    saveItem($wordToSearch);
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
        return d.definition;
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
        .data(links, function (d) { return d.target.id; });

    // Enter any new links.
    link.enter().insert("svg:line", ".node")
        .attr("class", "link")
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; })
        .style("fill", "none")
        .style("stroke", "#bbb")
        .style("stroke-width", "1.5px");

    // Exit any old links.
    link.exit().remove();

    // Update the nodes…
    node = svg.selectAll(".node")
        .data(nodes, function(d) { return d });
    
    var nodeE = node
        .enter();
    
    var nodeG = nodeE.append("g")
        .attr("class", "node")
        .call(force.drag)
        .style("cursor", "pointer");

    nodeG.append("circle")  
        .attr("r", 10)
        .on("click", click)
        .on('mouseout', function (d) {
            tip.hide(d);
        })
        .on('mouseover', function (d) {
            if(typeof d.definition != 'undefined'){
                tip.show(d);
            }
            examples(d);
        })
        .style("fill", color)
        .style("stroke", "#34495e")
        .style("stroke-width", "2px")
        .style("box-sizing", "border-box")
        .style("stroke-location", "inside");

    nodeG.append("text")
        .attr("dy", 10 + 15)
        .attr("text-anchor", "middle")
        .text(function (d) { return correctlyFormat(d.word); })
        .style("font-size", "11px")
        .style("color", "#000");

    node.exit().remove();
    
    svg.selectAll("text").data(nodes).exit().remove();
    svg.selectAll("circle").data(nodes).exit().remove();

}

function tick() {
    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
}

/***********************
*** CUSTOM FUNCTIONS ***
***********************/

function examples(d) {
    $('.examples').empty();
    $.each(d.examples, function (key, value) {
        $('.examples').append("<li>" + correctlyFormat(value.example) + "</li>");
    });
}

function correctlyFormat(word) {
    if (word.indexOf("_") > 0) {
        word = word.replace(/_/g, ' ');
    }

    return word.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}


//Change the color of the nodes based off their group
function color(d) {
    switch (d.group) {
    case 'r': //adverb
        return "#e74c3c";
    case 'n': //noun
        return "#3498db";
    case 'v': //verb
        return "#2ecc71";
    case 's': //adjective
        return "#e78229";
    default:
        return "#9b59b6";
    }
}

//Request extended JSON objects when clicking a clickable node
function click(d) {
    $wordClicked = d.word;

    var jsonURL = 'http://desolate-taiga-6759.herokuapp.com/word/' + $wordClicked;

    updateGraph(jsonURL);
    saveItem(d.word);

    var newURL = $.query.set("wordSearch", d.word).toString();

    window.history.pushState("", "", newURL);
}

// Returns a list of all nodes under the root.
function flatten(root) {
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) { node.size = node.children.reduce(function (p, v) { return p + recurse(v); }, 0); } ;
        if (!node.id) { node.id = (i = i + 1); } ;
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

var breadcrumbArray = [];

function refresh(){
    breadcrumb.innerHTML = '';

    if  (localStorage.getItem('testObject') !== null) {
        breadcrumbArray =  JSON.parse(localStorage.getItem('testObject'));

        for (var i = 0; i < breadcrumbArray.length; i++) {
            breadcrumb.innerHTML += '<li><a onclick="bcSearch(\'' + breadcrumbArray[i] + '\')">' + breadcrumbArray[i] + '</a></li>';
        }   
    }
    
}   

function saveItem(text){
    breadcrumbArray.push(text); 
    localStorage.setItem('testObject', JSON.stringify(breadcrumbArray));
    refresh();
}

function bcSearch(word){

    var newURL = $.query.set("wordSearch", word).toString();
    window.history.pushState("", "", newURL);

    
    saveItem(correctlyFormat(word));
    updateGraph(simpleJsonURL + word);

}

refresh();

$("#save").on("click", function(){
  var html = d3.select("svg")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
  var img = '<img src="'+imgsrc+'">'; 
  d3.select("#svgdataurl").html(img);


  var canvas = document.querySelector("canvas"),
      context = canvas.getContext("2d");

  var image = new Image;
  image.src = imgsrc;
  image.onload = function() {
      context.drawImage(image, 0, 0);

      var canvasdata = canvas.toDataURL("image/png");

      var a = document.createElement("a");
      a.download = "sample.png";
      a.href = canvasdata;
          document.body.appendChild(a);
      a.click();
  };

});







/********************
****** SEARCH *******
********************/

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
} 

$('#search-submit').click(function(){
    localStorage.removeItem('testObject');
});