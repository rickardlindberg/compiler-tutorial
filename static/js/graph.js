function Graph( canvas_name, width, height ) {
	this.svg = "http://www.w3.org/2000/svg";
	this.canvas = document.getElementById(canvas_name);
	this.width = width;
	this.height = height;
	this.canvas.style.width = width + "px";
	this.canvas.style.height = height + "px";
	this.vertices = {};
	this.forcex = {};
	this.forcey = {};
	this.stepsize = 0.0005;
	this.iteration = 0;
	this.task = null;

	// tunables to adjust the layout
	this.repulsion = 50000; // repulsion constant, adjust for wider/narrower spacing
	this.spring_length = 5; // base resting length of springs
}

Graph.prototype.createVertex = function( name, colors, clickFn ) { // XXX -- should support separate id and name 
	// create an SVG rectangle, attach additional attributed to it
	var vertex = document.createElementNS(this.svg, "rect");
	if( colors === undefined ) {
		colors = { color: "#222", stroke: "#000" };
	}
	vertex.setAttribute("style", "fill: "+colors.color+"; stroke: "+colors.stroke+"; stroke-width: 1px;");
	vertex.setAttribute("rx", "10px"); // round the edges
	// random placement with a 10% margin at the edges
	vertex.posx = Math.random() * (this.width * 0.8) + (this.width * 0.1);
	vertex.posy = (Math.random() * (this.height * 0.8)) + (this.height * 0.1);
	vertex.setAttribute("x", vertex.posx );
	vertex.setAttribute("y", vertex.posy );
	vertex.onclick = clickFn;
	vertex.edges = new Array();
	this.canvas.appendChild(vertex);
	
	// text label
	vertex.name = name;
	vertex.textLabel = document.createElementNS(this.svg, "text");
	vertex.textLabel.setAttribute("style", "fill: #555753; stroke-width: 1px;");
	vertex.textLabel.onclick = clickFn;
	vertex.textLabel.appendChild( document.createTextNode( name ) );	
	this.canvas.appendChild( vertex.textLabel );
	
	// get the size of the rectangle from the text label's bounding box
	vertex.h = vertex.textLabel.getBBox().height + 10;
	vertex.w = vertex.textLabel.getBBox().width + 10;
	vertex.setAttribute("height", vertex.h + "px");
	vertex.setAttribute("width", vertex.w + "px");

	this.vertices[name] = vertex;
}

Graph.prototype.createEdge = function( a, b, style ) {
	var line = document.createElementNS(this.svg, "path");
	if( style === undefined ) {
		style = "stroke: #444; stroke-width: 3px;";
	}
	line.setAttribute("style", style);
	this.canvas.insertBefore(line, this.canvas.firstChild);
	this.vertices[a].edges[b] = { "dest" : b, "line": line };
	this.vertices[b].edges[a] = { "dest" : a, "line": line };
}

Graph.prototype.findClosestPairDistance = function (pointPairs) {
	var minDistance = null;
	var minDx = null;
	var minDy = null;
	for (var pair in pointPairs) {
		var p1 = pointPairs[pair].p1;
		var p2 = pointPairs[pair].p2;
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;
		var d2 = dx * dx + dy * dy;
		if (minDistance === null || d2 < minDistance) {
			minDistance = d2;
			minDx = dx;
			minDy = dy;
		}
	}
	return {
		dx: minDx,
		dy: minDy
	};
}

Graph.prototype.getPointForVertex = function (i) {
	return { x: this.vertices[i].posx, y: this.vertices[i].posy };
}

Graph.prototype.getRectanglePointsForVertex = function (i) {
	var points = [];
	var vertex = this.vertices[i];
	var posx = vertex.posx;
	var posy = vertex.posy;
	var w = vertex.w;
	var h = vertex.h;
	var n = 6;
	for (var i=0; i<=n; i++) {
		var dx = i*w/n;
		points.push({ x: posx + dx, y: posy     });
		points.push({ x: posx + dx, y: posy + h });
	}
	var m = 2;
	for (var i=0; i<=m; i++) {
		var dy = i*h/m;
		points.push({ x: posx    , y: posy + dy });
		points.push({ x: posx + w, y: posy + dy });
	}

	return points;
}

Graph.prototype.pairwiseCombineArrays = function (a, b) {
	var pairs = [];
	for (var i in a) {
		for (var j in b) {
			pairs.push({ 
				p1: a[i], 
				p2: b[j]
			});
		}
	}
	return pairs;
}

Graph.prototype.findClosestDistance = function (i, j) {
	var iPoints = this.getRectanglePointsForVertex(i);
	var jPoints = this.getRectanglePointsForVertex(j);
	var pointPairs = this.pairwiseCombineArrays(iPoints, jPoints);
	return this.findClosestPairDistance(pointPairs);
}

