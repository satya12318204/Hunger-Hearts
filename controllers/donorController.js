import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { Donor } from '../models/donor.js';
const app = express();



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

export const addDonor = async (req, res) => {
    try {
        const { username, mobileNumber, email, password, address } = req.body;
        
        if (!username || !mobileNumber || !email || !password || !address) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newDonor = new Donor({
            username,
            mobileNumber,
            email,
            password,
            address
        });

        try{
            await newDonor.save();
            console.log('Donor added successfully');
        }catch(err){
            console.log(err.message);
            return res.status(400).json({ message: 'Donor already exists (or) Adding Donor was Unsucessful' });
        }


        res.status(201).json({ message: 'Donor created successfully', donor: newDonor });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getDonorHomePage = async (req, res) => {
    try {

        const token = req.cookies.donor_jwt;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const decodedToken = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });

        const username = decodedToken.username;

        const donor = await Donor.findOne({ username });

        if (!donor) {
            return res.status(404).json({ success: false, message: 'Donor not found' });
        }

        res.render('donor_homepage' , { donor });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};