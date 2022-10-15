"use strict";

function BSP() {
  this.root = null;
  this.bspcheck = 0;
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

    let node = [null, null, null, normal, position, parent];
    node[0] = this.splitMesh(left, node);
    node[1] = this.splitMesh(right, node);
    return node;
  } else {
    let innerUpdate = [];
    for (let n = 0; n<mesh.polygons.length; n++) {
      innerUpdate.push(mesh.polygons[n].ref);
    }

    return [null, null, innerUpdate, null, null, parent];
  }
}

BSP.prototype.trace = function(start, end) {
  this.bspcheck++;
  //console.log("tracestart");
  let stack = [[this.root, start, end]];
  var bestPoly = null;
  var bestDist = null;
  while (stack.length>0) {
    let test = stack.shift();
    let node = test[0];
    let fromLeft = test[1];
    let fromRight = test[1];
    let toLeft = test[2];
    let toRight = test[2];
    if (node[2]!==null) {
      for (let n = 0; n<node[2].length; n++) {
        if (node[2][n].bspcheck===null || node[2][n].bspcheck!=this.bspcheck) {
          node[2][n].bspcheck = this.bspcheck;

          let dist = node[2][n].intersectingLine(start, end);
          if (dist!==null && (bestDist===null || dist<bestDist)) {
            bestDist = dist;
            bestPoly = node[2][n];
          }
        }
      }

      continue;
    }

    let line = toRight.subVector3(fromLeft);
    if (bestDist!=null) {
      let length = fromLeft.subVector3(start).length();
      if (length>bestDist+mathEpsilon) {
        continue;
      }
    }

    let fromDist = fromLeft.subVector3(node[4]).dotVector3(node[3]);
    let toDist = toRight.subVector3(node[4]).dotVector3(node[3]);
    let side = (fromDist<0)?1:0;
    let advance = false;
    if ((fromDist<0 && toDist>=0) || (fromDist>=0 && toDist<0)) {
      let hit = line.mulScalar((Math.abs(fromDist)/(Math.abs(fromDist)+Math.abs(toDist)))).addVector3(fromLeft);
      toLeft = hit;
      fromRight = hit;
      advance = true;
    }

    /*if ((fromDist>-mathEpsilon*64 && fromDist<mathEpsilon*64) || (toDist>-mathEpsilon*64 && toDist<mathEpsilon*64)) {
      advance = true;
    }*/

    if (advance) {
      stack.unshift([node[(side^1)], fromRight, toRight]);
    }

    stack.unshift([node[(side^0)], fromLeft, toLeft]);
  }

  if (bestPoly!==null) {
    return [bestPoly, bestDist];
  }

  return null;
}
