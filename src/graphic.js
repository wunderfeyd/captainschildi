"use strict";

function GraphicManager(canvas) {
  this.program1 = null;
  this.lightmapTextureSize = 512;
  this.lightmapScale = 1/(this.lightmapTextureSize/16);

  //this.lightmapTextureSize = 1024;
  //this.lightmapScale = 1/(this.lightmapTextureSize/16);
  this.textureAtlas = new TextureAtlas(this.lightmapTextureSize, this.lightmapTextureSize);
  this.bsp = new BSP();

  this.gl = canvas.getContext("webgl2", {antialias:false}); //, {antialias:true});
  if (this.gl===null) {
    console.log("no webgl");
    return;
  }

  let resman = new ResourceManager();
  let shader1Res = fetch_async("assets/flat.vert", "text");
  let shader2Res = fetch_async("assets/flat.frag", "text");
  resman.add(shader1Res);
  resman.add(shader2Res);
  resman.setCallback((function() {
    let shader1 = this.compileShader(shader1Res.data, this.gl.VERTEX_SHADER);
    let shader2 = this.compileShader(shader2Res.data, this.gl.FRAGMENT_SHADER);
    this.program1 = this.compileProgram([shader1, shader2]);
  }).bind(this));

  this.testColors = [];
  for (let n = 0; n<100000; n++) {
    this.testColors.push(new Color(Math.random(), Math.random(), Math.random()));
  }

  {
    let matrix;
    let mesh1 = Mesh.prototype.createBox();
    matrix = Matrix4.prototype.identity();
    matrix = matrix.scaleVector3(new Vector3(2, 1.5, 2));
    matrix = matrix.translateVector3(new Vector3(0, 0, 0));
    mesh1 = mesh1.mulMatrix4(matrix);

    let mesh2 = Mesh.prototype.createSphere(16, 16);
    matrix = matrix.scaleVector3(new Vector3(1.25, 1.25, 1.25));
    matrix = matrix.translateVector3(new Vector3(0, 0, 0));
    mesh2 = mesh2.mulMatrix4(matrix);

    let meshx1 = mesh1.cutMesh(mesh2, false);
    let meshx2 = mesh2.cutMesh(mesh1, true).invertNormals();

    let mesh3 = Mesh.prototype.createBox();
    matrix = Matrix4.prototype.identity();
    matrix = matrix.scaleVector3(new Vector3(5, 0.5, 5));
    matrix = matrix.translateVector3(new Vector3(0, 2.0, 0));
    mesh3 = mesh3.mulMatrix4(matrix);

    let meshSun = Mesh.prototype.createSphere(8, 8);
    matrix = Matrix4.prototype.identity();
    matrix = matrix.scaleVector3(new Vector3(1, 1, 1));
    matrix = matrix.translateVector3(new Vector3(0, -5.0, 0));
    meshSun = meshSun.mulMatrix4(matrix);
    for (let n = 0; n<meshSun.polygons.length; n++) {
      meshSun.polygons[n].emitter = true;
    }

    //let mesh = meshx1;
    let mesh = meshx1.concatMesh(meshx2);
    //let mesh = mesh1;
    mesh = mesh.concatCutMesh(mesh3);
    mesh = mesh.concatMesh(meshSun);
    //let mesh = mesh1.concatMesh(mesh3);
    //mesh = mesh3;

    let all_poly = mesh.polygons.length;

    for (let n = 0; n<mesh.polygons.length; n++) {
      if (!Polygon.prototype.checkConvexPoints(mesh.polygons[n].points)) {
        console.log("non convex input");
      }
    }

    mesh = mesh.gluePolygons();

    let combined_poly = mesh.polygons.length;
    console.log(all_poly, combined_poly);

    /*{
      for (let q = -2; q<2; q+=0.2) {
        {
          let meshLeft = mesh.splitByPlane(new Vector3(1, 0, 0), new Vector3(q, 0, 0));
          let meshRight = mesh.splitByPlane(new Vector3(-1, 0, 0), new Vector3(q, 0, 0));
          mesh = meshLeft.concatMesh(meshRight);
        }

        {
          let meshLeft = mesh.splitByPlane(new Vector3(0, 1, 0), new Vector3(0, q, 0));
          let meshRight = mesh.splitByPlane(new Vector3(0, -1, 0), new Vector3(0, q, 0));
          mesh = meshLeft.concatMesh(meshRight);
        }

        {
          let meshLeft = mesh.splitByPlane(new Vector3(0, 0, 1), new Vector3(0, 0, q));
          let meshRight = mesh.splitByPlane(new Vector3(0, 0, -1), new Vector3(0, 0, q));
          mesh = meshLeft.concatMesh(meshRight);
        }
      }
    }*/

    this.mesh = mesh;

/*    let mesh = new Mesh();
    {
      let poly = new Polygon(0);
      poly.points = [new Vector3(-1, -1.5, 0), new Vector3(0, -1.5, 0), new Vector3(0, 1.5, 0), new Vector3(-1, 1.5, 0)];
      mesh.polygons.push(poly);
    }
    {
      let poly = new Polygon(1);
      poly.points = [new Vector3(0, -2, 0), new Vector3(1, -2, 0), new Vector3(1, 2, 0), new Vector3(0, 2, 0)];
      mesh.polygons.push(poly);
    }

    mesh = mesh.gluePolygons();
    this.mesh = mesh;*/

    this.mesh.precalculateNormals();
    this.bsp.fromMesh(this.mesh);
    this.lightmap = new Lightmap();
    this.lightmap.updateMesh(this.mesh, this.textureAtlas, this.lightmapScale, this.lightmapTextureSize);

    this.triangles = new Mesh();
    for (let n = 0; n<mesh.polygons.length; n++) {
      let poly_tri = mesh.polygons[n].triangleFan();
      for (let m = 0; m<poly_tri.length; m++) {
        poly_tri[m].ref = mesh.polygons[n];
      }

      this.triangles.polygons = this.triangles.polygons.concat(poly_tri);
    }

    console.log(this.bsp.trace(new Vector3(0, -10, 0), new Vector3(0, 10, 0)));
  }

  this.radianceTex0 = this.gl.createTexture();
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.radianceTex0);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
  //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
  //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAX_LEVEL, 0);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
}

