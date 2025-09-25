const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    logging: console.log,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

async function addDrNumberColumn() {
  try {
    // First check if the table has any columns
    const [tableInfo] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tickets'
      AND table_schema = 'public'
    `);

    if (tableInfo.length === 0) {
      console.log('⚠️  Tickets table exists but is empty. Creating table structure...');

      // Create the tickets table with proper structure
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id SERIAL PRIMARY KEY,
          "status" VARCHAR(50) DEFAULT 'open',
          "queueId" INTEGER,
          "whatsappId" INTEGER NOT NULL,
          "contactId" INTEGER NOT NULL,
          "userId" INTEGER,
          "lastMessage" TEXT,
          "unreadMessages" INTEGER DEFAULT 0,
          "isGroup" BOOLEAN DEFAULT FALSE,
          "drNumber" VARCHAR(255),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ Tickets table created successfully!');
    } else {
      // Check if drNumber column already exists
      const hasDrNumber = tableInfo.some(col => col.column_name === 'drNumber');

      if (!hasDrNumber) {
        await sequelize.queryInterface.addColumn('tickets', 'drNumber', {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'DR number for ticket filtering (DR followed by 7 digits)'
        });
        console.log('✅ drNumber column added successfully!');
      } else {
        console.log('✅ drNumber column already exists!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

addDrNumberColumn();