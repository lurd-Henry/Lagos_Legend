import * as THREE from "three";

import {
    createCharacter,
    updateCharacter
} from "./character.js";
import { NPCSystems } from "./npcSystems.js";
import { WorldSystems } from "./worldSystems.js";
import { VehicleSystems } from "./vehicleSystems.js";
// =====================================
// DEBUGGING - ERROR DETECTOR
// =====================================

window.addEventListener("error", (event) => {
    console.error("GAME ERROR:", event.message);
    console.error("FILE:", event.filename);
    console.error("LINE:", event.lineno);
});

window.addEventListener("unhandledrejection", (event) => {
    console.error("PROMISE ERROR:", event.reason);
});
// =====================================
// LAGOS LEGENDS - STAGE 3.4 - 3.6
// =====================================

const container = document.getElementById("game-container");
const coordinates = document.getElementById("coordinates");

// =====================================
// WORLD SETTINGS
// =====================================

const WORLD_SIZE = 600;
const WORLD_LIMIT = 265;

const scene = new THREE.Scene();
const world = new WorldSystems(scene);
const vehicleSystem = new VehicleSystems(scene, world);

scene.background = new THREE.Color(0x9bcbd8);
scene.fog = new THREE.Fog(0x9bcbd8, 120, 400);

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    800
);

const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// =====================================
// LIGHTING
// =====================================

scene.add(
    new THREE.HemisphereLight(0xffffff, 0x777766, 2)
);

const sunlight = new THREE.DirectionalLight(0xffffff, 2);

sunlight.position.set(80, 100, 50);
scene.add(sunlight);

// =====================================
// MATERIALS
// =====================================

const materials = {
    grass: new THREE.MeshStandardMaterial({ color: 0x77966a }),
    road: new THREE.MeshStandardMaterial({ color: 0x454545 }),
    pavement: new THREE.MeshStandardMaterial({ color: 0x999999 }),
    white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    yellow: new THREE.MeshBasicMaterial({ color: 0xe5c44a }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x99958b }),
    tree: new THREE.MeshStandardMaterial({ color: 0x477746 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x68452d }),
    metal: new THREE.MeshStandardMaterial({ color: 0x555b5d }),
    glass: new THREE.MeshStandardMaterial({
        color: 0x527b91,
        roughness: 0.3
    })
};

// =====================================
// GROUND
// =====================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
    materials.grass
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;

scene.add(ground);

// =====================================
// ROAD NETWORK
// =====================================

const ROAD_WIDTH = 14;
const SIDEWALK_WIDTH = 2;
const ROAD_POSITIONS = [-180, -120, -60, 0, 60, 120, 180];

function createRoad(x, z, horizontal = false) {

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(
            horizontal ? WORLD_SIZE : ROAD_WIDTH,
            0.12,
            horizontal ? ROAD_WIDTH : WORLD_SIZE
        ),
        materials.road
    );

    road.position.set(x, 0, z);
    scene.add(road);

    // Sidewalks
    for (const side of [-1, 1]) {

        const pavement = new THREE.Mesh(
            new THREE.BoxGeometry(
                horizontal ? WORLD_SIZE : SIDEWALK_WIDTH,
                0.18,
                horizontal ? SIDEWALK_WIDTH : WORLD_SIZE
            ),
            materials.pavement
        );

        pavement.position.set(
            horizontal ? x : x + side * (ROAD_WIDTH / 2 + 1),
            0.02,
            horizontal ? z + side * (ROAD_WIDTH / 2 + 1) : z
        );

        scene.add(pavement);
    }
}

// Vertical roads
ROAD_POSITIONS.forEach(x => {
    createRoad(x, 0, false);
});

// Horizontal roads
ROAD_POSITIONS.forEach(z => {
    createRoad(0, z, true);
});

// =====================================
// ROAD MARKINGS
// =====================================

