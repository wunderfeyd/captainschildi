precision mediump float;

uniform sampler2D tex0;

varying vec3 vertex_world_position;
varying vec4 vertex_position;
varying vec2 vertex_texmap;
varying vec4 vertex_color;

void main() {
  /*float step = 1.0/256.0;
  vec2 pos = vec2(0, 0);
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  for (int n = 0; n<128; n++) {
    vec4 o = texture2D(tex0, pos);
    pos.x += step;
    //vec4 dir_point = texture2D(tex0, pos);
    pos.x += step;
    if (pos.x>=1.0) {
      pos.x = 0.0;
      pos.y += step;
    }

    vec3 sun = vec3(-100.0, -100.0, -100.0);
    o.x = ((o.x-0.5)*256.0)/100.0;
    o.y = ((o.y-0.5)*256.0)/100.0;
    o.z = ((o.z-0.5)*256.0)/100.0;
    o.w = (o.w*256.0)/100.0;

    //dir_point.x = (dir_point.x-0.5)*2.0;
    //dir_point.y = (dir_point.y-0.5)*2.0;
    //dir_point.z = (dir_point.z-0.5)*2.0;

    vec3 dir_point = normalize(o.xyz-vertex_world_position);
    float l = distance(sun, vertex_world_position);
    float dist0 = dot(dir_point.xyz, vertex_world_position-o.xyz);
    float dist1 = dot(dir_point.xyz, sun-o.xyz);

    if ((dist0<0.0 && dist1>0.0) || (dist0>0.0 && dist1<0.0)) {
      float dist_hit = abs(dist0)/(abs(dist0)+abs(dist1));
      vec3 hit = vertex_world_position+dir_point.xyz*dist_hit*l;

      if (distance(hit, o.xyz)<o.w) {
        gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
        break;
      }
    }
  }*/

  gl_FragColor = vec4(vertex_color.xyz*texture2D(tex0, vertex_texmap).xyz, 1.0);
}
