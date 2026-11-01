
const products = [];

const productForm = document.getElementById("productForm");
const productTable = document.getElementById("productTable");
const capacityInput = document.getElementById("capacity");
const message = document.getElementById("message");
const results = document.getElementById("results");

const sampleProducts = [
    { name: "Laptop", weight: 3, profit: 50000 },
    { name: "Monitor", weight: 2, profit: 20000 },
    { name: "Keyboard", weight: 1, profit: 5000 },
    { name: "Printer", weight: 4, profit: 15000 }
];

const formatCurrency = value =>
    "₹" + value.toLocaleString("en-IN");

function renderProducts() {
    productTable.replaceChildren();

    if (products.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "No products added yet.";

        row.appendChild(cell);
        productTable.appendChild(row);
        return;
    }

    products.forEach((product, index) => {
        const row = document.createElement("tr");

        [
            product.name,
            `${product.weight} kg`,
            formatCurrency(product.profit)
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Remove";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", () => {
            products.splice(index, 1);
            results.hidden = true;
            message.textContent = "";
            renderProducts();
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        productTable.appendChild(row);
    });
}

productForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document
        .getElementById("productName")
        .value.trim();

    const weight = Number(
        document.getElementById("productWeight").value
    );

    const profit = Number(
        document.getElementById("productProfit").value
    );

    if (
        !name ||
        !Number.isSafeInteger(weight) ||
        weight <= 0 ||
        !Number.isSafeInteger(profit) ||
        profit < 0
    ) {
        message.textContent =
            "Enter a name, positive whole-number weight, and non-negative whole-number profit.";
        return;
    }

    products.push({ name, weight, profit });

    productForm.reset();
    message.textContent = "";
    results.hidden = true;

    renderProducts();
});

document.getElementById("loadSample").addEventListener(
    "click",
    () => {
        products.splice(
            0,
            products.length,
            ...sampleProducts.map(product => ({ ...product }))
        );

        capacityInput.value = 5;
        results.hidden = true;
        message.textContent = "";

        renderProducts();
    }
);

function renderSelectedProducts(elementId, selected) {
    const list = document.getElementById(elementId);
    list.replaceChildren();

    if (selected.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No products selected.";
        list.appendChild(item);
        return;
    }

    selected.forEach(product => {
        const item = document.createElement("li");

        item.textContent =
            `${product.name} — ${product.weight} kg — ` +
            `${formatCurrency(product.profit)}`;

        list.appendChild(item);
    });
}

function addComparisonRow(algorithmName, result) {
    const row = document.createElement("tr");

    const values = [
        algorithmName,
        `${result.totalWeight} kg`,
        formatCurrency(result.totalProfit),
        `${result.executionTimeMs.toFixed(4)} ms`,
        result.timeComplexity
    ];

    values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    });

    document.getElementById("comparisonTable").appendChild(row);
}

document.getElementById("optimizeButton").addEventListener(
    "click",
    async () => {
        message.textContent = "";
        results.hidden = true;

        const capacity = Number(capacityInput.value);

        if (products.length === 0) {
            message.textContent = "Please add at least one product.";
            return;
        }

        if (
            !Number.isSafeInteger(capacity) ||
            capacity <= 0
        ) {
            message.textContent =
                "Storage capacity must be a positive whole number.";
            return;
        }

        const button = document.getElementById("optimizeButton");
        button.disabled = true;
        button.textContent = "Optimizing...";

        try {
            const response = await fetch("/api/optimize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    products,
                    capacity
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Optimization failed."
                );
            }

            const dp = data.dynamicProgramming;
            const greedy = data.greedy;

            document.getElementById("dpProfit").textContent =
                formatCurrency(dp.totalProfit);

            document.getElementById("greedyProfit").textContent =
                formatCurrency(greedy.totalProfit);

            document.getElementById("storageUsed").textContent =
                `${dp.totalWeight} / ${capacity} kg`;

            renderSelectedProducts("dpProducts", dp.selected);
            renderSelectedProducts("greedyProducts", greedy.selected);

            const comparisonTable =
                document.getElementById("comparisonTable");

            comparisonTable.replaceChildren();

            addComparisonRow("Dynamic Programming", dp);
            addComparisonRow("Greedy Algorithm", greedy);

            const difference = dp.totalProfit - greedy.totalProfit;

            document.getElementById("comparisonMessage").textContent =
                difference === 0
                    ? "Both algorithms produced the same profit for this dataset."
                    : `Dynamic Programming produced ${formatCurrency(difference)} more profit than Greedy.`;

            results.hidden = false;
            results.scrollIntoView({ behavior: "smooth" });

        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Optimize Inventory";
        }
    }
);

renderProducts();