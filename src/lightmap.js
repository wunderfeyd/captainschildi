"use strict";

function Lightmap() {
}

Lightmap.prototype.updateMesh = function(mesh, atlas, lightmapScale, lightmapTextureSize) {
  this.luxelsArea = 0;
  this.luxels = [];
  this.emitters = [];
  for (let n = 0; n<mesh.polygons.length; n++) {
    let v = mesh.polygons[n];
    if (v.emitter) {
      this.emitters.push(v);
    }

    let normal = v.calculateNormal();
    let fit = fitNormal(normal);

    // fix lightmaps
    let extra = 100000.0;
    let minX = extra;
    let minY = extra;
    for (let p = 0; p<v.points.length; p++) {
      let p0 = v.points[p];
      let x = fit[1].dotVector3(p0)*lightmapScale;
      let y = fit[2].dotVector3(p0)*lightmapScale;
      minX = Math.min(x, minX);
      minY = Math.min(y, minY);
      p0.texmap = new Vector2(x, y);
    }

    // adjust to next pixel
    let frac = 1/lightmapTextureSize;
    minX = Math.floor(minX/frac)*frac;
    minY = Math.floor(minY/frac)*frac;
    let maxX = 0;
    let maxY = 0;
    for (let p = 0; p<v.points.length; p++) {
      let p0 = v.points[p];
      p0.texmap.c0 -= minX;
      p0.texmap.c1 -= minY;
      maxX = Math.max(p0.texmap.c0, maxX);
      maxY = Math.max(p0.texmap.c1, maxY);
      p0.texmap.c0 += frac;
      p0.texmap.c1 += frac;
    }

    maxX = Math.ceil(maxX/frac)+2;
    maxY = Math.ceil(maxY/frac)+2;
    v.lightmap = new Array();
    for (let fill = 0; fill<maxX*maxY; fill++) {
      v.lightmap.push([new Color(), 0, null, null, new Color()]);
    }

    v.lightmapNX = fit[1];
    v.lightmapNY = fit[2];
    v.lightmapX = -minX+frac;
    v.lightmapY = -minY+frac;
    v.lightmapWidth = maxX;
    v.lightmapHeight = maxY;

    let storage = atlas.allocate(maxX, maxY);
    v.lightmapXAtlas = storage[0];
    v.lightmapYAtlas = storage[1];

    this.chop(v, v, 0, 0, maxX, maxY, frac, lightmapScale, lightmapTextureSize);
  }

  console.log(this.luxels.length, this.luxelsArea);
}

Lightmap.prototype.chop = function(polygon, chopped, left, top, width, height, frac, lightmapScale, lightmapTextureSize) {
  if (width==1 && height==1) {
    let p = polygon.lightmapWidth*top+left;
    let scale = lightmapScale*lightmapTextureSize;
    scale *= scale;
    scale /= lightmapTextureSize;
    polygon.lightmap[p][1] = chopped.area()/scale;
    polygon.lightmap[p][2] = chopped.center();
    polygon.lightmap[p][3] = chopped;
    //console.log(polygon.lightmap[p][1]);
    this.luxelsArea += polygon.lightmap[p][1];
    this.luxels.push([polygon, polygon.lightmap[p]]);
    return;
  }

  let side = width>height;
  let chopLength = Math.floor((side?width:height)/2);
  let chopLeft = (side?width:height)-chopLength;
  let chopPos = chopLength+(side?left:top);
  let normal = (side?polygon.lightmapNX:polygon.lightmapNY);
  let cut = normal.mulScalar((chopPos*frac-(side?polygon.lightmapX:polygon.lightmapY))/lightmapScale);

  let side0 = chopped.splitByPlane(normal.mulScalar(-1), cut);
  let side1 = chopped.splitByPlane(normal, cut);

  if (side0) {
    if (side) {
      this.chop(polygon, side0, left, top, chopLength, height, frac, lightmapScale, lightmapTextureSize);
    } else {
      this.chop(polygon, side0, left, top, width, chopLength, frac, lightmapScale, lightmapTextureSize);
    }
  }

  if (side1) {
    if (side) {
      this.chop(polygon, side1, chopPos, top, chopLeft, height, frac, lightmapScale, lightmapTextureSize);
    } else {
      this.chop(polygon, side1, left, chopPos, width, chopLeft, frac, lightmapScale, lightmapTextureSize);
    }
  }
}

