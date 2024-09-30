require('dotenv').config();
const express = require('express');
const { addEnumToPrismaSchema } = require('./enumHandler');
const app = express();

app.use(express.json());

// Define a route to add a new enum
app.post('/add-enum', (req, res) => {
  const { enumName, enumValues } = req.body;
  if (!enumName || !Array.isArray(enumValues)) {
    return res.status(400).send('Invalid request. Please provide an enum name and an array of values.');
  }

  addEnumToPrismaSchema(enumName, enumValues);
  res.send(`Enum ${enumName} with values ${enumValues.join(', ')} has been added to the Prisma schema.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
