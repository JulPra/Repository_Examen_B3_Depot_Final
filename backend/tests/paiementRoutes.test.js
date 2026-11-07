import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  readReservations: vi.fn(),
  writeReservations: vi.fn(),
  stripeCreate: vi.fn(),
  stripeRetrieve: vi.fn(),
  qrToDataURL: vi.fn()
}));

vi.mock("../src/outils/storage.js", () => ({
  readReservations: mocks.readReservations,
  writeReservations: mocks.writeReservations
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    constructor() {
      return {
        checkout: {
          sessions: {
            create: mocks.stripeCreate,
            retrieve: mocks.stripeRetrieve
          }
        }
      };
    }
  }
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: mocks.qrToDataURL
  }
}));

describe("Routes de paiement", () => {

  let app;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.STRIPE_SECRET_KEY = "sk_test_fake";

    mocks.readReservations.mockResolvedValue([]);
    mocks.writeReservations.mockResolvedValue(undefined);

    mocks.stripeCreate.mockResolvedValue({
      id: "session123",
      url: "https://stripe.test/checkout"
    });

    mocks.stripeRetrieve.mockResolvedValue({
      id: "session123",
      payment_status: "paid",
      metadata: {
        reservationId: "reservation123"
      }
    });

    mocks.qrToDataURL.mockResolvedValue(
      "data:image/png;base64,test"
    );

    const { default: router } =
      await import("../src/routes/paiementRoutes.js");

    app = express();

    app.use(express.json());
    app.use("/api/paiements", router);
  });

  // --------------------------------
  // TESTS DE LA ROUTE CHECKOUT
  // --------------------------------

  it("refuse une réservation avec des informations invalides", async () => {
    const response = await request(app)
      .post("/api/paiements/checkout")
      .send({
        film: "Film inconnu",
        login: "alice",
        nombrePlaces: 2
      });

    expect(response.status).toBe(400);

    expect(response.body.message)
      .toBe("Informations de réservation invalides.");

    expect(mocks.stripeCreate).not.toHaveBeenCalled();
    expect(mocks.writeReservations).not.toHaveBeenCalled();
  });

  it("crée une session de paiement pour une réservation valide", async () => {
    const response = await request(app)
      .post("/api/paiements/checkout")
      .send({
        film: "Interstellar",
        login: "alice",
        nombrePlaces: 2
      });

    expect(response.status).toBe(201);

    expect(response.body.checkoutUrl)
      .toBe("https://stripe.test/checkout");

    expect(mocks.stripeCreate).toHaveBeenCalledTimes(1);

    const sessionData = mocks.stripeCreate.mock.calls[0][0];

    expect(sessionData.mode).toBe("payment");

    expect(sessionData.line_items[0].quantity).toBe(2);

    expect(sessionData.line_items[0].price_data.unit_amount)
      .toBe(100);

    expect(sessionData.metadata.reservationId).toBeDefined();

    expect(mocks.writeReservations).toHaveBeenCalledTimes(2);
  });

  it("utilise un nombre de places par défaut égal à 1", async () => {
    const response = await request(app)
      .post("/api/paiements/checkout")
      .send({
        film: "Interstellar",
        login: "alice"
      });

    expect(response.status).toBe(201);

    const sessionData = mocks.stripeCreate.mock.calls[0][0];

    expect(sessionData.line_items[0].quantity).toBe(1);
  });

  it("supprime la réservation temporaire si Stripe échoue", async () => {
    mocks.stripeCreate.mockRejectedValue(
      new Error("Erreur Stripe")
    );

    const response = await request(app)
      .post("/api/paiements/checkout")
      .send({
        film: "Interstellar",
        login: "alice",
        nombrePlaces: 2
      });

    expect(response.status).toBe(500);

    expect(response.body.message)
      .toBe("Impossible de créer la session de paiement.");

    expect(mocks.writeReservations).toHaveBeenCalledTimes(2);

    const derniereEcriture =
      mocks.writeReservations.mock.calls[1][0];

    expect(derniereEcriture).toEqual([]);
  });

  // --------------------------------
  // TESTS DE LA ROUTE CONFIRMATION
  // --------------------------------

  it("refuse une confirmation si le paiement n'a pas été accepté", async () => {
    mocks.stripeRetrieve.mockResolvedValue({
      id: "session123",
      payment_status: "unpaid",
      metadata: {
        reservationId: "reservation123"
      }
    });

    const response = await request(app)
      .get("/api/paiements/confirmation/session123");

    expect(response.status).toBe(402);

    expect(response.body.message)
      .toBe("Le paiement n'a pas été accepté.");

    expect(mocks.readReservations).not.toHaveBeenCalled();
  });

  it("retourne une erreur si la réservation est introuvable", async () => {
    mocks.readReservations.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/paiements/confirmation/session123");

    expect(response.status).toBe(404);

    expect(response.body.message)
      .toBe("Réservation introuvable.");
  });

  it("confirme le paiement et génère un QR code", async () => {
    mocks.readReservations.mockResolvedValue([
      {
        id: "reservation123",
        login: "alice",
        film: "Interstellar",
        nombrePlaces: 2,
        montant: 200,
        statut: "pending",
        qrToken: null,
        stripeSessionId: "session123"
      }
    ]);

    const response = await request(app)
      .get("/api/paiements/confirmation/session123");

    expect(response.status).toBe(200);

    expect(response.body.message)
      .toBe("Paiement confirmé.");

    expect(response.body.reservation.film)
      .toBe("Interstellar");

    expect(response.body.reservation.nombrePlaces)
      .toBe(2);

    expect(response.body.reservation.montant)
      .toBe(2);

    expect(response.body.reservation.statut)
      .toBe("paid");

    expect(response.body.reservation.qrToken).toBeDefined();

    expect(response.body.qrCode)
      .toBe("data:image/png;base64,test");

    expect(mocks.writeReservations).toHaveBeenCalledTimes(1);

    expect(mocks.qrToDataURL).toHaveBeenCalledTimes(1);
  });

  it("ne génère pas un nouveau QR token si la réservation est déjà payée", async () => {
    mocks.readReservations.mockResolvedValue([
      {
        id: "reservation123",
        film: "Interstellar",
        nombrePlaces: 2,
        montant: 200,
        statut: "paid",
        qrToken: "token-existant",
        stripeSessionId: "session123"
      }
    ]);

    const response = await request(app)
      .get("/api/paiements/confirmation/session123");

    expect(response.status).toBe(200);

    expect(response.body.reservation.qrToken)
      .toBe("token-existant");

    expect(mocks.writeReservations).not.toHaveBeenCalled();

    expect(mocks.qrToDataURL).toHaveBeenCalledWith(
      "token-existant"
    );
  });

  it("retourne une erreur si la session Stripe ne correspond pas à la réservation", async () => {
    mocks.readReservations.mockResolvedValue([
      {
        id: "reservation123",
        film: "Interstellar",
        nombrePlaces: 2,
        montant: 200,
        statut: "pending",
        stripeSessionId: "autre-session"
      }
    ]);

    const response = await request(app)
      .get("/api/paiements/confirmation/session123");

    expect(response.status).toBe(404);

    expect(response.body.message)
      .toBe("Réservation introuvable.");
  });

  it("gère une erreur lors de la récupération de la session Stripe", async () => {
    mocks.stripeRetrieve.mockRejectedValue(
      new Error("Erreur Stripe")
    );

    const response = await request(app)
      .get("/api/paiements/confirmation/session123");

    expect(response.status).toBe(500);

    expect(response.body.message)
      .toBe("Erreur lors de la vérification du paiement.");
  });

});