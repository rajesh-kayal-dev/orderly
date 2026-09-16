import dotenv from "dotenv"
import express from "express";
import {formatCurrency} from "@orderly/utils";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.get("/", (req,res)=>{
    const str = formatCurrency(25.99)
    return res.json({
        formatCurrency: str
    })
})

app.listen(PORT, ()=>{
    console.log(`Server started ad PORT ${PORT}`)
})