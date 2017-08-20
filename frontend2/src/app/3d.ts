// Copyright 2017 duncan law (mrdunk@gmail.com)
/// <reference path='../../node_modules/@types/three/index.d.ts' />
/// <reference path='../../build/wrap_terrain.js' />

// Helpful diagram showing how Threejs components fits together:
// http://davidscottlyons.com/threejs/presentations/frontporch14/#slide-16

const heightMultiplier = 2;
const sealevel = 0.001;  // Ratio of planets diameter.
const earthRadius = 6371;  // km.
const cameraInitialDistance = 10000 * 1;
const skyColor = 0x90A0C0;

declare var Module: {
  IndexAtRecursion: (iHigh: number, iLow: number, r: number) => number[];
  IndexOfChild:
    (iHigh: number, iLow: number, recursion: number, child: number) => number[];
  DataSourceGenerate: () => void;
};

interface IFace {
  indexHigh: number;
  indexLow: number;
  height: number;
  points: IPoint[];
}

interface ITile {
  indexHigh: number;
  indexLow: number;
  recursion: number;
}

interface IGenerateTileTask extends ITile {
  type?: string;
  parent?: boolean;
  neighbours?: boolean;
  children?: boolean;
}

interface ITileTaskHash {
  [tileLabel: string]: IGenerateTileTask;
}

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

interface IPoint {
  point: THREE.Vector3;
  height?: number;
}

function makeTileLabel(face: ITile): string {
  return "tile_" +
    face.indexHigh + "_" + face.indexLow + "_" + face.recursion;
}

