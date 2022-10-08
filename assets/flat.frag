precision mediump float;

uniform sampler2D tex0;

varying vec2 vertex_texmap;
varying vec4 vertex_color;

void main() {
  vec4 color = texture2D(tex0, vertex_texmap);
  //gl_FragColor = vec4(vertex_color.x*color.x, vertex_color.y*color.y, vertex_color.z*color.z, 1.0);
  gl_FragColor = vec4(vertex_color.x, vertex_color.y, vertex_color.z, 1.0);
}
