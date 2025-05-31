const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Get the Table model
    const Table = require('../models/Table');
    
    // Find all tables
    const tables = await Table.find({});
    console.log(`Found ${tables.length} tables`);
    
    // Check for tables with null numbers
    const tablesWithNullNumber = tables.filter(t => t.number === null || t.number === undefined);
    console.log(`Found ${tablesWithNullNumber.length} tables with null number`);
    
    // Check for tables with null tableNumber
    const tablesWithNullTableNumber = tables.filter(t => t.tableNumber === null || t.tableNumber === undefined);
    console.log(`Found ${tablesWithNullTableNumber.length} tables with null tableNumber`);
    
    // Fix tables with null numbers
    let fixedCount = 0;
    let nextNumber = 1;
    
    // Find the highest current table number
    const highestNumberTable = await Table.findOne().sort({ number: -1 });
    if (highestNumberTable && highestNumberTable.number) {
      nextNumber = highestNumberTable.number + 1;
    }
    
    // Fix tables with null numbers
    for (const table of tablesWithNullNumber) {
      // If tableNumber is set, use that
      if (table.tableNumber !== null && table.tableNumber !== undefined) {
        table.number = table.tableNumber;
      } else {
        // Otherwise assign a new number
        table.number = nextNumber++;
      }
      
      await table.save();
      fixedCount++;
      console.log(`Fixed table ${table._id} with number ${table.number}`);
    }
    
    // Fix tables with null tableNumber
    for (const table of tablesWithNullTableNumber) {
      // If number is set, use that
      if (table.number !== null && table.number !== undefined) {
        table.tableNumber = table.number;
      } else {
        // This shouldn't happen as we fixed all null numbers above
        table.tableNumber = nextNumber++;
        table.number = table.tableNumber;
      }
      
      await table.save();
      fixedCount++;
      console.log(`Fixed table ${table._id} with tableNumber ${table.tableNumber}`);
    }
    
    console.log(`Fixed ${fixedCount} tables`);
    
    // Check for duplicate numbers
    const numbers = tables.map(t => t.number).filter(n => n !== null && n !== undefined);
    const uniqueNumbers = [...new Set(numbers)];
    
    if (numbers.length !== uniqueNumbers.length) {
      console.log('Warning: There are duplicate table numbers!');
      
      // Find duplicates
      const counts = {};
      numbers.forEach(n => {
        counts[n] = (counts[n] || 0) + 1;
      });
      
      const duplicates = Object.entries(counts)
        .filter(([_, count]) => count > 1)
        .map(([number, _]) => number);
      
      console.log(`Duplicate numbers: ${duplicates.join(', ')}`);
      
      // Fix duplicates
      for (const dup of duplicates) {
        // Find tables with this number
        const tablesWithDupNumber = await Table.find({ number: dup });
        
        // Keep the first one, update the rest
        for (let i = 1; i < tablesWithDupNumber.length; i++) {
          const table = tablesWithDupNumber[i];
          table.number = nextNumber;
          table.tableNumber = nextNumber;
          nextNumber++;
          
          await table.save();
          console.log(`Updated duplicate table ${table._id} from number ${dup} to ${table.number}`);
        }
      }
    }
    
    console.log('Table fix script completed successfully');
  } catch (error) {
    console.error('Error fixing tables:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
});