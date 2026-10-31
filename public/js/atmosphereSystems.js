import * as THREE from "three";

export class AtmosphereSystems {

constructor(scene, container, options = {}) {
    this.scene = scene;
    this.container = container;
    this.ambient = options.ambientLight;
    this.sun = options.sunlight;
    this.clockElement = options.clockElement;
    this.streetlightMaterials =
        options.streetlightMaterials || [];
    this.timezone = "Africa/Lagos";
    this.serverEpoch = Date.now();
    this.syncPerformanceTime = performance.now();
    this.lastClockUpdate = 0;
    this.lastSync = 0;
    this.dayColor = new THREE.Color(0x9bcbd8);
    this.sunsetColor = new THREE.Color(0xe99b69);
    this.nightColor = new THREE.Color(0x101b35);
    this.currentSky = new THREE.Color();
    this.syncServerTime();
}
// =====================================
// SERVER TIME SYNCHRONISATION
// =====================================
async syncServerTime() {
    try {
        const response = await fetch("/api/time", {
            cache: "no-store"
        });
        if (!response.ok) {
            throw new Error("Server time unavailable");
        }
        const data = await response.json();
        if (data.status !== "success") {
            throw new Error("Invalid server time response");
        }
        this.serverEpoch = data.epochMs;
        this.syncPerformanceTime = performance.now();
        this.lastSync = performance.now();
        console.log(
            "Lagos Legends time synchronised:",
            data.time,
            data.date
        );
    } catch (error) {
        console.warn(
            "Using device time temporarily:",
            error.message
        );
    }
}
getCurrentTime() {
    const elapsed =
        performance.now() - this.syncPerformanceTime;
    return new Date(
        this.serverEpoch + elapsed
    );
}
getNigeriaTime() {
    const date = this.getCurrentTime();
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: this.timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);
    const values = {};
    parts.forEach(part => {
        values[part.type] = part.value;
    });
    return {
        date,
        hour: Number(values.hour),
        minute: Number(values.minute),
        second: Number(values.second),
        formatted: `${values.hour}:${values.minute}:${values.second}`
    };
}
// =====================================
// DAYLIGHT CALCULATION
// =====================================
smoothStep(value, min, max) {
    const x = THREE.MathUtils.clamp(
        (value - min) / (max - min),
        0,
        1
    );
    return x * x * (3 - 2 * x);
}
getDaylight(hour) {
    const sunrise = this.smoothStep(
        hour,
        5,
        7
    );
    const sunset = 1 - this.smoothStep(
        hour,
        17,
        19
    );
    return sunrise * sunset;
}
// =====================================
// LIGHTING
// =====================================
updateLighting(hour) {
    const daylight = this.getDaylight(hour);
    const sunriseAmount =
        1 - this.smoothStep(hour, 6, 9);
    const sunsetAmount =
        this.smoothStep(hour, 16, 18);
    const twilight = Math.max(
        sunriseAmount,
        sunsetAmount
    );
    this.currentSky.copy(this.nightColor);
    this.currentSky.lerp(
        this.dayColor,
        daylight
    );
    this.currentSky.lerp(
        this.sunsetColor,
        twilight * 0.45
    );
    this.scene.background.copy(this.currentSky);
    if (this.scene.fog) {
        this.scene.fog.color.copy(this.currentSky);
    }
    if (this.ambient) {
        this.ambient.intensity =
            0.25 + daylight * 1.75;
    }
    if (this.sun) {
        this.sun.intensity =
            0.05 + daylight * 1.95;
        const sunAngle =
            ((hour - 6) / 12) * Math.PI;
        this.sun.position.set(
            Math.cos(sunAngle) * 150,
            15 + daylight * 150,
            100
        );
    }
    // Streetlights glow at night.
    const streetlightsOn = daylight < 0.35;
    for (const material of this.streetlightMaterials) {
        material.emissiveIntensity =
            streetlightsOn ? 1.8 : 0;
    }
}
// =====================================
// CLOCK DISPLAY
// =====================================
updateClock() {
    if (!this.clockElement) return;
    const nigeria = this.getNigeriaTime();
    const date = new Intl.DateTimeFormat("en-NG", {
        timeZone: this.timezone,
        weekday: "short",
        day: "2-digit",
        month: "short"
    }).format(nigeria.date);
    this.clockElement.textContent =
        `${nigeria.formatted} | ${date.toUpperCase()}`;
}
// =====================================
// MAIN UPDATE
// =====================================
update(delta) {
    const now = performance.now();
    // Refresh server time every 30 seconds.
    if (now - this.lastSync > 30000) {
        this.syncServerTime();
    }
    const nigeria = this.getNigeriaTime();
    const hour =
        nigeria.hour + nigeria.minute / 60 +
        nigeria.second / 3600;
    this.updateLighting(hour);
    if (now - this.lastClockUpdate > 250) {
        this.updateClock();
        this.lastClockUpdate = now;
    }
}

}
