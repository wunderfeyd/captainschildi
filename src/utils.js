"use strict";

function fetch_async(url, type) {
  return (new Resource()).fetch(url, type);
}

function Resource() {
  this.fetched = false;
  this.loaded = false;
  this.data = null;
  this.manager = null;
}

Resource.prototype.fetch = function(url, type) {
  this.fetched = false;
  this.loaded = false;
  this.data = null;
  let req = new XMLHttpRequest();
  req.open("GET", url, true);
  if (type!==null) {
    req.responseType = type;
  }

  req.onload = (function() {
    this.data = req.response;
    this.loaded = true;
    this.fetched = true;
    if (this.manager) {
      this.manager.fetched(this);
    }
  }).bind(this);

  req.onerror = (function() {
    this.loaded = false;
    this.fetched = true;
    if (this.manager) {
      this.manager.fetched(this);
    }
  }).bind(this)

  req.send(null);
  return this;
}

function ResourceManager() {
  this.resources = [];
  this.callback = null;
}

ResourceManager.prototype.add = function(resource) {
  this.resources.push(resource);
  resource.manager = this;
  if (resource.fetched) {
    this.fetched(this);
  }
}

ResourceManager.prototype.fetched = function(resource) {
  for (let n = 0; n<this.resources.length; n++) {
    if (this.resources[n]===resource) {
      this.resources.splice(n, 1);
      break;
    }
  }

  this.check();
}

ResourceManager.prototype.setCallback = function(callback) {
  this.callback = callback;
  this.check();
}

ResourceManager.prototype.check = function() {
  if (this.resources.length==0 && this.callback) {
    this.callback();
  }
}
