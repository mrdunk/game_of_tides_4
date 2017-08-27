// Copyright 2017 duncan law (mrdunk@gmail.com)


declare function importScripts(...urls: string[]): void;

importScripts("wrap_terrain.js", "three.js");

class WorldTileWorker {
  private sealevel = 0.001;  // Ratio of planets diameter.
  private heightMultiplier = 2;
  private terrainGenerator;

  constructor() {
    this.init();
  }

  public getNeighbours(faceIndexHigh: number,
                       faceIndexLow: number,
                       recursion: number) {
    const neighbours: IGenerateTileTask[] = [];
    const thisFace = this.terrainGenerator.getFaces(faceIndexHigh,
                                                    faceIndexLow,
                                                    recursion,
                                                    recursion);
    const face = thisFace.get(0);
    for(let n = 0; n < face.neighbours.size(); n++) {
      const neighbour = face.neighbours.get(n);
      neighbours.push({indexHigh: neighbour[0],
                       indexLow: neighbour[1],
                       recursion});
    }
    face.delete();
    thisFace.delete();
    return neighbours;
  }

  public generateTerrain(faceIndexHigh: number,
                         faceIndexLow: number,
                         recursion: number,
                         requiredDepth: number,
                         skirt: boolean) {
    /* console.log(faceIndexHigh,
                faceIndexLow,
                recursion,
                requiredDepth);*/

    const faces = this.terrainGenerator.getFaces(faceIndexHigh,
                                                 faceIndexLow,
                                                 recursion,
                                                 requiredDepth);
    let facesAndSkirt = faces;
    if(skirt) {
      facesAndSkirt = this.terrainGenerator.getFacesAndSkirt(faces);
    }

    // Finished generating faces so clear some memory.
    this.terrainGenerator.cleanCache(40000000);

    const vertices = new Float32Array(facesAndSkirt.size() * 3 * 3);
    const normals = new Float32Array(facesAndSkirt.size() * 3 * 3);
    const colors = new Uint8Array(facesAndSkirt.size() * 3 * 3);

    for(let i = 0; i < facesAndSkirt.size(); i++) {
      const componentFace = facesAndSkirt.get(i);
      let isLand = 0;
      for(let point=0; point<3; point++) {
        const height = componentFace.heights[point];
        if(height > this.sealevel) {
          isLand++;
        }
      }
      for(let point=0; point<3; point++) {
        let height = componentFace.heights[point];
        let heightColor = height * 100000;
        if(heightColor < 20) {
          heightColor = 20;
        }
        if(heightColor > 245) {
          heightColor = 245;
        }

        if(isLand > 0 && height > 0.002) {
          colors[(i * 9) + (point * 3) + 0] = heightColor / 2;
          colors[(i * 9) + (point * 3) + 1] = heightColor / 1.5;
          colors[(i * 9) + (point * 3) + 2] =
            (heightColor - (heightColor % 20) - 10);
        } else if(isLand > 0) {
          colors[(i * 9) + (point * 3) + 0] =
            (heightColor - (heightColor % 20) - 10)/2;
          colors[(i * 9) + (point * 3) + 1] =
            (heightColor + (heightColor % 20) - 10);
          colors[(i * 9) + (point * 3) + 2] =
            (heightColor + (heightColor % 20) - 10)/2;
        } else {
          heightColor /= 2;
          heightColor += 100;
          heightColor -= 5 * (heightColor % 5);
          colors[(i * 9) + (point * 3) + 0] = heightColor /8;
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

    faces.delete();
    if(skirt) {
      facesAndSkirt.delete();
    }

    return [vertices.buffer, colors.buffer, normals.buffer];
  }

  /* Get a point on surface directly below the specified one. */
  public getSurfaceUnderPoint(point: THREE.Vector3, recursion: number): IPoint {
    point = new THREE.Vector3(point.x, point.y, point.z);
    const direction = new THREE.Vector3();
    direction.copy(point);
    direction.normalize();
    direction.negate();
    const face = this.terrainGenerator.rayCrossesFace(point.toArray(),
                                                      direction.toArray(),
                                                      recursion);
    if(face) {
      const surfacePoint = new THREE.Vector3(
        (face.points[0][0] + face.points[1][0] + face.points[2][0]) / 3,
        (face.points[0][1] + face.points[1][1] + face.points[2][1]) / 3,
        (face.points[0][2] + face.points[1][2] + face.points[2][2]) / 3 );
      const height = (face.heights[0] + face.heights[1] + face.heights[2] ) / 3;
      const returnFace: IFace = {
        indexHigh: face.index_high, indexLow: face.index_low, recursion};
      face.delete();
      return {point: surfacePoint, height, face: returnFace};
    }
    console.log("Face not found beneath:", point);
  }

  public getFaceUnderMouse(mouseRay: ICustomInputEvent, recursion: number):
  IFace {
    // TODO: Normalize this for heights.
    const face = this.terrainGenerator.rayCrossesFace(mouseRay.origin,
                                                      mouseRay.direction,
                                                      recursion);
    if(face) {
      const surfacePoint0: IPoint = {
        point: new THREE.Vector3().fromArray(face.points[0]),
        height: face.heights[0]};
      const surfacePoint1: IPoint = {
        point: new THREE.Vector3().fromArray(face.points[1]),
        height: face.heights[1]};
      const surfacePoint2: IPoint = {
        point: new THREE.Vector3().fromArray(face.points[2]),
        height: face.heights[2]};
      const returnVal = {indexHigh: face.index_high as number,
                         indexLow: face.index_low as number,
                         recursion,
                         height: face.height as number,
                         points: [surfacePoint0, surfacePoint1, surfacePoint2],
                        };
      face.delete();

      return returnVal;
    }
  }

  private init() {
    try {
      this.terrainGenerator = new Module.DataSourceGenerate();
      this.terrainGenerator.MakeCache();
    } catch(err) {
      // Memory still in use from previous page load.
      // Wait a 5 seconds and re-load again.
      console.log(err);
      setTimeout(this.init.bind(this), 5000);
      return;
    }
  }
}

let worldTileWorker = new WorldTileWorker();
let socket = self;

// Used by SharedWorker.
let onconnect = (event: MessageEvent) => {
  console.log("onconnect", event.ports);
  socket = event.ports[0];

  socket.onmessage = onmessage;
};
this.addEventListener("connect", onconnect);

onmessage = (e: MessageEvent) => {
  const workerResult = "Recieved: " + e.data[0];
  console.log(workerResult);

  const reply = e.data.slice();  // Copy.

  switch(e.data[0]) {
    case "rayCrossesFace":
      break;
    case "getNeighbours":
      const neighbours = worldTileWorker.getNeighbours(e.data[1],
                                                       e.data[2],
                                                       e.data[3]);
      reply.push(neighbours);
      socket.postMessage(reply);
      break;
    case "generateTerrain":
      const geometry = worldTileWorker.generateTerrain(e.data[1],
                                                       e.data[2],
                                                       e.data[3],
                                                       e.data[4],
                                                       e.data[5]);
      socket.postMessage(reply.concat(geometry), geometry);
      break;
    case "getSurfaceUnderPoint":
      const point = worldTileWorker.getSurfaceUnderPoint(e.data[2],
                                                        e.data[3]);
      reply.push(point);
      socket.postMessage(reply);
      break;
    case "getFaceUnderMouse":
      const face = worldTileWorker.getFaceUnderMouse(e.data[1], e.data[2]);

      reply.push(face);
      socket.postMessage(reply);
      break;
    case "ping":
      reply.push("pong");
      socket.postMessage(reply);
      break;
    default:
      console.log(e.data);
  }
};

console.log("worker");
