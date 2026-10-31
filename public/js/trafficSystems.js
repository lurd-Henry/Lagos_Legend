import * as THREE from "three";

export class TrafficSystems {

    constructor(scene, world) {
        this.scene = scene;
        this.world = world;

        this.vehicles = [];

        this.roads = [-180, -120, -60, 0, 60, 120, 180];

        this.spawnTraffic(10);
    }

    material(color, metalness = 0) {
        return new THREE.MeshStandardMaterial({
            color,
            roughness: 0.65,
            metalness
        });
    }

    box(parent, w, h, d, material, x, y, z) {

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            material
        );

        mesh.position.set(x, y, z);

        parent.add(mesh);

        return mesh;
    }

    createTrafficVehicle(type, color) {

        const group = new THREE.Group();

        const paint = this.material(color);
        const black = this.material(0x202020);
        const glass = this.material(0x527e91, 0.2);
        const rubber = this.material(0x111111);

        let width = 2;
        let length = 4.5;
        let height = 1.3;

        if (type === "danfo") {
            width = 2.4;
            length = 5.5;
            height = 2;
        }

        if (type === "keke") {
            width = 1.7;
            length = 3;
            height = 1.3;
        }

        // Main body
        this.box(
            group,
            width,
            height,
            length,
            paint,
            0,
            height / 2 + 0.55,
            0
        );

        // Cabin
        this.box(
            group,
            width * 0.82,
            type === "danfo" ? 1.2 : 0.85,
            length * 0.55,
            glass,
            0,
            height + 1.1,
            -0.15
        );

        // Roof
        this.box(
            group,
            width * 0.85,
            0.12,
            length * 0.55,
            paint,
            0,
            height + 1.7,
            -0.15
        );

        // Front and rear bumpers
        for (const side of [-1, 1]) {

            this.box(
                group,
                0.35,
                0.25,
                0.1,
                this.material(0xffffdd),
                side * width * 0.3,
                1.05,
                length / 2
            );

            this.box(
                group,
                0.3,
                0.3,
                0.1,
                this.material(0xff2222),
                side * width * 0.3,
                1.05,
                -length / 2
            );
        }

        this.box(
            group,
            width + 0.1,
            0.2,
            0.15,
            black,
            0,
            0.75,
            length / 2
        );

        // Wheels
        const wheels = [];

        let positions;

        if (type === "keke") {
            positions = [
                [0, 1],
                [-width / 2, -0.8],
                [width / 2, -0.8]
            ];
        } else {
            positions = [
                [-width / 2, length * 0.3],
                [width / 2, length * 0.3],
                [-width / 2, -length * 0.3],
                [width / 2, -length * 0.3]
            ];
        }

        positions.forEach(([x, z]) => {

            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    type === "keke" ? 0.35 : 0.45,
                    type === "keke" ? 0.35 : 0.45,
                    0.25,
                    12
                ),
                rubber
            );

            wheel.rotation.z = Math.PI / 2;

            wheel.position.set(x, 0.5, z);

            group.add(wheel);

            wheels.push(wheel);
        });

        group.userData.wheels = wheels;

        return {
            object: group,
            wheels,
            width,
            length,
            type
        };
    }

    spawnTraffic(count) {

        const colors = [
            0xe6bd24,
            0x263b65,
            0xeeeeee,
            0x168c53,
            0x9c3535,
            0x444444
        ];

        for (let i = 0; i < count; i++) {

            const types = [
                "danfo",
                "danfo",
                "danfo",
                "danfo",
                "sedan",
                "sedan",
                "sedan",
                "keke",
                "keke",
                "keke"
            ];

            const type = types[i % types.length];

            const vehicle = this.createTrafficVehicle(
                type,
                type === "danfo" ? 0xe6bd24 :
                type === "keke" ? 0xf3c820 :
                colors[Math.floor(Math.random() * colors.length)]
            );

            const axis = Math.random() > 0.5 ? "x" : "z";

            const road = this.roads[
                Math.floor(Math.random() * this.roads.length)
            ];

            const direction = Math.random() > 0.5 ? 1 : -1;

            const lane = direction * 2.5;

            const coordinate = -180 +
                Math.random() * 360;

            if (axis === "z") {
                vehicle.object.position.set(
                    road + lane,
                    0,
                    coordinate
                );
            } else {
                vehicle.object.position.set(
                    coordinate,
                    0,
                    road + lane
                );
            }

            vehicle.axis = axis;
            vehicle.direction = direction;
            vehicle.road = road;
            vehicle.lane = lane;

            vehicle.speed = 5 + Math.random() * 3;
            vehicle.currentSpeed = vehicle.speed;

            vehicle.target = null;

            vehicle.pauseTimer = 0;

            vehicle.object.rotation.y =
                axis === "z"
                    ? direction > 0 ? 0 : Math.PI
                    : direction > 0 ? Math.PI / 2 : -Math.PI / 2;

            this.scene.add(vehicle.object);

            this.vehicles.push(vehicle);

            this.chooseNextTarget(vehicle);
        }
    }

    chooseNextTarget(vehicle) {

        const current = vehicle.object.position;

        const options = [];

        const roadIndex = this.roads.indexOf(vehicle.road);

        if (vehicle.axis === "z") {

            // Continue straight
            const nextZ = roadIndex >= 0
                ? current.z + vehicle.direction * 60
                : current.z + vehicle.direction * 60;

            if (Math.abs(nextZ) <= 240) {
                options.push({
                    axis: "z",
                    road: vehicle.road,
                    x: vehicle.road + vehicle.lane,
                    z: nextZ,
                    direction: vehicle.direction
                });
            }

            // Turn at intersections
            for (const newRoad of this.roads) {

                if (Math.abs(newRoad - current.x) < 4) continue;

                if (Math.abs(newRoad - current.x) <= 60) {

                    options.push({
                        axis: "x",
                        road: newRoad,
                        x: newRoad + vehicle.direction * 2.5,
                        z: current.z,
                        direction: Math.random() > 0.5 ? 1 : -1
                    });
                }
            }

        } else {

            const nextX = current.x + vehicle.direction * 60;

            if (Math.abs(nextX) <= 240) {

                options.push({
                    axis: "x",
                    road: vehicle.road,
                    x: nextX,
                    z: vehicle.road + vehicle.lane,
                    direction: vehicle.direction
                });
            }

            for (const newRoad of this.roads) {

                if (Math.abs(newRoad - current.z) < 4) continue;

                if (Math.abs(newRoad - current.z) <= 60) {

                    options.push({
                        axis: "z",
                        road: newRoad,
                        x: current.x,
                        z: newRoad + vehicle.direction * 2.5,
                        direction: Math.random() > 0.5 ? 1 : -1
                    });
                }
            }
        }

        if (options.length === 0) {
            vehicle.direction *= -1;
            vehicle.lane *= -1;
            return this.chooseNextTarget(vehicle);
        }

        // Prefer straight movement
        const straight = options.filter(
            option => option.axis === vehicle.axis
        );

        const chosen =
            straight.length && Math.random() < 0.65
                ? straight[Math.floor(Math.random() * straight.length)]
                : options[Math.floor(Math.random() * options.length)];

        vehicle.target = new THREE.Vector3(
            chosen.x,
            0,
            chosen.z
        );

        vehicle.nextAxis = chosen.axis;
        vehicle.nextRoad = chosen.road;
        vehicle.nextDirection = chosen.direction;
    }

    updateVehicle(vehicle, delta) {

        if (!vehicle.target) {
            this.chooseNextTarget(vehicle);
            return;
        }

        const position = vehicle.object.position;

        const dx = vehicle.target.x - position.x;
        const dz = vehicle.target.z - position.z;

        const distance = Math.hypot(dx, dz);

        // Check traffic ahead
        let blocked = false;

        for (const other of this.vehicles) {

            if (other === vehicle) continue;

            const distanceToOther =
                position.distanceTo(other.object.position);

            if (distanceToOther < 5) {
                blocked = true;
                break;
            }
        }

        // Slow down or accelerate
        const desiredSpeed = blocked ? 0 : vehicle.speed;

        vehicle.currentSpeed = THREE.MathUtils.damp(
            vehicle.currentSpeed,
            desiredSpeed,
            3,
            delta
        );

        if (distance < 0.8) {

            position.copy(vehicle.target);

            vehicle.axis = vehicle.nextAxis;
            vehicle.road = vehicle.nextRoad;
            vehicle.direction = vehicle.nextDirection;

            vehicle.lane = vehicle.axis === "z"
                ? vehicle.lane
                : vehicle.direction * 2.5;

            this.chooseNextTarget(vehicle);

            return;
        }

        const direction = new THREE.Vector3(
            dx,
            0,
            dz
        ).normalize();

        const movement = vehicle.currentSpeed * delta;

        position.addScaledVector(
            direction,
            Math.min(movement, distance)
        );

        const targetYaw = Math.atan2(
            direction.x,
            direction.z
        );

        let angleDifference =
            targetYaw - vehicle.object.rotation.y;

        angleDifference = Math.atan2(
            Math.sin(angleDifference),
            Math.cos(angleDifference)
        );

        vehicle.object.rotation.y += angleDifference *
            Math.min(1, delta * 5);

        vehicle.wheels.forEach(wheel => {
            wheel.rotation.x += vehicle.currentSpeed * delta;
        });
    }

    update(delta) {

        for (const vehicle of this.vehicles) {
            this.updateVehicle(vehicle, delta);
        }
    }

}
