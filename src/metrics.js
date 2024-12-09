const config = require("./config.json");

const os = require("os");

function getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
}

function sendMetricsPeriodically(period) {
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
    }, period);
}
class Metrics {
    constructor() {
        this.totalRequests = 0;

        // This will periodically sent metrics to Grafana
        const timer = setInterval(() => {
            this.sendMetricToGrafana(
                "request",
                "all",
                "total",
                this.totalRequests
            );
        }, 10000);
        timer.unref();
    }

    incrementRequests() {
        this.totalRequests++;
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
}

const metrics = new Metrics();
module.exports = metrics;
