const request = require("supertest");
const app = require("../service");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let testUserId;
beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
    const registerRes = await request(app).post("/api/auth").send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserId = registerRes.body.user.id;
    expectValidJwt(testUserAuthToken);
});

test("login", async () => {
    const loginRes = await request(app).put("/api/auth").send(testUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);

    const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
    delete expectedUser.password;
    expect(loginRes.body.user).toMatchObject(expectedUser);
});

test("update", async () => {
    const updateRes = await request(app)
        .put(`/api/auth/${testUserId}`)
        .set("Authorization", `Bearer ${testUserAuthToken}`)
        .send({ email: "new_email@jwt.com", password: "hello" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.email).toBe("new_email@jwt.com");
});

test("delete", async () => {
    const deleteRes = await request(app)
        .delete("/api/auth")
        .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(deleteRes.status).toBe(200);
});

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(
        /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
    );
}
