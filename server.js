require('dotenv').config();
// Load environment variables from .env
console.log("Dialogflow Token:", process.env.DIALOGFLOW_ACCESS_TOKEN || 'NOT SET');
console.log("Email User:", process.env.EMAIL_USER || 'NOT SET');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { SessionsClient } = require('@google-cloud/dialogflow');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Load tour data from JSON file
const tours = require('./cleaned_tour_data.json');

// ✅ Function to find matching tour
function findTour(city, tourName) {
    return tours.find(tour =>
        tour.city.toLowerCase() === city.toLowerCase() &&
        tour.name.toLowerCase().includes(tourName.toLowerCase())
    );
}

// ✅ Validate Dialogflow Requests (to avoid authentication error)
app.use((req, res, next) => {
    const authToken = req.headers['authorization'];
    if (!authToken || authToken !== `Bearer ${process.env.DIALOGFLOW_ACCESS_TOKEN}`) {
        return res.status(401).send('Unauthorized');
    }
    next();
});

// ✅ Handle Dialogflow POST Request
app.post('/webhook', async (req, res) => {
    const params = req.body.queryResult.parameters;
    const city = params['destination'];
    const tourName = params['tour-name'];
    const people = params['people'];
    const date = params['date-period']?.startDate || null;

    console.log(`Received Request: City=${city}, Tour=${tourName}, People=${people}, Date=${date}`);

    const tour = findTour(city, tourName);

    if (tour) {
        const totalPrice = tour.price * people;

        // ✅ Send confirmation email
        await sendBookingEmail(city, tourName, people, totalPrice, date);

        // ✅ Book Now Button + Total Price in Response
        res.json({
            fulfillmentText: `✅ Got it! The ${tour.name} in ${city} costs $${tour.price} per person with ${tour.mealInfo}. 
Total for ${people} people: $${totalPrice}. 

👉 [**Book Now**](https://mervintravel.wetravel.com)`, // Replace with your WeTravel link
        });
    } else {
        res.json({
            fulfillmentText: `❌ Sorry, I couldn't find a tour named "${tourName}" in ${city}.`
        });
    }
});

// ✅ Function to Send Booking Email
async function sendBookingEmail(city, tourName, people, totalPrice, date) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER, // Stored in .env file
            pass: process.env.EMAIL_PASS  // Stored in .env file
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'reservation@mervintravel.com',
        subject: `New Booking Request - ${tourName}`,
        text: `📩 New booking request:
- 🌍 Tour: ${tourName}
- 🏙️ City: ${city}
- 👥 People: ${people}
- 📅 Date: ${date ? formatDate(date) : 'N/A'}
- 💰 Total Price: $${totalPrice}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Booking email sent successfully!');
    } catch (error) {
        console.error('❌ Error sending booking email:', error);
    }
}

// ✅ Helper Function to Format Date (DD-MM-YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
}

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
