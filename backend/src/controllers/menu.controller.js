import { Category } from "../models/category.model.js";
import { Menu } from "../models/menu.model.js";
import { uploadFilesOnCloudinary } from "../utils/cloudnarry.js";

// 1. नवीन कॅटेगरी बनवण्यासाठी (Create Category)
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await Category.create({ name });

    return res.status(201).json({
      success: true,
      data: category,
      message: "Category created successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 2. नवीन मेनू आयटम बनवण्यासाठी (Add Menu Item)
export const addMenuItem = async (req, res) => {
  try {
    const { name, description, price, categoryId } = req.body;

    // बेसिक व्हॅलिडेशन
    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const imageLocalPath = req.file?.path;
    let imageUrl = "";

    if (imageLocalPath) {
      const uploadedImage = await uploadFilesOnCloudinary(imageLocalPath);
      if (uploadedImage) {
        imageUrl = uploadedImage.url;
      }
    }

    const menuItem = await Menu.create({
      name,
      description,
      price,
      image: imageUrl,
      category: categoryId
    });

    return res.status(201).json({
      success: true,
      data: menuItem,
      message: "Menu item added successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 3. संपूर्ण मेनू मिळवण्यासाठी (Get All Menu for Website)
export const getFullMenu = async (req, res) => {
  try {
    // इथे आपण Category सोबत Menu जॉईन (Populate) करू
    const menuItems = await Menu.find({ isAvailable: true }).populate("category", "name");

    return res.status(200).json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 4. सर्व कॅटेगरी मिळवण्यासाठी (Get All Categories)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    return res.status(200).json({
      success: true,
      data: categories,
      message: "Categories fetched successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};