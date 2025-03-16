const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    const parameters = req.body.queryResult.parameters;

    // Extract parameters from Dialogflow
    const destination = parameters.destination || "unknown";
    let people = parameters.people || 1;

    // Fix people value if AI mistakenly assigns a date-related number
    if (people > 20) {
        people = 2; // Default to 2 if the number is unrealistic
    }

    // Handle date-period correctly
    let date = "no date provided";
    if (parameters['date-period']) {
        // Convert UTC date to local timezone (Turkey = UTC +3)
        let startDate = new Date(parameters['date-period'].startDate);
        let endDate = new Date(parameters['date-period'].endDate);

        // ✅ Force date to local time zone (Turkey = UTC +3)
        startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset() + 180);
        endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset() + 180);

        // ✅ Force year to 2025 if not explicitly mentioned
        if (startDate.getFullYear() < 2025) {
            startDate.setFullYear(2025);
        }
        if (endDate.getFullYear() < 2025) {
            endDate.setFullYear(2025);
        }

        // ✅ Format to DD-MM-YYYY
        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        date = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    }

    // Create response text
    const responseText = `Got it! Searching for the best options in ${destination} for ${people} travelers from ${date}.`;

    // Send response to Dialogflow
    res.json({
        fulfillmentText: responseText
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