GraphicManager.prototype.pump = function() {
  window.requestAnimationFrame(this.pump.bind(this));
  if (this.callback) {
    this.callback(performance.now()/1000);
  }
}

GraphicManager.prototype.setCallback = function(callback) {
  this.callback = callback;
}

// Testing
GraphicManager.prototype.clear = function(color, mouseX, mouseY) {
  let w = canvas.width;
  let h = canvas.height;
  this.gl.viewport(0, 0, w, h);
  let t = performance.now()/10000;
  let sx = Math.sin(t);
  let sz = Math.cos(t);
  let ssx = Math.sin(-t);
  let ssz = Math.cos(-t);
  let camera = new Vector3(sx*5, -1, sz*5);
  let camerax = new Vector3(sx*4, 0, sz*4);
  let up = new Vector3(0, 1, 0);
  let to = new Vector3(0, 0, 0);
  let projection = Matrix4.prototype.projection(45, w/h, 1, 10000, 1);
  let modelView = Matrix4.prototype.lookAt(camera, to, up);
  let rayView = Matrix4.prototype.lookAt(camera.subVector3(to), new Vector3(), up);
  rayView.c0.c3 = 0;
  rayView.c1.c3 = 0;
  rayView.c2.c3 = 0;

  this.gl.clearColor(0.0, 0.0, 1.0, 1.0);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  if (this.program1!=null) {
    let mesh = this.mesh;

    let ray_end;
    let ray_start;
    let ray_test;

    {
      let mz = 10000;
      let mx = ((mouseX-w*0.5)/w)/((projection.c0.c0*0.5)/(1.0+mz));
      let my = ((mouseY-h*0.5)/h)/((projection.c1.c1*-0.5)/(1.0+mz));
      ray_end = camera.addVector3(rayView.c2.mulScalar(-mz)).addVector3(rayView.c0.mulScalar(mx)).addVector3(rayView.c1.mulScalar(my));
    }

    {
      ray_start = camera.addVector3(rayView.c2.mulScalar(1.0));
      ray_test = camera.addVector3(rayView.c2.mulScalar(-1.0));
    }

    let selected_poly = null;
    let min_dist = 100000.0;
    for (let n = 0; n<mesh.polygons.length; n++) {
      let dist = mesh.polygons[n].intersectingLine(ray_start, ray_end);
      if (dist!==null && dist<min_dist) {
        selected_poly = mesh.polygons[n];
        min_dist = dist;
      }
    }

    if (selected_poly!=this.selected_poly) {
      this.selected_poly = selected_poly;
      console.log(selected_poly);
    }

    /*for (let rays = 0; rays<10000; rays++) {
      let lightsrc = new Vector3(0, -4, 0);
      let direction = Vector3.prototype.random();
      let lightdest = lightsrc.addVector3(direction.mulScalar(10000));
      let minDist = null;
      let minPoly = null;
      let bspres = this.bsp.trace(lightsrc, lightdest);
      if (bspres!==null) {
        minPoly = bspres[0];
        minDist = bspres[1];
      }

      //for (let n = 0; n<mesh.polygons.length; n++) {
      //let dist = mesh.polygons[n].intersectingLine(lightsrc, lightdest);
      //if (dist!==null && (minDist===null || dist<minDist)) {
      //  minPoly = mesh.polygons[n];
      //  minDist = dist;
      //}
      //}

      if (minPoly) {
        let hit = lightsrc.addVector3(direction.mulScalar(minDist));
        let frac = 1/this.lightmapTextureSize;
        let x = Math.floor((minPoly.lightmapNX.dotVector3(hit)*this.lightmapScale+minPoly.lightmapX)/frac);
        let y = Math.floor((minPoly.lightmapNY.dotVector3(hit)*this.lightmapScale+minPoly.lightmapY)/frac);
        x = Math.max(Math.min(minPoly.lightmapWidth-1, x), 0);
        y = Math.max(Math.min(minPoly.lightmapHeight-1, y), 0);
        let p = y*minPoly.lightmapWidth+x;
        minPoly.lightmap[p][0].c0 += 0.1;
        minPoly.lightmap[p][0].c1 += 0.1;
        minPoly.lightmap[p][0].c2 += 0.1;
      }
    }*/

    let timer = performance.now();
    for (let rays = 0; rays<10000; rays++) {
      this.lightmap.randomRay(this.bsp, this.lightmapScale, this.lightmapTextureSize);
    }

    console.log(performance.now()-timer);
    //this.lightmap.allRay(this.bsp);

    let mesh1 = Mesh.prototype.createSphere(8, 8);
    let matrix = Matrix4.prototype.identity();
    matrix = matrix.scaleVector3(new Vector3(0.25, 0.25, 0.25));
    matrix = matrix.translateVector3(to);
    mesh1 = mesh1.mulMatrix4(matrix);

    mesh = mesh.concatMesh(mesh1);

    //console.log(ray);

    //let mesh = meshx1;
    //let mesh = mesh1.concatMesh(mesh2);

    /*
    // Polygon distance test

    let q = performance.now()/1000;
    let qx = Math.sin(q*3.3);
    let qz = Math.cos(q);

    let mesh = new Mesh();
    mesh.polygons.push(polygonFromPoints(null, [new Vector3(-1, -1,  0), new Vector3(-1,  1,  0), new Vector3( 1,  1,  0), new Vector3( 1, -1,  0)]));
    mesh.polygons.push(polygonFromPoints(null, [new Vector3( 1, -1,  0), new Vector3( 1,  1,  0), new Vector3(-1,  1,  0), new Vector3(-1, -1,  0)]));
    //let mesh = Mesh.prototype.createBox();

    let matrix = Matrix4.prototype.identity();
    matrix = matrix.scaleVector3(new Vector3(50, 50, 50));
    matrix = matrix.translateVector3(new Vector3(0, 0, 0));
    mesh = mesh.mulMatrix4(matrix);

    let origin = new Vector3(qx*100, qz*100, -20);
    let meshp = Mesh.prototype.createBox();
    let matrixp = Matrix4.prototype.identity();
    matrixp = matrixp.scaleVector3(new Vector3(5, 5, 5));
    matrixp = matrixp.translateVector3(origin);
    meshp = meshp.mulMatrix4(matrixp);

    let result = mesh.polygons[0].pointDistance(origin);

    let meshx = Mesh.prototype.createBox();
    let matrixx = Matrix4.prototype.identity();
    matrixx = matrixx.scaleVector3(new Vector3(5, 5, 5));
    matrixx = matrixx.translateVector3(result[1]);
    meshx = meshx.mulMatrix4(matrixx);

    mesh = mesh.concatMesh(meshp);
    mesh = mesh.concatMesh(meshx);
    */

    /*{
      for (let q = -100; q<100; q+=50) {
        {
          let meshLeft = mesh.splitByPlane(new Vector3(1, 0, 0), new Vector3(q, 0, 0));
          let meshRight = mesh.splitByPlane(new Vector3(-1, 0, 0), new Vector3(q, 0, 0));
          mesh = meshLeft.concatMesh(meshRight);
        }

        {
          let meshLeft = mesh.splitByPlane(new Vector3(0, 1, 0), new Vector3(0, q, 0));
          let meshRight = mesh.splitByPlane(new Vector3(0, -1, 0), new Vector3(0, q, 0));
          mesh = meshLeft.concatMesh(meshRight);
        }

        {
          let meshLeft = mesh.splitByPlane(new Vector3(0, 0, 1), new Vector3(0, 0, q));
          let meshRight = mesh.splitByPlane(new Vector3(0, 0, -1), new Vector3(0, 0, q));
          mesh = meshLeft.concatMesh(meshRight);
        }
      }
    }*/

    let coords_js = [];
    let colors_js = [];
    let texmaps_js = [];

    for (let n = 0; n<this.triangles.polygons.length; n++) {
      let tri = this.triangles.polygons[n];
      coords_js.push(tri.points[0].c0, tri.points[0].c1, tri.points[0].c2);
      coords_js.push(tri.points[1].c0, tri.points[1].c1, tri.points[1].c2);
      coords_js.push(tri.points[2].c0, tri.points[2].c1, tri.points[2].c2);

      let r = 1.0; //this.triangles.polygons[n].ref==null?0:this.testColors[this.triangles.polygons[n].ref].c0;
      let g = 1.0; //this.triangles.polygons[n].ref==null?0:this.testColors[this.triangles.polygons[n].ref].c1;
      let b = 1.0; //this.triangles.polygons[n].ref==null?0:this.testColors[this.triangles.polygons[n].ref].c2;
      if (tri.ref===selected_poly) {
        r = 1.0;
        b = 1.0;
        g = 0;
      }

      for (let k = 0; k<tri.points.length; k++) {
        colors_js.push(r, g, b, 1);

        if (tri.points[k].texmap!==null) {
          texmaps_js.push(tri.points[k].texmap.c0+tri.ref.lightmapXAtlas/this.lightmapTextureSize, tri.points[k].texmap.c1+tri.ref.lightmapYAtlas/this.lightmapTextureSize);
        } else {
          texmaps_js.push(0, 0);
        }
      }
    }

    let coords = Float32Array.from(coords_js);
    let colors = Float32Array.from(colors_js);
    let texmaps = Float32Array.from(texmaps_js);

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.radianceTex0);
    let pixels_js = [];
    for (let y = 0; y<this.lightmapTextureSize; y++) {
      for (let x = 0; x<this.lightmapTextureSize; x++) {
        let c = ((x^y)&1)*255;
        pixels_js.push(255, 255, 255, 255);
      }
    }

    let scaleColor = 0;
    let scaleColors = 0;
    for (let n = 0; n<mesh.polygons.length; n++) {
      let v = mesh.polygons[n];
      if (v.lightmap) {
        let q = 0;
        for (let y = 0; y<v.lightmapHeight; y++) {
          for (let x = 0; x<v.lightmapWidth; x++) {
            if (v.lightmap[q][2]!==null) {
              scaleColor += v.lightmap[q][0].c0+v.lightmap[q][0].c1+v.lightmap[q][0].c2;
              scaleColors++;
            }

            q++;
          }
        }
      }
    }

    if (scaleColor>0) {
      scaleColor = 1/(scaleColor/(scaleColors/8));
      // console.log(scaleColor);

      for (let n = 0; n<mesh.polygons.length; n++) {
        let v = mesh.polygons[n];
        if (v.lightmap) {
          let q = 0;
          for (let y = 0; y<v.lightmapHeight; y++) {
            let p = ((y+v.lightmapYAtlas)*this.lightmapTextureSize+v.lightmapXAtlas)*4;
            for (let x = 0; x<v.lightmapWidth; x++) {
              let cr = 0;
              let cg = 0;
              let cb = 0;
              let m = 1;

              if (v.lightmap[q][2]===null) {
                for (let yy = -1; yy<=1; yy++) {
                  if (yy+y>=0 && yy+y<v.lightmapHeight) {
                    for (let xx = -1; xx<=1; xx++) {
                      if (xx+x>=0 && xx+x<v.lightmapWidth) {
                        let qq = q+yy*v.lightmapWidth+xx;
                        cr += v.lightmap[qq][0].c0;
                        cg += v.lightmap[qq][0].c1;
                        cb += v.lightmap[qq][0].c2;
                        m++;
                      }
                    }
                  }
                }

                //cr = 1024;
              } else {
                cr += v.lightmap[q][0].c0;
                cg += v.lightmap[q][0].c1;
                cb += v.lightmap[q][0].c2;
              }

              v.lightmap[q][4].c0 = (cr/m)*scaleColor;
              v.lightmap[q][4].c1 = (cr/m)*scaleColor;
              v.lightmap[q][4].c2 = (cr/m)*scaleColor;
              pixels_js[p+0] = Math.min(v.lightmap[q][4].c0, 1)*255;
              pixels_js[p+1] = Math.min(v.lightmap[q][4].c1, 1)*255;
              pixels_js[p+2] = Math.min(v.lightmap[q][4].c2, 1)*255;

              p+=4;
              q++;
            }
          }
        }
      }
    }

    let pixels = Uint8Array.from(pixels_js);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.lightmapTextureSize, this.lightmapTextureSize, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels, 0);

    const bufferCoords = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferCoords);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, coords, this.gl.STATIC_DRAW);

    const bufferColors = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferColors);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);

    const bufferTexmaps = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferTexmaps);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texmaps, this.gl.STATIC_DRAW);

    this.gl.useProgram(this.program1.id);
    //this.gl.enableVertexAttribArray(this.program1.location.color);
    this.gl.uniform1i(this.program1.location.tex0, 0);
    this.gl.uniformMatrix4fv(this.program1.location.projection, false, projection.asTransposedArray());
    this.gl.uniformMatrix4fv(this.program1.location.model, false, modelView.asTransposedArray());
    //this.gl.enableVertexAttribArray(this.program1.location.color);
    //this.gl.enableVertexAttribArray(this.program1.location.texmap);

    this.gl.enableVertexAttribArray(this.program1.location.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferCoords);
    this.gl.vertexAttribPointer(this.program1.location.position, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.enableVertexAttribArray(this.program1.location.color);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferColors);
    this.gl.vertexAttribPointer(this.program1.location.color, 4, this.gl.FLOAT, false, 0, 0);

    this.gl.enableVertexAttribArray(this.program1.location.texmap);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferTexmaps);
    this.gl.vertexAttribPointer(this.program1.location.texmap, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.radianceTex0);

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.FRONT);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangles.polygons.length*3);

    this.gl.deleteBuffer(bufferCoords);
    this.gl.deleteBuffer(bufferColors);
    this.gl.deleteBuffer(bufferTexmaps);
  }
}

