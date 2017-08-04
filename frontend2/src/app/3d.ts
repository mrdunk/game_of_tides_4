// Copyright 2017 duncan law (mrdunk@gmail.com)
/// <reference path='../../node_modules/@types/three/index.d.ts' />
/// <reference path='../../build/wrap_terrain.js' />

// Helpful diagram showing how Threejs components fits together:
// http://davidscottlyons.com/threejs/presentations/frontporch14/#slide-16

const heightMultiplier = 0.01;
const sealevel = 0.8;


declare var Module: {
  IndexAtRecursion: (iHigh: number, iLow: number, r: number) => number[];
  IndexOfChild:
    (iHigh: number, iLow: number, recursion: number, child: number) => number[];
  DataSourceGenerate: () => void;
};

interface ICustomInputEvent {
  type: string;
  origin?: number[];
  direction?: number[];
  shiftKey?: number;
  ctrlKey?: number;
  altKey?: number;
  key?: string;
  target?: HTMLElement;
  value?: string | number | boolean;
}

interface IMeshesEntry {
  mesh?: Mesh;
  children: {};
}

interface ISurfacePoint {
  point: THREE.Vector3;
  height: number;
}

const earthRadius = 6371;  // km.
const cameraInitialDistance = 10000;
class Camera extends THREE.PerspectiveCamera {
  public lat: number = 0;
  public lon: number = 0;
  public pitch: number = 0;
  public yaw: number = 0;
  public distance: number = cameraInitialDistance;
  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];
  private animate: boolean = true;
  private animateChanged: number = 0;
  private surfaceHeight: number = earthRadius;

  constructor(public label: string) {
    super( 75,
           window.innerWidth / window.innerHeight,
           0.01,
           cameraInitialDistance * 2 );
    this.position.z = this.distance + this.surfaceHeight;

    this.updatePos();
  }

  public service() {
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key || input.type) {
        case "C":
          if(Date.now() - this.animateChanged < 200) {
            // Debounce input.
            return;
          }
          this.animateChanged = Date.now();
          this.animate = !this.animate;
          break;
        case "ArrowRight":
          if(this.animate) {
            if(input.shiftKey) {
              this.yaw -= 0.01;
              this.updatePos();
            } else {
              this.lon += this.distance / 10000;
              this.updatePos();
            }
          }
          break;
        case "ArrowLeft":
          if(this.animate) {
            if(input.shiftKey) {
              this.yaw += 0.01;
              this.updatePos();
            } else {
              this.lon -= this.distance / 10000;
              this.updatePos();
            }
          }
          break;
        case "ArrowUp":
          if(this.animate) {
            if(input.shiftKey) {
              this.pitch += 0.01;
              this.updatePos();
            }else if(input.ctrlKey) {
              this.distance /= 1.1;
              console.log(this.distance);
              this.updatePos();
            } else {
              this.lat += this.distance / 10000;
              this.updatePos();
            }
          }
          break;
        case "ArrowDown":
          if(this.animate) {
            if(input.shiftKey) {
              this.pitch -= 0.01;
              this.updatePos();
            }else if(input.ctrlKey) {
              this.distance *= 1.1;
              console.log(this.distance);
              this.updatePos();
            } else {
              this.lat -= this.distance / 10000;
              this.updatePos();
            }
          }
          break;
        case " ":
          if(this.animate) {
            this.pitch = 0;
            this.yaw = 0;
            this.updatePos();
          }
          break;
        case "cameraabove":
          const point = new THREE.Vector3();
          point.fromArray((input as ICustomInputEvent).origin);
          let height = (input as ICustomInputEvent).value as number;
          if(height < sealevel) {
            height = sealevel;
          }
          const multiplier = 1 + (height * heightMultiplier);
          this.surfaceHeight = point.length() * multiplier;
          this.updatePos();
          break;
      }
    }
  }

  public updatePos() {
    if(this.lat > 90) { this.lat = 90; }
    if(this.lat < -90) { this.lat = -90; }
    if(this.lon > 180) { this.lon -= 360; }
    if(this.lon < -180) { this.lon += 360; }
    if(this.distance < 0.01) {
      this.distance = 0.01;
    }

    const lat = 90 - this.lat;
    const lon = this.lon + 90;
    const origin = new THREE.Vector3(0,0,0);

    this.position.x =
      -((this.distance + this.surfaceHeight) *
        Math.sin(THREE.Math.degToRad(lat)) *
                          Math.cos(THREE.Math.degToRad(lon)));
    this.position.z =
      ((this.distance + this.surfaceHeight) *
        Math.sin(THREE.Math.degToRad(lat)) *
                         Math.sin(THREE.Math.degToRad(lon)));
    this.position.y =
      ((this.distance + this.surfaceHeight) *
        Math.cos(THREE.Math.degToRad(lat)));

    this.lookAt(origin);
    this.rotateZ(this.yaw);
    this.rotateX(this.pitch);

  }
}