Graph.prototype.getRectangle = function(i) {
	var v = this.vertices[i];
	return {
		x1: v.posx, 
		y1: v.posy, 
		x2: v.posx + v.w,
		y2: v.posy + v.h,
		w: v.w,
		h: v.h,
		cx: v.posx + v.w / 2,
		cy: v.posy + v.h / 2
	};
}

Graph.prototype.resolveCollisionsRectangular = function() {
	for (var i in this.vertices) {
		for (var j in this.vertices) {
			if (i !== j) {
				var r1 = this.getRectangle(i);
				var r2 = this.getRectangle(j);
				var notOverlap =  r1.x2 < r2.x1
                               || r1.x1 > r2.x2
                               || r1.y2 < r2.y1
                               || r1.y1 > r2.y2;
				var overlap = !notOverlap;
				if (overlap) {
					var kickDistance = 50;
					if (r1.y1 < r2.y1) {
						this.vertices[i].posy -= kickDistance;
						this.vertices[j].posy += kickDistance;
					} else {
						this.vertices[i].posy += kickDistance;
						this.vertices[j].posy -= kickDistance;
					}
				}
			}
		}
	}
}

Graph.prototype.resolveCollisionsCircular = function() {
	for (var i in this.vertices) {
		for (var j in this.vertices) {
			if (i !== j) {
				var r1 = this.getRectangle(i);
				var r2 = this.getRectangle(j);
				var vect = {
					x: r2.cx - r1.cx,
					y: r2.cy - r1.cy
				};
				var distance = Math.sqrt(vect.x * vect.x + vect.y * vect.y);
				var diff = distance - (1.1*r1.w/2 + 1.1*r2.w/2);
				if (diff < 0) {
					var dx = -diff * vect.x / distance;
					var dy = -diff * vect.y / distance;
					this.forcex[i] -= 1000*dx;
					this.forcey[i] -= 1000*dy;
				}
			}
		}
	}
}

Graph.prototype.resolveCollisions = function() {
	//this.resolveCollisionsRectangular();
	this.resolveCollisionsCircular();
}

Graph.prototype.updateLayout = function() {
	for (i in this.vertices) {
		this.forcex[i] = 0;
		this.forcey[i] = 0;
		for (j in this.vertices) {
			if( i !== j ) {
				var delta = this.findClosestDistance(i, j);
				var deltax = delta.dx;
				var deltay = delta.dy;
				var d2 = deltax * deltax + deltay * deltay;

				// add some jitter if distance^2 is very small
				if( d2 < 0.01 ) {
	                deltax = 0.1 * Math.random() + 0.1;
	                deltay = 0.1 * Math.random() + 0.1;
					var d2 = deltax * deltax + deltay * deltay;
                }

				// Coulomb's law -- repulsion varies inversely with square of distance
				this.forcex[i] -= (this.repulsion / d2) * deltax;
				this.forcey[i] -= (this.repulsion / d2) * deltay;

				// spring force along edges, follows Hooke's law
				if( this.vertices[i].edges[j] ) {
					var distance = Math.sqrt(d2);
					this.forcex[i] += (distance - this.spring_length) * deltax;
					this.forcey[i] += (distance - this.spring_length) * deltay;
				}
			}
		}
	}
	this.resolveCollisions();
	for (i in this.vertices) {
		// update rectangles
		this.vertices[i].posx += this.forcex[i] * this.stepsize;
		this.vertices[i].posy += this.forcey[i] * this.stepsize;
	}
	for (i in this.vertices) {
		this.vertices[i].setAttribute("x", this.vertices[i].posx );
		this.vertices[i].setAttribute("y", this.vertices[i].posy );
		// update labels
		this.vertices[i].textLabel.setAttribute("x", this.vertices[i].posx + 5 + "px");
		this.vertices[i].textLabel.setAttribute("y", this.vertices[i].posy + (2*this.vertices[i].h/3 )+ "px");
		// update edges
		for (j in this.vertices[i].edges) {
			this.vertices[i].edges[j].line.setAttribute("d", "M"+(this.vertices[i].posx+(this.vertices[i].w/2))+","+(this.vertices[i].posy+(this.vertices[i].h/2))+" L"+(this.vertices[this.vertices[i].edges[j].dest].posx+(this.vertices[this.vertices[i].edges[j].dest].w/2))+" "+(this.vertices[this.vertices[i].edges[j].dest].posy+(this.vertices[this.vertices[i].edges[j].dest].h/2)));
		}
	}
	this.iteration++;
	if( this.iteration > 300 ) // XXX -- should watch for rest state, not just quit after N iterations
		this.quit();
}
Graph.prototype.go = function() {
	// already running
	if (this.task) {
		return;
	}
	obj = this;
	this.iteration = 0;
	this.task = window.setInterval(function(){ obj.updateLayout(); }, 1);
}
Graph.prototype.quit = function() {
	window.clearInterval(this.task);
	this.task = null;
}
