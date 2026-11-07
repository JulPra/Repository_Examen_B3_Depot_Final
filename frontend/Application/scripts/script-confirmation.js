
const params = new URLSearchParams(window.location.search);

const sessionId = params.get("session_id");

const message = document.getElementById("message-confirmation");
const details = document.getElementById("details-reservation");

async function confirmerReservation() {
    if (!sessionId) {
        message.textContent =
            "Aucune session de paiement n'a été trouvée.";
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/paiements/confirmation/${encodeURIComponent(sessionId)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        const reservation = data.reservation;

        let reservations = [];

        try {
            reservations = JSON.parse(
                localStorage.getItem("reservations") || "[]"
            );

            if (!Array.isArray(reservations)) {
                reservations = [];
            }
        } catch {
            reservations = [];
        }

        if (!reservations.some(r => r.id === reservation.id)) {
            reservations.push({
                id: reservation.id,
                film: reservation.film,
                date: new Date().toLocaleString("fr-FR"),
                qrToken: reservation.qrToken
            });

            localStorage.setItem(
                "reservations",
                JSON.stringify(reservations)
            );
        }

        document.getElementById("film").textContent =
            reservation.film;

        document.getElementById("nombre-places").textContent =
            `Nombre de places : ${reservation.nombrePlaces}`;

        document.getElementById("montant").textContent =
            `Montant payé : ${reservation.montant.toFixed(2)} €`;

        document.getElementById("statut").textContent =
            "Paiement accepté et réservation confirmée.";

        document.getElementById("qrcode").src = data.qrCode;

        details.hidden = false;

        message.textContent =
            "Votre paiement a été accepté !";

    } catch (error) {
        message.textContent =
            error.message || "Impossible de confirmer votre réservation.";
    }
}

confirmerReservation();
