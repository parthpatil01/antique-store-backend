

const Product = require("../models/Product");
const User = require("../models/User");


const addToWishlist = async (req, res) => {

    const { email, productId } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if product already exists in wishlist
        const existingProduct = user.wishlist.some((id) => id.equals(product._id));

        if (existingProduct) {
            // Remove product from wishlist
            user.wishlist.pull(product._id);
            await user.save();
            return res.status(200).json({ message: "Product removed from wishlist" });
        } else {
            // Add product to wishlist
            user.wishlist = [...user.wishlist, product._id];
            await user.save();
            return res.status(201).json({ message: "Product added to wishlist" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }

}


const addToCart = async (req, res) => {

    const { email, productId, location } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if product already exists in wishlist
        const existingProduct = user.cart.some((id) => id.equals(product._id));

        if (existingProduct) {
            if (location === 'wishlist') {
                return res.status(200).json({ message: "Duplicate entry" });
            }
            // Remove product from wishlist
            user.cart.pull(product._id);
            await user.save();
            return res.status(200).json({ message: "Product removed from Cart" });
        } else {
            // Add product to wishlist
            user.cart = [...user.cart, product._id];
            await user.save();
            return res.status(201).json({ message: "Product added to Cart" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }

}


const getWishlist = async (req, res) => {

    const { email } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Extract wishlist IDs from user object (assuming 'wishlist' is an array)
        const wishlistIds = user.wishlist || [];

        // If wishlist is empty, return an empty response (optional)
        if (!wishlistIds.length) {
            return res.json({ wishlist: [] });
        }

        // Efficiently fetch products using a lookup by ID
        const products = await Product.find({ _id: { $in: wishlistIds } });



        return res.json({ products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


const getCartItems = async (req,res) => {

    const { email } = req.body;

    try{

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Extract wishlist IDs from user object (assuming 'wishlist' is an array)
        const cartIds = user.cart || [];

        // If wishlist is empty, return an empty response (optional)
        if (!cartIds.length) {
            return res.json({ cartIds: [] });
        }

        // Efficiently fetch products using a lookup by ID
        const cart = await Product.find({ _id: { $in: cartIds } });


        return res.json({ cart });


    }catch(error){
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


module.exports = { addToWishlist, addToCart, getWishlist, getCartItems }