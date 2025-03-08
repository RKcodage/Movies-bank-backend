const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "rkabra.dev@gmail.com",
//     pass: "xmgk deuv ssgl vqnj",
//   },
// });

// exports.forgetPassword = async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) {
//     return res.status(404).send("Aucun utilisateur trouvé avec cet email.");
//   }

//   const resetToken = crypto.randomBytes(20).toString("hex");
//   user.resetPasswordToken = resetToken;
//   user.resetPasswordExpires = Date.now() + 3600000; // 1 heure

//   await user.save();

//   const resetUrl = `http://${req.headers.host}/reset-password/${resetToken}`;
//   const mailOptions = {
//     to: user.email,
//     from: "rkabra.dev@gmail.com",
//     subject: "Réinitialisation du mot de passe",
//     text: `Veuillez cliquer sur le lien suivant ou collez-le dans votre navigateur pour compléter le processus dans l'heure suivante:\n\n${resetUrl}`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       return res.status(500).send("Erreur lors de l'envoi de l'email");
//     }
//     res.send(
//       "Un email de réinitialisation de mot de passe a été envoyé à " +
//         user.email +
//         "."
//     );
//   });
// };

// exports.resetPassword = async (req, res) => {
//   const { token } = req.params;
//   const { password } = req.body;
//   const user = await User.findOne({
//     resetPasswordToken: token,
//     resetPasswordExpires: { $gt: Date.now() },
//   });

//   if (!user) {
//     return res
//       .status(400)
//       .send("Token de réinitialisation invalide ou expiré.");
//   }

//   const hashedPassword = await bcrypt.hash(password, 12);
//   user.password = hashedPassword;
//   user.resetPasswordToken = undefined;
//   user.resetPasswordExpires = undefined;
//   await user.save();

//   res.send("Mot de passe mis à jour avec succès.");
// };

// const crypto = require("crypto");
// const nodemailer = require("nodemailer");
// const User = require("../models/User");

// Configuration de Nodemailer (à adapter avec tes infos SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rkabra.dev@gmail.com",
    pass: "xmgkdeuvssglvqnj",
  },
});

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Générer un token unique et une date d'expiration
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = Date.now() + 3600000; // 1 heure de validité

    // Stocker le token dans la base de données
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Envoyer l'e-mail avec le lien de réinitialisation
    const resetLink = `http://localhost:3001/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: "rkabra.dev@gmail.com",
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: `<p>Bonjour,</p>
            <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien ci-dessous :</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Ce lien est valide pendant 1 heure.</p>`,
    });

    res.json({ message: "Un email de réinitialisation a été envoyé." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Vérifier si le token est valide
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Vérifie si le token n'est pas expiré
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    // Hacher le nouveau mot de passe
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Mettre à jour le mot de passe et supprimer le token
    user.hash = hashedPassword;
    user.salt = salt; // Mise à jour du salt aussi
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
