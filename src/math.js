"use strict";

const mathEpsilon = 0.0001
function Color(ic0 = 0.0, ic1 = 0.0, ic2 = 0.0, ic3 = 1.0) {
  this.c0 = ic0;
  this.c1 = ic1;
  this.c2 = ic2;
  this.c3 = ic3;
}

Color.prototype.mulScalar = function(scalar) {
  return new Color(this.c0*scalar, this.c1*scalar, this.c2*scalar);
}

Color.prototype.divScalar = function(scalar) {
  return new Color(this.c0/scalar, this.c1/scalar, this.c2/scalar);
}

Color.prototype.mulColor = function(other) {
  return new Color(this.c0*other.c0, this.c1*other.c1, this.c2*other.c2);
}

Color.prototype.addColor = function(other) {
  return new Color(this.c0+other.c0, this.c1+other.c1, this.c2+other.c2);
}

Color.prototype.intensity = function() {
  return Math.max(this.c0, this.c1, this.c2);
}

function Vector2(ic0 = 0.0, ic1 = 0.0) {
  this.c0 = ic0;
  this.c1 = ic1;
}

Vector2.prototype.addVector2 = function(other) {
  return new Vector2(this.c0+other.c0, this.c1+other.c1);
}

Vector2.prototype.subVector2 = function(other) {
  return new Vector2(this.c0-other.c0, this.c1-other.c1);
}

Vector2.prototype.equalVector2 = function(other) {
  return this.subVector2(other).length()<mathEpsilon;
}

Vector2.prototype.divScalar = function(scalar) {
  return new Vector2(this.c0/scalar, this.c1/scalar);
}

Vector2.prototype.mulScalar = function(scalar) {
  return new Vector2(this.c0*scalar, this.c1*scalar);
}

Vector2.prototype.mulVector2 = function(other) {
  return new Vector2(this.c0*other.c0, this.c1*other.c1);
}

Vector2.prototype.length = function() {
  return Math.sqrt(this.c0*this.c0+this.c1*this.c1);
}

Vector2.prototype.normalize = function() {
  let length = this.length();
  return new Vector2(this.c0/length, this.c1/length);
}

function Vector3 (ic0 = 0.0, ic1 = 0.0, ic2 = 0.0) {
  this.c0 = ic0;
  this.c1 = ic1;
  this.c2 = ic2;
}

Vector3.prototype.addVector3 = function(other) {
  return new Vector3(this.c0+other.c0, this.c1+other.c1, this.c2+other.c2);
}

Vector3.prototype.subVector3 = function(other) {
  return new Vector3(this.c0-other.c0, this.c1-other.c1, this.c2-other.c2);
}

Vector3.prototype.equalVector3 = function(other) {
  return this.subVector3(other).length()<mathEpsilon;
}

Vector3.prototype.divScalar = function(scalar) {
  return new Vector3(this.c0/scalar, this.c1/scalar, this.c2/scalar);
}

Vector3.prototype.mulScalar = function(scalar) {
  return new Vector3(this.c0*scalar, this.c1*scalar, this.c2*scalar);
}

Vector3.prototype.mulVector3 = function(other) {
  return new Vector3(this.c0*other.c0, this.c1*other.c1, this.c2*other.c2);
}

Vector3.prototype.length = function() {
  return Math.sqrt(this.c0*this.c0+this.c1*this.c1+this.c2*this.c2);
}

Vector3.prototype.normalize = function() {
  return this.divScalar(this.length());
}

Vector3.prototype.crossVector3 = function(other) {
  return new Vector3(this.c1*other.c2-this.c2*other.c1, this.c2*other.c0-this.c0*other.c2, this.c0*other.c1-this.c1*other.c0);
}

Vector3.prototype.dotVector3 = function(other) {
  return this.c0*other.c0+this.c1*other.c1+this.c2*other.c2;
}

Vector3.prototype.plane = function(s, t) {
  let rebase = new Vector3(this.c1, this.c2, this.c0);
  s = (rebase.crossVector3(this)).normalize();
  t = (s.crossVector3(this)).normalize();
  s = (t.crossVector3(this)).normalize();
}

