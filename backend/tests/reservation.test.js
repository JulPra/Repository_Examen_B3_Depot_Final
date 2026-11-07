import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Liste des réservations", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    localStorage.clear();

    document.body.innerHTML = `
      <div id="liste-reservations"></div>
    `;

    window.QRCode = vi.fn();
    window.QRCode.CorrectLevel = { H: 2 };
  });

  async function chargerPage() {
    await import("../../frontend/Application/scripts/script-reservation.js");
  }

  it("affiche un message si aucune réservation n'existe", async () => {
    await chargerPage();

    expect(document.getElementById("liste-reservations").textContent)
      .toBe("Vous n'avez aucune réservation.");
  });

  it("affiche une réservation et génère son QR code", async () => {
    localStorage.setItem("reservations", JSON.stringify([
      {
        id: "123",
        film: "Film test",
        date: "29/10/2026",
        qrToken: "token123"
      }
    ]));

    await chargerPage();

    expect(document.querySelector("h3").textContent)
      .toBe("Film test");

    expect(document.querySelector("p").textContent)
      .toBe("Date de réservation : 29/10/2026");

    expect(window.QRCode).toHaveBeenCalledTimes(1);

    expect(window.QRCode.mock.calls[0][1].text)
      .toBe("token123");
  });

  it("affiche une date non renseignée si aucune date n'existe", async () => {
    localStorage.setItem("reservations", JSON.stringify([
      {
        id: "123",
        film: "Film test"
      }
    ]));

    await chargerPage();

    expect(document.querySelector("p").textContent)
      .toBe("Date de réservation : Non renseignée");
  });

  it("génère un QR code avec les informations de réservation si aucun qrToken n'existe", async () => {
    localStorage.setItem("reservations", JSON.stringify([
      {
        id: "123",
        film: "Film test"
      }
    ]));

    await chargerPage();

    expect(window.QRCode).toHaveBeenCalledTimes(1);

    expect(window.QRCode.mock.calls[0][1].text)
      .toBe(JSON.stringify({
        id: "123",
        film: "Film test"
      }));
  });

  it("conserve la réservation si la suppression est annulée", async () => {
    localStorage.setItem("reservations", JSON.stringify([
      {
        id: "123",
        film: "Film test",
        date: "29/10/2026"
      }
    ]));

    vi.spyOn(window, "confirm").mockReturnValue(false);

    await chargerPage();

    document.querySelector("button").click();

    expect(window.confirm).toHaveBeenCalledWith(
      "Voulez-vous supprimer cette réservation ?"
    );

    expect(JSON.parse(localStorage.getItem("reservations")))
      .toHaveLength(1);

    expect(document.querySelector(".reservation")).not.toBeNull();
  });

  it("supprime la réservation après confirmation", async () => {
    localStorage.setItem("reservations", JSON.stringify([
      {
        id: "123",
        film: "Film test",
        date: "29/10/2026"
      }
    ]));

    vi.spyOn(window, "confirm").mockReturnValue(true);

    await chargerPage();

    document.querySelector("button").click();

    expect(JSON.parse(localStorage.getItem("reservations")))
      .toHaveLength(0);

    expect(document.getElementById("liste-reservations").textContent)
      .toBe("Vous n'avez aucune réservation.");
  });

  it("supprime uniquement la réservation sélectionnée", async () => {
    localStorage.setItem("reservations", JSON.stringify([
      { id: "123", film: "Film test 1" },
      { id: "456", film: "Film test 2" }
    ]));

    vi.spyOn(window, "confirm").mockReturnValue(true);

    await chargerPage();

    document.querySelector("button").click();

    const reservations = JSON.parse(
      localStorage.getItem("reservations")
    );

    expect(reservations).toHaveLength(1);
    expect(reservations[0].id).toBe("456");
  });

  it("gère un contenu localStorage invalide", async () => {
    localStorage.setItem("reservations", "contenu invalide");

    await chargerPage();

    expect(document.getElementById("liste-reservations").textContent)
      .toBe("Vous n'avez aucune réservation.");
  });

  it("gère un contenu localStorage qui n'est pas un tableau", async () => {
    localStorage.setItem("reservations", JSON.stringify({
      id: "123",
      film: "Film test"
    }));

    await chargerPage();

    expect(document.getElementById("liste-reservations").textContent)
      .toBe("Vous n'avez aucune réservation.");
  });
});