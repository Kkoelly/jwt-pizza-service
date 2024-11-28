const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

let adminToken;
let dinerToken;
let franchiseId;
let storeId;
beforeAll(async () => {
    //admin
    const adminRes = await createAdminUser();
    const loginRes = await request(app).put("/api/auth").send({
        name: adminRes.name,
        email: adminRes.email,
        password: adminRes.password,
    });
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);
    adminToken = loginRes.body.token;

    //diner
    let name = randomName();
    const testUser = { name: name, email: name + "@test.com", password: "a" };
    const registerRes = await request(app).post("/api/auth").send(testUser);
    dinerToken = registerRes.body.token;
    expectValidJwt(dinerToken);

    //franchise
    const createRes = await request(app)
        .post("/api/franchise")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: randomName(), admins: [{ email: adminRes.email }] });
    expect(createRes.status).toBe(200);
    franchiseId = createRes.body.id;

    //store
    let store = { franchiseId: franchiseId, name: randomName() };
    const storeRes = await request(app)
        .post(`/api/franchise/${franchiseId}/store`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(store);
    expect(createRes.status).toBe(200);
    storeId = storeRes.body.id;
});

afterAll(async () => {
    //clear franchises
    const getRes = await request(app).get("/api/franchise");
    expect(getRes.status).toBe(200);

    for (let franchise of getRes.body) {
        const deleteRes = await request(app)
            .delete(`/api/franchise/${franchise.id}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(deleteRes.status).toBe(200);
    }
});

test("update and get menu", async () => {
    const getRes1 = await request(app).get("/api/order/menu");
    expect(getRes1.status).toBe(200);
    let curr_len = getRes1.body.length;

    let newItem = {
        title: randomName(),
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
    };
    const updateRes = await request(app)
        .put("/api/order/menu")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newItem);
    expect(updateRes.status).toBe(200);

    const getRes2 = await request(app).get("/api/order/menu");
    expect(getRes2.status).toBe(200);
    expect(getRes2.body.length).toBe(curr_len + 1);
});

test("create and get order", async () => {
    const getRes = await request(app).get("/api/order/menu");
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBeGreaterThan(0);
    let menuItem = getRes.body[0];

    let order = {
        franchiseId: franchiseId,
        storeId: storeId,
        items: [
            {
                menuId: menuItem.id,
                description: menuItem.description,
                price: menuItem.price,
            },
        ],
    };
    const createRes = await request(app)
        .post("/api/order")
        .set("Authorization", `Bearer ${dinerToken}`)
        .send(order);
    expect(createRes.status).toBe(200);
    expect(createRes.body.order.items).toMatchObject(order.items);

    const getOrderRes = await request(app)
        .get("/api/order")
        .set("Authorization", `Bearer ${dinerToken}`);
    expect(getOrderRes.status).toBe(200);
    expect(getOrderRes.body.orders.length).toBe(1);
    expect(getOrderRes.body.orders[0].items).toMatchObject(order.items);
});

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(
        /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
    );
}

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
    let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + "@admin.com";

    user = await DB.addUser(user);
    return { ...user, password: "toomanysecrets" };
}
