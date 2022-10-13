"use strict";

function BSP() {
  this.root = null;
}

BSP.prototype.fromMesh = function(mesh) {
  let copy = new Mesh();
  for (let n = 0; n<mesh.polygons.length; n++) {
    let poly = new Polygon(mesh.polygons[n]);
    for (let p = 0; p<mesh.polygons[n].points.length; p++) {
      poly.points.push(mesh.polygons[n].points[p]);
    }

    copy.polygons.push(poly);
  }

  this.root = BSP.prototype.splitMesh(copy, null);
  console.log(this.root);
}

BSP.prototype.planeCheck = function(mesh, normal, position, result, parent) {
  let check = parent;
  while (check!==null) {
    if (check[3].subVector3(normal).length()<mathEpsilon && Math.abs(position.subVector3(check[4]).dotVector3(normal))<mathEpsilon) {
      return result;
    }

    check = check[5];
  }

  let left = mesh.splitByPlane(normal, position);
  let right = mesh.splitByPlane(normal.mulScalar(-1), position);
  if (left.polygons.length!=0 && right.polygons.length!=0) {
    let diff = Math.abs(right.polygons.length-left.polygons.length)
    if (result[0]===null || diff<result[0]) {
      return [diff, normal, position];
    }
  }

  return result;
}

BSP.prototype.splitMesh = function(mesh, parent) {
  let result = [null, null, null];
  for (let n = 0; n<mesh.polygons.length; n++) {
    let normal = mesh.polygons[n].calculateNormal();

    {
      let position = mesh.polygons[n].points[0].addVector3(normal.mulScalar(0.001));
      result = this.planeCheck(mesh, normal, position, result, parent);
    }

    {
      let position = mesh.polygons[n].points[0].subVector3(normal.mulScalar(0.001));
      result = this.planeCheck(mesh, normal.mulScalar(-1), position, result, parent);
    }

    /*{
      let position = mesh.polygons[n].points[0];
      result = this.planeCheck(mesh, normal, position, result, parent);
    }*/

    for (let p0 = 0; p0<mesh.polygons[n].points.length; p0++) {
      let p1 = (p0+1)%mesh.polygons[n].points.length;
      let direction = mesh.polygons[n].points[p0].subVector3(mesh.polygons[n].points[p1]).normalize();
      let inside = direction.crossVector3(normal);
      result = this.planeCheck(mesh, inside, mesh.polygons[n].points[p0], result, parent);
    }
  }

  if (result[0]!==null) {
    let normal = result[1];
    let position = result[2];
    let left = mesh.splitByPlane(normal, position);
    let right = mesh.splitByPlane(normal.mulScalar(-1), position);

    //console.log("mindiff2", left.polygons.length, right.polygons.length);
    let node = [null, null, null, normal, position, parent];
    node[1] = this.splitMesh(left, node);
    node[2] = this.splitMesh(right, node);
    return node;
  } else {
    let innerUpdate = [];
    for (let n = 0; n<mesh.polygons.length; n++) {
      innerUpdate.push(mesh.polygons[n]);
    }

    return [innerUpdate, null, null, null, null, parent];
  }
}

BSP.prototype.trace = function(start, end) {
  //console.log("tracestart");
  let direction = end.subVector3(start).normalize();
  let stack = [[this.root, start, end]];
  while (stack.length>0) {
    let test = stack.shift();
    let node = test[0];
    let from = test[1];
    let to = test[2];
    if (node[0]!==null) {
      var bestPoly = null;
      var bestDist = null;
      for (let n = 0; n<node[0].length; n++) {
        let dist = node[0][n].intersectingLine(from, to);
        if (dist!==null && (bestDist===null || dist<bestDist)) {
          bestDist = dist;
          bestPoly = node[0][n];
        }
      }

      if (bestPoly!==null) {
        return bestPoly.ref;
      }

      continue;
    }

    let line = to.subVector3(from);
    let length = line.length();
    if (length<mathEpsilon) {
      //continue;
    }

    let fromDist = from.subVector3(node[4]).dotVector3(node[3]);
    let toDist = to.subVector3(node[4]).dotVector3(node[3]);
    if ((fromDist<0 && toDist>=0) || (fromDist>=0 && toDist<0)) {
      let hit = line.mulScalar(Math.abs(fromDist)/(Math.abs(fromDist)+Math.abs(toDist))).addVector3(from);
      let diff = hit.subVector3(node[4]).dotVector3(node[3]);
      if (diff>Math.abs(mathEpsilon)) {
        console.log("bla");
      }

      if (toDist<0) {
        stack.unshift([node[2], hit, to]);
      }

      if (toDist>=0) {
        stack.unshift([node[1], hit, to]);
      }

      if (fromDist<0) {
        stack.unshift([node[2], from, hit]);
      }

      if (fromDist>=0) {
        stack.unshift([node[1], from, hit]);
      }
    } else {
      if (toDist<0) {
        stack.unshift([node[2], from, to]);
      }

      if (toDist>=0) {
        stack.unshift([node[1], from, to]);
      }
    }
  }

  return null;
}
