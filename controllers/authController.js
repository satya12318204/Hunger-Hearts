import express from 'express';
import bcrypt from 'bcrypt';
import axios from 'axios';
import 'dotenv/config';
import { User } from '../models/user.js';
import { Donor } from '../models/donor.js';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

export const loginUser = async (req, res) => {
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {

            console.log('User does not exist');
            return res.status(400).json({ message: 'User does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        console.log('Login successful');
        res.status(200).json({ message: 'Login successful', user });
    }catch(err){
        console.log(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

//doent have login page in ejs
export const loginDonor = async (req, res) => {
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const donor = await Donor.findOne({ email });
        if (!donor) {
            return res.status(400).json({ message: 'Donor does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, donor.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.status(200).json({ message: 'Login successful', donor });
    }catch(err){
        console.log(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

const url = process.env.URL;
export const signupUser = async (req,res) => {
    try {
        const userData = {
            username: req.body.username,
            mobileNumber: req.body.mobileNumber,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address,
        };

        const response = await axios.post(`${url}/user/addUser`, userData);

        if (response.status === 201) {
            res.status(201).json({ message: 'User created successfully', user: response.data.user });
        } else {
            res.status(response.status).json({ message: response.data.message });
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const signupDonor = async (req,res) => {
    try {
        const donorData = {
            username: req.body.username,
            mobileNumber: req.body.mobileNumber,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address,
        };

        const response = await axios.post(`${url}/donor/addDonor`, donorData);

        if (response.status === 201) {
            res.status(201).json({ message: 'donor created successfully', donor: response.data.donor });
        } else {
            res.status(response.status).json({ message: response.data.message });
        }
    } catch (error) {
        console.error('Error creating donor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