function createRoadMarkings() {

    const lineLength = 5;
    const spacing = 13;

    // Vertical road markings
    ROAD_POSITIONS.forEach(x => {

        for (let z = -285; z <= 285; z += spacing) {

            const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.04, lineLength),
                materials.white
            );

            line.position.set(x, 0.09, z);
            scene.add(line);
        }

    });

    // Horizontal road markings
    ROAD_POSITIONS.forEach(z => {

        for (let x = -285; x <= 285; x += spacing) {

            const line = new THREE.Mesh(
                new THREE.BoxGeometry(lineLength, 0.04, 0.18),
                materials.white
            );

            line.position.set(x, 0.09, z);
            scene.add(line);
        }

    });
}

createRoadMarkings();

// =====================================
// BUILDING CREATION
// =====================================

const cityColors = [
    0xd5c3a3,
    0xc5b7a0,
    0xaaaeb5,
    0xc7a18a,
    0xd4d0c5,
    0xb7a68e
];

const residentialColors = [
    0xd6b18a,
    0xc98c69,
    0xd8c6a0,
    0xb9a28b,
    0xd2b7a0,
    0xc5b5a0
];

// =====================================
// CITY BUILDINGS
// =====================================

function createCityBuilding(x, z, width, depth, height, color) {

    const building = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
            color,
            flatShading: true
        })
    );

    body.position.y = height / 2;
    building.add(body);

    // Roof
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.8, 0.6, depth + 0.8),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );

    roof.position.y = height + 0.3;
    building.add(roof);

    // Windows on front and sides
    const floors = Math.floor(height / 3.5);

    for (let floor = 0; floor < floors; floor++) {

        for (let i = 0; i < 3; i++) {

            const frontWindow = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 1.4, 0.12),
                materials.glass
            );

            frontWindow.position.set(
                -width / 3 + i * (width / 3),
                2.2 + floor * 3.5,
                depth / 2 + 0.08
            );

            building.add(frontWindow);

        }

    }

    // Entrance
    const entrance = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x393d42 })
    );

    entrance.position.set(0, 1.4, depth / 2 + 0.1);
    building.add(entrance);

    building.position.set(x, 0, z);
scene.add(building);

world.addCollider(x, z, width, depth);

world.addInteractable({
    x,
    z: z + depth / 2 + 2,
    type: "building",
    action: () => {
        alert("Building interiors coming soon!");
    }
});
}

// =====================================
// RESIDENTIAL HOUSES
// =====================================

function createHouse(x, z, width, depth, color) {

    const house = new THREE.Group();

    const walls = new THREE.Mesh(
        new THREE.BoxGeometry(width, 4, depth),
        new THREE.MeshStandardMaterial({
            color,
            flatShading: true
        })
    );

    walls.position.y = 2;
    house.add(walls);

    // Roof
    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(width * 0.8, 2.5, 4),
        new THREE.MeshStandardMaterial({ color: 0x984b36 })
    ); 

    roof.position.y = 5;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    // Door
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 2.5, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x573b29 })
    );

    door.position.set(0, 1.25, depth / 2 + 0.08);
    house.add(door);

    // Windows
    for (const side of [-1, 1]) {

        const windowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 1.2, 0.12),
            materials.glass
        );

        windowMesh.position.set(
            side * (width / 3),
            2.5,
            depth / 2 + 0.08
        );

        house.add(windowMesh);
    }

    // Roof water tank
    const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x245c85 })
    );

    tank.position.set(width / 3, 5.5, -depth / 4);
    house.add(tank);

    house.position.set(x, 0, z);
scene.add(house);

world.addCollider(x, z, width, depth);

world.addInteractable({
    x,
    z: z + depth / 2 + 2,
    type: "house",
    action: () => {
        alert("House interiors coming soon!");
    }
});

return house; 

}

// =====================================
// COMPOUND FENCES
// =====================================

