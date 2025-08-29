import stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebHooks = async (req, res) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // ⚠️ Important: make sure raw body is passed (not JSON-parsed)
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_KEY
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });
        const session = sessionList.data[0];
        const { bookingId } = session.metadata;
        await Booking.findByIdAndUpdate(bookingId,{isPaid:true,paymentLink:""});
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err.message);
    res.status(500).send("Server error while processing webhook");
  }
};
