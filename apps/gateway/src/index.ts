import dotenv from "dotenv";
import { createGatewayApp } from "./app.js";

dotenv.config();

const app = createGatewayApp();
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Orderly API Gateway running at http://localhost:${PORT}`);
});
