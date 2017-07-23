/// <reference path='../../node_modules/@types/three/index.d.ts' />

// Diagram showing how Threejs components fits together:
// http://davidscottlyons.com/threejs/presentations/frontporch14/#slide-16


class Camera extends THREE.PerspectiveCamera {
  public lat: number = 0;
  public lon: number = 0;
  public distance: number = 4;
  private userInput: KeyboardEvent[] = [];
  private animate: boolean = true;
  private animateChanged: number = 0;

  constructor(public label: string) {
    super( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.position.z = 4;

    UIMaster.clientMessageQueues.push(this.userInput);
    this.updatePos();
  }

  public service() {
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key) {
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
              this.rotation.y -= 0.01;
            } else {
              this.lon += 1;
              this.updatePos();
            }
          }
          break;
        case "ArrowLeft":
          if(this.animate) {
            if(input.shiftKey) {
              this.rotation.y += 0.01;
            } else {
              this.lon -= 1;
              this.updatePos();
            }
          }
          break;
        case "ArrowUp":
          if(this.animate) {
            if(input.shiftKey) {
              this.rotation.x += 0.01;
            } else {
              this.lat += 1;
              this.updatePos();
            }
          }
          break;
        case "ArrowDown":
          if(this.animate) {
            if(input.shiftKey) {
              this.rotation.x -= 0.01;
            } else {
              this.lat -= 1;
              this.updatePos();
            }
          }
          break;
        case " ":
          if(this.animate) {
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
  }
}

class Renderer extends THREE.WebGLRenderer {
  public element: HTMLElement;
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
    this.element = document.getElementById(label);
    this.element.appendChild(this.domElement);
  }

  public setScene(scene: Scene) {
    this.scene = scene;
    this.service(new Date().getTime());
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
    this.service(new Date().getTime());
  }

  public service(now: number) {
    if(this.scene && this.camera) {
      this.scene.service(now);
      this.camera.service();
      this.render(this.scene, this.camera);
    }
  }
}

class Scene extends THREE.Scene {
  private meshes: {};
  private lastUpdate: number;

  constructor() {
    super();
    this.meshes = {};
    this.lastUpdate = new Date().getTime();

    const light = new THREE.PointLight(0xffffff);
    light.position.set(0,0,100);
    this.add(light);
    const twighLight1 = new THREE.PointLight(0x444455);
    twighLight1.position.set(100,50,-20);
    this.add(twighLight1);
    const twighLight2 = new THREE.PointLight(0x554444);
    twighLight2.position.set(-100,-50,-20);
    this.add(twighLight2);
    // const ambientLight = new THREE.AmbientLight(0x444444);
    // this.add(ambientLight);
  }

  public setMesh(mesh: Mesh) {
    this.meshes[mesh.label] = mesh;
    this.add( mesh );
  }

  public service(now: number) {
    if(now - this.lastUpdate > 1000) {
      console.log("ERROR: Scene last update more than 1 second ago.");
      this.lastUpdate = now;
    }
    while(this.lastUpdate < now - timeStep) {
      this.lastUpdate += timeStep;
      for(const mesh in this.meshes) {
        if(this.meshes.hasOwnProperty(mesh)) {
          this.meshes[mesh].service();
        }
      }
    }
  }
}

abstract class Mesh extends THREE.Mesh {
  constructor(public label: string) {
    super();
  }

  public abstract service(): void;
}

class Box extends Mesh {
  private userInput: KeyboardEvent[] = [];
  private materialIndex: number = -1;
  private materialIndexChanged: number = 0;

  constructor(public label: string) {
    super(label);
    this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
    this.changeMaterial();

    UIMaster.clientMessageQueues.push(this.userInput);
  }

  public service() {
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key) {
        case "c":
          this.changeMaterial();
          break;
      }
    }
  }

  private changeMaterial() {
    if(Date.now() - this.materialIndexChanged < 200) {
      // Debounce input.
      return;
    }
    this.materialIndexChanged = Date.now();

    if(++this.materialIndex >= 3) {
      this.materialIndex = 0;
    }
    switch(this.materialIndex) {
      case 0:
        this.material = new THREE.MeshLambertMaterial({color: 0x55B663});
        break;
      case 1:
        this.material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
        break;
      case 2:
        this.material = new THREE.MeshNormalMaterial();
    }
  }
}


