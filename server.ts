import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import twilio from "twilio";
import dotenv from "dotenv";
import cors from "cors";
import Stripe from "stripe";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId, userId, userEmail } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.APP_URL}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.APP_URL}/?success=false`,
        customer_email: userEmail,
        metadata: {
          userId: userId,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Gmail OAuth Setup
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.APP_URL}/api/auth/gmail/callback`
  );

  app.get("/api/auth/gmail/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/gmail.send"],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/api/auth/gmail/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      // In a real app, we'd store this in a database linked to the user
      // For this demo, we'll send it back to the client via postMessage
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GMAIL_AUTH_SUCCESS', 
                  tokens: ${JSON.stringify(tokens)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Bulk Email Blast
  app.post("/api/blast/email", async (req, res) => {
    const { tokens, recipients, subject, body } = req.body;
    
    if (!tokens || !recipients || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const results = [];
      for (const recipient of recipients) {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
          `To: ${recipient}`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${utf8Subject}`,
          '',
          body,
        ];
        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        try {
          await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw: encodedMessage }
          });
          results.push({ email: recipient, status: "sent" });
        } catch (err) {
          console.error(`Failed to send to ${recipient}:`, err);
          results.push({ email: recipient, status: "failed", error: err.message });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Gmail blast error:", error);
      res.status(500).json({ error: "Failed to send emails" });
    }
  });

  // Bulk SMS Blast
  app.post("/api/blast/sms", async (req, res) => {
    const { recipients, message } = req.body;
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return res.status(500).json({ error: "Twilio credentials not configured" });
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const results = [];

    for (const recipient of recipients) {
      try {
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipient
        });
        results.push({ phone: recipient, status: "sent" });
      } catch (err) {
        console.error(`Failed to send SMS to ${recipient}:`, err);
        results.push({ phone: recipient, status: "failed", error: err.message });
      }
    }

    res.json({ results });
  });

  // Skip Tracing API (BatchData Example)
  app.post("/api/skiptrace", async (req, res) => {
    const { firstName, lastName, address, city, state, zip } = req.body;
    
    if (!process.env.SKIPTRACE_API_KEY) {
      // Fallback for demo if no key is provided
      return res.json({
        success: true,
        isDemo: true,
        phone: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        email: `${firstName?.toLowerCase()}.${lastName?.toLowerCase()}@example.com`
      });
    }

    try {
      // This is a generic implementation for a Skip Trace provider like BatchData
      const response = await fetch("https://api.batchdata.com/api/v1/skiptrace/single", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SKIPTRACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [{
            firstName,
            lastName,
            propertyAddress: {
              street: address,
              city,
              state,
              zip
            }
          }]
        })
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Skip Trace API error:", error);
      res.status(500).json({ error: "Failed to perform skip trace" });
    }
  });

  // Property Search API (Attom Data Example)
  app.get("/api/property/search", async (req, res) => {
    const { address, city, state, zip } = req.query;

    if (!process.env.PROPERTY_API_KEY) {
      return res.status(500).json({ error: "Property API key not configured" });
    }

    try {
      // Example using Attom Data API
      const response = await fetch(`https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${address}&address2=${city}, ${state} ${zip}`, {
        headers: {
          "apikey": process.env.PROPERTY_API_KEY,
          "Accept": "application/json"
        }
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Property Search API error:", error);
      res.status(500).json({ error: "Failed to fetch property details" });
    }
  });

  // Automation Processing
  app.post("/api/automations/process", async (req, res) => {
    const { leads, sequences, gmailTokens } = req.body;
    
    if (!leads || !sequences) {
      return res.status(400).json({ error: "Missing data" });
    }

    const results = [];
    const now = new Date();

    for (const lead of leads) {
      if (!lead.sequenceId) continue;

      const sequence = sequences.find((s: any) => s.id === lead.sequenceId);
      if (!sequence) continue;

      const currentStepIndex = lead.currentStepIndex ?? -1;
      const nextStepIndex = currentStepIndex + 1;

      if (nextStepIndex >= sequence.steps.length) continue;

      const nextStep = sequence.steps[nextStepIndex];
      const createdAt = new Date(lead.createdAt);
      const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreated >= nextStep.day) {
        // Execute step
        try {
          if (nextStep.type === "email" && gmailTokens) {
            oauth2Client.setCredentials(gmailTokens);
            const gmail = google.gmail({ version: "v1", auth: oauth2Client });
            const subject = nextStep.subject || "Follow up";
            const body = nextStep.body;
            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
            const messageParts = [
              `To: ${lead.email}`,
              'Content-Type: text/html; charset=utf-8',
              'MIME-Version: 1.0',
              `Subject: ${utf8Subject}`,
              '',
              body,
            ];
            const message = messageParts.join('\n');
            const encodedMessage = Buffer.from(message)
              .toString('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');

            await gmail.users.messages.send({
              userId: "me",
              requestBody: { raw: encodedMessage }
            });
            results.push({ leadId: lead.id, step: nextStepIndex, status: "sent_email" });
          } else if (nextStep.type === "sms" && process.env.TWILIO_ACCOUNT_SID) {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
              body: nextStep.body,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: lead.phone
            });
            results.push({ leadId: lead.id, step: nextStepIndex, status: "sent_sms" });
          }
        } catch (err) {
          console.error(`Automation failed for lead ${lead.id}:`, err);
          results.push({ leadId: lead.id, step: nextStepIndex, status: "failed", error: err.message });
        }
      }
    }

    res.json({ results });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
