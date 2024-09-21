import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { User } from '../models/user.js';
import { Donor } from '../models/donor.js';
import { Request } from '../models/request.js';
const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

export const addRequest = async (req, res) => {
    try {
        const { donorUsername, userUsername, location, availableFood } = req.body;

        console.log(req.body);

        // Validate required fields
        if (!donorUsername || !userUsername || !availableFood) {
            return res.status(400).json({ message: 'Donor username, user username, and available food are required' });
        }

        // Check if the donor exists
        const donorExists = await Donor.exists({ username: donorUsername });
        if (!donorExists) {
            return res.status(400).json({ message: `Donor with username ${donorUsername} does not exist` });
        }

        // Check if the user exists
        const userExists = await User.exists({ username: userUsername });
        if (!userExists) {
            return res.status(400).json({ message: `User with username ${userUsername} does not exist` });
        }

        // Create a new request
        const newRequest = new Request({
            donorUsername,
            userUsername,
            location,
            availableFood
        });

        await newRequest.save();

        res.status(201).json({ message: 'Request created successfully', request: newRequest });

        
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};


export const getRequests = async (req, res) => {
    try {
        const token = req.cookies.user_jwt;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const decodedToken = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });

        const userUsername = decodedToken.username;
        const donorUsername = req.query.donor;

        // Find requests for the donor and sort by timestamp (ascending)
        const requests = await Request.find({ userUsername , donorUsername })
            .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
            .exec();

        res.json({ requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
}


export const acceptRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const updatedRequest = await Request.findByIdAndUpdate(
            requestId, 
            { isAccepted: true }, 
            { new: true }
        );
        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error accepting request', error });
    }
}


export const cancelRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const updatedRequest = await Request.findByIdAndUpdate(
            requestId,
            { isAccepted: false }, // Set isAccepted to false
            { new: true } // Return the updated document
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling request', error });
    }
};



export const getAcceptedRequests = async (req, res) => {
    try {
        const token = req.cookies.user_jwt;

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

        const acceptedRequests = await Request.find({ userUsername: username, isAccepted: true });


        res.json({ success: true, acceptedRequests });
    } catch (error) {
        console.error('Error fetching accepted requests:', error);  // Log the error in the console
        res.status(500).json({ message: 'Error fetching accepted requests', error });
    }
};
