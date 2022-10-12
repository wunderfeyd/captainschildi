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
      points.push(this.points[p0]);
    } else if (dist0>=0 || dist1>=0) {
      if (dist0>=0) {
        points.push(this.points[p0]);
      }

      let diff = Math.abs(dist0)+Math.abs(dist1);
      let interpolated = this.points[p1].subVector3(this.points[p0]).mulScalar(Math.abs(dist0)/diff).addVector3(this.points[p0]);
      points.push(interpolated);
      nocut = false;
    }
  }

  points = Polygon.prototype.simplifyPoints(points);

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
  return Polygon.prototype.calculateNormalPoints(this.points);
}

Polygon.prototype.calculateNormalPoints = function(points) {
  let dist0 = points[1].subVector3(points[0]).normalize();
  let dist1 = points[1].subVector3(points[2]).normalize();
  return dist0.crossVector3(dist1).normalize();
}


Polygon.prototype.intersectingLine = function(from, to) {
  let normal = this.calculateNormal();
  let dist0 = from.subVector3(this.points[0]).dotVector3(normal);
  let dist1 = to.subVector3(this.points[0]).dotVector3(normal);
  if ((dist0>=0 && dist1>=0) || (dist0<0 && dist1<0)) {
    return null;
  }

  let diff = Math.abs(dist0)+Math.abs(dist1);
  let interpolated = to.subVector3(from).mulScalar(Math.abs(dist0)/diff).addVector3(from);
  return this.pointOnPolygon(interpolated)?interpolated.subVector3(from).length():null;
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
    if (this.intersectingLine(other.points[p0], other.points[p1])!==null) {
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

Polygon.prototype.combine = function(other) {
  let normal = this.calculateNormal();
  if (normal.subVector3(other.calculateNormal()).length()<mathEpsilon) {
    for (let p0 = 0; p0<this.points.length; p0++) {
      let p1 = (p0+1)%this.points.length;
      for (let o0 = 0; o0<other.points.length; o0++) {
        let o1 = (o0+1)%other.points.length;
        if (this.points[p1].subVector3(other.points[o0]).length()<mathEpsilon && this.points[p0].subVector3(other.points[o1]).length()<mathEpsilon) {
          let points = [];
          for (let px = p1; px<=p0+(p1>p0?this.points.length:0); px++) {
            points.push(this.points[px%this.points.length]);
          }

          for (let ox = o1; ox<=o0+(o1>o0?other.points.length:0); ox++) {
            points.push(other.points[ox%other.points.length]);
          }

          points = Polygon.prototype.simplifyPoints(points);

          if (points.length<3) {
            return null;
          }

          if (!Polygon.prototype.checkConvexPoints(points)) {
            return null;
          }

          let poly = new Polygon(this.ref);
          poly.points = points;
          return poly;
        }
      }
    }
  }

  return null;
}

Polygon.prototype.simplifyPoints = function(points) {
  let corrected = [];
  corrected.push(points[0]);
  for (let p0 = 1; p0<points.length; p0++) {
    let p1 = (p0+1)%points.length;
    let cp0 = points[p0].subVector3(corrected[corrected.length-1]).length();
    let cp1 = points[p1].subVector3(corrected[corrected.length-1]).length();
    let p0p1 = points[p1].subVector3(points[p0]).length();
    if (cp0>0 && Math.abs(cp1-(cp0+p0p1))>mathEpsilon) {
      corrected.push(points[p0]);
    }
  }

  return corrected;
}

Polygon.prototype.checkConvexPoints = function(points) {
  let normal = Polygon.prototype.calculateNormalPoints(points);
  for (let p0 = 0; p0<points.length; p0++) {
    let p1 = (p0+1)%points.length;
    let direction = points[p0].subVector3(points[p1]).normalize();
    let inside = direction.crossVector3(normal);
    for (let c = 0; c<points.length; c++) {
      if (points[p0].subVector3(points[c]).dotVector3(inside)<-mathEpsilon) {
        return false;
      }
    }
  }

  return true;
}

Polygon.prototype.mulMatrix4 = function(matrix) {
  let poly = new Polygon(this.ref);
  for (let n = 0; n<this.points.length; n++) {
    poly.points.push(matrix.mulVector3(this.points[n]));
  }

  return poly;
}
