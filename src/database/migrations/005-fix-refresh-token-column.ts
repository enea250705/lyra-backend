import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Fix refresh_token column length issue
  await queryInterface.changeColumn('users', 'refresh_token', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Revert refresh_token column back to VARCHAR(500)
  await queryInterface.changeColumn('users', 'refresh_token', {
    type: DataTypes.STRING(500),
    allowNull: true,
  });
};

