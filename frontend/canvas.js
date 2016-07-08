// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global THREE*/

var Viewport = function(width, height, camera) {
  this.renderer = new THREE.WebGLRenderer({antialias: true});
  this.renderer.setClearColor(0xcccccc);
  this.renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(this.renderer.domElement);

  var _this = this;

  this.setSize = function(width, height) {
    _this.renderer.setSize(width, height);
    _this.camera.aspect = width / height;
    _this.camera.updateProjectionMatrix();
  };

  this.setScene = function(scene) {
    _this.scene = scene;
  };

  this.render = function() {
    if (typeof _this.scene === 'undefined' ||
        typeof _this.camera === 'undefined') {
      console.log('Error: Secene or camera missing!');
      return;
    }
    _this.renderer.render(_this.scene.scene, _this.camera);
  };

  if (typeof camera !== 'undefined') {
    this.camera = camera;
  } else {
    this.camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;
  }

  if (width && height) {
    this.setSize(width, height);
  } else {
    this.setSize(window.innerWidth, window.innerHeight);
  }

  if (typeof landscape !== 'undefined') {
    _this.setScene(landscape);
  }
};

var landscape;

var Scene = function(vertices) {
  var geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
  var material = new THREE.MeshBasicMaterial({color: 0xff0000});
  material.wireframe = true;
  var mesh = new THREE.Mesh(geometry, material);

  this.scene = new THREE.Scene();
  this.scene.add(mesh);
};

var camera1 = new THREE.PerspectiveCamera(75, 100, 100, 0.1, 1000);
camera1.position.z = 5;
var camera2 = new THREE.PerspectiveCamera(75, 100, 100, 0.1, 1000);
camera2.position.z = 2;

var default_view = new Viewport(window.innerWidth, window.innerHeight / 2, camera1);
var second_view = new Viewport(window.innerWidth / 4, window.innerHeight / 4, camera2);