Vector3.prototype.random = function() {
	let phi = randomFloat(0, 2.0*Math.PI);
  let ctheta = randomFloat(-1, 1);
  let stheta = Math.sin(Math.acos(ctheta));
  return new Vector3(stheta*Math.cos(phi), stheta*Math.sin(phi), ctheta);
}

function Vector4(ic0 = 0.0, ic1 = 0.0, ic2 = 0.0, ic3 = 0.0) {
  this.c0 = ic0;
  this.c1 = ic1;
  this.c2 = ic2;
  this.c3 = ic3;
}

Vector4.prototype.addVector4 = function(other) {
  return new Vector4(this.c0+other.c0, this.c1+other.c1, this.c2+other.c2, this.c3+other.c3);
}

Vector4.prototype.subVector4 = function(other) {
  return new Vector4(this.c0-other.c0, this.c1-other.c1, this.c2-other.c2, this.c3-other.c3);
}

Vector4.prototype.equalVector4 = function(other) {
  return this.subVector4(other).length()<mathEpsilon;
}

Vector4.prototype.divScalar = function(scalar) {
  return new Vector4(this.c0/scalar, this.c1/scalar, this.c2/scalar, this.c3/scalar);
}

Vector4.prototype.mulScalar = function(scalar) {
  return new Vector4(this.c0*scalar, this.c1*scalar, this.c2*scalar, this.c3*scalar);
}

Vector4.prototype.mulVector4 = function(other) {
  return new Vector4(this.c0*other.c0, this.c1*other.c1, this.c2*other.c2, this.c3*other.c3);
}

Vector4.prototype.length = function() {
  return Math.sqrt(this.c0*this.c0+this.c1*this.c1+this.c2*this.c2+this.c3*this.c3);
}

Vector4.prototype.normalize = function() {
  return this.divScalar(this.length());
}

Vector4.prototype.dotVector4 = function(other) {
  return this.c0*other.c0+this.c1*other.c1+this.c2*other.c2+this.c3*other.c3;
}

Vector4.prototype.dotVector3 = function(other) {
  return this.c0*other.c0+this.c1*other.c1+this.c2*other.c2+this.c3;
}

function Matrix3() {
  this.c0 = new Vector3();
  this.c1 = new Vector3();
  this.c2 = new Vector3();
}

Matrix3.prototype.identity = function() {
  let mat = new Matrix3();
  mat.c0 = new Vector3(1, 0, 0);
  mat.c1 = new Vector3(0, 1, 0);
  mat.c2 = new Vector3(0, 0, 1);
  return mat;
}

Matrix3.prototype.lookAt = function(position, center, up) {
  let direction = center.subVector3(position).normalize();
  let mat = new Matrix3();
  mat.c0 = (up.crossVector3(direction)).normalize();
  mat.c1 = mat.c0.crossVector3(direction);
  mat.c2 = direction;
  return mat;
}

Matrix3.prototype.mulVector3 = function(other) {
  return new Vector3(this.c0.dotVector3(other), this.c1.dotVector3(other), this.c2.dotVector3(other));
}

function Matrix4() {
  this.c0 = new Vector4();
  this.c1 = new Vector4();
  this.c2 = new Vector4();
  this.c3 = new Vector4();
}

Matrix4.prototype.identity = function() {
  let mat = new Matrix4();
  mat.c0 = new Vector4(1, 0, 0, 0);
  mat.c1 = new Vector4(0, 1, 0, 0);
  mat.c2 = new Vector4(0, 0, 1, 0);
  mat.c3 = new Vector4(0, 0, 0, 1);
  return mat;
}

