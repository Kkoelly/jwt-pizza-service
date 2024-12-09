const config = require("./config.js");

const os = require("os");

class MetricBuilder {
    constructor() {
        this.metrics = [];
    }
    addMetric(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;
        this.metrics.push(metric);
    }
    toString(sep) {
        this.metrics.join(sep);
    }
}

class Metrics {
    constructor() {
        const timer = setInterval(() => {
            try {
                const buf = new MetricBuilder();
                httpMetrics(buf);
                systemMetrics(buf);
                userMetrics(buf);
                purchaseMetrics(buf);
                authMetrics(buf);

                const metrics = buf.toString("\n");
                this.sendMetricToGrafana(metrics);
            } catch (error) {
                console.log("Error sending metrics", error);
            }
        }, 10000);
        timer.unref();

        this.totalRequests = 0;
        this.postTotal = 0;
        this.getTotal = 0;
        this.deleteTotal = 0;
        this.putTotal = 0;

        this.activeUsers = 0;

        this.totalAuths = 0;
        this.failedAuths = 0;
        this.successfulAuths = 0;

        this.numPizzas = 0;
        this.creationFailures = 0;
        this.revenue = 0;
        this.pizzaTime = 0;
    }
    requestTracker(req, res, next) {
        switch (req.method) {
            case "POST":
                this.postTotal += 1;
                this.totalRequests += 1;

            case "GET":
                this.getTotal += 1;
                this.totalRequests += 1;

            case "DELETE":
                this.deleteTotal += 1;
                this.totalRequests += 1;

            case "PUT":
                this.putTotal += 1;
                this.totalRequests += 1;

            default:
                this.totalRequests += 1;
        }
        next();
    }

    incrementActiveUsers() {
        this.activeUsers += 1;
    }

    decrementActiveUsers() {
        this.activeUsers -= 1;
    }

    incrementAuths() {
        this.totalAuths += 1;
    }

    incrementSuccessfulAuths() {
        this.successfulAuths += 1;
    }

    incrementFailedAuths() {
        this.failedAuths += 1;
    }

    orderData(numPizzas, totalCost, orderTime, isSuccess) {
        if (isSuccess) {
            this.numPizzas += numPizzas;
            this.revenue += totalCost;
            this.pizzaTime += orderTime;
        } else {
            this.creationFailures += 1;
        }
    }

    httpMetrics(buf) {
        buf.addMetric("request", "http", "postRequests", this.postTotal);
        buf.addMetric("request", "http", "getRequests", this.getTotal);
        buf.addMetric("request", "http", "deleteRequests", this.deleteTotal);
        buf.addMetric("request", "http", "putRequests", this.putTotal);
        buf.addMetric("request", "http", "allRequests", this.totalRequests);
    }

    systemMetrics() {
        buffer.addMetric(
            "request",
            "system",
            "cpuPercentage",
            this.getCpuUsagePercentage()
        );
        buffer.addMetric(
            "request",
            "system",
            "memoryUsage",
            this.getMemoryUsagePercentage()
        );
    }

    userMetrics() {
        buf.addMetric("activeUsers", {}, this.activeUsers);
    }

    purchaseMetrics() {
        buf.addMetric("pizzasSold", "pizzas", this.numPizzas);
        buf.addMetric("revenue", "pizzas", this.revenue);
        buf.addMetric("creationFailure", "pizzas", this.creationFailures);
        buf.addMetric("creationLatency", "pizzas", this.pizzaTime);
    }

    authMetrics() {
        buf.addMetric("totalAuths", "auth", this.totalAuths);
        buf.addMetric("successfulAuths", "auth", this.successfulAuths);
        buf.addMetric("failedAuths", "auth", this.failedAuths);
    }

    sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
        const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;

        fetch(`${config.url}`, {
            method: "post",
            body: metric,
            headers: {
                Authorization: `Bearer ${config.userId}:${config.apiKey}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    console.error("Failed to push metrics data to Grafana");
                } else {
                    console.log(`Pushed ${metric}`);
                }
            })
            .catch((error) => {
                console.error("Error pushing metrics:", error);
            });
    }
    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return cpuUsage.toFixed(2) * 100;
    }

    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }
}

const metrics = new Metrics();
module.exports = metrics;