class Renderer extends THREE.WebGLRenderer {
  public element: HTMLElement;
  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];
  private scene: Scene;
  private camera: Camera;
  private lastCameraPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(public label: string,
              public width?: number,
              public height?: number) {
    super({antialias: true});
    if(!this.width) {
      this.width = window.innerWidth;
    }
    if(!this.height) {
      this.height = window.innerHeight;
    }
    this.setSize(this.width, this.height);
    this.setPixelRatio( window.devicePixelRatio );
    this.element = document.getElementById(label);
    this.element.appendChild(this.domElement);

    UIMaster.clientMessageQueues.push(this.userInput);
  }

  public setScene(scene: Scene) {
    this.scene = scene;
    this.service(Date.now());
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
    this.service(Date.now());
  }

  public service(now: number) {
    // User input.
    for(let i = this.userInput.length -1; i >=0; i--) {
      // Remove mouse events destined for other HTML elements.
      //
      // If we use this.userInput.filter() here we cannot modify in place so
      // would have to replace UIMaster's reference to this.userInput.
      const target = this.userInput[i].target as HTMLElement;
      if(target !== undefined && this.userInput[i] instanceof MouseEvent &&
         target.parentElement.id !== this.label) {
        this.userInput.splice(i, 1);
      }
    }

    const userInput = this.userInput.slice();  // Copy array.
    while (userInput.length) {
      const input = userInput.pop();
      switch(input.key || input.type) {
        case "mousemove":
          this.userInput.push(this.getMouseRay(input));
          break;
      }
    }

    const cameraAbove = this.getCameraAbovePoint();
    if(cameraAbove) {
      this.userInput.push(cameraAbove);
    }

    // Update dependants.
    if(this.scene && this.camera) {
      this.scene.userInput = this.userInput.slice();  // Copy array.
      this.camera.userInput = this.userInput.slice();  // Copy array.
      this.scene.service(now);
      this.camera.service();
      this.render(this.scene, this.camera);
    }

    // Empty the user input buffer.
    this.userInput.splice(0, this.userInput.length);
  }

  private getMouseRay(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, this.camera );
    const origin = [raycaster.ray.origin.x,
                    raycaster.ray.origin.y,
                    raycaster.ray.origin.z];
    const direction = [raycaster.ray.direction.x,
                       raycaster.ray.direction.y,
                       raycaster.ray.direction.z];
    return {type: "mouseray", origin, direction};
  }

  private getCameraAbovePoint() {
    if(this.camera === undefined) {
      return;
    }
    if(this.lastCameraPos.equals(this.camera.position)) {
      return;
    }
    this.lastCameraPos.copy(this.camera.position);
    const point =
      this.scene.getFaceUnderPoint(this.camera.position, 9);
    if(point === undefined) {
      return;
    }
    console.log("getCameraAbovePoint", point.height);
    return {type: "cameraabove",
            origin: point.point.toArray(),
            value: point.height};
  }
}

