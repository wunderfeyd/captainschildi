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
GraphicManager.prototype.clear = function(color) {
  let w = canvas.width;
  let h = canvas.height;
  this.gl.viewport(0, 0, w, h);
  let t = performance.now()/1000;
  let sx = Math.sin(t);
  let sz = Math.cos(t);
  let camera = new Vector3(sx*100, 0, sz*100);
  let up = new Vector3(0, 1, 0);
  let to = new Vector3(0, 0, 0);
  let projection = Matrix4.prototype.projection(45, w/h, 1, 10000, 1);
  let modelView = Matrix4.prototype.lookAt(camera, to, up);

  this.gl.clearColor(0.0, 0.0, 1.0, 1.0);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  if (this.program1!=null) {
    let polys = [];
    {
      let poly = new Polygon(0);
      poly.points.push(new Vector3(-10.0, -10.0+Math.sin(t*0.25)*40, 0));
      poly.points.push(new Vector3(-10.0, 10.0+Math.sin(t*0.25)*40, 0));
      poly.points.push(new Vector3(10.0, 10.0+Math.sin(t*0.25)*40, 0));
      poly.points.push(new Vector3(10.0, -10.0+Math.sin(t*0.25)*40, 0));
      polys.push(poly);
    }

/*      {
      let poly = new Polygon(0);
      poly.points.push(new Vector3(-10.0, -10.0-Math.sin(t*0.25)*40, 0));
      poly.points.push(new Vector3(-10.0, 10.0-Math.sin(t*0.25)*40, 0));
      poly.points.push(new Vector3(10.0, 10.0-Math.sin(t*0.25)*40, 0));
      poly.points.push(new Vector3(10.0, -10.0-Math.sin(t*0.25)*40, 0));
      polys.push(poly);
    }*/

    {
      let poly = new Polygon(0);
      poly.points.push(new Vector3(-50.0, 20, -50.0));
      poly.points.push(new Vector3(-50.0, 20, 50.0));
      poly.points.push(new Vector3(50.0, 20, 50.0));
      poly.points.push(new Vector3(50.0, 20, -50.0));
      polys.push(poly);
    }

    {
      for (let q = -100; q<100; q+=16) {
        let cuts = [];
        for (let n = 0; n<polys.length; n++) {
          {
            let cutted = polys[n].splitByPlane(new Vector3(0, 1, 0), new Vector3(0, q, 0));
            if (cutted) {
              cuts.push(cutted);
            }
          }
          {
            let cutted = polys[n].splitByPlane(new Vector3(0, -1, 0), new Vector3(0, q, 0));
            if (cutted) {
              cuts.push(cutted);
            }
          }
        }
        polys = cuts;
      }

      for (let q = -100; q<100; q+=16) {
        let cuts = [];
        for (let n = 0; n<polys.length; n++) {
          {
            let cutted = polys[n].splitByPlane(new Vector3(1, 0, 0), new Vector3(q, 0, 0));
            if (cutted) {
              cuts.push(cutted);
            }
          }
          {
            let cutted = polys[n].splitByPlane(new Vector3(-1, 0, 0), new Vector3(q, 0, 0));
            if (cutted) {
              cuts.push(cutted);
            }
          }
        }
        polys = cuts;
      }

      for (let q = -100; q<100; q+=16) {
        let cuts = [];
        for (let n = 0; n<polys.length; n++) {
          {
            let cutted = polys[n].splitByPlane(new Vector3(0, 0, 1), new Vector3(0, 0, q));
            if (cutted) {
              cuts.push(cutted);
            }
          }
          {
            let cutted = polys[n].splitByPlane(new Vector3(0, 0, -1), new Vector3(0, 0, q));
            if (cutted) {
              cuts.push(cutted);
            }
          }
        }
        polys = cuts;
      }
    }

    let triangles = [];
    for (let n = 0; n<polys.length; n++) {
      let poly_tri = polys[n].triangleFan();
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
        colors_js.push(c, c, c, 1);
        colors_js.push(c, c, c, 1);
        colors_js.push(c, c, c, 1);
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
