import * as THREE from "three";

export class WorldMapSystem {

    constructor(player, worldSize = 600) {

        this.player = player;
        this.worldSize = worldSize;

        this.min = -265;
        this.max = 265;

        this.locations = [];

        this.isExpanded = false;

        // Minimap zoom.
        this.zoom = 1.5;
        this.cameraYaw = 0;

        this.createUI();
        this.createCanvas();
        this.resizeCanvas();

        window.addEventListener("resize", () => {
            this.resizeCanvas();
        });

    }
setCameraYaw(yaw) {
    this.cameraYaw = yaw;
}

    // ==========================================
    // UI
    // ==========================================

    createUI() {

        const container =
            document.getElementById("game-container");

        if (!container) return;

        const wrapper = document.createElement("div");

        wrapper.id = "world-minimap";

        wrapper.innerHTML = `

            <div id="world-minimap-header">

                <span>🗺 LAGOS</span>

                <button
                    id="world-map-expand"
                    type="button"
                    aria-label="Expand map"
                >
                    ⛶
                </button>

            </div>

            <canvas id="world-map-canvas"></canvas>

            <div id="world-map-legend">

                <span>▲ YOU</span>
                <span>● LOCATION</span>
                <span>━ ROAD</span>

            </div>

            <div id="world-map-coordinates">
                LAGOS CITY
            </div>

        `;

        container.appendChild(wrapper);

        this.wrapper = wrapper;

        this.expandButton =
            wrapper.querySelector("#world-map-expand");

        this.canvas =
            wrapper.querySelector("#world-map-canvas");

        this.expandButton.addEventListener(
            "click",
            () => this.toggleExpanded()
        );

        this.canvas.addEventListener(
            "click",
            () => this.toggleExpanded()
        );

    }


    // ==========================================
    // CANVAS
    // ==========================================

    createCanvas() {

        if (!this.canvas) return;

        this.ctx = this.canvas.getContext("2d");

    }


    resizeCanvas() {

        if (!this.canvas || !this.ctx) return;

        const rect = this.canvas.getBoundingClientRect();

        const dpr = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        this.canvas.width = Math.max(
            1,
            Math.floor(rect.width * dpr)
        );

        this.canvas.height = Math.max(
            1,
            Math.floor(rect.height * dpr)
        );

        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

    }


    // ==========================================
    // LOCATIONS
    // ==========================================

    addLocation({
        id,
        name,
        type,
        x,
        z,
        icon = "📍"
    }) {

        const existing = this.locations.find(
            location => location.id === id
        );

        if (existing) return existing;

        const location = {
            id,
            name,
            type,
            x,
            z,
            icon
        };

        this.locations.push(location);

        return location;

    }


    removeLocation(id) {

        this.locations = this.locations.filter(
            location => location.id !== id
        );

    }


    // ==========================================
    // WORLD TO MAP
    // ==========================================

    worldToMap(x, z) {

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        const playerX = this.player.position.x;
        const playerZ = this.player.position.z;

        const scale =
            Math.min(width, height) /
            (this.isExpanded ? 530 : 180);

        const dx = (x - playerX) * scale;
        const dz = (z - playerZ) * scale;

       const angle = this.isExpanded
    ? 0
    : this.cameraYaw;

        const rotatedX =
            dx * Math.cos(angle) -
            dz * Math.sin(angle);

        const rotatedY =
            dx * Math.sin(angle) +
            dz * Math.cos(angle);

        return {

            x: width / 2 + rotatedX,
            y: height / 2 + rotatedY

        };

    }


    // ==========================================
    // BACKGROUND
    // ==========================================

