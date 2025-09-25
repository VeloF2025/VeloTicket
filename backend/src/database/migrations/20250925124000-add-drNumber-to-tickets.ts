import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("tickets", "drNumber", {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
      comment: "DR number for ticket filtering (DR followed by 7 digits)"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("tickets", "drNumber");
  }
};