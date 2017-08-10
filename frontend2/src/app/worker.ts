// Copyright 2017 duncan law (mrdunk@gmail.com)


declare function importScripts(...urls: string[]): void;

importScripts("wrap_terrain.js", "three.js");

class WorldTileWorker {
  private sealevel = 0.8;
  private heightMultiplier = 0.01;
  private terrainGenerator;

  constructor() {
    this.init();
  }

  public getNeighbours(faceIndexHigh: number,
                       faceIndexLow: number,
                       recursion: number) {
    const neighbours = [];
    const thisFace = this.terrainGenerator.getFaces(faceIndexHigh,
                                                    faceIndexLow,
                                                    recursion,
                                                    recursion);
    const face = thisFace.get(0);
    for(let n = 0; n < face.neighbours.size(); n++) {
      const neighbour = face.neighbours.get(n);
      neighbours.push([neighbour[0], neighbour[1]]);
    }
    face.delete();
    thisFace.delete();
    return neighbours;
  }

  public generateTerrain(faceIndexHigh: number,
                         faceIndexLow: number,
                         recursion: number,
                         requiredDepth: number) {
    console.log(faceIndexHigh,
                faceIndexLow,
                recursion,
                requiredDepth);

    const faces = this.terrainGenerator.getFaces(faceIndexHigh,
                                                 faceIndexLow,
                                                 recursion,
                                                 requiredDepth);
    const facesAndSkirt = this.terrainGenerator.getFacesAndSkirt(faces);

    // Finished generating faces so clear some memory.
    this.terrainGenerator.cleanCache(20000000);

    const vertices = new Float32Array(facesAndSkirt.size() * 3 * 3);
    const normals = new Float32Array(facesAndSkirt.size() * 3 * 3);
    const colors = new Uint8Array(facesAndSkirt.size() * 3 * 3);

    for(let i = 0; i < facesAndSkirt.size(); i++) {
      const componentFace = facesAndSkirt.get(i);
      for(let point=0; point<3; point++) {
        let height = componentFace.heights[point];
        if(height < 0) {
          height = 0;
        }
        const heightColor = height * 255 / 3;
        if(height >= this.sealevel) {
          colors[(i * 9) + (point * 3) + 0] = heightColor /2;
          colors[(i * 9) + (point * 3) + 1] = heightColor;
          colors[(i * 9) + (point * 3) + 2] = heightColor /2;
        } else {
          colors[(i * 9) + (point * 3) + 0] = heightColor /2;
          colors[(i * 9) + (point * 3) + 1] = heightColor /2;
          colors[(i * 9) + (point * 3) + 2] = heightColor;
        }

        if(height < this.sealevel) {
          height = this.sealevel;
        }
        for(let coord=0; coord<3; coord++) {
          vertices[(i * 9) + (point * 3) + coord] =
            componentFace.points[point][coord] *
            (1 + (height * this.heightMultiplier));
          // colors[(i * 9) + (point * 3) + coord] = Math.random() * 255;
        }
      }

      // Compute Vertex Normals as Face Normals.
      // (ie, all 3 vertex normals are the same.)
      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();
      vA.fromArray(componentFace.points[0]);
      vB.fromArray(componentFace.points[1]);
      vC.fromArray(componentFace.points[2]);
      vB.sub(vA);
      vC.sub(vA);
      vB.cross(vC);
      vB.normalize();
      for(let point=0; point<3; point++) {
        normals[(i * 9) + (point * 3) + 0] = vB.x;
        normals[(i * 9) + (point * 3) + 1] = vB.y;
        normals[(i * 9) + (point * 3) + 2] = vB.z;
      }

      componentFace.delete();
    }

    /*this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute("position",
                               new THREE.BufferAttribute(vertices, 3));
    this.geometry.addAttribute("color",
                               new THREE.BufferAttribute(colors, 3, true));
    this.geometry.addAttribute("normal",
                               new THREE.BufferAttribute(normals, 3, true));*/

    faces.delete();
    facesAndSkirt.delete();

    return [vertices, colors, normals];
  }

  private init() {
    try {
      this.terrainGenerator = new Module.DataSourceGenerate();
      this.terrainGenerator.MakeCache();
    } catch(err) {
      // Memory still in use from previous page load.
      // Wait a 5 seconds and re-load again.
      console.log(err);
      setTimeout(this.init, 5000);
      return;
    }
  }
}

let worldTileWorker = new WorldTileWorker();

let onconnect = (event) => {
  console.log("onconnect", event.ports);
  const port = event.ports[0];

  port.onmessage = (e) => {
    const workerResult = "Recieved: " + e.data[0];
    console.log(workerResult);
    // port.postMessage(workerResult);


    switch(e.data[0]) {
      case "rayCrossesFace":
        break;
      case "getNeighbours":
        break;
      case "generateTerrain":
        const geometry = worldTileWorker.generateTerrain(e.data[1],
                                                         e.data[2],
                                                         e.data[3],
                                                         e.data[4]);
        const neighbours = worldTileWorker.getNeighbours(e.data[1],
                                                         e.data[2],
                                                         e.data[3]);

        port.postMessage([e.data[1],
                         e.data[2],
                         e.data[3],
                         e.data[4],
                         geometry[0].buffer,
                         geometry[1].buffer,
                         geometry[2].buffer,
                         neighbours],
                         [geometry[0].buffer,
                          geometry[1].buffer,
                          geometry[2].buffer]);
        break;
    }
  };
};