GraphicManager.prototype.compileShader = function(text, type) {
  let shader = this.gl.createShader(type);
  this.gl.shaderSource(shader, text);
  this.gl.compileShader(shader);
  if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
    const message = this.gl.getShaderInfoLog(shader);
    console.log("Shader compilation error: "+message);
    this.gl.deleteShader(shader);
    shader = null;
  }

  return shader;
}

GraphicManager.prototype.compileProgram = function(shaders) {
  let program = {};
  program.id = this.gl.createProgram();
  for (let n = 0; n<shaders.length; n++) {
    if (shaders[n]!==null) {
      this.gl.attachShader(program.id, shaders[n]);
    }
  }

  this.gl.linkProgram(program.id);
  if (!this.gl.getProgramParameter(program.id, this.gl.LINK_STATUS)) {
    const message = this.gl.getProgramInfoLog(program.id);
    console.log("Program link error: "+message);
    this.gl.deleteProgram(program.id);
    program = null;
  } else {
    this.gl.useProgram(program.id);
    program.location = {};
    program.location.projection = this.gl.getUniformLocation(program.id, "projection");
    program.location.model = this.gl.getUniformLocation(program.id, "model");
    program.location.tex0 = this.gl.getUniformLocation(program.id, "tex0");
    program.location.position = this.gl.getAttribLocation(program.id, "position");
    program.location.color = this.gl.getAttribLocation(program.id, "color");
    program.location.texmap = this.gl.getAttribLocation(program.id, "texmap");
    this.gl.useProgram(null);
  }

  return program;
}
