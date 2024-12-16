const http = require("http"); 
const path = require("path"); 
require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const fs = require("fs"); 
const bodyParser = require("body-parser"); 
const express = require("express"); 
const app = express(); 
const portNumber = process.argv[2];
const username = process.env.MONGO_DB;
const password = process.env.MONGO_DB_PASSWORD;
const uri = `mongodb+srv://${username}:${password}@cluster0.g4ifj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const databaseAndCollection = {db: "CMSC335DB", collection:"jokes"};
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "templates")); 
app.set("view engine", "ejs"); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.json());

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
process.stdout.write("Stop to shutdown the server: ");

process.stdin.on("readable", function () { 
    const dataInput = process.stdin.read();
  
    if (dataInput !== null) {
        const command = dataInput.toString().trim();

        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);
        }
    }
});

// rendering the home page
app.get("/", (request, response) => { 
    response.render("home"); 
}); 

// displays jokes that contain the keyword
app.post("/display", (request, response) => {
    const keyword = request.body.keyword;
    const filePath = path.resolve(__dirname, 'jokes.json'); 
    const fileData = fs.readFileSync(filePath, 'utf8');
    const jokes = JSON.parse(fileData); 
    const filteredJokes = jokes.filter(joke => joke.toLowerCase().includes(keyword.toLowerCase()));
    response.render("display", { jokes: filteredJokes });
});

app.get("/display", (req, res) => {
    const keyword = req.query.keyword || ""; // Grab the keyword from the query parameter or default to an empty string
    const filePath = path.resolve(__dirname, 'jokes.json'); // Adjust path to your jokes file
    const fileData = fs.readFileSync(filePath, 'utf8'); // Read the file synchronously
    const jokes = JSON.parse(fileData); // Parse the jokes into an array

    // Filter jokes based on the keyword
    const filteredJokes = jokes.filter(joke => joke.toLowerCase().includes(keyword.toLowerCase()));

    // Render the display page with the filtered jokes and the keyword
    res.render("display", { jokes: filteredJokes, keyword: keyword });
});

app.post("/favorites", async (request, response) => {
    const favoriteJoke = request.body.favoriteJoke;
    
    try {
        // Connect to MongoDB
        await client.connect();
        const collection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection);

        // Insert the favorite joke into the MongoDB collection
        await collection.insertOne({ joke: favoriteJoke });
        // Redirect the user back to the display page after adding the joke
        response.redirect("/display");
    } catch (e) {
        console.error("Error saving favorite joke:", e);
    } finally {
        await client.close();
    }
});

// View all favorite jokes
app.get("/favorites", async (request, response) => {
    try {
        await client.connect();
        const collection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection);
        
        // Fetch all favorite jokes from MongoDB
        const favoriteJokes = await collection.find().toArray();

        // Render the favorites page with the list of favorite jokes
        response.render("favorites", { jokes: favoriteJokes });
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.post("/clearFavorites", async (request, response) => {
    try {
        await client.connect();
        const collection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection);
        
        // Delete all favorite jokes
        await collection.deleteMany({});

        // Redirect back to the favorites page after clearing
        response.redirect("/favorites");
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});