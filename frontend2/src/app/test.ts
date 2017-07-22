/// <reference path='../../node_modules/@types/three/index.d.ts' />

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
    // console.log("Camera.service()", this.userInput);
    while (this.userInput.length) {
      const input = this.userInput.pop();
      console.log(input);
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
    if (!this.width) {
      this.width = window.innerWidth;
    }
    if (!this.height) {
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
    if (this.scene && this.camera) {
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
    if (now - this.lastUpdate > 1000) {
      console.log("ERROR: Scene last update more than 1second ago.");
      this.lastUpdate = now;
    }
    while (this.lastUpdate < now - timeStep) {
      this.lastUpdate += timeStep;
      for (const mesh in this.meshes) {
        if (this.meshes.hasOwnProperty(mesh)) {
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
  constructor(public label: string) {
    super(label);
    this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
    this.material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
  }

  public service() {
    this.rotation.x += 0.01;
    this.rotation.y += 0.01;
  }
}

function init() {
  const camera = new Camera("camera_1");
  const scene = new Scene();
  const renderer = new Renderer("renderer1");

  const mesh1 = new Box("mesh1");
  scene.setMesh(mesh1);

  renderer.setScene(scene);
  renderer.setCamera(camera);

  MainLoop.renderers.push(renderer);
  MainLoop.startRendering();

  const keyboard = new UIKeyboard();
}


window.onload = () => {
  init();
};

