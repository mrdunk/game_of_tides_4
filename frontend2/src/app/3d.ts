// Copyright 2017 duncan law (mrdunk@gmail.com)
/// <reference path='../../node_modules/@types/three/index.d.ts' />
/// <reference path='../../build/wrap_terrain.js' />

// Helpful diagram showing how Threejs components fits together:
// http://davidscottlyons.com/threejs/presentations/frontporch14/#slide-16

const heightMultiplier = 0.01;
const sealevel = 0.8;
const earthRadius = 6371 * 1;  // km.
const cameraInitialDistance = 10000 * 1;

declare var Module: {
  IndexAtRecursion: (iHigh: number, iLow: number, r: number) => number[];
  IndexOfChild:
    (iHigh: number, iLow: number, recursion: number, child: number) => number[];
  DataSourceGenerate: () => void;
};

interface IGenerateTileTask {
  type?: string;
  indexHigh: number;
  indexLow: number;
  recursion: number;
  neighbours?: boolean;
  children?: boolean;
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

interface IFace {
  indexHigh: number;
  indexLow: number;
  height: number;
  points: IPoint[];
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

  public setScene(scene: Scene) {
    this.scene = scene;
    this.service(Date.now());

    this.initWorker();
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
    this.scene.getSurfaceUnderPoint("cameraabove", this.camera.position, 9);
  }

  private initWorker() {
    // this.scene.worker.port.onmessage = this.workerCallback.bind(this);
    this.scene.worker.port.addEventListener("message",
                                            this.workerCallback.bind(this));
  }

  private workerCallback(event) {  // TODO: event type.
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

abstract class Scene extends THREE.Scene {
  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];
  public meshes: IMeshesEntry = {children: {}};
  public activeMeshes: {} = {};
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
    const ambientLight = new THREE.AmbientLight(0x444444);
    this.add(ambientLight);

    this.background = new THREE.Color(0x444444);

    const axis = new Line(new THREE.Vector3(0, cameraInitialDistance, 0),
                          new THREE.Vector3(0, -cameraInitialDistance, 0));
    this.add(axis);
  }

  /* Save meshes in this.meshes tree. */
  public setMesh(mesh: Mesh) {
    let parentMeshes = this.meshes;
    if(mesh.userData.parentLabel) {
      parentMeshes = this.findMeshRecursive(mesh.userData.parentLabel, this.meshes);
      if(!parentMeshes.mesh.userData.children.includes(mesh.userData.label)) {
        parentMeshes.mesh.userData.children.push(mesh.userData.label);
      }
    }

    parentMeshes.children[mesh.userData.label] = {mesh, children: {}};
    this.activeMeshes[mesh.userData.label] =
      parentMeshes.children[mesh.userData.label].mesh;
    this.add( mesh );

    // console.log(this.meshes);
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

  public abstract getSurfaceUnderPoint(label: string,
                                    point: THREE.Vector3,
                                    recursion: number): void;
  
  public setFog(distance: number) {
    if(distance < 10) {
      distance = 10;
    }
    const fogDistance = 20 * distance;
    if(fogDistance !== this.fogDistance){
      this.fogDistance = fogDistance;
      this.fog.far = fogDistance;
    }
  }

  protected findMesh(label: string) {
    if(this.activeMeshes.hasOwnProperty(label)) {
      return this.activeMeshes[label];
    }
  }

  protected findMeshRecursive(label: string, meshes: IMeshesEntry) {
    for(const l in meshes.children) {
      if(meshes.children.hasOwnProperty(l)) {
        if(l === label) {
          return meshes.children[l];
        }
        const child = this.findMeshRecursive(label, meshes.children[l]);
        if(child !== undefined) {
          return child;
        }
      }
    }
  }
}

class World extends Scene {
  private activeTileLevels: boolean[] = [];
  // private cursor: Line[] = [];
  private cursor = [];
  private faceUnderMouse;  // TODO: Type;
  private workQueue = [];  // TODO: Type.
  private lockWorkQueue: boolean = false;
  private generateTileLevel: number = 6;