abstract class Scene extends THREE.Scene {
  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];
  public meshes: IMeshesEntry = {children: {}};
  public activeMeshes: {} = {};
  private lastUpdate: number = Date.now();

  constructor(public label: string) {
    super();

    const light = new THREE.PointLight(0xffffff);
    light.position.set(0,0,20000);
    this.add(light);
    const twighLight1 = new THREE.PointLight(0x444455);
    twighLight1.position.set(20000,10000,-2000);
    this.add(twighLight1);
    const twighLight2 = new THREE.PointLight(0x554444);
    twighLight2.position.set(-20000,-10000,-2000);
    this.add(twighLight2);
    const ambientLight = new THREE.AmbientLight(0x444444);
    this.add(ambientLight);

    this.background = new THREE.Color(0x444444);

    const axis = new Line(new THREE.Vector3(0, 10000, 0),
                          new THREE.Vector3(0, -10000, 0));
    this.add(axis);
  }

  /* Save meshes in this.meshes tree. */
  public setMesh(mesh: Mesh) {
    let parentMeshes = this.meshes;
    if(mesh.userData.parentLabel) {
      parentMeshes = this.findMesh(mesh.userData.parentLabel, this.meshes);
      if(!parentMeshes.mesh.userData.children.includes(mesh.userData.label)) {
        parentMeshes.mesh.userData.children.push(mesh.userData.label);
      }
    }

    parentMeshes.children[mesh.userData.label] = {mesh, children: {}};
    this.activeMeshes[mesh.userData.label] =
      parentMeshes.children[mesh.userData.label].mesh;
    this.add( mesh );

    console.log(this.meshes);
  }

  public service(now: number) {
    if(now - this.lastUpdate > 1000) {
      console.log("ERROR: Scene last update more than 1 second ago.");
      this.lastUpdate = now;
    }
    while(this.lastUpdate < now - timeStep) {
      this.lastUpdate += timeStep;
      for(const mesh in this.activeMeshes) {
        if(this.activeMeshes.hasOwnProperty(mesh) && this.activeMeshes[mesh]) {
          this.activeMeshes[mesh].userInput = this.userInput.slice();  // Copy.
          this.activeMeshes[mesh].service();
        }
      }
    }
  }

  public abstract getFaceUnderPoint(point: THREE.Vector3,
                                    recursion: number): ISurfacePoint;

  protected findMesh(label: string, meshes: IMeshesEntry) {
    for(const l in meshes.children) {
      if(meshes.children.hasOwnProperty(l)) {
        if(l === label) {
          return meshes.children[l];
        }
        const child = this.findMesh(label, meshes.children[l]);
        if(child !== undefined) {
          return child;
        }
      }
    }
  }
}

class World extends Scene {
  private activeTileLevels: boolean[] = [];
  private cursor: Line[] = [];
  private mouseRay: ICustomInputEvent;

  constructor(public label: string, private terrainGenerator) {
    super(label);

    window.addEventListener("beforeunload", (event) => {
      // Try to cleanup memory allocation before page reload.
      // TODO: Does this work?
      console.log("Reloading page");
      for(const mesh in this.activeMeshes) {
        if(this.activeMeshes.hasOwnProperty(mesh) && this.activeMeshes[mesh]) {
          this.activeMeshes[mesh].dispose();
          this.activeMeshes[mesh] = null;
        }
      }
      if(this.terrainGenerator) {
        this.terrainGenerator.delete();
        this.terrainGenerator = null;
      }
      console.log("done cleanup");
    });

    this.terrainGenerator.MakeCache();

    for(let section = 0; section < 8; section++) {
      const rootFace = section * Math.pow(2, 29);
      this.generateTile("", rootFace, 0, 0);
    }
  }

