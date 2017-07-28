// Copyright 2017 duncan law (mrdunk@gmail.com)
/// <reference path='../../node_modules/@types/three/index.d.ts' />
/// <reference path='../../build/wrap_terrain.js' />

// Diagram showing how Threejs components fits together:
// http://davidscottlyons.com/threejs/presentations/frontporch14/#slide-16

declare var Module: {
  DataSourceGenerate: () => void;
};

interface MouseRay {
  type: string;
  origin: number[];
  direction: number[];
  shiftKey?: number;
  ctrlKey?: number;
  altKey?: number;
  key?: string;
}


class Camera extends THREE.PerspectiveCamera {
  public lat: number = 0;
  public lon: number = 0;
  public pitch: number = 0;
  public yaw: number = 0;
  public distance: number = 20000;
  public userInput: Array<KeyboardEvent | MouseRay> = [];
  private animate: boolean = true;
  private animateChanged: number = 0;

  constructor(public label: string) {
    super( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
    this.position.z = this.distance;

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
              // this.rotation.y -= 0.01;
              this.yaw -= 0.01;
              this.updatePos();
            } else {
              this.lon += 1;
              this.updatePos();
            }
          }
          break;
        case "ArrowLeft":
          if(this.animate) {
            if(input.shiftKey) {
              // this.rotation.y += 0.01;
              this.yaw += 0.01;
              this.updatePos();
            } else {
              this.lon -= 1;
              this.updatePos();
            }
          }
          break;
        case "ArrowUp":
          if(this.animate) {
            if(input.shiftKey) {
              // this.rotation.x += 0.01;
              this.pitch += 0.01;
              this.updatePos();
            }else if(input.ctrlKey) {
              this.distance -= 100;
              this.updatePos();
            } else {
              this.lat += 1;
              this.updatePos();
            }
          }
          break;
        case "ArrowDown":
          if(this.animate) {
            if(input.shiftKey) {
              // this.rotation.x -= 0.01;
              this.pitch -= 0.01;
              this.updatePos();
            }else if(input.ctrlKey) {
              this.distance += 100;
              this.updatePos();
            } else {
              this.lat -= 1;
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
      }
    }
  }

  public updatePos() {
    if(this.lat > 90) { this.lat = 90; }
    if(this.lat < -90) { this.lat = -90; }
    if(this.lon > 180) { this.lon -= 360; }
    if(this.lon < -180) { this.lon += 360; }

    const lat = 90 - this.lat;
    const lon = this.lon + 90;
    const origin = new THREE.Vector3(0,0,0);

    this.position.x =
      -((this.distance) * Math.sin(THREE.Math.degToRad(lat)) *
                          Math.cos(THREE.Math.degToRad(lon)));
    this.position.z =
      ((this.distance) * Math.sin(THREE.Math.degToRad(lat)) *
                         Math.sin(THREE.Math.degToRad(lon)));
    this.position.y =
      ((this.distance) * Math.cos(THREE.Math.degToRad(lat)));

    this.lookAt(origin);
    this.rotateZ(this.yaw);
    this.rotateX(this.pitch);

  }
}

class Renderer extends THREE.WebGLRenderer {
  public element: HTMLElement;
  public userInput: Array<KeyboardEvent | MouseRay> = [];
  private scene: Scene;
  private camera: Camera;

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
    const userInput = this.userInput.slice();  // Copy array.
    while (userInput.length) {
      const input = userInput.pop();
      switch(input.key || input.type) {
        case "mousemove":
          this.userInput.push(this.getMouseRay(input));
          break;
      }
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
    return {type: "mouseray", origin: origin, direction: direction};
  }
}

interface MeshesEntry {
  mesh?: Mesh;
  children: {};
}

abstract class Scene extends THREE.Scene {
  public userInput: Array<KeyboardEvent | MouseRay> = [];
  public meshes: MeshesEntry = {children: {}};
  public activeMeshes: {} = {};
  private lastUpdate: number = Date.now();
  private cursor: {} = {};

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

  public setMesh(mesh: Mesh, parentLabel?: string) {
    // console.log("Scene.setMesh(", mesh, parentLabel, ")");
    const findMesh = (label: string, meshes: MeshesEntry) => {
      for(const l in meshes.children) {
        if(meshes.children.hasOwnProperty(l)) {
          if(l === label) {
            return meshes.children[l];
          }
          meshes = findMesh(label, meshes);
        }
      }
    };

    let parentMeshes = this.meshes;
    if(parentLabel) {
      parentMeshes = findMesh(parentLabel, this.meshes);
    }

    parentMeshes.children[mesh.label] = {mesh: mesh, children: {}};
    this.activeMeshes[mesh.label] = parentMeshes.children[mesh.label].mesh;
    this.add( mesh );

    console.log(this.meshes);
  }

