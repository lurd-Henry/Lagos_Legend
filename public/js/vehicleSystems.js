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
    // MATERIALS
    // =====================================

    material(color, metalness = 0, roughness = 0.7) {
        return new THREE.MeshStandardMaterial({
            color,
            metalness,
            roughness
        });
    }

    addBox(parent, width, height, depth, material, x, y, z) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        parent.add(mesh);

        return mesh;
    }

    addCylinder(parent, radius, height, material, x, y, z) {
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, height, 16),
            material
        );

        mesh.position.set(x, y, z);
        parent.add(mesh);

        return mesh;
    }

    // =====================================
    // VEHICLE WINDOWS
    // =====================================

    addSideWindow(parent, x, y, z, width, height) {

        const frame = this.material(0x292929);
        const glass = this.material(0x527e91, 0.25, 0.3);

        // Window frame
        this.addBox(
            parent,
            0.045,
            height + 0.12,
            width + 0.12,
            frame,
            x,
            y,
            z
        );

        // Glass panel
        this.addBox(
            parent,
            0.055,
            height,
            width,
            glass,
            x + (x > 0 ? 0.035 : -0.035),
            y,
            z
        );
    }

    addWindshield(parent, width, height, z, y) {

        const glass = this.material(0x527e91, 0.2, 0.3);
        const frame = this.material(0x252525);

        this.addBox(
            parent,
            width + 0.16,
            height + 0.16,
            0.09,
            frame,
            0,
            y,
            z
        );

        this.addBox(
            parent,
            width,
            height,
            0.10,
            glass,
            0,
            y,
            z + 0.055
        );
    }

    // =====================================
    // WHEELS
    // =====================================

    addWheel(parent, x, y, z, radius) {

        const rubber = this.material(0x171717);
        const rim = this.material(0x999999, 0.75, 0.35);
        const hub = this.material(0x444444, 0.7);

        const wheelGroup = new THREE.Group();

        const tyre = new THREE.Mesh(
            new THREE.CylinderGeometry(
                radius,
                radius,
                0.28,
                20
            ),
            rubber
        );

        tyre.rotation.z = Math.PI / 2;
        wheelGroup.add(tyre);

        // Outer rim
        const rimMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(
                radius * 0.55,
                radius * 0.55,
                0.30,
                16
            ),
            rim
        );

        rimMesh.rotation.z = Math.PI / 2;
        rimMesh.position.x = 0.015;

        wheelGroup.add(rimMesh);

        const hubMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(
                radius * 0.22,
                radius * 0.22,
                0.32,
                12
            ),
            hub
        );

        hubMesh.rotation.z = Math.PI / 2;

        wheelGroup.add(hubMesh);

        // Wheel nuts
        for (let i = 0; i < 6; i++) {

            const angle = (Math.PI * 2 * i) / 6;

            const nut = new THREE.Mesh(
                new THREE.SphereGeometry(0.035, 6, 6),
                this.material(0xdddddd, 0.8)
            );

            nut.position.set(
                0.17,
                Math.cos(angle) * radius * 0.38,
                Math.sin(angle) * radius * 0.38
            );

            wheelGroup.add(nut);
        }

        wheelGroup.position.set(x, y, z);

        parent.add(wheelGroup);

        return wheelGroup;
    }

    // =====================================
    // HEADLIGHTS
    // =====================================

    addLights(parent, width, length) {

        const headlight = this.material(0xfff3c4, 0, 0.25);
        const tailLight = this.material(0xd90016, 0, 0.3);
        const indicator = this.material(0xffa500);

        for (const side of [-1, 1]) {

            this.addBox(
                parent,
                0.42,
                0.25,
                0.12,
                headlight,
                side * width * 0.34,
                1.15,
                length / 2 + 0.08
            );

            this.addBox(
                parent,
                0.22,
                0.14,
                0.12,
                indicator,
                side * width * 0.43,
                1.1,
                length / 2 + 0.08
            );

            this.addBox(
                parent,
                0.32,
                0.38,
                0.12,
                tailLight,
                side * width * 0.34,
                1.1,
                -length / 2 - 0.08
            );
        }
    }

    // =====================================
    // DANFO MODEL
    // =====================================

    createDanfo(vehicle, width, length) {

        const yellow = this.material(0xf1c51b);
        const darkYellow = this.material(0xdba900);
        const black = this.material(0x242424);
        const metal = this.material(0x777777, 0.7);
        const interior = this.material(0x373737);
        const glass = this.material(0x527e91, 0.2, 0.3);

        // Main lower body
        this.addBox(
            vehicle,
            width,
            1.35,
            length,
            yellow,
            0,
            1.25,
            0
        );

        // Upper passenger cabin
        this.addBox(
            vehicle,
            width * 0.92,
            1.55,
            length * 0.66,
            yellow,
            0,
            2.65,
            -0.15
        );

        // Roof
        this.addBox(
            vehicle,
            width * 0.96,
            0.14,
            length * 0.69,
            darkYellow,
            0,
            3.46,
            -0.15
        );

        // Front windscreen
        this.addWindshield(
            vehicle,
            width * 0.77,
            0.88,
            length * 0.35,
            2.75
        );

        // Side windows
        for (const side of [-1, 1]) {

            const x = side * (width / 2 + 0.015);

            for (const z of [-1.35, -0.35, 0.65]) {

                this.addSideWindow(
                    vehicle,
                    x,
                    2.78,
                    z,
                    0.78,
                    0.85
                );
            }

            // Sliding door outline
            this.addBox(
                vehicle,
                0.055,
                1.25,
                0.055,
                black,
                x,
                1.65,
                -1.25
            );

            // Door handle
            this.addBox(
                vehicle,
                0.07,
                0.08,
                0.35,
                metal,
                x * 1.02,
                1.65,
                -1.2
            );
        }

        // Front grille
        this.addBox(
            vehicle,
            1.0,
            0.3,
            0.08,
            black,
            0,
            0.95,
            length / 2 + 0.04
        );

        // Grille bars
        for (let i = -2; i <= 2; i++) {

            this.addBox(
                vehicle,
                0.045,
                0.27,
                0.05,
                metal,
                i * 0.19,
                0.95,
                length / 2 + 0.09
            );
        }

        // Front and rear bumpers
        this.addBox(
            vehicle,
            width + 0.15,
            0.22,
            0.18,
            black,
            0,
            0.75,
            length / 2 + 0.12
        );

        this.addBox(
            vehicle,
            width + 0.15,
            0.22,
            0.18,
            black,
            0,
            0.75,
            -length / 2 - 0.12
        );

        // Side mirrors
        for (const side of [-1, 1]) {

            this.addBox(
                vehicle,
                0.12,
                0.12,
                0.25,
                black,
                side * (width / 2 + 0.25),
                2.6,
                length / 2 - 0.5
            );

            this.addBox(
                vehicle,
                0.12,
                0.25,
                0.12,
                black,
                side * (width / 2 + 0.15),
                2.45,
                length / 2 - 0.45
            );
        }

        // Lower black side stripe
        for (const side of [-1, 1]) {

            this.addBox(
                vehicle,
                0.035,
                0.15,
                length * 0.85,
                black,
                side * (width / 2 + 0.02),
                1.15,
                0
            );
        }

        // Seats visible through the windows
        for (const z of [-1.2, -0.2, 0.8]) {

            this.addBox(
                vehicle,
                width * 0.65,
                0.38,
                0.45,
                interior,
                0,
                1.85,
                z
            );
        }

        // Route board
        this.addBox(
            vehicle,
            1.1,
            0.3,
            0.08,
            black,
            0,
            3.15,
            length / 2 + 0.08
        );

        // Lights
        this.addLights(vehicle, width, length);
    }

    // =====================================
    // KEKE MODEL
    // =====================================

    createKeke(vehicle, width, length) {

        const yellow = this.material(0xf3c820);
        const black = this.material(0x222222);
        const metal = this.material(0x777777, 0.7);
        const glass = this.material(0x527e91, 0.2, 0.3);
        const seat = this.material(0x35302b);

        // Lower passenger body
        this.addBox(
            vehicle,
            width,
            0.85,
            length * 0.75,
            yellow,
            0,
            1.05,
            -0.15
        );

        // Driver/front section
        this.addBox(
            vehicle,
            width * 0.82,
            0.75,
            1.05,
            yellow,
            0,
            1.35,
            0.95
        );

        // Passenger seats
        this.addBox(
            vehicle,
            width * 0.72,
            0.25,
            0.4,
            seat,
            0,
            1.55,
            -0.55
        );

        // Driver seat
        this.addBox(
            vehicle,
            0.55,
            0.3,
            0.4,
            seat,
            0,
            1.65,
            0.75
        );

        // Canopy roof
        this.addBox(
            vehicle,
            width * 0.95,
            0.13,
            length * 0.65,
            yellow,
            0,
            2.65,
            -0.1
        );

        // Canopy support bars
        for (const side of [-1, 1]) {

            const x = side * (width / 2 - 0.08);

            this.addBox(
                vehicle,
                0.08,
                1.25,
                0.08,
                black,
                x,
                2.0,
                -0.9
            );

            this.addBox(
                vehicle,
                0.08,
                1.25,
                0.08,
                black,
                x,
                2.0,
                0.75
            );

            // Side protection rails
            this.addBox(
                vehicle,
                0.08,
                0.08,
                1.55,
                metal,
                x,
                1.65,
                -0.1
            );

            // Side windows
            this.addBox(
                vehicle,
                0.035,
                0.75,
                1.1,
                glass,
                side * (width / 2 - 0.035),
                2.05,
                -0.15
            );
        }

        // Front windscreen
        this.addBox(
            vehicle,
            width * 0.72,
            0.85,
            0.07,
            glass,
            0,
            2.0,
            1.2
        );

        // Front windscreen frame
        this.addBox(
            vehicle,
            width * 0.8,
            0.08,
            0.09,
            black,
            0,
            2.46,
            1.23
        );

        // Front bumper
        this.addBox(
            vehicle,
            width,
            0.18,
            0.15,
            black,
            0,
            0.75,
            length / 2
        );

        // Front headlights
        for (const side of [-1, 1]) {

            this.addBox(
                vehicle,
                0.25,
                0.25,
                0.1,
                this.material(0xfff3c4),
                side * 0.55,
                1.1,
                length / 2 + 0.06
            );
        }

        // Three-wheel configuration:
        // One front wheel, two rear wheels.
        const frontWheel = this.addWheel(
            vehicle,
            0,
            0.48,
            1.15,
            0.38
        );

        const rearLeft = this.addWheel(
            vehicle,
            -width / 2 - 0.03,
            0.48,
            -0.85,
            0.42
        );

        const rearRight = this.addWheel(
            vehicle,
            width / 2 + 0.03,
            0.48,
            -0.85,
            0.42
        );

        vehicle.userData.customWheels = [
            frontWheel,
            rearLeft,
            rearRight
        ];
    }

    // =====================================
    // SEDAN MODEL
    // =====================================

    createSedan(vehicle, width, length, color) {

        const paint = this.material(color, 0.25, 0.35);
        const dark = this.material(0x202020);
        const glass = this.material(0x527e91, 0.3, 0.25);
        const chrome = this.material(0xaaaaaa, 0.85, 0.3);

        // Main body
        this.addBox(
            vehicle,
            width,
            0.85,
            length,
            paint,
            0,
            1.05,
            0
        );

        // Bonnet
        this.addBox(
            vehicle,
            width * 0.95,
            0.4,
            length * 0.3,
            paint,
            0,
            1.55,
            1.55
        );

        // Rear trunk
        this.addBox(
            vehicle,
            width * 0.94,
            0.4,
            length * 0.22,
            paint,
            0,
            1.55,
            -1.65
        );

        // Cabin
        this.addBox(
            vehicle,
            width * 0.82,
            0.95,
            length * 0.53,
            glass,
            0,
            2.05,
            -0.2
        );

        // Roof
        this.addBox(
            vehicle,
            width * 0.77,
            0.12,
            length * 0.34,
            paint,
            0,
            2.55,
            -0.25
        );

        // Front and rear windscreen frames
        this.addWindshield(
            vehicle,
            width * 0.76,
            0.7,
            length * 0.12,
            2.05
        );

        // Front grille
        this.addBox(
            vehicle,
            0.85,
            0.25,
            0.08,
            dark,
            0,
            1.1,
            length / 2 + 0.06
        );

        // Chrome grille detail
        this.addBox(
            vehicle,
            0.7,
            0.045,
            0.04,
            chrome,
            0,
            1.1,
            length / 2 + 0.11
        );

        // Bumpers
        this.addBox(
            vehicle,
            width + 0.1,
            0.16,
            0.15,
            dark,
            0,
            0.75,
            length / 2 + 0.1
        );

        this.addBox(
            vehicle,
            width + 0.1,
            0.16,
            0.15,
            dark,
            0,
            0.75,
            -length / 2 - 0.1
        );

        // Mirrors
        for (const side of [-1, 1]) {

            this.addBox(
                vehicle,
                0.16,
                0.12,
                0.22,
                dark,
                side * (width / 2 + 0.12),
                2.0,
                1.0
            );
        }

        // Lights
        this.addLights(vehicle, width, length);
    }

    // =====================================
    // CREATE VEHICLE
    // =====================================

    createVehicle(type, x, z, color) {

        const vehicle = new THREE.Group();

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

        if (type === "danfo") {
            this.createDanfo(vehicle, width, length);
        }

        if (type === "keke") {
            this.createKeke(vehicle, width, length);
        }

        if (type === "sedan") {
            this.createSedan(vehicle, width, length, color);
        }

        // Wheels
        const wheels = [];

        if (type !== "keke") {

            const wheelRadius = type === "danfo" ? 0.55 : 0.48;

            const positions = [
                [-width / 2, -length * 0.3],
                [width / 2, -length * 0.3],
                [-width / 2, length * 0.3],
                [width / 2, length * 0.3]
            ];

            positions.forEach(([wx, wz]) => {

                wheels.push(
                    this.addWheel(
                        vehicle,
                        wx,
                        0.55,
                        wz,
                        wheelRadius
                    )
                );

            });

        } else {
            wheels.push(...vehicle.userData.customWheels);
        }

        vehicle.position.set(x, 0, z);
        vehicle.rotation.y = Math.PI;

        this.scene.add(vehicle);

        const vehicleData = {
            type,
            object: vehicle,
            wheels,

            maxSpeed:
                type === "danfo" ? 19 :
                type === "keke" ? 15 : 24,

            length,
            width
        };

        this.vehicles.push(vehicleData);

        // INTERACTION
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
            0xf3c820
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

        if (this.world.hideInteraction) {
            this.world.hideInteraction();
        }

        console.log("Entered:", vehicleData.type);
    }

    // =====================================
    // EXIT VEHICLE
    // =====================================

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

    // =====================================
    // VEHICLE COLLISION DETECTION
    // =====================================

    canVehicleMove(vehicleData, x, z, yaw) {

        const halfWidth = vehicleData.width / 2 + 0.15;
        const halfLength = vehicleData.length / 2 + 0.15;

        const extentX =
            Math.abs(Math.cos(yaw)) * halfWidth +
            Math.abs(Math.sin(yaw)) * halfLength;

        const extentZ =
            Math.abs(Math.sin(yaw)) * halfWidth +
            Math.abs(Math.cos(yaw)) * halfLength;

        // STATIC COLLISIONS
        for (const collider of this.world.colliders) {

            const overlaps =
                x + extentX > collider.minX &&
                x - extentX < collider.maxX &&
                z + extentZ > collider.minZ &&
                z - extentZ < collider.maxZ;

            if (overlaps) return false;
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

            if (overlaps) return false;
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
        player.position.copy(vehicle.position);

        // ACCELERATION
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
            }

            else if (this.speed < 0) {
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

        if (canMoveX) vehicle.position.x = nextX;
        if (canMoveZ) vehicle.position.z = nextZ;

        if (!canMoveX || !canMoveZ) {
            this.speed = 0;
        }

        // WORLD BOUNDARIES
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

        // UPDATE INTERACTION POSITION
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

    // =====================================
    // EXIT BUTTON
    // =====================================

    updateInteractionButton() {

        if (!this.isDriving || !this.world.button) return;

        this.world.button.style.display = "flex";

        const icon = this.world.button.querySelector(
            "#interaction-icon"
        );

        const label = this.world.button.querySelector(
            "#interaction-label"
        );

        if (icon) icon.textContent = "🚪";
        if (label) label.textContent = "EXIT";

        this.world.currentInteraction = {
            action: () => {
                this.exitVehicle(this.playerReference);
            }
        };
    }

}