Matrix4.prototype.lookAt = function(position, center, up) {
  let direction = center.subVector3(position).normalize();
  let cross = direction.crossVector3(up).normalize();
  let side = cross.crossVector3(direction);
  let mat = new Matrix4();
  mat.c0 = new Vector4(-cross.c0, -cross.c1, -cross.c2, cross.dotVector3(position));
  mat.c1 = new Vector4(-side.c0, -side.c1, -side.c2, side.dotVector3(position));
  mat.c2 = new Vector4(-direction.c0, -direction.c1, -direction.c2, direction.dotVector3(position));
  mat.c3 = new Vector4(0, 0, 0, 1);
  return mat;
}

Matrix4.prototype.transpose = function() {
  let mat = new Matrix4();
  mat.c0.c0 = this.c0.c0;
  mat.c1.c1 = this.c1.c1;
  mat.c2.c2 = this.c2.c2;
  mat.c3.c3 = this.c3.c3;

  mat.c0.c1 = this.c1.c0;
  mat.c0.c2 = this.c2.c0;
  mat.c0.c3 = this.c3.c0;

  mat.c1.c0 = this.c0.c1;
  mat.c1.c2 = this.c2.c1;
  mat.c1.c3 = this.c3.c1;

  mat.c2.c0 = this.c0.c2;
  mat.c2.c1 = this.c1.c2;
  mat.c2.c3 = this.c3.c2;

  mat.c3.c0 = this.c0.c3;
  mat.c3.c1 = this.c1.c3;
  mat.c3.c2 = this.c2.c3;

  return mat;
}

Matrix4.prototype.asArray = function() {
  return [
    this.c0.c0, this.c0.c1, this.c0.c2, this.c0.c3,
    this.c1.c0, this.c1.c1, this.c1.c2, this.c1.c3,
    this.c2.c0, this.c2.c1, this.c2.c2, this.c2.c3,
    this.c3.c0, this.c3.c1, this.c3.c2, this.c3.c3
  ];
}

Matrix4.prototype.asTransposedArray = function() {
  return [
    this.c0.c0, this.c1.c0, this.c2.c0, this.c3.c0,
    this.c0.c1, this.c1.c1, this.c2.c1, this.c3.c1,
    this.c0.c2, this.c1.c2, this.c2.c2, this.c3.c2,
    this.c0.c3, this.c1.c3, this.c2.c3, this.c3.c3
  ];
}

Matrix4.prototype.mulVector3 = function(v) {
  return new Vector3(this.c0.dotVector3(v), this.c1.dotVector3(v), this.c2.dotVector3(v));
}

Matrix4.prototype.mulVector4 = function(v) {
  return new Vector4(this.c0.dotVector3(v), this.c1.dotVector3(v), this.c2.dotVector3(v), this.c3.dotVector3(v));
}

