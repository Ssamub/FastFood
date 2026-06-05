const dns = require("dns"); 
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const { connectDB } = require('./db/database.js');
const userRoutes = require('./routes/user-routes.js');
const restaurantRoutes = require('./routes/restaurant-routes.js');
const orderRoutes = require('./routes/order-routes.js');
const mealRoutes = require('./routes/meal-routes.js');

const port = 3000;
const app = express();

app.use(express.json());
app.use(cors());

app.use('/api', userRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', orderRoutes);
app.use('/api', mealRoutes);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`);
    });
}).catch(console.error);