const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    const parameters = req.body.queryResult.parameters;

    // Extract parameters from Dialogflow
    const destination = parameters.destination || "unknown";
    const people = parameters.people || 1;
    const date = parameters.date || "unknown";

    // Create response text
    const responseText = `Got it! Searching for the best options in ${destination} for ${people} travelers on ${date}.`;

    // Send response to Dialogflow
    res.json({
        fulfillmentText: responseText
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