  public setCursor(point: THREE.Vector3, id: number = 0) {
    let cursor = this.cursor[id];
    if(!cursor) {
      cursor = new Line(new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 0, 0));
      this.cursor[id] = cursor;
      this.add(cursor);
    }

    point.setLength(point.length() * 2);
    cursor.setEnd(point);
  }

  public clearCursor(id: number = 0) {
    const cursor = this.cursor[id];
    if(cursor) {
      cursor.setEnd(new THREE.Vector3(0, 0, 0));
    }
  }

  public service(now: number) {
    if(now - this.lastUpdate > 1000) {
      console.log("ERROR: Scene last update more than 1 second ago.");
      this.lastUpdate = now;
    }
    while(this.lastUpdate < now - timeStep) {
      this.lastUpdate += timeStep;
      for(const mesh in this.activeMeshes) {
        if(this.activeMeshes.hasOwnProperty(mesh)) {
          this.activeMeshes[mesh].userInput = this.userInput.slice();  // Copy.
          this.activeMeshes[mesh].service();
        }
      }
    }

    // Copy this.userInput so inherited classes get the original.
    const userInput = this.userInput.slice();

    while (userInput.length) {
      const input = userInput.pop();
      switch(input.key || input.type) {
        case "mouseray":
          this.getFaceUnderMouse(input as MouseRay);
          break;
      }
    }
  }

  protected abstract getFaceUnderMouse(input: MouseRay): void;
}

class World extends Scene {
  constructor(public label: string, private terrainGenerator) {
    super(label);

    window.addEventListener("beforeunload", (event) => {
      // Try to Enscripten cleanup memory allocation before page reload.
      // TODO: Does this work?
      console.log("Reloading page");
      for(const mesh in this.meshes) {
        if(this.meshes.hasOwnProperty(mesh)) {
          this.meshes[mesh].dispose();
          this.meshes[mesh] = null;
        }
      }
      this.terrainGenerator.delete();
      console.log("done cleanup");
    });

    this.terrainGenerator.MakeCache();

    for(let section = 0; section < 8; section++) {
      const rootFace = section * Math.pow(2, 29);
      const mesh = new WorldTile("tile_" + rootFace + "_0_4",
                                     this.terrainGenerator,
                                     rootFace,
                                     0,
                                     0,
                                     4);
      this.setMesh(mesh);
    }
  }

