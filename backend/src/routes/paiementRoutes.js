import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const dossierActuel = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.resolve(dossierActuel, "../../.env")
});

import express from "express";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";

import {
    readReservations,
    writeReservations
} from "../outils/storage.js";

const router = express.Router();
console.log("URL frontend utilisée :", process.env.FRONTEND_URL);

if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    throw new Error("Une clé secrète Stripe de test est nécessaire.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRIX_PLACE = 100;

const filmsDisponibles = [
    "Interstellar",
    "Stargate, la porte des étoiles"
];

// Création d'une session de paiement
router.post("/checkout", async (req, res) => {
    let reservations = [];
    let reservationId;

    try {
        const { film, login, nombrePlaces = 1 } = req.body;

        if (
            !filmsDisponibles.includes(film) ||
            typeof login !== "string" ||
            !login.trim() ||
            !Number.isInteger(nombrePlaces) ||
            nombrePlaces < 1 ||
            nombrePlaces > 10
        ) {
            return res.status(400).json({
                message: "Informations de réservation invalides."
            });
        }

        reservations = await readReservations();

        reservationId = randomUUID();

        const reservation = {
            id: reservationId,
            login: login.trim(),
            film,
            nombrePlaces,
            montant: nombrePlaces * PRIX_PLACE,
            statut: "pending",
            qrToken: null,
            stripeSessionId: null,
            date: new Date().toISOString()
        };

        reservations.push(reservation);
        await writeReservations(reservations);

        const frontendUrl =
            process.env.FRONTEND_URL || "http://127.0.0.1:5500";

        const session = await stripe.checkout.sessions.create({
            mode: "payment",

            line_items: [{
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: `Billet cinéma - ${film}`
                    },
                    unit_amount: PRIX_PLACE
                },
                quantity: nombrePlaces
            }],

            metadata: {
                reservationId
            },

            success_url:
                `${frontendUrl}/confirmation.html?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
                `${frontendUrl}/paiement.html?cancel=1`
        });

        reservation.stripeSessionId = session.id;
        await writeReservations(reservations);

        return res.status(201).json({
            checkoutUrl: session.url
        });

    } catch (error) {
        console.error("Erreur checkout :", error.message);

        if (reservationId) {
            const updated = reservations.filter(
                r => r.id !== reservationId
            );

            await writeReservations(updated).catch(() => {});
        }

        return res.status(500).json({
            message: "Impossible de créer la session de paiement."
        });
    }
});

// Vérification et confirmation du paiement
router.get("/confirmation/:sessionId", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(
            req.params.sessionId
        );

        if (
            session.payment_status !== "paid" ||
            !session.metadata?.reservationId
        ) {
            return res.status(402).json({
                message: "Le paiement n'a pas été accepté."
            });
        }

        const reservations = await readReservations();

        const reservation = reservations.find(
            r => r.id === session.metadata.reservationId
        );

        if (
            !reservation ||
            reservation.stripeSessionId !== session.id
        ) {
            return res.status(404).json({
                message: "Réservation introuvable."
            });
        }

        if (reservation.statut !== "paid") {
            reservation.statut = "paid";
            reservation.qrToken = randomUUID();

            await writeReservations(reservations);
        }

        const qrCode = await QRCode.toDataURL(
            reservation.qrToken
        );

        return res.json({
            message: "Paiement confirmé.",
            reservation: {
                id: reservation.id,
                film: reservation.film,
                nombrePlaces: reservation.nombrePlaces,
                montant: reservation.montant / 100,
                statut: reservation.statut,
                qrToken: reservation.qrToken
            },
            qrCode
        });

    } catch (error) {
        console.error("Erreur confirmation :", error.message);

        return res.status(500).json({
            message: "Erreur lors de la vérification du paiement."
        });
    }
});

export default router;
