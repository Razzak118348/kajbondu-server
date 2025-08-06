const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://kajbondu.web.app',
    'https://effulgent-moonbeam-41ff3e.netlify.app',

  ],
  credentials: true // Allow credentials for cookies, authorization headers,
}));
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:
${process.env.DB_PASSWORD}@cluster0.zmdqm8z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // Database and collection
    const allService = client.db("kajBondu").collection("kajBonduDB");
    const allBooking = client.db("kajBondu").collection("bookingDB");
    const allWorker = client.db("kajBondu").collection("workerDB");

    app.get('/services', async (req, res) => {
      const cursor = allService.find();
      const services = await cursor.toArray();
      res.send(services);
    });

    // Get service by ObjectId
    app.get('/services/id/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await allService.findOne(query);
        if (!result) return res.status(404).send({ message: "Service not found" });
        res.send(result);
      } catch (error) {
        res.status(400).send({ message: "Invalid service ID", error: error.message });
      }
    });

    // Get services by category name
    app.get('/services/category/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: { $regex: new RegExp(`^${category}$`, 'i') } };
      try {
        const services = await allService.find(query).toArray();
        if (services.length === 0) {
          return res.status(404).send({ message: "No services found for this category" });
        }
        res.send(services);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    // POST booking data
    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      try {
        const result = await allBooking.insertOne(booking);
        res.status(201).send({
          message: "Booking successful",
          insertedId: result.insertedId
        });
      } catch (error) {
        res.status(500).send({
          message: "Booking failed",
          error: error.message
        });
      }
    });

    // Get bookings by user email
    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Email query parameter is required" });
      }
      try {
        const query = { email: email };
        const bookings = await allBooking.find(query).toArray();
        if (bookings.length === 0) {
          return res.status(404).send({ message: "No bookings found for this user" });
        }
        res.send(bookings);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    // Get all bookings (for Admin panel)
    app.get('/all-bookings', async (req, res) => {
      try {
        const bookings = await allBooking.find().toArray();
        res.send(bookings);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    // Delete booking by ID
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allBooking.deleteOne(query);
      res.send(result);
    });

    // POST worker application data
    app.post('/worker', async (req, res) => {
      const worker = req.body;
      try {
        const result = await allWorker.insertOne(worker);
        res.status(201).send({
          message: "Worker application submitted successfully",
          insertedId: result.insertedId
        });
      } catch (error) {
        res.status(500).send({
          message: "Failed to submit worker application",
          error: error.message
        });
      }
    });

    // Get all worker applications
    app.get('/worker', async (req, res) => {
      try {
        const cursor = allWorker.find();
        const workers = await cursor.toArray();
        res.send(workers);
      } catch (error) {
        res.status(500).send({ message: "Failed to retrieve worker applications", error: error.message });
      }
    });

    // Delete worker application by ID
    app.delete('/worker/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      try {
        const result = await allWorker.deleteOne(query);
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Worker application not found" });
        }
        res.send({ message: "Worker application deleted successfully" });
      } catch (error) {
        res.status(500).send({ message: "Failed to delete worker application", error: error.message });
      }
    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Welcome to kajBondu Server!');
});

app.listen(port, () => {
  console.log(`kajBondu server is running on http://localhost:${port}`);
});