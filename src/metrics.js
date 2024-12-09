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
        return this.metrics.join(sep);
    }
}

class Metrics {
    constructor() {
        const timer = setInterval(() => {
            try {
                const buf = new MetricBuilder();
                this.httpMetrics(buf);
                this.systemMetrics(buf);
                this.userMetrics(buf);
                this.purchaseMetrics(buf);
                this.authMetrics(buf);

                const metrics = buf.toString("\n");
                this.sendMetricToGrafana(metrics);
            } catch (error) {
                console.log("Error sending metrics", error);
            }
        }, 5000);
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
        switch (req.method.toLowerCase()) {
            case "POST":
                this.postTotal += 1;
                this.totalRequests += 1;
                break;
            case "GET":
                this.getTotal += 1;
                this.totalRequests += 1;
                break;

            case "DELETE":
                this.deleteTotal += 1;
                this.totalRequests += 1;
                break;

            case "PUT":
                this.putTotal += 1;
                this.totalRequests += 1;
                break;

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

    systemMetrics(buf) {
        buf.addMetric(
            "request",
            "system",
            "cpuPercentage",
            this.getCpuUsagePercentage()
        );
        buf.addMetric(
            "request",
            "system",
            "memoryUsage",
            this.getMemoryUsagePercentage()
        );
    }

    userMetrics(buf) {
        buf.addMetric(
            "request",
            "userMetrics",
            "activeUsers",
            this.activeUsers
        );
    }

    purchaseMetrics(buf) {
        buf.addMetric("request", "pizzas", "pizzasSold", this.numPizzas);
        buf.addMetric("request", "pizzas", "revenue", this.revenue);
        buf.addMetric(
            "request",
            "pizzas",
            "creationFailure",
            this.creationFailures
        );
        buf.addMetric("request", "pizzas", "creationLatency", this.pizzaTime);
    }

    authMetrics(buf) {
        buf.addMetric("request", "auth", "totalAuths", this.totalAuths);
        buf.addMetric(
            "request",
            "auth",
            "successfulAuths",
            this.successfulAuths
        );
        buf.addMetric("request", "auth", "failedAuths", this.failedAuths);
    }

    sendMetricToGrafana(metrics) {
        fetch(`${config.metrics.url}`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
            },
            body: metrics,
        })
            .then((response) => {
                if (!response.ok) {
                    console.log({
                        method: "post",
                        headers: {
                            Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
                            "Content-Type": "text/plain",
                        },
                        body: metrics,
                    });
                    console.error("Failed to push metrics data to Grafana");
                } else {
                    console.log(`Pushed ${metrics}`);
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
