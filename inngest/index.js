import { Inngest } from "inngest";
import User from "../models/User.js";

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

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate];
