export class BusinessMenuSystem {

    constructor(container) {
        this.container = container;

        this.currentBusiness = null;
        this.catalog = [];
        this.isOpen = false;

        this.paymentPreference =
            localStorage.getItem("lagosPaymentPreference") || "auto";

        this.createMenu();
    }

    createMenu() {
        this.element = document.createElement("div");

        this.element.id = "lagos-business-menu";

        this.element.style.cssText = `
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.55);
            z-index: 99999;
            font-family: Arial, sans-serif;
        `;

        this.element.innerHTML = `
            <div
                id="lagos-business-card"
                style="
                    width: min(430px, 100%);
                    max-height: 85vh;
                    overflow: auto;
                    background: #111;
                    color: white;
                    border: 1px solid rgba(255,255,255,.15);
                    border-radius: 18px;
                    box-shadow: 0 20px 60px rgba(0,0,0,.55);
                    padding: 20px;
                "
            >

                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:12px;
                ">

                    <div>
                        <div
                            id="lagos-business-name"
                            style="
                                font-size:22px;
                                font-weight:800;
                            "
                        ></div>

                        <div
                            id="lagos-business-subtitle"
                            style="
                                margin-top:4px;
                                color:#aaa;
                                font-size:13px;
                            "
                        ></div>
                    </div>

                    <button
                        id="lagos-business-close"
                        type="button"
                        style="
                            width:40px;
                            height:40px;
                            border:none;
                            border-radius:50%;
                            background:#222;
                            color:white;
                            font-size:22px;
                            cursor:pointer;
                        "
                    >
                        ×
                    </button>

                </div>

                <div
                    id="lagos-wallet-display"
                    style="
                        margin-top:16px;
                        padding:12px;
                        border-radius:12px;
                        background:#181818;
                        display:grid;
                        grid-template-columns:1fr 1fr;
                        gap:10px;
                    "
                >

                    <div>
                        <div style="color:#999;font-size:11px;">
                            CASH
                        </div>

                        <div
                            id="lagos-cash-balance"
                            style="
                                margin-top:3px;
                                font-weight:800;
                            "
                        >
                            ₦0
                        </div>
                    </div>

                    <div>
                        <div style="color:#999;font-size:11px;">
                            BANK
                        </div>

                        <div
                            id="lagos-bank-balance"
                            style="
                                margin-top:3px;
                                font-weight:800;
                            "
                        >
                            ₦0
                        </div>
                    </div>

                </div>

                <div style="margin-top:16px;">

                    <label
                        for="lagos-payment-preference"
                        style="
                            display:block;
                            color:#aaa;
                            font-size:12px;
                            margin-bottom:6px;
                        "
                    >
                        PAYMENT METHOD
                    </label>

                    <select
                        id="lagos-payment-preference"
                        style="
                            width:100%;
                            min-height:44px;
                            padding:10px;
                            border-radius:10px;
                            border:1px solid #333;
                            background:#181818;
                            color:white;
                        "
                    >
                        <option value="auto">
                            Auto — Cash first, then Bank
                        </option>

                        <option value="cash">
                            Cash
                        </option>

                        <option value="bank">
                            Bank
                        </option>
                    </select>

                </div>

                <div
                    id="lagos-business-items"
                    style="
                        margin-top:18px;
                        display:flex;
                        flex-direction:column;
                        gap:10px;
                    "
                ></div>

                <div
                    id="lagos-business-status"
                    aria-live="polite"
                    style="
                        margin-top:14px;
                        min-height:20px;
                        font-size:13px;
                        color:#aaa;
                    "
                ></div>

            </div>
        `;

        this.container.appendChild(this.element);

        this.element
            .querySelector("#lagos-business-close")
            .addEventListener("click", () => this.close());

        const preferenceSelect =
            this.element.querySelector(
                "#lagos-payment-preference"
            );

        preferenceSelect.value = this.paymentPreference;

        preferenceSelect.addEventListener("change", () => {

            this.paymentPreference =
                preferenceSelect.value;

            localStorage.setItem(
                "lagosPaymentPreference",
                this.paymentPreference
            );
        });
    }

