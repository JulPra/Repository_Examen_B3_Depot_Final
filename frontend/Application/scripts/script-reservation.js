const liste = document.getElementById("liste-reservations");

        let reservations = [];

        try {
            reservations = JSON.parse(
                localStorage.getItem("reservations") || "[]"
            );

            if (!Array.isArray(reservations)) {
                reservations = [];
            }
        } catch (e) {
            reservations = [];
        }

        if (reservations.length === 0) {
            liste.textContent = "Vous n'avez aucune réservation.";
        } else {
            reservations.forEach(reservation => {
                const carte = document.createElement("article");
                carte.className = "reservation";

                const titre = document.createElement("h3");
                titre.textContent = reservation.film;

                const date = document.createElement("p");
                date.textContent = "Date de réservation : " +
                    (reservation.date || "Non renseignée");

                const qr = document.createElement("div");
                qr.className = "qrcode";

                const boutonSupprimer = document.createElement("button");
                boutonSupprimer.textContent = "Supprimer la réservation";

                carte.append(titre, date, qr, boutonSupprimer);
                liste.appendChild(carte);

                new QRCode(qr, {
                    text: reservation.qrToken || JSON.stringify({
                        id: reservation.id,
                        film: reservation.film
                    }),
                    width: 160,
                    height: 160,
                    correctLevel: QRCode.CorrectLevel.H
                });

                boutonSupprimer.addEventListener("click", () => {
                    const confirmation = window.confirm(
                        "Voulez-vous supprimer cette réservation ?"
                    );

                    if (!confirmation) return;

                    reservations = reservations.filter(
                        r => r.id !== reservation.id
                    );

                    localStorage.setItem(
                        "reservations",
                        JSON.stringify(reservations)
                    );

                    carte.remove();

                    if (reservations.length === 0) {
                        liste.textContent =
                            "Vous n'avez aucune réservation.";
                    }
                });
            });
        }
    