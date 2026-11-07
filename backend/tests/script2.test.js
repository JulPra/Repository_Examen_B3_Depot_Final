import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Réservation de films", () => {
  beforeEach(() => {
    vi.resetModules();

    sessionStorage.clear();

    document.body.innerHTML = `
      <div class="movie-card">
        <h2 class="movie-title">Film test</h2>
        <p class="movie-places-disponibles">10 places disponibles</p>
        <p class="message-reservation"></p>
        <button class="reservation">Réserver</button>
      </div>
    `;

    vi.stubGlobal("fetch", vi.fn());

    vi.stubGlobal("alert", vi.fn());
  });

  it("crée automatiquement un sélecteur de places de 1 à 10", async () => {
    await import("../../frontend/Application/scripts/script2.js");

    const select = document.querySelector(".nombre-places");

    expect(select).not.toBeNull();
    expect(select.options).toHaveLength(10);
    expect(select.options[0].value).toBe("1");
    expect(select.options[9].value).toBe("10");
  });

  it("refuse une réservation si l'utilisateur n'est pas connecté", async () => {
    await import("../../frontend/Application/scripts/script2.js");

    document.querySelector(".reservation").click();

    expect(alert).toHaveBeenCalledWith(
      "Vous devez être connecté pour réserver."
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuse une réservation si le nombre de places demandé est supérieur aux places disponibles", async () => {
    sessionStorage.setItem("login", "alice");

    document.querySelector(".movie-places-disponibles").textContent =
      "2 places disponibles";

    await import("../../frontend/Application/scripts/script2.js");

    document.querySelector(".nombre-places").value = "3";

    document.querySelector(".reservation").click();

    expect(document.querySelector(".message-reservation").textContent)
      .toBe("Le nombre de places demandé n'est pas disponible.");

    expect(fetch).not.toHaveBeenCalled();
  });

  it("envoie une requête de paiement avec les bonnes informations", async () => {
    sessionStorage.setItem("login", "alice");

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        checkoutUrl: "https://paiement.test/checkout"
      })
    });

    await import("../../frontend/Application/scripts/script2.js");

    document.querySelector(".nombre-places").value = "2";

    document.querySelector(".reservation").click();

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/paiements/checkout",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            film: "Film test",
            login: "alice",
            nombrePlaces: 2
          })
        })
      );
    });
  });

  it("affiche une erreur si le serveur refuse le paiement", async () => {
    sessionStorage.setItem("login", "alice");

    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Paiement refusé."
      })
    });

    await import("../../frontend/Application/scripts/script2.js");

    document.querySelector(".reservation").click();

    await vi.waitFor(() => {
      expect(document.querySelector(".message-reservation").textContent)
        .toBe("Paiement refusé.");
    });

    expect(document.querySelector(".reservation").disabled).toBe(false);
  });

  it("affiche une erreur si le lien de paiement est absent", async () => {
    sessionStorage.setItem("login", "alice");

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    await import("../../frontend/Application/scripts/script2.js");

    document.querySelector(".reservation").click();

    await vi.waitFor(() => {
      expect(document.querySelector(".message-reservation").textContent)
        .toBe("Lien de paiement introuvable.");
    });

    expect(document.querySelector(".reservation").disabled).toBe(false);
  });

  it("réactive le bouton si une erreur réseau survient", async () => {
    sessionStorage.setItem("login", "alice");

    fetch.mockRejectedValue(new Error("Erreur réseau"));

    await import("../../frontend/Application/scripts/script2.js");

    document.querySelector(".reservation").click();

    await vi.waitFor(() => {
      expect(document.querySelector(".message-reservation").textContent)
        .toBe("Erreur réseau");
    });

    expect(document.querySelector(".reservation").disabled).toBe(false);
  });
});