    async open(businessType) {

        if (this.isOpen) return;

        this.isOpen = true;

        this.setStatus("Loading catalogue...");

        this.element.style.display = "flex";

        try {

            const token =
                localStorage.getItem(
                    "lagos_legends_session"
                );

            if (!token) {
                throw new Error("Not authenticated.");
            }

            const session =
                JSON.parse(token);

            const response = await fetch(
                `/api/store/catalog?businessType=${encodeURIComponent(businessType)}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to load business."
                );
            }

            this.currentBusiness = data.business;
            this.catalog = data.items;

            this.render();

            await this.refreshWallet();

        } catch (error) {

            console.error(error);

            this.setStatus(
                error.message ||
                "Unable to open business."
            );
        }
    }

    async refreshWallet() {

        try {

            const token =
                localStorage.getItem(
                    "lagos_legends_session"
                );

            const session =
                JSON.parse(token);

            const response = await fetch(
                "/api/banking/wallet",
                {
                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to load wallet."
                );
            }

            this.element.querySelector(
                "#lagos-cash-balance"
            ).textContent =
                this.formatMoney(data.cash);

            this.element.querySelector(
                "#lagos-bank-balance"
            ).textContent =
                this.formatMoney(data.bank);

        } catch (error) {

            console.error(error);

            this.setStatus(
                "Unable to refresh wallet."
            );
        }
    }

    render() {

        this.element.querySelector(
            "#lagos-business-name"
        ).textContent =
            this.currentBusiness.name;

        this.element.querySelector(
            "#lagos-business-subtitle"
        ).textContent =
            this.getBusinessSubtitle(
                this.currentBusiness.type
            );

        const list =
            this.element.querySelector(
                "#lagos-business-items"
            );

        list.innerHTML = "";

        for (const item of this.catalog) {

            const button =
                document.createElement("button");

            button.type = "button";

            button.style.cssText = `
                width:100%;
                padding:14px;
                border:1px solid #292929;
                border-radius:12px;
                background:#181818;
                color:white;
                text-align:left;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
            `;

            button.innerHTML = `
                <span>
                    <strong
                        style="
                            display:block;
                            font-size:15px;
                        "
                    >
                        ${this.escape(item.name)}
                    </strong>

                    <span
                        style="
                            display:block;
                            margin-top:4px;
                            color:#999;
                            font-size:12px;
                        "
                    >
                        ${this.escape(
                            item.description || ""
                        )}
                    </span>
                </span>

                <strong
                    style="
                        white-space:nowrap;
                    "
                >
                    ${this.formatMoney(item.price)}
                </strong>
            `;

            button.addEventListener(
                "click",
                () => this.purchase(item)
            );

            list.appendChild(button);
        }

        this.setStatus("");
    }

    async purchase(item) {

        this.setStatus(
            `Purchasing ${item.name}...`
        );

        const token =
            localStorage.getItem(
                "lagos_legends_session"
            );

        if (!token) {
            this.setStatus(
                "You are not logged in."
            );
            return;
        }

        let session;

        try {
            session = JSON.parse(token);
        } catch {
            this.setStatus(
                "Invalid session."
            );
            return;
        }

        const idempotencyKey =
            `${crypto.randomUUID()}`;

        try {

            const response = await fetch(
                "/api/store/purchase",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${session.access_token}`
                    },

                    body: JSON.stringify({
                        businessId:
                            this.currentBusiness.id,

                        itemId:
                            item.itemId,

                        quantity: 1,

                        paymentPreference:
                            this.paymentPreference,

                        idempotencyKey
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Purchase failed."
                );
            }

            this.element.querySelector(
                "#lagos-cash-balance"
            ).textContent =
                this.formatMoney(
                    data.wallet.cash
                );

            this.element.querySelector(
                "#lagos-bank-balance"
            ).textContent =
                this.formatMoney(
                    data.wallet.bank
                );

            this.setStatus(
                `✓ Bought ${item.name} for ${this.formatMoney(data.purchase.total)} using ${data.purchase.paymentSource}.`
            );

            window.dispatchEvent(
                new CustomEvent(
                    "lagos:purchase-complete",
                    {
                        detail: data.purchase
                    }
                )
            );

        } catch (error) {

            console.error(error);

            this.setStatus(
                error.message ||
                "Purchase failed."
            );
        }
    }

    getBusinessSubtitle(type) {

        const subtitles = {
            restaurant: "Meals & refreshments",
            supermarket: "Groceries & household items",
            clothing: "Fashion & accessories",
            hospital: "Medical services",
            pharmacy: "Medicine & first aid",
            barber: "Hair & grooming",
            nightclub: "Entertainment & nightlife"
        };

        return subtitles[type] ||
            "Available services";
    }

    setStatus(message) {

        this.element.querySelector(
            "#lagos-business-status"
        ).textContent = message;
    }

    close() {

        this.isOpen = false;

        this.element.style.display = "none";

        this.currentBusiness = null;
        this.catalog = [];
    }

    formatMoney(value) {

        return `₦${Number(value || 0).toLocaleString("en-NG")}`;
    }

    escape(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
}
