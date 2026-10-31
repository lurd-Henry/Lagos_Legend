import * as THREE from "three";

export class AtmosphereSystems {

    constructor(scene, container) {

        this.scene = scene;
        this.container = container;

        this.time = 0;
        this.dayLength = 240;

        this.dayColor = new THREE.Color(0x9bcbd8);
        this.nightColor = new THREE.Color(0x101b35);

        this.ambient = new THREE.AmbientLight(
            0xffffff,
            0.35
        );

        this.sun = new THREE.DirectionalLight(
            0xffffff,
            1
        );

        this.sun.position.set(100, 150, 100);

        this.scene.add(this.ambient);
        this.scene.add(this.sun);

        this.createAtmosphereButton();
    }

    createAtmosphereButton() {

        if (!this.container) return;

        const button = document.createElement("button");

        button.id = "atmosphere-time-button";
        button.textContent = "🌞 DAY";

        button.style.cssText = `
            position:absolute;
            top:15px;
            right:15px;
            z-index:20;
            padding:10px 15px;
            border:1px solid rgba(255,255,255,.2);
            border-radius:10px;
            background:rgba(15,25,40,.85);
            color:white;
            font-size:12px;
            font-weight:bold;
            cursor:pointer;
        `;

        this.container.appendChild(button);

        this.button = button;

        button.addEventListener("click", () => {

            this.time = this.time < 0.5 ? 0.65 : 0.1;

            this.updateLighting(0);
        });
    }

    updateLighting(delta) {

        const cycle = (this.time % 1);

        const daylight = (
            Math.sin(cycle * Math.PI * 2 - Math.PI / 2) + 1
        ) / 2;

        const brightness = THREE.MathUtils.smoothstep(
            daylight,
            0.05,
            0.65
        );

        const sky = this.dayColor.clone().lerp(
            this.nightColor,
            1 - brightness
        );

        this.scene.background = sky;

        if (this.scene.fog) {
            this.scene.fog.color.copy(sky);
        }

        this.ambient.intensity =
            0.12 + brightness * 0.48;

        this.sun.intensity =
            0.08 + brightness * 1.2;

        this.sun.position.set(
            Math.cos(cycle * Math.PI * 2) * 150,
            30 + brightness * 150,
            100
        );

        if (this.button) {

            this.button.textContent =
                brightness > 0.45
                    ? "🌞 DAY"
                    : "🌙 NIGHT";
        }
    }

    update(delta) {

        this.time += delta / this.dayLength;

        this.updateLighting(delta);
    }

}
