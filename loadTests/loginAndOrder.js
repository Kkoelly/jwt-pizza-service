import { sleep, check, group, fail } from "k6";
import http from "k6/http";

export const options = {
    cloud: {
        distribution: {
            "amazon:us:ashburn": {
                loadZone: "amazon:us:ashburn",
                percent: 100,
            },
        },
        apm: [],
    },
    thresholds: {},
    scenarios: {
        Scenario_1: {
            executor: "ramping-vus",
            gracefulStop: "30s",
            stages: [
                { target: 5, duration: "30s" },
                { target: 15, duration: "1m" },
                { target: 10, duration: "30s" },
                { target: 0, duration: "30s" },
            ],
            gracefulRampDown: "30s",
            exec: "scenario_1",
        },
    },
};

export function scenario_1() {
    let response;
    const vars = {};

    group("page_5 - https://pizza.kellyko.click/", function () {
        response = http.get("https://pizza.kellyko.click/", {
            headers: {
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-encoding": "gzip, deflate, br, zstd",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "max-age=0",
                "if-modified-since": "Mon, 09 Dec 2024 01:25:32 GMT",
                "if-none-match": '"a963c5938898c784c6a23aa4bd1ec28d"',
                priority: "u=0, i",
                "sec-ch-ua":
                    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"macOS"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
            },
        });
        sleep(19.2);

        // login
        response = http.put(
            "https://pizza-service.kellyko.click/api/auth",
            '{"email":"d@jwt.com","password":"diner"}',
            {
                headers: {
                    accept: "*/*",
                    "accept-encoding": "gzip, deflate, br, zstd",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    origin: "https://pizza.kellyko.click",
                    priority: "u=1, i",
                    "sec-ch-ua":
                        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                },
            }
        );

        if (
            !check(response, {
                "login status equals 200": (response) =>
                    response.status.toString() === "200",
            })
        ) {
            console.log(response.body);
            fail("Login was *not* 200");
        }
        vars.authToken = response.json().token;

        sleep(2.9);

        response = http.get(
            "https://pizza-service.kellyko.click/api/order/menu",
            {
                headers: {
                    accept: "*/*",
                    "accept-encoding": "gzip, deflate, br, zstd",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    "if-none-match": 'W/"1fc-cgG/aqJmHhElGCplQPSmgl2Gwk0"',
                    origin: "https://pizza.kellyko.click",
                    priority: "u=1, i",
                    "sec-ch-ua":
                        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                },
            }
        );

        response = http.get(
            "https://pizza-service.kellyko.click/api/franchise",
            {
                headers: {
                    accept: "*/*",
                    "accept-encoding": "gzip, deflate, br, zstd",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    "if-none-match": 'W/"40-EPPawbPn0KtYVCL5qBynMCqA1xo"',
                    origin: "https://pizza.kellyko.click",
                    priority: "u=1, i",
                    "sec-ch-ua":
                        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                },
            }
        );
        sleep(6.7);

        response = http.post(
            "https://pizza-service.kellyko.click/api/order",
            '{"items":[{"menuId":2,"description":"Pepperoni","price":0.0042}],"storeId":"1","franchiseId":1}',
            {
                headers: {
                    accept: "*/*",
                    "accept-encoding": "gzip, deflate, br, zstd",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    authorization: `Bearer ${vars.authToken}`,
                    origin: "https://pizza.kellyko.click",
                    priority: "u=1, i",
                    "sec-ch-ua":
                        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                },
            }
        );
        if (
            !check(response, {
                "order status equals 200": (response) =>
                    response.status.toString() === "200",
            })
        ) {
            console.log(response.body);
            fail("Order was *not* 200");
        }

        vars.jwt = response.json().jwt;

        sleep(4.4);

        response = http.post(
            "https://pizza-factory.cs329.click/api/order/verify",
            `{"jwt":"${vars.jwt}"}`,
            {
                headers: {
                    accept: "*/*",
                    "accept-encoding": "gzip, deflate, br, zstd",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    origin: "https://pizza.kellyko.click",
                    priority: "u=1, i",
                    "sec-ch-ua":
                        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                },
            }
        );
    });
}
