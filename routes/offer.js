const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

cloudinary.config({
  cloud_name: "dtheb57yk",
  api_key: "328646239676348",
  api_secret: "v9P6KfdfGPs7tPfq3-K06UhCFAM",
});

const app = express();
app.use(fileUpload());

// =====PUBLISH=====
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
      });
      //console.log(req.user);
      const picture = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture),
        { folder: `/Vinted/offers/${newOffer._id}` } //
      );

      (newOffer.product_image = picture), await newOffer.save();
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// =====FILTRES=====

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;
    //console.log(req.query.priceMin);
    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = {
        $gte: priceMin,
      };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }
    }
    const sortFilter = {};

    if (sort === "price-desc") {
      sortFilter.product_price = -1;
    } else if (sort === "price-asc") {
      sortFilter.product_price = 1;
    }

    const limit = 5;

    let pageRequired = 1;
    if (page) {
      pageRequired = page;
    }
    const skip = (pageRequired - 1) * limit;

    const search = (await Offer.find(filters))
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      .populate("owner", "account");

    res.status(200).json(search);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offerById = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.status(200).json({
      product_details: offerById.product_details,
      product_image: offerById.product_image,
      _id: offerById._id,
      product_name: offerById.product_name,
      product_description: offerById.product_description,
      product_price: offerById.product_price,
      owner: offerById.owner,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