function getParentLabel(face: ITile): string {
  if(face.recursion === 0) {
    return "";
  }

  let indexHigh;
  let indexLow;
  [indexHigh, indexLow] =
    Module.IndexAtRecursion(face.indexHigh,
                            face.indexLow,
                            face.recursion - 1);
  return makeTileLabel(
    {indexHigh, indexLow, recursion: face.recursion - 1});
}

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
           100,
           cameraInitialDistance * 2 );
    this.position.z = this.distance + this.surfaceHeight;

    this.updatePos();
  }

  public service(): void {
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
              this.lon += this.distance / cameraInitialDistance;
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
              this.lon -= this.distance / cameraInitialDistance;
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
              this.updatePos();
            } else {
              this.lat += this.distance / cameraInitialDistance;
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
              this.updatePos();
            } else {
              this.lat -= this.distance / cameraInitialDistance;
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
          const height =
            Math.max(sealevel, (input as ICustomInputEvent).value as number);
          const multiplier = 1 + (height * heightMultiplier);
          this.surfaceHeight = point.length() * multiplier;
          this.updatePos();
          break;
      }
    }
  }

  public updatePos(): void {
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

    this.near = this.distance / 4;
    this.far = Math.max(this.distance * 2, 2000);
    this.updateProjectionMatrix();
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

  public setScene(scene: Scene): void {
    this.scene = scene;
    this.service(Date.now());

    this.initWorker();
  }

  public setCamera(camera: Camera): void {
    this.camera = camera;
    this.service(Date.now());
  }

  public service(now: number): void {
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

    this.getCameraAbovePoint();

    // Update dependants.
    if(this.scene && this.camera) {
      this.scene.userInput = this.userInput.slice();  // Copy array.
      this.camera.userInput = this.userInput.slice();  // Copy array.
      this.scene.service(now);
      this.camera.service();
      this.render(this.scene, this.camera);
      this.scene.setFog(this.camera.distance);
    }

    // Empty the user input buffer.
    this.userInput.splice(0, this.userInput.length);
  }

  private getMouseRay(event): ICustomInputEvent {
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

  // Will be delegated to WebWorker. Result will be announced on the input bus.
  private getCameraAbovePoint(): void {
    if(this.camera === undefined) {
      return;
    }
    if(this.lastCameraPos.equals(this.camera.position)) {
      return;
    }
    this.lastCameraPos.copy(this.camera.position);
    this.scene.getSurfaceUnderPoint("cameraabove",
                                    this.camera.position,
                                    this.scene.cursorSize);
  }

  private initWorker(): void {
    this.scene.worker.port.addEventListener("message",
                                            this.workerCallback.bind(this));
  }

  private workerCallback(event: MessageEvent): void {
    switch(event.data[0]) {
      case "getSurfaceUnderPoint":
        // console.log("callback: getSurfaceUnderPoint", event.data);
        if(event.data[4] !== undefined) {
          this.userInput.push({type: event.data[1],
                               origin: [event.data[4].point.x,
                                        event.data[4].point.y,
                                        event.data[4].point.z],
                               value: event.data[4].height});
        }
        break;
    }
  }
}

class Scene extends THREE.Scene {
  public faceUnderMouse: IFace;
  public generateTileLevel: number = 6;
  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];
  public activeMeshes: {} = {};
  public cursorSize: number = 6;
  private activeTileLevels: boolean[] = [];
  private cursor: Cursor = new Cursor();
  private workQueue: ITileTaskHash[] = [];
  private lockWorkQueue: boolean = false;
  private lastUpdate: number = Date.now();
  private fogDistance: number = 0;

  constructor(public label: string, public worker) {
    super();

    const light = new THREE.PointLight(0xffffff);
    light.position.set(0,0,2*cameraInitialDistance);
    this.add(light);
    const twighLight1 = new THREE.PointLight(0x444455);
    twighLight1.position.set(2*cameraInitialDistance,
                             cameraInitialDistance,
                             -cameraInitialDistance/10);
    this.add(twighLight1);
    const twighLight2 = new THREE.PointLight(0x554444);
    twighLight2.position.set(-2*cameraInitialDistance,
                             -cameraInitialDistance,
                             -cameraInitialDistance/10);
    this.add(twighLight2);
    const ambientLight = new THREE.AmbientLight(0x666666);
    this.add(ambientLight);

    this.background = new THREE.Color(skyColor);

    const axis = new Line(new THREE.Vector3(0, cameraInitialDistance, 0),
                          new THREE.Vector3(0, -cameraInitialDistance, 0));
    this.add(axis);

    this.fog = new THREE.Fog(skyColor, 1, cameraInitialDistance);

    window.addEventListener("beforeunload", (event) => {
      // Try to cleanup memory allocation before page reload.
      console.log("Reloading page");
      for(const mesh in this.activeMeshes) {
        if(this.activeMeshes.hasOwnProperty(mesh) && this.activeMeshes[mesh]) {
          this.activeMeshes[mesh].dispose();
          delete this.activeMeshes[mesh];
        }
      }
      console.log("done cleanup");
    });

    for(let section = 0; section < 8; section++) {
      const rootFace = section * Math.pow(2, 29);
      this.addGenerateTileTask({indexHigh: rootFace,
                                indexLow: 0,
                                recursion: 0,
                                parent: true,
                                neighbours: true,
                                children: true});
    }
    this.initWorker();
    this.doTask();
    this.add(this.cursor);
  }

  public setFog(distance: number): void {
    if(distance < 10) {
      distance = 10;
    }
    const fogDistance = 20 * distance;
    if(fogDistance !== this.fogDistance) {
      this.fogDistance = fogDistance;
      this.fog.far = fogDistance;
    }
  }

  public service(now: number): void {
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

    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key || input.type) {
        case "mousedown":
          // TESTING
          console.log("mouseclick", input);
          if(this.faceUnderMouse) {
            let high;
            let low;
            [high, low] =
              Module.IndexAtRecursion(this.faceUnderMouse.indexHigh,
                                      this.faceUnderMouse.indexLow,
                                      this.generateTileLevel);
            this.addGenerateTileTask({indexHigh: high,
                                      indexLow: low,
                                      recursion: this.generateTileLevel,
                                      parent: true,
                                      neighbours: true,
                                      children: true});
            this.doTask();
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
        case "10":
        case "11":
        case "12":
        case "13":
        case "14":
          if(input.type === "menuevent") {
            this.activeTileLevels[parseInt(input.key, 10)] =
              (input as ICustomInputEvent).value as boolean;
            this.setAllTileVisibility();
          }
          break;
        case "generateLevel":
          const generate = (input as ICustomInputEvent).value as string;
          this.generateTileLevel = parseInt(generate, 10);
          this.cursorSize = this.generateTileLevel;
          console.log(this.generateTileLevel, typeof this.generateTileLevel);
          break;
        case "mouseray":
          this.getFaceUnderMouse(input as ICustomInputEvent, this.cursorSize);
          break;
      }
    }
  }

  public setCursor(face: IFace): void {
    this.cursor.setPosition(face);
  }

  /* Get a point on surface directly below the specified one.
   * WebWorker calculates this and returns result on input bus.*/
  public getSurfaceUnderPoint(label: string,
                              point: THREE.Vector3,
                              recursion: number): void {
    this.worker.port.postMessage(
      ["getSurfaceUnderPoint", label, point, recursion]);
  }

  /* WebWorker calculates this and returns result on input bus.*/
  private getFaceUnderMouse(mouseRay: ICustomInputEvent,
                            recursion: number): void {
    this.worker.port.postMessage(["getFaceUnderMouse", mouseRay, recursion]);
  }

  /* Set correct visibility for all tiles. */
  private setAllTileVisibility(): void {
    for(const meshLabel in this.activeMeshes) {
      if(this.activeMeshes.hasOwnProperty(meshLabel)) {
        this.setTileVisibility(meshLabel);
      }
    }
  }

  /* Set correct visibility for parent of specified tile. */
  private setParentTileVisibility(meshLabel: string): void {
    const mesh = this.activeMeshes[meshLabel];
    console.log(mesh.userData.parentLabel, meshLabel);
    this.setTileVisibility(mesh.userData.parentLabel);
  }

  /* Set correct visibility for tile. */
  private setTileVisibility(meshLabel: string): void {
    const mesh = this.activeMeshes[meshLabel];
    if(mesh !== undefined) {
      const recursion = mesh.userData.recursion;

      let childrenComplete = (mesh.userData.children.length > 3);
      const sumChildrenComplete = (childLabel) => {
        childrenComplete =
          (childrenComplete &&
           this.activeMeshes[childLabel].userData.complete === true);
      };
      mesh.userData.children.forEach(sumChildrenComplete);

      this.activeMeshes[meshLabel].visible =
        (this.activeTileLevels[recursion] ||
         this.activeTileLevels[recursion] === undefined) &&
        !childrenComplete;
    }
  }

  private addGenerateTileTask(task: IGenerateTileTask): void {
    if(this.workQueue[task.recursion] === undefined) {
      this.workQueue[task.recursion] = {};
    }
    const label = makeTileLabel(task);
    task.type = "generateTile";
    if(this.workQueue[task.recursion][label] !== undefined) {
      // Merge task in queue with new one.
      task.parent =
        task.parent || this.workQueue[task.recursion][label].parent;
      task.neighbours =
        task.neighbours || this.workQueue[task.recursion][label].neighbours;
      task.children =
        task.children || this.workQueue[task.recursion][label].children;
    }
    this.workQueue[task.recursion][label] = task;
  }

  /* Pop a task off the queue. */
  private getGenerateTileTask(): IGenerateTileTask {
    let returnval: IGenerateTileTask;
    const isJob = (jobList) => {
      if(returnval === undefined) {
        const key = Object.keys(jobList)[0];
        if(key !== undefined) {
          returnval = jobList[key];
          delete jobList[key];
        }
      }
    };
    this.workQueue.forEach(isJob);
    return returnval;
  }

  private doTask(): void {
    let testStr = "";
    const testFunc = (tiles, index) => {
      testStr += ", " + index + ":" + Object.keys(tiles).length;
    };
    this.workQueue.forEach(testFunc);
    console.log("doTask()", testStr);

    if(this.lockWorkQueue) {
      return;
    }
    const job = this.getGenerateTileTask();
    if(job === undefined) {
      return;
    }
    this.lockWorkQueue = true;

    const tileLabel = makeTileLabel(job);
    const tile = this.findMesh(tileLabel);
    if(tile === undefined) {
      console.log("  generate tile", tileLabel, job);
      const parentLabel = getParentLabel(job);
      const parentTile = this.activeMeshes[parentLabel];
      this.generateTile(parentTile, job);
      // Since it is still pending, put this back in to the queue.
      this.addGenerateTileTask(job);
    } else if(tile.userData.neighbours.length === 0 ||
              tile.userData.complete !== true) {
      console.log("  Waiting to complete", tileLabel);
      // Since it is still pending, put this back in to the queue.
      this.addGenerateTileTask(job);
    } else {
      if(job.parent) {
        this.generateParent(job);
      }
      if(job.neighbours) {
        this.generateNeighbours(tile, job);
      }
      if(job.children && this.generateTileLevel > job.recursion) {
        this.generateChildren(job);
      }
    }

    window.setTimeout(function(){ this.doTask(); }.bind(this), 20);
    this.lockWorkQueue = false;
  }

  private generateParent(job: IGenerateTileTask): void {
    if(job.recursion <= 0) {
      return;
    }
    let indexHigh;
    let indexLow;
    [indexHigh, indexLow] = Module.IndexAtRecursion(job.indexHigh,
                                                    job.indexLow,
                                                    job.recursion -1);
    const task: IGenerateTileTask = {indexHigh,
                                     indexLow,
                                     recursion: job.recursion -1,
                                     parent: true,
                                     neighbours: true,
                                     children: true};
    this.addGenerateTileTask(task);
  }

  private generateNeighbours(tile: WorldTile, job: IGenerateTileTask): void {
    for(const neighbour of tile.userData.neighbours) {
      const neighbourLabel =
        makeTileLabel(neighbour);
      const neighbourTile = this.findMesh(neighbourLabel);
      if(neighbourTile === undefined) {
        console.log("  generate neighbour", neighbourLabel);
        const task: IGenerateTileTask = {indexHigh: neighbour.indexHigh,
                                         indexLow: neighbour.indexLow,
                                         recursion: neighbour.recursion,
                                         parent: true,
                                         neighbours: false,
                                         children: false};
        this.addGenerateTileTask(task);
      }
    }
  }

  private generateChildren(parent: ITile): void {
    for(let c = 0; c < 4; c++) {
      const child =
        Module.IndexOfChild(parent.indexHigh,
                            parent.indexLow,
                            parent.recursion,
                            c);
      const childLabel = makeTileLabel({indexHigh: child[0],
                                             indexLow: child[1],
                                             recursion: parent.recursion +1});
      const childTile = this.findMesh(childLabel);
      if(childTile === undefined) {
        console.log("  generate child", childLabel, child);
        this.addGenerateTileTask({indexHigh: child[0],
                                  indexLow: child[1],
                                  recursion: parent.recursion +1,
                                  parent: true,
                                  neighbours: false,
                                  children: false});
      }
    }
  }

  private findMesh(label: string): WorldTile {
    if(this.activeMeshes.hasOwnProperty(label)) {
      return this.activeMeshes[label];
    }
  }

  private generateTile(parentTile: WorldTile, job: ITile): void {
    // [indexHigh, indexLow] =
    //     Module.IndexAtRecursion(indexHigh, indexLow, recursion);

    const depth = job.recursion + 4;
    // if(recursion >= 12) {
    //  depth = recursion + 5;
    // }
    // if(recursion === 0) {
    //  depth = 0;
    // }

    const label = makeTileLabel(job);
    if(this.findMesh(label)) {
      console.log("Already created: ", label);
      return;
    }

    const mesh = new WorldTile(label,
                               this.worker,
                               job.indexHigh,
                               job.indexLow,
                               job.recursion,
                               depth,
                               parentTile);
    this.activeMeshes[mesh.userData.label] = mesh;
    this.add(mesh);
    mesh.visible = this.activeTileLevels[job.recursion];

    // Populate any children that have already been created.
    mesh.userData.children = [];
    // TODO: Refactor into getCildLabels() method.
    for(let c = 0; c < 4; c++) {
      const child =
        Module.IndexOfChild(job.indexHigh,
                            job.indexLow,
                            job.recursion,
                            c);
      const childLabel = makeTileLabel({indexHigh: child[0],
                                             indexLow: child[1],
                                             recursion: job.recursion +1});
      const childTile = this.findMesh(childLabel);
      if(childTile !== undefined) {
        mesh.userData.children.push(childLabel);
      }
    }
  }

  private initWorker(): void {
    this.worker.port.addEventListener("message",
                                      this.workerCallback.bind(this));
  }

  private workerCallback(event: MessageEvent): void {
    let tileLabel;
    let tileMesh;
    switch(event.data[0]) {
      case "getNeighbours":
        // console.log("callback: getNeighbours", event.data[4].length);
        tileLabel = makeTileLabel({indexHigh: event.data[1],
                                        indexLow: event.data[2],
                                        recursion: event.data[3]});
        tileMesh = this.findMesh(tileLabel);
        tileMesh.userData.neighbours = event.data[4];
        break;
      case "generateTerrain":
        // console.log("callback: generateTerrain");
        tileLabel = makeTileLabel({indexHigh: event.data[1],
                                        indexLow: event.data[2],
                                        recursion: event.data[3]});
        tileMesh = this.findMesh(tileLabel);
        const vertices = new Float32Array(event.data[6]);
        const colors = new Uint8Array(event.data[7]);
        const normals = new Float32Array(event.data[8]);

        tileMesh.geometry = new THREE.BufferGeometry();
        tileMesh.geometry.addAttribute("position",
                                   new THREE.BufferAttribute(vertices, 3));
        tileMesh.geometry.addAttribute("color",
                                   new THREE.BufferAttribute(colors, 3, true));
        tileMesh.geometry.addAttribute("normal",
                                   new THREE.BufferAttribute(normals, 3, true));
        tileMesh.userData.complete = true;
        this.setParentTileVisibility(tileLabel);
        this.setTileVisibility(tileLabel);
        // this.setAllTileVisibility();
        break;
      case "getFaceUnderMouse":
        this.faceUnderMouse = event.data[3];
        this.setCursor(this.faceUnderMouse);
        break;
    }
  }
}

