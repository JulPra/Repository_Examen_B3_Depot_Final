import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/routes/paiementRoutes.js", () => ({
  default: (req, res, next) => {
    if (req.path === "/test" && req.method === "POST") {
      return res.json({
        message: "Route paiement fonctionnelle",
        donnees: req.body
      });
    }

    next();
  }
}));

vi.mock("dotenv", () => ({
  default: {
    config: vi.fn()
  }
}));

describe("Serveur Express", () => {

  let app;

  beforeEach(async () => {
    vi.resetModules();

    process.env.NODE_ENV = "test";

    const module = await import("../src/server.js");

    app = module.default;
  });

  it("vérifie que le backend est opérationnel", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "OK",
      message: "Backend Cinema opérationnel"
    });
  });

  it("autorise les requêtes CORS", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5500");

    expect(response.status).toBe(200);

    expect(response.headers["access-control-allow-origin"])
      .toBeDefined();
  });

  it("traite correctement les données JSON", async () => {
    const donnees = {
      film: "Interstellar",
      login: "alice",
      nombrePlaces: 2
    };

    const response = await request(app)
      .post("/api/paiements/test")
      .send(donnees);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Route paiement fonctionnelle",
      donnees
    });
  });

  it("monte correctement les routes de paiement", async () => {
    const response = await request(app)
      .post("/api/paiements/test")
      .send({ film: "Interstellar" });

    expect(response.status).toBe(200);

    expect(response.body.message)
      .toBe("Route paiement fonctionnelle");
  });

  it("retourne une erreur 404 pour une route inexistante", async () => {
  const response = await request(app)
    .get("/api/route-inexistante");

  expect(response.status).toBe(404);
    });

});
