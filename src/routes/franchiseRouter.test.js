const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

let adminToken;
let testFranchise;
let testFranchiseId;
beforeAll(async () => {
    //admin token
    const adminRes = await createAdminUser();
    const loginRes = await request(app).put("/api/auth").send({
        name: adminRes.name,
        email: adminRes.email,
        password: adminRes.password,
    });
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);

    adminToken = loginRes.body.token;
    testFranchise = { name: randomName(), admins: [{ email: adminRes.email }] };

    //create test franchise
    const createRes = await request(app)
        .post("/api/franchise")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(testFranchise);
    expect(createRes.status).toBe(200);
    testFranchiseId = createRes.body.id;
});

//delete all created franchises
afterAll(async () => {
    const getRes = await request(app).get("/api/franchise");
    expect(getRes.status).toBe(200);

    for (let franchise of getRes.body) {
        const deleteRes = await request(app)
            .delete(`/api/franchise/${franchise.id}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(deleteRes.status).toBe(200);
    }
});

test("getFranchise", async () => {
    const getRes = await request(app).get("/api/franchise");
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBeGreaterThan(0);
    expect(getRes.body[0].name).toBe(testFranchise.name);
});

test("createFranchise", async () => {
    let franchise = { name: randomName(), admins: testFranchise.admins };
    const createRes = await request(app)
        .post("/api/franchise")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(franchise);
    expect(createRes.status).toBe(200);
    expect(createRes.body.name).toBe(franchise.name);
    expect(createRes.body.admins.email).toBe(franchise.admins.email);
});

test("createStore", async () => {
    let store = { franchiseId: testFranchiseId, name: randomName() };
    const createRes = await request(app)
        .post(`/api/franchise/${testFranchiseId}/store`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(store);
    expect(createRes.status).toBe(200);
    expect(createRes.body.name).toBe(store.name);
});

test("deleteStore", async () => {
    let store = { franchiseId: testFranchiseId, name: randomName() };
    const createRes = await request(app)
        .post(`/api/franchise/${testFranchiseId}/store`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(store);
    expect(createRes.status).toBe(200);

    let storeId = createRes.body.id;
    const deleteRes = await request(app)
        .delete(`/api/franchise/${testFranchiseId}/store/${storeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get("/api/franchise");
    for (let franchise of getRes.body) {
        if (franchise.id == testFranchiseId) {
            expect(franchise.stores.length).toBe(1);
            expect(franchise.stores[0].name).not.toBe(store.name);
        }
    }
});

test("getFranchiseForUser", async () => {
    const adminRes = await createAdminUser();
    const loginRes = await request(app).put("/api/auth").send({
        name: adminRes.name,
        email: adminRes.email,
        password: adminRes.password,
    });
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);

    const getRes = await request(app)
        .get(`/api/franchise/${loginRes.body.user.id}`)
        .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(0);
});

test("deleteFranchise", async () => {
    const deleteRes = await request(app)
        .delete(`/api/franchise/${testFranchiseId}`)
        .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
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