function createFence(x, z, width, depth) {

    const fenceMaterial = new THREE.MeshStandardMaterial({
        color: 0xb7b0a1
    });

    const fence = new THREE.Group();

    function wall(w, h, d, px, pz) {

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            fenceMaterial
        );

        mesh.position.set(px, h / 2, pz);
        fence.add(mesh);
        world.addCollider(
    x + px,
    z + pz,
    w,
    d
);
    }

    // Back and side walls.
    wall(width, 1.7, 0.35, 0, -depth / 2);
    wall(0.35, 1.7, depth, -width / 2, 0);
    wall(0.35, 1.7, depth, width / 2, 0);

    // Front wall sections leave a gate opening.
    wall(width * 0.36, 1.7, 0.35, -width * 0.32, depth / 2);
    wall(width * 0.36, 1.7, 0.35, width * 0.32, depth / 2);

    // Gate posts
    for (const side of [-1, 1]) {

        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 2.3, 0.6),
            materials.concrete
        );

        post.position.set(side * width * 0.14, 1.15, depth / 2);
        fence.add(post);
    }

    fence.position.set(x, 0, z);
    scene.add(fence);
}

// =====================================
// STREETLIGHTS
// =====================================

function createStreetlight(x, z) {

    const group = new THREE.Group();

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 6, 6),
        materials.metal
    );

    pole.position.y = 3;
    group.add(pole);

    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.12, 0.12),
        materials.metal
    );

    arm.position.set(0.8, 5.8, 0);
    group.add(arm);

    const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.25, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xffe8a3 })
    );

    lamp.position.set(1.5, 5.7, 0);
    group.add(lamp);

    group.position.set(x, 0, z);
    scene.add(group);
}

// =====================================
// ROADSIDE TREES
// =====================================

function createTree(x, z, scale = 1) {

    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.5, 3, 6),
        materials.trunk
    );

    trunk.position.y = 1.5;
    tree.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 7, 6),
        materials.tree
    );

    leaves.position.y = 4;
    tree.add(leaves);

    tree.scale.setScalar(scale);

    tree.position.set(x, 0, z);
    scene.add(tree);
}

// =====================================
// ROADSIDE KIOSKS
// =====================================

function createKiosk(x, z, color) {

    const kiosk = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(5, 3.2, 4),
        new THREE.MeshStandardMaterial({ color })
    );

    body.position.y = 1.6;
    kiosk.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 0.35, 4.5),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );

    roof.position.y = 3.4;
    kiosk.add(roof);

    // Shop opening
    const opening = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.4, 0.1),
        materials.glass
    );

    opening.position.set(0, 2, 2.05);
    kiosk.add(opening);

    kiosk.position.set(x, 0, z);
    scene.add(kiosk);
    world.addCollider(x, z, 5.5, 4.5);

world.addInteractable({
    x,
    z,
    type: "shop",
    action: () => {
        alert("Welcome! This shop will be available soon.");
    }
});
}

// =====================================
// BUS STOPS
// =====================================

function createBusStop(x, z) {

    const stop = new THREE.Group();

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.4, 3),
        new THREE.MeshStandardMaterial({ color: 0x267b63 })
    );

    roof.position.y = 3.5;
    stop.add(roof);

    for (const px of [-3.5, 3.5]) {

        const pillar = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 3.5, 0.3),
            materials.metal
        );

        pillar.position.set(px, 1.75, 0);
        stop.add(pillar);
    }

    const bench = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.3, 1),
        new THREE.MeshStandardMaterial({ color: 0x65442c })
    );

    bench.position.set(0, 1, 0.7);
    stop.add(bench);

    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xf0cf46 })
    );

    sign.position.set(0, 2.8, 1.5);
    stop.add(sign);

    stop.position.set(x, 0, z);
    scene.add(stop);
    world.addCollider(x, z, 8, 3);

world.addInteractable({
    x,
    z,
    type: "bus",
    action: () => {
        alert("Public transport services coming soon!");
    }
});
}

// =====================================
// COMMERCIAL DISTRICT GENERATION
// =====================================

