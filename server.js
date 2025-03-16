const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const tourData = JSON.parse(fs.readFileSync('cleaned_tour_data.json', 'utf8'));

app.post('/webhook', (req, res) => {
    const parameters = req.body.queryResult.parameters;

    const destination = parameters.destination || "unknown";
    let tourName = parameters['tour-name'] || null;
    let people = parameters.people || 1;

    if (people > 20) people = 2;

    let date = "no date provided";
    if (parameters['date-period']) {
        let startDate = new Date(parameters['date-period'].startDate);
        let endDate = new Date(parameters['date-period'].endDate);

        startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset() + 180);
        endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset() + 180);

        if (startDate.getFullYear() < 2025) startDate.setFullYear(2025);
        if (endDate.getFullYear() < 2025) endDate.setFullYear(2025);

        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        date = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    }

    // ✅ Match based on destination + tour name
    const match = tourData.find(tour => 
        tour.City.toLowerCase() === destination.toLowerCase() &&
        (!tourName || tour['Tour Name'].toLowerCase().includes(tourName.toLowerCase()))
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

    res.json({
        fulfillmentText: responseText
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
