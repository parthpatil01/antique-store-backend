const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const { compare } = require('bcryptjs');
const twilio = require('twilio');
//for users 
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const Razorpay = require('razorpay');



// Route for razorpay
router.post('/payment', async (req, res) => {

  const instance = new Razorpay({
    key_id: 'rzp_test_MAXrsoXKMVp7oy',
    key_secret: 'xtRyj8dP9oEl5cyBT3FOdyOe',
  });

  try {
      // Check if req.file is present (file upload)
      var options = {
        amount: req.body.amount,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
      };
      
      const order = await instance.orders.create(options);

      if (!order) return res.status(500).send("Some error occured");

      res.json(order);
      

  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Route for user registration
router.post('/register', async (req, res) => {

    try {
        // Check if req.file is present (file upload)
        const user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,

        });
        const savedUser = await user.save();
        res.json(savedUser);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Route for user authentication
router.post('/login', async (req, res) => {
    try {
        
        const { email, password } = req.body;
        console.log(email)
        // Find the user by email
        const user = await User.findOne({ email });

        // If user is not found
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordMatch = await compare(password, user.password);

        // If passwords don't match
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // If authentication is successful, send a success response
        res.status(200).json({ message: "Login successful" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});




//for otp verification 

const otpStorage = {};

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'edutools123@gmail.com', // Replace with your email
        pass: 'tnle fwde xwvt xybd', // Replace with your password
    },
});

// Route to send OTP to the user's email
router.post('/send-otp', (req, res) => {
    const { email } = req.body;

    // Generate OTP
    const otp = randomstring.generate({
        length: 6,
        charset: 'numeric',
    });

    // Store OTP temporarily
    otpStorage[email] = otp;

    // Email configuration
    const mailOptions = {
        from: 'edutools123@gmail.com', // Replace with your email
        to: email,
        subject: 'Verification Code',
        text: `Your verification code is: ${otp}`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to send OTP' });
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).json({ message: 'OTP sent successfully' });
        }
    });
});

// Route to verify OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    // Retrieve stored OTP
    const storedOTP = otpStorage[email];

    // Compare OTPs
    if (storedOTP === otp) {
        // OTP is valid, proceed with registration
        res.status(200).json({ message: 'OTP verified successfully' });
        console.log("email verified sucessfully");
    } else {
        // Invalid OTP
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

//Reset password

function generateResetToken() {
    return randomstring.generate({ length: 20, charset: 'alphanumeric' });
}

router.post('/reset-password', async (req, res) => {
    const email = req.body.email;
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = generateResetToken();
        user.resetToken = resetToken;
        const databaseResponse = await user.save();

        const mailOptions = {
            from: 'edutools123@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `To reset your password, please click on the following link: http://localhost:3000/reset-password?token=${resetToken}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send password reset email' });
            }
            console.log('Password reset email sent:', info.response);
            res.json({ message: 'Password reset email sent successfully' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/reset-password/confirm', async (req, res) => {
    const { token, newPassword } = req.body;
    console.log(token);
    try {
        const user = await User.findOne({ resetToken: token });
        if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update user's password with the new password
        user.password = newPassword;
        user.resetToken = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//phone number verify mobile otp functionality 

const accountSid = 'AC486ae1bddad90cbee7b8562fcd1eb5f9';
const authToken = '72cfab46f7ddf8fd400672e3f672dcd7';
const twilioClient = new twilio.Twilio(accountSid, authToken); 

// Route to send OTP to the user's phone number
router.post('/mobilesend-otp', async (req, res) => {
    try {
      const { email,phoneNumber } = req.body;
  
      // Generate a random OTP

      const otp = randomstring.generate({
        length: 6,
        charset: 'numeric',
    });

    const user = await User.findOne({ email });

    user.phoneOtp = otp;
    await user.save();
  
  
      // Send OTP via Twilio SMS
    await twilioClient.messages.create({
        body: `Your OTP is: ${otp}`,
        from: '+13235537034',
        to: phoneNumber
    });
  
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  });
  
  // Route to verify OTP
  router.post('/mobileverify-otp', async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      const user = await User.findOne({ phoneNumber });  
      
      if(user.status===200){
      // Verify OTP entered by the user

        if (otp === user.phoneOtp) { 
            user.phoneOtp = undefined;
            
            res.status(200).json({ message: 'OTP verified successfully' });
          } else {
            res.status(400).json({ error: 'Invalid OTP' });
          }
      }else{
        res.status(400).json({ error: 'Phone number Doesn\'t exist' });

      }
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });

  //get user info
  router.get('/', async (req, res) => {
    try {
      
        const user = await User.findOne({ email:'lilasa9841@minhlun.com' });
        if (!user) {
          return res.status(404).json({ message: 'Product not found' });
        }
       
       
      res.json(user);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  //update user info
  router.post('/update-user', async (req, res) => {
    const updatedUserInfo = req.body; // Assuming the entire user object is sent in the request body
    console.log(updatedUserInfo)
    try {
      // Update user information in the database
      const updatedUser = await User.findOneAndUpdate({ email: 'lilasa9841@minhlun.com' }, updatedUserInfo, { new: true });
      if (!updatedUser) {
        return res.status(404).send('User not found');
      }
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user information:', error);
      res.status(500).send('Error updating user information');
    }
  });

  // get products
  router.get('/carts', async (req, res) => {
    const userEmail = req.query.email;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email: userEmail });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Extract cart data from the user document
      const cartItems = user.cart;
  
      // Return the cart data as response
      res.json(cartItems);
    } catch (error) {
      console.error('Error fetching user cart:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // delete product from cart
  router.delete('/carts/:productName', async (req, res) => {
    try {
      const { email } = req.query; // Get user's email from the query string
      const { productName } = req.params; // Get product name from the route parameter
      
      // Find the user by email
      const user = await User.findOne({ email });
  
      // If user not found
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Filter out the product with the given name from the user's cart
      user.cart = user.cart.filter(item => item.name !== productName);
  
      // Save the updated user
      await user.save();
  
      res.json({ message: 'Product removed successfully' });
    } catch (error) {
      console.error('Error removing product:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  //add to cart
  router.post('/add-item', async (req, res) => {

    const products= [{
        "name": "Shoes",
        "productsrno": 12345,
        "description": "Comfortable running shoes",
        "category": "Footwear",
        "price": 99.99,
        "quantity": 10
      },
      {
        "name": "T-shirt",
        "productsrno": 67890,
        "description": "Cotton t-shirt",
        "category": "Clothing",
        "price": 19.99,
        "quantity": 20
      },
      {
        "name": "Hat",
        "productsrno": 54321,
        "description": "Stylish hat",
        "category": "Accessories",
        "price": 29.99,
        "quantity": 5
      }];

    const user = await User.findOne({email:'lilasa9841@minhlun.com'});
    user.cart.push(...products);
    const upadteduser = await user.save();

        
    res.status(200).json({ message: "update successful", user:upadteduser});

  });


module.exports = router;