class Cursor extends THREE.Mesh {
  constructor() {
    super();
    this.material = new THREE.MeshBasicMaterial(
      {color: 0xff0000, side: THREE.DoubleSide},
    );

    this.geometry = new THREE.Geometry();
    for(let p = 0; p < 3 * 4; p++) {
      this.geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    }
    this.geometry.faces.push(new THREE.Face3(0, 1, 2));

    this.renderOrder = 999;
    this.material.depthTest = false;
  }

  public setPosition(face: IFace): void {
    if(face === undefined) {
      // this.clearCursor();
      return;
    }

    const point0 = new THREE.Vector3(0, 0, 0);
    const point1 = new THREE.Vector3(0, 0, 0);
    const point2 = new THREE.Vector3(0, 0, 0);

    point0.copy(face.points[0].point);
    point1.copy(face.points[1].point);
    point2.copy(face.points[2].point);

    const cursorFloatHeight = 0.0;  // (km)
    let height = Math.max(sealevel, face.points[0].height);
    height = Math.max(height, face.points[1].height);
    height = Math.max(height, face.points[2].height);
    height *= heightMultiplier;

    point0.setLength(earthRadius * (height + 1) + cursorFloatHeight);
    point1.setLength(earthRadius * (height + 1) + cursorFloatHeight);
    point2.setLength(earthRadius * (height + 1) + cursorFloatHeight);

    (this.geometry as THREE.Geometry).vertices[0] = point0;
    (this.geometry as THREE.Geometry).vertices[1] = point1;
    (this.geometry as THREE.Geometry).vertices[2] = point2;

    (this.geometry as THREE.Geometry).verticesNeedUpdate = true;
    (this.geometry as THREE.Geometry).elementsNeedUpdate = true;
    (this.geometry as THREE.Geometry).computeBoundingSphere();
  }
}

