"use strict";

function Mesh(ref) {
  this.polygons = [];
}

Mesh.prototype.pointInside = function(position) {
  let min = 100000000.0;
  let min_last = null;
  let min_poly = null;
  for (let n = 0; n<this.polygons.length; n++) {
    let result = this.polygons[n].pointDistance(position);
    if (min>Math.abs(result[0])) {
      min = Math.abs(result[0]);
      min_poly = n;
    }
  }

  let normal = this.polygons[min_poly].calculateNormal();
  let diff = this.polygons[min_poly].points[0].subVector3(position);
  if (normal.dotVector3(diff)<0) {
    return true;
  } else {
    return false;
  }
}

Mesh.prototype.polygonInside = function(polygon) {
  let inside = false;
  for (let n = 0; n<polygon.points.length; n++) {
    if (this.pointInside(polygon.points[n])) {
      inside = true;
      break;
    }
  }

  return inside;
}

Mesh.prototype.cutMesh = function(other, inside) {
  let left = this.polygons;
  for (let m = 0; m<other.polygons.length; m++) {
    let next = [];
    for (let n = 0; n<left.length; n++) {
      if (left[n].intersectingPolygonBoth(other.polygons[m])) {
        let normal = other.polygons[m].calculateNormal();
        let position = other.polygons[m].points[0];
        let polyLeft = left[n].splitByPlane(normal, position);
        let polyRight = left[n].splitByPlane(normal.mulScalar(-1), position);
        if (polyLeft) {
          next.push(polyLeft);
        }

        if (polyRight) {
          next.push(polyRight);
        }
      } else {
        next.push(left[n]);
      }
    }

    left = next;
  }

  let done = new Mesh();
  for (let n = 0; n<left.length; n++) {
    if (other.polygonInside(left[n])^inside) {
      done.polygons.push(left[n]);
    }
  }

  return done;
}

Mesh.prototype.splitByPlane = function(direction, position) {
  let mesh = new Mesh();
  for (let n = 0; n<this.polygons.length; n++) {
    let cutted = this.polygons[n].splitByPlane(direction, position);
    if (cutted) {
      mesh.polygons.push(cutted);
    }
  }

  return mesh;
}

Mesh.prototype.concatMesh = function(other) {
  let mesh = new Mesh();
  for (let n = 0; n<this.polygons.length; n++) {
    mesh.polygons.push(this.polygons[n]);
  }

  for (let n = 0; n<other.polygons.length; n++) {
    mesh.polygons.push(other.polygons[n]);
  }

  return mesh;
}

Mesh.prototype.invertNormals = function(other) {
  let mesh = new Mesh();
  for (let n = 0; n<this.polygons.length; n++) {
    mesh.polygons.push(this.polygons[n].invertNormals());
  }

  return mesh;
}

Mesh.prototype.createBox = function() {
  let mesh = new Mesh();
  mesh.polygons.push(polygonFromPoints(null, [new Vector3(-1, -1,  1), new Vector3(-1,  1,  1), new Vector3( 1,  1,  1), new Vector3( 1, -1,  1)]));
  mesh.polygons.push(polygonFromPoints(null, [new Vector3( 1, -1, -1), new Vector3( 1, -1,  1), new Vector3( 1,  1,  1), new Vector3( 1,  1, -1)]));
  mesh.polygons.push(polygonFromPoints(null, [new Vector3( 1, -1, -1), new Vector3( 1,  1, -1), new Vector3(-1,  1, -1), new Vector3(-1, -1, -1)]));
  mesh.polygons.push(polygonFromPoints(null, [new Vector3(-1,  1, -1), new Vector3(-1,  1,  1), new Vector3(-1, -1,  1), new Vector3(-1, -1, -1)]));
  mesh.polygons.push(polygonFromPoints(null, [new Vector3(-1, -1, -1), new Vector3(-1, -1,  1), new Vector3( 1, -1,  1), new Vector3( 1, -1, -1)]));
  mesh.polygons.push(polygonFromPoints(null, [new Vector3( 1,  1, -1), new Vector3( 1,  1,  1), new Vector3(-1,  1,  1), new Vector3(-1,  1, -1)]));
  return mesh;
}

Mesh.prototype.mulMatrix4 = function(matrix) {
  let mesh = new Mesh();
  for (let n = 0; n<this.polygons.length; n++) {
    mesh.polygons.push(this.polygons[n].mulMatrix4(matrix));
  }

  return mesh;
}
