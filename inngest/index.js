import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-app" });

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      Image: image_url,
    };
    await User.create(userData).catch((err) => {
      console.error("Error creating user:", err);
    });
  }
);

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { userId } = event.data;

    await User.findByIdAndDelete(userId).catch((err) => {
      console.error("Error deleting user:", err);
    });
  }
);

const syncUserUpdate = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      Image: image_url,
    };
    await User.findByIdAndUpdate(id, userData, { new: true }).catch((err) => {
      console.error("Error updating user:", err);
    });
  }
);

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);
    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);
      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat) => {
          delete show.occupied_seats[seat];
        });
        show.markModified("occupied_seats");
        await show.save();
        await Booking.findByIdAndDelete(bookingId);
      }
    });
  }
);

const sendBookingEmail = inngest.createFunction(
  { id: "send-booking-email" },
  { event: "app/show.booked" }, // event name to listen for
  async ({ event, step }) => {
    const { bookingId } = event.data;
    const booking = await Booking.findById(bookingId).populate([
      { path: "user", model: "User" },
      { path: "show", populate: { path: "movie", model: "Movie" } },
    ]);

    await sendmail({
      to: booking.user.email,
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      body: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Hi ${booking.user.name},</h2>
      <p>Your booking for <strong style="color: #F84565;">"${
        booking.show.movie.title
      }"</strong> is confirmed.</p>
      <p>
        <strong>Date:</strong> ${new Date(
          booking.show.showDateTime
        ).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}<br/>
        <strong>Time:</strong> ${new Date(
          booking.show.showDateTime
        ).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })}
      </p>
      <p>Enjoy the show! 🍿</p>
      <p>Thanks for booking with us!<br/>— BMS Team</p>
    </div>
  `,
    });

    return { success: true, message: "Email sent successfully" };
  }
);

// 1️⃣ Schedule reminder when booking happens
const scheduleReminderEmail = inngest.createFunction(
  { id: "schedule-reminder-email" },
  { event: "app/show.booked" }, // trigger on booking
  async ({ event, step }) => {
    const { bookingId } = event.data;

    // Fetch booking with populated details
    const booking = await Booking.findById(bookingId).populate([
      { path: "user", model: "User" },
      { path: "show", populate: { path: "movie", model: "Movie" } },
    ]);

    if (!booking?.user?.email) {
      throw new Error("❌ No user email found for booking " + bookingId);
    }

    const showTime = new Date(booking.show.showDateTime);

    // Reminder time = 1 hour before show
    const reminderTime = new Date(showTime.getTime() - 60 * 60 * 1000);

    // Schedule new event for that time
    await step.sendEvent({
      name: "app/show.reminder",
      data: { bookingId },
      ts: reminderTime, // execute at reminder time
    });

    return { scheduled: true, reminderTime };
  }
);

// 2️⃣ Handle the reminder event & send email
const sendReminderEmail = inngest.createFunction(
  { id: "send-reminder-email" },
  { event: "app/show.reminder" }, // fires at reminder time
  async ({ event }) => {
    const { bookingId } = event.data;

    // Fetch booking again
    const booking = await Booking.findById(bookingId).populate([
      { path: "user", model: "User" },
      { path: "show", populate: { path: "movie", model: "Movie" } },
    ]);

    if (!booking?.user?.email) {
      throw new Error("❌ No user email found for booking " + bookingId);
    }

    await sendmail({
      to: booking.user.email,
      subject: `Reminder: "${booking.show.movie.title}" starts soon!`,
      body: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Hi ${booking.user.name},</h2>
          <p>This is a friendly reminder that your show 
            <strong style="color: #F84565;">"${
              booking.show.movie.title
            }"</strong> 
            will start in 1 hour.</p>
          <p>
            <strong>Date:</strong> ${new Date(
              booking.show.showDateTime
            ).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}<br/>
            <strong>Time:</strong> ${new Date(
              booking.show.showDateTime
            ).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })}
          </p>
          <p>Don't miss it! 🍿</p>
          <p>— BMS Team</p>
        </div>
      `,
    });

    return { success: true, message: "Reminder email sent" };
  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  releaseSeatsAndDeleteBooking,
  sendBookingEmail,
  scheduleReminderEmail,
  sendReminderEmail,
];
