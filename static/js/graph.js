function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.add = function (dx, dy) {
    this.x += dx;
    this.y += dy;
}

Vector.prototype.addV = function (v) {
    this.add(v.x, v.y);
}

Vector.prototype.subVNew = function (v) {
    return new Vector(this.x - v.x, this.y - v.y);
}

Vector.prototype.scale = function (factor) {
    this.x *= factor;
    this.y *= factor;
}

Vector.prototype.scaleNew = function (factor) {
    return new Vector(this.x * factor, this.y * factor);
}

Vector.prototype.d2 = function () {
    return this.x * this.x + this.y * this.y;
}

function Graph(canvas_name, width, height) {
    this.svg = "http://www.w3.org/2000/svg";
    this.canvas = document.getElementById(canvas_name);
    this.width = width;
    this.height = height;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.vertices = {};
    this.forces = {};
    this.stepsize = 0.0005;
    this.iteration = 0;
    this.task = null;

    // tunables to adjust the layout
    this.repulsion = 50000; // repulsion constant, adjust for wider/narrower spacing
    this.spring_length = 5; // base resting length of springs
}

Graph.prototype.createVertex = function (name, colors, clickFn) { // XXX -- should support separate id and name
    // create an SVG rectangle, attach additional attributed to it
    var vertex = document.createElementNS(this.svg, "rect");
    if( colors === undefined ) {
        colors = { color: "#222", stroke: "#000" };
    }
    vertex.setAttribute("style", "fill: "+colors.color+"; stroke: "+colors.stroke+"; stroke-width: 1px;");
    vertex.setAttribute("rx", "10px"); // round the edges
    // random placement with a 10% margin at the edges
    vertex.pos = new Vector(
        Math.random() * (this.width * 0.8) + (this.width * 0.1),
        (Math.random() * (this.height * 0.8)) + (this.height * 0.1)
    );
    vertex.setAttribute("x", vertex.pos.x );
    vertex.setAttribute("y", vertex.pos.y );
    vertex.onclick = clickFn;
    vertex.edges = new Array();
    this.canvas.appendChild(vertex);

    // text label
    vertex.name = name;
    vertex.textLabel = document.createElementNS(this.svg, "text");
    vertex.textLabel.setAttribute("style", "fill: #555753; stroke-width: 1px;");
    vertex.textLabel.onclick = clickFn;
    vertex.textLabel.appendChild(document.createTextNode(name));
    this.canvas.appendChild( vertex.textLabel );

    // get the size of the rectangle from the text label's bounding box
    vertex.h = vertex.textLabel.getBBox().height + 10;
    vertex.w = vertex.textLabel.getBBox().width + 10;
    vertex.setAttribute("height", vertex.h + "px");
    vertex.setAttribute("width", vertex.w + "px");

    vertex.centerPos = function () {
        return new Vector(vertex.pos.x + vertex.w / 2,
                          vertex.pos.y + vertex.h / 2);
    };

    this.vertices[name] = vertex;
}

Graph.prototype.createEdge = function (a, b, style) {
    var line = document.createElementNS(this.svg, "path");
    if( style === undefined ) {
        style = "stroke: #444; stroke-width: 3px;";
    }
    line.setAttribute("style", style);
    this.canvas.insertBefore(line, this.canvas.firstChild);
    this.vertices[a].edges[b] = { "dest" : b, "line": line };
    this.vertices[b].edges[a] = { "dest" : a, "line": line };
}

Graph.prototype.go = function () {
    if (this.task) {
        return;
    }
    var obj = this;
    this.iteration = 0;
    this.task = window.setInterval(function () { obj.updateLayout(); }, 1);
}

Graph.prototype.updateLayout = function () {
    this.calculateForces();
    this.resolveCollisions();
    this.applyForces();
    this.updateScreen();
    this.iteration++;
    if (this.iteration > 300) {
        // XXX -- should watch for rest state, not just quit after N iterations
        this.quit();
    }
}

Graph.prototype.resolveCollisions = function () {
    //this.resolveCollisionsRectangular();
    this.resolveCollisionsCircular();
}

Graph.prototype.resolveCollisionsRectangular = function () {
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
                        this.vertices[i].pos.add(0, -kickDistance);
                        this.vertices[j].pos.add(0,  kickDistance);
                    } else {
                        this.vertices[i].pos.add(0,  kickDistance);
                        this.vertices[j].pos.add(0, -kickDistance);
                    }
                }
            }
        }
    }
}

