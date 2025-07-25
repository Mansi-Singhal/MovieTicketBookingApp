import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

// api controller function to get user bookingd
export const getUserBookings = async (req, res) => {
    try {
        const user = req.auth().userId;
        const bookings = await Booking.find({user}).populate({path: "show",
            populate: {path: "movie"}
        }).sort({created: -1})
        res.json({success: true, bookings})
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// api controller function to add favorite movie in clerk user metadata
export const addFavorite = async (req, res) => {
    try {
        const {movieId} = req.body;
        const userId = req.auth().userId;
        const user = await clerkClient.users.getUser(userId);
        
        if(!user.privateMetadata.favorites){
            user.privateMetadata.favorites = [];
        }
        if(!user.privateMetadata.favorites.includes(movieId)){
            user.privateMetadata.favorites.push(movieId)
        }
        await clerkClient.users.updateUserMetadata(userId, {privateMetadata: user.privateMetadata})

        res.json({success: true, message: "Favourite added successfully!"})
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// api controller function to update favourite movie in clerk user metadata
export const updateFavorite = async (req, res) => {
    try {
        const {movieId} = req.body;
        const userId = req.auth().userId;
        const user = await clerkClient.users.getUser(userId);
        
        if(!user.privateMetadata.favorites){
            user.privateMetadata.favorites = [];
        }
        if(!user.privateMetadata.favorites.includes(movieId)){
            user.privateMetadata.favorites.push(movieId)
        }else{
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item!==movieId)
        }
        await clerkClient.users.updateUserMetadata(userId, {privateMetadata: user.privateMetadata})

        res.json({success: true, message: "Favorite movies updated!"})
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

export const getFavorites = async (req, res) => {
    try {
        const user = await clerkClient.users.getUser(req.auth().userId);
        const favorites = user.privateMetadata.favorites;

        // getting movies form db
        const movies = await Movie.find({_id: {$in: favorites}})

        res.json({success: true, movies});
        
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}