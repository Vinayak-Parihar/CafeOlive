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

// 5. एकाच वेळी अनेक मेनू आयटम्स जोडण्यासाठी (Bulk / Multiple Menu Items Add)
export const bulkAddMenuItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "An array of items is required" });
    }

    const validItems = [];
    for (const item of items) {
      if (!item.name || item.price === undefined || item.price === '' || !item.categoryId) {
        continue;
      }
      validItems.push({
        name: item.name.trim(),
        description: item.description ? item.description.trim() : "",
        price: Number(item.price),
        category: item.categoryId,
        image: item.image || "",
        isAvailable: item.isAvailable !== false
      });
    }

    if (validItems.length === 0) {
      return res.status(400).json({ message: "No valid menu items to create. Please provide name, price, and category." });
    }

    const created = await Menu.insertMany(validItems);
    const populated = await Menu.find({ _id: { $in: created.map(c => c._id) } }).populate("category", "name");

    return res.status(201).json({
      success: true,
      data: populated,
      count: populated.length,
      message: `${populated.length} menu items added successfully`
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 6. ऍडमिनसाठी संपूर्ण मेनू (उपलब्ध + अनुपलब्ध दोन्ही) (Get All Menu Items for Admin)
export const getAllMenuItemsAdmin = async (req, res) => {
  try {
    const menuItems = await Menu.find({}).populate("category", "name").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: menuItems,
      message: "Menu items fetched successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 7. मेनू आयटम अपडेट करण्यासाठी (Update Menu Item)
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, isAvailable } = req.body;

    const menuItem = await Menu.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (name !== undefined) menuItem.name = name.trim();
    if (description !== undefined) menuItem.description = description.trim();
    if (price !== undefined) menuItem.price = Number(price);
    if (categoryId) menuItem.category = categoryId;
    if (isAvailable !== undefined) menuItem.isAvailable = Boolean(isAvailable);

    const imageLocalPath = req.file?.path;
    if (imageLocalPath) {
      const uploadedImage = await uploadFilesOnCloudinary(imageLocalPath);
      if (uploadedImage?.url) {
        menuItem.image = uploadedImage.url;
      }
    }

    await menuItem.save();
    const updated = await Menu.findById(id).populate("category", "name");

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Menu item updated successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 8. मेनू आयटम डिलीट करण्यासाठी (Delete Menu Item)
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Menu.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    return res.status(200).json({
      success: true,
      data: deleted,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 9. कॅटेगरी डिलीट करण्यासाठी (Delete Category)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Also update or remove references
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};