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
        let startDate = new Date(parameters['date-period'].startDate);
        let endDate = new Date(parameters['date-period'].endDate);

        // 🔥 FIX: If year is in the past → Adjust to the future
        const currentYear = new Date().getFullYear();
        if (startDate.getFullYear() < currentYear) {
            startDate.setFullYear(currentYear);
        }
        if (endDate.getFullYear() < currentYear) {
            endDate.setFullYear(currentYear);
        }

        date = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
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