const commercialBuildings = [
    [-30, -35, 15, 15, 24],
    [30, -35, 15, 15, 18],
    [-30, 35, 16, 15, 28],
    [30, 35, 15, 15, 21],

    [-90, -30, 16, 15, 20],
    [-90, 30, 15, 15, 16],
    [90, -30, 16, 15, 25],
    [90, 30, 15, 15, 19],

    [-150, -30, 15, 15, 18],
    [150, 30, 15, 15, 23]
];

commercialBuildings.forEach((building, index) => {

    const [x, z, width, depth, height] = building;

    createCityBuilding(
        x,
        z,
        width,
        depth,
        height,
        cityColors[index % cityColors.length]
    );

});

// =====================================
// RESIDENTIAL DISTRICTS
// =====================================

const residentialLocations = [
    [-220, -35],
    [-220, 35],
    [-220, 90],
    [-220, 150],

    [220, -35],
    [220, 35],
    [220, 90],
    [220, 150],

    [-150, 90],
    [-90, 90],
    [90, 90],
    [150, 90],

    [-150, -90],
    [-90, -90],
    [90, -90],
    [150, -90],

    [-220, -150],
    [220, -150]
];

residentialLocations.forEach((location, index) => {

    const [x, z] = location;

    createHouse(
        x,
        z,
        13,
        15,
        residentialColors[index % residentialColors.length]
    );

    createFence(x, z, 19, 22);

});

// =====================================
// ADDITIONAL CITY STRUCTURES
// =====================================

// Small shops
createKiosk(-50, 90, 0xd8a13b);
createKiosk(50, -90, 0xc96d38);
createKiosk(150, 90, 0x3d9970);

// Bus stops
createBusStop(-12, -90);
createBusStop(12, 90);

// =====================================
// STREETLIGHT PLACEMENT
// =====================================

for (let z = -240; z <= 240; z += 60) {

    createStreetlight(-10, z);
    createStreetlight(10, z);

}

for (let x = -240; x <= 240; x += 60) {

    createStreetlight(x, -10);
    createStreetlight(x, 10);

}

// =====================================
// TREE PLACEMENT
// =====================================

const treeLocations = [
    [-50, -45], [50, 45],
    [-110, -45], [110, 45],
    [-170, -45], [170, 45],
    [-50, 110], [50, -110],
    [-170, 110], [170, -110],
    [-250, 50], [250, -50],
    [-250, 150], [250, 150]
];

treeLocations.forEach((position, index) => {

    createTree(
        position[0],
        position[1],
        index % 3 === 0 ? 1.2 : 0.9
    );

});

// =====================================
// WORLD BOUNDARIES
// =====================================

const boundaryMaterial = new THREE.MeshStandardMaterial({
    color: 0x6c795c
});

function createBoundary(x, z, width, depth) {

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, 3, depth),
        boundaryMaterial
    );

    wall.position.set(x, 1.5, z);
    scene.add(wall);
}

createBoundary(0, -WORLD_LIMIT, WORLD_SIZE, 2);
createBoundary(0, WORLD_LIMIT, WORLD_SIZE, 2);
createBoundary(-WORLD_LIMIT, 0, 2, WORLD_SIZE);
createBoundary(WORLD_LIMIT, 0, 2, WORLD_SIZE);

// =====================================
// PLAYER
// =====================================

const player = createCharacter();
scene.add(player);

vehicleSystem.playerReference = player;
// =====================================
// CHARACTER CUSTOMISATION
// =====================================

const panel = document.getElementById("character-panel");
const customiseButton = document.getElementById("customise-button");
const closeButton = document.getElementById("close-panel");

customiseButton.addEventListener("click", () => {
    panel.classList.add("open");
});

closeButton.addEventListener("click", () => {
    panel.classList.remove("open");
});

const selectors = {
    skin: "skin-select",
    hairstyle: "hairstyle-select",
    hair: "hair-select",
    top: "top-select",
    trousers: "trousers-select",
    shoes: "shoes-select"
};