  constructor(public label: string, public worker) {
    super(label, worker);

    this.fog = new THREE.Fog(0xA0A0A0, 1, cameraInitialDistance);

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
                                recursion: 1,
                                neighbours: true,
                                children: false});
    }
    this.initWorker();
    this.doWork();
  }

  public service(now: number) {
    super.service(now);

    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key || input.type) {
        case "mousedown":
          // TESTING
          console.log("mouseclick", input);
          if(this.faceUnderMouse) {
            let high, low;
            [high, low] =
              Module.IndexAtRecursion(this.faceUnderMouse.indexHigh,
                                      this.faceUnderMouse.indexLow,
                                      this.generateTileLevel);
            this.addGenerateTileTask({indexHigh: high,
                                      indexLow: low,
                                      recursion: this.generateTileLevel,
                                      neighbours: true,
                                      children: true});
            this.doWork();
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
        case "generateLevel":
          const generate = (input as ICustomInputEvent).value as string;
          this.generateTileLevel = parseInt(generate);
          console.log(this.generateTileLevel, typeof this.generateTileLevel);
          break;
        case "mouseray":
          this.getFaceUnderMouse(input as ICustomInputEvent, 10);
          break;
      }
    }
  }

  public setCursor(face: IFace) {
    if(face === undefined) {
      this.clearCursor();
      return;
    }

    if(this.cursor.length === 0) {
      const material = new THREE.MeshBasicMaterial(
        {color: 0xff0000, side: THREE.DoubleSide});

      const geometry = new THREE.Geometry();
      for(let p = 0; p < 3 * 4; p++) {
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));
      }
      for(let f = 0; f < 3 * 4; f += 3) {
        const newFace = new THREE.Face3(f + 0, f + 1, f + 2);
        geometry.faces.push(newFace);
      }

      const cursor = new THREE.Mesh( geometry, material );
      // cursor.renderOrder = 999;
      // cursor.material.depthTest = true;
      this.cursor.push(cursor);
      this.add(cursor);
    }

    const point0 = new THREE.Vector3(0, 0, 0);
    const point1 = new THREE.Vector3(0, 0, 0);
    const point2 = new THREE.Vector3(0, 0, 0);

    point0.copy(face.points[0].point);
    point1.copy(face.points[1].point);
    point2.copy(face.points[2].point);

    const cursorFloatHeight = 0.01;  // (km)
    let height = Math.max(sealevel, face.points[0].height);
    height = Math.max(height, face.points[1].height);
    height = Math.max(height, face.points[2].height);
    height *= heightMultiplier;

    point0.setLength(earthRadius * (height + 1) + cursorFloatHeight);
    point1.setLength(earthRadius * (height + 1) + cursorFloatHeight);
    point2.setLength(earthRadius * (height + 1) + cursorFloatHeight);

    const origin = new THREE.Vector3(0, 0, 0);

    this.cursor[0].geometry.vertices[0] = origin;
    this.cursor[0].geometry.vertices[1] = point0;
    this.cursor[0].geometry.vertices[2] = point1;

    this.cursor[0].geometry.vertices[3] = origin;
    this.cursor[0].geometry.vertices[4] = point1;
    this.cursor[0].geometry.vertices[5] = point2;

    this.cursor[0].geometry.vertices[6] = origin;
    this.cursor[0].geometry.vertices[7] = point2;
    this.cursor[0].geometry.vertices[8] = point0;

    this.cursor[0].geometry.vertices[9] = point0;
    this.cursor[0].geometry.vertices[10] = point1;
    this.cursor[0].geometry.vertices[11] = point2;

    this.cursor[0].geometry.verticesNeedUpdate = true;
    this.cursor[0].geometry.elementsNeedUpdate = true;
  }

  public clearCursor() {
    const origin = new THREE.Vector3(0, 0, 0);
    this.cursor.forEach((line) => {
      // line.setStart(origin);
      // line.setEnd(origin);
    });
  }

  public makeTileLabel(indexHigh: number,
                       indexLow: number,
                       recursion: number) {
    return "tile_" + indexHigh + "_" + indexLow + "_" + recursion;
  }

  /* Get a point on surface directly below the specified one. */
  public getSurfaceUnderPoint(label: string,
                           point: THREE.Vector3,
                           recursion: number) {
    this.worker.port.postMessage(
      ["getSurfaceUnderPoint", label, point, recursion]);
  }

  protected getFaceUnderMouse(mouseRay: ICustomInputEvent, recursion: number) {
    this.worker.port.postMessage(["getFaceUnderMouse", mouseRay, recursion]);
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

  private addGenerateTileTask(task: IGenerateTileTask) {
    if(this.workQueue[task.recursion] === undefined) {
      this.workQueue[task.recursion] = {};
    }
    const label = this.makeTileLabel(task.indexHigh,
                                     task.indexLow,
                                     task.recursion);
    task.type = "generateTile";
    if(this.workQueue[task.recursion][label] !== undefined) {
      task.neighbours =
        task.neighbours || this.workQueue[task.recursion][label].neighbours;
      task.children =
        task.children || this.workQueue[task.recursion][label].children;
    }
    // console.log("addGenerateTileTask(", task, ")");
    this.workQueue[task.recursion][label] = task;
  }

  private getGenerateTileTask() {
    let returnval = { type: null, indexHigh: 0,
        indexLow: 0, recursion: 0,
        neighbours: false, children: false};
    this.workQueue.forEach((jobList) => {
      if(returnval.type === null) {
        const key = Object.keys(jobList)[0];
        if(key !== undefined) {
          returnval = jobList[key];
          delete jobList[key];
        }
      }
    });
    return returnval;
  }

  private doWork() {
    let testStr = "";
    this.workQueue.forEach((tiles, index) => {
      testStr += ", " + index + ":" + Object.keys(tiles).length;
    });
    console.log("doWork()", testStr);

    if(this.lockWorkQueue) {
      return;
    }
    const job = this.getGenerateTileTask();
    if(job.type === null) {
      return;
    }
    this.lockWorkQueue = true;

    const tileLabel = this.makeTileLabel(job.indexHigh,
                                         job.indexLow,
                                         job.recursion);
    const tile = this.findMesh(tileLabel);
    if(tile === undefined ||
        tile.userData.complete !== true ||
        tile.userData.neighbours.length < 10) {
      // Since it is still pending, put this back in to the queue.
      this.addGenerateTileTask(job);
    }

    let lastParentLabel = "";
    for(let r = 0; r <= job.recursion; r++) {
      console.log("  ", r);
      let parentHigh = job.indexHigh;
      let parentLow = job.indexLow;
      [parentHigh, parentLow] =
        Module.IndexAtRecursion(parentHigh, parentLow, r);
      const parentLabel = this.makeTileLabel(parentHigh, parentLow, r);
      const parentTile = this.findMesh(parentLabel);

      if(parentTile === undefined) {
        // TODO: generate this tile.
        console.log("  generate tile", parentLabel);
        this.generateTile(lastParentLabel, parentHigh, parentLow, r);
        break;
      } else if(parentTile.userData.neighbours.length === 0 ||
                parentTile.userData.complete !== true) {
        // Waiting for this parent to complete.
        console.log("  Waiting to complete", parentLabel);
        break;
      }

      if(job.neighbours) {
        for(const neighbour of parentTile.userData.neighbours) {
          const neighbourLabel =
            this.makeTileLabel(neighbour.indexHigh, neighbour.indexLow, r);
          const neighbourTile = this.findMesh(neighbourLabel);
          if(neighbourTile === undefined) {
            console.log("  generate neighbour", neighbourLabel);
            neighbour.neighbours = false;
            neighbour.children = job.children;
            this.addGenerateTileTask(neighbour);
          } else if(neighbourTile.userData.complete !== true) {
            // Waiting for this tile to complete.
            console.log("  Waiting for neighbour", neighbourLabel);
          }
        }
      }

      if(job.children && this.generateTileLevel > r) {
        for(let c = 0; c < 4; c++) {
          const child =
            Module.IndexOfChild(job.indexHigh, job.indexLow, r, c);
          const childLabel = this.makeTileLabel(child[0], child[1], r +1);
          const childTile = this.findMesh(childLabel);
          if(childTile === undefined) {
            console.log("  generate child", parentLabel, childLabel, child);
            this.addGenerateTileTask({indexHigh: child[0],
                                      indexLow: child[1],
                                      recursion: r +1,
                                      neighbours: false,
                                      children: false});
            // break;
          } else if(childTile.userData.complete !== true) {
            console.log("  Waiting for child", parentLabel, childLabel);
            // break;
          }
        }
      }
      lastParentLabel = parentLabel;
    }

    window.setTimeout(function(){ this.doWork(); }.bind(this), 20);

    this.lockWorkQueue = false;
  }

  private generateTile(parentLabel: string,
                       indexHigh: number,
                       indexLow: number,
                       recursion: number) {
    let iHigh = indexHigh;
    let iLow = indexLow;
    [iHigh, iLow] = Module.IndexAtRecursion(iHigh, iLow, recursion);

    let depth = recursion + 4;
    if(recursion < 5) {
      depth = recursion +2;
    }

    const label = this.makeTileLabel(iHigh, iLow, recursion);
    if(this.findMesh(label)) {
      console.log("Already created: ", label);
      return;
    }

    const mesh = new WorldTile(label,
                               this.worker,
                               indexHigh,
                               indexLow,
                               recursion,
                               depth,
                               parentLabel);
    this.setMesh(mesh);
    mesh.visible = this.activeTileLevels[mesh.userData.recursion];
  }

  private initWorker() {
    this.worker.port.addEventListener("message",
                                      this.workerCallback.bind(this));
  }

  private workerCallback(event) {  // TODO: event type.
    let tileLabel;
    let tileMesh;
    switch(event.data[0]) {
      case "getNeighbours":
        console.log("callback: getNeighbours");
        tileLabel = this.makeTileLabel(event.data[1],
                                       event.data[2],
                                       event.data[3]);
        tileMesh = this.findMesh(tileLabel);
        tileMesh.userData.neighbours = event.data[4];
        break;
      case "generateTerrain":
        console.log("callback: generateTerrain");
        tileLabel = this.makeTileLabel(event.data[1],
                                       event.data[2],
                                       event.data[3]);
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
        break;
      case "getFaceUnderMouse":
        this.faceUnderMouse = event.data[3];
        this.setCursor(this.faceUnderMouse);
        break;
    }
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
              private worker,
              private indexHigh: number,
              private indexLow: number,
              private recursion: number,
              private requiredDepth: number,
              private parentLabel: string) {
    super(label);
    this.userData.indexHigh = indexHigh;
    this.userData.indexLow = indexLow;
    this.userData.recursion = recursion;
    this.userData.requiredDepth = requiredDepth;
    this.userData.parentLabel = parentLabel;
    this.userData.neighbours = [];  // TODO: Type.
    this.userData.children = [];

    this.changeMaterial();

    let skirt = false;
    if(recursion > 5) {
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
