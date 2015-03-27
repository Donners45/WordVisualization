Please install dependencies with >> npm install

To start this application please confirm your runtime environment in INDEX.JS - You can select LOCAL or LIVE instance of the back end by modifying these lines :

15: var backend_base_URL = 'http://wordnet-python-service.herokuapp.com';		// LIVE APPLICATION URL
16: //var backend_base_URL = 'http://localhost:5001';						// LOCAL APPLICATION URL

If you would like to run the application end to end locally you will need to uncomment line 16 and comment out line 15.


Start the application by navigating to the directory and run : node index.js 
The console will prompt when service is ready.

For details of use send a GET request to - http://[running-url]/resources/help

The live application uses port 80 - running locally consumes port 5000 please make sure this is free before attempting to start a local instance.

Unit tests can be run on the service through GET - /resources/servicestatus