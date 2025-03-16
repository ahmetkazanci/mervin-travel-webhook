const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Load tour data from JSON file
const tourData = JSON.parse(fs.readFileSync('cleaned_tour_data.json', 'utf8'));

app.post('/webhook', (req, res) => {
    const parameters = req.body.queryResult.parameters;

    // ✅ Extract parameters from Dialogflow
    const destination = parameters.destination || "unknown";
    let people = parameters.people || 1;

    // ✅ Fix people value if AI mistakenly assigns a date-related number
    if (people > 20) {
        people = 2; // Default to 2 if the number is unrealistic
    }

    // ✅ Handle date-period correctly
    let date = "no date provided";
    if (parameters['date-period']) {
        let startDate = new Date(parameters['date-period'].startDate);
        let endDate = new Date(parameters['date-period'].endDate);

        // ✅ Fix timezone (Turkey UTC+3)
        startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset() + 180);
        endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset() + 180);

        // ✅ Force year to 2025 if not explicitly mentioned
        if (startDate.getFullYear() < 2025) startDate.setFullYear(2025);
        if (endDate.getFullYear() < 2025) endDate.setFullYear(2025);

        // ✅ Format to DD-MM-YYYY
        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        date = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    }

    // ✅ Match tour from data
    const match = tourData.find(tour => 
        tour.City.toLowerCase() === destination.toLowerCase()
    );

    let responseText;
    if (match) {
        const price = match['Price ($)'];
        const includesLunch = match['Includes Lunch'] === 'Yes' ? "with lunch" : "without lunch";
        const includesDinner = match['Includes Dinner'] === 'Yes' ? "with dinner" : "without dinner";
        
        responseText = `Got it! The ${match['Tour Name']} in ${destination} costs $${price} per person, ${includesLunch} and ${includesDinner}. Date: ${date}.`;
    } else {
        responseText = `Sorry, I couldn't find any available tours in ${destination}.`;
    }

    // ✅ Send response to Dialogflow
    res.json({
        fulfillmentText: responseText
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
