import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Page de confirmation", () => {
  beforeEach(() => {
    vi.resetModules();

    localStorage.clear();

    document.body.innerHTML = `
      <p id="message-confirmation"></p>

      <div id="details-reservation" hidden>
        <p id="film"></p>
        <p id="nombre-places"></p>
        <p id="montant"></p>
        <p id="statut"></p>
        <img id="qrcode" />
      </div>
    `;

    window.history.replaceState(
      {},
      "",
      "/confirmation.html?session_id=session123"
    );

    vi.stubGlobal("fetch", vi.fn());
  });

  it("affiche un message si le session_id est absent", async () => {
    window.history.replaceState(
      {},
      "",
      "/confirmation.html"
    );

    await import("../../frontend/Application/scripts/script-confirmation.js");

    expect(document.getElementById("message-confirmation").textContent)
      .toBe("Aucune session de paiement n'a été trouvée.");

    expect(fetch).not.toHaveBeenCalled();
  });

  it("confirme la réservation et affiche les informations du film", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reservation: {
          id: "abc123",
          film: "Film test",
          nombrePlaces: 2,
          montant: 20,
          qrToken: "token123"
        },
        qrCode: "data:image/png;base64,test"
      })
    });

    await import("../../frontend/Application/scripts/script-confirmation.js");

    await vi.waitFor(() => {
      expect(document.getElementById("film").textContent)
        .toBe("Film test");

      expect(document.getElementById("nombre-places").textContent)
        .toBe("Nombre de places : 2");

      expect(document.getElementById("montant").textContent)
        .toBe("Montant payé : 20.00 €");

      expect(document.getElementById("statut").textContent)
        .toBe("Paiement accepté et réservation confirmée.");

      expect(document.getElementById("message-confirmation").textContent)
        .toBe("Votre paiement a été accepté !");

      expect(document.getElementById("details-reservation").hidden)
        .toBe(false);

      expect(document.getElementById("qrcode").src)
        .toContain("data:image/png;base64,test");
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/paiements/confirmation/session123"
    );
  });

  it("enregistre la réservation dans localStorage", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reservation: {
          id: "abc123",
          film: "Film test",
          nombrePlaces: 2,
          montant: 20,
          qrToken: "token123"
        },
        qrCode: "data:image/png;base64,test"
      })
    });

    await import("../../frontend/Application/scripts/script-confirmation.js");

    await vi.waitFor(() => {
      const reservations = JSON.parse(
        localStorage.getItem("reservations")
      );

      expect(reservations).toHaveLength(1);
      expect(reservations[0].id).toBe("abc123");
      expect(reservations[0].film).toBe("Film test");
      expect(reservations[0].qrToken).toBe("token123");
      expect(reservations[0].date).toBeDefined();
    });
  });

  it("ne crée pas de doublon si la réservation existe déjà", async () => {
    localStorage.setItem(
      "reservations",
      JSON.stringify([
        {
          id: "abc123",
          film: "Film test",
          date: "date existante",
          qrToken: "ancien-token"
        }
      ])
    );

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reservation: {
          id: "abc123",
          film: "Film test",
          nombrePlaces: 2,
          montant: 20,
          qrToken: "token123"
        },
        qrCode: "data:image/png;base64,test"
      })
    });

    await import("../../frontend/Application/scripts/script-confirmation.js");

    await vi.waitFor(() => {
      expect(document.getElementById("message-confirmation").textContent)
        .toBe("Votre paiement a été accepté !");
    });

    const reservations = JSON.parse(
      localStorage.getItem("reservations")
    );

    expect(reservations).toHaveLength(1);
    expect(reservations[0].date).toBe("date existante");
  });

  it("affiche une erreur si le backend refuse la confirmation", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Paiement non confirmé."
      })
    });

    await import("../../frontend/Application/scripts/script-confirmation.js");

    await vi.waitFor(() => {
      expect(document.getElementById("message-confirmation").textContent)
        .toBe("Paiement non confirmé.");
    });

    expect(document.getElementById("details-reservation").hidden)
      .toBe(true);
  });

  it("gère une erreur réseau lors de la confirmation", async () => {
    fetch.mockRejectedValue(
      new Error("Erreur réseau")
    );

    await import("../../frontend/Application/scripts/script-confirmation.js");

    await vi.waitFor(() => {
      expect(document.getElementById("message-confirmation").textContent)
        .toBe("Erreur réseau");
    });
  });

  it("gère un contenu localStorage invalide", async () => {
    localStorage.setItem("reservations", "contenu invalide");

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reservation: {
          id: "abc123",
          film: "Film test",
          nombrePlaces: 2,
          montant: 20,
          qrToken: "token123"
        },
        qrCode: "data:image/png;base64,test"
      })
    });

    await import("../../frontend/Application/scripts/script-confirmation.js");

    await vi.waitFor(() => {
      expect(document.getElementById("message-confirmation").textContent)
        .toBe("Votre paiement a été accepté !");
    });

    const reservations = JSON.parse(
      localStorage.getItem("reservations")
    );

    expect(reservations).toHaveLength(1);
    expect(reservations[0].id).toBe("abc123");
  });
});