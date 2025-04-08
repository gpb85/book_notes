import pg from 'pg';  // Εισαγωγή ολόκληρης της βιβλιοθήκης
const { Pool } = pg;  // Από την βιβλιοθήκη, πάρε το Pool


import dotenv from 'dotenv';  // Χρησιμοποιούμε το dotenv για να διαχειριστούμε τα περιβαλλοντικά μεταβλητά
dotenv.config();  // Φορτώνουμε το αρχείο .env

// Δημιουργία του Pool με τις παραμέτρους σύνδεσης
const pool = new Pool({
  user: process.env.DB_USER,  // Όνομα χρήστη από το .env αρχείο
  host: process.env.DB_HOST,  // Διεύθυνση του database server
  database: process.env.DB_DATABASE,  // Όνομα της βάσης δεδομένων
  password: process.env.DB_PASSWORD,  // Κωδικός χρήστη από το .env αρχείο
  port: process.env.DB_PORT,  // Θύρα για σύνδεση (προεπιλογή 5432 για PostgreSQL)
  
  // Προαιρετικές παράμετροι:
  max: 20,  // Μέγιστος αριθμός συνδέσεων στο Pool
  idleTimeoutMillis: 30000,  // Χρόνος σε ms για την αδράνεια σύνδεσης πριν κλείσει
  connectionTimeoutMillis: 2000  // Χρόνος σε ms για να αποκτηθεί μια σύνδεση από το Pool
});

// Εξαγωγή του pool για να το χρησιμοποιήσεις σε άλλα αρχεία
export default pool;
