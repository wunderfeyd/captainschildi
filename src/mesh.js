"use strict";

function Mesh(ref) {
  this.polygons = [];
}

Mesh.prototype.pointInside = function(position) {
  let min = 100000000.0;
  let min_last = null;
  let min_polys = [];
  for (let n = 0; n<this.polygons.length; n++) {
    let result = this.polygons[n].pointDistance(position);
    let dist = Math.abs(result[0]);
    if (min>dist) {
      min = dist;
      min_polys = [n];
    } else if (min==dist) {
      min_polys.push(n);
    }
  }

  for (let n = 0; n<min_polys.length; n++) {
    let normal = this.polygons[min_polys[n]].calculateNormal();
    let diff = this.polygons[min_polys[n]].points[0].subVector3(position);
    if (normal.dotVector3(diff)<-mathEpsilon) {
      return true;
    }
  }

  return false;
}

Mesh.prototype.polygonInside = function(polygon) {
  for (let n = 0; n<polygon.points.length; n++) {
    if (this.pointInside(polygon.points[n])) {
      return true;
    }
  }

  return false;
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
        if (polyLeft) {
          next.push(polyLeft);
        }

        let polyRight = left[n].splitByPlane(normal.mulScalar(-1), position);
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

Mesh.prototype.gluePolygons = function() {
  let coords = {};
  let checklist = [];
  let left = [];
  let max = 0;
  for (let n = 0; n<this.polygons.length; n++) {
    left.push(this.polygons[n]);
    left[max].ref = max;
    max++;
  }

  let finished = {};
  let connected = false;

  /*for (let n = 0; n<max; n++) {
    for (let m = 0; m<max && !finished[n]; m++) {
      if (!finished[m] && m!=n) {
        let combined = left[n].combine(left[m]);

        if (combined!==null) {
          finished[n] = true;
          finished[m] = true;
          connected = true;

          left.push(combined);
          left[max].ref = max;
          max++;
          break;
        }
      }
    }
  }*/

  for (let n = 0; n<max; n++) {
    /* let q = 0;
    for (let m = 0; m<max; m++) {
      if (!finished[m]) {
        q++;
      }
    }

    console.log(n, max, max-n, "->", q);*/
    for (let m = 0; m<max && !finished[n]; m++) {
      if (!finished[m] && m!=n) {
        let combined = left[n].combineCut(left[m]);

        if (combined!==null) {
          finished[n] = true;
          finished[m] = true;
          connected = true;

          for (let c = 0; c<combined.length; c++) {
            left.push(combined[c]);
            left[max].ref = max;
            max++;
          }

          break;
        }
      }
    }
  }

  if (!connected) {
    return this;
  }

  let done = new Mesh();
  for (let n = 0; n<max; n++) {
    if (!finished[n]) {
      done.polygons.push(left[n]);
    }
  }

  return done;
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

Mesh.prototype.createSphere = function(segments_latitude, segments_longitude) {
  let mesh = new Mesh();
  for (let y0 = 0; y0<segments_latitude; y0++) {
    let y1 = y0+1;
    let width0 = Math.sin((y0/segments_latitude)*Math.PI);
    let width1 = Math.sin((y1/segments_latitude)*Math.PI);
    let yy0 = Math.cos((y0/segments_latitude)*Math.PI);
    let yy1 = Math.cos((y1/segments_latitude)*Math.PI);
    for (let x0 = 0; x0<segments_longitude; x0++) {
      let x1 = x0+1;
      let xx00 = Math.sin((x0/segments_longitude)*Math.PI*2)*width0;
      let xx01 = Math.sin((x1/segments_longitude)*Math.PI*2)*width0;
      let xx10 = Math.sin((x0/segments_longitude)*Math.PI*2)*width1;
      let xx11 = Math.sin((x1/segments_longitude)*Math.PI*2)*width1;
      let zz00 = Math.cos((x0/segments_longitude)*Math.PI*2)*width0;
      let zz01 = Math.cos((x1/segments_longitude)*Math.PI*2)*width0;
      let zz10 = Math.cos((x0/segments_longitude)*Math.PI*2)*width1;
      let zz11 = Math.cos((x1/segments_longitude)*Math.PI*2)*width1;

      if (y0==0) {
        mesh.polygons.push(polygonFromPoints(null, [new Vector3(xx00, yy0, zz00), new Vector3(xx11, yy1, zz11), new Vector3(xx10, yy1, zz10)]));
      } else if (y1==segments_latitude) {
        mesh.polygons.push(polygonFromPoints(null, [new Vector3(xx00, yy0, zz00), new Vector3(xx01, yy0, zz01), new Vector3(xx10, yy1, zz10)]));
      } else {
        mesh.polygons.push(polygonFromPoints(null, [new Vector3(xx00, yy0, zz00), new Vector3(xx01, yy0, zz01), new Vector3(xx11, yy1, zz11), new Vector3(xx10, yy1, zz10)]));
      }
    }
  }

  return mesh;
}

Mesh.prototype.mulMatrix4 = function(matrix) {
  let mesh = new Mesh();
  for (let n = 0; n<this.polygons.length; n++) {
    mesh.polygons.push(this.polygons[n].mulMatrix4(matrix));
  }

  return mesh;
}
