const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const schemaPath = path.resolve(__dirname, 'prisma/schema.prisma');

/**
 * Adds new values to an existing enum or creates a new enum in the Prisma schema.
 * @param {string} enumName - The name of the new or existing enum.
 * @param {Array<string>} newEnumValues - The new values to add to the enum.
 */
function addEnumToPrismaSchema(enumName, newEnumValues) {
  const enumDefinition = `enum ${enumName} {\n  ${newEnumValues.join('\n  ')}\n}\n\n`;

  try {
    // Read the current schema file
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Check if the enum already exists in the schema
    const regex = new RegExp(`enum\\s+${enumName}\\s+{([\\s\\S]*?)}\n`, 'i');
    const match = schemaContent.match(regex);

    if (match) {
      console.log(`Enum ${enumName} already exists in the schema. Checking for missing values...`);

      // Extract the existing enum values and clean them up
      const existingValues = match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Combine new values with existing values
      const combinedEnumValues = Array.from(new Set([...existingValues, ...newEnumValues]));

      // Replace the existing enum with the updated values
      const updatedEnumDefinition = `enum ${enumName} {\n  ${combinedEnumValues.join('\n  ')}\n}`;
      schemaContent = schemaContent.replace(regex, updatedEnumDefinition);

      console.log(`Enum ${enumName} updated with new values: ${newEnumValues.join(', ')}`);
    } else {
      // If the enum does not exist, add it to the schema
      console.log(`Enum ${enumName} does not exist. Creating a new enum.`);
      const modelIndex = schemaContent.search(/model\s+\w+\s+{/i);
      schemaContent = (modelIndex !== -1)
        ? schemaContent.slice(0, modelIndex) + enumDefinition + schemaContent.slice(modelIndex)
        : schemaContent + '\n' + enumDefinition;

      console.log(`Enum ${enumName} added to Prisma schema.`);
    }

    // Write the updated schema back to the file
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    console.log(`Prisma schema updated successfully.`);

    // Run Prisma format and migrate commands
    exec('npx prisma format', (formatErr, formatStdout, formatStderr) => {
      if (formatErr) {
        console.error(`Error formatting Prisma schema: ${formatStderr}`);
        return;
      }
      console.log('Prisma schema formatted successfully.');

      // Run Prisma migrate to update the database schema
      exec('npx prisma migrate dev --name update_enum', (migrateErr, migrateStdout, migrateStderr) => {
        if (migrateErr) {
          console.error(`Error running Prisma migrate: ${migrateStderr}`);
          return;
        }
        console.log('Prisma migrate completed successfully.');
      });
    });
  } catch (err) {
    console.error(`Error reading or updating Prisma schema: ${err.message}`);
  }
}



// Example usage
//addEnumToPrismaSchema('Role', ['FED', 'USER', 'ADMIN']);

module.exports = { addEnumToPrismaSchema };
