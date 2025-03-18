const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require('path');
const { SessionsClient } = require('@google-cloud/dialogflow');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Dialogflow Client
const credentials = require(path.join(__dirname, 'your-service-account-file.json')); // Replace with your JSON file path
const dialogflowClient = new SessionsClient({ credentials });

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    try {
        const { destination, people, datePeriod, tourName } = req.body.queryResult.parameters;

        if (!destination || !people || !datePeriod || !tourName) {
            return res.json({
                fulfillmentText: `Sorry, I need more details to book your trip. Please specify the destination, tour, number of people, and dates.`
            });
        }

        // ✅ Step 1: Send to WeTravel API
        const weTravelResponse = await axios.post(
            'https://mervintravel.wetravel.com/api/v1/bookings',
            {
                tour_name: tourName,
                destination: destination,
                people: people,
                start_date: datePeriod.startDate,
                end_date: datePeriod.endDate
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WETRAVEL_TOKEN}`, // Store token in .env
                    'Content-Type': 'application/json'
                }
            }
        );

        const bookingLink = weTravelResponse.data.booking_url; // Assuming WeTravel returns booking URL

        // ✅ Step 2: Send Email Confirmation
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.reservation@mervintravel.com, // Store email in .env
                pass: process.env.Mervin041216 // Store password in .env
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'reservation@mervintravel.com',
            subject: `New Booking - ${tourName}`,
            text: `
                New booking received:
                - Destination: ${destination}
                - Tour: ${tourName}
                - People: ${people}
                - Date: ${datePeriod.startDate} to ${datePeriod.endDate}
                - Booking Link: ${bookingLink}
            `
        };

        await transporter.sendMail(mailOptions);

        // ✅ Step 3: Send Confirmation to User
        return res.json({
            fulfillmentText: `Got it! The ${tourName} in ${destination} costs $60 per person. Click here to book: [Book Now](${bookingLink})`
        });

    } catch (error) {
        console.error('Error:', error.message);
        return res.json({
            fulfillmentText: `Sorry, there was an issue processing your booking. Please try again later.`
        });
    }
});

// ✅ Step 4: Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

