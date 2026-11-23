import * as THREE from "three";

export class WorldSystems {

constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.interactables = [];
    this.playerRadius = 0.8;
    this.interactionDistance = 7;
    this.currentInteraction = null;
    this.createInteractionUI();
    this.buildingLabels = [];
this.labelVisibilityDistance = 70;
}
addBuildingLabel({ name, category, x, y, z, object }) {

    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "rgba(15, 23, 20, 0.92)";
    ctx.fillRect(8, 8, 496, 112);

    // Gold border
    ctx.strokeStyle = "#d9a441";
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, 496, 112);

    // Category
    ctx.fillStyle = "#d9a441";
    ctx.font = "bold 23px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        category.toUpperCase(),
        256,
        43
    );

    // Business name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";

    ctx.fillText(
        name.toUpperCase(),
        256,
        88,
        460
    );

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
    });

    const sprite = new THREE.Sprite(material);

    const labelWidth = Math.max(
        9,
        Math.min(15, 7 + name.length * 0.25)
    );

    sprite.scale.set(labelWidth, 3.2, 1);

    sprite.position.set(x, y, z);

    this.scene.add(sprite);

    this.buildingLabels.push({
        sprite,
        object,
        x,
        z,
        name
    });

    return sprite;
}
updateBuildingLabels(player, hidden = false) {

    if (!player) return;

    for (const label of this.buildingLabels) {

        const distance = Math.hypot(
            player.position.x - label.x,
            player.position.z - label.z
        );

        const visible =
            !hidden &&
            distance < this.labelVisibilityDistance &&
            (!label.object || label.object.visible);

        label.sprite.visible = visible;

        if (visible) {

            const fade = THREE.MathUtils.clamp(
                (this.labelVisibilityDistance - distance) / 20,
                0,
                1
            );

            label.sprite.material.opacity = fade;

        }

    }

}
// =====================================
// STATIC COLLIDERS
// =====================================
addCollider(x, z, width, depth) {
    this.colliders.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
    });
}
// Circular collision check
collides(x, z, radius = this.playerRadius) {
    for (const box of this.colliders) {
        const closestX = THREE.MathUtils.clamp(
            x,
            box.minX,
            box.maxX
        );
        const closestZ = THREE.MathUtils.clamp(
            z,
            box.minZ,
            box.maxZ
        );
        const dx = x - closestX;
        const dz = z - closestZ;
        if (
            dx * dx + dz * dz <
            radius * radius
        ) {
            return true;
        }
    }
    return false;
}
// Rectangular collision check for vehicles
collidesBox(x, z, width, depth) {
    const minX = x - width / 2;
    const maxX = x + width / 2;
    const minZ = z - depth / 2;
    const maxZ = z + depth / 2;
    for (const box of this.colliders) {
        const overlaps =
            maxX > box.minX &&
            minX < box.maxX &&
            maxZ > box.minZ &&
            minZ < box.maxZ;
        if (overlaps) return true;
    }
    return false;
}
// Movement with separate X/Z collision resolution
movePlayer(player, moveX, moveZ, speed, delta) {
    const nextX =
        player.position.x + moveX * speed * delta;
    const nextZ =
        player.position.z + moveZ * speed * delta;
    if (
        !this.collides(
            nextX,
            player.position.z,
            this.playerRadius
        )
    ) {
        player.position.x = nextX;
    }
    if (
        !this.collides(
            player.position.x,
            nextZ,
            this.playerRadius
        )
    ) {
        player.position.z = nextZ;
    }
}
// =====================================
// INTERACTIONS
// =====================================
addInteractable(object) {
    this.interactables.push(object);
}
hideInteraction() {
    this.currentInteraction = null;
    if (this.button) {
        this.button.style.display = "none";
    }
}
createInteractionUI() {
    const container =
        document.getElementById("game-container");
    if (!container) return;
    const button = document.createElement("button");
    button.id = "game-interact-button";
    button.innerHTML = `
        <span id="interaction-icon">🚪</span>
        <small id="interaction-label">OPEN</small>
    `;
    button.style.display = "none";
    container.appendChild(button);
    this.button = button;
    button.addEventListener("click", () => {
        this.interact();
    });
}
updateInteractions(player) {
    if (!this.button || !player) return;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const object of this.interactables) {
        const distance = Math.hypot(
            player.position.x - object.x,
            player.position.z - object.z
        );
        if (
            distance < this.interactionDistance &&
            distance < nearestDistance
        ) {
            nearest = object;
            nearestDistance = distance;
        }
    }
    if (!nearest) {
        this.hideInteraction();
        return;
    }
    this.currentInteraction = nearest;
    const icons = {
        building: ["🚪", "ENTER"],
        house: ["🚪", "ENTER"],
        vehicle: ["🚗", "ENTER"],
        shop: ["🏪", "SHOP"],
        bus: ["🚌", "BUS"],
        npc: ["👤", "TALK"]
    };
    const display =
        icons[nearest.type] || ["✋", "OPEN"];
    this.button.querySelector(
        "#interaction-icon"
    ).textContent = display[0];
    this.button.querySelector(
        "#interaction-label"
    ).textContent = display[1];
    this.button.style.display = "flex";
}
interact() {
    if (!this.currentInteraction) return;
    if (
        typeof this.currentInteraction.action === "function"
    ) {
        this.currentInteraction.action();
    }
}

}
