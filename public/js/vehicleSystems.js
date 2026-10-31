import * as THREE from "three";

export class VehicleSystems {

constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.vehicles = [];
    this.currentVehicle = null;
    this.isDriving = false;
    this.speed = 0;
    this.maxSpeed = 24;
    this.acceleration = 12;
    this.braking = 20;
    this.steeringSpeed = 1.8;
    this.createVehicles();
}
// MATERIALS
material(color, metalness = 0) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness
    });
}
// CREATE VEHICLE
createVehicle(type, x, z, color) {
    const vehicle = new THREE.Group();
    const paint = this.material(color);
    const black = this.material(0x202020);
    const glass = new THREE.MeshStandardMaterial({
        color: 0x75a9bb,
        roughness: 0.3,
        metalness: 0.2
    });
    const metal = this.material(0x777777, 0.6);
    let width = 2.4;
    let length = 5;
    let height = 1.5;
    if (type === "keke") {
        width = 1.8;
        length = 3.2;
        height = 1.5;
    }
    if (type === "danfo") {
        width = 2.6;
        length = 6;
        height = 2.3;
    }
    // MAIN BODY
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, length),
        paint
    );
    body.position.y = height / 2 + 0.65;
    vehicle.add(body);
    // CABIN
    if (type !== "sedan") {
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(
                width * 0.88,
                type === "danfo" ? 1.5 : 1,
                length * 0.55
            ),
            paint
        );
        cabin.position.set(
            0,
            height + 1.2,
            -length * 0.05
        );
        vehicle.add(cabin);
        const windshield = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.82, 0.9, 0.08),
            glass
        );
        windshield.position.set(
            0,
            height + 1.2,
            length * 0.23
        );
        vehicle.add(windshield);
    } else {
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.15, 2.7),
            glass
        );
        cabin.position.set(0, 2.05, -0.2);
        vehicle.add(cabin);
    }
    // FRONT BUMPER
    const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.25, 0.2),
        metal
    );
    bumper.position.set(0, 0.8, length / 2);
    vehicle.add(bumper);
    // HEADLIGHTS
    for (const side of [-1, 1]) {
        const light = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.3, 0.12),
            new THREE.MeshBasicMaterial({
                color: 0xffffcc
            })
        );
        light.position.set(
            side * width * 0.32,
            1.1,
            length / 2 + 0.12
        );
        vehicle.add(light);
    }
    // REAR LIGHTS
    for (const side of [-1, 1]) {
        const light = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.3, 0.12),
            new THREE.MeshBasicMaterial({
                color: 0xff2222
            })
        );
        light.position.set(
            side * width * 0.32,
            1.1,
            -length / 2 - 0.12
        );
        vehicle.add(light);
    }
    // WHEELS
    const wheels = [];
    const wheelPositions = [
        [-width / 2, -length * 0.3],
        [width / 2, -length * 0.3],
        [-width / 2, length * 0.3],
        [width / 2, length * 0.3]
    ];
    wheelPositions.forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(
                type === "keke" ? 0.4 : 0.55,
                type === "keke" ? 0.4 : 0.55,
                0.35,
                10
            ),
            black
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.55, wz);
        vehicle.add(wheel);
        wheels.push(wheel);
    });
    vehicle.position.set(x, 0, z);
    vehicle.rotation.y = Math.PI;
    this.scene.add(vehicle);
    const vehicleData = {
        type,
        object: vehicle,
        wheels,
        maxSpeed: type === "danfo" ? 19 :
                  type === "keke" ? 15 : 24,
        length,
        width
    };
    this.vehicles.push(vehicleData);
    // DYNAMIC VEHICLE INTERACTION
    const vehicleInteraction = {
        x,
        z,
        type: "vehicle",
        buttonText: `ENTER ${type.toUpperCase()}`,
        action: () => this.enterVehicle(vehicleData)
    };
    vehicleData.interactable = vehicleInteraction;
    this.world.addInteractable(vehicleInteraction);
}
// CREATE CITY VEHICLES
createVehicles() {
    this.createVehicle("danfo", -8, -150, 0xe6bd24);
    this.createVehicle("keke", 8, 150, 0x168c53);
    this.createVehicle("sedan", -8, 210, 0x263b65);
}
// ENTER VEHICLE
enterVehicle(vehicleData) {
    if (this.isDriving) return;
    this.currentVehicle = vehicleData;
    this.isDriving = true;
    this.speed = 0;
    if (this.world.hideInteraction) {
        this.world.hideInteraction();
    }
    console.log("Entered:", vehicleData.type);
}
// EXIT VEHICLE
exitVehicle(player) {
    if (!this.isDriving || !this.currentVehicle) return;
    const vehicle = this.currentVehicle.object;
    const exitPosition = new THREE.Vector3(2.5, 0, 0);
    exitPosition.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        vehicle.rotation.y
    );
    player.position.set(
        vehicle.position.x + exitPosition.x,
        0,
        vehicle.position.z + exitPosition.z
    );
    player.visible = true;
    this.isDriving = false;
    this.currentVehicle = null;
    this.speed = 0;
    if (this.world.updateInteractions) {
        this.world.updateInteractions(player);
    }
}
// VEHICLE COLLISION DETECTION
canVehicleMove(vehicleData, x, z, yaw) {
    const halfWidth = vehicleData.width / 2 + 0.15;
    const halfLength = vehicleData.length / 2 + 0.15;
    const extentX =
        Math.abs(Math.cos(yaw)) * halfWidth +
        Math.abs(Math.sin(yaw)) * halfLength;
    const extentZ =
        Math.abs(Math.sin(yaw)) * halfWidth +
        Math.abs(Math.cos(yaw)) * halfLength;
    // BUILDINGS, HOUSES, FENCES AND OTHER STATIC OBJECTS
    for (const collider of this.world.colliders) {
        const overlaps =
            x + extentX > collider.minX &&
            x - extentX < collider.maxX &&
            z + extentZ > collider.minZ &&
            z - extentZ < collider.maxZ;
        if (overlaps) {
            return false;
        }
    }
    // OTHER VEHICLES
    for (const other of this.vehicles) {
        if (other === vehicleData) continue;
        const otherYaw = other.object.rotation.y;
        const otherHalfWidth = other.width / 2 + 0.15;
        const otherHalfLength = other.length / 2 + 0.15;
        const otherExtentX =
            Math.abs(Math.cos(otherYaw)) * otherHalfWidth +
            Math.abs(Math.sin(otherYaw)) * otherHalfLength;
        const otherExtentZ =
            Math.abs(Math.sin(otherYaw)) * otherHalfWidth +
            Math.abs(Math.cos(otherYaw)) * otherHalfLength;
        const otherX = other.object.position.x;
        const otherZ = other.object.position.z;
        const overlaps =
            x + extentX > otherX - otherExtentX &&
            x - extentX < otherX + otherExtentX &&
            z + extentZ > otherZ - otherExtentZ &&
            z - extentZ < otherZ + otherExtentZ;
        if (overlaps) {
            return false;
        }
    }
    return true;
}
// DRIVING SYSTEM
update(player, steering, gas, brake, delta) {
    if (!this.isDriving || !this.currentVehicle) return;
    const vehicleData = this.currentVehicle;
    const vehicle = vehicleData.object;
    player.visible = false;
    player.position.copy(vehicle.position);
    // ACCELERATION AND BRAKING
    if (gas) {
        if (this.speed < 0) {
            this.speed = Math.min(
                0,
                this.speed + this.braking * delta
            );
        } else {
            this.speed += this.acceleration * delta;
        }
    } else if (brake) {
        if (this.speed > 0) {
            this.speed = Math.max(
                0,
                this.speed - this.braking * delta
            );
        } else {
            this.speed -= this.acceleration * 0.6 * delta;
        }
    } else {
        if (this.speed > 0) {
            this.speed = Math.max(0, this.speed - 4 * delta);
        } else if (this.speed < 0) {
            this.speed = Math.min(0, this.speed + 4 * delta);
        }
    }
    this.speed = THREE.MathUtils.clamp(
        this.speed,
        -vehicleData.maxSpeed * 0.35,
        vehicleData.maxSpeed
    );
    // STEERING
    const steeringX = steering.x || 0;
    const oldYaw = vehicle.rotation.y;
    let newYaw = oldYaw;
    if (Math.abs(this.speed) > 0.5) {
        const steeringDirection = this.speed >= 0 ? 1 : -1;
        newYaw -=
            steeringX *
            this.steeringSpeed *
            delta *
            steeringDirection;
    }
    // Do not allow the vehicle to rotate into an obstacle.
    if (
        this.canVehicleMove(
            vehicleData,
            vehicle.position.x,
            vehicle.position.z,
            newYaw
        )
    ) {
        vehicle.rotation.y = newYaw;
    }
    // MOVEMENT
    const forwardX = Math.sin(vehicle.rotation.y);
    const forwardZ = Math.cos(vehicle.rotation.y);
    const nextX =
        vehicle.position.x +
        forwardX * this.speed * delta;
    const nextZ =
        vehicle.position.z +
        forwardZ * this.speed * delta;
    const oldX = vehicle.position.x;
    const oldZ = vehicle.position.z;
    const canMoveX = this.canVehicleMove(
        vehicleData,
        nextX,
        oldZ,
        vehicle.rotation.y
    );
    const canMoveZ = this.canVehicleMove(
        vehicleData,
        oldX,
        nextZ,
        vehicle.rotation.y
    );
    // Move only along an available axis.
    if (canMoveX) {
        vehicle.position.x = nextX;
    }
    if (canMoveZ) {
        vehicle.position.z = nextZ;
    }
    // If blocked in the direction of travel, stop immediately.
    if (!canMoveX || !canMoveZ) {
        this.speed = 0;
    }
    // WORLD BOUNDARIES
    const clampedX = THREE.MathUtils.clamp(
        vehicle.position.x,
        -255,
        255
    );
    const clampedZ = THREE.MathUtils.clamp(
        vehicle.position.z,
        -255,
        255
    );
    if (
        clampedX !== vehicle.position.x ||
        clampedZ !== vehicle.position.z
    ) {
        this.speed = 0;
    }
    vehicle.position.x = clampedX;
    vehicle.position.z = clampedZ;
    // UPDATE VEHICLE INTERACTION POSITION
    if (vehicleData.interactable) {
        vehicleData.interactable.x = vehicle.position.x;
        vehicleData.interactable.z = vehicle.position.z;
    }
    // WHEEL ANIMATION
    vehicleData.wheels.forEach(wheel => {
        wheel.rotation.x += this.speed * delta * 0.8;
    });
    player.position.copy(vehicle.position);
}
// INTERACTION WHILE DRIVING
updateInteractionButton() {
    if (!this.isDriving || !this.world.button) return;
    this.world.button.style.display = "flex";
    const icon = this.world.button.querySelector("#interaction-icon");
    const label = this.world.button.querySelector("#interaction-label");
    if (icon) icon.textContent = "🚪";
    if (label) label.textContent = "EXIT";
    this.world.currentInteraction = {
        action: () => {
            this.exitVehicle(this.playerReference);
        }
    };
}

}
