const mongoose = require('mongoose');
const Section = require('./models/Section');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/lhrweb');
  const sections = await Section.find({});
  console.log(JSON.stringify(sections, null, 2));
  process.exit(0);
}

check();