  public service(now: number) {
    super.service(now);
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key || input.type) {
        case "mousedown":
          // TESTING
          console.log("mouseclick");
          const faceId = 0;
          const mesh = new WorldTile("tile_" + faceId + "_1_5",
                                         this.terrainGenerator,
                                         faceId,
                                         0,
                                         1,
                                         5);
          this.setMesh(mesh, "tile_0_0_4");
          break;
      }
    }
  }

  public showTile(faceIndexHigh: number,
                  faceIndexLow: number,
                  recursionStart: number,
                  requiredDepth: number) {

  }

  protected getFaceUnderMouse(mouseRay: MouseRay ) {
    const face = this.terrainGenerator.rayCrossesFace(mouseRay.origin,
                                                      mouseRay.direction,
                                                      7);
    if(face) {
      const surfacePoint0 = new THREE.Vector3(face.points[0][0],
                                              face.points[0][1],
                                              face.points[0][2]);
      const surfacePoint1 = new THREE.Vector3(face.points[1][0],
                                              face.points[1][1],
                                              face.points[1][2]);
      const surfacePoint2 = new THREE.Vector3(face.points[2][0],
                                              face.points[2][1],
                                              face.points[2][2]);
      this.setCursor(surfacePoint0, 0);
      this.setCursor(surfacePoint1, 1);
      this.setCursor(surfacePoint2, 2);
      face.delete();
    } else {
      this.clearCursor(0);
      this.clearCursor(1);
      this.clearCursor(2);
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

  public setEnd(point: THREE.Vector3) {
    this.geometry.vertices[1] = point;
    this.geometry.verticesNeedUpdate = true;
  }
}

abstract class Mesh extends THREE.Mesh {
  // Disable typechecking for "material" as the .wireframe exists for all
  // material types we are using.
  public material: any;

  public userInput: Array<KeyboardEvent | MouseRay> = [];

  private materialIndex: number = -1;
  private materialIndexChanged: number = 0;

  constructor(public label: string) {
    super();
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

  protected changeMaterial() {
    if(Date.now() - this.materialIndexChanged < 200) {
      // Debounce input.
      return;
    }
    this.materialIndexChanged = Date.now();

    if(++this.materialIndex >= 5) {
      this.materialIndex = 0;
    }
    switch(this.materialIndex) {
      case 0:
        // this.material = new THREE.MeshLambertMaterial({color: 0x55B663});
        this.material = new THREE.MeshLambertMaterial({
          vertexColors: THREE.VertexColors});
        break;
      case 1:
        this.material.wireframe = true;
        break;
      case 2:
        this.material = new THREE.MeshBasicMaterial({color: 0x433F81});
        break;
      case 3:
        this.material = new THREE.MeshNormalMaterial({side : THREE.DoubleSide,
                                                      wireframeLinewidth: 1});
        break;
      case 4:
        this.material.wireframe = true;
        break;
    }
  }
}

class Box extends Mesh {
  constructor(public label: string) {
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
  constructor(public label: string,
              private terrainGenerator,
              public faceIndexHigh: number,
              public faceIndexLow: number,
              public recursionStart: number,
              public requiredDepth: number) {
    super(label);

    this.changeMaterial();
    this.generateTerrain();
  }

  public generateTerrain() {
    console.log(this.faceIndexHigh,
      this.faceIndexLow,
      this.recursionStart,
      this.requiredDepth);

    const faces = this.terrainGenerator.getFaces(this.faceIndexHigh,
                                                 this.faceIndexLow,
                                                 this.recursionStart,
                                                 this.requiredDepth);
    const facesAndSkirt = this.terrainGenerator.getFacesAndSkirt(faces);

    // Finished generating faces so clear some memory.
    this.terrainGenerator.cleanCache(20000000);

    const vertices = new Float32Array(facesAndSkirt.size() * 3 * 3);
    const normals = new Float32Array(facesAndSkirt.size() * 3 * 3);
    const colors = new Uint8Array(facesAndSkirt.size() * 3 * 3);

    let highest = 0;
    let lowest = 255;

    const sealevel = 80;

    for(let i = 0; i < facesAndSkirt.size(); i++) {
      const face = facesAndSkirt.get(i);
      for(let point=0; point<3; point++) {
        let height = face.heights[point] * 255 / 3;
        if(height < 0) {
          height = 0;
        }
        if(height > highest) {
          highest = height;
        }
        if(height < lowest) {
          lowest = height;
        }
        if(height >= sealevel) {
          colors[(i * 9) + (point * 3) + 0] = height /2;
          colors[(i * 9) + (point * 3) + 1] = height;
          colors[(i * 9) + (point * 3) + 2] = height /2;
        } else {
          colors[(i * 9) + (point * 3) + 0] = height /2;
          colors[(i * 9) + (point * 3) + 1] = height /2;
          colors[(i * 9) + (point * 3) + 2] = height;
        }

        if(height < sealevel) {
          height = sealevel;
        }
        for(let coord=0; coord<3; coord++) {
          vertices[(i * 9) + (point * 3) + coord] =
            face.points[point][coord] * (1 + (height * 0.0001));
          // colors[(i * 9) + (point * 3) + coord] = Math.random() * 255;
        }
      }

      // Compute Vertex Normals as Face Normals.
      // (ie, all 3 vertex normals are the same.)
      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();
      vA.fromArray(face.points[0]);
      vB.fromArray(face.points[1]);
      vC.fromArray(face.points[2]);
      vB.sub(vA);
      vC.sub(vA);
      vB.cross(vC);
      vB.normalize();
      for(let point=0; point<3; point++) {
        normals[(i * 9) + (point * 3) + 0] = vB.x;
        normals[(i * 9) + (point * 3) + 1] = vB.y;
        normals[(i * 9) + (point * 3) + 2] = vB.z;
      }
      face.delete();
    }

    console.log("highest: ", highest);
    console.log("lowest: ", lowest);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute("position",
                               new THREE.BufferAttribute(vertices, 3));
    this.geometry.addAttribute("color",
                               new THREE.BufferAttribute(colors, 3, true));
    this.geometry.addAttribute("normal",
                               new THREE.BufferAttribute(normals, 3, true));

    faces.delete();
    facesAndSkirt.delete();
  }

  public service() {
    // TODO: Should this actually happen for each mesh or for the whole scene?
    while (this.userInput.length) {
      const input = this.userInput.pop();
      // console.log(input.type, input.key);
      switch(input.key || input.type) {
        case "c":
          this.changeMaterial();
          break;
      }
    }
  }
}
