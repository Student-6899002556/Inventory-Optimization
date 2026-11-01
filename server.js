
const express = require("express");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function knapsackDP(products, capacity) {
    const n = products.length;
    const dp = Array.from(
        { length: n + 1 },
        () => Array(capacity + 1).fill(0)
    );

    for (let i = 1; i <= n; i++) {
        const weight = products[i - 1].weight;
        const profit = products[i - 1].profit;

        for (let w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w];

            if (weight <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    profit + dp[i - 1][w - weight]
                );
            }
        }
    }

    const selected = [];
    let remainingCapacity = capacity;

    for (let i = n; i > 0; i--) {
        if (dp[i][remainingCapacity] !==
            dp[i - 1][remainingCapacity]) {
            selected.push(products[i - 1]);
            remainingCapacity -= products[i - 1].weight;
        }
    }

    selected.reverse();

    return {
        selected,
        totalWeight: selected.reduce(
            (sum, p) => sum + p.weight, 0
        ),
        totalProfit: dp[n][capacity]
    };
}

function greedyKnapsack(products, capacity) {
    const sorted = [...products].sort(
        (a, b) =>
            (b.profit / b.weight) - (a.profit / a.weight)
    );

    const selected = [];
    let totalWeight = 0;
    let totalProfit = 0;

    for (const product of sorted) {
        if (totalWeight + product.weight <= capacity) {
            selected.push(product);
            totalWeight += product.weight;
            totalProfit += product.profit;
        }
    }

    return {
        selected,
        totalWeight,
        totalProfit
    };
}

app.post("/api/optimize", (req, res) => {
    const { products, capacity } = req.body;

    if (
        !Array.isArray(products) ||
        products.length === 0 ||
        !Number.isSafeInteger(capacity) ||
        capacity <= 0 ||
        products.some(p =>
            typeof p.name !== "string" ||
            !p.name.trim() ||
            !Number.isSafeInteger(p.weight) ||
            p.weight <= 0 ||
            !Number.isSafeInteger(p.profit) ||
            p.profit < 0
        )
    ) {
        return res.status(400).json({
            error: "Enter valid products, positive integer weights, non-negative integer profits, and a positive integer capacity."
        });
    }

    // Prevent excessively large DP tables.
    if (products.length * (capacity + 1) > 2000000) {
        return res.status(400).json({
            error: "Dataset is too large for this demo. Reduce the number of products or storage capacity."
        });
    }

    const startDP = process.hrtime.bigint();
    const dpResult = knapsackDP(products, capacity);
    const dpTime = Number(
        process.hrtime.bigint() - startDP
    ) / 1e6;

    const startGreedy = process.hrtime.bigint();
    const greedyResult = greedyKnapsack(products, capacity);
    const greedyTime = Number(
        process.hrtime.bigint() - startGreedy
    ) / 1e6;

    res.json({
        capacity,
        dynamicProgramming: {
            ...dpResult,
            executionTimeMs: dpTime,
            timeComplexity: "O(n × W)"
        },
        greedy: {
            ...greedyResult,
            executionTimeMs: greedyTime,
            timeComplexity: "O(n log n)"
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});