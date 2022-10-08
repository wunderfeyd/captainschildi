precision mediump float;

attribute vec4 position;
attribute vec4 color;
attribute vec2 texmap;
uniform mat4 projection;
uniform mat4 model;

varying vec4 vertex_position;
varying vec4 vertex_color;
varying vec2 vertex_texmap;

void main() {
    vertex_position = projection*model*position;
    gl_Position = vertex_position;

    vertex_color = color;
    vertex_texmap = texmap;
}
