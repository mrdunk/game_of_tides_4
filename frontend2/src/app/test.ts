/// <reference path='../../node_modules/@types/three/index.d.ts' />

// Diagram showing how Threejs components fits together:
// http://davidscottlyons.com/threejs/presentations/frontporch14/#slide-16


const timeStep = 1000 / 60;
const maxFps = 65;


class Camera extends THREE.PerspectiveCamera {
  private userInput: string[] = [];

  constructor(public label: string) {
    super( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.position.z = 4;

    UIMaster.clientMessageQueues.push(this.userInput);
  }

  public service() {
    while (this.userInput.length) {
      const input = this.userInput.pop();
    }
  }
}

class Renderer extends THREE.WebGLRenderer {
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
    document.getElementById(label).appendChild(this.domElement);
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
  private userInput: string[] = [];
  private materialIndex: number = -1;
  private materialIndexChanged: number = 0;
  private animate: boolean = true;
  private animateChanged: number = 0;

  constructor(public label: string) {
    super(label);
    this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
    this.changeMaterial();

    UIMaster.clientMessageQueues.push(this.userInput);
  }

  public service() {
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input) {
        case "c":
          this.changeMaterial();
          break;
        case "b":
          if(Date.now() - this.animateChanged < 200) {
            // Debounce input.
            return;
          }
          this.animateChanged = Date.now();
          this.animate = !this.animate;
          break;
        case "ArrowRight":
          if(this.animate) {
            this.rotation.y -= 0.01;
          }
          break;
        case "ArrowLeft":
          if(this.animate) {
            this.rotation.y += 0.01;
          }
          break;
        case "ArrowUp":
          if(this.animate) {
            this.rotation.x += 0.01;
          }
          break;
        case "ArrowDown":
          if(this.animate) {
            this.rotation.x -= 0.01;
          }
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

function init() {
  const camera = new Camera("camera_1");
  const scene = new Scene();
  const renderer = new Renderer("renderer1");

  const mesh1 = new Box("mesh1");
  scene.setMesh(mesh1);

  const light = new THREE.PointLight(0xffffff);
  light.position.set(-10,20,10);
  scene.add(light);
  const ambientLight = new THREE.AmbientLight( 0x444444 );
  scene.add(ambientLight);

  renderer.setScene(scene);
  renderer.setCamera(camera);

  MainLoop.renderers.push(renderer);
  MainLoop.startRendering();

  const keyboard = new UIKeyboard();

  const fpsWidget = new StatusWidget("top", "right");
}


window.onload = () => {
  init();
};

