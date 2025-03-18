require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    const { destination, people, datePeriod, tourName } = req.body.queryResult.parameters;

    try {
        // Step 1: Send to WeTravel API
        const response = await axios.post(
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
                    'Authorization': `Bearer ${process.env.WETRAVEL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const bookingLink = response.data.booking_url;

        // Step 2: Send Email Confirmation
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
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

        // Step 3: Send Confirmation to User
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
