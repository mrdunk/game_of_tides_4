// Copyright 2017 duncan law (mrdunk@gmail.com)
importScripts("wrap_terrain.js", "three.js");
var WorldTileWorker = (function () {
    function WorldTileWorker() {
        this.sealevel = 0.001; // Ratio of planets diameter.
        this.heightMultiplier = 2;
        this.init();
    }
    WorldTileWorker.prototype.getNeighbours = function (faceIndexHigh, faceIndexLow, recursion) {
        var neighbours = [];
        var thisFace = this.terrainGenerator.getFaces(faceIndexHigh, faceIndexLow, recursion, recursion);
        var face = thisFace.get(0);
        for (var n = 0; n < face.neighbours.size(); n++) {
            var neighbour = face.neighbours.get(n);
            neighbours.push({ indexHigh: neighbour[0],
                indexLow: neighbour[1],
                recursion: recursion });
        }
        face.delete();
        thisFace.delete();
        return neighbours;
    };
    WorldTileWorker.prototype.generateTerrain = function (faceIndexHigh, faceIndexLow, recursion, requiredDepth, skirt) {
        /* console.log(faceIndexHigh,
                    faceIndexLow,
                    recursion,
                    requiredDepth);*/
        var faces = this.terrainGenerator.getFaces(faceIndexHigh, faceIndexLow, recursion, requiredDepth);
        var facesAndSkirt = faces;
        if (skirt) {
            facesAndSkirt = this.terrainGenerator.getFacesAndSkirt(faces);
        }
        // Finished generating faces so clear some memory.
        this.terrainGenerator.cleanCache(40000000);
        var vertices = new Float32Array(facesAndSkirt.size() * 3 * 3);
        var normals = new Float32Array(facesAndSkirt.size() * 3 * 3);
        var colors = new Uint8Array(facesAndSkirt.size() * 3 * 3);
        for (var i = 0; i < facesAndSkirt.size(); i++) {
            var componentFace = facesAndSkirt.get(i);
            var isLand = 0;
            for (var point = 0; point < 3; point++) {
                var height = componentFace.heights[point];
                if (height > this.sealevel) {
                    isLand++;
                }
            }
            for (var point = 0; point < 3; point++) {
                var height = componentFace.heights[point];
                var heightColor = height * 100000;
                if (heightColor < 20) {
                    heightColor = 20;
                }
                if (heightColor > 245) {
                    heightColor = 245;
                }
                if (isLand > 0 && height > 0.002) {
                    colors[(i * 9) + (point * 3) + 0] = heightColor / 2;
                    colors[(i * 9) + (point * 3) + 1] = heightColor / 1.5;
                    colors[(i * 9) + (point * 3) + 2] =
                        (heightColor - (heightColor % 20) - 10);
                }
                else if (isLand > 0) {
                    colors[(i * 9) + (point * 3) + 0] =
                        (heightColor - (heightColor % 20) - 10) / 2;
                    colors[(i * 9) + (point * 3) + 1] =
                        (heightColor + (heightColor % 20) - 10);
                    colors[(i * 9) + (point * 3) + 2] =
                        (heightColor + (heightColor % 20) - 10) / 2;
                }
                else {
                    heightColor /= 2;
                    heightColor += 100;
                    heightColor -= 5 * (heightColor % 5);
                    colors[(i * 9) + (point * 3) + 0] = heightColor / 8;
                    colors[(i * 9) + (point * 3) + 1] = heightColor / 2;
                    colors[(i * 9) + (point * 3) + 2] = heightColor;
                }
                if (height < this.sealevel) {
                    height = this.sealevel;
                }
                for (var coord = 0; coord < 3; coord++) {
                    vertices[(i * 9) + (point * 3) + coord] =
                        componentFace.points[point][coord] *
                            (1 + (height * this.heightMultiplier));
                }
            }
            // Compute Vertex Normals as Face Normals.
            // (ie, all 3 vertex normals are the same.)
            var vA = new THREE.Vector3();
            var vB = new THREE.Vector3();
            var vC = new THREE.Vector3();
            vA.fromArray(componentFace.points[0]);
            vB.fromArray(componentFace.points[1]);
            vC.fromArray(componentFace.points[2]);
            vB.sub(vA);
            vC.sub(vA);
            vB.cross(vC);
            vB.normalize();
            for (var point = 0; point < 3; point++) {
                normals[(i * 9) + (point * 3) + 0] = vB.x;
                normals[(i * 9) + (point * 3) + 1] = vB.y;
                normals[(i * 9) + (point * 3) + 2] = vB.z;
            }
            componentFace.delete();
        }
        faces.delete();
        if (skirt) {
            facesAndSkirt.delete();
        }
        return [vertices.buffer, colors.buffer, normals.buffer];
    };
    /* Get a point on surface directly below the specified one. */
    WorldTileWorker.prototype.getSurfaceUnderPoint = function (point, recursion) {
        point = new THREE.Vector3(point.x, point.y, point.z);
        var direction = new THREE.Vector3();
        direction.copy(point);
        direction.normalize();
        direction.negate();
        var face = this.terrainGenerator.rayCrossesFace(point.toArray(), direction.toArray(), recursion);
        if (face) {
            var surfacePoint = new THREE.Vector3((face.points[0][0] + face.points[1][0] + face.points[2][0]) / 3, (face.points[0][1] + face.points[1][1] + face.points[2][1]) / 3, (face.points[0][2] + face.points[1][2] + face.points[2][2]) / 3);
            var height = (face.heights[0] + face.heights[1] + face.heights[2]) / 3;
            var returnFace = {
                indexHigh: face.index_high, indexLow: face.index_low, recursion: recursion
            };
            face.delete();
            return { point: surfacePoint, height: height, face: returnFace };
        }
        console.log("Face not found beneath:", point);
    };
    WorldTileWorker.prototype.getFaceUnderMouse = function (mouseRay, recursion) {
        // TODO: Normalize this for heights.
        var face = this.terrainGenerator.rayCrossesFace(mouseRay.origin, mouseRay.direction, recursion);
        if (face) {
            var surfacePoint0 = {
                point: new THREE.Vector3().fromArray(face.points[0]),
                height: face.heights[0]
            };
            var surfacePoint1 = {
                point: new THREE.Vector3().fromArray(face.points[1]),
                height: face.heights[1]
            };
            var surfacePoint2 = {
                point: new THREE.Vector3().fromArray(face.points[2]),
                height: face.heights[2]
            };
            var returnVal = { indexHigh: face.index_high,
                indexLow: face.index_low,
                recursion: recursion,
                height: face.height,
                points: [surfacePoint0, surfacePoint1, surfacePoint2],
            };
            face.delete();
            return returnVal;
        }
    };
    WorldTileWorker.prototype.init = function () {
        try {
            this.terrainGenerator = new Module.DataSourceGenerate();
            this.terrainGenerator.MakeCache();
        }
        catch (err) {
            // Memory still in use from previous page load.
            // Wait a 5 seconds and re-load again.
            console.log(err);
            setTimeout(this.init.bind(this), 5000);
            return;
        }
    };
    return WorldTileWorker;
}());
var worldTileWorker = new WorldTileWorker();
var socket = self;
// Used by SharedWorker.
var onconnect = function (event) {
    console.log("onconnect", event.ports);
    socket = event.ports[0];
    socket.onmessage = onmessage;
};
onmessage = function (e) {
    // const workerResult = "Recieved: " + e.data[0];
    // console.log(workerResult);
    var reply = e.data.slice(); // Copy.
    switch (e.data[0]) {
        case "rayCrossesFace":
            break;
        case "getNeighbours":
            var neighbours = worldTileWorker.getNeighbours(e.data[1], e.data[2], e.data[3]);
            reply.push(neighbours);
            socket.postMessage(reply);
            break;
        case "generateTerrain":
            var geometry = worldTileWorker.generateTerrain(e.data[1], e.data[2], e.data[3], e.data[4], e.data[5]);
            socket.postMessage(reply.concat(geometry), geometry);
            break;
        case "getSurfaceUnderPoint":
            var point = worldTileWorker.getSurfaceUnderPoint(e.data[2], e.data[3]);
            reply.push(point);
            socket.postMessage(reply);
            break;
        case "getFaceUnderMouse":
            var face = worldTileWorker.getFaceUnderMouse(e.data[1], e.data[2]);
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