  public service(now: number) {
    super.service(now);
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key || input.type) {
        case "mousedown":
          // TESTING
          console.log("mouseclick", input);
          const clickedTile = this.getFaceUnderMouse(this.mouseRay, 8);
          if(clickedTile) {
            this.generateTiles(clickedTile.indexHigh,
              clickedTile.indexLow,
              9);
            }
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if(input.type === "menuevent") {
            this.activeTileLevels[parseInt(input.key, 10)] =
              (input as ICustomInputEvent).value as boolean;
            this.setAllTileVisibility();
          }
          break;
        case "mouseray":
          this.getFaceUnderMouse(input as ICustomInputEvent, 6);
          this.mouseRay = input as ICustomInputEvent;
          break;
      }
    }
  }

  public setCursor(point0: THREE.Vector3,
                   point1: THREE.Vector3,
                   point2: THREE.Vector3) {
    if(this.cursor.length === 0) {
      for(let c = 0; c < 3; c += 1) {
        const cursor = new Line(new THREE.Vector3(0, 0, 0),
                                new THREE.Vector3(0, 0, 0));
        cursor.renderOrder = 999;
        cursor.material.depthTest = false;
        this.cursor.push(cursor);
        this.add(cursor);
      }
    }

    this.cursor[0].setStart(point0);
    this.cursor[0].setEnd(point1);
    this.cursor[1].setStart(point1);
    this.cursor[1].setEnd(point2);
    this.cursor[2].setStart(point2);
    this.cursor[2].setEnd(point0);

    // console.log(this.getFaceUnderPoint(point0, 6));
  }

  public clearCursor() {
    const origin = new THREE.Vector3(0, 0, 0);
    this.cursor.forEach((line) => {
      line.setStart(origin);
      line.setEnd(origin);
    });
  }

  public makeTileLabel(faceIndexHigh: number,
                       faceIndexLow: number,
                       recursion: number) {
    return "tile_" + faceIndexHigh + "_" + faceIndexLow + "_" + recursion;
  }

  /* Get a point on surface directly below the specified one. */
  public getFaceUnderPoint(point: THREE.Vector3, recursion: number) {
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
      face.delete();
      return {point: surfacePoint, height};
    }
    console.log("Face not found beneath:", point);
  }

  public tileFinishedCallback(mesh: Mesh) {
    this.setParentTileVisibility(mesh.userData.label);
  }

  protected setAllTileVisibility() {
    for(const meshLabel in this.activeMeshes) {
      if(this.activeMeshes.hasOwnProperty(meshLabel)) {
        this.setTileVisibility(meshLabel);
      }
    }
  }

  protected setParentTileVisibility(meshLabel: string) {
    const mesh = this.activeMeshes[meshLabel];
    this.setTileVisibility(mesh.userData.parentLabel);
  }

  protected setTileVisibility(meshLabel: string) {
    if(this.activeMeshes[meshLabel]) {
      const mesh = this.activeMeshes[meshLabel];
      const recursion = mesh.userData.recursion;

      let childrenComplete = (mesh.userData.children.length > 3);
      mesh.userData.children.forEach((childLabel) => {
        childrenComplete =
          childrenComplete &&
          this.activeMeshes[childLabel].userData.complete === true;
      });

      this.activeMeshes[meshLabel].visible =
        (this.activeTileLevels[recursion] ||
         this.activeTileLevels[recursion] === undefined) &&
        !childrenComplete;
    }
  }

  protected getFaceUnderMouse(mouseRay: ICustomInputEvent, recursion: number) {
    if(!mouseRay) {
      this.clearCursor();
      return;
    }

    const face = this.terrainGenerator.rayCrossesFace(mouseRay.origin,
                                                      mouseRay.direction,
                                                      recursion);
    if(face) {
      const surfacePoint0 = new THREE.Vector3().fromArray(face.points[0]);
      const surfacePoint1 = new THREE.Vector3().fromArray(face.points[1]);
      const surfacePoint2 = new THREE.Vector3().fromArray(face.points[2]);
      const returnVal = {indexHigh:face.index_high,
                         indexLow: face.index_low,
                         height: face.height,
                         points: [surfacePoint0, surfacePoint1, surfacePoint2],
                        };
      face.delete();

      this.setCursor(surfacePoint0, surfacePoint1, surfacePoint2);
      return returnVal;
    } else {
      this.clearCursor();
    }
  }

  private generateTile(parentLabel: string,
                       faceIndexHigh: number,
                       faceIndexLow: number,
                       recursion: number) {
    let iHigh = faceIndexHigh;
    let iLow = faceIndexLow;
    [iHigh, iLow] = Module.IndexAtRecursion(iHigh, iLow, recursion);

    const label = this.makeTileLabel(iHigh, iLow, recursion);
    if(this.findMesh(label, this.meshes)) {
      console.log("Already created: ", label);
      return;
    }

    const mesh = new WorldTile(label,
                               this.terrainGenerator,
                               faceIndexHigh,
                               faceIndexLow,
                               recursion,
                               recursion + 4,
                               parentLabel,
                               this.tileFinishedCallback.bind(this));
    this.setMesh(mesh);
    mesh.visible = this.activeTileLevels[mesh.userData.recursion];
  }

  private generateChildTiles(faceIndexHigh: number,
                             faceIndexLow: number,
                             recursion: number) {
    const parentLabel =
      this.makeTileLabel(faceIndexHigh, faceIndexLow, recursion);
    for(let c = 0; c < 4; c++) {
      const child =
        Module.IndexOfChild(faceIndexHigh, faceIndexLow, recursion, c);
      this.generateTile(parentLabel, child[0], child[1], recursion +1);
    }
  }

  private generateTiles(faceIndexHigh: number,
                        faceIndexLow: number,
                        recursion: number) {
    for(let r = 1; r <= recursion; r++) {
      let parentHigh = faceIndexHigh;
      let parentLow = faceIndexLow;
      [parentHigh, parentLow] =
        Module.IndexAtRecursion(parentHigh, parentLow, r -1);

      this.generateChildTiles(parentHigh, parentLow, r -1);

      const parentLabel = this.makeTileLabel(parentHigh, parentLow, r -1);
      const parentTile = this.findMesh(parentLabel, this.meshes).mesh;

      if(parentTile === undefined) {
        console.log("Couldn't find ", parentLabel);
      }else if(parentTile.userData.neighbours === undefined) {
        console.log(parentLabel + " did not have neighbours.", parentTile);
      } else {
        console.log(parentTile);
        for(const neighbour of parentTile.userData.neighbours) {
          this.generateChildTiles(neighbour[0], neighbour[1], r -1);
        }
      }
    }
  }
}