class Line extends THREE.Line {
  public geometry: THREE.Geometry;

  constructor(start: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
              end: THREE.Vector3 = new THREE.Vector3(10000, 0, 0)) {
    super();
    this.material = new THREE.LineBasicMaterial({color: 0xff0000,
                                                 linewidth: 2 });
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

  protected resetMaterial() {
    this.materialIndex = -1;
    this.changeMaterial();
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
          // opacity: 1,
          overdraw: 1.0,  // TODO: Still getting gaps in fine detail.
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
              private worker,
              private indexHigh: number,
              private indexLow: number,
              private recursion: number,
              private requiredDepth: number,
              private parentTile: WorldTile) {
    super(label);
    this.userData.indexHigh = indexHigh;
    this.userData.indexLow = indexLow;
    this.userData.recursion = recursion;
    this.userData.requiredDepth = requiredDepth;
    this.userData.neighbours = [];  // TODO: Type.
    this.userData.children = [];

    if(parentTile !== undefined) {
      this.userData.parentLabel = parentTile.label;
      if(!parentTile.userData.children.includes(label)) {
        parentTile.userData.children.push(label);
      }
    } else {
      this.userData.parentLabel = getParentLabel(this.userData);
      // Must populate children later.
    }

    this.changeMaterial();

    let skirt = false;
    if(recursion > 4) {
      skirt = true;
    }


    worker.port.postMessage(["getNeighbours",
                             indexHigh,
                             indexLow,
                             recursion]);
    worker.port.postMessage(["generateTerrain",
                             indexHigh,
                             indexLow,
                             recursion,
                             requiredDepth,
                             skirt]);
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
        case " ":
          this.resetMaterial();
          break;
      }
    }
  }
}