Lightmap.prototype.randomRay = function(bsp, lightmapScale, lightmapTextureSize) {
  let emitter = this.emitters[randomInt32(0, this.emitters.length)];
  let point = emitter.randomPoint();
  let normal = emitter.calculateNormal();
  this.raytrace(bsp, point, normal, lightmapScale, lightmapTextureSize, new Color(1.0, 1.0, 1.0), 0);
}

Lightmap.prototype.allRay = function(bsp, lightmapScale, lightmapTextureSize) {
  for (let n = 0; n<this.luxels.length; n++) {
    this.luxelRay(bsp, n, lightmapScale, lightmapTextureSize);
  }
}

Lightmap.prototype.luxelRay = function(bsp, id, lightmapScale, lightmapTextureSize) {
  let luxel = this.luxels[id];
  let polygon = luxel[0];
  let chopped = luxel[1][3];
  let point = chopped.randomPoint(); // luxel[1][2]; //
  let normal = polygon.calculateNormal();
  point = point.addVector3(normal.mulScalar(0.0001));

  let direction = Vector3.prototype.random();
  if (normal.dotVector3(direction)<0) {
    direction = direction.mulScalar(-1);
  }

  let destination = point.addVector3(direction.mulScalar(10000));
  let res = bsp.trace(point, destination);
  if (res!==null) {
    let polygon = res[0];
    let dist = res[1];
    let color = luxel[1][0];
    let scale = luxel[1][1];
    if (polygon.emitter) {
      color.c0 += 1; //scale;
      color.c1 += 1; //scale;
      color.c2 += 1; //scale;
    } else {
      // ambient
      let hit = point.addVector3(direction.mulScalar(dist));
      let frac = 1/lightmapTextureSize;
      let x = Math.floor((polygon.lightmapNX.dotVector3(hit)*lightmapScale+polygon.lightmapX)/frac);
      let y = Math.floor((polygon.lightmapNY.dotVector3(hit)*lightmapScale+polygon.lightmapY)/frac);
      x = Math.max(Math.min(polygon.lightmapWidth-1, x), 0);
      y = Math.max(Math.min(polygon.lightmapHeight-1, y), 0);
      let p = y*polygon.lightmapWidth+x;
      color.c0 += polygon.lightmap[p][4].c0;
      color.c1 += polygon.lightmap[p][4].c1;
      color.c2 += polygon.lightmap[p][4].c2;
    }
  }
}

Lightmap.prototype.raytrace = function(bsp, point, normal, lightmapScale, lightmapTextureSize, color, bounce) {
  if (bounce>2) {
    return;
  }

  point = point.addVector3(normal.mulScalar(0.0001));
  let direction = Vector3.prototype.random();
  if (normal.dotVector3(direction)<0) {
    direction = direction.mulScalar(-1);
  }

  let destination = point.addVector3(direction.mulScalar(10000));
  let res = bsp.trace(point, destination);
  if (res!==null) {
    let polygon = res[0];
    let dist = res[1];

    // ambient
    let hit = point.addVector3(direction.mulScalar(dist));
    let normal = polygon.calculateNormal();
    let frac = 1/lightmapTextureSize;
    let x = Math.floor((polygon.lightmapNX.dotVector3(hit)*lightmapScale+polygon.lightmapX)/frac);
    let y = Math.floor((polygon.lightmapNY.dotVector3(hit)*lightmapScale+polygon.lightmapY)/frac);
    x = Math.max(Math.min(polygon.lightmapWidth-1, x), 0);
    y = Math.max(Math.min(polygon.lightmapHeight-1, y), 0);
    let p = y*polygon.lightmapWidth+x;
    polygon.lightmap[p][0].c0 += color.c0/polygon.lightmap[p][1];
    polygon.lightmap[p][0].c1 += color.c1/polygon.lightmap[p][1];
    polygon.lightmap[p][0].c2 += color.c2/polygon.lightmap[p][1];

    this.raytrace(bsp, hit, normal, lightmapScale, lightmapTextureSize, color, bounce+1);
  }
}