class Line extends THREE.Line {
  public geometry: THREE.Geometry;

  constructor(start: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
              end: THREE.Vector3 = new THREE.Vector3(10000, 0, 0)) {
    super();
    this.material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    this.geometry = new THREE.Geometry();
    this.geometry.vertices.push(start);
    this.geometry.vertices.push(end);
  }

  public setStart(point: THREE.Vector3) {
    this.geometry.vertices[0] = point;
    this.geometry.verticesNeedUpdate = true;
  }

  public setEnd(point: THREE.Vector3) {
    this.geometry.vertices[1] = point;
    this.geometry.verticesNeedUpdate = true;
  }
}

abstract class Mesh extends THREE.Mesh {
  // Disable typechecking for "material" as the .wireframe exists for all
  // material types we are using.
  public material: any;

  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];

  private materialIndex: number = -1;
  private materialIndexChanged: number = 0;

  constructor(label: string) {
    super();
    this.userData.label = label;
  }

  public abstract service(): void;

  public dispose() {
    if(this.geometry) {
      this.geometry.dispose();
    }
    if(this.material) {
      this.material.dispose();
    }
  }

  protected changeMaterial(colorHint: number=0) {
    if(Date.now() - this.materialIndexChanged < 200) {
      // Debounce input.
      return;
    }
    this.materialIndexChanged = Date.now();

    if(++this.materialIndex >= 6) {
      this.materialIndex = 0;
    }

    let color = 0x000000;
    switch(colorHint) {
      case 0:
        color = 0x433F81;
        break;
      case 1:
        color = 0xAA2222;
        break;
      case 2:
        color = 0x22AA22;
        break;
      case 3:
        color = 0x2222AA;
        break;
      case 4:
        color = 0x888822;
        break;
      case 5:
        color = 0x882288;
        break;
      case 6:
        color = 0x228888;
        break;
      case 7:
        color = 0x777777;
        break;
      case 8:
        color = 0xAA2222;
        break;
      case 9:
        color = 0x22AA22;
        break;
    }

    switch(this.materialIndex) {
      case 0:
        // this.material = new THREE.MeshLambertMaterial({color: 0x55B663});
        this.material = new THREE.MeshLambertMaterial({
          vertexColors: THREE.VertexColors,
          // transparent: true,
          // opacity: 1
        });
        break;
      case 1:
        this.material.wireframe = true;
        break;
      case 2:
        this.material = new THREE.MeshBasicMaterial({color});
        break;
      case 3:
        this.material.wireframe = true;
        break;
      case 4:
        this.material = new THREE.MeshNormalMaterial({side : THREE.DoubleSide,
                                                      wireframeLinewidth: 1});
        break;
      case 5:
        this.material.wireframe = true;
        break;
    }
  }
}