    drawBackground() {

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        const ctx = this.ctx;

        ctx.fillStyle = "#17231f";

        ctx.fillRect(0, 0, width, height);

        // Subtle terrain grid.

        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.lineWidth = 1;

        const gridSize = 30;

        for (let x = 0; x < width; x += gridSize) {

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

        }

        for (let y = 0; y < height; y += gridSize) {

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

        }

        // Map boundary.

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            1,
            1,
            width - 2,
            height - 2
        );

    }


    // ==========================================
    // ROADS
    // ==========================================

    drawRoads() {

        const roads = [
            -240,
            -180,
            -120,
            -60,
            0,
            60,
            120,
            180,
            240
        ];

        const ctx = this.ctx;

        // Secondary roads.

        ctx.strokeStyle = "#53635a";
        ctx.lineWidth = this.isExpanded ? 5 : 4;

        for (const z of roads) {

            const start = this.worldToMap(this.min, z);
            const end = this.worldToMap(this.max, z);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

        }

        for (const x of roads) {

            const start = this.worldToMap(x, this.min);
            const end = this.worldToMap(x, this.max);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

        }

        // Main roads.

        ctx.strokeStyle = "#87958a";
        ctx.lineWidth = this.isExpanded ? 9 : 6;

        for (const z of [-120, 0, 120]) {

            const start = this.worldToMap(this.min, z);
            const end = this.worldToMap(this.max, z);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

        }

        for (const x of [-120, 0, 120]) {

            const start = this.worldToMap(x, this.min);
            const end = this.worldToMap(x, this.max);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

        }

    }


    // ==========================================
    // LOCATION COLORS
    // ==========================================

    getLocationColor(type) {

        const colors = {

            kiosk: "#eab54b",
            job: "#f59e0b",
            bus: "#60a5fa",
            bank: "#4ade80",
            hospital: "#f87171",
            shop: "#c084fc",
            restaurant: "#fb923c"

        };

        return colors[type] || "#ffffff";

    }


    // ==========================================
    // DRAW LOCATIONS
    // ==========================================

    drawLocation(location) {

        const position = this.worldToMap(
            location.x,
            location.z
        );

        const ctx = this.ctx;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        if (
            position.x < -20 ||
            position.x > width + 20 ||
            position.y < -20 ||
            position.y > height + 20
        ) return;

        const radius = this.isExpanded ? 6 : 4;

        ctx.beginPath();

        ctx.arc(
            position.x,
            position.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            this.getLocationColor(location.type);

        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;

        ctx.stroke();

        if (this.isExpanded) {

            ctx.font = "12px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";

            ctx.fillStyle = "#ffffff";

            ctx.fillText(
                location.name,
                position.x + 10,
                position.y
            );

        }

    }


    // ==========================================
    // PLAYER DIRECTION
    // ==========================================

   drawPlayer() {

    if (!this.player) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const ctx = this.ctx;

    const x = width / 2;
    const y = height / 2;

    ctx.save();

    ctx.translate(x, y);

    // Expanded map is north-up, so rotate the player arrow.
    // Minimap rotates with the camera, so the arrow stays upright.
    const playerYaw = this.player.rotation.y;

const arrowRotation = this.isExpanded
    ? playerYaw
    : playerYaw - this.cameraYaw;

ctx.rotate(arrowRotation);

    // Player glow
    ctx.beginPath();
    ctx.arc(
        0,
        0,
        this.isExpanded ? 17 : 13,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "rgba(56,189,248,0.25)";
    ctx.fill();

    // Direction arrow
    ctx.beginPath();

    ctx.moveTo(-9, 10);
    ctx.lineTo(9, 10);
    ctx.lineTo(0, 16);
    ctx.lineTo(0, -14);

    ctx.closePath();

    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
}

    // ==========================================
    // MAP COMPASS
    // ==========================================

    drawCompass() {

        if (!this.isExpanded) return;

        const ctx = this.ctx;

        ctx.save();

        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            "N",
            this.canvas.clientWidth - 20,
            22
        );

        ctx.beginPath();

        ctx.moveTo(
            this.canvas.clientWidth - 20,
            28
        );

        ctx.lineTo(
            this.canvas.clientWidth - 25,
            40
        );

        ctx.lineTo(
            this.canvas.clientWidth - 15,
            40
        );

        ctx.closePath();

        ctx.fillStyle = "#ef4444";
        ctx.fill();

        ctx.restore();

    }


    // ==========================================
    // DRAW
    // ==========================================

    draw() {

        if (!this.ctx || !this.canvas) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        if (!width || !height) return;

        this.ctx.clearRect(0, 0, width, height);

        this.drawBackground();

        this.drawRoads();

        for (const location of this.locations) {

            this.drawLocation(location);

        }

        this.drawPlayer();

        this.drawCompass();

    }


    // ==========================================
    // UPDATE
    // ==========================================

    update() {

        this.draw();

    }


    // ==========================================
    // EXPAND MAP
    // ==========================================

    toggleExpanded() {

        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {

            this.wrapper.classList.add("expanded");

            this.expandButton.textContent = "✕";

        } else {

            this.wrapper.classList.remove("expanded");

            this.expandButton.textContent = "⛶";

        }

        requestAnimationFrame(() => {

            this.resizeCanvas();
            this.draw();

        });

    }

}
