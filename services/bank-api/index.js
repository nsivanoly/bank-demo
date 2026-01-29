import fs from "fs";
import https from "https";
import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import bodyParser from "body-parser";

dotenv.config();

import bankRouter from "./src/Routes/accounts.js";
import helloRouter from "./src/hello.js";

const app = express();
const PORT_HTTP = 2001;
const PORT_HTTPS = 3443;
const BASE_URL = `http://localhost:${PORT_HTTP}`;
const PROD_URL = `https://localhost:${PORT_HTTPS}`;

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bank API",
      version: "1.0.0",
      description: "A simple Express Bank API",
      termsOfService: "http://wso2.com/terms/",
      contact: {
        name: "API Support",
        url: "http://www.wso2.com/support",
        email: "support@wso2.com",
      },
    },
    servers: [
      { url: BASE_URL, description: "Local HTTP" },
      { url: PROD_URL, description: "Production HTTPS" },
    ],
  },
  apis: ["src/**/*.js"],
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs, { customCssUrl: CSS_URL }));
app.get("/swagger.json", (req, res) => {
  res.type("application/json").send(swaggerSpecs);
});

// Routes
app.use("/", helloRouter);
app.use("/accounts", bankRouter);

// Start HTTP server
http.createServer(app).listen(PORT_HTTP, () => {
  console.log(`→ HTTP Server running on ${BASE_URL}`);
});

// Start HTTPS server
const sslOptions = {
  key: fs.readFileSync("../../certs/localhost.key"),
  cert: fs.readFileSync("../../certs/localhost.crt"),
};

https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
  console.log(`→ HTTPS Server running on ${PROD_URL}`);
});
