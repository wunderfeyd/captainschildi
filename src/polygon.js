"use strict";

function polygonFromPoints(ref, points) {
  let polygon = new Polygon(ref);
  polygon.points = points;
  return polygon;
}

function Polygon(ref) {
  this.points = [];
  this.ref = ref;
}

Polygon.prototype.splitByPlane = function(normal, position) {
  let points = [];
  let nocut = true;
  for (let p0 = 0; p0<this.points.length; p0++) {
    let p1 = (p0+1)%this.points.length;
    let dist0 = this.points[p0].subVector3(position).dotVector3(normal);
    let dist1 = this.points[p1].subVector3(position).dotVector3(normal);
    if (dist0>=0 && dist1>=0) {
      if (points.length==0 || points[points.length-1].subVector3(this.points[p0]).length()>0) {
        points.push(this.points[p0]);
      }
    } else if (dist0>=0 || dist1>=0) {
      if (dist0>=0) {
        if (points.length==0 || points[points.length-1].subVector3(this.points[p0]).length()>0) {
          points.push(this.points[p0]);
        }
      }

      let diff = Math.abs(dist0)+Math.abs(dist1);
      let interpolated = this.points[p1].subVector3(this.points[p0]).mulScalar(Math.abs(dist0)/diff).addVector3(this.points[p0]);
      if (points.length==0 || points[points.length-1].subVector3(interpolated).length()>0) {
        points.push(interpolated);
      }

      nocut = false;
    }
  }

  if (points.length<3) {
    return null;
  }

  if (nocut) {
    return this;
  }

  let poly = new Polygon(this.ref);
  poly.points = points;
  return poly;
}

Polygon.prototype.calculateNormal = function() {
  let dist0 = this.points[1].subVector3(this.points[0]).normalize();
  let dist1 = this.points[1].subVector3(this.points[2]).normalize();
  return dist0.crossVector3(dist1);
}

Polygon.prototype.intersectingLine = function(from, to) {
  let normal = this.calculateNormal();
  let dist0 = from.subVector3(this.points[0]).dotVector3(normal);
  let dist1 = to.subVector3(this.points[0]).dotVector3(normal);
  if ((dist0>=0 && dist1>=0) || (dist0<0 && dist1<0)) {
    return false;
  }

  let diff = Math.abs(dist0)+Math.abs(dist1);
  let interpolated = to.subVector3(from).mulScalar(Math.abs(dist0)/diff).addVector3(from);
  return this.pointOnPolygon(interpolated);
}

Polygon.prototype.pointOnPolygon = function(position) {
  let normal = this.calculateNormal();
  for (let p0 = 0; p0<this.points.length; p0++) {
    let p1 = (p0+1)%this.points.length;
    let direction = this.points[p1].subVector3(this.points[p0]).normalize();
    let inside = direction.crossVector3(normal);
    let dist = position.subVector3(this.points[p1]).dotVector3(inside);
    if (dist<0) {
      return false;
    }
  }

  return true;
}

Polygon.prototype.pointDistance = function(from) {
  let normal = this.calculateNormal();
  let dist = this.points[0].subVector3(from).dotVector3(normal);
  if (this.pointOnPolygon(from)) {
    return [dist, from.addVector3(normal.mulScalar(dist)), normal];
  }

  let min_dist = 10000000.0;
  let min_position = null;
  for (let p0 = 0; p0<this.points.length; p0++) {
    let p1 = (p0+1)%this.points.length;
    let length = this.points[p1].subVector3(this.points[p0]);
    let direction = length.normalize();
    length = length.length();
    let diff = from.subVector3(this.points[p0]);
    let linePos = diff.dotVector3(direction);
    if (linePos>=0 && linePos<length) {
      let inside = direction.crossVector3(normal);
      let planar = new Vector2(diff.dotVector3(inside), diff.dotVector3(normal));
      let dist = planar.length();
      if (dist<min_dist) {
        min_dist = dist;
        min_position = direction.mulScalar(linePos).addVector3(this.points[p0]);
      }
    }

    let dist = Math.abs(this.points[p0].subVector3(from).length());
    if (dist<min_dist) {
      min_dist = dist;
      min_position = this.points[p0];
    }
  }

  return [min_dist, min_position, normal];
}

Polygon.prototype.intersectingPolygon = function(other) {
  for (let p0 = 0; p0<other.points.length; p0++) {
    let p1 = (p0+1)%other.points.length;
    if (this.intersectingLine(other.points[p0], other.points[p1])) {
      return true;
    }
  }

  return false;
}

Polygon.prototype.intersectingPolygonBoth = function(other) {
  return this.intersectingPolygon(other) || other.intersectingPolygon(this);
}

Polygon.prototype.triangleFan = function() {
  let polygons = [];
  for (let p0 = 0; p0<this.points.length-2; p0++) {
    let p1 = p0+1;
    let triangle = new Polygon(this.ref);
    triangle.points.push(this.points[p0]);
    triangle.points.push(this.points[p1]);
    triangle.points.push(this.points[this.points.length-1]);
    polygons.push(triangle);
  }

  return polygons;
}

Polygon.prototype.invertNormals = function() {
  let poly = new Polygon(this.ref);
  for (let n = this.points.length-1; n>=0; n--) {
    poly.points.push(this.points[n]);
  }

  return poly;
}

Polygon.prototype.area = function() {
  let area = 0;
  let normal = this.calculateNormal();
  for (let p0 = 0; p0<this.points.length-2; p0++) {
    let p1 = p0+1;
    let g = this.points[p0].subVector3(this.points[p1]);
    let direction = g.normalize();
    let up = normal.crossVector3(direction);
    let h = this.points[this.points.length-1].subVector3(this.points[p0]).dotVector3(up);
    area += Math.abs(g.length()*h*0.5);
  }

  return area;
}

Polygon.prototype.mulMatrix4 = function(matrix) {
  let poly = new Polygon(this.ref);
  for (let n = 0; n<this.points.length; n++) {
    poly.points.push(matrix.mulVector3(this.points[n]));
  }

  return poly;
}