class Box extends Mesh {
  constructor(label: string) {
    super(label);
    this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
    this.changeMaterial();
  }

  public service() {
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key || input.type) {
        case "c":
          this.changeMaterial();
          break;
      }
    }
  }
}

class WorldTile extends Mesh {
  constructor(private label: string,
              private terrainGenerator,
              private faceIndexHigh: number,
              private faceIndexLow: number,
              private recursion: number,
              private requiredDepth: number,
              private parentLabel: string,
              private tileFinishedCallback: (mesh: Mesh) => void) {
    super(label);
    this.userData.faceIndexHigh = faceIndexHigh;
    this.userData.faceIndexLow = faceIndexLow;
    this.userData.recursion = recursion;
    this.userData.requiredDepth = requiredDepth;
    this.userData.parentLabel = parentLabel;
    this.userData.neighbours = [];  // TODO: Type.
    this.userData.children = [];

    this.changeMaterial();
    this.getNeighbours();
    // this.generateTerrain();

    window.setTimeout(function(){
      this.generateTerrain();
      tileFinishedCallback(this);
    }.bind(this), 1);
  }

  public getNeighbours() {
    const thisFace = this.terrainGenerator.getFaces(this.faceIndexHigh,
                                                    this.faceIndexLow,
                                                    this.recursion,
                                                    this.recursion);
    const face = thisFace.get(0);
    for(let n = 0; n < face.neighbours.size(); n++) {
      const neighbour = face.neighbours.get(n);
      this.userData.neighbours.push([neighbour[0], neighbour[1]]);
    }
    face.delete();
    thisFace.delete();
  }

  public generateTerrain() {
    console.log(this.faceIndexHigh,
      this.faceIndexLow,
      this.recursion,
      this.requiredDepth);

    const faces = this.terrainGenerator.getFaces(this.faceIndexHigh,
                                                 this.faceIndexLow,
                                                 this.recursion,
                                                 this.requiredDepth);
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
        if(height >= sealevel) {
          colors[(i * 9) + (point * 3) + 0] = heightColor /2;
          colors[(i * 9) + (point * 3) + 1] = heightColor;
          colors[(i * 9) + (point * 3) + 2] = heightColor /2;
        } else {
          colors[(i * 9) + (point * 3) + 0] = heightColor /2;
          colors[(i * 9) + (point * 3) + 1] = heightColor /2;
          colors[(i * 9) + (point * 3) + 2] = heightColor;
        }

        if(height < sealevel) {
          height = sealevel;
        }
        for(let coord=0; coord<3; coord++) {
          vertices[(i * 9) + (point * 3) + coord] =
            componentFace.points[point][coord] *
            (1 + (height * heightMultiplier));
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

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute("position",
                               new THREE.BufferAttribute(vertices, 3));
    this.geometry.addAttribute("color",
                               new THREE.BufferAttribute(colors, 3, true));
    this.geometry.addAttribute("normal",
                               new THREE.BufferAttribute(normals, 3, true));
    // this.renderOrder = this.requiredDepth;
    // this.material.depthTest = false;

    faces.delete();
    facesAndSkirt.delete();

    this.userData.complete = true;
  }

  public service() {
    // TODO: Should this actually happen for each mesh or for the whole scene?
    while (this.userInput.length) {
      const input = this.userInput.pop();
      // console.log(input.type, input.key);
      switch(input.key || input.type) {
        case "c":
          this.changeMaterial(this.recursion);
          break;
      }
    }
  }
}
