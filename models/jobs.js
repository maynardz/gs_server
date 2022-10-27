const {DataTypes} = require('sequelize');
const db = require('../db');

const Employment = db.define('employment', {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    fileAttachment: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    }
})

module.exports = Employment;