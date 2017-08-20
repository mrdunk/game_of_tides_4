// Copyright 2017 duncan law (mrdunk@gmail.com)
/// <reference path='../../node_modules/@types/three/index.d.ts' />
/// <reference path='../../build/wrap_terrain.js' />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// Helpful diagram showing how Threejs components fits together:
// http://davidscottlyons.com/threejs/presentations/frontporch14/#slide-16
var heightMultiplier = 2;
var sealevel = 0.001; // Ratio of planets diameter.
var earthRadius = 6371; // km.
var cameraInitialDistance = 10000 * 1;
var skyColor = 0x90A0C0;
function makeTileLabel(face) {
    return "tile_" +
        face.indexHigh + "_" + face.indexLow + "_" + face.recursion;
}
function getParentLabel(face) {
    if (face.recursion === 0) {
        return "";
    }
    var indexHigh;
    var indexLow;
    _a = Module.IndexAtRecursion(face.indexHigh, face.indexLow, face.recursion - 1), indexHigh = _a[0], indexLow = _a[1];
    return makeTileLabel({ indexHigh: indexHigh, indexLow: indexLow, recursion: face.recursion - 1 });
    var _a;
}
var Camera = (function (_super) {
    __extends(Camera, _super);
    function Camera(label) {
        var _this = _super.call(this, 75, window.innerWidth / window.innerHeight, 100, cameraInitialDistance * 2) || this;
        _this.label = label;
        _this.lat = 0;
        _this.lon = 0;
        _this.pitch = 0;
        _this.yaw = 0;
        _this.distance = cameraInitialDistance;
        _this.userInput = [];
        _this.animate = true;
        _this.animateChanged = 0;
        _this.surfaceHeight = earthRadius;
        _this.position.z = _this.distance + _this.surfaceHeight;
        _this.updatePos();
        return _this;
    }
    Camera.prototype.service = function () {
        while (this.userInput.length) {
            var input = this.userInput.pop();
            switch (input.key || input.type) {
                case "C":
                    if (Date.now() - this.animateChanged < 200) {
                        // Debounce input.
                        return;
                    }
                    this.animateChanged = Date.now();
                    this.animate = !this.animate;
                    break;
                case "ArrowRight":
                    if (this.animate) {
                        if (input.shiftKey) {
                            this.yaw -= 0.01;
                            this.updatePos();
                        }
                        else {
                            this.lon += this.distance / cameraInitialDistance;
                            this.updatePos();
                        }
                    }
                    break;
                case "ArrowLeft":
                    if (this.animate) {
                        if (input.shiftKey) {
                            this.yaw += 0.01;
                            this.updatePos();
                        }
                        else {
                            this.lon -= this.distance / cameraInitialDistance;
                            this.updatePos();
                        }
                    }
                    break;
                case "ArrowUp":
                    if (this.animate) {
                        if (input.shiftKey) {
                            this.pitch += 0.01;
                            this.updatePos();
                        }
                        else if (input.ctrlKey) {
                            this.distance /= 1.1;
                            this.updatePos();
                        }
                        else {
                            this.lat += this.distance / cameraInitialDistance;
                            this.updatePos();
                        }
                    }
                    break;
                case "ArrowDown":
                    if (this.animate) {
                        if (input.shiftKey) {
                            this.pitch -= 0.01;
                            this.updatePos();
                        }
                        else if (input.ctrlKey) {
                            this.distance *= 1.1;
                            this.updatePos();
                        }
                        else {
                            this.lat -= this.distance / cameraInitialDistance;
                            this.updatePos();
                        }
                    }
                    break;
                case " ":
                    if (this.animate) {
                        this.pitch = 0;
                        this.yaw = 0;
                        this.updatePos();
                    }
                    break;
                case "cameraabove":
                    this.faceOver = input.face;
                    var point = new THREE.Vector3();
                    point.fromArray(input.origin);
                    var height = Math.max(sealevel, input.value);
                    var multiplier = 1 + (height * heightMultiplier);
                    this.surfaceHeight = point.length() * multiplier;
                    this.updatePos();
                    break;
            }
        }
    };
    Camera.prototype.updatePos = function () {
        if (this.lat > 90) {
            this.lat = 90;
        }
        if (this.lat < -90) {
            this.lat = -90;
        }
        if (this.lon > 180) {
            this.lon -= 360;
        }
        if (this.lon < -180) {
            this.lon += 360;
        }
        if (this.distance < 0.01) {
            this.distance = 0.01;
        }
        var lat = 90 - this.lat;
        var lon = this.lon + 90;
        var origin = new THREE.Vector3(0, 0, 0);
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
    };
    return Camera;
}(THREE.PerspectiveCamera));
var Renderer = (function (_super) {
    __extends(Renderer, _super);
    function Renderer(label, width, height) {
        var _this = _super.call(this, { antialias: true }) || this;
        _this.label = label;
        _this.width = width;
        _this.height = height;
        _this.userInput = [];
        _this.lastCameraPos = new THREE.Vector3(0, 0, 0);
        if (!_this.width) {
            _this.width = window.innerWidth;
        }
        if (!_this.height) {
            _this.height = window.innerHeight;
        }
        _this.setSize(_this.width, _this.height);
        _this.setPixelRatio(window.devicePixelRatio);
        _this.element = document.getElementById(label);
        _this.element.appendChild(_this.domElement);
        UIMaster.clientMessageQueues.push(_this.userInput);
        window.onresize = _this.changeSize.bind(_this);
        return _this;
    }
    Renderer.prototype.changeSize = function () {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.setSize(this.width, this.height);
        this.setPixelRatio(window.devicePixelRatio);
        if (this.camera !== undefined) {
            this.camera.aspect = (this.width / this.height);
            this.camera.updatePos();
        }
    };
    Renderer.prototype.setScene = function (scene) {
        this.scene = scene;
        this.service(Date.now());
        this.initWorker();
    };
    Renderer.prototype.setCamera = function (camera) {
        this.camera = camera;
        this.camera.aspect = (this.width / this.height);
        this.service(Date.now());
    };
    Renderer.prototype.service = function (now) {
        // User input.
        for (var i = this.userInput.length - 1; i >= 0; i--) {
            // Remove mouse events destined for other HTML elements.
            //
            // If we use this.userInput.filter() here we cannot modify in place so
            // would have to replace UIMaster's reference to this.userInput.
            var target = this.userInput[i].target;
            if (target !== undefined && this.userInput[i] instanceof MouseEvent &&
                target.parentElement.id !== this.label) {
                this.userInput.splice(i, 1);
            }
        }
        var userInput = this.userInput.slice(); // Copy array.
        while (userInput.length) {
            var input = userInput.pop();
            switch (input.key || input.type) {
                case "mousemove":
                    this.userInput.push(this.getMouseRay(input));
                    break;
            }
        }
        this.getCameraAbovePoint();
        // Update dependants.
        if (this.scene && this.camera) {
            this.scene.userInput = this.userInput.slice(); // Copy array.
            this.camera.userInput = this.userInput.slice(); // Copy array.
            this.scene.service(now);
            this.camera.service();
            this.render(this.scene, this.camera);
            this.scene.setFog(this.camera.distance);
        }
        // Empty the user input buffer.
        this.userInput.splice(0, this.userInput.length);
    };
    Renderer.prototype.getMouseRay = function (event) {
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);
        var origin = [raycaster.ray.origin.x,
            raycaster.ray.origin.y,
            raycaster.ray.origin.z];
        var direction = [raycaster.ray.direction.x,
            raycaster.ray.direction.y,
            raycaster.ray.direction.z];
        return { type: "mouseray", origin: origin, direction: direction };
    };
    // Will be delegated to WebWorker. Result will be announced on the input bus.
    Renderer.prototype.getCameraAbovePoint = function () {
        if (this.camera === undefined) {
            return;
        }
        if (this.lastCameraPos.equals(this.camera.position)) {
            return;
        }
        this.lastCameraPos.copy(this.camera.position);
        this.scene.getSurfaceUnderPoint("cameraabove", this.camera.position, this.scene.cursorSize);
    };
    Renderer.prototype.initWorker = function () {
        this.scene.worker.port.addEventListener("message", this.workerCallback.bind(this));
    };
    Renderer.prototype.workerCallback = function (event) {
        switch (event.data[0]) {
            case "getSurfaceUnderPoint":
                // console.log("callback: getSurfaceUnderPoint", event.data);
                if (event.data[4] !== undefined) {
                    this.userInput.push({ type: event.data[1],
                        origin: [event.data[4].point.x,
                            event.data[4].point.y,
                            event.data[4].point.z],
                        value: event.data[4].height,
                        face: event.data[4].face });
                }
                break;
        }
    };
    return Renderer;
}(THREE.WebGLRenderer));
var Scene = (function (_super) {
    __extends(Scene, _super);
    function Scene(label, worker) {
        var _this = _super.call(this) || this;
        _this.label = label;
        _this.worker = worker;
        _this.generateTileLevel = 6;
        _this.userInput = [];
        _this.activeMeshes = {};
        _this.cursorSize = 6;
        _this.activeTileLevels = [];
        _this.cursor = new Cursor();
        _this.workQueue = [];
        _this.lockWorkQueue = false;
        _this.lastUpdate = Date.now();
        _this.fogDistance = 0;
        _this.materialIndex = 0;
        _this.setMaterialDabounce = 0;
        var light = new THREE.PointLight(0xffffff);
        light.position.set(0, 0, 2 * cameraInitialDistance);
        _this.add(light);
        var twighLight1 = new THREE.PointLight(0x444455);
        twighLight1.position.set(2 * cameraInitialDistance, cameraInitialDistance, -cameraInitialDistance / 10);
        _this.add(twighLight1);
        var twighLight2 = new THREE.PointLight(0x554444);
        twighLight2.position.set(-2 * cameraInitialDistance, -cameraInitialDistance, -cameraInitialDistance / 10);
        _this.add(twighLight2);
        var ambientLight = new THREE.AmbientLight(0x666666);
        _this.add(ambientLight);
        _this.background = new THREE.Color(skyColor);
        var axis = new Line(new THREE.Vector3(0, cameraInitialDistance, 0), new THREE.Vector3(0, -cameraInitialDistance, 0));
        _this.add(axis);
        _this.fog = new THREE.Fog(skyColor, 1, cameraInitialDistance);
        window.addEventListener("beforeunload", function (event) {
            // Try to cleanup memory allocation before page reload.
            console.log("Reloading page");
            for (var mesh in _this.activeMeshes) {
                if (_this.activeMeshes.hasOwnProperty(mesh) && _this.activeMeshes[mesh]) {
                    _this.activeMeshes[mesh].dispose();
                    delete _this.activeMeshes[mesh];
                }
            }
            console.log("done cleanup");
        });
        for (var section = 0; section < 8; section++) {
            var rootFace = section * Math.pow(2, 29);
            _this.addGenerateTileTask({ indexHigh: rootFace,
                indexLow: 0,
                recursion: 0,
                parent: true,
                neighbours: true,
                children: true });
        }
        _this.initWorker();
        _this.doTask();
        _this.add(_this.cursor);
        return _this;
    }
    Scene.prototype.setFog = function (distance) {
        if (distance < 10) {
            distance = 10;
        }
        var fogDistance = 20 * distance;
        if (fogDistance !== this.fogDistance) {
            this.fogDistance = fogDistance;
            this.fog.far = fogDistance;
        }
    };
    Scene.prototype.service = function (now) {
        if (now - this.lastUpdate > 1000) {
            console.log("ERROR: Scene last update more than 1 second ago.");
            this.lastUpdate = now;
        }
        while (this.lastUpdate < now - timeStep) {
            this.lastUpdate += timeStep;
            for (var mesh in this.activeMeshes) {
                if (this.activeMeshes.hasOwnProperty(mesh) && this.activeMeshes[mesh]) {
                    this.activeMeshes[mesh].userInput = this.userInput.slice(); // Copy.
                    this.activeMeshes[mesh].service();
                }
            }
        }
        while (this.userInput.length) {
            var input = this.userInput.pop();
            switch (input.key || input.type) {
                case "mousedown":
                    // TESTING
                    console.log("mouseclick", input);
                    if (this.faceUnderMouse) {
                        var high = void 0;
                        var low = void 0;
                        _a = Module.IndexAtRecursion(this.faceUnderMouse.indexHigh, this.faceUnderMouse.indexLow, this.generateTileLevel), high = _a[0], low = _a[1];
                        this.addGenerateTileTask({ indexHigh: high,
                            indexLow: low,
                            recursion: this.generateTileLevel,
                            parent: true,
                            neighbours: true,
                            children: true });
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
                    if (input.type === "menuevent") {
                        this.activeTileLevels[parseInt(input.key, 10)] =
                            input.value;
                        this.setAllTileVisibility();
                    }
                    break;
                case "c":
                    this.setMaterial();
                    break;
                case "generateLevel":
                    var generate = input.value;
                    this.generateTileLevel = parseInt(generate, 10);
                    this.cursorSize = this.generateTileLevel;
                    console.log(this.generateTileLevel, typeof this.generateTileLevel);
                    break;
                case "mouseray":
                    this.getFaceUnderMouse(input, this.cursorSize);
                    break;
            }
        }
        var _a;
    };
    Scene.prototype.setCursor = function (face) {
        this.cursor.setPosition(face);
    };
    /* Get a point on surface directly below the specified one.
     * WebWorker calculates this and returns result on input bus.*/
    Scene.prototype.getSurfaceUnderPoint = function (label, point, recursion) {
        this.worker.port.postMessage(["getSurfaceUnderPoint", label, point, recursion]);
    };
    /* WebWorker calculates this and returns result on input bus.*/
    Scene.prototype.getFaceUnderMouse = function (mouseRay, recursion) {
        this.worker.port.postMessage(["getFaceUnderMouse", mouseRay, recursion]);
    };
    /* Set correct visibility for all tiles. */
    Scene.prototype.setAllTileVisibility = function () {
        for (var meshLabel in this.activeMeshes) {
            if (this.activeMeshes.hasOwnProperty(meshLabel)) {
                this.setTileVisibility(meshLabel);
            }
        }
    };
    /* Set correct visibility for parent of specified tile. */
    Scene.prototype.setParentTileVisibility = function (meshLabel) {
        var mesh = this.activeMeshes[meshLabel];
        console.log(mesh.userData.parentLabel, meshLabel);
        this.setTileVisibility(mesh.userData.parentLabel);
    };
    /* Set correct visibility for tile. */
    Scene.prototype.setTileVisibility = function (meshLabel) {
        var _this = this;
        var mesh = this.activeMeshes[meshLabel];
        if (mesh !== undefined) {
            var recursion = mesh.userData.recursion;
            var childrenComplete_1 = (mesh.userData.children.length > 3);
            var sumChildrenComplete = function (childLabel) {
                childrenComplete_1 =
                    (childrenComplete_1 &&
                        _this.activeMeshes[childLabel].userData.complete === true);
            };
            mesh.userData.children.forEach(sumChildrenComplete);
            this.activeMeshes[meshLabel].visible =
                (this.activeTileLevels[recursion] ||
                    this.activeTileLevels[recursion] === undefined) &&
                    !childrenComplete_1;
        }
    };
    Scene.prototype.addGenerateTileTask = function (task) {
        if (this.workQueue[task.recursion] === undefined) {
            this.workQueue[task.recursion] = {};
        }
        var label = makeTileLabel(task);
        task.type = "generateTile";
        if (this.workQueue[task.recursion][label] !== undefined) {
            // Merge task in queue with new one.
            task.parent =
                task.parent || this.workQueue[task.recursion][label].parent;
            task.neighbours =
                task.neighbours || this.workQueue[task.recursion][label].neighbours;
            task.children =
                task.children || this.workQueue[task.recursion][label].children;
        }
        this.workQueue[task.recursion][label] = task;
    };
    /* Pop a task off the queue. */
    Scene.prototype.getGenerateTileTask = function () {
        var returnval;
        var isJob = function (jobList) {
            if (returnval === undefined) {
                var key = Object.keys(jobList)[0];
                if (key !== undefined) {
                    returnval = jobList[key];
                    delete jobList[key];
                }
            }
        };
        this.workQueue.forEach(isJob);
        return returnval;
    };
    Scene.prototype.doTask = function () {
        var testStr = "";
        var testFunc = function (tiles, index) {
            testStr += ", " + index + ":" + Object.keys(tiles).length;
        };
        this.workQueue.forEach(testFunc);
        console.log("doTask()", testStr);
        if (this.lockWorkQueue) {
            return;
        }
        var job = this.getGenerateTileTask();
        if (job === undefined) {
            return;
        }
        this.lockWorkQueue = true;
        var tileLabel = makeTileLabel(job);
        var tile = this.findMesh(tileLabel);
        if (tile === undefined) {
            console.log("  generate tile", tileLabel, job);
            var parentLabel = getParentLabel(job);
            var parentTile = this.activeMeshes[parentLabel];
            this.generateTile(parentTile, job);
            // Since it is still pending, put this back in to the queue.
            this.addGenerateTileTask(job);
        }
        else if (tile.userData.neighbours.length === 0 ||
            tile.userData.complete !== true) {
            console.log("  Waiting to complete", tileLabel);
            // Since it is still pending, put this back in to the queue.
            this.addGenerateTileTask(job);
        }
        else {
            if (job.parent) {
                this.generateParent(job);
            }
            if (job.neighbours) {
                this.generateNeighbours(tile, job);
            }
            if (job.children && this.generateTileLevel > job.recursion) {
                this.generateChildren(job);
            }
        }
        window.setTimeout(function () { this.doTask(); }.bind(this), 20);
        this.lockWorkQueue = false;
    };
    Scene.prototype.generateParent = function (job) {
        if (job.recursion <= 0) {
            return;
        }
        var indexHigh;
        var indexLow;
        _a = Module.IndexAtRecursion(job.indexHigh, job.indexLow, job.recursion - 1), indexHigh = _a[0], indexLow = _a[1];
        var task = { indexHigh: indexHigh,
            indexLow: indexLow,
            recursion: job.recursion - 1,
            parent: true,
            neighbours: true,
            children: true };
        this.addGenerateTileTask(task);
        var _a;
    };
    Scene.prototype.generateNeighbours = function (tile, job) {
        for (var _i = 0, _a = tile.userData.neighbours; _i < _a.length; _i++) {
            var neighbour = _a[_i];
            var neighbourLabel = makeTileLabel(neighbour);
            var neighbourTile = this.findMesh(neighbourLabel);
            if (neighbourTile === undefined) {
                console.log("  generate neighbour", neighbourLabel);
                var task = { indexHigh: neighbour.indexHigh,
                    indexLow: neighbour.indexLow,
                    recursion: neighbour.recursion,
                    parent: true,
                    neighbours: false,
                    children: false };
                this.addGenerateTileTask(task);
            }
        }
    };
    Scene.prototype.generateChildren = function (parent) {
        for (var c = 0; c < 4; c++) {
            var child = Module.IndexOfChild(parent.indexHigh, parent.indexLow, parent.recursion, c);
            var childLabel = makeTileLabel({ indexHigh: child[0],
                indexLow: child[1],
                recursion: parent.recursion + 1 });
            var childTile = this.findMesh(childLabel);
            if (childTile === undefined) {
                console.log("  generate child", childLabel, child);
                this.addGenerateTileTask({ indexHigh: child[0],
                    indexLow: child[1],
                    recursion: parent.recursion + 1,
                    parent: true,
                    neighbours: false,
                    children: false });
            }
        }
    };
    Scene.prototype.findMesh = function (label) {
        if (this.activeMeshes.hasOwnProperty(label)) {
            return this.activeMeshes[label];
        }
    };
    Scene.prototype.generateTile = function (parentTile, job) {
        // [indexHigh, indexLow] =
        //     Module.IndexAtRecursion(indexHigh, indexLow, recursion);
        var depth = job.recursion + 4;
        // if(recursion >= 12) {
        //  depth = recursion + 5;
        // }
        // if(recursion === 0) {
        //  depth = 0;
        // }
        var label = makeTileLabel(job);
        if (this.findMesh(label)) {
            console.log("Already created: ", label);
            return;
        }
        var mesh = new WorldTile(label, this.worker, job.indexHigh, job.indexLow, job.recursion, depth, this.materialIndex, parentTile);
        this.activeMeshes[mesh.userData.label] = mesh;
        this.add(mesh);
        mesh.visible = this.activeTileLevels[job.recursion];
        // Populate any children that have already been created.
        mesh.userData.children = [];
        // TODO: Refactor into getCildLabels() method.
        for (var c = 0; c < 4; c++) {
            var child = Module.IndexOfChild(job.indexHigh, job.indexLow, job.recursion, c);
            var childLabel = makeTileLabel({ indexHigh: child[0],
                indexLow: child[1],
                recursion: job.recursion + 1 });
            var childTile = this.findMesh(childLabel);
            if (childTile !== undefined) {
                mesh.userData.children.push(childLabel);
            }
        }
    };
    Scene.prototype.initWorker = function () {
        this.worker.port.addEventListener("message", this.workerCallback.bind(this));
    };
    Scene.prototype.workerCallback = function (event) {
        var tileLabel;
        var tileMesh;
        switch (event.data[0]) {
            case "getNeighbours":
                // console.log("callback: getNeighbours", event.data[4].length);
                tileLabel = makeTileLabel({ indexHigh: event.data[1],
                    indexLow: event.data[2],
                    recursion: event.data[3] });
                tileMesh = this.findMesh(tileLabel);
                tileMesh.userData.neighbours = event.data[4];
                break;
            case "generateTerrain":
                // console.log("callback: generateTerrain");
                tileLabel = makeTileLabel({ indexHigh: event.data[1],
                    indexLow: event.data[2],
                    recursion: event.data[3] });
                tileMesh = this.findMesh(tileLabel);
                var vertices = new Float32Array(event.data[6]);
                var colors = new Uint8Array(event.data[7]);
                var normals = new Float32Array(event.data[8]);
                tileMesh.geometry = new THREE.BufferGeometry();
                tileMesh.geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
                tileMesh.geometry.addAttribute("color", new THREE.BufferAttribute(colors, 3, true));
                tileMesh.geometry.addAttribute("normal", new THREE.BufferAttribute(normals, 3, true));
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
    };
    Scene.prototype.setMaterial = function () {
        if (this.setMaterialDabounce + 500 > Date.now()) {
            return;
        }
        this.setMaterialDabounce = Date.now();
        if (++this.materialIndex >= 4) {
            this.materialIndex = 0;
        }
        for (var meshLabel in this.activeMeshes) {
            if (this.activeMeshes.hasOwnProperty(meshLabel)) {
                var mesh = this.activeMeshes[meshLabel];
                mesh.setMaterial(this.materialIndex, mesh.recursion);
            }
        }
    };
    return Scene;
}(THREE.Scene));
var Cursor = (function (_super) {
    __extends(Cursor, _super);
    function Cursor() {
        var _this = _super.call(this) || this;
        _this.material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        _this.geometry = new THREE.Geometry();
        for (var p = 0; p < 3 * 4; p++) {
            _this.geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        }
        _this.geometry.faces.push(new THREE.Face3(0, 1, 2));
        _this.renderOrder = 999;
        _this.material.depthTest = false;
        return _this;
    }
    Cursor.prototype.setPosition = function (face) {
        if (face === undefined) {
            // this.clearCursor();
            return;
        }
        var point0 = new THREE.Vector3(0, 0, 0);
        var point1 = new THREE.Vector3(0, 0, 0);
        var point2 = new THREE.Vector3(0, 0, 0);
        point0.copy(face.points[0].point);
        point1.copy(face.points[1].point);
        point2.copy(face.points[2].point);
        var cursorFloatHeight = 0.0; // (km)
        var height = Math.max(sealevel, face.points[0].height);
        height = Math.max(height, face.points[1].height);
        height = Math.max(height, face.points[2].height);
        height *= heightMultiplier;
        point0.setLength(earthRadius * (height + 1) + cursorFloatHeight);
        point1.setLength(earthRadius * (height + 1) + cursorFloatHeight);
        point2.setLength(earthRadius * (height + 1) + cursorFloatHeight);
        this.geometry.vertices[0] = point0;
        this.geometry.vertices[1] = point1;
        this.geometry.vertices[2] = point2;
        this.geometry.verticesNeedUpdate = true;
        this.geometry.elementsNeedUpdate = true;
        this.geometry.computeBoundingSphere();
    };
    return Cursor;
}(THREE.Mesh));
var Line = (function (_super) {
    __extends(Line, _super);
    function Line(start, end) {
        if (start === void 0) { start = new THREE.Vector3(0, 0, 0); }
        if (end === void 0) { end = new THREE.Vector3(10000, 0, 0); }
        var _this = _super.call(this) || this;
        _this.material = new THREE.LineBasicMaterial({ color: 0xff0000,
            linewidth: 2 });
        _this.geometry = new THREE.Geometry();
        _this.geometry.vertices.push(start);
        _this.geometry.vertices.push(end);
        return _this;
    }
    Line.prototype.setStart = function (point) {
        this.geometry.vertices[0] = point;
        this.geometry.verticesNeedUpdate = true;
    };
    Line.prototype.setEnd = function (point) {
        this.geometry.vertices[1] = point;
        this.geometry.verticesNeedUpdate = true;
    };
    return Line;
}(THREE.Line));
var Mesh = (function (_super) {
    __extends(Mesh, _super);
    function Mesh(label) {
        var _this = _super.call(this) || this;
        _this.userInput = [];
        _this.materialIndexChanged = 0;
        _this.userData.label = label;
        return _this;
    }
    Mesh.prototype.dispose = function () {
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
    };
    Mesh.prototype.resetMaterial = function () {
        this.setMaterial(0);
    };
    Mesh.prototype.setMaterial = function (material, colorHint) {
        if (material === void 0) { material = 0; }
        if (colorHint === void 0) { colorHint = 0; }
        console.log("setMaterial(", material, colorHint, ")");
        if (Date.now() - this.materialIndexChanged < 200) {
            // Debounce input.
            return;
        }
        this.materialIndexChanged = Date.now();
        colorHint = colorHint % 10;
        var color = 0x000000;
        switch (colorHint) {
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
        switch (material) {
            case 1:
                this.material = new THREE.MeshLambertMaterial({
                    vertexColors: THREE.VertexColors
                });
                this.material.wireframe = true;
                break;
            case 2:
                this.material = new THREE.MeshBasicMaterial({ color: color });
                break;
            case 3:
                this.material = new THREE.MeshBasicMaterial({ color: color });
                this.material.wireframe = true;
                break;
            default:
                // this.material = new THREE.MeshLambertMaterial({color: 0x55B663});
                this.material = new THREE.MeshLambertMaterial({
                    vertexColors: THREE.VertexColors,
                    // transparent: true,
                    // opacity: 1,
                    overdraw: 1.0,
                });
                break;
        }
    };
    return Mesh;
}(THREE.Mesh));
var Box = (function (_super) {
    __extends(Box, _super);
    function Box(label) {
        var _this = _super.call(this, label) || this;
        _this.geometry = new THREE.BoxGeometry(1, 1, 1);
        _this.setMaterial();
        return _this;
    }
    Box.prototype.service = function () {
        while (this.userInput.length) {
            var input = this.userInput.pop();
            switch (input.key || input.type) {
                case "c":
                    this.setMaterial();
                    break;
            }
        }
    };
    return Box;
}(Mesh));
var WorldTile = (function (_super) {
    __extends(WorldTile, _super);
    function WorldTile(label, worker, indexHigh, indexLow, recursion, requiredDepth, materialIndex, parentTile) {
        var _this = _super.call(this, label) || this;
        _this.label = label;
        _this.worker = worker;
        _this.indexHigh = indexHigh;
        _this.indexLow = indexLow;
        _this.recursion = recursion;
        _this.requiredDepth = requiredDepth;
        _this.materialIndex = materialIndex;
        _this.parentTile = parentTile;
        _this.userData.indexHigh = indexHigh;
        _this.userData.indexLow = indexLow;
        _this.userData.recursion = recursion;
        _this.userData.requiredDepth = requiredDepth;
        _this.userData.neighbours = []; // TODO: Type.
        _this.userData.children = [];
        if (parentTile !== undefined) {
            _this.userData.parentLabel = parentTile.label;
            if (!parentTile.userData.children.includes(label)) {
                parentTile.userData.children.push(label);
            }
        }
        else {
            _this.userData.parentLabel = getParentLabel(_this.userData);
            // Must populate children later.
        }
        _this.setMaterial(_this.materialIndex, recursion);
        var skirt = false;
        if (recursion > 4) {
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
        return _this;
    }
    WorldTile.prototype.service = function () {
        // TODO: Should this actually happen for each mesh or for the whole scene?
        /*while (this.userInput.length) {
          const input = this.userInput.pop();
          // console.log(input.type, input.key);
          switch(input.key || input.type) {
            case "c":
              this.setMaterial(this.recursion);
              break;
            case " ":
              this.resetMaterial();
              break;
          }
        }*/
    };
    return WorldTile;
}(Mesh));
