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
            'https://mervintravel.wetravel.com/api/v1/bookings', // Replace with actual WeTravel API endpoint
            {
                tour_name: tourName,
                destination: destination,
                people: people,
                start_date: datePeriod.startDate,
                end_date: datePeriod.endDate
            },
            {
                headers: {
                    'Authorization': `eyJraWQiOiI0NGIwYzc4OSIsImFsZyI6IlJTMjU2In0.eyJpZCI6MTE0NzIxMSwidmVyIjo1LCJwdWIiOnRydWUsInNjb3BlcyI6WyJydzphbGwiXSwiZXhwIjoyMDU3NzAyNDAwLCJqdGkiOiI5YjBlY2FiZi00YjliLTRlNGUtYTE4Ni0zMjE5ZGM1ZWYwYmEiLCJraW5kIjoicmVmcmVzaCJ9.r6exPc8-uVcCSKKNK76WiXpjPQew_sMrDiNO73maVnORkt5MDhjTzmtAEXFHmR-fqMhKdcdAecHzDsCO238QYFfU5wtQZGuqdQ-_hklyhzi3oyHZ3yLIqXi60FDJ1e9qSvXHk2KauK_GAkEJbGtSVfbmR76qmw8_ML8kfwvQ6HRwdEJy57v6BFRbfIk6H6Y5k09soOHo-uxTgVq3rO28yADsCUDaozoZ7YFSIeCgVfBmXYTxGn4Y2hcg3rqS7-EApqNM6U9Deu7OIiAO6nJWRM_Fu87_cNy8ZTlZnEX-_6VgpiXi1OVXokGtFdWytiiQtmuAmzUnEoRFsiTJiA9q-g`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const bookingLink = response.data.booking_url; // Assuming WeTravel returns a URL

        // Step 2: Send Email Confirmation
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'reservation@mervintravel.com', // Replace with your email
                pass: 'Mervin041216' // Use an app password if 2FA is enabled
            }
        });

        const mailOptions = {
            from: 'your-email@gmail.com',
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
