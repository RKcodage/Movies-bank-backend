const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const {
  forgetPassword,
  resetPassword,
} = require("../controllers/forgetPassword");

//import de mes packages pour mdp de token
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// USER ROUTES

router.post("/user/signup", async (req, res) => {
  // console.log("✅ Requête reçue :", req.body);

  try {
    const { username, email, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is missing" });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(409).json({ error: "Email already used" });
    }

    // 🔥 Générer le hash avec bcrypt
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const token = uid2(64); // Générer un token unique

    const newUser = new User({
      email: email,
      account: { username: username },
      token: token,
      hash: hashedPassword, // Stocke le mot de passe haché avec bcrypt
      salt: salt, // Stocke le salt (optionnel, car bcrypt l'intègre déjà dans le hash)
    });

    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch user by id
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "email account.username"
    ); // Sélectionner uniquement le username
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🔥 Vérification avec bcrypt
    const isPasswordValid = bcrypt.compareSync(req.body.password, user.hash);
    if (isPasswordValid) {
      res.json({
        _id: user._id,
        token: user.token,
        account: user.account,
      });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Add movie to favorites
router.post("/api/users/:id/favorites", async (req, res) => {
  const userId = req.params.id;
  const movieId = req.body.movieId; // ID du film TMDB

  try {
    const user = await User.findById(userId);

    // Vérifie si le film est déjà dans les favoris
    const isAlreadyFavorite = user.favorites.some(
      (id) => id.toString() === movieId.toString()
    );

    if (isAlreadyFavorite) {
      return res.send({ message: "Movie is already in the favorites list" });
    } else if (!isAlreadyFavorite) {
      user.favorites.push(movieId);
    }
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Add movie to wishlist
router.post("/api/users/:id/wishlist", async (req, res) => {
  const userId = req.params.id;
  const movieId = req.body.movieId; // ID du film TMDB

  try {
    const user = await User.findById(userId);

    // Vérifie si le film est déjà dans les favoris
    const isAlreadyInWishlist = user.wishlist.some(
      (id) => id.toString() === movieId.toString()
    );

    if (isAlreadyInWishlist) {
      return res.send({ message: "Movie is already in the favorites list" });
    } else if (!isAlreadyInWishlist) {
      user.wishlist.push(movieId);
    }
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete movie from wishlist
router.delete("/api/users/:id/wishlist", async (req, res) => {
  const userId = req.params.id;
  const movieId = req.body.movieId; // ID du film à supprimer

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Filtrez le tableau `favorites` pour supprimer le film
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== movieId.toString()
    );

    await user.save(); // Sauvegarde les modifications dans la base de données
    res.status(200).send(user); // Retourne l'utilisateur mis à jour
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete movie from favorites
router.delete("/api/users/:id/favorites", async (req, res) => {
  const userId = req.params.id;
  const movieId = req.body.movieId; // ID du film à supprimer

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Filtrez le tableau `favorites` pour supprimer le film
    user.favorites = user.favorites.filter(
      (id) => id.toString() !== movieId.toString()
    );

    await user.save(); // Sauvegarde les modifications dans la base de données
    res.status(200).send(user); // Retourne l'utilisateur mis à jour
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get user favorites
router.get("/api/users/:id/favorites", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("Utilisateur introuvable");
    }

    const favorites = user.favorites; // Récupérez les favoris de l'utilisateur
    res.status(200).send(favorites); // Renvoyez les favoris
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get user wishlist
router.get("/api/users/:id/wishlist", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("Utilisateur introuvable");
    }

    const wishlist = user.wishlist; // Récupérez les favoris de l'utilisateur
    res.status(200).send(wishlist); // Renvoyez les favoris
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put("/user/:id", async (req, res) => {
  try {
    console.log("Données reçues :", req.body);
    const userId = req.params.id;
    const { email, account } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        email: email,
        "account.username": account.username, // Met à jour le champ imbriqué
      },
      { new: true } // Renvoie l'utilisateur mis à jour
    ).select("-hash -salt -token -resetPasswordToken -resetPasswordExpires");

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log("Utilisateur mis à jour :", updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Forget Password routes
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
