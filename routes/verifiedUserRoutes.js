let express = require("express")
const router = express.Router();
router.use(express.json());

let  {addToWishlist,addToCart,getWishlist,getCartItems } =require("../controllers/verifiedUserController")

// Importing JWT authentication middleware
let {jwtAuth} = require("../middleware/auth")

// Applying JWT authentication middleware to all routes in this router
router.use(jwtAuth)

// Defining routes for adding new media and deleting media by ID
router.post("/add-to-wishlist", addToWishlist)
router.post("/add-to-cart", addToCart)
router.post('/wishlist',getWishlist)
router.post('/cart',getCartItems)



module.exports = router;