Object.entries(selectors).forEach(([property, id]) => {

    const element = document.getElementById(id);

    element.addEventListener("change", () => {

        updateCharacter(player, {
            [property]: Number(element.value)
        });

    });

});

// Randomise character
document.getElementById("randomise-button").addEventListener("click", () => {

    const randomAppearance = {};

    Object.entries(selectors).forEach(([property, id]) => {

        const element = document.getElementById(id);

        const value = Math.floor(Math.random() * element.options.length);

        element.value = value;
        randomAppearance[property] = value;

    });

    updateCharacter(player, randomAppearance);

});

// Reset character
document.getElementById("reset-button").addEventListener("click", () => {

    const defaults = {
        skin: 1,
        hairstyle: 0,
        hair: 0,
        top: 0,
        trousers: 0,
        shoes: 0
    };

    Object.entries(selectors).forEach(([property, id]) => {

        document.getElementById(id).value = defaults[property];

    });

    updateCharacter(player, defaults);

});

// =====================================
// THIRD-PERSON CAMERA
// =====================================

let cameraYaw = 0;
let cameraPitch = 0.25;

const cameraDistance = 10;
const cameraHeight = 2.5;

let cameraTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;

let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

const cameraSensitivity = 0.006;

function updateCamera() {

    const horizontalDistance =
        cameraDistance * Math.cos(cameraPitch);

    const cameraX =
        player.position.x +
        Math.sin(cameraYaw) * horizontalDistance;

    const cameraZ =
        player.position.z +
        Math.cos(cameraYaw) * horizontalDistance;

    const cameraY =
        player.position.y +
        cameraHeight +
        cameraDistance * Math.sin(cameraPitch);

    camera.position.lerp(
        new THREE.Vector3(cameraX, cameraY, cameraZ),
        0.15
    );

    camera.lookAt(
        player.position.x,
        player.position.y + 1.5,
        player.position.z
    );

}

// Mobile camera controls
renderer.domElement.addEventListener("pointerdown", event => {

    if (event.pointerType === "mouse") return;

    if (event.clientX < window.innerWidth * 0.45) return;

    if (cameraTouchId !== null) return;

    cameraTouchId = event.pointerId;

    lastTouchX = event.clientX;
    lastTouchY = event.clientY;

    renderer.domElement.setPointerCapture(event.pointerId);

});

renderer.domElement.addEventListener("pointermove", event => {

    if (event.pointerId !== cameraTouchId) return;

    const deltaX = event.clientX - lastTouchX;
    const deltaY = event.clientY - lastTouchY;

    cameraYaw -= deltaX * cameraSensitivity;
    cameraPitch += deltaY * cameraSensitivity;

    cameraPitch = THREE.MathUtils.clamp(cameraPitch, -0.35, 0.85);

    lastTouchX = event.clientX;
    lastTouchY = event.clientY;

});

function releaseCameraTouch(event) {

    if (event.pointerId === cameraTouchId) {
        cameraTouchId = null;
    }

}

renderer.domElement.addEventListener("pointerup", releaseCameraTouch);
renderer.domElement.addEventListener("pointercancel", releaseCameraTouch);

// PC mouse camera
renderer.domElement.addEventListener("mousedown", event => {

    if (event.button !== 2) return;

    mouseDown = true;

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

});

window.addEventListener("mouseup", () => {
    mouseDown = false;
});

window.addEventListener("mousemove", event => {

    if (!mouseDown) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    cameraYaw -= deltaX * cameraSensitivity;
    cameraPitch += deltaY * cameraSensitivity;

    cameraPitch = THREE.MathUtils.clamp(cameraPitch, -0.35, 0.85);

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

});

renderer.domElement.addEventListener("contextmenu", event => {
    event.preventDefault();
});

// =====================================
// KEYBOARD CONTROLS
// =====================================

