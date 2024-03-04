import { newsSchema } from "../validations/newsValidation.js";
import vine, { errors } from "@vinejs/vine";
import prisma from "../DB/db.config.js";
import {
  generateRandomNum,
  imageValidator,
  removeImage,
} from "../utils/helper.js";
import NewsApiTransform from "../tranform/newsApiTransform.js";
import path from "path";

// npx prisma migrate dev --name initialize-database

class NewsController {
  static async index(req, res) {
    // why pagination in backend
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 1;

    if (page <= 0) {
      page = 1;
    }
    if (limit <= 0 || limit > 100) {
      limit = 10;
    }

    const skip = (page - 1) * limit;

    // what does user means?
    const news = await prisma.news.findMany({
      take: limit,
      skip: skip,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
      },
    });
    const newsTransform = news?.map((item) => NewsApiTransform.transform(item));
    const totalNews = await prisma.news.count();
    const totalPages = Math.ceil(totalNews / limit);
    return res.json({
      status: 200,
      news: newsTransform,
      metadata: {
        totalPages,
        currentPage: page,
        currentLimit: limit,
      },
    });
  }

  // static async store(req, res) {
  //   try {
  //     const user = req.user;
  //     const body = req.body;
  //     const validator = vine.compile(newsSchema);
  //     const payload = await validator.validate(body);

  //     if (!req.files || Object.keys(req.files).length === 0) {
  //       return res.json({ message: "Image is required!!" });
  //     }

  //     const image = req.files?.image;
  //     const message = imageValidator(image?.size, image?.mimetype);
  //     if (message != null)
  //       return res.status(400).json({
  //         errors: {
  //           image: message,
  //         },
  //       });

  //     // image upload
  //     const imgExt = image?.name.split(".");
  //     const imageName = generateRandomNum() + "." + imgExt[1];
  //     const uploadPath = process.cwd() + "/public/images/" + imageName;

  //     image.mv(uploadPath, async (err) => {
  //       if (err) {
  //         console.error("Error uploading image:", err);
  //         return res.status(500).json({ message: "Error uploading image" });
  //       }

  //       // Continue with the rest of your code...

  //       const news = await prisma.news.create({
  //         data: payload,
  //       });

  //       return res
  //         .status(200)
  //         .json({ message: "News created successfully", news });
  //     });

  //     payload.image = imageName;
  //     payload.user_id = user.id;

  //     const news = await prisma.news.create({
  //       data: payload,
  //     });

  //     return res
  //       .status(200)
  //       .json({ message: "News created successfully", news });
  //   } catch (error) {
  //     console.log("The error is", error);
  //     if (error instanceof errors.E_VALIDATION_ERROR) {
  //       return res.status(400).json({ errors: error.messages });
  //     } else {
  //       return res.status(500).json({
  //         status: 500,
  //         message: "Something went wrong.Please try again.",
  //       });
  //     }
  //   }
  // }

  static async store(req, res) {
    try {
      const user = req.user;
      const body = req.body;
      const validator = vine.compile(newsSchema);
      const payload = await validator.validate(body);

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.json({ message: "Image is required!!" });
      }

      const image = req.files.image;
      const message = imageValidator(image.size, image.mimetype);
      if (message != null)
        return res.status(400).json({
          errors: {
            image: message,
          },
        });

      // image upload
      const imgExt = image.name.split(".");
      const imageName = generateRandomNum() + "." + imgExt[1];
      const uploadPath = path.join(process.cwd(), "/public/images/", imageName);

      image.mv(uploadPath, async (err) => {
        if (err) {
          console.error("Error uploading image:", err);
          return res.status(500).json({ message: "Error uploading image" });
        }

        payload.image = imageName;
        payload.user_id = user.id;

        try {
          const news = await prisma.news.create({
            data: payload,
          });

          return res
            .status(200)
            .json({ message: "News created successfully", news });
        } catch (error) {
          console.log("The error is", error);
          return res.status(500).json({
            status: 500,
            message: "Something went wrong.Please try again.",
          });
        }
      });
    } catch (error) {
      console.log("The error is", error);
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({ errors: error.messages });
      } else {
        return res.status(500).json({
          status: 500,
          message: "Something went wrong.Please try again.",
        });
      }
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const news = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: true,
            },
          },
        },
      });

      const transformNews = news ? NewsApiTransform.transform(news) : null;
      return res.json({ status: 200, news: transformNews });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const user = req.user;
    const body = req.body;

    const news = await prisma.news.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (user.id !== news.user_id) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const validator = vine.compile(newsSchema);
    const payload = await validator.validate(body);

    const image = req?.files?.image;
    const message = imageValidator(image?.size, image?.mimetype);
    if (message !== null) {
      res.status(400).json({
        errors: {
          image: message,
        },
      });
    }
    // upload a new image

    // delte old image
    removeImage(news.image);
  }

  static async destroy(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const news = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (user.id !== news?.user_id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // delete image from file syayem
      removeImage(news.image);
      await prisma.news.delete({
        where: {
          id: Number(id),
        },
      });

      return res.json({ message: "News deleted successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default NewsController;
