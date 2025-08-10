import stripe from 'stripe'
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';

export const stripeWebhooks = async (request, response) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
    const sig = request.headers["stripe-signature"];
    let event;
    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)

    } catch (error) {
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            // case "payment_intent.succeeded": {
            case "checkout.session.completed": {
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                })
                if (!sessionList.data || sessionList.data.length === 0) {
                    console.error("No checkout session found for payment intent:", paymentIntent.id);
                    return response.status(400).send("Checkout session not found.");
                }
                const session = sessionList.data[0];
                if (!session.metadata?.bookingId) {
                    console.error("Missing bookingId in metadata.");
                    return response.status(400).send("Missing bookingId.");
                }
                const { bookingId } = session.metadata;

                await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentLink: ""
                })
                // send confirmation email to user
                await inngest.send({
                    name: 'app/show.booked',
                    data: { bookingId }
                })
                break;
            }
            default:
                console.log('Unhandled event type: ', event.type);
        }
        response.json({ received: true })

    } catch (error) {
        console.log("Webhook processing error: ", error);
        response.status(500).send("Internal server error")
    }
}