const keys = {};
window.addEventListener("keydown", event => {

    if (event.key.toLowerCase() === "e") {

        if (vehicleSystem.isDriving) {

            vehicleSystem.exitVehicle(player);

        } else {

            world.interact();

        }

    }

});
window.addEventListener("keydown", event => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

// =====================================
// MOBILE JOYSTICK
// =====================================

const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystick-knob");

let joystickX = 0;
let joystickY = 0;
let pointerId = null;
let sprintLocked = false;
let sprintToggled = false;

// VEHICLE BUTTON STATES

let accelerating = false;
let braking = false;

// MOBILE HUD

const sprintButton = document.getElementById("sprint-button");

const walkingControls = document.getElementById("walking-controls");
const vehicleControls = document.getElementById("vehicle-controls");

const accelerateButton = document.getElementById("accelerate-button");
const brakeButton = document.getElementById("brake-button");
const exitVehicleButton = document.getElementById("exit-vehicle-button");

function resetJoystick() {

    joystickX = 0;
    joystickY = 0;
    pointerId = null;

    knob.style.transform = "translate(0px, 0px)";

}
    // SPRINT SYSTEM

function updateJoystick(event) {

    const rect = joystick.getBoundingClientRect();

    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);

    const max = 40;

    const distance = Math.hypot(x, y);

    if (distance > max) {

        x = (x / distance) * max;
        y = (y / distance) * max;

    }

    joystickX = x / max;
    joystickY = y / max;

    // Sprint-lock zone
    if (!vehicleSystem.isDriving) {

        if (joystickY < -0.88 && Math.abs(joystickX) < 0.4) {

            sprintLocked = true;

            // Return the joystick visually to its resting position.
            resetJoystick();

            return;

        }

        // Pulling backwards cancels sprint lock.
        if (joystickY > 0.2) {
            sprintLocked = false;
        }

    }

    knob.style.transform = `translate(${x}px, ${y}px)`;

}

joystick.addEventListener("pointerdown", event => {

    if (pointerId !== null) return;

    event.preventDefault();
    if (!vehicleSystem.isDriving) {
    sprintLocked = false;
}

    pointerId = event.pointerId;

    joystick.setPointerCapture(pointerId);

    updateJoystick(event);
});
// SPRINT TOGGLE

sprintButton.addEventListener("click", () => {

    if (vehicleSystem.isDriving) return;

    sprintToggled = !sprintToggled;

    sprintButton.classList.toggle(
        "active",
        sprintToggled
    );
});

joystick.addEventListener("pointermove", event => {

    if (event.pointerId === pointerId) {
        updateJoystick(event);
    }

});

joystick.addEventListener("pointerup", event => {

    if (event.pointerId === pointerId) {
        resetJoystick();
    }

});

joystick.addEventListener("pointercancel", resetJoystick);
// HOLD ACCELERATION

function startAccelerating(event) {

    event.preventDefault();
    accelerating = true;

    accelerateButton.classList.add("active");

}

function stopAccelerating() {

    accelerating = false;

    accelerateButton.classList.remove("active");

}

accelerateButton.addEventListener("pointerdown", startAccelerating);
accelerateButton.addEventListener("pointerup", stopAccelerating);
accelerateButton.addEventListener("pointercancel", stopAccelerating);
accelerateButton.addEventListener("lostpointercapture", stopAccelerating);

// HOLD BRAKE / REVERSE

function startBraking(event) {

    event.preventDefault();
    braking = true;

    brakeButton.classList.add("active");

}

function stopBraking() {

    braking = false;

    brakeButton.classList.remove("active");

}

brakeButton.addEventListener("pointerdown", startBraking);
brakeButton.addEventListener("pointerup", stopBraking);
brakeButton.addEventListener("pointercancel", stopBraking);
brakeButton.addEventListener("lostpointercapture", stopBraking);

// EXIT VEHICLE

