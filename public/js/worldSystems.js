import * as THREE from “three”;

export class WorldSystems {

constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.interactables = [];
    this.playerRadius = 0.8;
    this.interactionDistance = 7;
    this.currentInteraction = null;
    this.createInteractionUI();
}
// COLLISION SYSTEM
addCollider(x, z, width, depth) {
    this.colliders.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
    });
}
collides(x, z) {
    const radius = this.playerRadius;
    for (const box of this.colliders) {
        const closestX = THREE.MathUtils.clamp(
            x, box.minX, box.maxX
        );
        const closestZ = THREE.MathUtils.clamp(
            z, box.minZ, box.maxZ
        );
        const dx = x - closestX;
        const dz = z - closestZ;
        if (dx * dx + dz * dz < radius * radius) {
            return true;
        }
    }
    return false;
}
movePlayer(player, moveX, moveZ, speed, delta) {
    const nextX = player.position.x + moveX * speed * delta;
    const nextZ = player.position.z + moveZ * speed * delta;
    if (!this.collides(nextX, player.position.z)) {
        player.position.x = nextX;
    }
    if (!this.collides(player.position.x, nextZ)) {
        player.position.z = nextZ;
    }
}
// INTERACTIONS
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
    const container = document.getElementById("game-container");
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
    const display = icons[nearest.type] || ["✋", "OPEN"];
    this.button.querySelector("#interaction-icon").textContent = display[0];
    this.button.querySelector("#interaction-label").textContent =
        display[1];
    this.button.style.display = "flex";
}
interact() {
    if (!this.currentInteraction) return;
    if (typeof this.currentInteraction.action === "function") {
        this.currentInteraction.action();
    }
}

}
