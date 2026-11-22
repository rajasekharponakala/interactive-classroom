// Small perspective renderer for low-poly classroom models, without WebGL.
window.G3 = (() => {
  const box = (x, y, z) => ({
    vertices: [[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],
    faces: [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]],
  });
  const solids = {
    Cube: box(1, 1, 1), Cuboid: box(1.45, .8, .65),
    Tetrahedron: { vertices: [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]], faces: [[0,1,2],[0,1,3],[0,2,3],[1,2,3]] },
    Octahedron: { vertices: [[1.5,0,0],[0,0,1.5],[-1.5,0,0],[0,0,-1.5],[0,1.5,0],[0,-1.5,0]],
      faces: [4,5].flatMap(p => [0,1,2,3].map(i => [i,(i+1)%4,p])) },
  };
  const pyramid = (height) => ({ vertices: [[-1,-height/2,-1],[1,-height/2,-1],[1,-height/2,1],[-1,-height/2,1],[0,height/2,0]],
    faces: [[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]] });
  const edges = ({faces}) => [...new Set(faces.flatMap(f => f.map((a,i) => [a,f[(i+1)%f.length]].sort().join(','))))].map(s => s.split(',').map(Number));
  // Base plus four hinged walls; the lid hinges on the far side of the north wall.
  function cubeNet(fold) {
    const a = fold * Math.PI/2, c = Math.cos(a), s = Math.sin(a);
    const square = (fn) => [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v]) => fn(u,v));
    const wall = (fn) => square((u,v) => fn(u, (v+1)*c, (v+1)*s));
    return [square((u,v) => [u,-1,v]),
      wall((u,d,h) => [u,h-1,-1-d]), wall((u,d,h) => [u,h-1,1+d]),
      wall((u,d,h) => [1+d,h-1,u]), wall((u,d,h) => [-1-d,h-1,u]),
      square((u,v) => [u,-1+2*s+(v+1)*Math.sin(2*a),-1-2*c-(v+1)*Math.cos(2*a)])];
  }
  function camera(yaw, pitch, distance, scale, orthographic = false) {
    const c = Math.cos(yaw), s = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return ([x,y,z]) => {
      const a = c*x + s*z, b = c*z - s*x;
      const depth = distance - (sp*y + cp*b), k = scale / (orthographic ? distance : depth);
      return [240 + a*k, 170 - (cp*y - sp*b)*k, depth, k];
    };
  }
  return { solids, box, pyramid, edges, camera, cubeNet };
})();