Matrix4.prototype.mulMatrix4 = function(v) {
  let mat = new Matrix4();
  mat.c0.c0 = this.c0.c0*v.c0.c0+this.c0.c1*v.c1.c0+this.c0.c2*v.c2.c0+this.c0.c3*v.c3.c0;
  mat.c1.c0 = this.c1.c0*v.c0.c0+this.c1.c1*v.c1.c0+this.c1.c2*v.c2.c0+this.c1.c3*v.c3.c0;
  mat.c2.c0 = this.c2.c0*v.c0.c0+this.c2.c1*v.c1.c0+this.c2.c2*v.c2.c0+this.c2.c3*v.c3.c0;
  mat.c3.c0 = this.c3.c0*v.c0.c0+this.c3.c1*v.c1.c0+this.c3.c2*v.c2.c0+this.c3.c3*v.c3.c0;
  mat.c0.c1 = this.c0.c0*v.c0.c1+this.c0.c1*v.c1.c1+this.c0.c2*v.c2.c1+this.c0.c3*v.c3.c1;
  mat.c1.c1 = this.c1.c0*v.c0.c1+this.c1.c1*v.c1.c1+this.c1.c2*v.c2.c1+this.c1.c3*v.c3.c1;
  mat.c2.c1 = this.c2.c0*v.c0.c1+this.c2.c1*v.c1.c1+this.c2.c2*v.c2.c1+this.c2.c3*v.c3.c1;
  mat.c3.c1 = this.c3.c0*v.c0.c1+this.c3.c1*v.c1.c1+this.c3.c2*v.c2.c1+this.c3.c3*v.c3.c1;
  mat.c0.c2 = this.c0.c0*v.c0.c2+this.c0.c1*v.c1.c2+this.c0.c2*v.c2.c2+this.c0.c3*v.c3.c2;
  mat.c1.c2 = this.c1.c0*v.c0.c2+this.c1.c1*v.c1.c2+this.c1.c2*v.c2.c2+this.c1.c3*v.c3.c2;
  mat.c2.c2 = this.c2.c0*v.c0.c2+this.c2.c1*v.c1.c2+this.c2.c2*v.c2.c2+this.c2.c3*v.c3.c2;
  mat.c3.c2 = this.c3.c0*v.c0.c2+this.c3.c1*v.c1.c2+this.c3.c2*v.c2.c2+this.c3.c3*v.c3.c2;
  mat.c0.c3 = this.c0.c0*v.c0.c3+this.c0.c1*v.c1.c3+this.c0.c2*v.c2.c3+this.c0.c3*v.c3.c3;
  mat.c1.c3 = this.c1.c0*v.c0.c3+this.c1.c1*v.c1.c3+this.c1.c2*v.c2.c3+this.c1.c3*v.c3.c3;
  mat.c2.c3 = this.c2.c0*v.c0.c3+this.c2.c1*v.c1.c3+this.c2.c2*v.c2.c3+this.c2.c3*v.c3.c3;
  mat.c3.c3 = this.c3.c0*v.c0.c3+this.c3.c1*v.c1.c3+this.c3.c2*v.c2.c3+this.c3.c3*v.c3.c3;
  return mat;
}

Matrix4.prototype.frustum = function(left, right, top, bottom, near, far) {
  let mat = new Matrix4();
  mat.c0 = new Vector4(2.0*near/(right-left), 0, 0, 0);
  mat.c1 = new Vector4(0, 2.0*near/(bottom-top), 0, 0);
  mat.c2 = new Vector4((right+left)/(right-left), (bottom+top)/(bottom-top), (far+near)/(near-far), (2.0*far*near)/(near-far));
  mat.c3 = new Vector4(0, 0, -1.0, 1.0);
  return mat;
}

Matrix4.prototype.projection = function(fov, ratio, near, far, scale) {
  let height = 1.0/Math.tan(fov*Math.PI/360.0);
  let width = height*ratio;
  return this.frustum(-width*0.5, width*0.5, -height*0.5, height*0.5, near, far);
}

Matrix4.prototype.translateVector3 = function(offset) {
  let mat = new Matrix4();
  mat.c0 = new Vector4(this.c0.c0, this.c0.c1, this.c0.c2, this.c0.normalize().dotVector3(offset));
  mat.c1 = new Vector4(this.c1.c0, this.c1.c1, this.c1.c2, this.c1.normalize().dotVector3(offset));
  mat.c2 = new Vector4(this.c2.c0, this.c2.c1, this.c2.c2, this.c2.normalize().dotVector3(offset));
  mat.c3 = new Vector4(this.c3.c0, this.c3.c1, this.c3.c2, this.c3.c3);
  return mat;
}

Matrix4.prototype.scaleVector3 = function(scale) {
  let mat = new Matrix4();
  mat.c0 = new Vector4(this.c0.c0*scale.c0, this.c0.c1*scale.c0, this.c0.c2*scale.c0, this.c0.c3);
  mat.c1 = new Vector4(this.c1.c0*scale.c1, this.c1.c1*scale.c1, this.c1.c2*scale.c1, this.c1.c3);
  mat.c2 = new Vector4(this.c2.c0*scale.c2, this.c2.c1*scale.c2, this.c2.c2*scale.c2, this.c2.c3);
  mat.c3 = new Vector4(this.c3.c0, this.c3.c1, this.c3.c2, this.c3.c3);
  return mat;
}

