const mongoose = require('mongoose');

// --- This is your real connection string ---
const db = "mongodb+srv://Maazayoob:9336465171@cluster0.qkjbzf0.mongodb.net/?appName=Cluster0"; 

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;