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
// =====================================
// VEHICLE MATERIALS
// =====================================
material(color, metalness = 0) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness
    });
}
// =====================================
// CREATE VEHICLE BODY
// =====================================
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
    // Main body dimensions
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
    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, length),
        paint
    );
    body.position.y = height / 2 + 0.65;
    vehicle.add(body);
    // Upper cabin
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
        // Front windscreen
        const windshield = new THREE.Mesh(
            new THREE.BoxGeometry(
                width * 0.82,
                0.9,
                0.08
            ),
            glass
        );
        windshield.position.set(
            0,
            height + 1.2,
            length * 0.23
        );
        vehicle.add(windshield);
    } else {
        // Sedan cabin
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.15, 2.7),
            glass
        );
        cabin.position.set(0, 2.05, -0.2);
        vehicle.add(cabin);
    }
    // Front bumper
    const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, 0.25, 0.2),
        metal
    );
    bumper.position.set(0, 0.8, length / 2);
    vehicle.add(bumper);
    // Headlights
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
    // Rear lights
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
    // Wheels
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
    // Give vehicles an initial road-facing direction
    vehicle.rotation.y = Math.PI;
    this.scene.add(vehicle);
    const vehicleData = {
        type,
        object: vehicle,
        wheels,
        maxSpeed: type === "danfo" ? 19 : type === "keke" ? 15 : 24,
        length,
        width
    };
    this.vehicles.push(vehicleData);
    // Register vehicle interaction
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
    if (vehicleData.interactable) {

    vehicleData.interactable.x = vehicleData.object.position.x;
    vehicleData.interactable.z = vehicleData.object.position.z;

}
// =====================================
// CREATE CITY VEHICLES
// =====================================
createVehicles() {
    this.createVehicle(
        "danfo",
        -8,
        -150,
        0xe6bd24
    );
    this.createVehicle(
        "keke",
        8,
        150,
        0x168c53
    );
    this.createVehicle(
        "sedan",
        -8,
        210,
        0x263b65
    );
}
// =====================================
// ENTER VEHICLE
// =====================================
enterVehicle(vehicleData) {
    if (this.isDriving) return;
    this.currentVehicle = vehicleData;
    this.isDriving = true;
    this.speed = 0;
    console.log("Entered:", vehicleData.type);
}
// =====================================
// EXIT VEHICLE
// =====================================
exitVehicle(player) {
    if (!this.isDriving || !this.currentVehicle) return;
    const vehicle = this.currentVehicle.object;
    const exitPosition = new THREE.Vector3(
        2.5,
        0,
        0
    );
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
}
    // =====================================
// VEHICLE COLLISION DETECTION
// =====================================

