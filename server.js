const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    const parameters = req.body.queryResult.parameters;

    // Extract parameters from Dialogflow
    const destination = parameters.destination || "unknown";
    const people = parameters.people || 1;
    
    // Handle date-period correctly
    let date = "no date provided";
    if (parameters['date-period']) {
        const startDate = parameters['date-period'].startDate || "unknown";
        const endDate = parameters['date-period'].endDate || "unknown";
        date = `${startDate} to ${endDate}`;
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
