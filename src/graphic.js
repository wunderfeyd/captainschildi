"use strict";

function GraphicManager(canvas) {
  this.program1 = null;

  this.gl = canvas.getContext("webgl");
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
  for (let n = 0; n<10000; n++) {
    this.testColors.push(new Color(Math.random(), Math.random(), Math.random()));
  }

  {
    let mesh1 = Mesh.prototype.createBox();
    let mesh2 = Mesh.prototype.createSphere(16, 16);

    let matrix = Matrix4.prototype.identity();
    matrix = matrix.scaleVector3(new Vector3(2, 2, 2));

    matrix = matrix.translateVector3(new Vector3(0, 0, 0));
    mesh1 = mesh1.mulMatrix4(matrix);

    matrix = matrix.scaleVector3(new Vector3(1.25, 1.25, 1.25));
    matrix = matrix.translateVector3(new Vector3(0, 0, 0));
    mesh2 = mesh2.mulMatrix4(matrix);

    let meshx1 = mesh1.cutMesh(mesh2, false);
    let meshx2 = mesh2.cutMesh(mesh1, true).invertNormals();
    //let mesh = meshx1;
    let mesh = meshx1.concatMesh(meshx2);
    let all_poly = mesh.polygons.length;

    for (let n = 0; n<mesh.polygons.length; n++) {
      if (!Polygon.prototype.checkConvexPoints(mesh.polygons[n].points)) {
        console.log("non convex input");
      }
    }

    mesh = mesh.gluePolygons();
    let combined_poly = mesh.polygons.length;
    console.log(all_poly, combined_poly);

    this.mesh = mesh;
  }
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
  let camera = new Vector3(sx*5, 0, sz*5);
  let camerax = new Vector3(sx*4, 0, sz*4);
  let up = new Vector3(0, 1, 0);
  let to = new Vector3(-2, -2, -2);
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
        selected_poly = mesh.polygons[n].ref;
        min_dist = dist;
      }
    }

    if (selected_poly!=this.selected_poly) {
      this.selected_poly = selected_poly;
      console.log(selected_poly);
    }

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

    let triangles = [];
    for (let n = 0; n<mesh.polygons.length; n++) {
      let poly_tri = mesh.polygons[n].triangleFan();
      for (let m = 0; m<poly_tri.length; m++) {
        poly_tri[m].ref = mesh.polygons[n].ref;
      }

      triangles = triangles.concat(poly_tri);
    }

    let coords_js = [];
    let colors_js = [];

    for (let n = 0; n<triangles.length; n++) {
      let tri = triangles[n];
      coords_js.push(tri.points[0].c0, tri.points[0].c1, tri.points[0].c2);
      coords_js.push(tri.points[1].c0, tri.points[1].c1, tri.points[1].c2);
      coords_js.push(tri.points[2].c0, tri.points[2].c1, tri.points[2].c2);
      let intersecting = false; //polys[0].intersectingPolygonBoth(polys[1]);
      //let intersecting = polys[0].intersectingLine(new Vector3(0, 0, -5), new Vector3(0, 0, 10));

      let c = (n+1)/triangles.length;
      if (!intersecting) {
        let r = triangles[n].ref==null?0:this.testColors[triangles[n].ref].c0;
        let g = triangles[n].ref==null?0:this.testColors[triangles[n].ref].c1;
        let b = triangles[n].ref==null?0:this.testColors[triangles[n].ref].c2;
        if (triangles[n].ref==selected_poly) {
          r = 255;
          b = 255;
          g = 0;
        }

        if (triangles[n].ref==87 || triangles[n].ref==88) {
          if ((Math.floor(t*10)%2)==0) {
            r = 255;
            b = 255;
            g = 127;
          } else {
            r = 255;
            b = 255;
            g = 0;
          }
        }

        colors_js.push(r, g, b, 1);
        colors_js.push(r, g, b, 1);
        colors_js.push(r, g, b, 1);
      } else {
        colors_js.push(c, 0, c, 1);
        colors_js.push(c, 0, c, 1);
        colors_js.push(c, 0, c, 1);
      }
    }

    let coords = Float32Array.from(coords_js);
    let colors = Float32Array.from(colors_js);

    const bufferCoords = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferCoords);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, coords, this.gl.STATIC_DRAW);

    const bufferColors = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferColors);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);

    this.gl.useProgram(this.program1.id);
    //this.gl.enableVertexAttribArray(this.program1.location.color);
    //this.gl.Uniform1i(simple->locations[(size_t)shader::LOCATION::tex0], 0);
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

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.FRONT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, triangles.length*3);

    this.gl.deleteBuffer(bufferCoords);
    this.gl.deleteBuffer(bufferColors);
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