Graph.prototype.resolveCollisionsCircular = function () {
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
                    this.forces[i].add(-1000*dx, -1000*dy);
                }
            }
        }
    }
}

Graph.prototype.getRectangle = function (i) {
    var v = this.vertices[i];
    return {
        x1: v.pos.x,
        y1: v.pos.y,
        x2: v.pos.x + v.w,
        y2: v.pos.y + v.h,
        w: v.w,
        h: v.h,
        cx: v.pos.x + v.w / 2,
        cy: v.pos.y + v.h / 2
    };
}

Graph.prototype.calculateForces = function () {
    for (i in this.vertices) {
        this.forces[i] = new Vector(0, 0);
        for (j in this.vertices) {
            if( i !== j ) {
                var deltaV = this.findClosestDistance(i, j);
                var d2 = deltaV.d2();

                // add some jitter if distance^2 is very small
                if( d2 < 0.01 ) {
                    deltaV = new Vector(
                        0.1 * Math.random() + 0.1,
                        0.1 * Math.random() + 0.1
                    );
                    d2 = deltaV.d2();
                }

                // Coulomb's law -- repulsion varies inversely with square of distance
                this.forces[i].addV(deltaV.scaleNew(-(this.repulsion / d2)));

                // spring force along edges, follows Hooke's law
                if( this.vertices[i].edges[j] ) {
                    var distance = Math.sqrt(d2);
                    this.forces[i].addV(deltaV.scaleNew(distance - this.spring_length));
                }
            }
        }
    }
}

Graph.prototype.findClosestDistance = function (i, j) {
    var iV = this.vertices[i].centerPos();
    var jV = this.vertices[j].centerPos();
    return jV.subVNew(iV);
//    var iPoints = this.getRectanglePointsForVertex(i);
//    var jPoints = this.getRectanglePointsForVertex(j);
//    var pointPairs = this.pairwiseCombineArrays(iPoints, jPoints);
//    return this.findClosestPairDistance(pointPairs);
}

Graph.prototype.getRectanglePointsForVertex = function (i) {
    var points = [];
    var vertex = this.vertices[i];
    var posx = vertex.pos.x;
    var posy = vertex.pos.y;
    var w = vertex.w;
    var h = vertex.h;
    var n = 6;
    for (var i=0; i<=n; i++) {
        var dx = i*w/n;
        points.push(new Vector(posx + dx, posy    ));
        points.push(new Vector(posx + dx, posy + h));
    }
    var m = 2;
    for (var i=0; i<=m; i++) {
        var dy = i*h/m;
        points.push(new Vector(posx    , posy + dy));
        points.push(new Vector(posx + w, posy + dy));
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

Graph.prototype.findClosestPairDistance = function (pointPairs) {
    var minDistance = null;
    for (var pair in pointPairs) {
        var diff = pointPairs[pair].p2.subVNew(pointPairs[pair].p1);
        if (minDistance === null || diff.d2() < minDistance.d2()) {
            minDistance = diff;
        }
    }
    return minDistance;
}

Graph.prototype.applyForces = function () {
    for (i in this.vertices) {
        this.vertices[i].pos.addV(this.forces[i].scaleNew(this.stepsize));
    }
}

Graph.prototype.updateScreen = function () {
    for (i in this.vertices) {
        this.vertices[i].setAttribute("x", this.vertices[i].pos.x );
        this.vertices[i].setAttribute("y", this.vertices[i].pos.y );
        // update labels
        this.vertices[i].textLabel.setAttribute("x", this.vertices[i].pos.x + 5 + "px");
        this.vertices[i].textLabel.setAttribute("y", this.vertices[i].pos.y + (2*this.vertices[i].h/3 )+ "px");
        // update edges
        for (j in this.vertices[i].edges) {
            this.vertices[i].edges[j].line.setAttribute("d", "M"+(this.vertices[i].pos.x+(this.vertices[i].w/2))+","+(this.vertices[i].pos.y+(this.vertices[i].h/2))+" L"+(this.vertices[this.vertices[i].edges[j].dest].pos.x+(this.vertices[this.vertices[i].edges[j].dest].w/2))+" "+(this.vertices[this.vertices[i].edges[j].dest].pos.y+(this.vertices[this.vertices[i].edges[j].dest].h/2)));
        }
    }
}

Graph.prototype.quit = function () {
    window.clearInterval(this.task);
    this.task = null;
}
