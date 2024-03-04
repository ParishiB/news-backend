import { generateRandomNum, imageValidator } from "../utils/helper.js";

class ProfileController {
  static async index(req, res) {
    try {
      const user = req.user;
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  static async store() {}
  static async show() {}

  static async update(req, res) {
    try {
      const { id } = req.params;
      // const authUser = req.user;

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "Profile image is required" });
      }
      const profile = req.files.profile;
      const message = imageValidator(profile?.size, profile, mimetype);
      if (message === null)
        return res.status(400).json({
          errors: {
            profile: message,
          },
        });

      const imgExt = profile?.name.split(".");
      const imageName = generateRandomNum() + "." + imgExt[1];
      const uploadPath = process.cwd() + "/public/images/" + imageName;

      profile.mv(uploadPath, (err) => {
        if (err) throw err;
      });

      await prisma.users.update({
        data: {
          profile: imageName,
        },
        where: {
          id: Number(id),
        },
      });

      return res.json({
        status: 200,
        message: "Profile updated successfully",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Something went wrong.Please try again" });
    }
  }

  static async delete() {}
}

export default ProfileController;