canVehicleMove(vehicleData, x, z, yaw) {

    const halfWidth = vehicleData.width / 2;
    const halfLength = vehicleData.length / 2;

    // Calculate the vehicle's rotated bounding box.
    const extentX =
        Math.abs(Math.cos(yaw)) * halfWidth +
        Math.abs(Math.sin(yaw)) * halfLength;

    const extentZ =
        Math.abs(Math.sin(yaw)) * halfWidth +
        Math.abs(Math.cos(yaw)) * halfLength;

    // Check buildings, fences, kiosks and other static objects.
    for (const collider of this.world.colliders) {

        const overlaps =
            x + extentX > collider.x - collider.width / 2 &&
            x - extentX < collider.x + collider.width / 2 &&
            z + extentZ > collider.z - collider.depth / 2 &&
            z - extentZ < collider.z + collider.depth / 2;

        if (overlaps) {
            return false;
        }
    }

    // Check other vehicles.
    for (const other of this.vehicles) {

        if (other === vehicleData) continue;

        const otherX = other.object.position.x;
        const otherZ = other.object.position.z;

        const otherHalfWidth = other.width / 2;
        const otherHalfLength = other.length / 2;

        const otherExtentX =
            Math.abs(Math.cos(other.object.rotation.y)) * otherHalfWidth +
            Math.abs(Math.sin(other.object.rotation.y)) * otherHalfLength;

        const otherExtentZ =
            Math.abs(Math.sin(other.object.rotation.y)) * otherHalfWidth +
            Math.abs(Math.cos(other.object.rotation.y)) * otherHalfLength;

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
// =====================================
// DRIVING SYSTEM
// =====================================
update(player, steering, gas, brake, delta) {

    if (!this.isDriving || !this.currentVehicle) return;

    const vehicleData = this.currentVehicle;
    const vehicle = vehicleData.object;

    player.visible = false;

    // Keep player aligned with vehicle.
    player.position.copy(vehicle.position);

    // =====================================
    // ACCELERATION AND BRAKING
    // =====================================

    const acceleration = this.acceleration;
    const brakingPower = this.braking;

    if (gas) {

        // If reversing, slow down before moving forward.
        if (this.speed < 0) {
            this.speed = Math.min(
                0,
                this.speed + brakingPower * delta
            );
        } else {
            this.speed += acceleration * delta;
        }

    } else if (brake) {

        // First slow down.
        if (this.speed > 0) {

            this.speed = Math.max(
                0,
                this.speed - brakingPower * delta
            );

        } else {

            // Once stopped, holding brake activates reverse.
            this.speed -= acceleration * 0.6 * delta;

        }

    } else {

        // Natural friction when neither button is pressed.
        if (this.speed > 0) {
            this.speed = Math.max(
                0,
                this.speed - 4 * delta
            );
        } else if (this.speed < 0) {
            this.speed = Math.min(
                0,
                this.speed + 4 * delta
            );
        }

    }

    // Limit vehicle speed.
    this.speed = THREE.MathUtils.clamp(
        this.speed,
        -vehicleData.maxSpeed * 0.35,
        vehicleData.maxSpeed
    );

    // =====================================
    // STEERING
    // =====================================

    const steeringX = steering.x || 0;

    if (Math.abs(this.speed) > 0.5) {

        const steeringDirection = this.speed >= 0 ? 1 : -1;

        vehicle.rotation.y -=
            steeringX *
            this.steeringSpeed *
            delta *
            steeringDirection;

    }

    // =====================================
    // VEHICLE MOVEMENT
    // =====================================

    // =====================================
// VEHICLE MOVEMENT AND COLLISION
// =====================================

const forwardX = Math.sin(vehicle.rotation.y);
const forwardZ = Math.cos(vehicle.rotation.y);

const nextX =
    vehicle.position.x +
    forwardX * this.speed * delta;

const nextZ =
    vehicle.position.z +
    forwardZ * this.speed * delta;

// Check X movement independently.
if (
    this.canVehicleMove(
        vehicleData,
        nextX,
        vehicle.position.z,
        vehicle.rotation.y
    )
) {
    vehicle.position.x = nextX;
}

// Check Z movement independently.
if (
    this.canVehicleMove(
        vehicleData,
        vehicle.position.x,
        nextZ,
        vehicle.rotation.y
    )
) {
    vehicle.position.z = nextZ;
}

// Stop the vehicle if its movement is blocked.
if (
    vehicle.position.x !== nextX ||
    vehicle.position.z !== nextZ
) {
    this.speed *= 0.85;

    if (Math.abs(this.speed) < 0.5) {
        this.speed = 0;
    }
}

    // Keep vehicle within playable world.
    vehicle.position.x = THREE.MathUtils.clamp(
        vehicle.position.x,
        -255,
        255
    );

    vehicle.position.z = THREE.MathUtils.clamp(
        vehicle.position.z,
        -255,
        255
    );

    // =====================================
    // WHEEL ANIMATION
    // =====================================

    vehicleData.wheels.forEach(wheel => {
        wheel.rotation.x += this.speed * delta * 0.8;
    });

    // Keep character aligned with vehicle.
    player.position.copy(vehicle.position);
}
// =====================================
// INTERACTION WHILE DRIVING
// =====================================
updateInteractionButton() {
    if (!this.isDriving || !this.world.button) return;
    this.world.button.style.display = "block";
    this.world.button.textContent = "EXIT VEHICLE";
    this.world.currentInteraction = {
        action: () => {
            this.exitVehicle(this.playerReference);
        }
    };
}

}