exitVehicleButton.addEventListener("click", () => {

    if (vehicleSystem.isDriving) {
        vehicleSystem.exitVehicle(player);
    }

});
// =====================================
// GAME LOOP
// =====================================

const clock = new THREE.Clock();
const direction = new THREE.Vector2();

function animate() {

requestAnimationFrame(animate);
const delta = Math.min(clock.getDelta(), 0.05);
let moveX = joystickX;
let moveZ = joystickY;
if (keys["w"] || keys["arrowup"]) moveZ -= 1;
if (keys["s"] || keys["arrowdown"]) moveZ += 1;
if (keys["a"] || keys["arrowleft"]) moveX -= 1;
if (keys["d"] || keys["arrowright"]) moveX += 1;
direction.set(moveX, moveZ);
// Sprint lock automatically moves the player forward.
if (!vehicleSystem.isDriving && sprintLocked) {
    direction.set(0, -1);
}
if (direction.length() > 1) {
    direction.normalize();
}
const moving = direction.length() > 0.05;
// =====================================
// WALKING AND DRIVING
// =====================================
if (vehicleSystem.isDriving) {
    const steering = {
        x: joystickX
    };
    const gas =
        accelerating ||
        keys["w"] ||
        keys["arrowup"];
    const brake =
        braking ||
        keys["s"] ||
        keys["arrowdown"];
    vehicleSystem.update(
        player,
        steering,
        gas,
        brake,
        delta
    );
    walkingControls.style.display = "none";
    vehicleControls.style.display = "flex";
} else {
    vehicleControls.style.display = "none";
    walkingControls.style.display = "block";
    const running =
        sprintLocked ||
        sprintToggled ||
        !!keys["shift"];
    const speed = running ? 12 : 7;
    if (moving) {
        const forwardX = -Math.sin(cameraYaw);
        const forwardZ = -Math.cos(cameraYaw);
        const rightX = Math.cos(cameraYaw);
        const rightZ = -Math.sin(cameraYaw);
        const worldX =
            rightX * direction.x +
            forwardX * -direction.y;
        const worldZ =
            rightZ * direction.x +
            forwardZ * -direction.y;
        world.movePlayer(
            player,
            worldX,
            worldZ,
            speed,
            delta
        );
        player.rotation.y = Math.atan2(worldX, worldZ);
    }
    player.userData.animate(
        clock.elapsedTime,
        moving,
        running
    );
}
// =====================================
// WORLD BOUNDARIES
// =====================================
player.position.x = THREE.MathUtils.clamp(
    player.position.x,
    -WORLD_LIMIT + 5,
    WORLD_LIMIT - 5
);
player.position.z = THREE.MathUtils.clamp(
    player.position.z,
    -WORLD_LIMIT + 5,
    WORLD_LIMIT - 5
);
// =====================================
// CAMERA AND HUD
// =====================================
// =====================================
// AUTOMATIC VEHICLE CAMERA FOLLOW
// =====================================

if (vehicleSystem.isDriving && vehicleSystem.currentVehicle) {

    const vehicleYaw =
        vehicleSystem.currentVehicle.object.rotation.y;

    // Keep camera behind the vehicle.
    const targetYaw = vehicleYaw - Math.PI;

    // Smoothly rotate camera towards vehicle direction.
    const angleDifference = Math.atan2(
        Math.sin(targetYaw - cameraYaw),
        Math.cos(targetYaw - cameraYaw)
    );

    cameraYaw += angleDifference * Math.min(1, delta * 3);
}

updateCamera();
coordinates.textContent =
    `X: ${player.position.x.toFixed(1)} | Z: ${player.position.z.toFixed(1)}`;
if (vehicleSystem.isDriving) {
    world.button.style.display = "none";
} else {
    world.updateInteractions(player);
}
renderer.render(scene, camera);

}

animate();

// =====================================
// RESIZE
// =====================================

window.addEventListener("resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});

console.log("LAGOS LEGENDS: STAGE 3.4 - 3.6 LOADED!");
