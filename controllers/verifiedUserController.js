

const Product = require("../models/Product");
const User = require("../models/User");
const Razorpay = require('razorpay');


const addToWishlist = async (req, res) => {

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
        const existingProduct = user.wishlist.some((id) => id.equals(product._id));

        if (existingProduct) {
            if (location === 'cart') {
                return res.json({ message: "Duplicate entry" });
            }
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
                return res.json({ message: "Duplicate entry" });
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


const getCartItems = async (req, res) => {

    const { email } = req.body;

    try {

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


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


const getOrderItems = async (req, res) => {
    const { email } = req.body;

    try {

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Extract wishlist IDs from user object (assuming 'wishlist' is an array)
        const orders = user.orders || [];
        const orderIds = orders.flatMap((order) => order.product) || [];


        // If wishlist is empty, return an empty response (optional)
        if (!orderIds.length) {
            return res.json({ orderIds: [] });
        }

        const products = await Product.find({ _id: { $in: orderIds } });

        // Create a map of product details for easy lookup
        const productMap = new Map(products.map(product => [product._id.toString(), product]));



        // Combine order data with product details
        const combinedOrders = orders.map(order => {

            const orderData = JSON.parse(JSON.stringify(order));

            return {
                ...orderData,
                product: order.product.map(productId => productMap.get(productId.toString()))
            };
        });

        console.log(combinedOrders)


        return res.status(200).json({ orders: combinedOrders });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Route for razorpay
const payment = async (req, res) => {

    const instance = new Razorpay({
        key_id: 'rzp_test_jTGHHwbOxemsB3',
        key_secret: 'Xta2mFm0gZ5tFjQsgC1CSRxM',
    });

    try {

        var options = {
            amount: req.body.amount,
            currency: "INR",
            receipt: 'order_rcptid_' + crypto.randomBytes(4).toString('hex')
        };

        const order = await instance.orders.create(options);

        if (!order) return res.status(500).send("Some error occured");

        res.json(order);


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const crypto = require("crypto");

// Verify payment signature
const verifyPayment = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, email, userInfoBilling } = req.body;

    const key_secret = "Xta2mFm0gZ5tFjQsgC1CSRxM"; // Your Razorpay secret key

    // Generate expected signature using order_id and payment_id
    const generated_signature = crypto.createHmac('sha256', key_secret)
        .update(razorpayOrderId + "|" + razorpayPaymentId)
        .digest('hex');


    // Compare generated signature with Razorpay's signature
    if (generated_signature === razorpaySignature) {
        // Signature matched, payment verified successfully

        try {
            // Find the user by email
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Prepare the cart items to be moved to orders with additional info
            const orderItems = {
                product: user.cart,
                receiptId: razorpayPaymentId,      // Add receipt ID
                orderId: razorpayOrderId,          // Add order ID
                invoice: {                               // Add invoice details
                    invoiceNumber: generateInvoiceNumber(),
                    paymentMethod: "RAZORPAY",
                    userInfoBilling: userInfoBilling
                },
                date: new Date()           // Optional: Order date
            };

            // Update the user by moving cart to orders and clearing cart
            await User.updateOne(
                { _id: user._id },
                {
                    $push: { orders: orderItems },  // Add to the orders array
                    $set: { cart: [] }     // Clear the cart array
                }
            );

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }

        res.status(200).send({ success: true, message: "Payment verified successfully" });

    } else {
        // Signature did not match, verification failed
        res.status(400).send({ success: false, message: "Payment verification failed" });
    }

}


function generateInvoiceNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomPart = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
    return `${datePart}${randomPart}`;
}


module.exports = { addToWishlist, addToCart, getWishlist, getCartItems, payment, verifyPayment, getOrderItems }