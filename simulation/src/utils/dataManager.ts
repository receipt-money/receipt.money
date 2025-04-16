import fs from 'fs';
import path from 'path';

// Simple path to data.json in the simulation directory
const DATA_FILE_PATH = path.resolve(__dirname, '../../data.json');

/**
 * Load data from the JSON file
 * @returns The parsed JSON data
 */
export function loadData(): any {
  try {
    // Check if file exists
    if (!fs.existsSync(DATA_FILE_PATH)) {
      // Create empty data object if file doesn't exist
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({}, null, 2));
      return {};
    }
    
    const jsonData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error loading data:', error);
    return {};
  }
}

/**
 * Save data to the JSON file
 * @param data The data to save
 */
export function saveData(data: any): void {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    console.log('Data saved successfully to', DATA_FILE_PATH);
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

/**
 * Update a specific field in the data file
 * @param key The key to update
 * @param value The value to set
 */
export function updateData(key: string, value: any): void {
  try {
    const data = loadData();
    data[key] = value;
    saveData(data);
    console.log(`Updated ${key} in data.json`);
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    throw error;
  }
} 