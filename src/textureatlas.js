"use strict";

function TextureAtlas(width, height) {
  this.width = width;
  this.height = height;
  this.spans = new Array();
  for (let n = 0; n<this.height; n++) {
    this.spans.push([0, this.width]);
  }
}

TextureAtlas.prototype.allocate = function(width, height) {
  for (let n = 0; n<this.height-height; n++) {
    for (let m = 0; m<this.spans[n].length; m+=2) {
      let from = this.spans[n][m+0];
      let to = this.spans[n][m+1];
      if ((to-from)>=width) {
        let result = this.checkRectangle(from, to, n+1, width, height-1);
        if (result) {
          this.clipRectangle(result[0], result[1], n, width, height);
          return [result[0], n];
        }
      }
    }
  }

  return null;
}

TextureAtlas.prototype.checkRectangle = function(start, end, n, width, height) {
  if (height==0) {
    return [start, end];
  }

  for (let m = 0; m<this.spans[n].length; m+=2) {
    let from = this.spans[n][m+0];
    let to = this.spans[n][m+1];
    if (from<=start && to>=end && (to-from)>=width) {
      return this.checkRectangle(Math.max(from, start), Math.min(end, to), n+1, width, height-1);
    }
  }

  return null;
}

TextureAtlas.prototype.clipRectangle = function(start, end, n, width, height) {
  end = Math.min(end, start+width);
  while (height>0) {
    for (let m = 0; m<this.spans[n].length; m+=2) {
      let from = this.spans[n][m+0];
      let to = this.spans[n][m+1];
      if (from<=start && to>=end) {
        if (from!=start && to!=end) {
          this.spans[n][m+0] = from;
          this.spans[n][m+1] = start;
          this.spans[n].push(end);
          this.spans[n].push(to);
        } else if (from!=start) {
          this.spans[n][m+1] = start;
        } else if (to!=end) {
          this.spans[n][m+0] = end;
        } else {
          // this.spans[m+0] = this.spans[m+1];
          this.spans[n].splice(m, 2);
        }

        break;
      }
    }

    n++;
    height--;
  }

  return null;
}