Matrix4.prototype.rotate = function(angle, direction) {
  let mat = new Matrix4();
  let s = Math.sin(angle);
  let c = Math.cos(angle);
  return mat;
}

function Quaternion(ic0 = 0.0, ic1 = 0.0, ic2 = 0.0, ic3 = 0.0) {
  this.c0 = ic0;
  this.c1 = ic1;
  this.c2 = ic2;
  this.c3 = ic3;
}

Quaternion.prototype.rotationMatrix = function() {
  let mat = Matrix4.prototype.identity();
  let x2 = 2.0*this.c0;
  let y2 = 2.0*this.c1;
  let z2 = 2.0*this.c2;
  let ox2 = x2*this.c0;
  let oy2 = y2*this.c1;
  let oz2 = z2*this.c2;
  let oxy = x2*this.c1;
  let oxz = x2*this.c2;
  let oyz = y2*this.c2;
  let owx = x2*this.c3;
  let owy = y2*this.c3;
  let owz = z2*this.c3;

  mat.c0.c0 = 1.0-oy2-oz2;
  mat.c0.c1 = oxy-owz;
  mat.c0.c2 = oxz+owy;

  mat.c1.c0 = oxy+owz;
  mat.c1.c1 = 1.0-ox2-oz2;
  mat.c1.c2 = oyz-owx;

  mat.c2.c0 = oxz-owy;
  mat.c2.c1 = oyz+owx;
  mat.c2.c2 = 1.0-ox2-oy2;

  return mat;
/*      matrix.matrix[0].x = w*w+x*x-y*y-z*z;
      matrix.matrix[0].y = 2.0*x*y-2.0*w*z;
      matrix.matrix[0].z = 2.0*x*z+2.0*w*y;

      matrix.matrix[1].x = 2.0*x*y+2.0*w*z;
      matrix.matrix[1].y = w*w-x*x+y*y-z*z;
      matrix.matrix[1].z = 2.0*y*z-2.0*w*x;

      matrix.matrix[2].x = 2.0*x*z-2.0*w*y;
      matrix.matrix[2].y = 2.0*y*z+2.0*w*x;
      matrix.matrix[2].z = w*w-x*x-y*y+z*z;*/
}

Quaternion.prototype.rotateVector3 = function(v) {
  let out = new Vector3();
  let qv = new Vector3(this.c0, this.c1, this.c2);
  let uv = qv.crossVector3(v);
  let uuv = qv.crossVector3(uv);
  return v.addVector3(uv.mulScalar(w).addVector3(uuv).mulScalar(2.0));
}

Quaternion.prototype.divScalar = function(scalar) {
  return new Quaternion(this.c0/scalar, this.c1/scalar, this.c2/scalar, this.c3/scalar);
}

Quaternion.prototype.length = function() {
  return Math.sqrt(this.c0*this.c0+this.c1*this.c1+this.c2*this.c2+this.c3*this.c3);
}

Quaternion.prototype.normalize = function() {
  return this.divScalar(this.length());
}

let randomFloat = function(from, to) {
  let values = new Uint32Array(2);
  window.crypto.getRandomValues(values);
  let diff = to-from;
  let maxInt = 65536.0*65536.0;
  return ((values[0]+(values[1]/maxInt))/maxInt)*diff+from;
}

let fitNormals = [
  [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)],
  [new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0)],
  [new Vector3(0, 0, 1), new Vector3(1, 0, 0), new Vector3(0, 1, 0)],
  [new Vector3(-1, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, -1)],
  [new Vector3(0, -1, 0), new Vector3(0, 0, -1), new Vector3(-1, 0, 0)],
  [new Vector3(0, 0, -1), new Vector3(-1, 0, 0), new Vector3(0, -1, 0)]
];

let fitNormal = function(normal) {
  let best = null;
  let result = 0;
  for (let n = 0; n<fitNormals.length; n++) {
    let tmp = fitNormals[n][0].dotVector3(normal);
    if (tmp>result) {
      result = tmp;
      best = fitNormals[n];
    }
  }

  return best;
}
